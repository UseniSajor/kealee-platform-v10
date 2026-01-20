# Deployment Runbook

Complete operational runbook for Kealee Platform deployments and incident response.

## Quick Start

### First-Time Deployment

```bash
# 1. Setup environment
./scripts/setup-environment.sh

# 2. Deploy to staging
./scripts/deploy-staging.sh

# 3. Run tests
./scripts/run-tests.sh --environment=staging

# 4. Deploy to production
./scripts/deploy-production.sh --approve
```

### Regular Deployment

```bash
# 1. Update code
git pull origin main

# 2. Run tests locally
npm test

# 3. Deploy to staging
npm run deploy:staging

# 4. Verify staging
npm run test:staging

# 5. Deploy to production
npm run deploy:production
```

## Alert Response

### High Priority Alerts

#### Database Down

**Symptoms:**
- Database connection errors
- `ECONNREFUSED` errors
- Application errors related to database

**Immediate Actions:**
```bash
# 1. Check PostgreSQL status
pg_isready -h localhost -p 5432
sudo systemctl status postgresql

# 2. Check disk space
df -h
# If disk is full, free up space

# 3. Restart PostgreSQL
sudo systemctl restart postgresql

# 4. Verify database is accessible
psql $DATABASE_URL -c "SELECT 1;"

# 5. Check logs
sudo tail -f /var/log/postgresql/postgresql-*.log
```

**Escalation:**
- If restart fails: Contact database admin (dba@kealee.com)
- If disk space issue: Contact infrastructure team (infra@kealee.com)

#### API Down

**Symptoms:**
- API endpoints not responding
- 500/502/503 errors
- Health check failures

**Immediate Actions:**
```bash
# 1. Check API health
curl http://localhost:3000/health

# 2. Check logs
./scripts/view-logs.sh api 1
railway logs

# 3. Restart services
./scripts/restart-all.sh

# 4. Check service status
./scripts/health-check.sh

# 5. Verify API is responding
curl https://api.kealee.com/health
```

**Escalation:**
- If restart fails: Check Railway dashboard
- If persistent: Rollback to previous deployment

#### Payment Failures

**Symptoms:**
- Stripe webhook failures
- Payment processing errors
- Checkout failures

**Immediate Actions:**
```bash
# 1. Check Stripe dashboard
# Visit: https://dashboard.stripe.com

# 2. Verify webhooks
./scripts/test-stripe-webhooks.sh

# 3. Check webhook logs
./scripts/search-logs.sh "stripe" api

# 4. Verify Stripe credentials
vercel env ls m-marketplace --token=$VERCEL_TOKEN | grep STRIPE

# 5. Test payment flow
./scripts/test-payment-processing.sh
```

**Escalation:**
- Check Stripe status page
- Verify API keys are correct
- Check webhook endpoint configuration

#### High Error Rate

**Symptoms:**
- Error rate > 1%
- Multiple errors in Sentry
- User reports of errors

**Immediate Actions:**
```bash
# 1. Check Sentry dashboard
# Visit: https://sentry.io

# 2. Identify error patterns
./scripts/search-logs.sh "error" all

# 3. Check recent deployments
vercel list m-marketplace --token=$VERCEL_TOKEN

# 4. Rollback if needed
./scripts/rollback-deployment.sh m-marketplace previous

# 5. Verify rollback
./scripts/health-check.sh
```

**Escalation:**
- If error rate > 5%: Immediate rollback
- If critical errors: Emergency hotfix deployment

### Medium Priority Alerts

#### Slow Performance

**Symptoms:**
- Response time > 2000ms
- User complaints about slowness
- High latency metrics

**Immediate Actions:**
```bash
# 1. Check slow queries
./scripts/slow-queries.sh

# 2. Optimize queries
# Add indexes for frequently queried columns
# Review query execution plans

# 3. Check Redis cache
redis-cli INFO stats | grep keyspace_hits

# 4. Monitor server resources
htop
./scripts/health-check.sh

# 5. Check API response times
./scripts/api-response-times.sh
```

**Follow-up:**
- Review database indexes
- Optimize slow queries
- Add caching where appropriate
- Scale services if needed

#### High Memory Usage

**Symptoms:**
- Memory usage > 80%
- Out of memory errors
- Service crashes

**Immediate Actions:**
```bash
# 1. Check memory usage
./scripts/health-check.sh
ps aux | grep node

# 2. Restart services
./scripts/restart-all.sh

# 3. Check for memory leaks
# Review application code
# Check for unclosed connections

# 4. Optimize code
# Review memory-intensive operations
# Implement connection pooling
```

**Follow-up:**
- Profile application memory usage
- Optimize memory-intensive code
- Consider service scaling

#### Certificate Expiration

**Symptoms:**
- SSL certificate warnings
- Browser security warnings
- Certificate expiration alerts

