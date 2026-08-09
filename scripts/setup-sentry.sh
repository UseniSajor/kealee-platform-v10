#!/bin/bash

# Kealee Platform Sentry Setup Script
# Configures error tracking and monitoring for production

set -e

echo "🔍 Kealee Platform Sentry Setup"
echo "================================"
echo ""

echo "📋 Prerequisites:"
echo "  - Sentry account at https://sentry.io"
echo "  - Sentry CLI installed (npm install -g @sentry/cli)"
echo ""

# Step 1: Get Sentry DSN
echo ""
echo "🔑 Sentry DSN Configuration"
echo "================================"
echo ""
echo "1. Go to https://sentry.io/organizations/"
echo "2. Create new organization (if needed)"
echo "3. Create new project:"
echo "   - Platform: Node.js"
echo "   - Alert frequency: All errors"
echo "4. Copy the DSN from the dashboard"
echo ""
read -p "Enter your Sentry DSN: " SENTRY_DSN

if [ -z "$SENTRY_DSN" ]; then
    echo "❌ No DSN provided"
    exit 1
fi

echo "✅ DSN received: $SENTRY_DSN"
echo ""

# Extract project details from DSN
SENTRY_ORG_SLUG=$(echo "$SENTRY_DSN" | sed -E 's|https://[^@]+@([^/]+)/.*|\1|')
SENTRY_PROJECT_ID=$(echo "$SENTRY_DSN" | sed -E 's|.*\/([0-9]+)$|\1|')

echo "📊 Extracted from DSN:"
echo "  Organization: $SENTRY_ORG_SLUG"
echo "  Project ID: $SENTRY_PROJECT_ID"
echo ""

# Step 2: Get Sentry Auth Token
echo "🔐 Sentry Authentication Token (Optional)"
echo "================================"
echo ""
echo "For automated alert setup:"
echo "1. Go to https://sentry.io/settings/account/api/auth-tokens/"
echo "2. Create new token"
echo "3. Copy the token"
echo ""
read -p "Enter Sentry Auth Token (or press Enter to skip): " SENTRY_AUTH_TOKEN

echo ""

# Step 3: Display Railway configuration
echo "🚂 Railway Environment Variables"
echo "================================"
echo ""
echo "Add these to Railway dashboard (Variables):"
echo ""
echo "SENTRY_DSN=$SENTRY_DSN"
echo "SENTRY_ENVIRONMENT=production"
echo "SENTRY_TRACES_SAMPLE_RATE=0.1"
echo "SENTRY_PROFILES_SAMPLE_RATE=0.1"

if [ -n "$SENTRY_AUTH_TOKEN" ]; then
    echo "SENTRY_AUTH_TOKEN=$SENTRY_AUTH_TOKEN"
fi

echo ""
echo "📋 Save these values!"
echo ""

# Step 4: Summary
echo "=========================================="
echo "✅ Sentry Configuration Complete!"
echo "=========================================="
echo ""
echo "Next steps:"
echo ""
echo "1. Go to Railway dashboard"
echo "2. Add environment variables above to production environment"
echo "3. Deploy services: git push origin main"
echo "4. Verify events in Sentry dashboard"
echo "5. Set up Slack alerts (manual in Sentry UI)"
echo ""
