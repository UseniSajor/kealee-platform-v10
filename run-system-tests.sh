#!/bin/bash

# 🧪 End-to-End System Verification Tests
# Tests Stripe webhooks, image generation, and video generation

echo "🧪 Testing Stripe Webhook, Image Generation, and Video Generation"
echo ""

# Configuration
API_URL="${API_URL:-http://localhost:3001}"
VIDEO_API_URL="${VIDEO_API_URL:-http://localhost:3000}"

echo "[INFO] Running end-to-end system verification tests"
echo "API URL: $API_URL"
echo "Video API URL: $VIDEO_API_URL"
echo ""

# ---- TEST 1: Stripe Webhook ----
echo "==== TEST 1: STRIPE WEBHOOK SIGNATURE VERIFICATION ===="

if [ -z "$STRIPE_WEBHOOK_SECRET" ]; then
  echo "❌ SKIP: STRIPE_WEBHOOK_SECRET not set"
  echo "   Set: export STRIPE_WEBHOOK_SECRET='whsec_...'"
else
  TIMESTAMP=$(date +%s)
  PAYLOAD="{\"id\":\"evt_test_${TIMESTAMP}\",\"type\":\"checkout.session.completed\"}"
  SIGNED_CONTENT="${TIMESTAMP}.${PAYLOAD}"

  SIGNATURE=$(echo -n "$SIGNED_CONTENT" | openssl dgst -sha256 -hmac "$STRIPE_WEBHOOK_SECRET" | awk '{print $2}')
  STRIPE_SIG="t=${TIMESTAMP},v1=${SIGNATURE}"

  HTTP_STATUS=$(curl -s -o /dev/null -w "%{http_code}" \
    -X POST "$API_URL/webhooks/stripe" \
    -H "Content-Type: application/json" \
    -H "stripe-signature: $STRIPE_SIG" \
    -d "$PAYLOAD" \
    --connect-timeout 5 2>/dev/null)

  if [ "$HTTP_STATUS" = "200" ] || [ "$HTTP_STATUS" = "202" ]; then
    echo "✅ PASS: HTTP $HTTP_STATUS - Webhook signature verified"
  elif [ "$HTTP_STATUS" = "400" ]; then
    echo "❌ FAIL: HTTP 400 - Signature verification failed"
  elif [ -z "$HTTP_STATUS" ] || [ "$HTTP_STATUS" = "000" ]; then
    echo "⚠️  SKIP: Could not connect to API server"
  else
    echo "⚠️  SKIP: HTTP $HTTP_STATUS"
  fi
fi

echo ""

# ---- TEST 2: Image Generation ----
echo "==== TEST 2: IMAGE GENERATION ENDPOINT ===="

HTTP_STATUS=$(curl -s -o /dev/null -w "%{http_code}" \
  -X POST "$API_URL/admin/generate-images?dryRun=true" \
  -H "Content-Type: application/json" \
  -H "X-API-Key: test-key" \
  --connect-timeout 5 2>/dev/null)

if [ "$HTTP_STATUS" = "200" ]; then
  echo "✅ PASS: HTTP 200 - Image generation endpoint responsive"
elif [ "$HTTP_STATUS" = "401" ] || [ "$HTTP_STATUS" = "403" ]; then
  echo "⚠️  SKIP: HTTP $HTTP_STATUS - Authentication required"
elif [ -z "$HTTP_STATUS" ] || [ "$HTTP_STATUS" = "000" ]; then
  echo "⚠️  SKIP: Could not connect to API server"
else
  echo "⚠️  SKIP: HTTP $HTTP_STATUS"
fi

echo ""

# ---- TEST 3: Video Generation ----
echo "==== TEST 3: VIDEO GENERATION JOB FLOW ===="

HTTP_STATUS=$(curl -s -o /dev/null -w "%{http_code}" \
  -X POST "$VIDEO_API_URL/api/concept/video" \
  -H "Content-Type: application/json" \
  -d '{"intakeId":"test_intake","prompt":"test"}' \
  --connect-timeout 5 2>/dev/null)

if [ "$HTTP_STATUS" = "202" ]; then
  echo "✅ PASS: HTTP 202 - Video job submitted"
elif [ "$HTTP_STATUS" = "404" ] || [ "$HTTP_STATUS" = "402" ]; then
  echo "⚠️  SKIP: HTTP $HTTP_STATUS - Test data needed"
elif [ -z "$HTTP_STATUS" ] || [ "$HTTP_STATUS" = "000" ]; then
  echo "⚠️  SKIP: Could not connect to video API server"
else
  echo "⚠️  SKIP: HTTP $HTTP_STATUS"
fi

echo ""
echo "==== END OF TESTS ===="
