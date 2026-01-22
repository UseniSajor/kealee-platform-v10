# 🔴 Redis Setup Guide for Kealee Platform

## Overview
Redis is required for:
- ✅ Session management (enhanced authentication)
- ✅ Rate limiting (advanced rate limiter)
- ✅ Caching (API responses)
- ✅ Job queues (BullMQ worker)

---

## 🚀 Railway Redis Setup (Recommended)

### Step 1: Add Redis to Railway Project

1. **Open Railway Dashboard**
   - Go to https://railway.app
   - Select your Kealee project

2. **Add Redis Service**
   ```bash
   # In Railway Dashboard:
   # 1. Click "+ New"
   # 2. Select "Database"
   # 3. Choose "Add Redis"
   # 4. Click "Add Redis"
   ```

3. **Redis Instance Created**
   - Railway automatically provisions Redis
   - Generates `REDIS_URL` environment variable
   - Format: `redis://default:password@redis.railway.internal:6379`

### Step 2: Link Redis to Services

**Link to API Service:**
1. Go to API service settings
2. Click "Variables" tab
3. Railway auto-adds `REDIS_URL` reference
4. Verify it shows: `${{Redis.REDIS_URL}}`

**Link to Worker Service:**
1. Go to Worker service settings
2. Click "Variables" tab
3. Add `REDIS_URL` → `${{Redis.REDIS_URL}}`

### Step 3: Verify Connection

After deployment, check logs:
```bash
# API logs should show:
✅ Redis connected for rate limiting
✅ Session store initialized

# Worker logs should show:
✅ BullMQ connected to Redis
✅ Job queues ready
```

---

## 🏠 Local Redis Setup (Development)

### Option 1: Docker (Recommended)

```bash
# Start Redis in Docker
docker run -d \
  --name kealee-redis \
  -p 6379:6379 \
  redis:7-alpine

# Verify it's running
docker ps | grep redis

# Set local environment variable
echo "REDIS_URL=redis://localhost:6379" >> .env
```

### Option 2: Native Installation

**Windows:**
```powershell
# Install using Chocolatey
choco install redis-64

# Or download from:
# https://github.com/microsoftarchive/redis/releases

# Start Redis
redis-server

# Test connection
redis-cli ping
# Should return: PONG
```

**macOS:**
```bash
# Install using Homebrew
brew install redis

# Start Redis
brew services start redis

# Test connection
redis-cli ping
```

**Linux:**
```bash
# Ubuntu/Debian
sudo apt-get update
sudo apt-get install redis-server

# Start Redis
sudo systemctl start redis
sudo systemctl enable redis

# Test connection
redis-cli ping
```

---

## ⚙️ Redis Configuration

### Recommended Settings (Railway)

Railway Redis comes pre-configured, but you can adjust:

```
maxmemory: 100mb (adjust based on plan)
maxmemory-policy: allkeys-lru
timeout: 300
tcp-keepalive: 60
```

### Connection Pool Settings (In Code)

Already configured in `services/api/src/middleware/advanced-rate-limit.ts`:

```typescript
const redisClient = new Redis(redisUrl, {
  maxRetriesPerRequest: 3,
  enableReadyCheck: true,
  retryStrategy: (times) => {
    return Math.min(times * 50, 2000);
  }
});
```

---

## 🧪 Test Redis Connection

### Manual Test

```bash
# Connect to Railway Redis (get URL from dashboard)
redis-cli -u $REDIS_URL

# Test commands
> SET test "Hello Kealee"
OK
> GET test
"Hello Kealee"
> DEL test
(integer) 1
> QUIT
```

### Test via API

```bash
# Hit a rate-limited endpoint
curl -X GET https://api-staging.kealee.com/health \
  -H "Accept: application/json"

# Should see response headers:
# X-RateLimit-Limit: 100
# X-RateLimit-Remaining: 99
# X-RateLimit-Reset: 1737590400
```

---

## 📊 Monitoring Redis

