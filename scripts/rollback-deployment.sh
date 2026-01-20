#!/bin/bash
# scripts/rollback-deployment.sh
# Rollback deployment to previous version

set -e

APP=${1:-""}
VERSION=${2:-"previous"}

if [ -z "$APP" ]; then
    echo "Usage: ./scripts/rollback-deployment.sh <app> [version]"
    echo "Example: ./scripts/rollback-deployment.sh m-marketplace previous"
    exit 1
fi

echo "⏪ Rolling Back Deployment"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "App: $APP"
echo "Version: $VERSION"
echo ""

if [ -z "$VERCEL_TOKEN" ]; then
    echo "VERCEL_TOKEN not set"
    exit 1
fi

# List recent deployments
echo "Recent deployments:"
vercel list "$APP" --token="$VERCEL_TOKEN" | head -5

echo ""
read -p "Confirm rollback? (y/N): " CONFIRM

if [ "$CONFIRM" != "y" ] && [ "$CONFIRM" != "Y" ]; then
    echo "Cancelled"
    exit 0
fi

# Get previous deployment URL
PREVIOUS=$(vercel list "$APP" --token="$VERCEL_TOKEN" | head -3 | tail -1 | awk '{print $2}')

if [ -n "$PREVIOUS" ]; then
    echo "Rolling back to: $PREVIOUS"
    vercel rollback "$PREVIOUS" --token="$VERCEL_TOKEN" && echo "✅ Rollback complete" || echo "❌ Rollback failed"
else
    echo "❌ Could not find previous deployment"
    exit 1
fi
