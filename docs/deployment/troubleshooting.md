# Deployment Troubleshooting Guide

Complete troubleshooting guide for deployment issues in the Kealee Platform.

## Quick Reference

### Emergency Contacts

- **Platform Team:** platform@kealee.com
- **Infrastructure:** infra@kealee.com
- **Database Admin:** dba@kealee.com
- **Security:** security@kealee.com

### Critical URLs

- **Status Page:** https://status.kealee.com
- **Monitoring:** https://monitoring.kealee.com
- **Logs:** https://logs.kealee.com
- **Metrics:** https://metrics.kealee.com

## Pre-Deployment Issues

### Build Failures

**Symptoms:**
- Build fails during `npm run build`
- TypeScript errors
- Dependency conflicts
- Vercel build failures

**Diagnosis:**
```bash
# Check build logs for specific errors
vercel logs m-marketplace --token=$VERCEL_TOKEN | grep -A 10 -B 10 "Build failed"

# Check for TypeScript errors in logs
vercel logs m-marketplace --token=$VERCEL_TOKEN | grep -i "typescript\|error\|failed"

# View full build logs
vercel logs m-marketplace --token=$VERCEL_TOKEN --limit=200
```

**Common Causes:**
- Missing environment variables
- TypeScript errors
- Missing dependencies
- Build timeout
- Memory issues
- Incorrect Node.js version

**Step-by-Step Fix:**

1. **Fix TypeScript errors locally:**
   ```bash
   # Navigate to app directory
   cd apps/m-marketplace
   
   # Run type checking
   npm run type-check
   
   # Fix any TypeScript errors shown
   # Common fixes:
   # - Add missing type definitions
   # - Fix type mismatches
   # - Update import paths
   ```

2. **Test build locally:**
   ```bash
   # Test build in app directory
   npm run build
   
   # If build succeeds locally but fails on Vercel:
   # - Check Node.js version compatibility
   # - Verify all dependencies are in package.json
   # - Check for platform-specific code
   ```

3. **Check environment variables:**
   ```bash
   # List all environment variables
   vercel env ls m-marketplace --token=$VERCEL_TOKEN
   
   # Verify required variables are set
   # Common required variables:
   # - DATABASE_URL
   # - NEXTAUTH_SECRET
   # - NEXTAUTH_URL
   # - STRIPE_SECRET_KEY
   # - NEXT_PUBLIC_* variables
   
   # Add missing variables
   vercel env add VARIABLE_NAME production "value" --token=$VERCEL_TOKEN
   ```

4. **Clear Vercel build cache:**
   ```bash
   # Remove build cache (safe operation)
   vercel rm m-marketplace --safe --token=$VERCEL_TOKEN
   
   # Or clear cache for specific deployment
   vercel rm <deployment-url> --token=$VERCEL_TOKEN
   
   # Redeploy after clearing cache
   vercel deploy --prod --token=$VERCEL_TOKEN
   ```

**Additional Solutions:**
```bash
# Clear local cache and reinstall
cd apps/m-marketplace
rm -rf node_modules package-lock.json .next
npm install

# Check for dependency conflicts
npm ls

# Run linting
npm run lint

# Check for missing dependencies
npm audit

# Verify Node.js version matches Vercel
node --version
# Vercel uses Node.js 18.x or 20.x by default
```

### Environment Variable Issues

**Symptoms:**
- Build succeeds but app fails at runtime
- Missing environment variables
- Incorrect environment variable values

**Solutions:**
```bash
# Check environment variables
./scripts/manage-vercel-env.sh
# Select: 1) List environment variables

# Verify required variables
vercel env ls m-marketplace --token=$VERCEL_TOKEN

# Add missing variables
vercel env add VARIABLE_NAME production "value" --token=$VERCEL_TOKEN
```

### Database Migration Issues

**Symptoms:**
- Migration fails
- Database schema out of sync
- Migration conflicts

**Solutions:**
```bash
# Check migration status
cd packages/database
npx prisma migrate status

# View migration history
npx prisma migrate history

# Create new migration
npm run db:create:migration -- --name=fix_issue

# Run migrations
npm run db:migrate:prod
```

## Deployment Issues

### Vercel Deployment Failures

**Symptoms:**
- Deployment fails in Vercel
- Build timeout
- Function errors
- Build cache issues

