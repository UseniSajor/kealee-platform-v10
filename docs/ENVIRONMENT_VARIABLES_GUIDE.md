# Environment Variables Guide

Complete guide for managing environment variables across all environments.

## Quick Start

### Copy Production to Staging

```bash
# Copy all production env vars to staging for all apps
./scripts/copy-env-to-staging.sh

# Copy for specific app
./scripts/copy-env-to-staging.sh --app=m-marketplace

# Dry run (preview changes)
./scripts/copy-env-to-staging.sh --dry-run

# Force overwrite existing variables
./scripts/copy-env-to-staging.sh --force
```

## Environment Variable Management

### Setting Variables

#### Single App

```bash
# Using setup script
./scripts/setup-env.sh m-marketplace production

# Manual
cd apps/m-marketplace
vercel env add DATABASE_URL production
# Paste value when prompted
```

#### All Apps

```bash
# Set for all apps
./scripts/setup-env-all.sh production
```

### Copying Variables

#### Production to Staging

```bash
# Copy all production vars to staging
./scripts/copy-env-to-staging.sh

# Specific app
./scripts/copy-env-to-staging.sh --app=os-admin

# With options
./scripts/copy-env-to-staging.sh --app=m-marketplace --force --dry-run
```

### Listing Variables

```bash
# List all environments
cd apps/m-marketplace
vercel env ls

# List specific environment
vercel env ls production
vercel env ls preview
```

### Removing Variables

```bash
# Remove variable
cd apps/m-marketplace
vercel env rm VARIABLE_NAME production

# Remove with confirmation
vercel env rm VARIABLE_NAME production --yes
```

## Environment Types

### Production

Production environment variables are used for:
- Live production deployments
- Real user traffic
- Production databases
- Production API keys

```bash
# Set production variable
vercel env add DATABASE_URL production

# List production variables
vercel env ls production
```

### Preview (Staging)

Preview environment variables are used for:
- Preview deployments (PRs, branches)
- Staging/testing
- Test databases
- Test API keys

```bash
# Set preview variable
vercel env add DATABASE_URL preview

# Copy from production
./scripts/copy-env-to-staging.sh
```

### Development

Development environment variables are used for:
- Local development
- Development databases
- Development API keys

```bash
# Set development variable
vercel env add DATABASE_URL development
```

## Common Workflows

### Initial Setup

```bash
# 1. Setup Vercel CLI
./scripts/setup-vercel-cli.sh

# 2. Set production variables
./scripts/setup-env-all.sh production

# 3. Copy to staging
./scripts/copy-env-to-staging.sh
```

### Adding New Variable

```bash
# 1. Add to production
cd apps/m-marketplace
vercel env add NEW_VARIABLE production

# 2. Copy to staging
./scripts/copy-env-to-staging.sh --app=m-marketplace

# 3. Verify
vercel env ls preview
```

### Updating Variable

```bash
# 1. Remove old value
cd apps/m-marketplace
vercel env rm VARIABLE_NAME production --yes

# 2. Add new value
vercel env add VARIABLE_NAME production

# 3. Copy to staging
./scripts/copy-env-to-staging.sh --app=m-marketplace --force
```

### Syncing All Apps

```bash
# Copy production to staging for all apps
./scripts/copy-env-to-staging.sh

# Or with force to overwrite
./scripts/copy-env-to-staging.sh --force
```

## Variable Sources

The scripts read variables from multiple sources:

1. **Environment Variables** - `$DATABASE_URL`
2. **.env.local** - `apps/m-marketplace/.env.local`
3. **.env** - `apps/m-marketplace/.env`
4. **Variable Files** - `database_url.txt`, `stripe_key.txt`

### Using Variable Files

Create text files with variable values:

```bash
# Create files
echo "postgresql://..." > database_url.txt
echo "sk_live_..." > stripe_key.txt
echo "https://..." > sentry_dsn.txt

# Scripts will automatically read from these files
./scripts/setup-env.sh m-marketplace production
```

## Security Best Practices

### Protecting Secrets

- ✅ Never commit `.env.local` files
- ✅ Use Vercel's encrypted storage
- ✅ Rotate keys regularly
- ✅ Use different keys per environment
- ✅ Limit access to production variables

### Access Control

- ✅ Use team/organization scope
- ✅ Limit who can modify variables
- ✅ Review variable changes
- ✅ Use audit logs

## Troubleshooting

### Variable Not Found

```bash
# Check if variable exists
vercel env ls production | grep VARIABLE_NAME

# Check sources
cat apps/m-marketplace/.env.local | grep VARIABLE_NAME
echo $VARIABLE_NAME
```

### Copy Failed

```bash
# Check if project is linked
cd apps/m-marketplace
cat .vercel/project.json

# Verify login
vercel whoami

# Try manual copy
vercel env pull .env.production --environment=production
cat .env.production
```

### Variable Already Exists

```bash
# Use --force to overwrite
./scripts/copy-env-to-staging.sh --force

# Or remove first
vercel env rm VARIABLE_NAME preview --yes
vercel env add VARIABLE_NAME preview
```

## Script Options

### copy-env-to-staging.sh

```bash
# Options
--app=APP_NAME        # Copy for specific app only
--force              # Overwrite existing variables
--dry-run            # Preview changes without applying
```

### setup-env.sh

```bash
# Usage
./scripts/setup-env.sh <app-name> <environment>

# Examples
./scripts/setup-env.sh m-marketplace production
./scripts/setup-env.sh os-admin preview
```

## Support

For environment variable issues:
1. Check Vercel dashboard
2. Verify project linking
3. Review variable sources
4. Test with dry-run
5. Contact DevOps team
