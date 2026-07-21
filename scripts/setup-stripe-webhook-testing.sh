#!/bin/bash
# setup-stripe-webhook-testing.sh
# Sets up Stripe webhook testing environment

set -e

echo "💳 Setting up Stripe webhook testing..."

# 1. Install Stripe CLI if not present
if ! command -v stripe &> /dev/null; then
  echo "Installing Stripe CLI..."
  if [[ "$OSTYPE" == "darwin"* ]]; then
    # macOS
    brew install stripe/stripe-cli/stripe
  elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
    # Linux
    curl -fsSL https://raw.githubusercontent.com/stripe/stripe-cli/master/install.sh | sh
  else
    echo "⚠️  Please install Stripe CLI manually: https://stripe.com/docs/stripe-cli"
    exit 1
  fi
fi

# 2. Login to Stripe
echo ""
echo "📝 Logging into Stripe..."
echo "   This will open a browser for authentication."
stripe login --interactive

# 3. Get webhook secret from existing endpoint or create new one
echo ""
echo "🔍 Checking for existing webhook endpoints..."
WEBHOOK_URL="https://api.kealee.com/billing/stripe/webhook"

# List existing endpoints
EXISTING_ENDPOINTS=$(stripe webhook_endpoints list --limit=10 2>/dev/null || echo "")

if echo "$EXISTING_ENDPOINTS" | grep -q "$WEBHOOK_URL"; then
  echo "✅ Webhook endpoint already exists: $WEBHOOK_URL"
  echo "   Getting webhook secret..."
  WEBHOOK_SECRET=$(stripe webhook_endpoints list --limit=10 | jq -r '.data[] | select(.url == "'"$WEBHOOK_URL"'") | .secret' | head -1)
  
  if [ -z "$WEBHOOK_SECRET" ] || [ "$WEBHOOK_SECRET" == "null" ]; then
    echo "⚠️  Could not retrieve webhook secret. Please get it from Stripe Dashboard:"
    echo "   https://dashboard.stripe.com/webhooks"
    echo ""
    read -p "Enter webhook secret (whsec_...): " WEBHOOK_SECRET
  fi
else
  echo "📝 Creating new webhook endpoint..."
  echo "   URL: $WEBHOOK_URL"
  
  # Create webhook endpoint
  ENDPOINT_OUTPUT=$(stripe webhook_endpoints create \
    --url="$WEBHOOK_URL" \
    --description="Production webhooks for Kealee Platform" \
    --enabled-events="checkout.session.completed,customer.subscription.created,customer.subscription.updated,customer.subscription.deleted,invoice.paid,invoice.payment_failed,payment_intent.succeeded,payment_intent.payment_failed" \
    2>&1)
  
  if [ $? -eq 0 ]; then
    WEBHOOK_SECRET=$(echo "$ENDPOINT_OUTPUT" | jq -r '.secret' 2>/dev/null || echo "")
    
    if [ -z "$WEBHOOK_SECRET" ] || [ "$WEBHOOK_SECRET" == "null" ]; then
      echo "⚠️  Webhook endpoint created, but secret not found in output."
      echo "   Please get the secret from Stripe Dashboard:"
      echo "   https://dashboard.stripe.com/webhooks"
      echo ""
      read -p "Enter webhook secret (whsec_...): " WEBHOOK_SECRET
    else
      echo "✅ Webhook endpoint created successfully!"
    fi
  else
    echo "❌ Failed to create webhook endpoint:"
    echo "$ENDPOINT_OUTPUT"
    echo ""
    echo "Please create it manually in Stripe Dashboard:"
    echo "   https://dashboard.stripe.com/webhooks"
    echo ""
    read -p "Enter webhook secret (whsec_...): " WEBHOOK_SECRET
  fi
fi

# 4. Display webhook secret
echo ""
echo "🔑 Webhook Secret:"
echo "   $WEBHOOK_SECRET"
echo ""
echo "⚠️  IMPORTANT: Save this secret securely!"
echo "   Add it to your environment variables:"
echo "   export STRIPE_WEBHOOK_SECRET=\"$WEBHOOK_SECRET\""
echo ""

