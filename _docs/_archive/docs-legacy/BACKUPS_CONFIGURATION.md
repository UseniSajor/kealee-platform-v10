# 🗄️ Automated Backups Configuration Guide

## Railway PostgreSQL Backups

### Option 1: Railway Built-in Backups (Recommended)

1. **Enable Automated Backups:**
   - Go to Railway dashboard
   - Select your PostgreSQL service
   - Go to "Settings" → "Backups"
   - Enable "Automated Backups"
   - Set retention period (recommend 30 days)

2. **Manual Backup:**
   - Click "Create Backup" in Railway dashboard
   - Download backup file

3. **Restore Backup:**
   - Go to "Backups" tab
   - Select backup to restore
   - Click "Restore"

### Option 2: External Backup Service

#### Using pg_dump (Script-based)

Create a backup script:

```bash
#!/bin/bash
# backup.sh

BACKUP_DIR="/backups"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="$BACKUP_DIR/kealee_backup_$TIMESTAMP.sql"

# Create backup
pg_dump $DATABASE_URL > $BACKUP_FILE

# Compress backup
gzip $BACKUP_FILE

# Upload to S3/R2 (optional)
# aws s3 cp $BACKUP_FILE.gz s3://your-backup-bucket/

# Delete backups older than 30 days
find $BACKUP_DIR -name "kealee_backup_*.sql.gz" -mtime +30 -delete

echo "Backup completed: $BACKUP_FILE.gz"
```

#### Schedule with Cron

Add to Railway cron job or external scheduler:

```bash
# Daily backup at 2 AM
0 2 * * * /path/to/backup.sh
```

### Option 3: Database Backup Service

Consider using:
- **Aiven** - Managed PostgreSQL with automated backups
- **Supabase** - Built-in backup system
- **AWS RDS** - Automated backups with point-in-time recovery

## Backup Verification

1. **Test Backup Restoration:**
   ```bash
   # Restore to test database
   psql $TEST_DATABASE_URL < backup.sql
   ```

2. **Verify Data Integrity:**
   - Check record counts
   - Verify critical tables
   - Test application functionality

## Backup Retention Policy

- **Daily backups:** Keep for 30 days
- **Weekly backups:** Keep for 12 weeks
- **Monthly backups:** Keep for 12 months

## Monitoring

Set up alerts for:
- Backup failures
- Backup size anomalies
- Backup age (if backups stop running)

## Recovery Time Objective (RTO)

**Target:** Restore database within 1 hour of failure

## Recovery Point Objective (RPO)

**Target:** Maximum data loss of 1 hour (daily backups)

---

**Last Updated:** January 19, 2025
