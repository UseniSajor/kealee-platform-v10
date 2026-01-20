# Database Migration Commands

Quick reference for database migration commands.

## Quick Start

### Run Production Migrations

```bash
# From root directory
npm run db:migrate:prod

# Or from database package
cd packages/database
npm run db:migrate:prod
```

### Rollback Migration

```bash
# From root directory
npm run db:rollback:prod

# Or from database package
cd packages/database
npm run db:rollback:prod
```

### Create New Migration

```bash
# From root directory
npm run db:create:migration -- add_new_feature

# Or from database package
cd packages/database
npm run db:create:migration -- add_new_feature

# Or use script directly
./scripts/db-create-migration.sh add_new_feature
```

## Available Commands

### Production Migration

```bash
# Run migrations on production
npm run db:migrate:prod
```

**What it does:**
- ✅ Requires confirmation
- ✅ Checks migration status
- ✅ Applies pending migrations
- ✅ Verifies migration success

### Rollback Migration

```bash
# Rollback last migration
npm run db:rollback:prod
```

**What it does:**
- ✅ Requires confirmation
- ✅ Shows migration history
- ✅ Offers backup restore option
- ✅ Provides rollback instructions

**Note:** Prisma doesn't support automatic rollback. You need to:
1. Create a new migration that reverses changes
2. Or restore from backup

### Create Migration

```bash
# Create new migration
npm run db:create:migration -- add_new_feature
```

**What it does:**
- ✅ Creates migration file
- ✅ Shows migration SQL preview
- ✅ Provides next steps

## Migration Workflow

### 1. Create Migration

```bash
# Make schema changes in prisma/schema.prisma
# Then create migration
npm run db:create:migration -- add_user_preferences

# Review the generated SQL
cat packages/database/prisma/migrations/*/migration.sql
```

### 2. Test Locally

```bash
cd packages/database
npm run db:migrate
```

### 3. Test in Staging

```bash
# Set staging DATABASE_URL
export DATABASE_URL="postgresql://..."

# Run migrations
npm run db:migrate:deploy
```

### 4. Deploy to Production

```bash
# Set production DATABASE_URL
export DATABASE_URL="postgresql://..."

# Run production migrations
npm run db:migrate:prod
```

## All Database Commands

### From Root Directory

```bash
npm run db:migrate:prod        # Run production migrations
npm run db:rollback:prod       # Rollback migration
npm run db:create:migration   # Create new migration
```

### From Database Package

```bash
cd packages/database

npm run db:generate           # Generate Prisma Client
npm run db:push                # Push schema changes (dev)
npm run db:migrate             # Create and apply migration (dev)
npm run db:migrate:deploy      # Apply pending migrations
npm run db:migrate:status      # Check migration status
npm run db:migrate:prod        # Run production migrations
npm run db:rollback:prod       # Rollback migration
npm run db:create:migration    # Create migration only
npm run db:studio              # Open Prisma Studio
npm run db:seed                # Run seed script
```

## Safety Features

### Production Migrations

- ✅ Requires explicit "yes" confirmation
- ✅ Checks migration status first
- ✅ Verifies after migration
- ✅ Provides troubleshooting steps

### Rollback

- ✅ Requires confirmation
- ✅ Shows migration history
- ✅ Offers backup restore
- ✅ Provides manual rollback instructions

## Troubleshooting

### Migration Fails

```bash
# Check migration status
cd packages/database
npm run db:migrate:status

# Check database connection
psql $DATABASE_URL -c "SELECT 1;"

# Review migration files
ls -la prisma/migrations/
```

### Rollback Needed

```bash
# Option 1: Restore from backup
npm run db:rollback:prod
# Select "yes" when asked about backup restore

# Option 2: Create rollback migration
npm run db:create:migration -- rollback_<migration_name>
# Edit the SQL to reverse changes
npm run db:migrate:prod
```

### Migration Not Found

```bash
# Check migration files
ls -la packages/database/prisma/migrations/

# Verify migration was created
npm run db:migrate:status
```

## Best Practices

1. **Always test locally first**
2. **Test in staging before production**
3. **Create backups before production migrations**
4. **Review migration SQL before applying**
5. **Monitor after migration**
6. **Document migration changes**

## Support

For migration issues:
1. Check migration status
2. Review migration files
3. Verify database connection
4. Check Prisma documentation
5. Contact DevOps team
