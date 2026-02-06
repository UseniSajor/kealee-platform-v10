# Payment Processing Testing Guide

This guide explains how to test payment processing functionality in the Kealee Platform.

## Quick Start

### Run Payment Tests

```bash
# Unix/Linux/macOS
./scripts/test-payment-processing.sh

# Windows PowerShell
.\scripts\test-payment-processing.ps1
```

### With Custom Configuration

```bash
# Set environment variables
export API_URL="http://localhost:3001"
export FRONTEND_URL="http://localhost:3005"
export TEST_AUTH_TOKEN="your_token_here"
export TEST_ORG_ID="your_org_id_here"

# Run tests
./scripts/test-payment-processing.sh
```

## Prerequisites

### 1. Start Services

```bash
# Terminal 1: Start API server
cd services/api
pnpm dev

# Terminal 2: Start frontend
cd apps/m-ops-services
pnpm dev
```

### 2. Environment Variables

Ensure these are set in your `.env.local` files:

**API Service (`services/api/.env.local`):**
```env
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
DATABASE_URL=postgresql://...
SUPABASE_URL=...
SUPABASE_ANON_KEY=...
```

**Frontend (`apps/m-ops-services/.env.local`):**
```env
NEXT_PUBLIC_API_URL=http://localhost:3001
STRIPE_SECRET_KEY=sk_test_...
```

### 3. Authentication Token

For authenticated tests, you need a valid auth token:

```bash
# Get token from login endpoint
curl -X POST http://localhost:3001/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password"}'

# Export token
export TEST_AUTH_TOKEN="your_token_here"
```

## Test Coverage

### Automated Tests

The test script performs the following checks:

1. **API Health Check**
   - Verifies API server is running
   - Checks `/health` endpoint

2. **Frontend Health Check**
   - Verifies frontend is running
   - Checks basic connectivity

3. **Authentication**
   - Validates auth token if provided
   - Tests authenticated endpoints

4. **Billing Plans**
   - Tests `/api/v1/billing/plans` endpoint
   - Verifies plans are returned

5. **Checkout Session Creation**
   - Tests `/api/v1/billing/stripe/checkout-session`
   - Creates a test checkout session
   - Validates session URL and ID

6. **Webhook Endpoint**
   - Tests `/api/v1/billing/stripe/webhook`
   - Verifies endpoint is accessible
   - Tests webhook signature validation

7. **Subscription Management**
   - Tests `/api/v1/billing/subscriptions`
   - Lists user subscriptions
   - Verifies subscription data

8. **Webhook Status**
   - Tests `/api/v1/webhooks/status`
   - Checks recent webhook events
   - Validates webhook processing

9. **Webhook Trigger**
   - Tests `/api/v1/webhooks/test`
   - Triggers test webhook events
   - Validates webhook handling

10. **Frontend Checkout**
    - Tests `/api/create-checkout` route
    - Validates checkout flow

11. **Environment Variables**
    - Checks required env vars are set
    - Validates configuration

12. **Performance**
    - Measures API response time
    - Flags slow responses

## Manual Testing

### 1. Test Checkout Flow

```bash
# Create checkout session
curl -X POST http://localhost:3001/api/v1/billing/stripe/checkout-session \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TEST_AUTH_TOKEN" \
  -d '{
    "orgId": "your_org_id",
    "planSlug": "package_b",
    "interval": "month",
    "successUrl": "http://localhost:3005/success",
    "cancelUrl": "http://localhost:3005/cancel"
  }'

# Open the returned URL in browser
# Complete checkout with test card: 4242 4242 4242 4242
```

### 2. Test Webhooks with Stripe CLI

```bash
# Install Stripe CLI
# macOS: brew install stripe/stripe-cli/stripe
# Linux: See https://stripe.com/docs/stripe-cli

# Login to Stripe
stripe login

# Forward webhooks to local server
stripe listen --forward-to http://localhost:3001/api/v1/billing/stripe/webhook

# In another terminal, trigger test events
stripe trigger checkout.session.completed
stripe trigger invoice.payment_failed
stripe trigger customer.subscription.updated
```

### 3. Verify Database Updates

After webhook events, verify database records:

```sql
-- Check subscriptions
SELECT * FROM "ServicePlan" ORDER BY "createdAt" DESC LIMIT 5;

-- Check audit logs
SELECT * FROM "AuditLog" 
WHERE "action" LIKE '%WEBHOOK%' 
ORDER BY "createdAt" DESC LIMIT 10;
```

