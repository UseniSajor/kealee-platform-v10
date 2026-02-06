# Troubleshooting Guide

Complete troubleshooting guide for common issues in the Kealee Platform.

## Quick Troubleshooting

```bash
# Run automated troubleshooting script
./scripts/troubleshoot.sh

# Or PowerShell
.\scripts\troubleshoot.ps1
```

## PostgreSQL Issues

### Check if PostgreSQL is Running

```bash
# Check service status
pg_isready

# Or check service
sudo systemctl status postgresql

# Check if port is listening
netstat -tlnp | grep 5432
```

### Check Connection String

```bash
# Display connection string (masked)
echo $DATABASE_URL | sed 's/:[^:@]*@/:***@/'

# Test connection
psql $DATABASE_URL -c "SELECT 1;"

# Get connection info
psql $DATABASE_URL -c "SELECT current_database(), current_user, version();"
```

### Common PostgreSQL Issues

**Issue: Connection Refused**
```bash
# Check if PostgreSQL is running
sudo systemctl start postgresql

# Check if port is open
sudo ufw allow 5432/tcp

# Check PostgreSQL logs
sudo tail -f /var/log/postgresql/postgresql-*.log
```

**Issue: Authentication Failed**
```bash
# Check pg_hba.conf
sudo nano /etc/postgresql/*/main/pg_hba.conf

# Verify connection string format
# postgresql://user:password@host:port/database
```

**Issue: Database Does Not Exist**
```bash
# List databases
psql $DATABASE_URL -c "\l"

# Create database
createdb kealee_development

# Or via connection
psql $DATABASE_URL -c "CREATE DATABASE kealee_development;"
```

**Issue: Migration Errors**
```bash
# Check migration status
cd packages/database
npx prisma migrate status

# View migration history
npx prisma migrate history

# Reset database (development only)
npx prisma migrate reset
```

## Redis Issues

### Check if Redis is Running

```bash
# Ping Redis
redis-cli ping

# Should return: PONG

# Check Redis status
sudo systemctl status redis

# Check if port is listening
netstat -tlnp | grep 6379
```

### Check Redis Logs

```bash
# View Redis logs
tail -f /var/log/redis/redis-server.log

# Check for errors
grep -i error /var/log/redis/redis-server.log

# Check Redis info
redis-cli INFO
```

### Common Redis Issues

**Issue: Connection Refused**
```bash
# Start Redis
sudo systemctl start redis

# Check Redis configuration
redis-cli CONFIG GET bind
redis-cli CONFIG GET port

# Test connection with host/port
redis-cli -h localhost -p 6379 ping
```

**Issue: Memory Full**
```bash
# Check memory usage
redis-cli INFO memory

# Check maxmemory setting
redis-cli CONFIG GET maxmemory

# Check eviction policy
redis-cli CONFIG GET maxmemory-policy

# Clear all keys (use with caution)
redis-cli FLUSHALL
```

**Issue: Slow Performance**
```bash
# Check slow queries
redis-cli SLOWLOG GET 10

# Check connection count
redis-cli INFO clients

# Monitor commands
redis-cli MONITOR
```

## Vercel Deployment Issues

### Check Build Logs

```bash
# View logs for specific app
vercel logs m-marketplace --token=$VERCEL_TOKEN

# View recent logs
vercel logs m-marketplace --token=$VERCEL_TOKEN --limit=50

# Follow logs in real-time
vercel logs m-marketplace --token=$VERCEL_TOKEN --follow
```

### Check Deployment Status

```bash
# List all deployments
vercel list m-marketplace --token=$VERCEL_TOKEN

# Get deployment details
vercel inspect <deployment-url> --token=$VERCEL_TOKEN

# Check deployment logs
vercel logs <deployment-url> --token=$VERCEL_TOKEN
```

### Common Vercel Issues

**Issue: Build Failures**
```bash
# Check build logs
vercel logs m-marketplace --token=$VERCEL_TOKEN

# Common causes:
# - Missing environment variables
# - Build errors in code
# - Dependency issues
# - Timeout errors

# Test build locally
cd apps/m-marketplace
npm run build
```

**Issue: Environment Variables Not Set**
```bash
# List environment variables
vercel env ls m-marketplace --token=$VERCEL_TOKEN

# Set environment variable
vercel env add VARIABLE_NAME production --token=$VERCEL_TOKEN

# Pull environment variables
vercel env pull .env.local
```

**Issue: Deployment Not Updating**
```bash
# Check if project is linked
cd apps/m-marketplace
vercel link

# Force new deployment
vercel deploy --prod --force --token=$VERCEL_TOKEN

# Check deployment URL
vercel ls --token=$VERCEL_TOKEN
```

**Issue: Function Timeout**
```bash
# Check function logs
vercel logs m-marketplace --token=$VERCEL_TOKEN | grep timeout

# Increase timeout in vercel.json
# {
#   "functions": {
#     "app/api/**/*.ts": {
#       "maxDuration": 30
#     }
#   }
# }
```

## Environment Variables Issues

### Check Environment Variables

