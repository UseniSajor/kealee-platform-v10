# Rollback Plan - Kealee Platform

## Overview

This document outlines the rollback procedures for Kealee Platform deployments, including database migrations, code deployments, and configuration changes.

## Rollback Scenarios

### 1. Code Deployment Rollback

#### Scenario: New deployment causes critical bugs

**Detection**:
- Error rate spikes (>5%)
- Payment processing failures
- System instability
- User reports

**Rollback Procedure**:

1. **Immediate Actions** (0-5 minutes):
   ```bash
   # Identify current deployment
   git log --oneline -1
   
   # Tag current problematic version
   git tag -a rollback-$(date +%Y%m%d-%H%M%S) -m "Rollback tag"
   
   # Switch to previous stable version
   git checkout <previous-stable-commit>
   ```

2. **Redeploy Previous Version** (5-15 minutes):
   ```bash
   # Build previous version
   pnpm build
   
   # Run tests
   pnpm test
   
   # Deploy to staging first (if time permits)
   # Deploy to production
   ```

3. **Verification** (15-30 minutes):
   - Monitor error rates
   - Verify critical endpoints
   - Check payment processing
   - Confirm user access

4. **Post-Rollback**:
   - Document rollback reason
   - Create incident report
   - Schedule post-mortem
   - Plan fix for next deployment

**Rollback Time**: 15-30 minutes  
**Data Loss Risk**: None (code only)

---

### 2. Database Migration Rollback

#### Scenario: Migration causes data corruption or performance issues

**Detection**:
- Database errors
- Data inconsistencies
- Performance degradation
- Failed queries

**Rollback Procedure**:

1. **Stop Application** (0-2 minutes):
   ```bash
   # Stop API service
   pm2 stop api
   # Or: systemctl stop kealee-api
   ```

2. **Backup Current State** (2-5 minutes):
   ```bash
   # Create backup before rollback
   pg_dump -h localhost -U kealee -d kealee_prod > backup-$(date +%Y%m%d-%H%M%S).sql
   ```

3. **Rollback Migration** (5-10 minutes):
   ```bash
   cd packages/database
   
   # List migration history
   pnpm prisma migrate status
   
   # Rollback to previous migration
   pnpm prisma migrate resolve --rolled-back <migration-name>
   
   # Or manually revert migration
   # 1. Identify migration file
   # 2. Create reverse migration
   # 3. Apply reverse migration
   ```

4. **Verify Database** (10-15 minutes):
   ```bash
   # Check database integrity
   pnpm prisma validate
   
   # Verify critical tables
   psql -h localhost -U kealee -d kealee_prod -c "SELECT COUNT(*) FROM \"Project\""
   psql -h localhost -U kealee -d kealee_prod -c "SELECT COUNT(*) FROM \"ContractAgreement\""
   ```

5. **Restart Application** (15-20 minutes):
   ```bash
   pm2 start api
   # Verify health checks pass
   ```

**Rollback Time**: 20-30 minutes  
**Data Loss Risk**: Medium (if migration modified data)

**Prevention**:
- Always test migrations on staging
- Create backups before migrations
- Use transactions for data migrations
- Test rollback procedure

---

### 3. Configuration Change Rollback

#### Scenario: Configuration change causes issues

**Detection**:
- Service failures
- Integration errors
- Performance issues

**Rollback Procedure**:

1. **Identify Changed Configuration**:
   ```bash
   # Check environment variables
   env | grep KEALEE
   
   # Check config files
   git diff HEAD~1 config/
   ```

2. **Revert Configuration**:
   ```bash
   # Revert environment variables
   # Edit .env files or deployment config
   
   # Or revert config file
   git checkout HEAD~1 -- config/production.yaml
   ```

3. **Restart Services**:
   ```bash
   # Restart affected services
   pm2 restart api
   ```

4. **Verify**:
   - Check service health
   - Test integrations
   - Monitor for 15 minutes

**Rollback Time**: 5-15 minutes  
**Data Loss Risk**: Low

---

### 4. Third-Party Integration Rollback

#### Scenario: Stripe, DocuSign, or other integration breaks

**Detection**:
- Payment failures
- Document signing failures
- API errors from third party

**Rollback Procedure**:

1. **Disable Integration** (if possible):
   ```typescript
   // Feature flag or config
   STRIPE_ENABLED=false
   DOCUSIGN_ENABLED=false
   ```

2. **Revert Integration Code**:
   ```bash
   git checkout HEAD~1 -- services/api/src/modules/payments/
   git checkout HEAD~1 -- services/api/src/modules/docusign/
   ```

3. **Redeploy**:
   ```bash
   pnpm build
   pm2 restart api
   ```

4. **Manual Workaround**:
   - Process payments manually (if critical)
   - Use alternative document signing
   - Notify users of temporary limitations

**Rollback Time**: 10-20 minutes  
**Data Loss Risk**: Low (but service degradation)

---

## Rollback Decision Matrix

