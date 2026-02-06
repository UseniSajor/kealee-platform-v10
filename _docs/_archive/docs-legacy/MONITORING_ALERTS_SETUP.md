# Monitoring Alerts Setup Guide

Complete guide for setting up monitoring alerts in the Kealee Platform.

## Quick Start

```bash
# Run setup script
./scripts/setup-monitoring-alerts.sh

# Test alerts
./scripts/test-alerts.sh

# Setup dashboards
./scripts/setup-monitoring-dashboards.sh
```

## Alert Configuration

### Sentry Alerts

Configured in `config/alerts/sentry-alerts.yaml`:

- **Critical Error Rate > 5%**: Triggers email, Slack, and PagerDuty
- **P95 Latency > 2000ms**: Performance degradation alerts
- **API Error Spike**: Rapid increase in errors
- **High User Impact Errors**: Errors affecting many users

### Uptime Monitoring

Configured in `config/alerts/uptime-monitoring.yaml`:

- **Marketplace Homepage**: Monitors main site
- **API Health**: Critical API endpoint
- **Authentication Service**: Auth endpoint monitoring
- **Payment Webhook**: Payment processing monitoring

### Performance Alerts

Configured in `config/alerts/performance-alerts.yaml`:

- **Web Vitals**: LCP, CLS monitoring
- **API Performance**: Response time thresholds
- **Database Performance**: Slow query detection
- **Cache Performance**: Redis hit rate monitoring

### Database Alerts

Configured in `config/alerts/database-alerts.yaml`:

- **High Connection Usage**: Connection pool monitoring
- **Slow Queries**: Query performance alerts
- **Replication Lag**: Database replication monitoring
- **Disk Space**: Storage monitoring
- **Dead Tuples**: Database maintenance alerts

## Escalation Policy

### Critical Alerts

1. **Level 1 (5 minutes):**
   - Slack: `#critical-alerts`
   - Email: On-call primary

2. **Level 2 (10 minutes):**
   - SMS notification
   - PagerDuty escalation

3. **Level 3 (15 minutes):**
   - Phone call
   - Slack: `#all-hands`
   - Email: CTO

### High Priority Alerts

1. **Level 1 (15 minutes):**
   - Slack: `#high-priority-alerts`
   - Email: Team lead

2. **Level 2 (30 minutes):**
   - Slack: `#engineering`
   - Email: Director

### Medium Priority Alerts

1. **Level 1 (1 hour):**
   - Slack: `#alerts`

2. **Level 2 (4 hours):**
   - Email: Platform team

### Low Priority Alerts

1. **Level 1 (4 hours):**
   - Slack: `#monitoring`

2. **Level 2 (24 hours):**
   - Email: Daily digest

## Notification Channels

### Slack

Set up Slack webhooks for each channel:
- `#critical-alerts`
- `#high-priority-alerts`
- `#api-alerts`
- `#performance-alerts`
- `#database-alerts`
- `#uptime-alerts`

**Environment Variable:**
```bash
SLACK_WEBHOOK_URL=https://hooks.slack.com/services/YOUR/WEBHOOK/URL
```

### PagerDuty

Configure PagerDuty integration:
- Create integration key
- Set up services for each alert type
- Configure escalation policies

**Environment Variable:**
```bash
PAGERDUTY_INTEGRATION_KEY=your-integration-key
```

### Email

Configure email notifications:
- Set up SMTP server
- Configure email templates
- Set up distribution lists

## Testing Alerts

```bash
# Test all alert severities
./scripts/test-alerts.sh

# Test specific alert
curl -X POST https://api.kealee.com/api/alerts/test \
  -H "Content-Type: application/json" \
  -d '{
    "alert_name": "Test Alert",
    "severity": "critical",
    "message": "This is a test",
    "environment": "testing"
  }'
```

## Maintenance Windows

Configured maintenance windows suppress alerts during:
- **Weekly Maintenance**: Sunday 02:00-04:00 UTC
- **Monthly Updates**: First Monday of month 01:00-03:00 UTC

## On-Call Schedule

Configure on-call rotation:
- **Primary**: alice@kealee.com, bob@kealee.com
- **Secondary**: charlie@kealee.com, dana@kealee.com
- **Backup**: eve@kealee.com, frank@kealee.com

## Dashboard Setup

```bash
# Setup monitoring dashboards
./scripts/setup-monitoring-dashboards.sh
```

This creates:
- Grafana dashboard configurations
- Prometheus alert rules
- Dashboard templates

## Best Practices

1. **Alert Fatigue Prevention:**
   - Set appropriate thresholds
   - Use alert grouping
   - Implement alert suppression during maintenance

2. **Clear Alert Messages:**
   - Include context
   - Provide actionable information
   - Link to runbook procedures

3. **Regular Review:**
   - Review alert effectiveness monthly
   - Adjust thresholds based on patterns
   - Remove unnecessary alerts

4. **Documentation:**
   - Document each alert's purpose
   - Include response procedures
   - Update runbook with alert handling

## Troubleshooting

### Alerts Not Firing

1. Check alert configuration syntax
2. Verify notification channel credentials
3. Test alert endpoint: `./scripts/test-alerts.sh`
4. Check logs for errors

### Too Many Alerts

1. Review alert thresholds
2. Implement alert grouping
3. Adjust escalation timeouts
4. Use alert suppression during known issues

### Missing Alerts

1. Verify monitoring is active
2. Check alert conditions
3. Review notification channel configuration
4. Test alert endpoint

## Additional Resources

- [Sentry Alert Documentation](https://docs.sentry.io/product/alerts/)
- [PagerDuty Integration Guide](https://www.pagerduty.com/docs/)
- [Prometheus Alerting Rules](https://prometheus.io/docs/prometheus/latest/configuration/alerting_rules/)
