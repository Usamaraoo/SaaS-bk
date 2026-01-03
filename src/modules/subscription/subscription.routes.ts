import { Router } from 'express';
import { subscriptionController } from './subscription.controller';
import { requireAuth } from '../../shared/middleware/authMiddleware';
import { requireActiveSubscription } from '../../shared/middleware/subscription.middleware';

const router = Router();

// Public routes
router.get('/plans', subscriptionController.getPlans.bind(subscriptionController));

// Protected routes (require authentication)
router.post(
  '/create',
  requireAuth,
  subscriptionController.createSubscription.bind(subscriptionController)
);

// router.get(
//   '/status',
//   requireAuth,
//   subscriptionController.getSubscriptionStatus.bind(subscriptionController)
// );

router.get(
  '/current',
  requireAuth,
  requireActiveSubscription,
  subscriptionController.getSubscription.bind(subscriptionController)
);

router.post(
  '/cancel',
  requireAuth,
  subscriptionController.cancelSubscription.bind(subscriptionController)
);

router.post(
  '/resume',
  requireAuth,
  subscriptionController.resumeSubscription.bind(subscriptionController)
);

router.post(
  '/change-plan',
  requireAuth,
  subscriptionController.changeSubscriptionPlan.bind(subscriptionController)
);

router.get(
  '/history',
  requireAuth,
  subscriptionController.getSubscriptionHistory.bind(subscriptionController)
);

// router.get(
//   '/upcoming-invoice',
//   requireAuth,
//   subscriptionController.getUpcomingInvoice.bind(subscriptionController)
// );

router.post(
  '/portal',
  requireAuth,
  subscriptionController.createPortalSession.bind(subscriptionController)
);

// Example protected routes that require active subscription
router.get(
  '/member-area',
  requireAuth,
  requireActiveSubscription,
  (req, res) => {
    res.json({ message: 'Welcome to member area' });
  }
);

export default router;