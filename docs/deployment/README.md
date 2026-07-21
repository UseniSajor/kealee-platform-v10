# Deployment Documentation

This directory contains deployment procedures and guides for the Kealee Platform.

## Contents

- **procedures.md** - Complete deployment procedures and workflows
- **troubleshooting.md** - Deployment troubleshooting guide
- **runbook.md** - Operational runbook with alert response procedures
- **README.md** - This file

## Quick Links

### Getting Started
- [Deployment Procedures](./procedures.md)
- [Environment Setup](../ENVIRONMENT_SETUP.md)
- [Pre-Production Checklist](../PRE_PRODUCTION_CHECKLIST.md)

### Testing
- [API Testing Guide](../API_TESTING_GUIDE.md)
- [Staging Testing Guide](../STAGING_TESTING_GUIDE.md)
- [Payment Testing Guide](../PAYMENT_TESTING_GUIDE.md)

### Database
- [Database Migration Guide](../DATABASE_MIGRATION_GUIDE.md)
- [Backups Configuration](../BACKUPS_CONFIGURATION.md)

### Infrastructure
- [Domain Configuration](../DOMAIN_CONFIGURATION.md)
- [Vercel Environment Configuration](../VERCEL_ENV_CONFIGURATION.md)
- [Monitoring](../MONITORING.md)

## Deployment Workflow

1. **Pre-Deployment**
   - Run tests
   - Review code
   - Check environment variables
   - Create database backup

2. **Deployment**
   - Deploy API service
   - Deploy frontend applications
   - Run database migrations
   - Update environment variables

3. **Post-Deployment**
   - Run health checks
   - Execute smoke tests
   - Monitor logs and metrics
   - Verify user flows

## Applications

| App | Deployment | Status |
|-----|------------|--------|
| API Service | Railway | [![Railway](https://railway.app/badge.svg)](https://railway.app) |
| m-ops-services | Vercel | [![Vercel](https://vercel.com/button)](https://vercel.com) |
| os-admin | Vercel | [![Vercel](https://vercel.com/button)](https://vercel.com) |
| m-project-owner | Vercel | [![Vercel](https://vercel.com/button)](https://vercel.com) |
| m-architect | Vercel | [![Vercel](https://vercel.com/button)](https://vercel.com) |
| m-permits-inspections | Vercel | [![Vercel](https://vercel.com/button)](https://vercel.com) |

## Support

For deployment questions or issues, refer to:
- [Deployment Procedures](./procedures.md)
- [Troubleshooting Guide](./troubleshooting.md)
- DevOps team

### Emergency Contacts

- **Platform Team:** platform@kealee.com
- **Infrastructure:** infra@kealee.com
- **Database Admin:** dba@kealee.com
- **Security:** security@kealee.com
