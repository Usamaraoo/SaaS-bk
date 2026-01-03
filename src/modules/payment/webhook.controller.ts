import { Request, Response } from 'express';
import { stripeService } from './stripe.service';
import { subscriptionService } from '../subscription/subscription.service';
import Stripe from 'stripe';

export class WebhookController {
  // Handle Stripe webhooks
  async handleStripeWebhook(req: Request, res: Response) {
    const signature = req.headers['stripe-signature'] as string;
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!;

    let event: Stripe.Event;

    try {
      // Verify webhook signature
      event = stripeService.verifyWebhookSignature(req.body, signature, webhookSecret);
    } catch (error: any) {
      console.error('Webhook signature verification failed:', error.message);
      return res.status(400).send(`Webhook Error: ${error.message}`);
    }

    console.log(`Received webhook event: ${event.type}`);

    try {
      // Handle different event types
      switch (event.type) {
        case 'customer.subscription.created':
          await this.handleSubscriptionCreated(event.data.object as Stripe.Subscription);
          break;

        case 'customer.subscription.updated':
          await this.handleSubscriptionUpdated(event.data.object as Stripe.Subscription);
          break;

        case 'customer.subscription.deleted':
          await this.handleSubscriptionDeleted(event.data.object as Stripe.Subscription);
          break;

        case 'customer.subscription.trial_will_end':
          await this.handleTrialWillEnd(event.data.object as Stripe.Subscription);
          break;

        case 'invoice.payment_succeeded':
          await this.handleInvoicePaymentSucceeded(event.data.object as Stripe.Invoice);
          break;

        case 'invoice.payment_failed':
          await this.handleInvoicePaymentFailed(event.data.object as Stripe.Invoice);
          break;

        case 'invoice.upcoming':
          await this.handleInvoiceUpcoming(event.data.object as Stripe.Invoice);
          break;

        case 'payment_intent.succeeded':
          await this.handlePaymentIntentSucceeded(event.data.object as Stripe.PaymentIntent);
          break;

        case 'payment_intent.payment_failed':
          await this.handlePaymentIntentFailed(event.data.object as Stripe.PaymentIntent);
          break;

        default:
          console.log(`Unhandled event type: ${event.type}`);
      }

      res.status(200).json({ received: true });
    } catch (error: any) {
      console.error(`Error handling webhook ${event.type}:`, error);
      res.status(500).json({
        error: 'Webhook handler failed',
        message: error.message,
      });
    }
  }

  // Handle subscription created
  private async handleSubscriptionCreated(subscription: Stripe.Subscription) {
    console.log('Subscription created:', subscription.id);

    // The subscription is already created in the database during the API call
    // This webhook confirms it was successful
    await subscriptionService.handleSubscriptionUpdated(subscription);
  }

  // Handle subscription updated
  private async handleSubscriptionUpdated(subscription: Stripe.Subscription) {
    console.log('Subscription updated:', subscription.id);

    await subscriptionService.handleSubscriptionUpdated(subscription);

    // Send notification email based on status change
    // if (subscription.status === 'active') {
    //   await emailService.sendSubscriptionActivatedEmail(subscription);
    // } else if (subscription.cancel_at_period_end) {
    //   await emailService.sendSubscriptionCanceledEmail(subscription);
    // }
  }

  // Handle subscription deleted
  private async handleSubscriptionDeleted(subscription: Stripe.Subscription) {
    console.log('Subscription deleted:', subscription.id);

    await subscriptionService.handleSubscriptionDeleted(subscription);

    // Send cancellation confirmation email
    // await emailService.sendSubscriptionEndedEmail(subscription);
  }

  // Handle trial will end (3 days before)
  private async handleTrialWillEnd(subscription: Stripe.Subscription) {
    console.log('Trial will end:', subscription.id);

    // Send reminder email
    // const customer = subscription.customer as string;
    // await emailService.sendTrialEndingReminderEmail(customer, subscription);
  }

  // Handle successful invoice payment
  private async handleInvoicePaymentSucceeded(invoice: Stripe.Invoice) {
    console.log('Invoice payment succeeded:', invoice.id);

    if (invoice.subscription) {
      const subscriptionId = invoice.subscription as string;
      
      // Fetch latest subscription data
      const subscription = await stripeService.getSubscription(subscriptionId);
      await subscriptionService.handleSubscriptionUpdated(subscription);

      // Send payment receipt
      // await emailService.sendPaymentReceiptEmail(invoice);
    }
  }

  // Handle failed invoice payment
  private async handleInvoicePaymentFailed(invoice: Stripe.Invoice) {
    console.log('Invoice payment failed:', invoice.id);

    if (invoice.subscription) {
      const subscriptionId = invoice.subscription as string;
      
      // Fetch latest subscription data
      const subscription = await stripeService.getSubscription(subscriptionId);
      await subscriptionService.handleSubscriptionUpdated(subscription);

      // Send payment failure notification
      // await emailService.sendPaymentFailedEmail(invoice);
    }
  }

  // Handle upcoming invoice (7 days before)
  private async handleInvoiceUpcoming(invoice: Stripe.Invoice) {
    console.log('Upcoming invoice:', invoice.id);

    // Send upcoming payment reminder
    // await emailService.sendUpcomingPaymentEmail(invoice);
  }

  // Handle payment intent succeeded
  private async handlePaymentIntentSucceeded(paymentIntent: Stripe.PaymentIntent) {
    console.log('Payment intent succeeded:', paymentIntent.id);

    // Additional payment tracking if needed
  }

  // Handle payment intent failed
  private async handlePaymentIntentFailed(paymentIntent: Stripe.PaymentIntent) {
    console.log('Payment intent failed:', paymentIntent.id);

    // Log failed payment attempt
    // await paymentLogService.logFailedPayment(paymentIntent);
  }
}

export const webhookController = new WebhookController();