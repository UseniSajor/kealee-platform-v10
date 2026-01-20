# Staging Testing Guide

This guide explains how to test staging deployments for all Kealee Platform apps.

## Quick Start

### Test os-admin Staging

```bash
# Unix/Linux/macOS
./scripts/test-os-admin-staging.sh

# Windows PowerShell
.\scripts\test-staging.ps1 -StagingUrl "https://admin.kealee.com" -AppName "os-admin"
```

### Test Any App

```bash
# Unix/Linux/macOS
./scripts/test-staging.sh https://your-app.kealee.com app-name

# Windows PowerShell
.\scripts\test-staging.ps1 -StagingUrl "https://your-app.kealee.com" -AppName "app-name"
```

## Test Coverage

### Automated Tests

The test scripts perform the following checks:

1. **Basic Connectivity**
   - Verifies the site is reachable
   - Checks HTTP status codes

2. **Page Load**
   - Verifies pages load without errors
   - Checks for proper HTTP responses

3. **Performance**
   - Measures response time
   - Flags slow responses (>3s)

4. **SSL/TLS**
   - Validates SSL certificates
   - Checks certificate expiration

5. **Security Headers**
   - Verifies security headers are present
   - Checks for X-Frame-Options, CSP, etc.

6. **API Endpoints**
   - Tests health check endpoints
   - Verifies API connectivity

7. **Environment Configuration**
   - Checks environment variables
   - Verifies database connections

8. **Error Detection**
   - Scans for error messages in HTML
   - Checks for server errors (500, 502, etc.)

9. **Build Artifacts**
   - Verifies Next.js static assets
   - Checks for proper build output

10. **Authentication Flow**
    - Tests login page accessibility
    - Verifies authentication endpoints

## Manual Testing Checklist

After automated tests pass, perform manual testing:

### Authentication
- [ ] Can access login page
- [ ] Can login with valid credentials
- [ ] Session persists after page refresh
- [ ] Can logout successfully
- [ ] Invalid credentials show error message
- [ ] Password reset flow works (if implemented)

### User Management (os-admin)
- [ ] Users page loads
- [ ] Can view list of users
- [ ] Search functionality works
- [ ] Pagination works correctly
- [ ] Can view user details
- [ ] Can update user status
- [ ] Can delete users (with confirmation)
- [ ] Role badges display correctly
- [ ] Status badges display correctly

### Organizations
- [ ] Organizations page loads
- [ ] Can view organization list
- [ ] Can view organization details
- [ ] Can edit organization
- [ ] Module enablement works

### RBAC
- [ ] Roles page loads
- [ ] Can view roles and permissions
- [ ] Can assign permissions
- [ ] Permission checks work correctly

### Audit Logs
- [ ] Audit logs page loads
- [ ] Can filter audit logs
- [ ] Can view audit log details
- [ ] Timestamps are correct

### Dashboard
- [ ] Dashboard loads
- [ ] Statistics display correctly
- [ ] Charts/graphs render (if any)
- [ ] Recent activity shows

## Performance Testing

### Response Time Targets

- **Page Load:** < 1s (excellent), < 2s (good), < 3s (acceptable)
- **API Calls:** < 500ms (excellent), < 1s (good), < 2s (acceptable)

### Load Testing

For production readiness, perform load testing:

```bash
# Using Apache Bench
ab -n 1000 -c 10 https://admin.kealee.com/

# Using k6 (if installed)
k6 run load-test.js
```

## Security Testing

### Checklist

- [ ] HTTPS is enforced
- [ ] SSL certificate is valid
- [ ] Security headers are present
- [ ] No sensitive data in client-side code
- [ ] Authentication tokens are secure
- [ ] CORS is configured correctly
- [ ] Rate limiting is active
- [ ] Input validation works
- [ ] XSS protection is enabled
- [ ] CSRF protection is enabled

## Error Monitoring

### Setup

1. **Sentry Integration**
   - Verify Sentry DSN is configured
   - Test error reporting
   - Check error dashboard

2. **Vercel Logs**
   - Monitor deployment logs
   - Check function logs
   - Review edge function logs

3. **Application Logs**
   - Check console for errors
   - Review API logs
   - Monitor database queries

## Troubleshooting

### Common Issues

#### Site Not Reachable
- Check DNS configuration
- Verify Vercel deployment status
- Check firewall rules
- Verify domain is pointing to Vercel

#### Slow Response Times
- Check Vercel function logs
- Review database query performance
- Check API response times
- Verify CDN caching

#### Authentication Failures
- Verify Supabase credentials
- Check CORS settings
- Verify session storage
- Check cookie settings

#### Build Errors
- Check Vercel build logs
- Verify environment variables
- Check dependency versions
- Review TypeScript errors

## Test Scripts

### Available Scripts

1. **test-staging.sh** - Generic staging test script
2. **test-staging.ps1** - PowerShell version
3. **test-os-admin-staging.sh** - os-admin specific tests

### Usage Examples

```bash
# Test os-admin
./scripts/test-os-admin-staging.sh

# Test with custom URL
./scripts/test-staging.sh https://staging-admin.kealee.com os-admin

# Test with environment variables
STAGING_URL=https://admin.kealee.com API_URL=https://api.kealee.com ./scripts/test-os-admin-staging.sh
```

## Continuous Testing

### CI/CD Integration

Add to your CI/CD pipeline:

```yaml
# GitHub Actions example
- name: Test Staging
  run: |
    chmod +x scripts/test-staging.sh
    ./scripts/test-staging.sh ${{ env.STAGING_URL }} os-admin
```

### Scheduled Testing

Set up cron job for regular testing:

```bash
# Run daily at 9 AM
0 9 * * * /path/to/scripts/test-staging.sh https://admin.kealee.com os-admin
```

## Reporting

### Test Results

The scripts output:
- ✅ Passed tests
- ⚠️  Warnings
- ❌ Failed tests
- Summary statistics

### Logging

Test results can be logged to a file:

```bash
./scripts/test-staging.sh https://admin.kealee.com os-admin 2>&1 | tee test-results.log
```

## Best Practices

1. **Run tests after every deployment**
2. **Test in staging before production**
3. **Monitor test results over time**
4. **Fix failing tests immediately**
5. **Document any known issues**
6. **Keep test scripts updated**

## Support

For testing issues:
1. Check script output for errors
2. Verify URLs are correct
3. Check network connectivity
4. Review deployment logs
5. Contact DevOps team if needed
