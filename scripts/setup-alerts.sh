#!/bin/bash

# Setup Alerts
# Configures alerting for monitoring services

set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

log() {
    echo -e "${GREEN}[$(date '+%Y-%m-%d %H:%M:%S')]${NC} $1"
}

warn() {
    echo -e "${YELLOW}[$(date '+%Y-%m-%d %H:%M:%S')] WARNING:${NC} $1"
}

log "Setting up alerts for Kealee Platform"
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

# 1. Sentry Alerts
log "1. Sentry Alerts"
log "   Configure in Sentry Dashboard → Settings → Alerts"
log "   Recommended alert rules:"
log "   - Error rate > 5% in 5 minutes"
log "   - New issue detected"
log "   - Performance degradation (P95 > 2s)"
log "   - Failed transactions > 10 in 5 minutes"
echo ""

# 2. UptimeRobot Alerts
log "2. UptimeRobot Alerts"
log "   Configure in UptimeRobot Dashboard → My Monitors → Alert Contacts"
log "   Recommended monitors:"
for app in "${!APPS[@]}"; do
    domain="${APPS[$app]}"
    log "   - $domain (HTTPS, 5 min interval)"
done
log "   - api.kealee.com/health (HTTPS, 5 min interval)"
log ""
log "   Alert contacts to set up:"
log "   - Email: ops@kealee.com"
log "   - Slack webhook (optional)"
log "   - SMS (optional, for critical alerts)"
echo ""

# 3. Vercel Alerts
log "3. Vercel Alerts"
log "   Configure in Vercel Dashboard → Project → Settings → Notifications"
log "   Enable notifications for:"
log "   - Deployment failures"
log "   - Build failures"
log "   - Function errors"
log "   - Bandwidth limits"
echo ""

# 4. Datadog Alerts
log "4. Datadog Alerts"
log "   Configure in Datadog Dashboard → Monitors → New Monitor"
log "   Recommended monitors:"
log "   - API response time > 1s (P95)"
log "   - Error rate > 1%"
log "   - Database connection pool exhaustion"
log "   - Redis memory usage > 80%"
log "   - File upload failures > 5 in 10 minutes"
echo ""

# 5. Stripe Alerts
log "5. Stripe Alerts"
log "   Configure in Stripe Dashboard → Developers → Webhooks"
log "   Set up webhooks for:"
log "   - payment_intent.payment_failed"
log "   - invoice.payment_failed"
log "   - customer.subscription.deleted"
log "   - charge.refunded"
echo ""

# 6. Custom Alert Script
log "6. Creating custom alert script..."
cat > scripts/check-system-health.sh <<'EOF'
#!/bin/bash
# System Health Check Script
# Run via cron: */5 * * * * /path/to/scripts/check-system-health.sh

API_URL=${API_URL:-https://api.kealee.com}
ALERT_EMAIL=${ALERT_EMAIL:-ops@kealee.com}

# Check API health
response=$(curl -s -o /dev/null -w "%{http_code}" "$API_URL/health" || echo "000")

if [ "$response" != "200" ]; then
    echo "ALERT: API health check failed (HTTP $response)" | mail -s "Kealee Platform Alert" "$ALERT_EMAIL"
fi

# Check database connectivity (if psql available)
if command -v psql &> /dev/null && [ -n "$DATABASE_URL" ]; then
    if ! psql "$DATABASE_URL" -c "SELECT 1" &> /dev/null; then
        echo "ALERT: Database connectivity check failed" | mail -s "Kealee Platform Alert" "$ALERT_EMAIL"
    fi
fi
EOF

chmod +x scripts/check-system-health.sh
log "   ✅ Created scripts/check-system-health.sh"
echo ""

log "✅ Alert setup complete!"
log ""
log "Next steps:"
log "1. Configure Sentry alert rules in dashboard"
log "2. Set up UptimeRobot monitors and alert contacts"
log "3. Enable Vercel notifications"
log "4. Create Datadog monitors"
log "5. Configure Stripe webhooks"
log "6. Set up cron job for health checks:"
log "   crontab -e"
log "   */5 * * * * /path/to/scripts/check-system-health.sh"
