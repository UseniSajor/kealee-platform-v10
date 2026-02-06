# Kealee Platform Documentation

Complete documentation for the Kealee Platform development, deployment, and operations.

## 📚 Documentation Index

### 🚀 Getting Started

- [Deployment Procedures](./deployment/procedures.md) - Complete deployment workflows
- [Environment Variables Setup](./ENVIRONMENT_VARIABLES_SETUP.md) - Local environment configuration
- [Vercel Setup Guide](./VERCEL_SETUP_GUIDE.md) - Vercel CLI and project setup
- [Development Database Setup](./DEVELOPMENT_DATABASE_SETUP.md) - Local database configuration

### 🧪 Testing

- [API Testing Guide](./API_TESTING_GUIDE.md) - Comprehensive API endpoint testing
- [API Testing Workflow](./API_TESTING_WORKFLOW.md) - Complete API testing workflow
- [Staging Testing Guide](./STAGING_TESTING_GUIDE.md) - Staging environment testing
- [Payment Testing Guide](./PAYMENT_TESTING_GUIDE.md) - Payment processing testing

### 🗄️ Database

- [Database Migration Guide](./DATABASE_MIGRATION_GUIDE.md) - Running and managing migrations
- [Database Backup Guide](./DATABASE_BACKUP_GUIDE.md) - Backup and restore procedures
- [PostgreSQL Performance Tuning](./POSTGRESQL_PERFORMANCE_TUNING.md) - PostgreSQL optimization
- [Redis Configuration Guide](./REDIS_CONFIGURATION_GUIDE.md) - Redis setup and optimization

### 🔧 Configuration

- [Environment Variables Guide](./ENVIRONMENT_VARIABLES_GUIDE.md) - Managing environment variables
- [Environment Templates](./ENV_TEMPLATES.md) - Environment variable templates
- [Vercel Environment Configuration](./VERCEL_ENV_CONFIGURATION.md) - Vercel env var management

### 🚢 Deployment

- [Staging Deployment Guide](./DEPLOYMENT_STAGING_GUIDE.md) - Deploying to staging
- [Production Deployment Guide](./DEPLOYMENT_PRODUCTION_GUIDE.md) - Production deployment procedures
- [Deployment Procedures](./deployment/procedures.md) - Complete deployment workflows

### 🔍 Monitoring & Operations

- [Monitoring Implementation Guide](./MONITORING_IMPLEMENTATION_GUIDE.md) - Setting up monitoring
- [Stripe Webhook Setup Guide](./STRIPE_WEBHOOK_SETUP_GUIDE.md) - Stripe webhook configuration

### 📋 Quick Reference

- [Database Migration Commands](./DATABASE_MIGRATION_COMMANDS.md) - Quick command reference
- [Environment Variables Setup](./ENVIRONMENT_VARIABLES_SETUP.md) - Environment setup quick start

## 🛠️ Scripts Overview

### Setup Scripts

- `scripts/setup-vercel-cli.sh` - Vercel CLI installation and setup
- `scripts/setup-env-local.sh` - Generate local `.env.local` files
- `scripts/setup-dev-database.sh` - Development database setup
- `scripts/setup-staging-env.sh` - Staging environment variables
- `scripts/link-vercel-projects.sh` - Link all Vercel projects

### Testing Scripts

- `scripts/test-staging.sh` - Staging environment testing
- `scripts/test-payment-processing.sh` - Payment flow testing
- `scripts/test-all-api-endpoints.sh` - Comprehensive API testing
- `scripts/run-api-tests.sh` - Complete API testing workflow

### Deployment Scripts

- `scripts/pre-deployment-checklist.sh` - Pre-deployment validation
- `scripts/deploy-staging.sh` - Deploy all apps to staging
- `scripts/deploy-production.sh` - Production deployment
- `scripts/deploy-hotfix.sh` - Emergency hotfix deployment

### Database Scripts

- `scripts/db-migrate-prod.sh` - Production migrations
- `scripts/db-migrate-staging.sh` - Staging migrations
- `scripts/db-create-migration.sh` - Create new migration
- `scripts/backup-database.sh` - Database backup
- `scripts/restore-database.sh` - Database restore

### Infrastructure Scripts

- `scripts/create-production-db.sh` - Production database creation
- `scripts/create-staging-db.sh` - Staging database creation
- `scripts/setup-dns.sh` - DNS configuration
- `scripts/setup-ssl.sh` - SSL certificate setup
- `scripts/configure-postgresql.sh` - PostgreSQL optimization
- `scripts/configure-redis.sh` - Redis optimization

### Monitoring Scripts

- `scripts/setup-sentry.sh` - Sentry error monitoring setup
- `scripts/setup-datadog.sh` - Datadog monitoring setup
- `scripts/setup-uptime-monitoring.sh` - Uptime monitoring setup
- `scripts/implement-monitoring.sh` - Install and configure monitoring
- `scripts/setup-backups.sh` - Automated backup configuration
- `scripts/setup-log-retention.sh` - Log retention policies

### Webhook Scripts

- `scripts/setup-stripe-webhook-testing.sh` - Stripe webhook setup
- `scripts/test-stripe-webhooks.sh` - Stripe webhook testing

## 📖 Common Workflows

### Initial Setup

```bash
# 1. Setup Vercel CLI and link projects
./scripts/link-vercel-projects.sh

# 2. Setup local environment
./scripts/setup-env-local.sh

# 3. Setup development database
./scripts/setup-dev-database.sh
npm run db:migrate:dev
npm run db:seed
```

### Staging Deployment

```bash
# 1. Run pre-deployment checks
./scripts/pre-deployment-checklist.sh

# 2. Deploy to staging
./scripts/deploy-staging.sh

# 3. Test staging deployment
./scripts/test-staging.sh
```

### Production Deployment

```bash
# 1. Run pre-deployment checks
./scripts/pre-deployment-checklist.sh

# 2. Backup database
./scripts/backup-database.sh

# 3. Deploy to production
./scripts/deploy-production.sh

# 4. Run migrations
npm run db:migrate:prod
```

### Database Operations

```bash
# Create new migration
npm run db:create:migration -- --name=add_feature

# Run development migrations
npm run db:migrate:dev

# Run staging migrations
npm run db:migrate:staging

# Run production migrations
npm run db:migrate:prod

# Backup database
./scripts/backup-database.sh

# Restore database
./scripts/restore-database.sh backup_file.sql
```

## 🔗 External Resources

- [Vercel Documentation](https://vercel.com/docs)
- [Railway Documentation](https://docs.railway.app)
- [Prisma Documentation](https://www.prisma.io/docs)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
- [Redis Documentation](https://redis.io/docs/)
- [Stripe Documentation](https://stripe.com/docs)

## 📝 Contributing

When adding new documentation:

1. Create the documentation file in the `docs/` directory
2. Update this README with a link to the new documentation
3. Add appropriate scripts if needed
4. Include examples and troubleshooting sections

## 🆘 Support

For questions or issues:

1. Check the relevant documentation above
2. Review troubleshooting sections in guides
3. Check script help: `./scripts/<script-name>.sh --help`
4. Contact the DevOps team
