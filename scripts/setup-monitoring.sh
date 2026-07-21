#!/bin/bash

# Monitoring Setup Script
# Sets up Sentry, LogRocket, Datadog, and UptimeRobot

set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

log() {
    echo -e "${GREEN}[$(date '+%Y-%m-%d %H:%M:%S')]${NC} $1"
}

error() {
    echo -e "${RED}[$(date '+%Y-%m-%d %H:%M:%S')] ERROR:${NC} $1"
    exit 1
}

warn() {
    echo -e "${YELLOW}[$(date '+%Y-%m-%d %H:%M:%S')] WARNING:${NC} $1"
}

log "Setting up monitoring for Kealee Platform"
echo ""

# Apps and their domains
declare -A APPS=(
    ["m-marketplace"]="marketplace.kealee.com"
    ["os-admin"]="admin.kealee.com"
    ["os-pm"]="pm.kealee.com"
    ["m-ops-services"]="ops.kealee.com"
    ["m-project-owner"]="app.kealee.com"
    ["m-architect"]="architect.kealee.com"
    ["m-permits-inspections"]="permits.kealee.com"
)

# 1. Sentry Setup
log "1. Setting up Sentry..."
log "   For each app, create a Sentry project and get DSN"
log ""
log "   Steps:"
log "   1. Go to https://sentry.io"
log "   2. Create project for each app"
log "   3. Get DSN for each project"
log "   4. Add to environment variables:"
for app in "${!APPS[@]}"; do
    log "      $app: NEXT_PUBLIC_SENTRY_DSN=https://...@sentry.io/..."
done
log ""
log "   Or use Sentry CLI:"
log "   npm install -g @sentry/cli"
log "   sentry-cli login"
log "   sentry-cli projects create $app --org kealee"
echo ""

# 2. LogRocket Setup
log "2. Setting up LogRocket..."
log "   Steps:"
log "   1. Go to https://logrocket.com"
log "   2. Create project for each app"
log "   3. Get app ID for each project"
log "   4. Add to environment variables:"
for app in "${!APPS[@]}"; do
    log "      $app: NEXT_PUBLIC_LOGROCKET_APP_ID=your_app_id"
done
log ""
log "   Install LogRocket in each app:"
log "   npm install logrocket"
log "   Add to app initialization"
echo ""

# 3. Datadog Setup
log "3. Setting up Datadog..."
log "   Steps:"
log "   1. Go to https://datadoghq.com"
log "   2. Create API key"
log "   3. Set up Real User Monitoring (RUM)"
log "   4. Add to environment variables:"
log "      DATADOG_API_KEY=your_api_key"
log "      DATADOG_APP_ID=your_app_id"
log "      DATADOG_CLIENT_TOKEN=your_client_token"
log ""
log "   Install Datadog RUM:"
log "   npm install @datadog/browser-rum"
log "   Add to app initialization"
echo ""

# 4. UptimeRobot Setup
log "4. Setting up UptimeRobot..."
log "   Steps:"
log "   1. Go to https://uptimerobot.com"
log "   2. Create account"
log "   3. Add monitors for each domain:"
for app in "${!APPS[@]}"; do
    domain="${APPS[$app]}"
    log "      - $domain (HTTPS monitor)"
done
log ""
log "   Monitor endpoints:"
log "      - https://api.kealee.com/health (Backend API)"
for app in "${!APPS[@]}"; do
    domain="${APPS[$app]}"
    log "      - https://$domain (Frontend app)"
done
log ""
log "   Set up alerts:"
log "      - Email notifications"
log "      - Slack webhook (optional)"
log "      - SMS (optional)"
echo ""

# Create monitoring configuration file
log "Creating monitoring configuration template..."
cat > monitoring-config.json <<EOF
{
  "sentry": {
    "org": "kealee",
    "projects": {
      "m-marketplace": {
        "dsn": "https://...@sentry.io/...",
        "project": "m-marketplace"
      },
      "os-admin": {
        "dsn": "https://...@sentry.io/...",
        "project": "os-admin"
      },
      "os-pm": {
        "dsn": "https://...@sentry.io/...",
        "project": "os-pm"
      },
      "m-ops-services": {
        "dsn": "https://...@sentry.io/...",
        "project": "m-ops-services"
      },
      "m-project-owner": {
        "dsn": "https://...@sentry.io/...",
        "project": "m-project-owner"
      },
      "m-architect": {
        "dsn": "https://...@sentry.io/...",
        "project": "m-architect"
      },
      "m-permits-inspections": {
        "dsn": "https://...@sentry.io/...",
        "project": "m-permits-inspections"
      }
    }
  },
  "logrocket": {
    "org": "kealee",
    "projects": {
      "m-marketplace": { "appId": "your_app_id" },
      "os-admin": { "appId": "your_app_id" },
      "os-pm": { "appId": "your_app_id" },
      "m-ops-services": { "appId": "your_app_id" },
      "m-project-owner": { "appId": "your_app_id" },
      "m-architect": { "appId": "your_app_id" },
      "m-permits-inspections": { "appId": "your_app_id" }
    }
  },
  "datadog": {
    "apiKey": "your_api_key",
    "appId": "your_app_id",
    "clientToken": "your_client_token",
    "site": "datadoghq.com"
  },
  "uptimerobot": {
    "apiKey": "your_api_key",
    "monitors": [
      { "name": "API Health", "url": "https://api.kealee.com/health", "type": "https" },
      { "name": "Marketplace", "url": "https://marketplace.kealee.com", "type": "https" },
      { "name": "Admin", "url": "https://admin.kealee.com", "type": "https" },
      { "name": "PM", "url": "https://pm.kealee.com", "type": "https" },
      { "name": "Ops Services", "url": "https://ops.kealee.com", "type": "https" },
      { "name": "Project Owner", "url": "https://app.kealee.com", "type": "https" },
      { "name": "Architect", "url": "https://architect.kealee.com", "type": "https" },
      { "name": "Permits", "url": "https://permits.kealee.com", "type": "https" }
    ]
  }
}
EOF

log "✅ Monitoring configuration template created: monitoring-config.json"
log ""
log "Next steps:"
log "1. Fill in monitoring-config.json with actual values"
log "2. Set up Sentry projects and add DSNs to environment variables"
log "3. Set up LogRocket projects and add app IDs"
log "4. Configure Datadog RUM"
log "5. Create UptimeRobot monitors"
log "6. Set up alert notifications"
