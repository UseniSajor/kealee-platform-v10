# Stripe Webhook Setup Guide

## 🔔 **Webhook Configuration**

### **1. Configure Webhook Endpoint in Stripe Dashboard**

**URL:** `https://your-api-domain.up.railway.app/webhooks/stripe`

**Example:** `https://kealee-platform-v10-production.up.railway.app/webhooks/stripe`

---

## 📋 **Events to Subscribe To**

In Stripe Dashboard → Webhooks → Add endpoint → Select events:

### **Subscription Events:**
```
✅ customer.subscription.created
✅ customer.subscription.updated
✅ customer.subscription.deleted
✅ customer.subscription.trial_will_end
```

### **Payment Events:**
```
✅ invoice.paid
✅ invoice.payment_failed
✅ invoice.payment_action_required
✅ payment_intent.succeeded
✅ payment_intent.payment_failed
```

### **Customer Events (Optional):**
```
✅ customer.created
✅ customer.updated
✅ customer.deleted
```

### **Checkout Events (Optional):**
```
✅ checkout.session.completed
✅ checkout.session.expired
```

---

## 🔐 **Environment Variables**

Add to Railway:

```env
# Stripe API Keys
STRIPE_SECRET_KEY=sk_live_...
STRIPE_PUBLISHABLE_KEY=pk_live_...

# Webhook Secret (from Stripe Dashboard after creating webhook)
STRIPE_WEBHOOK_SECRET=whsec_...
```

Add to Vercel (frontend apps):

```env
# Only the publishable key for frontend
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_...

# App URL for redirects
NEXT_PUBLIC_APP_URL=https://kealee-ops-services.vercel.app
```

---

## 🧪 **Testing Webhooks Locally**

### **Option 1: Stripe CLI (Recommended)**

```bash
# Install Stripe CLI
# Windows (using Scoop)
scoop install stripe

# Mac (using Homebrew)
brew install stripe/stripe-cli/stripe

# Login to Stripe
stripe login

# Forward webhooks to localhost
stripe listen --forward-to localhost:3001/webhooks/stripe

# This will give you a webhook signing secret like:
# whsec_xxx... (use this for local testing)

# Test specific events
stripe trigger customer.subscription.created
stripe trigger invoice.paid
stripe trigger payment_intent.succeeded
```

### **Option 2: ngrok (Alternative)**

```bash
# Install ngrok
# https://ngrok.com/download

# Start ngrok tunnel
ngrok http 3001

# Copy the HTTPS URL (e.g., https://abc123.ngrok.io)
# Add to Stripe Dashboard webhooks: https://abc123.ngrok.io/webhooks/stripe
```

---

## 📊 **Webhook Event Handlers**

### **What Each Handler Does:**

#### **`customer.subscription.created`**
- ✅ Create subscription record in database
- ✅ Provision access to services
- ✅ Send welcome email
- ✅ Update user role/permissions

#### **`customer.subscription.updated`**
- ✅ Update subscription in database
- ✅ Handle plan upgrades/downgrades
- ✅ Update access permissions
- ✅ Send notification email

#### **`customer.subscription.deleted`**
- ✅ Mark subscription as canceled
- ✅ Revoke access to services
- ✅ Send cancellation confirmation
- ✅ Schedule data retention cleanup

#### **`invoice.paid`**
- ✅ Record payment in database
- ✅ Extend subscription period
- ✅ Send receipt email
- ✅ Update billing dashboard

#### **`invoice.payment_failed`**
- ✅ Mark subscription as past_due
- ✅ Send payment failure notification
- ✅ Retry payment (Stripe handles this)
- ✅ Grace period before access revocation

#### **`payment_intent.succeeded`**
- ✅ Record one-time payment
- ✅ Provision service (e.g., permit acceleration)
- ✅ Send confirmation
- ✅ Update project status

#### **`payment_intent.payment_failed`**
- ✅ Log failed payment
- ✅ Notify user
- ✅ Provide retry option

---

## 🛠️ **Implementation Checklist**

### **Backend (Railway API):**

- [ ] Add webhook route to API
- [ ] Configure raw body parser for signature verification
- [ ] Add `STRIPE_WEBHOOK_SECRET` to environment variables
- [ ] Implement event handlers
- [ ] Add database models for subscriptions/payments
- [ ] Test webhook locally with Stripe CLI
- [ ] Deploy to Railway
- [ ] Configure webhook in Stripe Dashboard

### **Frontend (Vercel Apps):**

- [ ] Create pricing page with package cards
- [ ] Implement checkout session API route
- [ ] Add success/cancel pages
- [ ] Add `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`
- [ ] Add `NEXT_PUBLIC_APP_URL`
- [ ] Test checkout flow
- [ ] Deploy to Vercel

