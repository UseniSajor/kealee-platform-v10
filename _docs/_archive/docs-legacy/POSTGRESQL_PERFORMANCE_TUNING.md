# PostgreSQL Performance Tuning Guide

Complete guide for optimizing PostgreSQL performance.

## Quick Configuration

```bash
# Configure PostgreSQL with recommended settings
./scripts/configure-postgresql.sh
```

## Configuration Settings

### Core Performance Settings

```conf
# Connection Settings
max_connections = 200

# Memory Settings
shared_buffers = 4GB              # ~25% of RAM
effective_cache_size = 12GB      # ~50-75% of RAM
maintenance_work_mem = 1GB
work_mem = 64MB                   # Calculated: (effective_cache_size - shared_buffers) / max_connections

# Write-Ahead Log (WAL)
wal_buffers = 16MB
min_wal_size = 1GB
max_wal_size = 4GB
checkpoint_completion_target = 0.9

# Query Planner
default_statistics_target = 100
random_page_cost = 1.1            # For SSD
effective_io_concurrency = 200    # For SSD

# Parallel Processing
max_worker_processes = 8
max_parallel_workers_per_gather = 4
max_parallel_workers = 8
max_parallel_maintenance_workers = 4
```

## Memory Calculation

### shared_buffers
- **Recommended:** 25% of total RAM
- **Example:** 16GB RAM → 4GB shared_buffers
- **Maximum:** 40% of RAM (diminishing returns)

### effective_cache_size
- **Recommended:** 50-75% of total RAM
- **Example:** 16GB RAM → 12GB effective_cache_size
- **Purpose:** Helps query planner estimate cache hits

### work_mem
- **Formula:** `(effective_cache_size - shared_buffers) / max_connections`
- **Example:** (12GB - 4GB) / 200 = ~40MB per connection
- **Note:** This is per operation, not per connection

## Configuration by System Size

### Small System (8GB RAM)
```conf
max_connections = 100
shared_buffers = 2GB
effective_cache_size = 6GB
maintenance_work_mem = 512MB
work_mem = 40MB
```

### Medium System (16GB RAM)
```conf
max_connections = 200
shared_buffers = 4GB
effective_cache_size = 12GB
maintenance_work_mem = 1GB
work_mem = 64MB
```

### Large System (32GB RAM)
```conf
max_connections = 300
shared_buffers = 8GB
effective_cache_size = 24GB
maintenance_work_mem = 2GB
work_mem = 80MB
```

## Applying Configuration

### Linux (systemd)
```bash
# Edit config
sudo nano /etc/postgresql/16/main/postgresql.conf

# Or use script
./scripts/configure-postgresql.sh

# Restart PostgreSQL
sudo systemctl restart postgresql
```

### macOS (Homebrew)
```bash
# Edit config
nano /usr/local/var/postgres/postgresql.conf

# Restart PostgreSQL
brew services restart postgresql
```

### Windows
```powershell
# Edit config (usually in Program Files)
notepad "C:\Program Files\PostgreSQL\16\data\postgresql.conf"

# Or use script
.\scripts\configure-postgresql.ps1

# Restart service
Restart-Service postgresql-x64-16
```

## Verification

### Check Current Settings
```sql
-- Connection settings
SHOW max_connections;

-- Memory settings
SHOW shared_buffers;
SHOW effective_cache_size;
SHOW work_mem;
SHOW maintenance_work_mem;

-- WAL settings
SHOW wal_buffers;
SHOW min_wal_size;
SHOW max_wal_size;

-- All settings
SHOW ALL;
```

### Monitor Performance
```sql
-- Active connections
SELECT count(*) FROM pg_stat_activity;

-- Cache hit ratio
SELECT 
    schemaname,
    tablename,
    heap_blks_read,
    heap_blks_hit,
    round(100.0 * heap_blks_hit / (heap_blks_hit + heap_blks_read), 2) as cache_hit_ratio
FROM pg_statio_user_tables
WHERE heap_blks_hit + heap_blks_read > 0
ORDER BY cache_hit_ratio DESC;

-- Database size
SELECT pg_size_pretty(pg_database_size(current_database()));

-- Table sizes
SELECT 
    schemaname,
    tablename,
    pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;
```

## Performance Monitoring

### Key Metrics

1. **Cache Hit Ratio**
   - Target: >95%
   - If low, increase `shared_buffers` or `effective_cache_size`

2. **Connection Usage**
   - Monitor: `SELECT count(*) FROM pg_stat_activity;`
   - Adjust `max_connections` if needed

3. **Checkpoint Frequency**
   - Monitor: `SELECT * FROM pg_stat_bgwriter;`
   - Adjust `checkpoint_completion_target` if needed

4. **Query Performance**
   - Use `EXPLAIN ANALYZE` for slow queries
   - Check `pg_stat_statements` for query statistics

## Troubleshooting

### High Memory Usage
- Reduce `shared_buffers` if system is swapping
- Reduce `max_connections` if too many idle connections
- Check `work_mem` usage per query

### Slow Queries
- Increase `effective_cache_size`
- Update statistics: `ANALYZE;`
- Check indexes: `\d+ table_name`

### Connection Issues
- Check `max_connections` limit
- Monitor active connections
- Consider connection pooling (PgBouncer)

## Best Practices

1. **Start Conservative**
   - Begin with recommended settings
   - Monitor and adjust based on workload

2. **Monitor Regularly**
   - Check cache hit ratio weekly
   - Monitor connection usage
   - Review slow query log

3. **Test Changes**
   - Test in staging first
   - Make incremental changes
   - Monitor after each change

4. **Document Changes**
   - Keep backup of original config
   - Document why changes were made
   - Track performance improvements

## Additional Resources

- [PostgreSQL Performance Tuning](https://www.postgresql.org/docs/current/performance-tips.html)
- [PostgreSQL Configuration](https://www.postgresql.org/docs/current/runtime-config.html)
- [PgTune](https://pgtune.leopard.in.ua/) - Online configuration generator
