import { PaymentModel } from "./payment.model";

export const PaymentRepository = {
    create: (data: any) => PaymentModel.create(data),
    findByUserId: (id: string) => PaymentModel.findOne({userId: id}),
    findByIntentId: (paymentIntentId: string) =>
        PaymentModel.findOne({ paymentIntentId: paymentIntentId }),

    findBySessionId: (stripeCheckoutSessionId: string) =>
        PaymentModel.findOne({ stripeCheckoutSessionId: stripeCheckoutSessionId }),

    markPaid: async (payment: any, eventId: string) => {
        if (payment.webhookEventIds.includes(eventId)) return payment;
        
        payment.status = "paid";
        payment.webhookEventIds.push(eventId);
        return payment.save();
    }
};
