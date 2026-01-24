# 🚨 POSTGRES CRASH RECOVERY GUIDE

**Date:** January 23, 2026  
**Issue:** Staging-postgres crashing in Railway  
**Status:** 🔴 Service Down

---

## 📊 CURRENT STATUS

### Services:
- ✅ **kealee-platform-v10 production** - Online
- ✅ **Worker Service** - Online
- ✅ **Redis** - Online
- ✅ **RealCo Postgres** - Online
- ✅ **RealCo production** - Building
- 🔴 **Staging-postgres** - **CRASHED** (5 minutes ago)

---

## 🔍 IMMEDIATE DIAGNOSTIC CHECKLIST

### Step 1: Check Crash Logs

**Go to Railway:**
1. Click `Staging-postgres` service
2. Go to `Deployments` tab
3. Click latest deployment
4. Scroll to bottom of logs
5. Look for error messages

**Common Error Patterns:**

#### Out of Memory:
```
Killed
OOM
signal 9
Error: could not resize shared memory segment
```

#### Disk Full:
```
ERROR: could not extend file
FATAL: could not write to file
No space left on device
df: /: No space left
```

#### Connection Limit:
```
FATAL: sorry, too many clients already
FATAL: remaining connection slots are reserved
connection limit exceeded
```

#### Configuration Error:
```
FATAL: could not load server configuration file
invalid value for parameter
syntax error in postgresql.conf
```

---

## 🔧 RECOVERY PROCEDURES

### Procedure 1: Simple Restart

**Steps:**
1. Click `Staging-postgres`
2. Go to `Settings` → `Danger Zone`
3. Click `Restart Service`
4. Wait 1-2 minutes
5. Check if service comes back online

**Expected Result:**
- 🟢 Service shows "Online"
- Logs show: "database system is ready to accept connections"

---

### Procedure 2: Redeploy Service

**If restart doesn't work:**

1. Click `Staging-postgres`
2. Go to `Deployments` tab
3. Click latest deployment
4. Click `Redeploy` button
5. Wait for new deployment to complete

---

### Procedure 3: Check Resource Limits

**Railway Free Tier Limits:**
- Memory: 512MB
- Disk: 1GB
- vCPU: Shared

**To check usage:**
1. Click `Staging-postgres`
2. Go to `Metrics` tab
3. Check:
   - Memory usage (should be < 80%)
   - Disk usage (should be < 90%)
   - CPU usage

**If limits exceeded:**
- Upgrade to Hobby Plan ($5/month)
- Or reduce database size

---

### Procedure 4: Check for Orphaned Connections

**Symptoms:**
- Too many idle connections
- Connection limit reached

**Fix (run in database):**
```sql
-- Check active connections
SELECT COUNT(*) FROM pg_stat_activity;

-- Kill idle connections (older than 5 minutes)
SELECT pg_terminate_backend(pid)
FROM pg_stat_activity
WHERE state = 'idle'
  AND state_change < NOW() - INTERVAL '5 minutes';
```

---

### Procedure 5: Clean Database (if disk full)

**Check database size:**
```sql
SELECT 
  pg_database.datname,
  pg_size_pretty(pg_database_size(pg_database.datname)) AS size
FROM pg_database
ORDER BY pg_database_size(pg_database.datname) DESC;
```

**Vacuum database:**
```sql
VACUUM FULL ANALYZE;
```

**Clear old data:**
```sql
-- Example: Clear old audit logs (if you have them)
DELETE FROM "AuditLog" WHERE "timestamp" < NOW() - INTERVAL '30 days';
```

---

## 🆘 EMERGENCY RECOVERY (If Nothing Works)

### Option A: Create New Postgres Service

**Steps:**
1. Click `+ Create` in Railway
2. Select `PostgreSQL`
3. Name it: `Staging-postgres-v2`
4. Wait for deployment
5. **Migrate data** from old to new (if possible)
6. Update API service to use new DATABASE_URL:
   ```
   DATABASE_URL=${{Staging-postgres-v2.DATABASE_URL}}
   ```

---

### Option B: Use Supabase Database Directly

**Alternative:**
- Your Supabase project already has a Postgres database
- Can use that instead of Railway Postgres
- Connection string in Supabase dashboard

**To switch:**
1. Get Supabase database URL:
   ```
   postgresql://postgres:[password]@db.[project].supabase.co:5432/postgres
   ```
2. Set in API service:
   ```
   DATABASE_URL=[supabase-connection-string]
   ```

---

## 📊 POST-RECOVERY VERIFICATION

**After service is back online:**

### 1. Test Connection:
```bash
# From Railway CLI or local
psql $DATABASE_URL -c "SELECT 1;"
```

### 2. Check Tables:
```sql
SELECT COUNT(*) FROM "User";
SELECT COUNT(*) FROM "Project";
```

### 3. Test API:
```bash
curl https://kealee-platform-v10-staging.up.railway.app/health/db
```

### 4. Monitor Metrics:
- Go to `Staging-postgres` → `Metrics`
- Watch for 10 minutes
- Ensure no spikes or crashes

---

## 🛡️ PREVENTION MEASURES

### 1. Add Connection Pooling

**In your API:**
```typescript
// Use PgBouncer or connection pool
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
  // Add connection pooling
  connection_limit = 5
  pool_timeout     = 30
}
```

### 2. Monitor Resources

**Set up alerts in Railway:**
- Memory > 80%
- Disk > 90%
- Service down

### 3. Regular Maintenance

**Weekly:**
- Check database size
- Vacuum database
- Clear old logs

**Monthly:**
- Review slow queries
- Optimize indexes
- Archive old data

---

## 📞 ESCALATION

**If postgres keeps crashing:**

1. **Railway Support:**
   - Discord: https://discord.gg/railway
   - Chat bubble in Railway dashboard
   - Describe: "Postgres keeps crashing in staging"

2. **Check Railway Status:**
   - https://railway.statuspage.io/
   - May be platform-wide issue

3. **Consider Migration:**
   - Move to managed Postgres (Supabase, Neon, Render)
   - Export data before migrating

---

## 🔍 WHAT TO SHARE WITH SUPPORT

**Copy this info:**

```
Service: Staging-postgres
Environment: staging
Status: Crashed
Last seen: [timestamp]
Error logs: [paste last 20 lines]
Memory usage: [from metrics]
Disk usage: [from metrics]
Database size: [from query]
Connection count: [from query]
```

---

## ✅ RECOVERY CHECKLIST

- [ ] 1. Check crash logs in Railway
- [ ] 2. Identify error type (OOM, disk, connections, etc.)
- [ ] 3. Restart Staging-postgres service
- [ ] 4. Verify service comes back online
- [ ] 5. Test database connection
- [ ] 6. Test API /health/db endpoint
- [ ] 7. Check API and Worker services
- [ ] 8. Monitor for 10 minutes
- [ ] 9. Document what caused crash
- [ ] 10. Implement prevention measures

---

**Priority:** 🚨 **CRITICAL** - Fix immediately!

**Status:** 🔴 Waiting for user to check logs and restart service