**Diagnosis:**
```bash
# Check build logs for errors
vercel logs m-marketplace --token=$VERCEL_TOKEN | grep -A 10 -B 10 "Build failed"

# Check deployment status
vercel list m-marketplace --token=$VERCEL_TOKEN

# View detailed deployment info
vercel inspect <deployment-url> --token=$VERCEL_TOKEN

# Check for specific error types
vercel logs m-marketplace --token=$VERCEL_TOKEN | grep -i "error\|timeout\|memory\|failed"
```

**Solutions:**

1. **Clear Build Cache:**
   ```bash
   # Remove build cache (safe operation)
   vercel rm m-marketplace --safe --token=$VERCEL_TOKEN
   
   # Redeploy
   vercel deploy --prod --token=$VERCEL_TOKEN
   ```

2. **Fix Build Issues:**
   ```bash
   # Test build locally first
   cd apps/m-marketplace
   npm run build
   
   # Fix any local build errors before deploying
   ```

3. **Check Environment Variables:**
   ```bash
   # Verify all required variables are set
   vercel env ls m-marketplace --token=$VERCEL_TOKEN
   
   # Add missing variables
   vercel env add VARIABLE_NAME production "value" --token=$VERCEL_TOKEN
   ```

4. **Force New Deployment:**
   ```bash
   # Force new deployment (bypasses cache)
   vercel deploy --prod --force --token=$VERCEL_TOKEN
   ```

5. **Increase Build Timeout (if needed):**
   ```json
   // vercel.json
   {
     "buildCommand": "npm run build",
     "framework": "nextjs",
     "functions": {
       "app/api/**/*.ts": {
         "maxDuration": 30
       }
     }
   }
   ```

### Railway Deployment Failures

**Symptoms:**
- API service not starting
- Connection errors
- Timeout issues

**Solutions:**
```bash
# Check Railway logs
railway logs

# Check service status
railway status

# Restart service
railway restart

# Check environment variables
railway variables
```

### DNS Issues

**Symptoms:**
- Domain not resolving
- SSL certificate errors
- CNAME conflicts

**Solutions:**
```bash
# Check DNS records
nslookup api.kealee.com
dig api.kealee.com

# Verify DNS configuration
./scripts/setup-dns.sh

# Check SSL certificate
./scripts/setup-ssl.sh
```

## Post-Deployment Issues

### Application Not Loading

**Symptoms:**
- 404 errors
- Blank page
- JavaScript errors

**Solutions:**
```bash
# Check deployment URL
vercel ls m-marketplace --token=$VERCEL_TOKEN

# Verify environment variables
vercel env ls m-marketplace --token=$VERCEL_TOKEN

# Check browser console for errors
# Check network tab for failed requests

# Verify build output
vercel inspect <deployment-url> --token=$VERCEL_TOKEN
```

### Database Connection Issues

**Symptoms:**
- Database connection errors
- Error: `connect ECONNREFUSED 127.0.0.1:5432`
- Timeout errors
- Authentication failures

**Diagnosis:**
```bash
# Check if database is running
pg_isready -h localhost -p 5432

# Check PostgreSQL service status
sudo systemctl status postgresql

# Check connection string
echo $DATABASE_URL | sed 's/:[^:@]*@/:***@/'

# Test connection
psql $DATABASE_URL -c "SELECT 1;"
```

**Step-by-Step Fix:**

1. **Check if database is running:**
   ```bash
   # Check PostgreSQL readiness
   pg_isready -h localhost -p 5432
   
   # If not ready, check service status
   sudo systemctl status postgresql
   
   # Start PostgreSQL if not running
   sudo systemctl start postgresql
   sudo systemctl enable postgresql
   ```

2. **Check PostgreSQL status:**
   ```bash
   # Check service status
   sudo systemctl status postgresql
   
   # Check if port is listening
   sudo netstat -tlnp | grep 5432
   # Or
   sudo ss -tlnp | grep 5432
   ```

3. **Check connection string:**
   ```bash
   # Display connection string (masked)
   echo $DATABASE_URL | sed 's/:[^:@]*@/:***@/'
   
   # Verify format: postgresql://user:password@host:port/database
   # Check each component:
   # - User: correct username
   # - Password: correct password
   # - Host: correct hostname/IP
   # - Port: correct port (default 5432)
   # - Database: database exists
   ```

4. **Check max connections:**
   ```bash
   # Check current connections
   psql $DATABASE_URL -c "SELECT count(*) FROM pg_stat_activity;"
   
   # Check max connections setting
   psql $DATABASE_URL -c "SHOW max_connections;"
   
   # Check connection limit per database
   psql $DATABASE_URL -c "SELECT datname, datconnlimit FROM pg_database WHERE datname = current_database();"
   ```

