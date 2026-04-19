#!/bin/bash
set -e

# Rollback Script for Kealee Platform
# Usage: ./scripts/rollback.sh <service-name>
# Example: ./scripts/rollback.sh kealee-api

SERVICE=${1:?Usage: rollback.sh <service-name>}

echo "⏮️  Rolling back $SERVICE to previous deployment..."
echo ""

available_services=(
  "kealee-api"
  "worker"
  "web-main"
  "portal-owner"
  "portal-contractor"
  "portal-developer"
  "command-center"
  "admin-console"
)

# Check if service is valid
if [[ ! " ${available_services[@]} " =~ " ${SERVICE} " ]]; then
  echo "❌ ERROR: Unknown service '$SERVICE'"
  echo "   Available services:"
  for s in "${available_services[@]}"; do
    echo "      • $s"
  done
  exit 1
fi

if ! command -v railway &> /dev/null; then
  echo "❌ ERROR: 'railway' CLI not found"
  echo "   → Install with: npm i -g @railway/cli"
  exit 1
fi

echo "📌 Service: $SERVICE"
echo "   → Project: artistic-kindness (8187fcf6)"
echo "   → Retrieving deployment history..."
echo ""

# Perform rollback via Railway CLI
railway rollback --service "$SERVICE" --environment production

if [ $? -eq 0 ]; then
  echo ""
  echo "✅ Rollback completed"
  echo ""
  echo "⏳ Running health checks on $SERVICE..."
  bash scripts/validate-deploy.sh "$SERVICE"
else
  echo "❌ Rollback failed"
  echo "   → Check Railway dashboard for details"
  exit 1
fi