# 5. Update environment variables (if VERCEL_TOKEN is set)
if [ -n "$VERCEL_TOKEN" ]; then
  echo "📝 Updating Vercel environment variables..."
  for app in m-ops-services m-project-owner; do
    echo "   Updating $app..."
    vercel env add STRIPE_WEBHOOK_SECRET "$WEBHOOK_SECRET" production --token="$VERCEL_TOKEN" --yes 2>/dev/null || \
    vercel env rm STRIPE_WEBHOOK_SECRET production --token="$VERCEL_TOKEN" --yes 2>/dev/null && \
    vercel env add STRIPE_WEBHOOK_SECRET "$WEBHOOK_SECRET" production --token="$VERCEL_TOKEN" --yes || \
    echo "   ⚠️  Failed to update $app (may need manual update)"
  done
else
  echo "ℹ️  VERCEL_TOKEN not set. Skipping Vercel environment variable updates."
  echo "   Update manually in Vercel Dashboard or set VERCEL_TOKEN environment variable."
fi

# 6. Create test script
echo ""
echo "📝 Creating test script..."
cat > scripts/test-stripe-webhooks.sh << 'TESTSCRIPT'
#!/bin/bash
# test-stripe-webhooks.sh
# Tests Stripe webhooks locally using Stripe CLI

set -e

API_URL="${API_URL:-http://localhost:3001}"
WEBHOOK_ENDPOINT="$API_URL/billing/stripe/webhook"

echo "🧪 Testing Stripe webhooks..."
echo "   API URL: $API_URL"
echo "   Webhook Endpoint: $WEBHOOK_ENDPOINT"
echo ""

# Check if Stripe CLI is installed
if ! command -v stripe &> /dev/null; then
  echo "❌ Stripe CLI not found. Please install it first:"
  echo "   https://stripe.com/docs/stripe-cli"
  exit 1
fi

# Check if API is running
if ! curl -s "$API_URL/health" > /dev/null 2>&1; then
  echo "⚠️  API not responding at $API_URL"
  echo "   Make sure the API is running before testing webhooks."
  echo ""
  read -p "Continue anyway? (y/N): " -n 1 -r
  echo
  if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    exit 1
  fi
fi

# Start webhook listener in background
echo "📡 Starting webhook listener..."
echo "   Forwarding to: $WEBHOOK_ENDPOINT"
echo ""
echo "   Note: The listener will run in the background."
echo "   Press Ctrl+C to stop testing."
echo ""

stripe listen --forward-to "$WEBHOOK_ENDPOINT" &
LISTENER_PID=$!

# Wait for listener to start
sleep 3

# Check if listener is still running
if ! kill -0 $LISTENER_PID 2>/dev/null; then
  echo "❌ Failed to start webhook listener"
  exit 1
fi

echo "✅ Webhook listener started (PID: $LISTENER_PID)"
echo ""

# Function to test an event
test_event() {
  local event_type=$1
  echo "🧪 Testing $event_type..."
  stripe trigger "$event_type" || echo "⚠️  Failed to trigger $event_type"
  sleep 2
}

# Test events
echo "📨 Triggering test events..."
echo ""

test_event "checkout.session.completed"
test_event "customer.subscription.created"
test_event "customer.subscription.updated"
test_event "invoice.payment_failed"
test_event "payment_intent.succeeded"

echo ""
echo "✅ Test events sent!"
echo ""
echo "📊 Check the following:"
echo "   1. API logs for webhook processing"
echo "   2. Database for created/updated records"
echo "   3. Stripe CLI output above for forwarding status"
echo ""

# Clean up
echo "🛑 Stopping webhook listener..."
kill $LISTENER_PID 2>/dev/null || true
wait $LISTENER_PID 2>/dev/null || true

echo "✅ Webhook testing completed!"
TESTSCRIPT

chmod +x scripts/test-stripe-webhooks.sh
echo "✅ Test script created: scripts/test-stripe-webhooks.sh"