**Additional Solutions:**
```bash
# Check firewall rules
sudo ufw status
sudo ufw allow 5432/tcp

# Check PostgreSQL configuration
sudo nano /etc/postgresql/*/main/postgresql.conf
# Verify: listen_addresses = 'localhost' or '*'

# Check pg_hba.conf for authentication
sudo nano /etc/postgresql/*/main/pg_hba.conf

# Restart PostgreSQL
sudo systemctl restart postgresql

# Check PostgreSQL logs
sudo tail -f /var/log/postgresql/postgresql-*.log
```

### API Service Issues

**Symptoms:**
- API endpoints not responding
- 500 errors
- Timeout errors

**Solutions:**
```bash
# Check API health
curl http://localhost:3000/health

# Check API logs
cd services/api
npm run dev
# Check console output

# Verify API is running
lsof -i :3000

# Check Railway logs
railway logs
```

### File Upload Failures

**Symptoms:**
- File uploads failing
- S3 upload errors
- Permission denied errors
- Timeout during upload

**Diagnosis:**
```bash
# Check S3 credentials
aws s3 ls s3://$S3_BUCKET_NAME --recursive --human-readable

# Check bucket policy
aws s3api get-bucket-policy --bucket $S3_BUCKET_NAME

# Check bucket ACL
aws s3api get-bucket-acl --bucket $S3_BUCKET_NAME

# Test upload permissions
./scripts/test-s3-upload.sh
```

**Step-by-Step Fix:**

1. **Check S3 credentials:**
   ```bash
   # Verify environment variables
   echo $AWS_ACCESS_KEY_ID
   echo $AWS_SECRET_ACCESS_KEY
   echo $S3_BUCKET_NAME
   echo $S3_REGION
   
   # Test AWS CLI access
   aws s3 ls s3://$S3_BUCKET_NAME --recursive --human-readable
   
   # If command fails, check:
   # - AWS credentials are set correctly
   # - IAM user has S3 permissions
   # - Bucket name is correct
   # - Region is correct
   ```

2. **Check bucket policy:**
   ```bash
   # Get bucket policy
   aws s3api get-bucket-policy --bucket $S3_BUCKET_NAME
   
   # Check bucket CORS configuration
   aws s3api get-bucket-cors --bucket $S3_BUCKET_NAME
   
   # Verify bucket exists
   aws s3 ls | grep $S3_BUCKET_NAME
   ```

3. **Test upload permissions:**
   ```bash
   # Run upload test script
   ./scripts/test-s3-upload.sh
   
   # Or manually test
   echo "test content" | aws s3 cp - s3://$S3_BUCKET_NAME/test-upload.txt
   
   # Check if file was uploaded
   aws s3 ls s3://$S3_BUCKET_NAME/test-upload.txt
   
   # Clean up test file
   aws s3 rm s3://$S3_BUCKET_NAME/test-upload.txt
   ```

**Additional Solutions:**
```bash
# Check IAM permissions
aws iam get-user
aws iam list-attached-user-policies --user-name <username>

# Check S3 bucket configuration
aws s3api get-bucket-location --bucket $S3_BUCKET_NAME
aws s3api get-bucket-versioning --bucket $S3_BUCKET_NAME

# Check for CORS issues (if uploading from browser)
aws s3api get-bucket-cors --bucket $S3_BUCKET_NAME

# Verify file size limits
# Check application code for file size restrictions
# Check S3 bucket policies for size limits

# Check network connectivity
curl -I https://$S3_BUCKET_NAME.s3.$S3_REGION.amazonaws.com

# Review application logs for upload errors
# Check Vercel/Railway logs for S3-related errors
```

## Performance Issues

### Slow Response Times

**Symptoms:**
- High latency
- Response time > 2000ms
- Slow page loads
- Timeout errors

**Diagnosis:**
```bash
# Check response times
curl -w "@-" -o /dev/null -s https://api.kealee.com/health <<'EOF'
     time_namelookup:  %{time_namelookup}\n
        time_connect:  %{time_connect}\n
     time_appconnect:  %{time_appconnect}\n
    time_pretransfer:  %{time_pretransfer}\n
       time_redirect:  %{time_redirect}\n
  time_starttransfer:  %{time_starttransfer}\n
                     ----------\n
          time_total:  %{time_total}\n
EOF

# Monitor server resources
htop
# Or
top
```

