import { SubscriptionRepository } from './subscription.repository';
import { User } from '../user/user.model';
import { ISubscription, plan_Type } from './subscription.model';
import Stripe from 'stripe';
import { stripeService } from '../payment/stripe.service';

export class SubscriptionService {
  private repository: SubscriptionRepository;

  constructor() {
    this.repository = new SubscriptionRepository();
  }

  // Plan configuration
  private getPlanConfig() {
    return {
      [process.env.STRIPE_PRICE_BASIC_MONTHLY!]: { name: 'Basic Monthly', type: 'basic' },
      [process.env.STRIPE_PRICE_PREMIUM_MONTHLY!]: { name: 'Premium Monthly', type: 'premium' },
      [process.env.STRIPE_PRICE_PREMIUM_ANNUAL!]: { name: 'Premium Annual', type: 'premium' },
    };
  }
  // Get available plans
  async getAvailablePlans() {
    const prices = await stripeService.listPrices();
    return prices.map((price) => {
      const product = price.product as Stripe.Product;
      const config = this.getPlanConfig()[price.id];
      if (config) {
        return {
          id: price.id,
          productId: product.id,
          name: config?.name || product.name,
          description: product.description,
          type: config?.type || 'basic',
          amount: price.unit_amount,
          currency: price.currency,
          interval: price.recurring?.interval,
          intervalCount: price.recurring?.interval_count,
          features: product.metadata?.features ? JSON.parse(product.metadata.features) : [],
        };
      }
    });
  }

  // Create subscription
  async createSubscription(
    userId: string,
    priceId: string,
    paymentMethodId: string,
    trialDays?: number
  ): Promise<{ subscription: ISubscription; clientSecret?: string }> {
    const user = await User.findById(userId);
    if (!user) throw new Error('User not found');

    const existing = await this.repository.findActiveByUserId(userId);
    if (existing) throw new Error('User already has an active subscription');

    let customerId = user.stripeCustomerId;
    if (!customerId) {
      const customer = await stripeService.createOrGetCustomer(
        user.email,
        user.name,
        userId
      );
      customerId = customer.id;
      await User.findByIdAndUpdate(userId, { stripeCustomerId: customerId });
    }

    await stripeService.attachPaymentMethod(paymentMethodId, customerId);

    const stripeSubscription = await stripeService.createSubscription(
      customerId,
      priceId,
      trialDays
    );
    // console.log('created',created)
    // // 2️⃣ Re-fetch subscription (authoritative state)
    // const stripeSubscription = await stripeService.getSubscription(
    //   created.id
    // );
    console.log('stripeSubscription', stripeSubscription.items.data[0] )

    const planConfig = this.getPlanConfig()[priceId];

   
    const price = stripeSubscription.items.data[0].price;
    const productId =
      typeof price.product === 'string'
        ? price.product
        : price.product.id;
    const subscription = await this.repository.create({
      userId: user._id,
      stripeSubscriptionId: stripeSubscription.id,
      stripeCustomerId: customerId,
      stripePriceId: priceId,
      stripeProductId: stripeSubscription.items.data[0].price.product.id as string  ,
      status: stripeSubscription.status as any,
      planName: planConfig.name,
      planType: planConfig.type as plan_Type ,
      billingInterval: stripeSubscription.items.data[0].price.recurring?.interval as 'month' | 'year',
      amount: stripeSubscription.items.data[0].price.unit_amount || 0,
      currency: stripeSubscription.currency,
      currentPeriodStart: new Date(stripeSubscription.items.data[0].current_period_start * 1000),
      currentPeriodEnd: new Date(stripeSubscription.items.data[0].current_period_end * 1000),
      cancelAtPeriodEnd: stripeSubscription.cancel_at_period_end,
      trialStart: stripeSubscription.trial_start ? new Date(stripeSubscription.trial_start * 1000) : undefined,
      trialEnd: stripeSubscription.trial_end ? new Date(stripeSubscription.trial_end * 1000) : undefined,
    });

    await this.repository.syncUserSubscription(userId, subscription);

    let clientSecret: string | undefined;
    const invoice = stripeSubscription.latest_invoice as Stripe.Invoice | null;
    if (invoice?.payment_intent) {
      clientSecret = (invoice.payment_intent as Stripe.PaymentIntent)
        .client_secret ?? undefined;
    }

    return { subscription, clientSecret };
  }

  // Get user subscription
  async getUserSubscription(userId: string): Promise<ISubscription | null> {
    return await this.repository.findActiveByUserId(userId);
  }

  // Get subscription by ID
  async getSubscriptionById(subscriptionId: string): Promise<ISubscription | null> {
    return await this.repository.findByStripeId(subscriptionId);
  }

  // Cancel subscription
  async cancelSubscription(userId: string, immediate: boolean = false): Promise<ISubscription> {
    const subscription = await this.repository.findActiveByUserId(userId);
    if (!subscription) {
      throw new Error('No active subscription found');
    }

    // Cancel in Stripe
    await stripeService.cancelSubscription(subscription.stripeSubscriptionId, !immediate);

    // Update in database
    const updated = await this.repository.markAsCanceled(subscription.stripeSubscriptionId, !immediate);
    if (!updated) {
      throw new Error('Failed to update subscription');
    }

    // Sync user data
    await this.repository.syncUserSubscription(userId, updated);

    return updated;
  }