```bash
# List all environment variables
env | grep -E "DATABASE|STRIPE|NEXTAUTH|SENTRY|DATADOG"

# Check specific variable
echo $DATABASE_URL

# Load from .env.local
export $(grep -v '^#' .env.local | xargs)

# Verify in Node.js
node -e "console.log(process.env.DATABASE_URL)"
```

### Common Environment Variable Issues

**Issue: Variables Not Loading**
```bash
# Check .env.local exists
ls -la .env.local

# Generate .env.local
./scripts/setup-env-local.sh

# Check variable format
cat .env.local | grep DATABASE_URL
```

**Issue: Variables Not Available in Vercel**
```bash
# List Vercel env vars
vercel env ls m-marketplace --token=$VERCEL_TOKEN

# Add missing variables
vercel env add VARIABLE_NAME production --token=$VERCEL_TOKEN

# Copy from production to preview
./scripts/copy-env-to-staging.sh
```

## API Service Issues

### Check API Status

```bash
# Test health endpoint
curl http://localhost:3000/health

# Check if API is running
lsof -i :3000

# Check API logs
cd services/api
npm run dev
# Check console output
```

### Common API Issues

**Issue: Port Already in Use**
```bash
# Find process using port 3000
lsof -i :3000

# Kill process
kill -9 <PID>

# Or use different port
PORT=3001 npm run dev
```

**Issue: Database Connection Errors**
```bash
# Check DATABASE_URL
echo $DATABASE_URL

# Test connection
psql $DATABASE_URL -c "SELECT 1;"

# Check API logs for connection errors
cd services/api
npm run dev
```

**Issue: CORS Errors**
```bash
# Check CORS configuration in API
# Verify allowed origins in CORS settings

# Test from browser console
fetch('http://localhost:3000/api/health')
  .then(r => r.json())
  .then(console.log)
```

## Network and Connectivity Issues

### Check Network Connectivity

```bash
# Test database connection
psql $DATABASE_URL -c "SELECT 1;"

# Test Redis connection
redis-cli ping

# Test API endpoint
curl http://localhost:3000/health

# Check DNS resolution
nslookup api.kealee.com

# Test external connectivity
ping google.com
```

### Check Firewall Rules

```bash
# Check firewall status
sudo ufw status

# Allow PostgreSQL
sudo ufw allow 5432/tcp

# Allow Redis
sudo ufw allow 6379/tcp

# Allow HTTP/HTTPS
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
```

## Performance Issues

### Database Performance

```bash
# Check active connections
psql $DATABASE_URL -c "SELECT count(*) FROM pg_stat_activity;"

# Check slow queries
psql $DATABASE_URL -c "SELECT * FROM pg_stat_statements ORDER BY total_time DESC LIMIT 10;"

# Check database size
psql $DATABASE_URL -c "SELECT pg_size_pretty(pg_database_size(current_database()));"
```

### Redis Performance

```bash
# Check memory usage
redis-cli INFO memory

# Check hit rate
redis-cli INFO stats | grep keyspace

# Monitor commands
redis-cli MONITOR
```

### Application Performance

```bash
# Check process resources
top -p $(pgrep -f "node.*api")

# Check memory usage
ps aux | grep node

# Monitor network
netstat -i
```

## Log Analysis

### View Application Logs

```bash
# API logs
cd services/api
npm run dev
# Check console output

# Next.js logs
cd apps/m-marketplace
npm run dev
# Check console output

# Vercel logs
vercel logs m-marketplace --token=$VERCEL_TOKEN
```

### View System Logs

```bash
# PostgreSQL logs
sudo tail -f /var/log/postgresql/postgresql-*.log

# Redis logs
sudo tail -f /var/log/redis/redis-server.log

# Nginx logs
sudo tail -f /var/log/nginx/error.log
sudo tail -f /var/log/nginx/access.log

# System logs
sudo journalctl -u postgresql -f
sudo journalctl -u redis -f
```

## Getting Help

### Diagnostic Information

When reporting issues, include:

```bash
# System information
uname -a
node --version
npm --version

# Service status
pg_isready
redis-cli ping
curl http://localhost:3000/health

# Environment
echo $DATABASE_URL | sed 's/:[^:@]*@/:***@/'
env | grep -E "NODE_ENV|DATABASE|STRIPE"

# Recent logs
tail -n 50 /var/log/postgresql/postgresql-*.log
tail -n 50 /var/log/redis/redis-server.log
```

### Common Solutions

1. **Restart Services:**
   ```bash
   sudo systemctl restart postgresql
   sudo systemctl restart redis
   ```

2. **Clear Cache:**
   ```bash
   # Redis
   redis-cli FLUSHALL
   
   # Node modules
   rm -rf node_modules package-lock.json
   npm install
   ```

3. **Reset Database (Development):**
   ```bash
   cd packages/database
   npx prisma migrate reset
   npm run db:seed
   ```

4. **Re-deploy:**
   ```bash
   cd apps/m-marketplace
   vercel deploy --prod --force --token=$VERCEL_TOKEN
   ```

## Additional Resources

- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
- [Redis Documentation](https://redis.io/docs/)
- [Vercel Documentation](https://vercel.com/docs)
- [Prisma Documentation](https://www.prisma.io/docs)
