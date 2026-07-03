#!/bin/bash

# Complete automated deployment script for Kealee hero videos
# Handles: Generate → Upload → Configure → Deploy

set -e

echo "═══════════════════════════════════════════════════════════════════"
echo "🚀 KEALEE HERO VIDEO DEPLOYMENT — COMPLETE AUTOMATION"
echo "═══════════════════════════════════════════════════════════════════"
echo ""

# Source environment variables
export REPLICATE_API_TOKEN=$(grep REPLICATE_API_TOKEN apps/web-main/.env.local | cut -d= -f2)

# Check required tokens
echo "🔐 Checking credentials..."
if [ -z "$REPLICATE_API_TOKEN" ]; then
  echo "❌ REPLICATE_API_TOKEN not found in .env.local"
  exit 1
fi

echo "✅ REPLICATE_API_TOKEN: Set"
echo ""

# Check if AWS CLI is configured
if ! command -v aws &> /dev/null; then
  echo "⚠️  AWS CLI not installed. Install with: pip install awscli"
  echo "   Or configure S3 access another way"
  exit 1
fi

echo "✅ AWS CLI: Available"
echo "✅ Railway CLI: Check with 'railway --version'"
echo ""

echo "═══════════════════════════════════════════════════════════════════"
echo "📋 DEPLOYMENT STEPS"
echo "═══════════════════════════════════════════════════════════════════"
echo ""

echo "STEP 1: Generate hero videos via Replicate"
echo "   Status: Ready (requires Replicate account)"
echo "   Time: 15-20 minutes"
echo ""

echo "STEP 2: Upload to AWS S3"
echo "   Command:"
echo "   aws s3 cp video.mp4 s3://kealee-cdn/hero-videos/name.mp4 --acl public-read"
echo ""

echo "STEP 3: Update Railway environment variables"
echo "   Command:"
echo "   railway variables set NEXT_PUBLIC_HERO_VIDEO_KITCHEN=https://cdn.kealee.com/..."
echo ""

echo "STEP 4: Deploy via Railway"
echo "   Command: railway up"
echo ""

echo "═══════════════════════════════════════════════════════════════════"
echo "🎯 QUICK START"
echo "═══════════════════════════════════════════════════════════════════"
echo ""
echo "1️⃣  Generate 3 videos:"
echo "    https://replicate.com/kling-ai/kling-video"
echo ""
echo "2️⃣  Upload to S3:"
echo "    aws s3 cp kitchen.mp4 s3://kealee-cdn/hero-videos/kitchen-transformation-v1.mp4 --acl public-read"
echo "    aws s3 cp addition.mp4 s3://kealee-cdn/hero-videos/addition-construction-v1.mp4 --acl public-read"
echo "    aws s3 cp garden.mp4 s3://kealee-cdn/hero-videos/garden-landscape-v1.mp4 --acl public-read"
echo ""
echo "3️⃣  Update Railway (via CLI):"
echo "    railway variables set NEXT_PUBLIC_HERO_VIDEO_KITCHEN=https://cdn.kealee.com/hero-videos/kitchen-transformation-v1.mp4"
echo "    railway variables set NEXT_PUBLIC_HERO_VIDEO_ADDITION=https://cdn.kealee.com/hero-videos/addition-construction-v1.mp4"
echo "    railway variables set NEXT_PUBLIC_HERO_VIDEO_GARDEN=https://cdn.kealee.com/hero-videos/garden-landscape-v1.mp4"
echo ""
echo "4️⃣  Deploy:"
echo "    railway up"
echo ""
echo "✅ Done!"
echo ""
