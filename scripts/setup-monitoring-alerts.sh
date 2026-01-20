#!/bin/bash
# scripts/setup-monitoring-alerts.sh
# Set up comprehensive monitoring alerts

set -e

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m'

echo "🚨 Setting up monitoring alerts..."
echo ""

# 1. Create alert configuration directory
mkdir -p config/alerts
echo "✅ Created config/alerts/ directory"

# 2. Configure Sentry alerts
cat > config/alerts/sentry-alerts.yaml << 'EOF'
# Sentry Alert Rules

alerts:
  # Critical Errors
  - name: "Critical Error Rate > 5%"
    conditions:
      - "events(5m):error:rate() > 5"
    actions:
      - type: "email"
        recipients: ["platform-team@kealee.com"]
      - type: "slack"
        channel: "#critical-alerts"
      - type: "pagerduty"
        service: "platform-critical"
    
  # Performance Degradation
  - name: "P95 Latency > 2000ms"
    conditions:
      - "p95(duration):transaction:rate() > 2000"
    actions:
      - type: "slack"
        channel: "#performance-alerts"
      - type: "email"
        recipients: ["performance-team@kealee.com"]
    
  # API Errors
  - name: "API Error Spike"
    conditions:
      - "increase(events(5m):error:count()) > 100"
    actions:
      - type: "slack"
        channel: "#api-alerts"
    
  # User Impact
  - name: "High User Impact Errors"
    conditions:
      - "affected_users(5m):error:count() > 50"
    actions:
      - type: "pagerduty"
        service: "user-impact"
      - type: "slack"
        channel: "#user-alerts"
EOF

echo "✅ Created Sentry alert configuration"

# 3. Set up uptime monitoring
cat > config/alerts/uptime-monitoring.yaml << 'EOF'
# Uptime Monitoring

endpoints:
  - name: "Marketplace Homepage"
    url: "https://marketplace.kealee.com"
    interval: 60
    timeout: 10
    alerts:
      - type: "slack"
        channel: "#uptime-alerts"
        conditions:
          - "status != 200"
          - "response_time > 5000"
    
  - name: "API Health"
    url: "https://api.kealee.com/health"
    interval: 30
    timeout: 5
    alerts:
      - type: "pagerduty"
        service: "api-critical"
        conditions:
          - "status != 200"
    
  - name: "Authentication Service"
    url: "https://api.kealee.com/api/auth/health"
    interval: 30
    timeout: 5
    alerts:
      - type: "slack"
        channel: "#auth-alerts"
        conditions:
          - "status != 200"
    
  - name: "Payment Webhook"
    url: "https://api.kealee.com/api/webhooks/health"
    interval: 60
    timeout: 10
    alerts:
      - type: "pagerduty"
        service: "payments-critical"
        conditions:
          - "status != 200"
EOF

echo "✅ Created uptime monitoring configuration"

# 4. Configure performance alerts
cat > config/alerts/performance-alerts.yaml << 'EOF'
# Performance Alerts

metrics:
  # Web Vitals
  - name: "LCP > 2500ms"
    query: "web_vitals_lcp{p50>2500}"
    window: "5m"
    alert:
      - type: "slack"
        channel: "#web-vitals-alerts"
    
  - name: "CLS > 0.1"
    query: "web_vitals_cls{p75>0.1}"
    window: "5m"
    alert:
      - type: "slack"
        channel: "#web-vitals-alerts"
    
  # API Performance
  - name: "API P95 > 1000ms"
    query: "api_response_time{p95>1000}"
    window: "5m"
    alert:
      - type: "slack"
        channel: "#api-performance"
    
  # Database Performance
  - name: "Slow Queries > 100ms"
    query: "db_query_duration{p95>100}"
    window: "5m"
    alert:
      - type: "slack"
        channel: "#database-alerts"
    
  # Cache Performance
  - name: "Redis Cache Hit Rate < 90%"
    query: "redis_cache_hit_rate{rate<0.9}"
    window: "5m"
    alert:
      - type: "slack"
        channel: "#cache-alerts"
