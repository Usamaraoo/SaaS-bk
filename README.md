# Gym Membership Subscription System - Backend

A complete Stripe subscription management system built with Node.js, Express, TypeScript, and MongoDB for managing gym memberships with recurring billing.

## 📋 Table of Contents

- [Features](#features)
- [Tech Stack](#tech-stack)
- [Prerequisites](#prerequisites)
- [Installation](#installation)
- [Environment Configuration](#environment-configuration)
- [Stripe Dashboard Setup](#stripe-dashboard-setup)
- [Database Schema](#database-schema)
- [API Documentation](#api-documentation)
- [Webhook Events](#webhook-events)
- [Testing](#testing)
- [Deployment](#deployment)
- [Troubleshooting](#troubleshooting)

## ✨ Features

- ✅ Multiple membership tiers (Basic, Premium, Elite)
- ✅ Monthly and annual billing cycles
- ✅ Trial period support
- ✅ Subscription management (create, cancel, resume, upgrade/downgrade)
- ✅ Automatic proration when changing plans
- ✅ Webhook handling for real-time updates
- ✅ Customer portal integration
- ✅ 3D Secure (SCA) support
- ✅ Failed payment handling
- ✅ Access control middleware
- ✅ Subscription status tracking

## 🛠 Tech Stack

- **Runtime**: Node.js (v18+)
- **Framework**: Express.js
- **Language**: TypeScript
- **Database**: MongoDB with Mongoose
- **Payment**: Stripe API
- **Authentication**: JWT (assumed to be implemented)

## 📦 Prerequisites

Before you begin, ensure you have:

- Node.js 18+ installed
- MongoDB installed and running
- Stripe account (test mode)
- Basic understanding of TypeScript and Express

## 🚀 Installation

### 1. Clone the Repository

```bash
git clone <your-repo-url>
cd gym-subscription-backend
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Install Required Packages

```bash
npm install express mongoose stripe dotenv cors
npm install -D @types/express @types/node @types/cors typescript ts-node nodemon
```

### 4. Initialize TypeScript

```bash
npx tsc --init
```

Update `tsconfig.json`:
```json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "commonjs",
    "outDir": "./dist",
    "rootDir": "./src",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules"]
}
```

### 5. Project Structure

```
src/
├── modules/
│   ├── subscription/
│   │   ├── subscription.model.ts
│   │   ├── subscription.repository.ts
│   │   ├── subscription.service.ts
│   │   ├── subscription.controller.ts
│   │   └── subscription.routes.ts
│   ├── payment/
│   │   ├── webhook.controller.ts
│   │   ├── webhook.routes.ts
│   │   └── stripe.service.ts
│   └── user/
│       └── user.model.ts
├── middleware/
│   ├── auth.middleware.ts
│   └── subscription.middleware.ts
└── app.ts
```

## ⚙️ Environment Configuration

Create a `.env` file in the root directory:

```env
# Server
PORT=3000
NODE_ENV=development

# Database
MONGODB_URI=mongodb://localhost:27017/gym-subscription

# Stripe Keys (Test Mode)
STRIPE_SECRET_KEY=sk_test_xxxxxxxxxxxxx
STRIPE_PUBLISHABLE_KEY=pk_test_xxxxxxxxxxxxx
STRIPE_WEBHOOK_SECRET=whsec_xxxxxxxxxxxxx

# Stripe Price IDs (from Stripe Dashboard)
STRIPE_PRICE_BASIC_MONTHLY=price_xxxxxxxxxxxxx
STRIPE_PRICE_PREMIUM_MONTHLY=price_yyyyyyyyyyy
STRIPE_PRICE_PREMIUM_ANNUAL=price_zzzzzzzzzzz
STRIPE_PRICE_ELITE_MONTHLY=price_aaaaaaaaaa

# JWT (if you have authentication)
JWT_SECRET=your-jwt-secret-key
JWT_EXPIRES_IN=7d

# Frontend URL (for CORS)
FRONTEND_URL=http://localhost:5173
```

### Environment Variables Explained

| Variable | Description | Where to Get |
|----------|-------------|--------------|
| `STRIPE_SECRET_KEY` | Stripe secret API key | [Stripe Dashboard → API Keys](https://dashboard.stripe.com/apikeys) |
| `STRIPE_PUBLISHABLE_KEY` | Stripe publishable key | [Stripe Dashboard → API Keys](https://dashboard.stripe.com/apikeys) |
| `STRIPE_WEBHOOK_SECRET` | Webhook signing secret | [Stripe Dashboard → Webhooks](https://dashboard.stripe.com/webhooks) |
| `STRIPE_PRICE_*` | Product price IDs | [Stripe Dashboard → Products](https://dashboard.stripe.com/products) |

## 🎨 Stripe Dashboard Setup

### Step 1: Create Products & Prices

1. Go to [Stripe Products](https://dashboard.stripe.com/products)
2. Click **"+ Add Product"**
3. Create three products:

**Product 1: Basic Gym Membership**
```
Name: Basic Gym Membership
Description: Access to gym facilities during off-peak hours
Price: $29.00 USD
Billing: Recurring - Monthly
```

**Product 2: Premium Gym Membership**
```
Name: Premium Gym Membership
Description: 24/7 gym access + group classes
Prices:
  - $79.00 USD - Monthly
  - $799.00 USD - Yearly (save $149)
```

**Product 3: Elite Gym Membership**
```
Name: Elite Gym Membership
Description: Premium + Personal Training + Spa Access
Price: $149.00 USD
Billing: Recurring - Monthly
```

4. **Copy each Price ID** (starts with `price_`) and add to `.env`

### Step 2: Configure Webhooks

1. Go to [Stripe Webhooks](https://dashboard.stripe.com/webhooks)
2. Click **"Add endpoint"**
3. Enter endpoint URL: `https://yourdomain.com/api/webhooks/stripe`
4. Select these events:
   - ✅ `customer.subscription.created`
   - ✅ `customer.subscription.updated`
   - ✅ `customer.subscription.deleted`
   - ✅ `customer.subscription.trial_will_end`
   - ✅ `invoice.payment_succeeded`
   - ✅ `invoice.payment_failed`
   - ✅ `invoice.upcoming`
   - ✅ `payment_intent.succeeded`
   - ✅ `payment_intent.payment_failed`

5. Click **"Add endpoint"**
6. **Copy the Signing Secret** (starts with `whsec_`) → Add to `.env` as `STRIPE_WEBHOOK_SECRET`

### Step 3: Enable Customer Portal (Optional)

1. Go to [Settings → Billing → Customer Portal](https://dashboard.stripe.com/settings/billing/portal)
2. Enable these features:
   - ✅ Update payment methods
   - ✅ View billing history
   - ✅ Cancel subscriptions
   - ✅ Switch plans (if you want customers to upgrade/downgrade)
3. Click **"Save changes"**

## 📊 Database Schema

### User Model
```typescript
{
  email: String,
  name: String,
  password: String,
  stripeCustomerId: String,
  subscriptionId: String,
  subscriptionStatus: 'active' | 'canceled' | 'past_due' | ...,
  subscriptionPlanId: String,
  subscriptionPlanName: String,
  currentPeriodEnd: Date,
  cancelAtPeriodEnd: Boolean,
  membershipType: 'basic' | 'premium' | 'elite',
  accessLevel: Number (0-3)
}
```

### Subscription Model
```typescript
{
  userId: ObjectId,
  stripeSubscriptionId: String,
  stripeCustomerId: String,
  stripePriceId: String,
  status: String,
  planName: String,
  planType: String,
  billingInterval: String,
  amount: Number,
  currentPeriodStart: Date,
  currentPeriodEnd: Date,
  cancelAtPeriodEnd: Boolean
}
```

## 📡 API Documentation

### Base URL
```
http://localhost:3000/api
```

### Authentication
Most endpoints require a Bearer token:
```
Authorization: Bearer <your_jwt_token>
```

---

### Subscription Endpoints

#### 1. Get Available Plans
```http
GET /subscriptions/plans
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "price_xxxxx",
      "name": "Basic Monthly",
      "type": "basic",
      "amount": 2900,
      "currency": "usd",
      "interval": "month"
    }
  ]
}
```

---

#### 2. Create Subscription
```http
POST /subscriptions/create
Authorization: Bearer <token>
Content-Type: application/json

{
  "priceId": "price_xxxxx",
  "paymentMethodId": "pm_xxxxx",
  "trialDays": 7
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "subscription": {
      "_id": "...",
      "status": "active",
      "planName": "Premium Monthly"
    },
    "clientSecret": "pi_xxx_secret_yyy"
  }
}
```

---

#### 3. Get Subscription Status
```http
GET /subscriptions/status
Authorization: Bearer <token>
```

**Response:**
```json
{
  "success": true,
  "data": {
    "hasSubscription": true,
    "status": "active",
    "planName": "Premium Monthly",
    "currentPeriodEnd": "2025-02-29T...",
    "daysUntilRenewal": 30
  }
}
```

---

#### 4. Cancel Subscription
```http
POST /subscriptions/cancel
Authorization: Bearer <token>
Content-Type: application/json

{
  "immediate": false
}
```

---

#### 5. Resume Subscription
```http
POST /subscriptions/resume
Authorization: Bearer <token>
```

---

#### 6. Change Plan
```http
POST /subscriptions/change-plan
Authorization: Bearer <token>
Content-Type: application/json

{
  "newPriceId": "price_yyyyy"
}
```

---

#### 7. Get Subscription History
```http
GET /subscriptions/history
Authorization: Bearer <token>
```

---

#### 8. Create Customer Portal Session
```http
POST /subscriptions/portal
Authorization: Bearer <token>
Content-Type: application/json

{
  "returnUrl": "https://yourgym.com/dashboard"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "url": "https://billing.stripe.com/session/xxx"
  }
}
```

---

### Webhook Endpoint

#### Stripe Webhook Handler
```http
POST /webhooks/stripe
Content-Type: application/json
stripe-signature: <signature>
```

**Note:** This endpoint is called by Stripe automatically. Do not call manually.

---

## 🔔 Webhook Events

The system handles these webhook events:

| Event | Description | Action |
|-------|-------------|--------|
| `customer.subscription.created` | New subscription created | Update database |
| `customer.subscription.updated` | Subscription modified | Sync changes to DB |
| `customer.subscription.deleted` | Subscription canceled | Mark as canceled |
| `invoice.payment_succeeded` | Payment successful | Update subscription status |
| `invoice.payment_failed` | Payment failed | Set status to past_due |
| `customer.subscription.trial_will_end` | Trial ending in 3 days | Send reminder email |

## 🧪 Testing

### 1. Install Stripe CLI

**macOS:**
```bash
brew install stripe/stripe-cli/stripe
```

**Windows:**
```bash
scoop bucket add stripe https://github.com/stripe/scoop-stripe-cli.git
scoop install stripe
```

**Linux:**
```bash
wget https://github.com/stripe/stripe-cli/releases/download/v1.17.2/stripe_1.17.2_linux_x86_64.tar.gz
tar -xvf stripe_1.17.2_linux_x86_64.tar.gz
sudo mv stripe /usr/local/bin/
```

### 2. Login to Stripe
```bash
stripe login
```

### 3. Forward Webhooks to Local Server
```bash
stripe listen --forward-to localhost:3000/api/webhooks/stripe
```

Copy the webhook signing secret (starts with `whsec_`) and add to `.env`

### 4. Test Stripe Events
```bash
# Test subscription creation
stripe trigger customer.subscription.created

# Test payment success
stripe trigger invoice.payment_succeeded

# Test payment failure
stripe trigger invoice.payment_failed
```

### 5. Stripe Test Cards

| Card Number | Result |
|-------------|--------|
| 4242 4242 4242 4242 | Success |
| 4000 0027 6000 3184 | 3D Secure required |
| 4000 0000 0000 0002 | Declined |
| 4000 0000 0000 9995 | Insufficient funds |

**Expiry:** Any future date (e.g., 12/25)  
**CVC:** Any 3 digits  
**ZIP:** Any 5 digits

### 6. Run the Server

**Development:**
```bash
npm run dev
```

**Production:**
```bash
npm run build
npm start
```

### 7. Test Endpoints with cURL

**Get Plans:**
```bash
curl http://localhost:3000/api/subscriptions/plans
```

**Create Subscription:**
```bash
curl -X POST http://localhost:3000/api/subscriptions/create \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "priceId": "price_xxxxx",
    "paymentMethodId": "pm_xxxxx"
  }'
```

**Get Status:**
```bash
curl http://localhost:3000/api/subscriptions/status \
  -H "Authorization: Bearer YOUR_TOKEN"
```

## 🚢 Deployment

### Prerequisites for Production

1. **Switch to Live Stripe Keys**
   - Replace test keys with live keys in `.env`
   - Update `STRIPE_WEBHOOK_SECRET` with live webhook secret

2. **Update Webhook Endpoint**
   - Go to [Stripe Webhooks](https://dashboard.stripe.com/webhooks)
   - Add production endpoint: `https://api.yourdomain.com/api/webhooks/stripe`

3. **Configure Environment Variables**
   - Set all production environment variables on your hosting platform

### Deploy to Heroku

```bash
# Login to Heroku
heroku login

# Create app
heroku create gym-subscription-api

# Add MongoDB addon
heroku addons:create mongolab:sandbox

# Set environment variables
heroku config:set STRIPE_SECRET_KEY=sk_live_xxxxx
heroku config:set STRIPE_WEBHOOK_SECRET=whsec_xxxxx
# ... set all other env vars

# Deploy
git push heroku main

# Check logs
heroku logs --tail
```

### Deploy to Railway/Render

1. Connect your GitHub repository
2. Add environment variables in dashboard
3. Deploy automatically on push

### Deploy to VPS (Ubuntu)

```bash
# Install Node.js
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install MongoDB
sudo apt install mongodb

# Clone repo
git clone <your-repo>
cd gym-subscription-backend

# Install dependencies
npm install

# Build
npm run build

# Install PM2
npm install -g pm2

# Start with PM2
pm2 start dist/app.js --name gym-api

# Setup nginx reverse proxy
sudo apt install nginx
# Configure nginx to proxy to localhost:3000
```

## 🐛 Troubleshooting

### Issue: Webhook signature verification failed

**Solution:**
- Check `STRIPE_WEBHOOK_SECRET` is correct
- Ensure webhook endpoint is using `express.raw()` middleware
- Verify webhook endpoint is before `express.json()`

```typescript
// ✅ Correct order
app.use('/api/webhooks', webhookRoutes); // Uses raw body
app.use(express.json()); // Other routes use JSON
```

### Issue: Subscription not updating in database

**Solution:**
- Check webhook logs in Stripe Dashboard
- Verify webhook handler is processing events
- Check server logs for errors
- Ensure MongoDB is connected

### Issue: 3D Secure not working

**Solution:**
- Return `clientSecret` from create subscription
- Use `stripe.confirmCardPayment()` on frontend
- Test with card: 4000 0027 6000 3184

### Issue: User loses access immediately after canceling

**Solution:**
- Ensure using `immediate: false` when canceling
- Check `cancelAtPeriodEnd` flag is set correctly
- Verify access control checks `currentPeriodEnd` date

### Issue: Payment failed but user still has access

**Solution:**
- Check webhook for `invoice.payment_failed` is working
- Verify subscription status is updated to `past_due`
- Check access control middleware logic

## 📝 Scripts

Add to `package.json`:

```json
{
  "scripts": {
    "dev": "nodemon src/app.ts",
    "build": "tsc",
    "start": "node dist/app.js",
    "test": "jest",
    "stripe:listen": "stripe listen --forward-to localhost:3000/api/webhooks/stripe"
  }
}
```

## 🔐 Security Best Practices

1. **Never commit `.env` file** - Add to `.gitignore`
2. **Use environment variables** for all secrets
3. **Verify webhook signatures** - Already implemented
4. **Use HTTPS in production** - Required for webhooks
5. **Validate all inputs** - Implement request validation
6. **Rate limiting** - Add rate limiting middleware
7. **CORS configuration** - Configure properly for production

## 📚 Additional Resources

- [Stripe API Documentation](https://stripe.com/docs/api)
- [Stripe Subscriptions Guide](https://stripe.com/docs/billing/subscriptions/overview)
- [Stripe Webhooks Guide](https://stripe.com/docs/webhooks)
- [Stripe Testing](https://stripe.com/docs/testing)

## 📄 License

MIT

## 👥 Support

For issues and questions:
- Create an issue on GitHub
- Email: usamakaleem505@gmail.com
- Stripe Support: https://support.stripe.com

---

