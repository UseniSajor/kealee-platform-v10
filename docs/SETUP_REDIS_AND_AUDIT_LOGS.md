# Setup Guide: Redis & Immutable Audit Logs

## Overview

This guide covers setting up Redis for distributed rate limiting and configuring immutable audit log storage.

---

## 1. Install Dependencies ✅

### Bcrypt Support

Bcryptjs has been installed for optional bcrypt hashing:

```bash
cd services/api
pnpm add bcryptjs @types/bcryptjs
```

**Usage:**
- SHA-256 is the default (fast, secure for API keys)
- Bcrypt can be enabled by setting `API_KEY_HASH_ALGORITHM=bcrypt` in environment

---

## 2. Redis Setup for Rate Limiting

### Option A: Local Redis (Development)

**Install Redis:**
```bash
# macOS
brew install redis
brew services start redis

# Ubuntu/Debian
sudo apt-get install redis-server
sudo systemctl start redis

# Windows
# Download from: https://github.com/microsoftarchive/redis/releases
# Or use WSL
```

**Verify Redis is running:**
```bash
redis-cli ping
# Should return: PONG
```

### Option B: Docker Redis (Recommended)

**Run Redis in Docker:**
```bash
docker run -d \
  --name redis-rate-limit \
  -p 6379:6379 \
  redis:7-alpine
```

**With persistence:**
```bash
docker run -d \
  --name redis-rate-limit \
  -p 6379:6379 \
  -v redis-data:/data \
  redis:7-alpine redis-server --appendonly yes
```

### Option C: Managed Redis (Production)

**Options:**
- AWS ElastiCache
- Redis Cloud
- Azure Cache for Redis
- Google Cloud Memorystore

**Configuration:**
- Use connection string from your provider
- Set `REDIS_HOST`, `REDIS_PORT`, `REDIS_PASSWORD` in environment

### Environment Variables

Add to `services/api/.env`:

```env
# Redis Configuration
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=your_password_if_set
REDIS_DB=0
```

**Note:** If Redis is not configured, the system automatically falls back to in-memory rate limiting.

---

## 3. Configure Immutable Audit Log Storage

### Step 1: Set Audit Signing Key

**Generate a secure signing key:**
```bash
# Using OpenSSL
openssl rand -hex 32

# Or using Node.js
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

**Add to environment:**
```env
AUDIT_SIGNING_KEY=your_generated_key_here
```

⚠️ **IMPORTANT:** 
- Use a strong, random key
- Store securely (use secrets management)
- Never commit to version control
- Rotate periodically

### Step 2: Database Configuration

#### For PostgreSQL (Supabase/Managed)

**Option 1: Row Level Security (RLS) - Recommended for Supabase**

1. Enable RLS on SecurityAuditLog table:
```sql
ALTER TABLE "SecurityAuditLog" ENABLE ROW LEVEL SECURITY;
```

2. Create policy for INSERT only:
```sql
-- Allow INSERT for service role
CREATE POLICY "Allow insert for service role"
  ON "SecurityAuditLog"
  FOR INSERT
  TO service_role
  WITH CHECK (true);

-- Deny UPDATE and DELETE
CREATE POLICY "Deny updates"
  ON "SecurityAuditLog"
  FOR UPDATE
  TO service_role
  WITH CHECK (false);

CREATE POLICY "Deny deletes"
  ON "SecurityAuditLog"
  FOR DELETE
  TO service_role
  USING (false);
```

**Option 2: Database Triggers**

Run the migration script:
```bash
cd packages/database
psql $DATABASE_URL -f prisma/migrations/configure_immutable_audit_logs.sql
```

This creates:
- Write-only role
- Triggers to prevent updates/deletes
- Indexes for efficient querying

#### For Other Databases

**SQLite:**
- Use application-level enforcement
- Consider separate database file for audit logs

**MySQL:**
- Use triggers similar to PostgreSQL
- Set up separate user with INSERT-only permissions

### Step 3: Environment Configuration

Add to `services/api/.env`:

```env
# Immutable Audit Logging
AUDIT_SIGNING_KEY=your_secure_signing_key
AUDIT_SEPARATE_STORAGE=false
AUDIT_ARCHIVE_AFTER_DAYS=365
AUDIT_HASH_SENSITIVE_DATA=true
AUDIT_INCLUDE_REQUEST_BODY=true
AUDIT_INCLUDE_RESPONSE_BODY=false
AUDIT_RETENTION_DAYS=2555
```

### Step 4: Verify Configuration

**Test audit log writing:**
```typescript
import { immutableAuditService } from './modules/security-audit/immutable-audit.service';