**Immediate Actions:**
```bash
# 1. Check certificate expiration
openssl s_client -connect api.kealee.com:443 -showcerts | openssl x509 -noout -dates

# 2. Renew SSL certificates
./scripts/setup-ssl.sh

# 3. Verify certificate
curl -I https://api.kealee.com

# 4. Update DNS if needed
./scripts/setup-dns.sh
```

**Follow-up:**
- Set up automatic certificate renewal
- Monitor certificate expiration dates

#### Backup Failures

**Symptoms:**
- Backup job failures
- Backup storage errors
- Missing backups

**Immediate Actions:**
```bash
# 1. Check backup storage
aws s3 ls s3://$BACKUP_BUCKET_NAME

# 2. Check backup script
./scripts/backup-database.sh

# 3. Verify backup script permissions
ls -la scripts/backup-database.sh

# 4. Check cron jobs
crontab -l

# 5. Fix backup script
# Review error logs
# Fix any issues
```

**Follow-up:**
- Verify backup integrity
- Test restore procedure
- Update backup schedule if needed

### Low Priority Alerts

#### High Traffic

**Symptoms:**
- Traffic spike
- Increased load
- Performance degradation

**Immediate Actions:**
```bash
# 1. Monitor traffic
# Check Vercel analytics
# Check Datadog dashboards

# 2. Scale services
# Increase Vercel function instances
# Scale Railway services

# 3. Add caching
# Enable Redis caching
# Add CDN caching

# 4. Monitor performance
./scripts/performance-test.sh
```

**Follow-up:**
- Review traffic patterns
- Optimize for high traffic
- Consider auto-scaling

#### Log Warnings

**Symptoms:**
- Warning messages in logs
- Non-critical errors
- Deprecation warnings

**Immediate Actions:**
```bash
# 1. Search for warnings
./scripts/search-logs.sh "warning" all

# 2. Investigate warnings
# Review log context
# Identify root cause

# 3. Fix warnings
# Update code
# Fix configuration issues

# 4. Monitor for recurrence
./scripts/tail-logs.sh api
```

**Follow-up:**
- Address warnings in next deployment
- Update documentation if needed

#### Security Warnings

**Symptoms:**
- Security alerts
- Vulnerability reports
- Security scan findings

**Immediate Actions:**
```bash
# 1. Review security warnings
# Check security dashboard
# Review vulnerability reports

# 2. Apply patches
npm audit fix
npm update

# 3. Review security updates
# Check for critical vulnerabilities
# Prioritize fixes

# 4. Deploy security patches
./scripts/deploy-hotfix.sh --app=affected-app --message="Security patch"
```

**Follow-up:**
- Schedule security review
- Update security policies
- Document security fixes

#### Deprecation Warnings

**Symptoms:**
- Deprecation warnings in logs
- Library deprecation notices
- API deprecation warnings

**Immediate Actions:**
```bash
# 1. Identify deprecated dependencies
npm outdated

# 2. Update dependencies
npm update

# 3. Test updates
npm test

# 4. Deploy updates
npm run deploy:staging
```

**Follow-up:**
- Plan dependency updates
- Test compatibility
- Schedule major updates

## Emergency Procedures

### Immediate Actions

1. **Identify the Issue:**
   ```bash
   # Check monitoring dashboards
   # - Sentry: https://sentry.io
   # - Datadog: https://app.datadoghq.com
   # - Vercel: Vercel dashboard
   # - Status page: https://status.kealee.com
   
   # Run health check
   ./scripts/health-check.sh
   
   # Check logs
   ./scripts/view-logs.sh all 1
   ```

2. **Isolate the Problem:**
   ```bash
   # Determine affected services
   ./scripts/troubleshoot.sh
   
   # Check service status
   ./scripts/check-services.sh
   
   # Identify root cause
   ./scripts/search-logs.sh "error" all
   ```

3. **Implement Fix:**
   ```bash
   # Option 1: Apply hotfix
   ./scripts/deploy-hotfix.sh --app=affected-app --message="Emergency fix"
   
   # Option 2: Rollback
   ./scripts/rollback-deployment.sh affected-app previous
   
   # Option 3: Restart services
   ./scripts/restart-all.sh
   ```

4. **Communicate:**
   - Update status page
   - Notify team via Slack
   - Send email to stakeholders

### Rollback Procedure

```bash
# 1. Stop traffic to affected service (if needed)
# This is usually handled automatically by Vercel/Railway

# 2. Rollback deployment
./scripts/rollback-deployment.sh --app=affected-app --version=previous

# 3. Verify rollback
./scripts/health-check.sh
curl https://affected-app.kealee.com/health

# 4. Monitor for issues
./scripts/tail-logs.sh affected-app

# 5. Resume normal operations
# Traffic resumes automatically after rollback
```

### Service Recovery

```bash
# Database Recovery
./scripts/restore-database.sh backup_file.sql

# Service Restart
./scripts/restart-all.sh

# Repair Database
./scripts/repair-database.sh

# Clear Cache
redis-cli FLUSHALL
```

## Communication Plan

### Internal Communication

