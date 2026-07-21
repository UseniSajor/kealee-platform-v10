# Development Database Setup Guide

Complete guide for setting up and managing the development database.

## Quick Start

### Complete Setup Workflow

```bash
# 1. Create development database
npm run db:setup

# 2. Run migrations
npm run db:migrate:dev

# 3. Seed database
npm run db:seed
```

## Step-by-Step Guide

### 1. Create Development Database

```bash
# From root directory
npm run db:setup

# Or use script directly
./scripts/setup-dev-database.sh

# Or from database package
cd packages/database
npm run db:setup
```

**What it does:**
- ✅ Tests PostgreSQL connection
- ✅ Creates `kealee_development` database
- ✅ Verifies database creation
- ✅ Prompts to recreate if database exists

**Configuration:**
```bash
# Customize database settings
DB_NAME=kealee_development \
DB_USER=kealee \
DB_PASSWORD=kealee_dev \
DB_HOST=localhost \
DB_PORT=5433 \
npm run db:setup
```

### 2. Run Migrations

```bash
# From root directory
npm run db:migrate:dev

# Or from database package
cd packages/database
npm run db:migrate:dev
```

**What it does:**
- ✅ Creates migration files (if schema changed)
- ✅ Applies migrations to database
- ✅ Generates Prisma Client

**Note:** This is the development command that creates migration files. For production, use `db:migrate:prod`.

### 3. Seed Database

```bash
# From root directory
npm run db:seed

# Or from database package
cd packages/database
npm run db:seed
```

**What it seeds:**
- ✅ Service Plans (Package A-D)
- ✅ Default Roles (Admin, PM, Contractor, etc.)
- ✅ Default Permissions
- ✅ Role-Permission Assignments
- ✅ Admin User
- ✅ Default Organization
- ✅ DC-area Jurisdictions

## Using Docker Compose

### Start PostgreSQL

```bash
# Start PostgreSQL container
docker-compose up -d postgres

# Check status
docker-compose ps

# View logs
docker-compose logs postgres
```

### Connect to Database

```bash
# Using psql
psql postgresql://kealee:kealee_dev@localhost:5433/kealee_development

# Or set DATABASE_URL
export DATABASE_URL="postgresql://kealee:kealee_dev@localhost:5433/kealee_development"
```

## Database Reset

### Reset Everything

```bash
# Drop database, recreate, run migrations, and seed
cd packages/database
npm run db:reset
```

**Warning:** This will delete all data!

### Manual Reset

```bash
# 1. Drop database
psql postgresql://kealee:kealee_dev@localhost:5433/postgres -c "DROP DATABASE kealee_development;"

# 2. Recreate
npm run db:setup

# 3. Run migrations
npm run db:migrate:dev

# 4. Seed
npm run db:seed
```

## Environment Variables

### Required

```env
DATABASE_URL=postgresql://kealee:kealee_dev@localhost:5433/kealee_development
```

### Optional (for seeding)

```env
ADMIN_EMAIL=admin@kealee.com
ADMIN_PASSWORD=ChangeMe123!
STRIPE_PRODUCT_PACKAGE_A=prod_...
STRIPE_PRICE_PACKAGE_A_MONTHLY=price_...
```

## Common Workflows

### First Time Setup

```bash
# 1. Start PostgreSQL (Docker)
docker-compose up -d postgres

# 2. Create database
npm run db:setup

# 3. Run migrations
npm run db:migrate:dev

# 4. Seed database
npm run db:seed
```

### After Schema Changes

```bash
# 1. Update schema.prisma
# Edit packages/database/prisma/schema.prisma

# 2. Create migration
npm run db:create:migration -- add_new_feature

# 3. Review migration SQL
cat packages/database/prisma/migrations/*/migration.sql

# 4. Apply migration
npm run db:migrate:dev
```

### Fresh Start

```bash
# Reset everything and start fresh
cd packages/database
npm run db:reset
npm run db:seed
```

## Troubleshooting

### Database Connection Failed

```bash
# Check PostgreSQL is running
docker-compose ps

# Check connection
psql postgresql://kealee:kealee_dev@localhost:5433/postgres -c "SELECT 1;"

# Verify DATABASE_URL
echo $DATABASE_URL
```

### Migration Errors

```bash
# Check migration status
cd packages/database
npm run db:migrate:status

# Reset migrations (careful!)
npm run db:reset
```

### Seed Errors

```bash
# Check if migrations are applied
npm run db:migrate:status

# Verify Prisma Client is generated
npm run db:generate

# Run seed again
npm run db:seed
```

### Database Already Exists

The setup script will prompt you:
- Type `yes` to drop and recreate
- Type anything else to keep existing database

## Database Tools

### Prisma Studio

```bash
# Open Prisma Studio (GUI)
cd packages/database
npm run db:studio
```

Opens at `http://localhost:5555`

### Direct SQL Access

```bash
# Connect with psql
psql $DATABASE_URL

# Or specify connection
psql postgresql://kealee:kealee_dev@localhost:5433/kealee_development
```

## Seed Data Details

### Service Plans

- **Package A:** $1,750/month (Starter)
- **Package B:** $4,500/month (Professional)
- **Package C:** $8,500/month (Premium)
- **Package D:** $16,500/month (Enterprise)

### Roles

- `admin` - Full platform access
- `pm` - Project Manager
- `contractor` - Contractor access
- `architect` - Architect access
- `project_owner` - Project Owner
- `jurisdiction_staff` - Jurisdiction Staff
- `member` - Basic member

### Admin User

- **Email:** `admin@kealee.com` (or `ADMIN_EMAIL` env var)
- **Password:** `ChangeMe123!` (or `ADMIN_PASSWORD` env var)
- **Note:** Must create user in Supabase Auth dashboard

### Jurisdictions

- District of Columbia
- Montgomery County, MD
- Prince George's County, MD
- Arlington County, VA
- Fairfax County, VA

## Next Steps

After setup:

1. ✅ Verify admin user can login
2. ✅ Check roles and permissions
3. ✅ Test service plans
4. ✅ Verify jurisdictions
5. ✅ Set up Stripe IDs (if needed)

## Support

For database issues:
1. Check PostgreSQL is running
2. Verify DATABASE_URL is set
3. Check migration status
4. Review Prisma logs
5. Contact DevOps team