// Write a test log
await immutableAuditService.writeAuditLog({
  eventType: 'API_ACCESS',
  severity: 'LOW',
  ipAddress: '127.0.0.1',
  userAgent: 'test',
  endpoint: '/test',
  method: 'GET',
  statusCode: 200,
});

// Verify integrity
const isValid = await immutableAuditService.verifyLogIntegrity(logId);
console.log('Log integrity:', isValid);
```

---

## 4. Verification Checklist

### Redis Setup
- [ ] Redis installed and running
- [ ] Connection test successful (`redis-cli ping`)
- [ ] Environment variables configured
- [ ] Rate limiting using Redis (check logs)
- [ ] Fallback to memory works if Redis unavailable

### Audit Log Setup
- [ ] Audit signing key generated and set
- [ ] Database permissions configured (RLS or triggers)
- [ ] Test log written successfully
- [ ] Log integrity verification works
- [ ] Chain integrity verification works
- [ ] Updates/deletes prevented

---

## 5. Production Considerations

### Redis
- **High Availability:** Use Redis Sentinel or Cluster
- **Persistence:** Enable AOF (Append Only File) or RDB snapshots
- **Monitoring:** Set up Redis monitoring (RedisInsight, etc.)
- **Backup:** Regular backups of Redis data
- **Security:** Use password authentication, TLS if possible

### Audit Logs
- **Backup:** Regular backups of audit log database
- **Archival:** Archive old logs to cold storage (S3, etc.)
- **Monitoring:** Monitor log write performance
- **Retention:** Comply with legal/regulatory requirements
- **Access Control:** Limit read access to audit logs

---

## 6. Troubleshooting

### Redis Connection Issues

**Error:** "Redis connection error"
- Check Redis is running: `redis-cli ping`
- Verify host/port in environment
- Check firewall rules
- System falls back to in-memory (check logs)

### Audit Log Issues

**Error:** "Cannot insert into SecurityAuditLog"
- Check database permissions
- Verify RLS policies (if using Supabase)
- Check service role key has INSERT permission

**Error:** "Signature verification failed"
- Verify `AUDIT_SIGNING_KEY` is set correctly
- Check key hasn't changed (signatures won't match)
- Ensure key is the same across all instances

---

## 7. Testing

### Test Redis Rate Limiting

```bash
# Start API server
cd services/api
pnpm dev

# Test rate limiting (should hit limit after configured requests)
for i in {1..150}; do
  curl -H "X-API-Key: test-key" http://localhost:3001/api/v1/permits
done
```

### Test Audit Logs

```typescript
// Test script
import { immutableAuditService } from './src/modules/security-audit/immutable-audit.service';

async function test() {
  // Write log
  const log = await immutableAuditService.writeAuditLog({
    eventType: 'API_ACCESS',
    severity: 'LOW',
    ipAddress: '127.0.0.1',
    userAgent: 'test',
    endpoint: '/test',
    method: 'GET',
    statusCode: 200,
  });

  // Verify
  const valid = await immutableAuditService.verifyLogIntegrity(log.id);
  console.log('Valid:', valid);

  // Try to verify chain
  const chain = await immutableAuditService.verifyChainIntegrity();
  console.log('Chain valid:', chain.valid);
}

test();
```

---

## Summary

✅ **Dependencies Installed:**
- bcryptjs for optional bcrypt hashing

✅ **Redis Configured:**
- Connection handling with fallback
- Distributed rate limiting support

✅ **Audit Logs Configured:**
- Immutable storage setup
- Cryptographic signatures
- Database permissions

**Next Steps:**
1. Test Redis connection
2. Test audit log writing
3. Verify rate limiting with Redis
4. Set up monitoring
5. Configure backups

---

**Last Updated:** [Date]
**Owner:** DevOps Team
