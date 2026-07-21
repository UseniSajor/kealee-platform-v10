# Performance Testing Guide

## Performance Targets

- **Health check:** < 100ms
- **Validation:** < 200ms
- **Database queries:** < 500ms
- **API endpoints:** < 1000ms
- **Concurrent requests:** Support 100+ concurrent

## Load Testing

### Using Artillery (Recommended)

```bash
# Install Artillery
npm install -g artillery

# Run load test
artillery run load-test.yml
```

### Using Apache Bench

```bash
# Test health endpoint
ab -n 1000 -c 10 http://localhost:3001/health

# Test with authentication
ab -n 100 -c 5 -H "Authorization: Bearer TOKEN" http://localhost:3001/users
```

## Query Optimization

### Database Indexes

Ensure indexes exist for:
- User email lookups
- Organization slug lookups
- Event/audit log queries (by entity, user, date)
- Foreign key relationships

### Slow Query Monitoring

Enable query logging in Prisma:
```typescript
const prisma = new PrismaClient({
  log: ['query', 'error', 'warn'],
})
```

## Performance Monitoring

- Monitor response times
- Track database query performance
- Monitor queue processing times
- Track error rates
- Monitor rate limit hits
