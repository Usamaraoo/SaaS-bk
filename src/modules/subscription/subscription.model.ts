import mongoose, { Schema, Document } from 'mongoose';
export type plan_Type = 'basic' | 'premium' | 'elite'
export interface ISubscription extends Document {
  userId: mongoose.Types.ObjectId;
  stripeSubscriptionId: string;
  stripeCustomerId: string;
  stripePriceId: string;
  stripeProductId: string;
  
  status: 'active' | 'canceled' | 'past_due' | 'incomplete' | 'incomplete_expired' | 'trialing' | 'unpaid';
  
  planName: string;
  planType: plan_Type;
  billingInterval: 'month' | 'year';
  amount: number;
  currency: string;
  
  currentPeriodStart: Date;
  currentPeriodEnd: Date;
  cancelAtPeriodEnd: boolean;
  canceledAt?: Date;
  endedAt?: Date;
  
  trialStart?: Date;
  trialEnd?: Date;
  
  metadata?: Record<string, any>;
  
  createdAt: Date;
  updatedAt: Date;
}

const subscriptionSchema = new Schema<ISubscription>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    stripeSubscriptionId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    stripeCustomerId: {
      type: String,
      required: true,
      index: true,
    },
    stripePriceId: {
      type: String,
      required: true,
    },
    stripeProductId: {
      type: String,
      required: true,
    },
    
    status: {
      type: String,
      enum: ['active', 'canceled', 'past_due', 'incomplete', 'incomplete_expired', 'trialing', 'unpaid'],
      required: true,
      index: true,
    },
    
    planName: {
      type: String,
      required: true,
    },
    planType: {
      type: String,
      enum: ['basic', 'premium', 'elite'],
      required: true,
    },
    billingInterval: {
      type: String,
      enum: ['month', 'year'],
      required: true,
    },
    amount: {
      type: Number,
      required: true,
    },
    currency: {
      type: String,
      default: 'usd',
    },
    
    currentPeriodStart: {
      type: Date,
      required: true,
    },
    currentPeriodEnd: {
      type: Date,
      required: true,
      index: true,
    },
    cancelAtPeriodEnd: {
      type: Boolean,
      default: false,
    },
    canceledAt: {
      type: Date,
    },
    endedAt: {
      type: Date,
    },
    
    trialStart: {
      type: Date,
    },
    trialEnd: {
      type: Date,
    },
    
    metadata: {
      type: Schema.Types.Mixed,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
subscriptionSchema.index({ userId: 1, status: 1 });
subscriptionSchema.index({ currentPeriodEnd: 1 });

// Methods
subscriptionSchema.methods.isActive = function(): boolean {
  return this.status === 'active' || this.status === 'trialing';
};

subscriptionSchema.methods.isExpired = function(): boolean {
  return new Date() > this.currentPeriodEnd;
};

subscriptionSchema.methods.daysUntilRenewal = function(): number {
  const now = new Date();
  const diff = this.currentPeriodEnd.getTime() - now.getTime();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
};

export const Subscription = mongoose.model<ISubscription>('Subscription', subscriptionSchema);