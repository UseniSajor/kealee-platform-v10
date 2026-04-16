#!/usr/bin/env bash
set -euo pipefail

echo "🚀 Deploying KeaBots to Railway..."

# Validate environment
required_vars=(
  ANTHROPIC_API_KEY
  KEALEE_DATABASE_URL
  STRIPE_API_KEY
  RESEND_API_KEY
)

for var in "${required_vars[@]}"; do
  if [ -z "${!var:-}" ]; then
    echo "❌ Missing required env var: $var"
    exit 1
  fi
done
echo "✅ Environment variables validated"

# Build
echo "🔨 Building bots..."
bash scripts/build-keabots.sh

# Deploy via Railway CLI
if command -v railway &>/dev/null; then
  echo "🚂 Deploying to Railway..."
  railway up --service keabots
  echo "✅ Deployed to Railway"
else
  echo "ℹ️  Railway CLI not found. Push to branch to trigger Railway deployment."
fi

echo ""
echo "✅ KeaBots deployment complete"
echo "Health check: GET /api/v1/keabots/health"