**Step-by-Step Fix:**

1. **Check database queries:**
   ```bash
   # Run slow queries analysis
   ./scripts/slow-queries.sh
   
   # Or manually check
   psql $DATABASE_URL -c "SELECT * FROM pg_stat_statements ORDER BY total_time DESC LIMIT 10;"
   
   # Check for long-running queries
   psql $DATABASE_URL -c "SELECT pid, now() - pg_stat_activity.query_start AS duration, query FROM pg_stat_activity WHERE state = 'active' AND now() - pg_stat_activity.query_start > interval '5 seconds';"
   
   # Check index usage
   psql $DATABASE_URL -c "SELECT schemaname, tablename, indexname, idx_scan, idx_tup_read, idx_tup_fetch FROM pg_stat_user_indexes ORDER BY idx_scan;"
   ```

2. **Check Redis cache hit rate:**
   ```bash
   # Check cache statistics
   redis-cli INFO stats | grep keyspace_hits
   redis-cli INFO stats | grep keyspace_misses
   
   # Calculate hit rate
   HITS=$(redis-cli INFO stats | grep keyspace_hits | cut -d: -f2 | tr -d '\r')
   MISSES=$(redis-cli INFO stats | grep keyspace_misses | cut -d: -f2 | tr -d '\r')
   TOTAL=$((HITS + MISSES))
   if [ $TOTAL -gt 0 ]; then
     HIT_RATE=$(echo "scale=2; $HITS * 100 / $TOTAL" | bc)
     echo "Cache hit rate: ${HIT_RATE}%"
   fi
   
   # Check Redis memory
   redis-cli INFO memory
   
   # Check for evictions
   redis-cli INFO stats | grep evicted_keys
   ```

3. **Monitor server resources:**
   ```bash
   # CPU and memory usage
   htop
   # Or
   top
   
   # Check disk I/O
   iostat -x 1
   
   # Check network
   iftop
   # Or
   netstat -i
   
   # Check system load
   uptime
   ```

**Additional Solutions:**
```bash
# Check application metrics
# - Datadog dashboard: https://app.datadoghq.com
# - Vercel analytics: Vercel dashboard
# - Sentry performance: Sentry dashboard

# Check database performance
psql $DATABASE_URL -c "SELECT * FROM pg_stat_statements ORDER BY total_time DESC LIMIT 10;"

# Check for connection pool issues
psql $DATABASE_URL -c "SELECT count(*) FROM pg_stat_activity;"

# Optimize database
psql $DATABASE_URL -c "VACUUM ANALYZE;"

# Check for missing indexes
psql $DATABASE_URL -c "SELECT schemaname, tablename, attname, n_distinct, correlation FROM pg_stats WHERE schemaname = 'public' ORDER BY abs(correlation) DESC LIMIT 20;"
```

### High Memory Usage

**Symptoms:**
- Out of memory errors
- Slow performance
- Service crashes

**Solutions:**
```bash
# Check memory usage
ps aux | grep node

# Check database memory
psql $DATABASE_URL -c "SELECT * FROM pg_stat_activity;"

# Check Redis memory
redis-cli INFO memory

# Review application code for memory leaks
```

## Security Issues

### Authentication Failures

**Symptoms:**
- Users cannot log in
- Session errors
- Token validation failures

**Solutions:**
```bash
# Check NEXTAUTH_SECRET
vercel env ls m-marketplace --token=$VERCEL_TOKEN | grep NEXTAUTH

# Verify authentication configuration
# Check NextAuth configuration files

# Review authentication logs
vercel logs m-marketplace --token=$VERCEL_TOKEN | grep auth
```

### SSL Certificate Issues

**Symptoms:**
- SSL errors
- Certificate expired
- Mixed content warnings

**Solutions:**
```bash
# Check SSL certificate
openssl s_client -connect api.kealee.com:443

# Verify certificate in Vercel
# Go to Vercel dashboard > Project > Settings > Domains

# Renew certificate if needed
# Vercel automatically renews Let's Encrypt certificates
```

## Monitoring and Logging

### Check Application Logs

```bash
# Vercel logs
vercel logs m-marketplace --token=$VERCEL_TOKEN

# Railway logs
railway logs

# Local development logs
cd apps/m-marketplace
npm run dev
# Check console output
```

### Check System Logs

