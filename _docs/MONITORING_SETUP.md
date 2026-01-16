# Monitoring Dashboard Setup

## Overview

This document describes the monitoring infrastructure for the Kealee Platform, including metrics, alerts, and dashboards.

## Monitoring Stack

### Recommended Tools

1. **Application Performance Monitoring (APM)**
   - New Relic or Datadog
   - Real-time performance metrics
   - Error tracking
   - Transaction tracing

2. **Log Aggregation**
   - ELK Stack (Elasticsearch, Logstash, Kibana)
   - Or cloud service (CloudWatch, Datadog Logs)
   - Centralized log management
   - Search and analysis

3. **Uptime Monitoring**
   - Pingdom or UptimeRobot
   - External health checks
   - Alert on downtime

4. **Error Tracking**
   - Sentry
   - Real-time error notifications
   - Stack trace analysis
   - Release tracking

## Key Metrics to Monitor

### Application Metrics

**Response Times:**
- API endpoint response times (p50, p95, p99)
- Database query times
- Third-party API call times
- Frontend page load times

**Throughput:**
- Requests per second
- Transactions per minute
- User sessions
- API calls by endpoint

**Error Rates:**
- HTTP error rates (4xx, 5xx)
- Application errors
- Database errors
- Third-party service errors

### Business Metrics

**Project Metrics:**
- Active projects count
- Projects by status
- Average project duration
- Milestone approval time
- Closeout completion rate

**Payment Metrics:**
- Total escrow balance
- Payment release volume
- Payment success rate
- Average payment processing time
- Failed payment count

**User Metrics:**
- Active users (DAU, MAU)
- New signups
- User retention rate
- Feature adoption rates
- Support ticket volume

### Infrastructure Metrics

**Server Metrics:**
- CPU usage
- Memory usage
- Disk I/O
- Network traffic
- Database connections

**Database Metrics:**
- Query performance
- Connection pool usage
- Replication lag
- Backup status
- Storage usage

**Third-Party Services:**
- Stripe API status
- DocuSign API status
- Email service status
- File storage status

## Alert Configuration

### Critical Alerts (Immediate Response)

**System Down:**
- API health check fails
- Database connection lost
- Application crashes

**Payment Issues:**
- Payment processing failures > 5%
- Escrow balance discrepancies
- Stripe API errors

**Security:**
- Unusual login patterns
- Failed authentication spikes
- Data breach indicators

### Warning Alerts (Review Within 1 Hour)

**Performance Degradation:**
- Response time > 1 second (p95)
- Error rate > 1%
- Database query time > 500ms

**Business Metrics:**
- Project creation rate drops > 20%
- Milestone approval time > 48 hours average
- Support ticket volume spikes

### Info Alerts (Review Daily)

**Capacity Planning:**
- Database storage > 80%
- API rate limit approaching
- User growth trends

## Dashboard Setup

### Main Dashboard

**Overview Section:**
- System health status (green/yellow/red)
- Active users count
- Active projects count
- Total escrow balance
- Error rate (last 24 hours)
- Response time (p95)

**Project Metrics:**
- Projects by status (pie chart)
- Projects created (time series)
- Average project duration
- Milestone approval rate

**Payment Metrics:**
- Escrow balance trend
- Payment volume (time series)
- Payment success rate
- Failed payments count

**System Performance:**
- API response times (time series)
- Error rates (time series)
- Database query times
- Third-party service status

### Admin Dashboard

**User Management:**
- Active users
- New signups (daily/weekly)
- User activity levels
- Support tickets by status

**Project Management:**
- Projects requiring attention
- Stuck projects (status unchanged > 7 days)
- Disputes by status
- Closeout completion rate

**Financial:**
- Total escrow balance
- Payment transactions (last 24 hours)
- Failed payments
- Refund requests

### Technical Dashboard

**Application Health:**
- API endpoint status
- Database connection pool
- Cache hit rates
- Queue depths

**Infrastructure:**
- Server resource usage
- Database performance
- Network traffic
- Storage usage

**Errors:**
- Error rate by type
- Top errors (last 24 hours)
- Error trends
- Stack traces

## Implementation Steps

### Phase 1: Basic Monitoring (Week 1)

1. **Set up APM tool**
   - Install agent in API service
   - Configure key transactions
   - Set up basic dashboards

2. **Configure health checks**
   - `/health` endpoint monitoring
   - `/health/db` endpoint monitoring
   - External uptime checks