### Railway Dashboard

1. Go to Redis service in Railway
2. View metrics:
   - Memory usage
   - Commands per second
   - Connected clients
   - Hit rate

### Redis CLI Monitoring

```bash
# Connect and run INFO
redis-cli -u $REDIS_URL INFO

# Monitor real-time commands
redis-cli -u $REDIS_URL MONITOR

# Check memory usage
redis-cli -u $REDIS_URL INFO memory

# Check connected clients
redis-cli -u $REDIS_URL CLIENT LIST
```

---

## 🔒 Security Best Practices

### 1. Use Strong Password
Railway automatically generates secure passwords. Never use default.

### 2. Use Internal URLs
```env
# ✅ GOOD (Railway internal network)
REDIS_URL=redis://default:pass@redis.railway.internal:6379

# ❌ BAD (Public URL)
REDIS_URL=redis://default:pass@redis-prod.railway.app:6379
```

### 3. Enable TLS (Production)
```env
# For production, use TLS
REDIS_URL=rediss://default:pass@redis.railway.internal:6379
```

### 4. Limit Max Memory
```bash
# Prevent Redis from using all available memory
CONFIG SET maxmemory 100mb
CONFIG SET maxmemory-policy allkeys-lru
```

---

## 🐛 Troubleshooting

### Error: "ECONNREFUSED"

**Cause:** Redis not running or wrong URL

**Solution:**
```bash
# Check Redis is running
redis-cli -u $REDIS_URL ping

# Verify REDIS_URL is set
echo $REDIS_URL

# Check Railway logs
railway logs -s redis
```

### Error: "Too many clients"

**Cause:** Connection pool exhausted

**Solution:**
```bash
# Check connected clients
redis-cli -u $REDIS_URL CLIENT LIST | wc -l

# Kill idle connections
redis-cli -u $REDIS_URL CLIENT KILL TYPE normal SKIPME yes
```

### Error: "OOM command not allowed"

**Cause:** Redis out of memory

**Solution:**
```bash
# Check memory usage
redis-cli -u $REDIS_URL INFO memory

# Clear all keys (CAREFUL!)
redis-cli -u $REDIS_URL FLUSHALL

# Or increase maxmemory
CONFIG SET maxmemory 200mb
```

### High Latency

**Check:**
```bash
# Measure latency
redis-cli -u $REDIS_URL --latency

# Check slow log
redis-cli -u $REDIS_URL SLOWLOG GET 10
```

---

## 📈 Performance Tuning

### Optimal Settings

```redis
# Connection timeout
timeout 300

# TCP keepalive
tcp-keepalive 60

# Max clients
maxclients 10000

# Save snapshots (persistence)
save 900 1
save 300 10
save 60 10000

# Memory optimization
maxmemory-policy allkeys-lru
```

### Application-Level Optimization

```typescript
// Use connection pooling
const redis = new Redis(REDIS_URL, {
  lazyConnect: true,
  maxRetriesPerRequest: 3,
  enableOfflineQueue: false
});

// Use pipelining for multiple commands
const pipeline = redis.pipeline();
pipeline.set('key1', 'value1');
pipeline.set('key2', 'value2');
await pipeline.exec();
```

---

## 📋 Checklist

After setting up Redis:

- [ ] Redis provisioned in Railway
- [ ] `REDIS_URL` linked to API service
- [ ] `REDIS_URL` linked to Worker service
- [ ] Services redeployed
- [ ] Connection verified in logs
- [ ] Rate limiting tested
- [ ] Session management tested
- [ ] Monitoring dashboard checked

---

## 📞 Support

**Railway Redis Issues:**
- Check Railway status: https://railway.app/status
- Railway Discord: https://discord.gg/railway

**Redis Issues:**
- Redis documentation: https://redis.io/docs
- Redis commands: https://redis.io/commands

---

**Next Step:** Configure Stripe webhooks (see `STRIPE_WEBHOOK_SETUP.md`)
