import { Request, Response, NextFunction } from 'express';
import { User } from '../../modules/user/user.model';

// Require active subscription
export const requireActiveSubscription = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'Unauthorized',
      });
    }

    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found',
      });
    }

    // Check if subscription is active or trialing
    if (!user.hasActiveSubscription()) {
      return res.status(403).json({
        success: false,
        error: 'Active subscription required',
        subscriptionStatus: user.subscriptionStatus || 'none',
      });
    }

    // Check if subscription has expired
    if (user.currentPeriodEnd && new Date() > user.currentPeriodEnd) {
      return res.status(403).json({
        success: false,
        error: 'Subscription expired',
      });
    }

    next();
  } catch (error: any) {
    console.error('Subscription middleware error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
    });
  }
};

// Require specific membership type
export const requireMembershipType = (
  ...allowedTypes: ('basic' | 'premium' | 'elite')[]
) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.user?.id;

      if (!userId) {
        return res.status(401).json({
          success: false,
          error: 'Unauthorized',
        });
      }

      const user = await User.findById(userId);

      if (!user || !user.hasActiveSubscription()) {
        return res.status(403).json({
          success: false,
          error: 'Active subscription required',
        });
      }

      if (!user.membershipType || !allowedTypes.includes(user.membershipType)) {
        return res.status(403).json({
          success: false,
          error: `This feature requires one of these membership types: ${allowedTypes.join(', ')}`,
          currentMembership: user.membershipType || 'none',
        });
      }

      next();
    } catch (error: any) {
      console.error('Membership type middleware error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error',
      });
    }
  };
};

// Require minimum access level
export const requireAccessLevel = (minLevel: number) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.user?.id;

      if (!userId) {
        return res.status(401).json({
          success: false,
          error: 'Unauthorized',
        });
      }

      const user = await User.findById(userId);

      if (!user) {
        return res.status(404).json({
          success: false,
          error: 'User not found',
        });
      }

      if (!user.canAccessFeature(minLevel)) {
        return res.status(403).json({
          success: false,
          error: `This feature requires access level ${minLevel} or higher`,
          currentAccessLevel: user.accessLevel || 0,
        });
      }

      next();
    } catch (error: any) {
      console.error('Access level middleware error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error',
      });
    }
  };
};

// Check trial status
export const checkTrialStatus = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'Unauthorized',
      });
    }

    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found',
      });
    }

    if (user.subscriptionStatus === 'trialing' && user.trialEnd) {
      const daysLeft = Math.ceil(
        (user.trialEnd.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
      );

      // Add trial info to response
      res.locals.trialInfo = {
        isTrialing: true,
        daysLeft,
        trialEnd: user.trialEnd,
      };
    }

    next();
  } catch (error: any) {
    console.error('Trial status middleware error:', error);
    next();
  }
};