EOF

echo "✅ Created performance alerts configuration"

# 5. Set up database monitoring
cat > config/alerts/database-alerts.yaml << 'EOF'
# Database Alerts

postgresql:
  metrics:
    # Connection Pool
    - name: "High Connection Usage"
      query: "pg_stat_activity{usage>0.8}"
      threshold: 0.8
      alert:
        - type: "pagerduty"
          service: "database-critical"
    
    # Slow Queries
    - name: "Slow Query Count"
      query: "pg_stat_statements{calls>1000,mean_time>100}"
      window: "5m"
      alert:
        - type: "slack"
          channel: "#database-alerts"
    
    # Replication Lag
    - name: "Replication Lag"
      query: "pg_replication_lag{seconds>30}"
      alert:
        - type: "pagerduty"
          service: "database-critical"
    
    # Disk Space
    - name: "Low Disk Space"
      query: "disk_usage{percent>90}"
      alert:
        - type: "pagerduty"
          service: "infrastructure"
    
    # Dead Tuples
    - name: "High Dead Tuple Ratio"
      query: "pg_stat_user_tables{n_dead_tup/n_live_tup>0.2}"
      alert:
        - type: "slack"
          channel: "#database-maintenance"
EOF

echo "✅ Created database alerts configuration"

# 6. Create alert escalation policy
cat > config/alerts/escalation-policy.yaml << 'EOF'
# Alert Escalation Policy

escalation_policies:
  critical:
    levels:
      - level: 1
        timeout: "5m"
        notify:
          - "slack:#critical-alerts"
          - "email:oncall-primary@kealee.com"
      
      - level: 2
        timeout: "10m"
        notify:
          - "sms:+15551234567"
          - "pagerduty:platform-critical"
      
      - level: 3
        timeout: "15m"
        notify:
          - "phone:+15551234567"
          - "slack:#all-hands"
          - "email:cto@kealee.com"
  
  high:
    levels:
      - level: 1
        timeout: "15m"
        notify:
          - "slack:#high-priority-alerts"
          - "email:team-lead@kealee.com"
      
      - level: 2
        timeout: "30m"
        notify:
          - "slack:#engineering"
          - "email:director@kealee.com"
  
  medium:
    levels:
      - level: 1
        timeout: "1h"
        notify:
          - "slack:#alerts"
      
      - level: 2
        timeout: "4h"
        notify:
          - "email:platform-team@kealee.com"
  
  low:
    levels:
      - level: 1
        timeout: "4h"
        notify:
          - "slack:#monitoring"
      
      - level: 2
        timeout: "24h"
        notify:
          - "email:daily-digest@kealee.com"

# On-call Schedule
on_call:
  primary:
    - "alice@kealee.com"
    - "bob@kealee.com"
  secondary:
    - "charlie@kealee.com"
    - "dana@kealee.com"
  backup:
    - "eve@kealee.com"
    - "frank@kealee.com"

# Maintenance Windows
maintenance_windows:
  - name: "Weekly Maintenance"
    schedule: "Sun 02:00-04:00 UTC"
    suppress_alerts: true
  
  - name: "Monthly Updates"
    schedule: "First Monday of month 01:00-03:00 UTC"
    suppress_alerts: true
EOF

echo "✅ Created escalation policy configuration"

# 7. Create monitoring dashboard setup script
cat > scripts/setup-monitoring-dashboards.sh << 'DASHBOARD_SCRIPT'
#!/bin/bash
# scripts/setup-monitoring-dashboards.sh

set -e

echo "📊 Setting up monitoring dashboards..."
echo ""

# Create dashboard directory
mkdir -p config/dashboards

