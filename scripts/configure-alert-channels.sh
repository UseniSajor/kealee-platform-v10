#!/bin/bash
# scripts/configure-alert-channels.sh
# Configure notification channels for monitoring alerts

set -e

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m'

log() {
    echo -e "${BLUE}[ALERT CONFIG]${NC} $1"
}

success() {
    echo -e "${GREEN}✅${NC} $1"
}

warn() {
    echo -e "${YELLOW}⚠️${NC} $1"
}

echo "🔔 Configuring Alert Notification Channels"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Check if configuration files exist
if [ ! -f "config/alerts/escalation-policy.yaml" ]; then
    warn "Alert configuration files not found"
    echo "Run: ./scripts/setup-monitoring-alerts.sh first"
    exit 1
fi

# Slack Configuration
log "Setting up Slack webhooks..."

echo ""
echo "Slack Webhook Setup:"
echo "1. Go to: https://api.slack.com/apps"
echo "2. Create a new app or select existing app"
echo "3. Go to 'Incoming Webhooks'"
echo "4. Activate Incoming Webhooks"
echo "5. Add webhook to workspace"
echo "6. Copy webhook URL"
echo ""

read -p "Enter Slack webhook URL (or press Enter to skip): " SLACK_WEBHOOK

if [ -n "$SLACK_WEBHOOK" ]; then
    # Set environment variable
    export SLACK_WEBHOOK_URL="$SLACK_WEBHOOK"
    
    # Save to .env file
    if [ -f ".env.local" ]; then
        if grep -q "SLACK_WEBHOOK_URL" .env.local; then
            sed -i "s|SLACK_WEBHOOK_URL=.*|SLACK_WEBHOOK_URL=$SLACK_WEBHOOK|" .env.local
        else
            echo "SLACK_WEBHOOK_URL=$SLACK_WEBHOOK" >> .env.local
        fi
    else
        echo "SLACK_WEBHOOK_URL=$SLACK_WEBHOOK" > .env.local
    fi
    
    success "Slack webhook configured"
    
    # Test webhook
    read -p "Test Slack webhook? (y/N): " TEST_SLACK
    if [ "$TEST_SLACK" = "y" ] || [ "$TEST_SLACK" = "Y" ]; then
        curl -X POST "$SLACK_WEBHOOK" \
            -H "Content-Type: application/json" \
            -d '{"text":"✅ Slack webhook test successful!"}' && \
            success "Slack webhook test sent" || warn "Slack webhook test failed"
    fi
else
    warn "Slack webhook skipped"
fi

# PagerDuty Configuration
log "Setting up PagerDuty integration..."

echo ""
echo "PagerDuty Integration Setup:"
echo "1. Go to: https://app.pagerduty.com"
echo "2. Navigate to: Configuration → Services"
echo "3. Create a new service or select existing"
echo "4. Add 'Events API v2' integration"
echo "5. Copy Integration Key"
echo ""

read -p "Enter PagerDuty Integration Key (or press Enter to skip): " PAGERDUTY_KEY

if [ -n "$PAGERDUTY_KEY" ]; then
    export PAGERDUTY_INTEGRATION_KEY="$PAGERDUTY_KEY"
    
    # Save to .env file
    if [ -f ".env.local" ]; then
        if grep -q "PAGERDUTY_INTEGRATION_KEY" .env.local; then
            sed -i "s|PAGERDUTY_INTEGRATION_KEY=.*|PAGERDUTY_INTEGRATION_KEY=$PAGERDUTY_KEY|" .env.local
        else
            echo "PAGERDUTY_INTEGRATION_KEY=$PAGERDUTY_KEY" >> .env.local
        fi
    else
        echo "PAGERDUTY_INTEGRATION_KEY=$PAGERDUTY_KEY" >> .env.local
    fi
    
    success "PagerDuty integration key configured"
else
    warn "PagerDuty integration skipped"
fi

# Email Configuration
log "Setting up email notifications..."

echo ""
echo "Email Configuration:"
echo "Configure SMTP settings for email alerts"
echo ""

read -p "SMTP Server (e.g., smtp.gmail.com): " SMTP_SERVER
read -p "SMTP Port (e.g., 587): " SMTP_PORT
read -p "SMTP User: " SMTP_USER
read -sp "SMTP Password: " SMTP_PASS
echo ""

if [ -n "$SMTP_SERVER" ] && [ -n "$SMTP_USER" ]; then
    # Save to .env file
    {
        echo "SMTP_SERVER=$SMTP_SERVER"
        echo "SMTP_PORT=${SMTP_PORT:-587}"
        echo "SMTP_USER=$SMTP_USER"
        echo "SMTP_PASS=$SMTP_PASS"
    } >> .env.local
    
    success "Email configuration saved"
else
    warn "Email configuration skipped"
fi

# Set Vercel environment variables
if [ -n "$VERCEL_TOKEN" ]; then
    read -p "Set environment variables in Vercel? (y/N): " SET_VERCEL
    
    if [ "$SET_VERCEL" = "y" ] || [ "$SET_VERCEL" = "Y" ]; then
        APPS=("m-marketplace" "os-admin" "os-pm" "m-ops-services" "m-project-owner" "m-architect" "m-permits-inspections")
        
        for app in "${APPS[@]}"; do
            if [ -n "$SLACK_WEBHOOK" ]; then
                echo "$SLACK_WEBHOOK" | vercel env add SLACK_WEBHOOK_URL production --token="$VERCEL_TOKEN" --scope="$app" 2>/dev/null || true
            fi
            
            if [ -n "$PAGERDUTY_KEY" ]; then
                echo "$PAGERDUTY_KEY" | vercel env add PAGERDUTY_INTEGRATION_KEY production --token="$VERCEL_TOKEN" --scope="$app" 2>/dev/null || true
            fi
        done
        
        success "Vercel environment variables configured"
    fi
fi

echo ""
success "Alert notification channels configured!"
echo ""
echo "📋 Next Steps:"
echo "   1. Review alert configurations: config/alerts/"
echo "   2. Test alerts: ./scripts/test-alerts.sh"
echo "   3. Set up dashboards: ./scripts/setup-monitoring-dashboards.sh"
echo ""
