# Monitoring Dashboard Setup & Configuration

## Overview

This document describes the monitoring dashboard setup for Kealee Platform, including metrics collection, alerting, and visualization.

## Architecture

### Monitoring Stack

- **Application Metrics**: Custom Fastify metrics middleware
- **Database Monitoring**: PostgreSQL query performance tracking
- **Error Tracking**: Structured error logging with Pino
- **Uptime Monitoring**: Health check endpoints
- **Payment Monitoring**: Stripe webhook monitoring
- **User Activity**: Event logging system

## Dashboard Components

### 1. System Health Dashboard

**Location**: `/admin/monitoring/health`

**Metrics Displayed**:
- API uptime percentage
- Average response time
- Request rate (requests/second)
- Error rate (errors/requests)
- Database connection pool status
- Active user sessions

**Health Status Indicators**:
- 🟢 **Healthy**: All systems operational
- 🟡 **Degraded**: Some issues, but functional
- 🔴 **Critical**: Major issues, action required

### 2. Performance Dashboard

**Location**: `/admin/monitoring/performance`

**Metrics**:
- **Response Times**:
  - P50 (median)
  - P95 (95th percentile)
  - P99 (99th percentile)
  - Max response time
- **Throughput**:
  - Requests per second
  - Successful requests
  - Failed requests
- **Database Performance**:
  - Query execution time
  - Slow queries (>1s)
  - Connection pool usage
  - Transaction rate

**Time Ranges**:
- Last hour
- Last 24 hours
- Last 7 days
- Last 30 days

### 3. Financial Dashboard

**Location**: `/admin/monitoring/financial`

**Metrics**:
- **Escrow**:
  - Total escrow balance
  - Active escrow accounts
  - Frozen escrow accounts
  - Average account balance
- **Payments**:
  - Payments processed (24h, 7d, 30d)
  - Payment success rate
  - Average payment amount
  - Failed payment count
- **Revenue**:
  - Platform fees collected
  - Subscription revenue
  - Transaction volume

### 4. Error Dashboard

**Location**: `/admin/monitoring/errors`

**Error Tracking**:
- Error count by type
- Error rate trend
- Recent errors (last 100)
- Error details (stack traces, context)
- Error resolution status

**Error Categories**:
- **Validation Errors**: Invalid input (400)
- **Authentication Errors**: Auth failures (401)
- **Authorization Errors**: Permission denied (403)
- **Not Found Errors**: Missing resources (404)
- **Server Errors**: Internal errors (500)
- **External Service Errors**: Third-party failures

### 5. User Activity Dashboard

**Location**: `/admin/monitoring/activity`

**Metrics**:
- Active users (current, 24h, 7d)
- New user registrations
- User sessions
- Feature usage statistics
- Geographic distribution

## Alert Configuration

### Alert Types

#### Critical Alerts (Immediate Action Required)

**Triggers**:
- System downtime (>1 minute)
- Payment processing failure rate >5%
- Database connection failures
- Security breach detected
- Escrow balance discrepancies

