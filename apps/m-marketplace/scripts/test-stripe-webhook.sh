#!/bin/bash

# Test Stripe Webhook Handler
# Usage: ./scripts/test-stripe-webhook.sh [local|staging|production]

set -e

ENVIRONMENT=${1:-local}
API_URL=""

case $ENVIRONMENT in
    local)
        API_URL="http://localhost:3001"
        ;;
    staging)
        API_URL="https://api-staging.kealee.com"
        ;;
    production)
        API_URL="https://api.kealee.com"
        ;;
    *)
        echo "Unknown environment: $ENVIRONMENT"
        echo "Usage: ./scripts/test-stripe-webhook.sh [local|staging|production]"
        exit 1
        ;;
esac

echo "Testing Stripe webhook handler at: $API_URL/billing/stripe/webhook"
echo ""

# Check if Stripe CLI is installed
if ! command -v stripe &> /dev/null; then
    echo "❌ Stripe CLI not found. Install with:"
    echo "   brew install stripe/stripe-cli/stripe  # macOS"
    echo "   or download from https://stripe.com/docs/stripe-cli"
    exit 1
fi

# Check if logged in
if ! stripe config --list &> /dev/null; then
    echo "⚠️  Not logged in to Stripe CLI. Running: stripe login"
    stripe login
fi

echo "✅ Stripe CLI ready"
echo ""

# Test webhook endpoint
echo "Testing webhook endpoint..."
echo "1. Starting webhook listener..."
echo "2. Forwarding events to: $API_URL/billing/stripe/webhook"
echo ""
echo "Press Ctrl+C to stop"
echo ""

# Forward webhooks
stripe listen --forward-to "$API_URL/billing/stripe/webhook"