# Create Grafana dashboards (if using Grafana)
cat > config/dashboards/overview.json << 'DASHBOARD_EOF'
{
  "dashboard": {
    "title": "Platform Overview",
    "panels": [
      {
        "title": "Uptime",
        "type": "stat",
        "targets": [
          {
            "expr": "up{instance=\"api.kealee.com\"}",
            "legendFormat": "API"
          }
        ]
      },
      {
        "title": "Error Rate",
        "type": "graph",
        "targets": [
          {
            "expr": "rate(http_requests_total{status=~\"5..\"}[5m])",
            "legendFormat": "5xx Errors"
          }
        ]
      }
    ]
  }
}
DASHBOARD_EOF

echo "✅ Created Grafana dashboard configuration"

# Setup Prometheus alerts
mkdir -p config/prometheus

cat > config/prometheus/alerts.yml << 'PROMETHEUS_EOF'
groups:
  - name: platform
    rules:
      - alert: HighErrorRate
        expr: rate(http_requests_total{status=~"5.."}[5m]) > 0.05
        for: 5m
        labels:
          severity: critical
        annotations:
          summary: "High error rate detected"
          description: "Error rate is above 5% for 5 minutes"
      
      - alert: ServiceDown
        expr: up == 0
        for: 1m
        labels:
          severity: critical
        annotations:
          summary: "Service {{ $labels.instance }} is down"
          description: "{{ $labels.instance }} has been down for more than 1 minute"
      
      - alert: HighResponseTime
        expr: histogram_quantile(0.95, rate(http_request_duration_seconds_bucket[5m])) > 1
        for: 5m
        labels:
          severity: warning
        annotations:
          summary: "High response time detected"
          description: "95th percentile response time is above 1 second"
PROMETHEUS_EOF

echo "✅ Created Prometheus alerts configuration"
echo "✅ Monitoring dashboards configured"
DASHBOARD_SCRIPT

chmod +x scripts/setup-monitoring-dashboards.sh
echo "✅ Created monitoring dashboard setup script"

# 8. Create alert testing script
cat > scripts/test-alerts.sh << 'TEST_SCRIPT'
#!/bin/bash
# scripts/test-alerts.sh
# Test alert system

set -e

echo "🔔 Testing alert system..."
echo ""

API_URL=${API_URL:-"https://api.kealee.com"}

# Test critical alert
echo "Testing critical alert..."
curl -X POST \
  -H "Content-Type: application/json" \
  -d "{
    \"alert_name\": \"TEST: Critical Error\",
    \"severity\": \"critical\",
    \"message\": \"This is a test alert\",
    \"environment\": \"testing\",
    \"timestamp\": \"$(date -Iseconds)\"
  }" \
  "${API_URL}/api/alerts/test" 2>/dev/null || echo "⚠️  Alert endpoint not available (expected in development)"

# Test high priority alert
echo "Testing high priority alert..."
curl -X POST \
  -H "Content-Type: application/json" \
  -d "{
    \"alert_name\": \"TEST: Performance Issue\",
    \"severity\": \"high\",
    \"message\": \"Response time above threshold\",
    \"environment\": \"testing\",
    \"timestamp\": \"$(date -Iseconds)\"
  }" \
  "${API_URL}/api/alerts/test" 2>/dev/null || echo "⚠️  Alert endpoint not available (expected in development)"

# Test medium priority alert
echo "Testing medium priority alert..."
curl -X POST \
  -H "Content-Type: application/json" \
  -d "{
    \"alert_name\": \"TEST: Warning Alert\",
    \"severity\": \"medium\",
    \"message\": \"Disk usage above 80%\",
    \"environment\": \"testing\",
    \"timestamp\": \"$(date -Iseconds)\"
  }" \
  "${API_URL}/api/alerts/test" 2>/dev/null || echo "⚠️  Alert endpoint not available (expected in development)"

echo ""
echo "✅ Alert tests sent. Check notification channels."
TEST_SCRIPT

chmod +x scripts/test-alerts.sh
echo "✅ Created alert testing script"

# 9. Create alert webhook endpoint template
mkdir -p apps/api/app/api/alerts