**Notification Channels**:
- Email (admin team)
- SMS (on-call engineer)
- Slack (#alerts-critical)
- PagerDuty (if configured)

#### Warning Alerts (Monitor Closely)

**Triggers**:
- Error rate >1%
- Response time P95 >2 seconds
- Database query time >5 seconds
- Escrow balance <$1000
- High dispute rate (>10% of projects)

**Notification Channels**:
- Email (admin team)
- Slack (#alerts-warning)

#### Info Alerts (Informational)

**Triggers**:
- Scheduled maintenance
- Feature deployments
- User milestones (1000th user, etc.)
- Daily/weekly summaries

**Notification Channels**:
- Email (optional)
- Slack (#alerts-info)

### Alert Configuration

**Example Alert Rules**:

```yaml
alerts:
  - name: High Error Rate
    condition: error_rate > 0.01
    duration: 5m
    severity: warning
    channels: [email, slack]
  
  - name: Payment Processing Failure
    condition: payment_failure_rate > 0.05
    duration: 1m
    severity: critical
    channels: [email, sms, slack, pagerduty]
  
  - name: Database Slow Queries
    condition: slow_query_count > 10
    duration: 5m
    severity: warning
    channels: [email, slack]
```

## Health Check Endpoints

### Basic Health Check

**Endpoint**: `GET /health`

**Response**:
```json
{
  "status": "ok",
  "timestamp": "2026-01-14T12:00:00Z"
}
```

### Database Health Check

**Endpoint**: `GET /health/db`

**Response**:
```json
{
  "status": "ok",
  "db": "ok",
  "responseTime": 15
}
```

### Detailed Health Check

**Endpoint**: `GET /health/detailed`

**Response**:
```json
{
  "status": "ok",
  "services": {
    "database": {
      "status": "ok",
      "responseTime": 15,
      "poolSize": 10,
      "activeConnections": 3
    },
    "stripe": {
      "status": "ok",
      "lastCheck": "2026-01-14T12:00:00Z"
    },
    "docusign": {
      "status": "ok",
      "lastCheck": "2026-01-14T12:00:00Z"
    }
  },
  "metrics": {
    "uptime": 86400,
    "requests": 125000,
    "errors": 45,
    "errorRate": 0.00036
  }
}
```

## Metrics Collection

### Application Metrics

**Middleware**: `src/middleware/metrics.middleware.ts`

**Collected Metrics**:
- Request count (by method, route, status)
- Response time (by route)
- Error count (by type, route)
- Active requests
- Request size
- Response size

### Database Metrics

**Colisma Query Event Tracking**

**Collected Metrics**:
- Query count
- Query duration
- Slow queries (>1s)
- Connection pool metrics
- Transaction metrics

### Custom Metrics

**Business Metrics**:
- Projects created
- Contracts signed
- Milestones approved
- Payments released
- Disputes filed
- Users registered

## Logging

### Log Levels

- **ERROR**: Errors requiring attention
- **WARN**: Warnings that should be reviewed
- **INFO**: Informational messages
- **DEBUG**: Debug information (development only)

### Log Format

**Structured JSON Logging** (Pino):

```json
{
  "level": 30,
  "time": 1705238400000,
  "msg": "Milestone approved",
  "userId": "user-123",
  "projectId": "project-456",
  "milestoneId": "milestone-789",
  "requestId": "req-abc123"
}
```

### Log Retention

- **Application Logs**: 30 days
- **Error Logs**: 90 days
- **Audit Logs**: 7 years (compliance)
- **Access Logs**: 90 days

## Dashboard Access

### Permissions

- **View Only**: Support staff, PMs
- **Full Access**: Admins, engineers
- **Read-Only Export**: External auditors

### Authentication

- SSO integration (if configured)
- Role-based access control
- Session timeout: 8 hours
- 2FA required for admin accounts

## Setup Instructions

### 1. Environment Variables

```bash
# Monitoring Configuration
MONITORING_ENABLED=true
METRICS_PORT=9090
ALERT_EMAIL=alerts@kealee.com
SLACK_WEBHOOK_URL=https://hooks.slack.com/...
PAGERDUTY_API_KEY=...
```

### 2. Enable Metrics Middleware

In `services/api/src/index.ts`:

```typescript
import { metricsMiddleware } from './middleware/metrics.middleware'

// Register metrics middleware
await fastify.register(metricsMiddleware)
```

### 3. Configure Alerts

Edit `config/alerts.yaml` with your alert rules.

### 4. Access Dashboard

Navigate to: `https://admin.kealee.com/monitoring`

## Maintenance

### Daily Tasks

- Review error dashboard
- Check critical alerts
- Monitor payment processing
- Review performance metrics

### Weekly Tasks

- Review alert configuration
- Analyze error trends
- Performance optimization review
- Capacity planning

### Monthly Tasks

- Review log retention policies
- Update alert thresholds
- Performance baseline comparison
- Security audit review

## Troubleshooting

### Dashboard Not Loading

1. Check authentication
2. Verify permissions
3. Check API connectivity
4. Review browser console

### Metrics Not Updating

1. Verify metrics middleware is enabled
2. Check database connectivity
3. Review application logs
4. Verify time synchronization

### Alerts Not Firing

1. Check alert configuration
2. Verify notification channels
3. Test alert triggers manually
4. Review alert logs

---

**Last Updated**: January 2026  
**Version**: 1.0.0  
**Maintained By**: DevOps Team
