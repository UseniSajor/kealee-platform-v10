# Production Deployment Guide

Complete guide for deploying applications to Vercel production environment.

## Quick Start

### Deploy All Apps to Production

```bash
# Deploy all applications to production (requires approval)
./scripts/deploy-production.sh
```

### Emergency Hotfix

```bash
# Deploy hotfix to specific app
./scripts/deploy-hotfix.sh --app=m-marketplace --message="Emergency fix"

# Or interactive mode
./scripts/deploy-hotfix.sh
```

## Prerequisites

### 1. Pre-Deployment Checklist

**Always run before production deployment:**

```bash
./scripts/pre-deployment-checklist.sh
```

This validates:
- ✅ All tests passing
- ✅ Code quality checks
- ✅ Environment variables
- ✅ Database migrations
- ✅ Dependencies
- ✅ Git status

### 2. Required Approvals

Production deployments require:
- ✅ Code review completed
- ✅ All tests passing
- ✅ Pre-deployment checklist passed
- ✅ Manual confirmation

## Production Deployment Process

### Standard Deployment

1. **Run pre-deployment checklist:**
   ```bash
   ./scripts/pre-deployment-checklist.sh
   ```

2. **Deploy to production:**
   ```bash
   ./scripts/deploy-production.sh
   ```

3. **Monitor deployment:**
   - Check Vercel dashboard
   - Monitor error tracking (Sentry)
   - Verify critical user flows

### Safety Features

The production deployment script includes:

- **Confirmation prompts** - Requires explicit "yes" confirmation
- **Pre-deployment checks** - Runs checklist before deployment
- **Branch validation** - Warns if not on main/master
- **Build verification** - Builds each app before deploying
- **Error handling** - Stops on failures

## Emergency Hotfix Deployment

### When to Use

Use hotfix deployment for:
- Critical production bugs
- Security vulnerabilities
- Data loss prevention
- Service outages

### Hotfix Process

1. **Identify the issue:**
   - Check error tracking (Sentry)
   - Review logs
   - Verify user reports

2. **Create hotfix:**
   ```bash
   # Create hotfix branch
   git checkout -b hotfix/fix-description
   
   # Make fix
   # ... code changes ...
   
   # Commit
   git commit -m "Hotfix: Fix description"
   ```

3. **Deploy hotfix:**
   ```bash
   # Deploy specific app
   ./scripts/deploy-hotfix.sh --app=m-marketplace --message="Fix critical bug"
   
   # Or use force if build has warnings
   ./scripts/deploy-hotfix.sh --app=m-marketplace --force
   ```

4. **Post-deployment:**
   - Verify fix works
   - Monitor error tracking
   - Document the hotfix
   - Create proper fix in main branch

### Hotfix Features

- **Bypasses tests** - For emergency situations
- **Quick deployment** - Minimal checks
- **Single app** - Deploy only affected app
- **Force option** - Deploy even with build warnings

## Deployment Scripts

### Production Deployment

```bash
# Full production deployment
./scripts/deploy-production.sh

# PowerShell version
.\scripts\deploy-production.ps1

# Force deployment (skip checks)
.\scripts\deploy-production.ps1 -Force
```

### Hotfix Deployment

```bash
# Deploy specific app
./scripts/deploy-hotfix.sh --app=m-marketplace --message="Emergency fix"

# Interactive mode
./scripts/deploy-hotfix.sh

# Force deployment
./scripts/deploy-hotfix.sh --app=m-marketplace --force

# PowerShell version
.\scripts\deploy-hotfix.ps1 -App "m-marketplace" -Message "Emergency fix" -Force
```

## Post-Deployment Verification

### 1. Health Checks

```bash
# Check application health
curl https://marketplace.kealee.com/api/health
curl https://ops.kealee.com/api/health
```

### 2. Smoke Tests

```bash
# Run smoke tests
./scripts/test-staging.sh https://marketplace.kealee.com
```

### 3. Monitoring

- **Sentry** - Check for new errors
- **Datadog** - Monitor performance metrics
- **Vercel Analytics** - Review traffic patterns

### 4. User Verification

- Test critical user flows
- Verify payment processing
- Check file uploads
- Test authentication

## Rollback Procedures

### Quick Rollback

```bash
# List deployments
vercel ls

# Rollback to previous deployment
vercel rollback [deployment-url]
```

### Via Vercel Dashboard

1. Go to Vercel dashboard
2. Select project
3. Go to Deployments
4. Find previous working deployment
5. Click "Promote to Production"

## Best Practices

### Before Deployment

1. **Run pre-deployment checklist**
2. **Review all changes**
3. **Test in staging first**
4. **Create database backup**
5. **Notify team**

### During Deployment

1. **Monitor deployment logs**
2. **Watch for errors**
3. **Verify each app deploys**
4. **Check deployment URLs**

### After Deployment

1. **Run health checks**
2. **Monitor error tracking**
3. **Test critical flows**
4. **Verify integrations**
5. **Document deployment**

## Troubleshooting

### Deployment Failures

1. **Check build logs:**
   ```bash
   vercel logs [deployment-url]
   ```

2. **Verify environment variables:**
   ```bash
   vercel env ls
   ```

3. **Test build locally:**
   ```bash
   cd apps/m-marketplace
   pnpm build
   ```

### Build Errors

1. **Check dependencies:**
   ```bash
   pnpm install
   ```

2. **Clear cache:**
   ```bash
   rm -rf .next node_modules
   pnpm install
   ```

3. **Check TypeScript errors:**
   ```bash
   pnpm exec tsc --noEmit
   ```

### Environment Variable Issues

1. **List variables:**
   ```bash
   vercel env ls
   ```

2. **Add missing variables:**
   ```bash
   vercel env add VARIABLE_NAME production
   ```

3. **Verify values:**
   ```bash
   vercel env pull .env.production
   ```

## Security Considerations

### Production Deployments

- ✅ Always require approval
- ✅ Run security audits
- ✅ Verify API keys
- ✅ Check environment variables
- ✅ Review access logs

### Hotfix Deployments

- ⚠️ Use only for emergencies
- ⚠️ Document all hotfixes
- ⚠️ Create proper fix afterward
- ⚠️ Review with team

## Support

For deployment issues:
1. Check Vercel dashboard
2. Review deployment logs
3. Verify configuration
4. Test locally first
5. Contact DevOps team