3. **Set up error tracking**
   - Install Sentry
   - Configure error capture
   - Set up alert rules

### Phase 2: Business Metrics (Week 2)

1. **Instrument business events**
   - Project creation events
   - Milestone approval events
   - Payment release events
   - Closeout completion events

2. **Create business dashboards**
   - Project metrics dashboard
   - Payment metrics dashboard
   - User metrics dashboard

3. **Set up business alerts**
   - Project creation drops
   - Payment failures
   - User activity anomalies

### Phase 3: Advanced Monitoring (Week 3)

1. **Set up log aggregation**
   - Configure log shipping
   - Create log dashboards
   - Set up log-based alerts

2. **Performance optimization**
   - Identify slow queries
   - Optimize API endpoints
   - Cache frequently accessed data

3. **Capacity planning**
   - Track resource usage trends
   - Set up capacity alerts
   - Plan scaling strategies

## Monitoring Endpoints

### Health Check Endpoints

```typescript
// Basic health check
GET /health
Response: { status: 'ok' }

// Database health check
GET /health/db
Response: { status: 'ok', db: 'ok' }

// Detailed health check (admin only)
GET /health/detailed
Response: {
  status: 'ok',
  database: { status: 'ok', responseTime: 10 },
  stripe: { status: 'ok', responseTime: 50 },
  docusign: { status: 'ok', responseTime: 30 }
}
```

### Metrics Endpoint (Admin Only)

```typescript
GET /admin/metrics
Response: {
  projects: {
    active: 150,
    byStatus: { ACTIVE: 100, CLOSEOUT: 50 },
    createdToday: 5
  },
  payments: {
    totalEscrow: 2500000,
    releasedToday: 50000,
    successRate: 0.99
  },
  users: {
    active: 500,
    newToday: 10
  },
  system: {
    responseTime: { p50: 50, p95: 200, p99: 500 },
    errorRate: 0.001,
    uptime: 99.9
  }
}
```

## Alert Channels

### Notification Methods

1. **Email**: For all alerts
2. **Slack**: For critical and warning alerts
3. **PagerDuty**: For critical alerts requiring immediate response
4. **SMS**: For critical system outages

### Alert Routing

- **Critical**: → PagerDuty + Slack + Email
- **Warning**: → Slack + Email
- **Info**: → Email (daily digest)

## Maintenance

### Regular Tasks

**Daily:**
- Review error logs
- Check alert history
- Review performance metrics

**Weekly:**
- Review business metrics
- Analyze trends
- Optimize slow queries
- Update dashboards

**Monthly:**
- Capacity planning review
- Cost optimization
- Dashboard cleanup
- Alert rule review

## Best Practices

1. **Start Simple**: Begin with basic monitoring, add complexity over time
2. **Focus on Business Impact**: Monitor metrics that affect users
3. **Set Realistic Thresholds**: Avoid alert fatigue
4. **Document Everything**: Keep runbooks for common issues
5. **Regular Review**: Review and adjust alerts regularly
6. **Test Alerts**: Verify alerts work correctly
7. **Automate Responses**: Auto-remediate common issues when possible

## Tools Configuration Examples

### New Relic Configuration

```yaml
# newrelic.yml
app_name: Kealee API
license_key: YOUR_LICENSE_KEY
distributed_tracing:
  enabled: true
transaction_tracer:
  enabled: true
  record_sql: obfuscated
error_collector:
  enabled: true
```

### Sentry Configuration

```typescript
// sentry.config.ts
Sentry.init({
  dsn: 'YOUR_DSN',
  environment: process.env.NODE_ENV,
  tracesSampleRate: 0.1,
  beforeSend(event) {
    // Filter sensitive data
    return event;
  }
});
```

### Health Check Implementation

```typescript
// services/api/src/routes/health.ts
fastify.get('/health', async () => {
  return { status: 'ok', timestamp: new Date().toISOString() }
})

fastify.get('/health/db', async () => {
  const start = Date.now()
  await prisma.$queryRaw`SELECT 1`
  const duration = Date.now() - start
  return { 
    status: 'ok', 
    db: 'ok',
    responseTime: duration 
  }
})
```

---

**Next Steps:**
1. Choose monitoring tools based on budget and requirements
2. Set up basic health checks
3. Configure error tracking
4. Create initial dashboards
5. Set up alert rules
6. Train team on monitoring tools

**Questions? Contact DevOps team at devops@kealee.com**
