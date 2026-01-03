import mongoose, { Schema, Document } from 'mongoose';

export interface IUser extends Document {
  email: string;
  name: string;
  password: string;
  role: 'member' | 'admin';
  
  // Stripe Customer Info
  stripeCustomerId?: string;
  
  // Subscription Info
  subscriptionId?: string;
  subscriptionStatus?: 'active' | 'canceled' | 'past_due' | 'incomplete' | 'incomplete_expired' | 'trialing' | 'unpaid';
  subscriptionPlanId?: string;
  subscriptionPlanName?: string;
  currentPeriodStart?: Date;
  currentPeriodEnd?: Date;
  cancelAtPeriodEnd?: boolean;
  canceledAt?: Date;
  trialEnd?: Date;
  
  // Access Control
  membershipType?: 'basic' | 'premium' | 'elite';
  accessLevel?: number; // 1: Basic, 2: Premium, 3: Elite
  
  // Payment History
  defaultPaymentMethodId?: string;
  
  createdAt: Date;
  updatedAt: Date;
}

const userSchema = new Schema<IUser>(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    password: {
      type: String,
      required: true,
    },
    role: {
      type: String,
      enum: ['member', 'admin'],
      default: 'member',
    },
    
    // Stripe Customer
    stripeCustomerId: {
      type: String,
      sparse: true,
    },
    
    // Subscription
    subscriptionId: {
      type: String,
      sparse: true,
    },
    subscriptionStatus: {
      type: String,
      enum: ['active', 'canceled', 'past_due', 'incomplete', 'incomplete_expired', 'trialing', 'unpaid'],
    },
    subscriptionPlanId: {
      type: String,
    },
    subscriptionPlanName: {
      type: String,
    },
    currentPeriodStart: {
      type: Date,
    },
    currentPeriodEnd: {
      type: Date,
    },
    cancelAtPeriodEnd: {
      type: Boolean,
      default: false,
    },
    canceledAt: {
      type: Date,
    },
    trialEnd: {
      type: Date,
    },
    
    // Membership
    membershipType: {
      type: String,
      enum: ['basic', 'premium', 'elite'],
    },
    accessLevel: {
      type: Number,
      default: 0,
      min: 0,
      max: 3,
    },
    
    // Payment
    defaultPaymentMethodId: {
      type: String,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
// userSchema.index({ stripeCustomerId: 1 });
// userSchema.index({ subscriptionId: 1 });
// userSchema.index({ subscriptionStatus: 1 });

// Methods
userSchema.methods.hasActiveSubscription = function(): boolean {
  return this.subscriptionStatus === 'active' || this.subscriptionStatus === 'trialing';
};

userSchema.methods.canAccessFeature = function(requiredLevel: number): boolean {
  return this.accessLevel >= requiredLevel && this.hasActiveSubscription();
};

export const User = mongoose.model<IUser>('User', userSchema);