cat > apps/api/app/api/alerts/test/route.ts << 'ALERT_ENDPOINT'
// apps/api/app/api/alerts/test/route.ts
// Alert webhook endpoint

import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { alert_name, severity, message, environment } = body;

    // Log the alert
    console.log(`Alert received: ${alert_name}`, {
      severity,
      message,
      environment,
      timestamp: new Date().toISOString()
    });

    // Send to different channels based on severity
    switch (severity) {
      case 'critical':
        // Send to PagerDuty
        await sendToPagerDuty(alert_name, message);
        // Send to Slack critical channel
        await sendToSlack('#critical-alerts', alert_name, message);
        // Send email
        await sendEmail('oncall@kealee.com', alert_name, message);
        break;
      
      case 'high':
        await sendToSlack('#high-priority-alerts', alert_name, message);
        await sendEmail('platform-team@kealee.com', alert_name, message);
        break;
      
      case 'medium':
        await sendToSlack('#alerts', alert_name, message);
        break;
      
      case 'low':
        await sendToSlack('#monitoring', alert_name, message);
        break;
    }

    return NextResponse.json({ received: true }, { status: 200 });
  } catch (error) {
    console.error('Error processing alert:', error);
    return NextResponse.json(
      { error: 'Failed to process alert' },
      { status: 500 }
    );
  }
}

async function sendToSlack(channel: string, title: string, message: string) {
  if (!process.env.SLACK_WEBHOOK_URL) {
    console.log(`Would send to Slack ${channel}: ${title} - ${message}`);
    return;
  }

  const payload = {
    channel,
    attachments: [{
      color: getColorForSeverity(title),
      title,
      text: message,
      ts: Math.floor(Date.now() / 1000)
    }]
  };

  try {
    await fetch(process.env.SLACK_WEBHOOK_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
  } catch (error) {
    console.error('Error sending to Slack:', error);
  }
}

async function sendToPagerDuty(title: string, message: string) {
  if (!process.env.PAGERDUTY_INTEGRATION_KEY) {
    console.log(`Would send to PagerDuty: ${title} - ${message}`);
    return;
  }

  const payload = {
    event_action: 'trigger',
    routing_key: process.env.PAGERDUTY_INTEGRATION_KEY,
    payload: {
      summary: title,
      source: 'monitoring-system',
      severity: 'critical',
      timestamp: new Date().toISOString()
    }
  };

  try {
    await fetch('https://events.pagerduty.com/v2/enqueue', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
  } catch (error) {
    console.error('Error sending to PagerDuty:', error);
  }
}

async function sendEmail(to: string, subject: string, body: string) {
  // Implement email sending logic
  console.log(`Would send email to ${to}: ${subject} - ${body}`);
}

function getColorForSeverity(severity: string): string {
  switch (severity.toLowerCase()) {
    case 'critical': return '#ff0000';
    case 'high': return '#ff6600';
    case 'medium': return '#ffcc00';
    case 'low': return '#00cc00';
    default: return '#cccccc';
  }
}
ALERT_ENDPOINT

echo "✅ Created alert webhook endpoint template"

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✅ Monitoring alerts setup complete!"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "📁 Configuration files created in config/alerts/"
echo "   - sentry-alerts.yaml"
echo "   - uptime-monitoring.yaml"
echo "   - performance-alerts.yaml"
echo "   - database-alerts.yaml"
echo "   - escalation-policy.yaml"
echo ""
echo "🚨 Next steps:"
echo "   1. Review and customize alert configurations"
echo "   2. Set up notification channels (Slack, PagerDuty, Email)"
echo "   3. Configure environment variables:"
echo "      - SLACK_WEBHOOK_URL"
echo "      - PAGERDUTY_INTEGRATION_KEY"
echo "   4. Test alerts: ./scripts/test-alerts.sh"
echo "   5. Set up dashboards: ./scripts/setup-monitoring-dashboards.sh"
echo ""