| Issue Severity | Impact | Rollback Time | Decision |
|---------------|--------|---------------|----------|
| Critical (System Down) | High | <30 min | **IMMEDIATE ROLLBACK** |
| Critical (Payment Failures) | High | <30 min | **IMMEDIATE ROLLBACK** |
| High (Error Rate >5%) | Medium | <30 min | **ROLLBACK** |
| Medium (Performance Degradation) | Medium | <30 min | **CONSIDER ROLLBACK** |
| Low (Minor Bugs) | Low | <30 min | **HOTFIX PREFERRED** |

## Rollback Checklist

### Pre-Rollback

- [ ] Identify root cause
- [ ] Confirm rollback is necessary
- [ ] Notify team (Slack, email)
- [ ] Create backup (if applicable)
- [ ] Document current state
- [ ] Identify rollback target version

### During Rollback

- [ ] Stop affected services
- [ ] Create backup (if data involved)
- [ ] Execute rollback procedure
- [ ] Verify rollback success
- [ ] Restart services
- [ ] Monitor health checks

### Post-Rollback

- [ ] Verify system stability
- [ ] Monitor for 30 minutes
- [ ] Notify team of completion
- [ ] Document rollback
- [ ] Create incident report
- [ ] Schedule post-mortem
- [ ] Plan fix for next deployment

## Automated Rollback

### Health Check Based Rollback

**Configuration**:
```yaml
auto_rollback:
  enabled: true
  triggers:
    - error_rate > 0.05
    - response_time_p95 > 5000
    - payment_failure_rate > 0.1
  check_interval: 60s
  check_duration: 5m
  rollback_action: revert_to_previous_tag
```

### Deployment Pipeline Integration

**GitHub Actions / CI/CD**:
```yaml
- name: Health Check After Deploy
  run: |
    sleep 60
    health_status=$(curl -s /health/detailed | jq .status)
    if [ "$health_status" != "ok" ]; then
      echo "Health check failed, rolling back..."
      ./scripts/rollback.sh
    fi
```

## Communication Plan

### During Rollback

1. **Immediate** (0-5 min):
   - Slack: #incidents channel
   - Email: engineering team

2. **Ongoing** (5-30 min):
   - Status updates every 5 minutes
   - User-facing status page (if applicable)

3. **Completion**:
   - Rollback complete notification
   - Incident summary
   - Next steps

### User Communication

**Template**:
```
Subject: Service Update - [Brief Description]

We experienced [issue] and have rolled back to a previous stable version.
Service is now restored. We apologize for any inconvenience.

Status: https://status.kealee.com
```

## Recovery Procedures

### After Successful Rollback

1. **Stabilize System** (0-30 min):
   - Monitor metrics
   - Verify all services
   - Check integrations

2. **Investigate Root Cause** (30 min - 2 hours):
   - Review logs
   - Analyze error patterns
   - Identify fix

3. **Plan Fix** (2-4 hours):
   - Develop solution
   - Test on staging
   - Prepare new deployment

4. **Redeploy** (Next deployment window):
   - Deploy fix
   - Monitor closely
   - Have rollback ready

## Testing Rollback Procedures

### Quarterly Rollback Drills

1. **Schedule**: Every 3 months
2. **Scenario**: Simulate deployment failure
3. **Execute**: Full rollback procedure
4. **Document**: Time to rollback, issues found
5. **Improve**: Update procedures based on findings

### Rollback Test Checklist

- [ ] Code rollback tested
- [ ] Database rollback tested
- [ ] Configuration rollback tested
- [ ] Integration rollback tested
- [ ] Communication plan tested
- [ ] Documentation updated

## Backup Strategy

### Database Backups

- **Frequency**: Daily full backup, hourly incremental
- **Retention**: 30 days
- **Location**: Off-site backup storage
- **Verification**: Weekly restore test

### Code Backups

- **Version Control**: Git (all versions preserved)
- **Tags**: Stable versions tagged
- **Releases**: GitHub releases for major versions

### Configuration Backups

- **Version Control**: Git (config files)
- **Secrets**: Encrypted secret management
- **Documentation**: All configs documented

## Emergency Contacts

### On-Call Rotation

- **Primary**: [On-call engineer]
- **Secondary**: [Backup engineer]
- **Escalation**: [CTO/Founder]

### Contact Methods

- **Slack**: #on-call channel
- **Phone**: [On-call number]
- **PagerDuty**: [If configured]

---

## Appendix

### Rollback Scripts

**Quick Rollback Script** (`scripts/rollback.sh`):
```bash
#!/bin/bash
set -e

echo "Starting rollback procedure..."

# Get previous stable tag
PREVIOUS_TAG=$(git tag -l "v*" | sort -V | tail -2 | head -1)
CURRENT_TAG=$(git describe --tags)

echo "Rolling back from $CURRENT_TAG to $PREVIOUS_TAG"

# Checkout previous version
git checkout $PREVIOUS_TAG

# Build and deploy
pnpm build
pm2 restart api

echo "Rollback complete. Monitoring health checks..."
sleep 60

# Verify
HEALTH=$(curl -s http://localhost:3001/health | jq -r .status)
if [ "$HEALTH" = "ok" ]; then
  echo "✅ Rollback successful"
else
  echo "❌ Rollback failed - manual intervention required"
  exit 1
fi
```

---

**Last Updated**: January 2026  
**Version**: 1.0.0  
**Review Frequency**: Quarterly  
**Owner**: DevOps Team