### 4. Test Subscription Lifecycle

```bash
# Get subscription ID
SUBSCRIPTION_ID="sub_..."

# Update subscription
curl -X PATCH http://localhost:3001/api/v1/billing/subscriptions/$SUBSCRIPTION_ID \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TEST_AUTH_TOKEN" \
  -d '{
    "status": "cancelled"
  }'

# Verify cancellation
curl http://localhost:3001/api/v1/billing/subscriptions/$SUBSCRIPTION_ID \
  -H "Authorization: Bearer $TEST_AUTH_TOKEN"
```

## Test Cards

Use these Stripe test cards:

- **Success:** `4242 4242 4242 4242`
- **Decline:** `4000 0000 0000 0002`
- **3D Secure:** `4000 0025 0000 3155`
- **Requires Auth:** `4000 0027 6000 3184`

## Common Issues

### API Not Reachable

```bash
# Check if API is running
curl http://localhost:3001/health

# Check port
lsof -i :3001  # macOS/Linux
netstat -ano | findstr :3001  # Windows
```

### Authentication Failures

```bash
# Verify token is valid
curl http://localhost:3001/api/v1/auth/me \
  -H "Authorization: Bearer $TEST_AUTH_TOKEN"

# Get new token
curl -X POST http://localhost:3001/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password"}'
```

### Webhook Signature Validation

Webhooks require valid Stripe signatures. When testing locally:

1. Use Stripe CLI to forward webhooks (automatically signs them)
2. Or disable signature validation in test mode (not recommended for production)

### Database Connection Issues

```bash
# Check database connection
cd packages/database
pnpm prisma db pull

# Run migrations
pnpm prisma migrate dev
```

## Integration Testing

### Full Payment Flow Test

1. **Create Organization**
   ```bash
   curl -X POST http://localhost:3001/api/v1/orgs \
     -H "Authorization: Bearer $TEST_AUTH_TOKEN" \
     -d '{"name":"Test Org"}'
   ```

2. **Create Checkout Session**
   ```bash
   curl -X POST http://localhost:3001/api/v1/billing/stripe/checkout-session \
     -H "Authorization: Bearer $TEST_AUTH_TOKEN" \
     -d '{"orgId":"...","planSlug":"package_b","interval":"month",...}'
   ```

3. **Complete Checkout** (in browser with test card)

4. **Verify Webhook Processing**
   ```bash
   curl http://localhost:3001/api/v1/webhooks/status \
     -H "Authorization: Bearer $TEST_AUTH_TOKEN"
   ```

5. **Verify Subscription Created**
   ```bash
   curl http://localhost:3001/api/v1/billing/subscriptions \
     -H "Authorization: Bearer $TEST_AUTH_TOKEN"
   ```

## Performance Testing

### Load Test Checkout Endpoint

```bash
# Using Apache Bench
ab -n 100 -c 10 -H "Authorization: Bearer $TEST_AUTH_TOKEN" \
  -p checkout.json -T application/json \
  http://localhost:3001/api/v1/billing/stripe/checkout-session
```

### Monitor Webhook Processing

```bash
# Watch webhook logs
tail -f services/api/logs/webhook.log

# Or check audit logs
psql $DATABASE_URL -c "SELECT * FROM \"AuditLog\" WHERE \"action\" LIKE '%WEBHOOK%' ORDER BY \"createdAt\" DESC LIMIT 20;"
```

## Best Practices

1. **Always use test mode** for local development
2. **Use Stripe CLI** for webhook testing
3. **Verify database state** after each test
4. **Check audit logs** for webhook processing
5. **Test error scenarios** (payment failures, cancellations)
6. **Monitor performance** (response times, database queries)

## Troubleshooting

### Webhook Not Processing

1. Check webhook signature is valid
2. Verify `STRIPE_WEBHOOK_SECRET` is set correctly
3. Check webhook endpoint logs
4. Verify database connection

### Subscription Not Created

1. Check webhook was received
2. Verify webhook processing logs
3. Check database for subscription record
4. Verify organization exists

### Checkout Session Fails

1. Verify Stripe keys are set
2. Check plan slug is valid
3. Verify organization exists
4. Check authentication token

## Support

For payment processing issues:
1. Check Stripe Dashboard for events
2. Review API logs
3. Check database audit logs
4. Verify environment variables
5. Test with Stripe CLI
