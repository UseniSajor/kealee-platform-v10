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
