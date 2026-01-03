import { Subscription, ISubscription } from './subscription.model';
import { User } from '../user/user.model';
import mongoose from 'mongoose';

export class SubscriptionRepository {
  // Create subscription
  async create(data: Partial<ISubscription>): Promise<ISubscription> {
    const subscription = new Subscription(data);
    return await subscription.save();
  }

  // Find by ID
  async findById(id: string): Promise<ISubscription | null> {
    return await Subscription.findById(id).populate('userId', 'email name');
  }

  // Find by stripe subscription ID
  async findByStripeId(stripeSubscriptionId: string): Promise<ISubscription | null> {
    return await Subscription.findOne({ stripeSubscriptionId }).populate('userId', 'email name');
  }

  // Find by user ID
  async findByUserId(userId: string): Promise<ISubscription[]> {
    return await Subscription.find({ userId }).sort({ createdAt: -1 });
  }

  // Find active subscription by user ID
  async findActiveByUserId(userId: string): Promise<ISubscription | null> {
    return await Subscription.findOne({
      userId,
      status: { $in: ['active', 'trialing'] },
    }).sort({ createdAt: -1 });
  }

  // Find by customer ID
  async findByCustomerId(stripeCustomerId: string): Promise<ISubscription[]> {
    return await Subscription.find({ stripeCustomerId }).sort({ createdAt: -1 });
  }

  // Update subscription
  async update(stripeSubscriptionId: string, data: Partial<ISubscription>): Promise<ISubscription | null> {
    return await Subscription.findOneAndUpdate(
      { stripeSubscriptionId },
      { $set: data },
      { new: true, runValidators: true }
    );
  }

  // Update status
  async updateStatus(stripeSubscriptionId: string, status: string): Promise<ISubscription | null> {
    return await Subscription.findOneAndUpdate(
      { stripeSubscriptionId },
      { $set: { status } },
      { new: true }
    );
  }

  // Mark as canceled
  async markAsCanceled(stripeSubscriptionId: string, cancelAtPeriodEnd: boolean = false): Promise<ISubscription | null> {
    const updateData: any = {
      canceledAt: new Date(),
      cancelAtPeriodEnd,
    };

    if (!cancelAtPeriodEnd) {
      updateData.status = 'canceled';
      updateData.endedAt = new Date();
    }

    return await Subscription.findOneAndUpdate(
      { stripeSubscriptionId },
      { $set: updateData },
      { new: true }
    );
  }

  // Find expiring subscriptions (for reminders)
  async findExpiringSubscriptions(daysBeforeExpiry: number): Promise<ISubscription[]> {
    const targetDate = new Date();
    targetDate.setDate(targetDate.getDate() + daysBeforeExpiry);

    return await Subscription.find({
      status: 'active',
      cancelAtPeriodEnd: true,
      currentPeriodEnd: {
        $gte: new Date(),
        $lte: targetDate,
      },
    }).populate('userId', 'email name');
  }

  // Find subscriptions ending trial soon
  async findTrialsEndingSoon(daysBeforeEnd: number): Promise<ISubscription[]> {
    const targetDate = new Date();
    targetDate.setDate(targetDate.getDate() + daysBeforeEnd);

    return await Subscription.find({
      status: 'trialing',
      trialEnd: {
        $gte: new Date(),
        $lte: targetDate,
      },
    }).populate('userId', 'email name');
  }

  // Get subscription statistics
  async getStatistics(): Promise<any> {
    const stats = await Subscription.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
          totalRevenue: { $sum: '$amount' },
        },
      },
    ]);

    const planStats = await Subscription.aggregate([
      {
        $match: { status: { $in: ['active', 'trialing'] } },
      },
      {
        $group: {
          _id: '$planType',
          count: { $sum: 1 },
          revenue: { $sum: '$amount' },
        },
      },
    ]);

    return { statusStats: stats, planStats };
  }

  // Delete subscription
  async delete(id: string): Promise<boolean> {
    const result = await Subscription.deleteOne({ _id: id });
    return result.deletedCount > 0;
  }

  // Sync user data with subscription
  async syncUserSubscription(userId: string, subscription: ISubscription): Promise<void> {
    const accessLevelMap: Record<string, number> = {
      basic: 1,
      premium: 2,
      elite: 3,
    };

    await User.findByIdAndUpdate(userId, {
      $set: {
        subscriptionId: subscription.stripeSubscriptionId,
        subscriptionStatus: subscription.status,
        subscriptionPlanId: subscription.stripePriceId,
        subscriptionPlanName: subscription.planName,
        currentPeriodStart: subscription.currentPeriodStart,
        currentPeriodEnd: subscription.currentPeriodEnd,
        cancelAtPeriodEnd: subscription.cancelAtPeriodEnd,
        canceledAt: subscription.canceledAt,
        trialEnd: subscription.trialEnd,
        membershipType: subscription.planType,
        accessLevel: accessLevelMap[subscription.planType] || 0,
      },
    });
  }
}