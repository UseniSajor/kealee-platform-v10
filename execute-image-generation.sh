#!/bin/bash

# 🎨 162 Image Generation Execution Script
# Run this AFTER adding variables to Railway
# Usage: bash execute-image-generation.sh

set -e

ADMIN_KEY="2963f446c99b44278525daff14bc7bac"
API_URL="https://arstic-kindness.up.railway.app"

echo ""
echo "🎯 KEALEE IMAGE GENERATION EXECUTION"
echo "===================================="
echo ""

# ─────────────────────────────────────────────────────────────────────────────
# Step 1: Test Authentication
# ─────────────────────────────────────────────────────────────────────────────

echo "📋 Step 1: Testing Authentication..."
echo ""

AUTH_TEST=$(curl -s -X POST "${API_URL}/admin/generate-images?dryRun=true" \
  -H "X-API-Key=${ADMIN_KEY}")

if echo "$AUTH_TEST" | grep -q "DRY RUN"; then
  echo "✅ Authentication successful!"
  echo ""
  echo "Generation plan:"
  echo "$AUTH_TEST" | grep -o '"productsCount":[^,]*' || true
  echo "$AUTH_TEST" | grep -o '"totalImages":[^,]*' || true
  echo "$AUTH_TEST" | grep -o '"estimatedCost":[^}]*' || true
  echo ""
else
  echo "❌ Authentication failed!"
  echo "Response: $AUTH_TEST"
  echo ""
  echo "⚠️  Troubleshooting:"
  echo "1. Verify ADMIN_API_KEY in Railway = 2963f446c99b44278525daff14bc7bac"
  echo "2. Wait 3-5 minutes for Railway redeploy"
  echo "3. Check Railway logs for errors"
  exit 1
fi

# ─────────────────────────────────────────────────────────────────────────────
# Step 2: Confirm Execution
# ─────────────────────────────────────────────────────────────────────────────

echo "⚠️  ABOUT TO GENERATE 162 IMAGES (Cost: ~\$6.50)"
echo ""
echo "This will:"
echo "  • Generate 27 products × 6 images each"
echo "  • Take 30-45 minutes"
echo "  • Cost approximately \$6.50 in DALL-E 3 credits"
echo ""
read -p "Continue? (y/n) " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
  echo "Cancelled."
  exit 1
fi

# ─────────────────────────────────────────────────────────────────────────────
# Step 3: Execute Full Generation
# ─────────────────────────────────────────────────────────────────────────────

echo ""
echo "📸 Step 2: Executing image generation..."
echo ""

EXEC_RESPONSE=$(curl -s -X POST "${API_URL}/admin/generate-images" \
  -H "X-API-Key=${ADMIN_KEY}")

if echo "$EXEC_RESPONSE" | grep -q "Image generation queued"; then
  echo "✅ Image generation queued successfully!"
  echo ""
  echo "Response:"
  echo "$EXEC_RESPONSE" | grep -o '"message":"[^"]*"'
  echo "$EXEC_RESPONSE" | grep -o '"jobs":[^,]*'
  echo ""
else
  echo "❌ Failed to queue images"
  echo "Response: $EXEC_RESPONSE"
  exit 1
fi

# ─────────────────────────────────────────────────────────────────────────────
# Step 4: Monitor Progress
# ─────────────────────────────────────────────────────────────────────────────

echo "📊 Step 3: Monitoring progress (updates every 30 seconds)..."
echo ""
echo "Target: 162 images"
echo "Estimated time: 30-45 minutes"
echo ""
echo "Progress:"
echo ""

START_TIME=$(date +%s)
LAST_COUNT=0
CHECK_COUNT=0

while true; do
  CHECK_COUNT=$((CHECK_COUNT + 1))
  
  STATUS=$(curl -s -X GET "${API_URL}/admin/generate-images/status" \
    -H "X-API-Key=${ADMIN_KEY}")
  
  TOTAL_IMAGES=$(echo "$STATUS" | grep -o '"totalImages":[0-9]*' | cut -d':' -f2)
  COMPLETION=$(echo "$STATUS" | grep -o '"completionPercentage":"[^"]*"' | cut -d'"' -f4)
  
  if [ -z "$TOTAL_IMAGES" ]; then
    echo "⏳ Waiting for first images... (check ${CHECK_COUNT})"
  else
    CURRENT_TIME=$(date +%s)
    ELAPSED=$((CURRENT_TIME - START_TIME))
    ELAPSED_MIN=$((ELAPSED / 60))
    
    if [ "$TOTAL_IMAGES" != "$LAST_COUNT" ]; then
      echo "  [${ELAPSED_MIN}m] ${TOTAL_IMAGES}/162 images (${COMPLETION}%)"
      LAST_COUNT=$TOTAL_IMAGES
    fi
    
    # Check if done
    if [ "$TOTAL_IMAGES" -ge 160 ]; then
      echo ""
      echo "✅ IMAGE GENERATION COMPLETE!"
      echo ""
      echo "Final stats:"
      echo "$STATUS" | grep -o '"totalImages":[0-9]*'
      echo "$STATUS" | grep -o '"completionPercentage":"[^"]*"'
      echo ""
      echo "🎉 162 images are now in the database and ready to display!"
      exit 0
    fi
  fi
  
  # Safety check - don't wait more than 2 hours
  if [ $ELAPSED -gt 7200 ]; then
    echo ""
    echo "⏱️  Timeout (2 hours). Generation may still be in progress."
    echo "Check Railway logs or run status command manually."
    exit 0
  fi
  
  sleep 30
done