### **Database:**

- [ ] Create `subscriptions` table
- [ ] Create `payments` table
- [ ] Add indexes for Stripe IDs
- [ ] Run migrations

---

## 🗄️ **Database Schema**

### **Subscriptions Table:**

```prisma
model Subscription {
  id                    String    @id @default(cuid())
  userId                String
  user                  User      @relation(fields: [userId], references: [id])
  
  stripeSubscriptionId  String    @unique
  stripeCustomerId      String
  stripePriceId         String
  
  status                String    // active, past_due, canceled, etc.
  packageId             String    // A, B, C, D
  
  currentPeriodStart    DateTime
  currentPeriodEnd      DateTime
  cancelAtPeriodEnd     Boolean   @default(false)
  canceledAt            DateTime?
  
  createdAt             DateTime  @default(now())
  updatedAt             DateTime  @updatedAt
  
  @@index([userId])
  @@index([stripeCustomerId])
  @@index([status])
}
```

### **Payments Table:**

```prisma
model Payment {
  id                     String    @id @default(cuid())
  userId                 String?
  user                   User?     @relation(fields: [userId], references: [id])
  
  stripePaymentIntentId  String    @unique
  stripeInvoiceId        String?
  
  amount                 Int       // in cents
  currency               String    @default("usd")
  status                 String    // succeeded, failed, pending
  
  paidAt                 DateTime?
  metadata               Json?
  
  createdAt              DateTime  @default(now())
  
  @@index([userId])
  @@index([status])
}
```

---

## 🧪 **Testing Checklist**

### **Test Subscription Flow:**

```bash
# 1. Create subscription (via checkout)
stripe trigger customer.subscription.created

# 2. Verify in database
# Check that subscription record exists

# 3. Simulate successful payment
stripe trigger invoice.paid

# 4. Check that payment is recorded

# 5. Simulate payment failure
stripe trigger invoice.payment_failed

# 6. Verify subscription status changes to past_due

# 7. Cancel subscription
stripe trigger customer.subscription.deleted

# 8. Verify subscription is canceled and access revoked
```

---

## 📊 **Monitoring Webhooks**

### **In Stripe Dashboard:**

1. Go to **Developers → Webhooks**
2. Click on your webhook endpoint
3. View **Events log** to see:
   - ✅ Successful deliveries
   - ❌ Failed deliveries
   - 🔄 Retry attempts

### **In Your Application:**

```typescript
// Log all webhook events
console.log('Webhook received:', {
  type: event.type,
  id: event.id,
  created: new Date(event.created * 1000),
});

// Add to monitoring service (e.g., Sentry, LogRocket)
```

---

## 🚨 **Error Handling**

### **Webhook Failures:**

Stripe will retry failed webhooks automatically:
- First retry: 1 hour later
- Second retry: 2 hours later
- Third retry: 4 hours later
- Continues with exponential backoff

### **Best Practices:**

1. ✅ **Return 200 quickly** - Process events asynchronously
2. ✅ **Verify signature** - Always validate webhook signature
3. ✅ **Handle idempotency** - Same event may be sent multiple times
4. ✅ **Log everything** - Keep detailed logs for debugging
5. ✅ **Monitor failures** - Set up alerts for failed webhooks

---

## 📞 **Support & Troubleshooting**

### **Common Issues:**

**Issue:** Webhook signature verification fails
**Solution:** Check that `STRIPE_WEBHOOK_SECRET` matches Stripe Dashboard

**Issue:** Events not being received
**Solution:** Verify webhook URL is correct and accessible

**Issue:** Duplicate events
**Solution:** Implement idempotency using `event.id`

### **Testing Tools:**

- **Stripe CLI:** https://stripe.com/docs/stripe-cli
- **Webhook Testing:** https://dashboard.stripe.com/test/webhooks
- **API Logs:** https://dashboard.stripe.com/test/logs

---

## ✅ **Production Checklist**

Before going live:

- [ ] Test all webhook events in test mode
- [ ] Verify database records are created correctly
- [ ] Test email notifications
- [ ] Monitor webhook delivery success rate
- [ ] Set up error alerting
- [ ] Document webhook handling procedures
- [ ] Test rollback procedures
- [ ] Switch to live mode webhook endpoint
- [ ] Update `STRIPE_WEBHOOK_SECRET` with live secret
- [ ] Monitor initial live transactions closely

---

**Webhook endpoint:** `https://your-api.up.railway.app/webhooks/stripe`  
**Documentation:** https://stripe.com/docs/webhooks
