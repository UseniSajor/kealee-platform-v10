# Monitoring Alerts - Complete Setup Guide

Step-by-step guide to complete the monitoring alerts setup.

## ✅ Step 1: Review Alert Configurations

```bash
# Review all alert configuration files
ls -la config/alerts/

# Review each configuration
cat config/alerts/sentry-alerts.yaml
cat config/alerts/uptime-monitoring.yaml
cat config/alerts/performance-alerts.yaml
cat config/alerts/database-alerts.yaml
cat config/alerts/escalation-policy.yaml
```

**Customize as needed:**
- Adjust thresholds based on your needs
- Update notification channels
- Modify escalation timeouts
- Add/remove alert rules

## ✅ Step 2: Set Up Notification Channels

### Slack Setup

1. **Create Slack App:**
   - Go to: https://api.slack.com/apps
   - Click "Create New App"
   - Choose "From scratch"
   - Name: "Kealee Platform Alerts"
   - Select workspace

2. **Enable Incoming Webhooks:**
   - Go to "Incoming Webhooks"
   - Toggle "Activate Incoming Webhooks"
   - Click "Add New Webhook to Workspace"
   - Select channel (e.g., #platform-alerts)
   - Copy webhook URL

3. **Create Additional Webhooks:**
   - Create webhooks for each channel:
     - `#critical-alerts`
     - `#high-priority-alerts`
     - `#api-alerts`
     - `#performance-alerts`
     - `#database-alerts`
     - `#uptime-alerts`

4. **Configure Webhook:**
   ```bash
   # Use the configuration script
   ./scripts/configure-alert-channels.sh
   
   # Or manually set
   export SLACK_WEBHOOK_URL="https://hooks.slack.com/services/YOUR/WEBHOOK/URL"
   ```

### PagerDuty Setup

1. **Create PagerDuty Account:**
   - Go to: https://www.pagerduty.com
   - Sign up for account
   - Complete setup wizard

2. **Create Services:**
   - Navigate to: Configuration → Services
   - Create services:
     - `platform-critical`
     - `api-critical`
     - `database-critical`
     - `payments-critical`
     - `user-impact`

3. **Add Integrations:**
   - For each service, add "Events API v2" integration
   - Copy Integration Key

4. **Configure Integration Key:**
   ```bash
   # Use the configuration script
   ./scripts/configure-alert-channels.sh
   
   # Or manually set
   export PAGERDUTY_INTEGRATION_KEY="your-integration-key"
   ```

### Email Setup

1. **Configure SMTP:**
   - Use your email provider's SMTP settings
   - Common providers:
     - Gmail: smtp.gmail.com:587
     - SendGrid: smtp.sendgrid.net:587
     - AWS SES: email-smtp.region.amazonaws.com:587

2. **Set Environment Variables:**
   ```bash
   export SMTP_SERVER="smtp.gmail.com"
   export SMTP_PORT="587"
   export SMTP_USER="your-email@gmail.com"
   export SMTP_PASS="your-app-password"
   ```

## ✅ Step 3: Configure Environment Variables

### Local Development

```bash
# Create .env.local
cat > .env.local << EOF
SLACK_WEBHOOK_URL=https://hooks.slack.com/services/YOUR/WEBHOOK/URL
PAGERDUTY_INTEGRATION_KEY=your-integration-key
SMTP_SERVER=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
EOF
```

### Vercel (Production)

```bash
# Set for all apps
for app in m-marketplace os-admin os-pm m-ops-services m-project-owner m-architect m-permits-inspections; do
  echo "$SLACK_WEBHOOK_URL" | vercel env add SLACK_WEBHOOK_URL production --token=$VERCEL_TOKEN --scope=$app
  echo "$PAGERDUTY_INTEGRATION_KEY" | vercel env add PAGERDUTY_INTEGRATION_KEY production --token=$VERCEL_TOKEN --scope=$app
done
```

### Railway (API Service)

```bash
# Set via Railway CLI
railway variables set SLACK_WEBHOOK_URL="$SLACK_WEBHOOK_URL"
railway variables set PAGERDUTY_INTEGRATION_KEY="$PAGERDUTY_INTEGRATION_KEY"
```

## ✅ Step 4: Test Alerts

```bash
# Run test script
./scripts/test-alerts.sh

# Or test manually
curl -X POST https://api.kealee.com/api/alerts/test \
  -H "Content-Type: application/json" \
  -d '{
    "alert_name": "Test Alert",
    "severity": "critical",
    "message": "This is a test alert",
    "environment": "testing"
  }'
```

**Verify:**
- ✅ Slack message received in channel
- ✅ PagerDuty incident created (if critical)
- ✅ Email notification sent (if configured)

## ✅ Step 5: Set Up Dashboards

```bash
# Run dashboard setup script
./scripts/setup-monitoring-dashboards.sh
```

**This creates:**
- Grafana dashboard configurations
- Prometheus alert rules
- Dashboard templates

### Grafana Setup (if using)

1. **Install Grafana:**
   ```bash
   # Docker
   docker run -d -p 3000:3000 grafana/grafana
   
   # Or install locally
   # Follow: https://grafana.com/docs/grafana/latest/setup-grafana/installation/
   ```

2. **Import Dashboard:**
   - Go to Grafana: http://localhost:3000
   - Navigate to: Dashboards → Import
   - Upload: `config/dashboards/overview.json`

### Prometheus Setup (if using)

1. **Install Prometheus:**
   ```bash
   # Docker
   docker run -d -p 9090:9090 prom/prometheus
   ```

2. **Configure Alerts:**
   - Copy `config/prometheus/alerts.yml` to Prometheus config
   - Restart Prometheus

## Verification Checklist

- [ ] Alert configurations reviewed and customized
- [ ] Slack webhooks created and tested
- [ ] PagerDuty services created and integration keys obtained
- [ ] Email SMTP configured
- [ ] Environment variables set in all environments
- [ ] Test alerts sent and verified
- [ ] Dashboards configured (if applicable)
- [ ] On-call schedule configured
- [ ] Maintenance windows set

## Troubleshooting

### Alerts Not Firing

1. Check environment variables are set
2. Verify webhook URLs are correct
3. Test endpoints manually
4. Check application logs

### Slack Not Receiving Alerts

1. Verify webhook URL is correct
2. Check Slack app permissions
3. Test webhook manually:
   ```bash
   curl -X POST "$SLACK_WEBHOOK_URL" \
     -H "Content-Type: application/json" \
     -d '{"text":"Test message"}'
   ```

### PagerDuty Not Receiving Alerts

1. Verify integration key is correct
2. Check service is active
3. Test integration:
   ```bash
   curl -X POST https://events.pagerduty.com/v2/enqueue \
     -H "Content-Type: application/json" \
     -d '{
       "routing_key": "your-integration-key",
       "event_action": "trigger",
       "payload": {
         "summary": "Test alert",
         "source": "test",
         "severity": "critical"
       }
     }'
   ```

## Next Steps

1. ✅ Monitor alert effectiveness
2. ✅ Adjust thresholds based on patterns
3. ✅ Review and optimize alert rules
4. ✅ Set up on-call rotation
5. ✅ Document alert response procedures
