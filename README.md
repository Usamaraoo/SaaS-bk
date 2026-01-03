# Stripe Payments Backend (Node.js + Express + MongoDB)

## Overview

This backend supports **two Stripe payment flows**:

1. **Stripe Checkout (Hosted Page)**
2. **Custom Payment Form (Stripe Payment Intents + Elements)**

Both flows are **webhook-driven**, **idempotent**, and **production-safe**.

If you trust frontend redirects or skip webhooks, your payment system is trash. This one isn’t.

---

## Tech Stack

- Node.js
- Express
- TypeScript
- MongoDB + Mongoose
- Stripe API

---

## Payment Flows

### 1. Checkout Session (Hosted UI)

1. Frontend calls `POST /payments/checkout`
2. Backend creates Stripe Checkout Session
3. User completes payment on Stripe
4. Stripe sends `checkout.session.completed`
5. Webhook verifies signature
6. DB status updates `pending → paid`

---

### 2. Custom Payment Intent (Stripe Elements)

1. Frontend calls `POST /payments/create-payment-intent`
2. Backend creates PaymentIntent
3. Backend returns `clientSecret`
4. Frontend confirms payment via Stripe Elements
5. Stripe sends `payment_intent.succeeded`
6. Webhook verifies signature
7. DB status updates `pending → paid`

**Webhooks are the single source of truth.**  
Frontend success ≠ payment success.

---

------------------------------------------------------------------------

## Environment Variables

Create a `.env` file:

    PORT=5000
    MONGO_URI=your_mongodb_uri
    STRIPE_SECRET_KEY=sk_test_xxx
    STRIPE_WEBHOOK_SECRET=whsec_xxx
    FRONTEND_URL=http://localhost:3000

------------------------------------------------------------------------

## Project Structure

    src/
     ├─ modules/
     │   └─ payment/
     │       ├─ payment.controller.ts
     │       ├─ payment.service.ts
     │       ├─ payment.repository.ts
     │       ├─ webhook.controller.ts
     │       └─ stripe.client.ts
     ├─ routes/
     ├─ shared/
     ├─ app.ts
     └─ server.ts

------------------------------------------------------------------------

## Checkout Creation

-   Uses **Stripe Checkout**
-   No manual PaymentIntent creation
-   Stripe automatically creates the PaymentIntent

``` ts
stripe.checkout.sessions.create({
  mode: "payment",
  line_items: [...],
  success_url,
  cancel_url
});
```

Stored in DB: - `stripeCheckoutSessionId` - `status: pending`

------------------------------------------------------------------------

## Webhook Handling (Critical)

### Why Webhooks?

-   User can close browser
-   Redirect can fail
-   Webhooks are the **source of truth**

### Endpoint

    POST /webhooks/stripe

Uses **raw body**:

``` ts
app.post(
  "/webhooks/stripe",
  express.raw({ type: "application/json" }),
  stripeWebhook
);
```

------------------------------------------------------------------------

## Webhook Verification

``` ts
stripe.webhooks.constructEvent(
  req.body,
  sig,
  process.env.STRIPE_WEBHOOK_SECRET
);
```

Fails if: - Raw body not used - Secret is wrong - Payload modified

------------------------------------------------------------------------

## Idempotency (Duplicate Webhooks)

Stripe retries webhooks.

Solution: - Store `event.id` in DB - Ignore if already processed

``` ts
if (payment.webhookEventIds.includes(eventId)) return;
```

This prevents: - Double payments - Double DB updates

------------------------------------------------------------------------

## Payment Status Update

Webhook event:

    checkout.session.completed

Extract:

    session.payment_intent

DB update:

    pending → paid

------------------------------------------------------------------------

## Local Webhook Testing

Install Stripe CLI:

    stripe login
    stripe listen --forward-to localhost:5000/webhooks/stripe

Use test card:

    4242 4242 4242 4242

------------------------------------------------------------------------

## Key Takeaways

-   Never trust frontend redirects
-   Always verify webhooks
-   Always handle idempotency
-   Checkout Session is the source of truth
-   PaymentIntent ID comes from webhook, not frontend

------------------------------------------------------------------------

## Status

✅ One-time payments\
✅ Webhooks\
✅ Idempotent updates\
✅ Production-ready structure
