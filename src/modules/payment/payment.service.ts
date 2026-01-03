import stripe from "./stripe.client";
import { PaymentRepository } from "./payment.repository";

export const PaymentService = {

    async createPaymentIntent(userId: string, amount: number) {
        // 0. Check for existing pending payment
        const existingPayment = await PaymentRepository.findByUserId(userId);
        if (existingPayment) {
            // Retrieve intent from Stripe to get fresh client_secret
            const existingIntent = await stripe.paymentIntents.retrieve(
                existingPayment.stripePaymentIntentId
            );

            if (existingIntent.status === "canceled") {
                // fall through and create new one
            } else {
                return {
                    clientSecret: existingIntent.client_secret,
                    paymentIntentId: existingIntent.id,
                };
            }
        }

        // 1. Create new PaymentIntent
        const paymentIntent = await stripe.paymentIntents.create({
            amount,
            currency: "usd",
            automatic_payment_methods: { enabled: true },
            metadata: { userId },
        });

        // 2. Store in DB
        await PaymentRepository.create({
            userId,
            amount,
            stripePaymentIntentId: paymentIntent.id,
            status: "pending",
        });

        return {
            clientSecret: paymentIntent.client_secret,
            paymentIntentId: paymentIntent.id,
        };
    },   


    async createCheckout(userId: string, amount: number) {
        // 1. Create Checkout Session ONLY
        const session = await stripe.checkout.sessions.create({
            mode: "payment",
            payment_method_types: ["card"],
            line_items: [
                {
                    price_data: {
                        currency: "usd",
                        product_data: {
                            name: "Your Product",
                        },
                        unit_amount: amount,
                    },
                    quantity: 1,
                },
            ],
            success_url: `${process.env.FRONTEND_URL}/success`,
            cancel_url: `${process.env.FRONTEND_URL}/cancel`,
            metadata: {
                userId, // 🔑 important
            },
        });

        // 2. Store Checkout Session ID (NOT intent)
        await PaymentRepository.create({
            userId,
            amount,
            stripeCheckoutSessionId: session.id,
            status: "pending",
        });

        return session.url!;
    },
};