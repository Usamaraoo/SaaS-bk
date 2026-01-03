import { model, Schema } from "mongoose";

export const PaymentSchema = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true
    },

    stripePaymentIntentId: {
      type: String,
      unique: true
    },

    stripeCheckoutSessionId: {
      type: String,
      unique: true
    },

    amount: {
      type: Number,
      required: true
    },

    currency: {
      type: String,
      default: "usd"
    },

    status: {
      type: String,
      enum: ["pending", "paid", "failed"],
      default: "pending"
    },

    webhookEventIds: {
      type: [String],
      default: []
    }
  },
  { timestamps: true }
);

export const PaymentModel = model("Payment", PaymentSchema);