```bash
# PostgreSQL logs
sudo tail -f /var/log/postgresql/postgresql-*.log

# Redis logs
sudo tail -f /var/log/redis/redis-server.log

# Nginx logs
sudo tail -f /var/log/nginx/error.log
sudo tail -f /var/log/nginx/access.log
```

### Check Monitoring Dashboards

- **Sentry:** https://sentry.io - Error tracking
- **Datadog:** https://app.datadoghq.com - APM and RUM
- **Vercel Analytics:** Vercel dashboard - Performance metrics
- **Uptime Monitoring:** Status page - Availability

## Emergency Procedures

### Service Down

1. **Check Status Page:**
   - Visit https://status.kealee.com
   - Check for known issues

2. **Verify Service Status:**
   ```bash
   # Check all services
   ./scripts/check-services.sh
   
   # Check specific service
   curl https://api.kealee.com/health
   ```

3. **Check Logs:**
   ```bash
   # Vercel logs
   vercel logs m-marketplace --token=$VERCEL_TOKEN --limit=100
   
   # Railway logs
   railway logs --tail
   ```

4. **Rollback if Needed:**
   ```bash
   # Rollback Vercel deployment
   vercel rollback <deployment-url> --token=$VERCEL_TOKEN
   
   # Or redeploy previous version
   vercel deploy --prod --token=$VERCEL_TOKEN
   ```

### Database Issues

1. **Check Database Status:**
   ```bash
   pg_isready
   psql $DATABASE_URL -c "SELECT 1;"
   ```

2. **Check Database Logs:**
   ```bash
   sudo tail -f /var/log/postgresql/postgresql-*.log
   ```

3. **Restore from Backup:**
   ```bash
   ./scripts/restore-database.sh backup_file.sql
   ```

4. **Contact Database Admin:**
   - Email: dba@kealee.com
   - Include error logs and database status

### Security Incident

1. **Immediate Actions:**
   - Change compromised credentials
   - Revoke affected API keys
   - Check access logs

2. **Contact Security Team:**
   - Email: security@kealee.com
   - Include incident details and logs

3. **Document Incident:**
   - Record timeline
   - Document actions taken
   - Update security procedures

## Diagnostic Commands

### System Health Check

```bash
# Run comprehensive check
./scripts/troubleshoot.sh
# Select: 6) All Services

# Quick status check
./scripts/check-services.sh
```

### Database Diagnostics

```bash
# Connection test
psql $DATABASE_URL -c "SELECT version(), current_database(), current_user;"

# Check active connections
psql $DATABASE_URL -c "SELECT count(*) FROM pg_stat_activity;"

# Check database size
psql $DATABASE_URL -c "SELECT pg_size_pretty(pg_database_size(current_database()));"

# Check slow queries
psql $DATABASE_URL -c "SELECT * FROM pg_stat_statements ORDER BY total_time DESC LIMIT 10;"
```

### Redis Diagnostics

```bash
# Connection test
redis-cli ping

# Memory usage
redis-cli INFO memory

# Statistics
redis-cli INFO stats

# Check for errors
redis-cli INFO stats | grep error
```

### Network Diagnostics

```bash
# Test DNS resolution
nslookup api.kealee.com
dig api.kealee.com

# Test connectivity
curl -I https://api.kealee.com/health

# Check SSL certificate
openssl s_client -connect api.kealee.com:443 -showcerts
```

## Common Error Messages

### "Build Failed"

**Causes:**
- TypeScript errors
- Missing dependencies
- Environment variable issues
- Build cache corruption
- Memory/timeout issues

**Diagnosis:**
```bash
# Check build logs with context
vercel logs m-marketplace --token=$VERCEL_TOKEN | grep -A 10 -B 10 "Build failed"

# Check for specific error types
vercel logs m-marketplace --token=$VERCEL_TOKEN | grep -i "typescript\|error\|timeout\|memory"
```

**Step-by-Step Fix:**

1. **Fix TypeScript errors locally:**
   ```bash
   cd apps/m-marketplace
   npm run type-check
   # Fix all TypeScript errors
   ```

2. **Test build locally:**
   ```bash
   npm run build
   # Ensure local build succeeds
   ```

3. **Check environment variables:**
   ```bash
   vercel env ls m-marketplace --token=$VERCEL_TOKEN
   # Verify all required variables are present
   ```

4. **Clear Vercel build cache:**
   ```bash
   vercel rm m-marketplace --safe --token=$VERCEL_TOKEN
   # This clears the build cache without affecting deployments
   ```

