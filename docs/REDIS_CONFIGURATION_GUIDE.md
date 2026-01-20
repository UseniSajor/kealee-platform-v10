# Redis Configuration Guide

Complete guide for configuring Redis performance and persistence.

## Quick Configuration

```bash
# Configure Redis with recommended settings
./scripts/configure-redis.sh
```

## Configuration Settings

### Memory Management

```conf
# Maximum memory usage (2GB for production)
maxmemory 2gb

# Eviction policy when maxmemory is reached
# Options:
#   - allkeys-lru: Evict least recently used keys (recommended)
#   - allkeys-lfu: Evict least frequently used keys
#   - allkeys-random: Evict random keys
#   - volatile-lru: Evict LRU keys with expiration
#   - volatile-lfu: Evict LFU keys with expiration
#   - volatile-random: Evict random keys with expiration
#   - volatile-ttl: Evict keys with shortest TTL
#   - noeviction: Return errors when memory is full
maxmemory-policy allkeys-lru
```

### Persistence (Snapshots)

```conf
# Save the DB to disk
# Format: save <seconds> <changes>
# Save if at least 1 key changed in 900 seconds (15 minutes)
save 900 1

# Save if at least 10 keys changed in 300 seconds (5 minutes)
save 300 10

# Save if at least 10000 keys changed in 60 seconds (1 minute)
save 60 10000
```

### Append Only File (AOF)

```conf
# Enable AOF persistence (more durable than snapshots)
appendonly yes

# AOF sync policy
#   - always: fsync every write (safest, slowest)
#   - everysec: fsync every second (good balance)
#   - no: let OS decide (fastest, less safe)
appendfsync everysec
```

### Network Settings

```conf
# TCP keepalive (seconds)
tcp-keepalive 300

# Client timeout (seconds)
timeout 300
```

## Memory Calculation

### maxmemory

- **Recommended:** 50-70% of available RAM
- **Example:** 4GB RAM → 2GB maxmemory
- **Note:** Leave memory for OS and other services

### Eviction Policies

**allkeys-lru (Recommended):**
- Evicts least recently used keys
- Good for general caching
- Preserves frequently accessed data

**allkeys-lfu:**
- Evicts least frequently used keys
- Good for long-term caching
- Better for stable access patterns

**volatile-lru:**
- Only evicts keys with expiration
- Preserves keys without expiration
- Good for mixed data types

## Configuration by Use Case

### Caching Only (No Persistence)

```conf
maxmemory 2gb
maxmemory-policy allkeys-lru
save ""  # Disable snapshots
appendonly no
```

### Session Storage (High Durability)

```conf
maxmemory 2gb
maxmemory-policy allkeys-lru
save 60 10000
appendonly yes
appendfsync everysec
```

### Queue/Job Processing

```conf
maxmemory 4gb
maxmemory-policy allkeys-lru
save 300 10
appendonly yes
appendfsync everysec
```

## Applying Configuration

### Linux (systemd)

```bash
# Edit config
sudo nano /etc/redis/redis.conf

# Or use script
./scripts/configure-redis.sh

# Restart Redis
sudo systemctl restart redis
```

### macOS (Homebrew)

```bash
# Edit config
nano /usr/local/etc/redis.conf

# Or use script
./scripts/configure-redis.sh

# Restart Redis
brew services restart redis
```

### Windows

```powershell
# Edit config (usually in Program Files)
notepad "C:\Program Files\Redis\redis.conf"

# Or use script
.\scripts\configure-redis.ps1

# Restart service
Restart-Service redis
```

## Verification

### Check Current Settings

```bash
# Connect to Redis
redis-cli

# Check memory settings
CONFIG GET maxmemory
CONFIG GET maxmemory-policy

# Check persistence settings
CONFIG GET save
CONFIG GET appendonly
CONFIG GET appendfsync

# Check all settings
CONFIG GET *
```

### Monitor Redis

```bash
# Memory usage
redis-cli INFO memory

# Statistics
redis-cli INFO stats

# Persistence
redis-cli INFO persistence

# Replication (if applicable)
redis-cli INFO replication
```

### Test Persistence

```bash
# Set a test key
redis-cli SET test-key "test-value"

# Force save
redis-cli BGSAVE

# Check if saved
redis-cli LASTSAVE

# Restart Redis and verify key exists
redis-cli GET test-key
```

## Performance Monitoring

### Key Metrics

1. **Memory Usage**
   ```bash
   redis-cli INFO memory | grep used_memory_human
   ```

2. **Hit Rate**
   ```bash
   redis-cli INFO stats | grep keyspace_hits
   redis-cli INFO stats | grep keyspace_misses
   ```

3. **Evictions**
   ```bash
   redis-cli INFO stats | grep evicted_keys
   ```

4. **Persistence**
   ```bash
   redis-cli INFO persistence
   ```

## Troubleshooting

### High Memory Usage

- Check `used_memory` vs `maxmemory`
- Review eviction policy
- Check for memory leaks
- Consider increasing `maxmemory`

### Slow Performance

- Check `latency` command
- Review slow log: `SLOWLOG GET 10`
- Check network latency
- Review persistence settings

### Data Loss

- Verify `appendonly yes` is set
- Check AOF file exists
- Review `appendfsync` setting
- Check disk space

### Connection Issues

- Check `maxclients` setting
- Review `timeout` setting
- Check network configuration
- Review firewall rules

## Best Practices

1. **Memory Management**
   - Set `maxmemory` to prevent OOM
   - Use appropriate eviction policy
   - Monitor memory usage regularly

2. **Persistence**
   - Enable AOF for critical data
   - Use `everysec` for balance
   - Regular backups still recommended

3. **Performance**
   - Monitor hit rate (target >90%)
   - Review slow queries
   - Optimize data structures

4. **Security**
   - Set password: `requirepass`
   - Disable dangerous commands
   - Use TLS for remote connections

## Additional Resources

- [Redis Configuration](https://redis.io/docs/management/config/)
- [Redis Persistence](https://redis.io/docs/management/persistence/)
- [Redis Memory Optimization](https://redis.io/docs/management/optimization/)
