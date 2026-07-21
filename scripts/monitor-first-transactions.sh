#!/bin/bash

# Monitor First Transactions
# Monitors and alerts on first transactions after launch

set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

API_URL=${API_URL:-https://api.kealee.com}
ALERT_EMAIL=${ALERT_EMAIL:-ops@kealee.com}

log() {
    echo -e "${GREEN}[MONITOR]${NC} $1"
}

warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

log "Setting up first transaction monitoring..."
echo ""

# Create monitoring script
cat > scripts/monitor-transactions.sh <<'EOF'
#!/bin/bash

# Monitor First Transactions
# Run this script every 5 minutes during launch day

API_URL=${API_URL:-https://api.kealee.com}
ALERT_EMAIL=${ALERT_EMAIL:-ops@kealee.com}

# Check for new payments
NEW_PAYMENTS=$(curl -s "$API_URL/payments?limit=10" | jq '.payments | length' 2>/dev/null || echo "0")

if [ "$NEW_PAYMENTS" -gt 0 ]; then
    echo "✅ $NEW_PAYMENTS new payment(s) detected"
    # Send alert
    echo "New payments detected: $NEW_PAYMENTS" | mail -s "Kealee Platform - New Payments" "$ALERT_EMAIL" 2>/dev/null || true
fi

# Check for new subscriptions
NEW_SUBSCRIPTIONS=$(curl -s "$API_URL/billing/subscriptions?limit=10" | jq '.subscriptions | length' 2>/dev/null || echo "0")

if [ "$NEW_SUBSCRIPTIONS" -gt 0 ]; then
    echo "✅ $NEW_SUBSCRIPTIONS new subscription(s) detected"
    # Send alert
    echo "New subscriptions detected: $NEW_SUBSCRIPTIONS" | mail -s "Kealee Platform - New Subscriptions" "$ALERT_EMAIL" 2>/dev/null || true
fi

# Check for new permit applications
NEW_PERMITS=$(curl -s "$API_URL/permits?limit=10" | jq '.permits | length' 2>/dev/null || echo "0")

if [ "$NEW_PERMITS" -gt 0 ]; then
    echo "✅ $NEW_PERMITS new permit application(s) detected"
fi

# Check error rate
ERROR_RATE=$(curl -s "$API_URL/health" | jq '.errorRate' 2>/dev/null || echo "0")

if [ "$(echo "$ERROR_RATE > 0.01" | bc 2>/dev/null || echo "0")" = "1" ]; then
    echo "⚠️  Error rate is high: $ERROR_RATE"
    echo "High error rate detected: $ERROR_RATE" | mail -s "Kealee Platform - High Error Rate" "$ALERT_EMAIL" 2>/dev/null || true
fi
EOF

chmod +x scripts/monitor-transactions.sh

log "✅ Transaction monitoring script created: scripts/monitor-transactions.sh"
echo ""

# Create monitoring dashboard checklist
cat > MONITORING_DASHBOARD_CHECKLIST.md <<'EOF'
# Monitoring Dashboard Checklist

## Real-Time Monitoring

### Vercel Dashboard
- [ ] Deployment status
- [ ] Function execution times
- [ ] Error rates
- [ ] Bandwidth usage

### Sentry Dashboard
- [ ] Error count
- [ ] Error rate
- [ ] New issues
- [ ] Performance issues

### Stripe Dashboard
- [ ] Payment success rate
- [ ] Failed payments
- [ ] New customers
- [ ] Revenue

### Database Monitoring
- [ ] Connection pool usage
- [ ] Query performance
- [ ] Database size
- [ ] Replication lag (if applicable)

### API Monitoring
- [ ] Response times
- [ ] Error rates
- [ ] Request volume
- [ ] Endpoint health

## Key Metrics to Watch

### First Hour
- User registrations
- First payment
- First subscription
- First permit application
- Error rate
- Response times

### First Day
- Total users
- Total transactions
- Revenue
- Error rate
- User feedback
- Support tickets

## Alert Thresholds

- Error rate > 1%
- Response time > 2s (P95)
- Payment failure rate > 5%
- Database connection pool > 80%
- Memory usage > 90%
EOF

log "✅ Monitoring dashboard checklist created: MONITORING_DASHBOARD_CHECKLIST.md"
echo ""

log "Transaction monitoring setup complete!"
log ""
log "Next steps:"
log "1. Review MONITORING_DASHBOARD_CHECKLIST.md"
log "2. Set up monitoring dashboards"
log "3. Configure alerts"
log "4. Run monitoring script: bash scripts/monitor-transactions.sh"
log "5. Monitor closely during launch"
