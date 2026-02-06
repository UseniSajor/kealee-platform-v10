# Database Backup Guide

Complete guide for backing up and restoring databases.

## Quick Start

### Create Backup

```bash
# Full backup (default)
./scripts/backup-database.sh

# Schema-only backup
BACKUP_TYPE=schema-only ./scripts/backup-database.sh

# Data-only backup
BACKUP_TYPE=data-only ./scripts/backup-database.sh

# Uncompressed backup
COMPRESS=false ./scripts/backup-database.sh
```

### Restore from Backup

```bash
# Restore from backup file
./scripts/restore-database.sh backups/db_backup_database_20260115_120000.sql

# Restore compressed backup
./scripts/restore-database.sh backups/db_backup_database_20260115_120000.sql.gz
```

## Backup Types

### Full Backup

Backs up both schema and data:

```bash
./scripts/backup-database.sh
# or
BACKUP_TYPE=full ./scripts/backup-database.sh
```

### Schema-Only Backup

Backs up only the database structure (no data):

```bash
BACKUP_TYPE=schema-only ./scripts/backup-database.sh
```

Useful for:
- Version control
- Schema documentation
- Quick schema comparisons

### Data-Only Backup

Backs up only the data (no schema):

```bash
BACKUP_TYPE=data-only ./scripts/backup-database.sh
```

Useful for:
- Data migration
- Data recovery
- Testing with production data

## Backup Features

### Automatic Features

- ✅ Timestamped filenames
- ✅ Backup verification
- ✅ Size reporting
- ✅ Duration tracking
- ✅ Info file generation
- ✅ Compression support

### Backup File Format

```
backups/
  db_backup_<database>_<timestamp>.sql
  db_backup_<database>_<timestamp>.sql.gz  # if compressed
  db_backup_<database>_<timestamp>.sql.info  # metadata
```

### Backup Info File

Each backup includes a `.info` file with:
- Database name
- Backup type
- Creation timestamp
- Duration
- File size
- DATABASE_URL (masked)

## Restore Process

### Safety Features

- ✅ Requires explicit "restore" confirmation
- ✅ Tests database connection first
- ✅ Verifies restore success
- ✅ Reports table count
- ✅ Provides next steps

### Restore Steps

1. **Select backup file:**
   ```bash
   ls -t backups/*.sql* | head -5
   ```

2. **Set DATABASE_URL:**
   ```bash
   export DATABASE_URL="postgresql://..."
   ```

3. **Run restore:**
   ```bash
   ./scripts/restore-database.sh backups/db_backup_database_20260115_120000.sql
   ```

4. **Verify:**
   ```bash
   psql $DATABASE_URL -c "SELECT COUNT(*) FROM information_schema.tables;"
   ```

## Best Practices

### Backup Schedule

- **Production:** Daily automated backups
- **Staging:** Before major changes
- **Development:** Before schema changes

### Backup Retention

- Keep at least 7 days of backups
- Keep monthly backups for 3 months
- Keep yearly backups indefinitely

### Before Restore

1. ✅ Create current backup
2. ✅ Stop all applications
3. ✅ Put database in maintenance mode
4. ✅ Verify backup file is correct
5. ✅ Test restore on staging first

### After Restore

1. ✅ Verify data integrity
2. ✅ Run migrations if needed
3. ✅ Restart applications
4. ✅ Run smoke tests
5. ✅ Monitor for errors

## Automated Backups

### Cron Job (Linux/macOS)

```bash
# Daily backup at 2 AM
0 2 * * * cd /path/to/project && ./scripts/backup-database.sh
```

### Scheduled Task (Windows)

```powershell
# Create scheduled task
$action = New-ScheduledTaskAction -Execute "powershell.exe" -Argument "-File C:\path\to\scripts\backup-database.ps1"
$trigger = New-ScheduledTaskTrigger -Daily -At 2am
Register-ScheduledTask -TaskName "Database Backup" -Action $action -Trigger $trigger
```

## Backup Locations

### Local Backups

```bash
# Default location
backups/

# Custom location
BACKUP_DIR=/path/to/backups ./scripts/backup-database.sh
```

### Remote Backups

For production, consider:
- AWS S3
- Google Cloud Storage
- Azure Blob Storage
- Cloudflare R2

## Troubleshooting

### Backup Fails

1. **Check database connection:**
   ```bash
   psql $DATABASE_URL -c "SELECT 1;"
   ```

2. **Check disk space:**
   ```bash
   df -h backups/
   ```

3. **Check permissions:**
   ```bash
   ls -la backups/
   ```

### Restore Fails

1. **Check backup file:**
   ```bash
   file backups/db_backup_*.sql
   head backups/db_backup_*.sql
   ```

2. **Check database connection:**
   ```bash
   psql $DATABASE_URL -c "SELECT 1;"
   ```

3. **Check database permissions:**
   ```bash
   psql $DATABASE_URL -c "SELECT current_user;"
   ```

### Compressed Backup Issues

```bash
# Test compressed backup
gzip -t backups/db_backup_*.sql.gz

# Decompress manually
gunzip -c backups/db_backup_*.sql.gz > restore.sql
```

## Integration with CI/CD

### Pre-Deployment Backup

```yaml
# GitHub Actions
- name: Backup database
  run: |
    export DATABASE_URL="${{ secrets.DATABASE_URL }}"
    ./scripts/backup-database.sh
  env:
    DATABASE_URL: ${{ secrets.DATABASE_URL }}
```

### Post-Deployment Verification

```yaml
- name: Verify database
  run: |
    psql $DATABASE_URL -c "SELECT COUNT(*) FROM information_schema.tables;"
```

## Support

For backup/restore issues:
1. Check database connection
2. Verify backup file integrity
3. Check disk space
4. Review backup logs
5. Contact DevOps team