# 7. Create webhook verification utility
echo ""
echo "📝 Creating webhook verification utility..."
cat > services/api/src/utils/verify-webhook-signature.ts << 'VERIFYSCRIPT'
/**
 * Webhook Signature Verification Utility
 * Provides functions for verifying Stripe webhook signatures
 */

import crypto from 'crypto'
import Stripe from 'stripe'
import { getStripe } from '../modules/billing/stripe.client'

/**
 * Verify webhook signature
 * @param payload - Raw webhook payload (string or Buffer)
 * @param signature - Stripe signature header
 * @param secret - Webhook signing secret
 * @returns Verification result with event if valid
 */
export async function verifyWebhookSignature(
  payload: string | Buffer,
  signature: string,
  secret: string
): Promise<{ valid: boolean; event?: Stripe.Event; error?: string }> {
  try {
    const stripe = getStripe()
    const buf = Buffer.isBuffer(payload) ? payload : Buffer.from(payload, 'utf8')
    
    const event = stripe.webhooks.constructEvent(buf, signature, secret)
    
    // Additional security checks
    const tolerance = 300 // 5 minutes
    const timestamp = extractTimestamp(signature)
    const currentTime = Math.floor(Date.now() / 1000)
    
    if (Math.abs(currentTime - timestamp) > tolerance) {
      return {
        valid: false,
        error: 'Webhook timestamp outside tolerance window (5 minutes)',
      }
    }
    
    return { valid: true, event }
  } catch (error: any) {
    return {
      valid: false,
      error: error.message || 'Signature verification failed',
    }
  }
}

/**
 * Extract timestamp from Stripe signature
 * @param signature - Stripe signature header (format: t=timestamp,v1=signature)
 * @returns Unix timestamp
 */
export function extractTimestamp(signature: string): number {
  const parts = signature.split(',')
  for (const part of parts) {
    if (part.startsWith('t=')) {
      const timestamp = parseInt(part.substring(2), 10)
      if (isNaN(timestamp)) {
        throw new Error('Invalid timestamp in signature')
      }
      return timestamp
    }
  }
  throw new Error('No timestamp found in signature')
}

/**
 * Test webhook verification (for development/testing)
 */
export async function testWebhookVerification(): Promise<void> {
  const secret = process.env.STRIPE_WEBHOOK_SECRET
  if (!secret) {
    throw new Error('STRIPE_WEBHOOK_SECRET environment variable is required')
  }

  const testPayload = JSON.stringify({
    id: 'evt_test_123',
    type: 'checkout.session.completed',
    data: {
      object: {
        id: 'cs_test_123',
        object: 'checkout.session',
      },
    },
  })

  const timestamp = Math.floor(Date.now() / 1000)
  const signedPayload = `${timestamp}.${testPayload}`
  const signature = crypto
    .createHmac('sha256', secret)
    .update(signedPayload, 'utf8')
    .digest('hex')

  const fullSignature = `t=${timestamp},v1=${signature}`

  const result = await verifyWebhookSignature(testPayload, fullSignature, secret)
  
  if (result.valid) {
    console.log('✅ Webhook verification test passed')
  } else {
    console.error('❌ Webhook verification test failed:', result.error)
  }
}

// Run test if executed directly
if (require.main === module) {
  testWebhookVerification().catch(console.error)
}
VERIFYSCRIPT

echo "✅ Verification utility created: services/api/src/utils/verify-webhook-signature.ts"

# 8. Summary
echo ""
echo "✅ Stripe webhook testing setup complete!"
echo ""
echo "📋 Next steps:"
echo "   1. Add STRIPE_WEBHOOK_SECRET to your environment:"
echo "      export STRIPE_WEBHOOK_SECRET=\"$WEBHOOK_SECRET\""
echo ""
echo "   2. For local testing, run:"
echo "      ./scripts/test-stripe-webhooks.sh"
echo ""
echo "   3. For production testing, verify webhook endpoint in Stripe Dashboard:"
echo "      https://dashboard.stripe.com/webhooks"
echo ""
echo "   4. Monitor webhook deliveries in Stripe Dashboard"
echo ""