  // Resume subscription
  async resumeSubscription(userId: string): Promise<ISubscription> {
    const subscription = await this.repository.findActiveByUserId(userId);
    if (!subscription) {
      throw new Error('No subscription found');
    }

    if (!subscription.cancelAtPeriodEnd) {
      throw new Error('Subscription is not scheduled for cancellation');
    }

    // Resume in Stripe
    await stripeService.resumeSubscription(subscription.stripeSubscriptionId);

    // Update in database
    const updated = await this.repository.update(subscription.stripeSubscriptionId, {
      cancelAtPeriodEnd: false,
      canceledAt: undefined,
    });

    if (!updated) {
      throw new Error('Failed to update subscription');
    }

    // Sync user data
    await this.repository.syncUserSubscription(userId, updated);

    return updated;
  }

  // Change subscription plan
  async changeSubscriptionPlan(userId: string, newPriceId: string): Promise<ISubscription> {
    const subscription = await this.repository.findActiveByUserId(userId);
    if (!subscription) {
      throw new Error('No active subscription found');
    }

    // Get plan config
    const planConfig = this.planConfig[newPriceId];
    if (!planConfig) {
      throw new Error('Invalid price ID');
    }

    // Update in Stripe
    const stripeSubscription = await stripeService.updateSubscription(
      subscription.stripeSubscriptionId,
      newPriceId,
      'always_invoice'
    );

    // Update in database
    const updated = await this.repository.update(subscription.stripeSubscriptionId, {
      stripePriceId: newPriceId,
      planName: planConfig.name,
      planType: planConfig.type,
      billingInterval: stripeSubscription.items.data[0].price.recurring?.interval as 'month' | 'year',
      amount: stripeSubscription.items.data[0].price.unit_amount || 0,
      currentPeriodEnd: new Date(stripeSubscription.current_period_end * 1000),
    });

    if (!updated) {
      throw new Error('Failed to update subscription');
    }

    // Sync user data
    await this.repository.syncUserSubscription(userId, updated);

    return updated;
  }

  // Get subscription history
  async getSubscriptionHistory(userId: string): Promise<ISubscription[]> {
    return await this.repository.findByUserId(userId);
  }

  // Get upcoming invoice
  //   async getUpcomingInvoice(userId: string): Promise<any> {
  //     const user = await User.findById(userId);
  //     if (!user || !user.stripeCustomerId) {
  //       throw new Error('Customer not found');
  //     }

  //     return await stripeService.getUpcomingInvoice(user.stripeCustomerId);
  //   }

  // Create customer portal session
  async createPortalSession(userId: string, returnUrl: string): Promise<string> {
    const user = await User.findById(userId);
    if (!user || !user.stripeCustomerId) {
      throw new Error('Customer not found');
    }

    const session = await stripeService.createPortalSession(user.stripeCustomerId, returnUrl);
    return session.url;
  }

  // Handle subscription webhook update
  async handleSubscriptionUpdated(stripeSubscription: Stripe.Subscription): Promise<void> {
    const subscription = await this.repository.findByStripeId(stripeSubscription.id);

    if (!subscription) {
      console.error('Subscription not found in database:', stripeSubscription.id);
      return;
    }

    const planConfig = this.planConfig[stripeSubscription.items.data[0].price.id];

    await this.repository.update(stripeSubscription.id, {
      status: stripeSubscription.status as any,
      stripePriceId: stripeSubscription.items.data[0].price.id,
      planName: planConfig?.name || subscription.planName,
      planType: planConfig?.type || subscription.planType,
      amount: stripeSubscription.items.data[0].price.unit_amount || 0,
      currentPeriodStart: new Date(stripeSubscription.current_period_start * 1000),
      currentPeriodEnd: new Date(stripeSubscription.current_period_end * 1000),
      cancelAtPeriodEnd: stripeSubscription.cancel_at_period_end,
      canceledAt: stripeSubscription.canceled_at ? new Date(stripeSubscription.canceled_at * 1000) : undefined,
      endedAt: stripeSubscription.ended_at ? new Date(stripeSubscription.ended_at * 1000) : undefined,
    });

    const updated = await this.repository.findByStripeId(stripeSubscription.id);
    if (updated) {
      await this.repository.syncUserSubscription(updated.userId.toString(), updated);
    }
  }

  // Handle subscription deleted
  async handleSubscriptionDeleted(stripeSubscription: Stripe.Subscription): Promise<void> {
    await this.repository.update(stripeSubscription.id, {
      status: 'canceled',
      endedAt: new Date(),
    });

    const subscription = await this.repository.findByStripeId(stripeSubscription.id);
    if (subscription) {
      await this.repository.syncUserSubscription(subscription.userId.toString(), subscription);
    }
  }
}

export const subscriptionService = new SubscriptionService();