#!/bin/bash
# scripts/setup-uptime-monitoring.sh
# Setup uptime monitoring for all applications

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

MONITORING_SERVICE=${MONITORING_SERVICE:-"uptimerobot"}  # uptimerobot, pingdom, statuscake, etc.

log() {
    echo -e "${BLUE}[UPTIME]${NC} $1"
}

success() {
    echo -e "${GREEN}✅${NC} $1"
}

fail() {
    echo -e "${RED}❌${NC} $1"
}

warn() {
    echo -e "${YELLOW}⚠️${NC} $1"
}

echo "⏱️  Uptime Monitoring Setup"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "   Service: $MONITORING_SERVICE"
echo ""
echo "This script helps you configure uptime monitoring."
echo "Uptime monitoring checks if your applications are accessible."
echo ""

# Application endpoints
declare -A APP_ENDPOINTS=(
    ["api"]="https://api.kealee.com/health"
    ["marketplace"]="https://marketplace.kealee.com"
    ["admin"]="https://admin.kealee.com"
    ["pm"]="https://pm.kealee.com"
    ["ops"]="https://ops.kealee.com"
    ["app"]="https://app.kealee.com"
    ["owner"]="https://owner.kealee.com"
    ["architect"]="https://architect.kealee.com"
    ["permits"]="https://permits.kealee.com"
)

# Generate monitoring configuration
MONITORING_CONFIG_FILE="uptime-monitoring-config.txt"
log "Generating uptime monitoring configuration: $MONITORING_CONFIG_FILE"

cat > "$MONITORING_CONFIG_FILE" << EOF
# Uptime Monitoring Configuration for Kealee Platform
# Generated: $(date)
# Service: $MONITORING_SERVICE

# Setup Instructions:
# 1. Sign up for $MONITORING_SERVICE
# 2. Create monitors for each endpoint below
# 3. Configure alert notifications (email, Slack, PagerDuty, etc.)
# 4. Set up status page (optional)

# Monitoring Endpoints:
EOF

for app in "${!APP_ENDPOINTS[@]}"; do
    endpoint="${APP_ENDPOINTS[$app]}"
    echo "" >> "$MONITORING_CONFIG_FILE"
    echo "# $app" >> "$MONITORING_CONFIG_FILE"
    echo "MONITOR_NAME_${app^^}=Kealee - $app" >> "$MONITORING_CONFIG_FILE"
    echo "MONITOR_URL_${app^^}=$endpoint" >> "$MONITORING_CONFIG_FILE"
    echo "MONITOR_TYPE=HTTP(S)" >> "$MONITORING_CONFIG_FILE"
    echo "MONITOR_INTERVAL=5 minutes" >> "$MONITORING_CONFIG_FILE"
    echo "ALERT_CONTACTS=..." >> "$MONITORING_CONFIG_FILE"
done

success "Monitoring configuration file created: $MONITORING_CONFIG_FILE"

# Service-specific instructions
case $MONITORING_SERVICE in
    uptimerobot)
        echo ""
        echo "📋 UptimeRobot Setup"
        echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
        echo ""
        echo "1. Sign up: https://uptimerobot.com"
        echo "2. Go to: Dashboard → Add New Monitor"
        echo "3. For each endpoint:"
        echo "   - Monitor Type: HTTP(s)"
        echo "   - Friendly Name: Kealee - <app-name>"
        echo "   - URL: <endpoint>"
        echo "   - Monitoring Interval: 5 minutes"
        echo "   - Alert Contacts: Add your email/Slack"
        echo ""
        echo "4. Set up Status Page (optional):"
        echo "   - Go to: Status Pages → Create Status Page"
        echo "   - Add all monitors"
        echo "   - Customize appearance"
        echo "   - Publish status page URL"
        ;;
    pingdom)
        echo ""
        echo "📋 Pingdom Setup"
        echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
        echo ""
        echo "1. Sign up: https://www.pingdom.com"
        echo "2. Go to: Monitoring → Add Check"
        echo "3. For each endpoint:"
        echo "   - Check Type: HTTP"
        echo "   - Name: Kealee - <app-name>"
        echo "   - URL: <endpoint>"
        echo "   - Check Interval: 5 minutes"
        echo "   - Alert Contacts: Configure notifications"
        echo ""
        echo "4. Set up Public Status Page:"
        echo "   - Go to: Status Pages → Create"
        echo "   - Add checks"
        echo "   - Customize and publish"
        ;;
    statuscake)
        echo ""
        echo "📋 StatusCake Setup"
        echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
        echo ""
        echo "1. Sign up: https://www.statuscake.com"
        echo "2. Go to: Uptime → Add New Test"
        echo "3. For each endpoint:"
        echo "   - Test Type: HTTP"
        echo "   - Website Name: Kealee - <app-name>"
        echo "   - Website URL: <endpoint>"
        echo "   - Check Rate: 5 minutes"
        echo "   - Contact Group: Add notifications"
        echo ""
        echo "4. Set up Status Page:"
        echo "   - Go to: Status Pages → Create"
        echo "   - Add tests"
        echo "   - Customize and publish"
        ;;
    *)
        echo ""
        echo "📋 Generic Uptime Monitoring Setup"
        echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
        echo ""
        echo "1. Sign up for your chosen monitoring service"
        echo "2. Create monitors for each endpoint:"
        for app in "${!APP_ENDPOINTS[@]}"; do
            endpoint="${APP_ENDPOINTS[$app]}"
            echo "   - $app: $endpoint"
        done
        echo ""
        echo "3. Configure:"
        echo "   - Check interval: 5 minutes"
        echo "   - Alert contacts: Email, Slack, etc."
        echo "   - Status page (optional)"
        ;;
esac

echo ""
echo "📋 Monitoring Endpoints"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

for app in "${!APP_ENDPOINTS[@]}"; do
    endpoint="${APP_ENDPOINTS[$app]}"
    echo "  $app"
    echo "    URL: $endpoint"
    echo "    Expected Status: 200"
    echo "    Check Interval: 5 minutes"
    echo ""
done

echo ""
echo "🔔 Alert Configuration"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "Recommended alert settings:"
echo "  - Alert on: Down for 2 consecutive checks"
echo "  - Alert channels:"
echo "    - Email (primary)"
echo "    - Slack (team notifications)"
echo "    - PagerDuty (critical alerts)"
echo "    - SMS (on-call rotation)"
echo ""

echo ""
echo "📊 Status Page"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "Consider setting up a public status page:"
echo "  - Shows real-time status of all services"
echo "  - Provides transparency to users"
echo "  - Reduces support inquiries during outages"
echo "  - Example: https://status.kealee.com"
echo ""

echo ""
echo "📋 Next Steps"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "1. ✅ Sign up for $MONITORING_SERVICE"
echo "2. ✅ Create monitors for each endpoint"
echo "3. ✅ Configure alert notifications"
echo "4. ✅ Set up status page (optional)"
echo "5. ✅ Test alerts by temporarily disabling a service"
echo ""
echo "📄 Configuration saved to: $MONITORING_CONFIG_FILE"