5. **Redeploy:**
   ```bash
   vercel deploy --prod --token=$VERCEL_TOKEN
   ```

**Additional Solutions:**
```bash
# Clear local cache and reinstall
cd apps/m-marketplace
rm -rf node_modules package-lock.json .next
npm install

# Check for dependency conflicts
npm ls

# Verify Node.js version
node --version
# Should match Vercel's Node.js version (18.x or 20.x)
```

### "Database Connection Refused"

**Causes:**
- Database not running
- Incorrect connection string
- Firewall blocking

**Solutions:**
```bash
# Check database status
pg_isready

# Verify connection string
echo $DATABASE_URL

# Check firewall
sudo ufw status
```

### "Function Timeout"

**Causes:**
- Long-running operations
- Database query timeout
- External API delays

**Solutions:**
- Optimize database queries
- Increase function timeout in `vercel.json`
- Use background jobs for long operations

## Getting Help

### Before Contacting Support

1. **Gather Information:**
   ```bash
   # Run diagnostics
   ./scripts/troubleshoot.sh
   
   # Collect logs
   vercel logs m-marketplace --token=$VERCEL_TOKEN --limit=100 > logs.txt
   ```

2. **Document Issue:**
   - Error messages
   - Steps to reproduce
   - When it started
   - Recent changes

3. **Check Documentation:**
   - Review relevant guides
   - Check troubleshooting sections
   - Search for similar issues

### Contact Information

- **Platform Team:** platform@kealee.com
  - General deployment issues
  - Application errors
  - Feature requests

- **Infrastructure:** infra@kealee.com
  - Server issues
  - Network problems
  - Infrastructure changes

- **Database Admin:** dba@kealee.com
  - Database errors
  - Migration issues
  - Performance problems

- **Security:** security@kealee.com
  - Security incidents
  - Authentication issues
  - Access problems

## Additional Resources

- [Troubleshooting Guide](../TROUBLESHOOTING_GUIDE.md) - General troubleshooting
- [Deployment Procedures](./procedures.md) - Deployment workflows
- [Vercel Environment Management](../VERCEL_ENV_MANAGEMENT.md) - Environment variables
- [Database Migration Guide](../DATABASE_MIGRATION_GUIDE.md) - Database issues

## Diagnostic Tools

### Health Check Script

```bash
# Run comprehensive health check
./scripts/health-check.sh

# Output includes:
# - Service status
# - Database connectivity
# - External service status
# - Disk space
# - Memory usage
```

### Log Aggregation

```bash
# View all application logs
./scripts/view-logs.sh --app=all --hours=24

# Search for errors
./scripts/search-logs.sh --query="error" --app=m-marketplace

# Monitor real-time logs
./scripts/tail-logs.sh --app=api
```

### Performance Monitoring

```bash
# Run performance tests
./scripts/performance-test.sh --url=https://api.kealee.com

# Check API response times
./scripts/api-response-times.sh

# Analyze slow queries
./scripts/slow-queries.sh
```

## Recovery Procedures

### Service Restart

```bash
# Restart all services
./scripts/restart-all.sh

# Restart specific service
./scripts/restart-service.sh --service=api

# Or manually
sudo systemctl restart postgresql
sudo systemctl restart redis
railway restart
```

### Database Recovery

```bash
# Restore from latest backup
./scripts/restore-database.sh --backup=latest

# Point-in-time recovery (if configured)
# Contact database admin: dba@kealee.com

# Repair corrupted tables
./scripts/repair-database.sh
```

### Rollback Procedures

```bash
# Rollback deployment
./scripts/rollback-deployment.sh --app=m-marketplace --version=previous

# Rollback database migration
npm run db:rollback:prod

# Or use restore script
./scripts/restore-database.sh backup_file.sql
```

## Quick Reference Card

```bash
# Service Status
./scripts/check-services.sh

# Health Check
./scripts/health-check.sh

# Full Diagnostics
./scripts/troubleshoot.sh

# View Logs
./scripts/view-logs.sh --app=all --hours=24
./scripts/search-logs.sh --query="error"
./scripts/tail-logs.sh --app=api

# Performance
./scripts/performance-test.sh
./scripts/slow-queries.sh

# Recovery
./scripts/restart-all.sh
./scripts/rollback-deployment.sh m-marketplace

# Database
pg_isready
psql $DATABASE_URL -c "SELECT 1;"
./scripts/restore-database.sh

# Redis
redis-cli ping

# API
curl http://localhost:3000/health
```
