# Database SQL Scripts

This directory contains SQL scripts for setting up the Kealee Platform database.

## Script Execution Order

Run these scripts in the following order:

1. **01_create_tables.sql** - Core tables (User, Org, Roles, Permissions, Service Plans)
2. **02_create_subscriptions.sql** - Subscription management tables
3. **03_create_payments.sql** - Payment processing tables
4. **04_create_documents.sql** - File storage and document management tables
5. **05_create_projects.sql** - Project management tables
6. **06_create_permits.sql** - Permit system tables
7. **07_create_inspections.sql** - Inspection tracking tables
8. **08_create_audit_logs.sql** - Audit trail and event logging tables
9. **09_create_analytics.sql** - Analytics and reporting tables
10. **10_seed_data.sql** - Initial seed data

## Quick Start

### Option 1: Run All Scripts at Once

```bash
# Using psql
psql -d your_database_name -f 00_run_all.sql

# Or using connection string
psql $DATABASE_URL -f 00_run_all.sql
```

### Option 2: Run Scripts Individually

```bash
# Set your database connection
export DATABASE_URL="postgresql://user:password@localhost:5432/kealee_platform"

# Run each script in order
psql $DATABASE_URL -f 01_create_tables.sql
psql $DATABASE_URL -f 02_create_subscriptions.sql
psql $DATABASE_URL -f 03_create_payments.sql
psql $DATABASE_URL -f 04_create_documents.sql
psql $DATABASE_URL -f 05_create_projects.sql
psql $DATABASE_URL -f 06_create_permits.sql
psql $DATABASE_URL -f 07_create_inspections.sql
psql $DATABASE_URL -f 08_create_audit_logs.sql
psql $DATABASE_URL -f 09_create_analytics.sql
psql $DATABASE_URL -f 10_seed_data.sql
```

### Option 3: Using Docker

```bash
# If using Docker PostgreSQL
docker exec -i postgres_container psql -U postgres -d kealee_platform < 00_run_all.sql
```

## Script Details

### 01_create_tables.sql
Creates core foundational tables:
- `User` - User accounts
- `Org` - Organizations
- `OrgMember` - Organization membership
- `Role` - RBAC roles
- `Permission` - RBAC permissions
- `ModuleEntitlement` - Module access control
- `ServicePlan` - Subscription service plans

### 02_create_subscriptions.sql
Creates subscription management tables:
- `ServiceSubscription` - Organization subscriptions
- `SubscriptionUsage` - Feature usage tracking

### 03_create_payments.sql
Creates payment processing tables:
- `Payment` - Payment records
- `Invoice` - Invoice records
- `PaymentMethod` - Stored payment methods

### 04_create_documents.sql
Creates file storage tables:
- `File` - File metadata
- `FileVersion` - File version history
- `DocumentShare` - File sharing permissions
- `DocumentComment` - Document comments

### 05_create_projects.sql
Creates project management tables:
- `Project` - Construction projects
- `ContractAgreement` - Contracts
- `Milestone` - Project milestones
- `Evidence` - Milestone evidence
- `EscrowAgreement` - Escrow accounts
- `EscrowTransaction` - Escrow transactions
- `Dispute` - Payment disputes

### 06_create_permits.sql
Creates permit system tables:
- `Jurisdiction` - Permit jurisdictions
- `JurisdictionStaff` - Jurisdiction staff
- `PermitTemplate` - Permit templates
- `Permit` - Permit applications
- `PermitSubmission` - Submission history
- `PermitCorrection` - Correction requests
- `PermitEvent` - Event history
- `PermitRouting` - Review routing
- `RoutingRule` - Automated routing rules
- `PermitNotification` - Status notifications

### 07_create_inspections.sql
Creates inspection tracking tables:
- `Inspection` - Building inspections
- `InspectionAssignment` - Inspector assignments
- `RemoteInspection` - Virtual inspections
- `InspectionChecklist` - Inspection checklists

### 08_create_audit_logs.sql
Creates audit and logging tables:
- `AuditLog` - Comprehensive audit trail
- `Event` - System events
- `SecurityAuditLog` - Security events
- `ApiUsage` - API usage tracking
- `WebhookDelivery` - Webhook delivery tracking

### 09_create_analytics.sql
Creates analytics tables:
- `JurisdictionAnalytics` - Jurisdiction metrics
- `OrgAnalytics` - Organization metrics
- `UserAnalytics` - User activity metrics
- `PerformanceMetrics` - Performance metrics
- `RevenueAnalytics` - Revenue analytics

### 10_seed_data.sql
Seeds initial data:
- Service plans (Package A, B, C, D)
- Default roles (admin, owner, contractor, pm, reviewer, inspector, member)
- Default permissions
- Sample jurisdictions

## Verification

After running all scripts, verify the setup:

```sql
-- Check table counts
SELECT 
    schemaname,
    tablename,
    pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;

-- Check service plans
SELECT slug, name, price_monthly FROM "ServicePlan";

-- Check roles
SELECT key, name FROM "Role";

-- Check jurisdictions
SELECT code, name FROM "Jurisdiction";
```

## Troubleshooting

### Error: relation already exists
If you see "relation already exists" errors, the tables may already be created. You can:
1. Drop and recreate: `DROP TABLE IF EXISTS "TableName" CASCADE;`
2. Use `CREATE TABLE IF NOT EXISTS` (already included in scripts)

### Error: type already exists
If you see enum type errors, the types may already exist. The scripts use `DO $$ BEGIN ... EXCEPTION ... END $$;` to handle this.

### Error: foreign key constraint
Make sure you run scripts in order. Foreign key constraints require parent tables to exist first.

## Notes

- All scripts use `IF NOT EXISTS` to be idempotent
- UUIDs are generated using `gen_random_uuid()::text`
- Timestamps use `TIMESTAMP WITH TIME ZONE`
- JSONB is used for flexible metadata storage
- Indexes are created for common query patterns
- Foreign keys use `ON DELETE CASCADE` or `ON DELETE SET NULL` as appropriate

## Next Steps

After running these scripts:
1. Run Prisma migrations: `npx prisma migrate deploy`
2. Generate Prisma client: `npx prisma generate`
3. Verify database connection in your application
4. Test API endpoints
