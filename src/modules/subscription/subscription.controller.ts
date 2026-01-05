import { Request, Response } from 'express';
import { subscriptionService } from './subscription.service';

export class SubscriptionController {
  // Get available plans
  async getPlans(req: Request, res: Response) {
    try {
      const plans = await subscriptionService.getAvailablePlans();
      res.status(200).json({
        success: true,
        data: plans,
      });
    } catch (error: any) {
      console.error('Get plans error:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to fetch plans',
      });
    }
  }

  // Create subscription
  async createSubscription(req: Request, res: Response) {
    try {
      const { priceId, paymentMethodId, trialDays } = req.body;
      const userId = req.user?.id; // From auth middleware

      if (!userId) {
        return res.status(401).json({
          success: false,
          error: 'Unauthorized',
        });
      }

      if (!priceId || !paymentMethodId) {
        return res.status(400).json({
          success: false,
          error: 'Missing required fields: priceId, paymentMethodId',
        });
      }

      const result = await subscriptionService.createSubscription(
        userId,
        priceId,
        paymentMethodId,
        trialDays
      );

      res.status(201).json({
        success: true,
        data: {
          subscription: result.subscription,
          clientSecret: result.clientSecret,
        },
        message: 'Subscription created successfully',
      });
    } catch (error: any) {
      console.error('Create subscription error:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to create subscription',
      });
    }
  }

  // Get user subscription
  async getSubscription(req: Request, res: Response) {
    try {
      
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({
          success: false,
          error: 'Unauthorized',
        });
      }

      const subscription = await subscriptionService.getUserSubscription(userId);

      if (!subscription) {
        return res.status(404).json({
          success: false,
          error: 'No active subscription found',
        });
      }

      res.status(200).json({
        success: true,
        data: subscription,
      });
    } catch (error: any) {
      console.error('Get subscription error:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to fetch subscription',
      });
    }
  }

  // Get subscription status (simplified version)
  // async getSubscriptionStatus(req: Request, res: Response) {
  //   try {
  //     const userId = req.user?.id;

  //     if (!userId) {
  //       return res.status(401).json({
  //         success: false,
  //         error: 'Unauthorized',
  //       });
  //     }

  //     const subscription = await subscriptionService.getUserSubscription(userId);

  //     if (!subscription) {
  //       return res.status(200).json({
  //         success: true,
  //         data: {
  //           hasSubscription: false,
  //           status: null,
  //         },
  //       });
  //     }

  //     res.status(200).json({
  //       success: true,
  //       data: {
  //         hasSubscription: true,
  //         status: subscription.status,
  //         planName: subscription.planName,
  //         planType: subscription.planType,
  //         currentPeriodEnd: subscription.currentPeriodEnd,
  //         cancelAtPeriodEnd: subscription.cancelAtPeriodEnd,
  //       //   daysUntilRenewal: subscription.daysUntilRenewal(),
  //       },
  //     });
  //   } catch (error: any) {
  //     console.error('Get subscription status error:', error);
  //     res.status(500).json({
  //       success: false,
  //       error: error.message || 'Failed to fetch subscription status',
  //     });
  //   }
  // }

  // Cancel subscription
  async cancelSubscription(req: Request, res: Response) {
    try {
      const userId = req.user?.id;
      const { immediate } = req.body;

      if (!userId) {
        return res.status(401).json({
          success: false,
          error: 'Unauthorized',
        });
      }

      const subscription = await subscriptionService.cancelSubscription(userId, immediate || false);

      res.status(200).json({
        success: true,
        data: subscription,
        message: immediate 
          ? 'Subscription canceled immediately' 
          : 'Subscription will be canceled at the end of the billing period',
      });
    } catch (error: any) {
      console.error('Cancel subscription error:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to cancel subscription',
      });
    }
  }

  // Resume subscription
  async resumeSubscription(req: Request, res: Response) {
    try {
      const userId = req.user?.id;

      if (!userId) {
        return res.status(401).json({
          success: false,
          error: 'Unauthorized',
        });
      }

      const subscription = await subscriptionService.resumeSubscription(userId);

      res.status(200).json({
        success: true,
        data: subscription,
        message: 'Subscription resumed successfully',
      });
    } catch (error: any) {
      console.error('Resume subscription error:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to resume subscription',
      });
    }
  }

  // Change subscription plan
  async changeSubscriptionPlan(req: Request, res: Response) {
    try {
      const userId = req.user?.id;
      const { newPriceId } = req.body;
console.log('newPriceId', newPriceId);
      if (!userId) {
        return res.status(401).json({
          success: false,
          error: 'Unauthorized',
        });
      }

      if (!newPriceId) {
        return res.status(400).json({
          success: false,
          error: 'Missing required field: newPriceId',
        });
      }

      const subscription = await subscriptionService.changeSubscriptionPlan(userId, newPriceId);

      res.status(200).json({
        success: true,
        data: subscription,
        message: 'Subscription plan updated successfully',
      });
    } catch (error: any) {
      console.error('Change subscription plan error:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to change subscription plan',
      });
    }
  }

  // Get subscription history
  async getSubscriptionHistory(req: Request, res: Response) {
    try {
      const userId = req.user?.id;

      if (!userId) {
        return res.status(401).json({
          success: false,
          error: 'Unauthorized',
        });
      }

      const subscriptions = await subscriptionService.getSubscriptionHistory(userId);

      res.status(200).json({
        success: true,
        data: subscriptions,
      });
    } catch (error: any) {
      console.error('Get subscription history error:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to fetch subscription history',
      });
    }
  }

  // Get upcoming invoice
  // async getUpcomingInvoice(req: Request, res: Response) {
  //   try {
  //     const userId = req.user?.id;

  //     if (!userId) {
  //       return res.status(401).json({
  //         success: false,
  //         error: 'Unauthorized',
  //       });
  //     }

  //     const invoice = await subscriptionService.getUpcomingInvoice(userId);

  //     res.status(200).json({
  //       success: true,
  //       data: invoice,
  //     });
  //   } catch (error: any) {
  //     console.error('Get upcoming invoice error:', error);
  //     res.status(500).json({
  //       success: false,
  //       error: error.message || 'Failed to fetch upcoming invoice',
  //     });
  //   }
  // }

  // Create customer portal session
  async createPortalSession(req: Request, res: Response) {
    try {
      const userId = req.user?.id;
      const { returnUrl } = req.body;

      if (!userId) {
        return res.status(401).json({
          success: false,
          error: 'Unauthorized',
        });
      }

      const url = await subscriptionService.createPortalSession(
        userId,
        returnUrl || `${req.protocol}://${req.get('host')}/dashboard`
      );

      res.status(200).json({
        success: true,
        data: { url },
      });
    } catch (error: any) {
      console.error('Create portal session error:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to create portal session',
      });
    }
  }
}

export const subscriptionController = new SubscriptionController();