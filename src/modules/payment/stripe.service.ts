import Stripe from 'stripe';
import stripe from './stripe.client';


export class StripeService {
  private stripe: Stripe;

  constructor() {
    this.stripe = stripe;
  }

  // Create or get customer
  async createOrGetCustomer(email: string, name: string, userId: string): Promise<Stripe.Customer> {
    // Try to find existing customer
    const existingCustomers = await this.stripe.customers.list({
      email,
      limit: 1,
    });

    if (existingCustomers.data.length > 0) {
      return existingCustomers.data[0];
    }

    // Create new customer
    return await this.stripe.customers.create({
      email,
      name,
      metadata: {
        userId,
      },
    });
  }

  // Attach payment method to customer
  async attachPaymentMethod(paymentMethodId: string, customerId: string): Promise<Stripe.PaymentMethod> {
    const paymentMethod = await this.stripe.paymentMethods.attach(paymentMethodId, {
      customer: customerId,
    });

    // Set as default payment method
    await this.stripe.customers.update(customerId, {
      invoice_settings: {
        default_payment_method: paymentMethodId,
      },
    });

    return paymentMethod;
  }

  // Create subscription
async createSubscription(
  customerId: string,
  priceId: string,
  trialDays?: number
): Promise<Stripe.Subscription> {
  const params: Stripe.SubscriptionCreateParams = {
    customer: customerId,
    items: [{ price: priceId }],
    payment_settings: {
      payment_method_types: ['card'],
      save_default_payment_method: 'on_subscription',
    },
    expand: [
      'latest_invoice.payment_intent',
      'items.data.price.product', // THIS is what you actually need
    ],
  };

  if (trialDays && trialDays > 0) {
    params.trial_period_days = trialDays;
  }

  return await this.stripe.subscriptions.create(params);
}



  // Get subscription
  async getSubscription(subscriptionId: string): Promise<Stripe.Subscription> {
    return await this.stripe.subscriptions.retrieve(subscriptionId, {
      expand: ['customer', 'default_payment_method', 'plan.product'],
    });
  }

  // Update subscription (change plan)
  async updateSubscription(
    subscriptionId: string,
    newPriceId: string,
    prorationBehavior: 'always_invoice' | 'create_prorations' | 'none' = 'always_invoice'
  ): Promise<Stripe.Subscription> {
    const subscription = await this.stripe.subscriptions.retrieve(subscriptionId);

    return await this.stripe.subscriptions.update(subscriptionId, {
      items: [
        {
          id: subscription.items.data[0].id,
          price: newPriceId,
        },
      ],
      proration_behavior: prorationBehavior,
      expand: ['latest_invoice.payment_intent'],
    });
  }

  // Cancel subscription
  async cancelSubscription(
    subscriptionId: string,
    cancelAtPeriodEnd: boolean = true
  ): Promise<Stripe.Subscription> {
    if (cancelAtPeriodEnd) {
      return await this.stripe.subscriptions.update(subscriptionId, {
        cancel_at_period_end: true,
      });
    } else {
      return await this.stripe.subscriptions.cancel(subscriptionId);
    }
  }

  // Resume subscription
  async resumeSubscription(subscriptionId: string): Promise<Stripe.Subscription> {
    return await this.stripe.subscriptions.update(subscriptionId, {
      cancel_at_period_end: false,
    });
  }

  // List all prices
  async listPrices(): Promise<Stripe.Price[]> {
    const prices = await this.stripe.prices.list({
      active: true,
      expand: ['data.product'],
    });
    return prices.data;
  }

  // Get upcoming invoice
  async getUpcomingInvoice(customerId: string): Promise<Stripe.Invoice> {
    return await this.stripe.invoices.retrieveUpcoming({
      customer: customerId,
    });
  }

  // Create customer portal session
  async createPortalSession(customerId: string, returnUrl: string): Promise<Stripe.BillingPortal.Session> {
    return await this.stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: returnUrl,
    });
  }

  // List payment methods
  async listPaymentMethods(customerId: string): Promise<Stripe.PaymentMethod[]> {
    const paymentMethods = await this.stripe.paymentMethods.list({
      customer: customerId,
      type: 'card',
    });
    return paymentMethods.data;
  }

  // Update payment method
  async updateDefaultPaymentMethod(customerId: string, paymentMethodId: string): Promise<Stripe.Customer> {
    return await this.stripe.customers.update(customerId, {
      invoice_settings: {
        default_payment_method: paymentMethodId,
      },
    }) as Stripe.Customer;
  }

  // Get customer
  async getCustomer(customerId: string): Promise<Stripe.Customer> {
    return await this.stripe.customers.retrieve(customerId) as Stripe.Customer;
  }

  // Verify webhook signature
  verifyWebhookSignature(payload: string | Buffer, signature: string, secret: string): Stripe.Event {
    return this.stripe.webhooks.constructEvent(payload, signature, secret);
  }
}

export const stripeService = new StripeService();