**Slack:**
- Channel: `#platform-alerts`
- Use for: Real-time alerts, incident updates, team coordination
- Format: `[ALERT] <severity> <service> <description>`

**Email:**
- Address: `platform-team@kealee.com`
- Use for: Detailed incident reports, post-mortems, scheduled maintenance
- Format: Subject line includes severity and service name

**Phone:**
- On-call rotation: See on-call schedule
- Use for: Critical incidents requiring immediate response
- Escalation: If no response within 15 minutes

### External Communication

**Status Page:**
- URL: https://status.kealee.com
- Use for: Public incident updates, maintenance notifications
- Update frequency: Every 15 minutes during incidents

**Twitter:**
- Handle: `@kealeestatus`
- Use for: Quick updates, major incidents
- Format: Brief status updates with link to status page

**Email:**
- Address: `status@kealee.com`
- Use for: Detailed incident reports, scheduled maintenance notifications
- Recipients: Subscribed users

### Communication Templates

**Incident Start:**
```
[INCIDENT] <Service> experiencing issues
Status: Investigating
Impact: <Description>
Updates: https://status.kealee.com
```

**Incident Update:**
```
[UPDATE] <Service> - <Status>
Progress: <Description>
ETA: <Time>
Updates: https://status.kealee.com
```

**Incident Resolved:**
```
[RESOLVED] <Service> - Issue resolved
Duration: <Time>
Root Cause: <Description>
Prevention: <Actions taken>
```

## Deployment Procedures

### Pre-Deployment Checklist

```bash
# Run automated checklist
./scripts/pre-deployment-checklist.sh

# Manual checks:
# - Code review completed
# - Tests passing
# - Documentation updated
# - Environment variables set
# - Database migrations ready
```

### Staging Deployment

```bash
# 1. Deploy to staging
./scripts/deploy-staging.sh

# 2. Run tests
./scripts/test-staging.sh

# 3. Verify deployment
./scripts/health-check.sh

# 4. Monitor for issues
./scripts/tail-logs.sh staging-app
```

### Production Deployment

```bash
# 1. Run pre-deployment checks
./scripts/pre-deployment-checklist.sh

# 2. Backup database
./scripts/backup-database.sh

# 3. Deploy to production
./scripts/deploy-production.sh

# 4. Run migrations (if needed)
npm run db:migrate:prod

# 5. Verify deployment
./scripts/health-check.sh
./scripts/performance-test.sh

# 6. Monitor for issues
./scripts/tail-logs.sh production-app
```

## Monitoring and Alerts

### Key Metrics to Monitor

- **Error Rate:** < 1%
- **Response Time:** < 500ms (p95)
- **Uptime:** > 99.9%
- **Database Connections:** < 80% of max
- **Memory Usage:** < 80%
- **Disk Space:** > 20% free

### Alert Thresholds

- **Critical:** Immediate response required
- **High:** Response within 1 hour
- **Medium:** Response within 4 hours
- **Low:** Response within 24 hours

## Post-Incident Procedures

### Post-Mortem Process

**Timeline:**
- **Immediate:** Restore service
- **24 hours:** Initial analysis
- **48 hours:** Root cause identified
- **1 week:** Preventive measures implemented

### Incident Review

1. **Document Incident:**
   - Timeline of events
   - Root cause analysis
   - Impact assessment
   - Actions taken

2. **Post-Mortem Documentation:**
   ```markdown
   ## Issue Summary
   - What happened: [Description]
   - When: [Timestamp]
   - Duration: [Time]
   
   ## Root Cause
   - Why it happened: [Analysis]
   - Contributing factors: [List]
   
   ## Impact
   - Who was affected: [Users/Services]
   - Business impact: [Description]
   - Metrics: [Numbers]
   
   ## Solution
   - How it was fixed: [Steps taken]
   - Time to resolution: [Duration]
   
   ## Prevention
   - How to prevent recurrence: [Actions]
   - Monitoring improvements: [Changes]
   - Process improvements: [Updates]
   ```

3. **Post-Mortem Meeting:**
   - Schedule within 48 hours
   - Include all stakeholders
   - Document lessons learned
   - Create action items
   - Assign owners and deadlines

4. **Follow-up:**
   - Implement preventive measures
   - Update runbook
   - Improve monitoring
   - Test recovery procedures
   - Review action items weekly until complete

## Additional Resources

- [Troubleshooting Guide](./troubleshooting.md)
- [Deployment Procedures](./procedures.md)
- [Emergency Contacts](./troubleshooting.md#quick-reference)

## Quick Reference

```bash
# Health Check
./scripts/health-check.sh

# View Logs
./scripts/view-logs.sh all 24

# Search Logs
./scripts/search-logs.sh "error"

# Restart Services
./scripts/restart-all.sh

# Rollback
./scripts/rollback-deployment.sh app-name

# Emergency Hotfix
./scripts/deploy-hotfix.sh --app=app-name --message="Fix"
```
