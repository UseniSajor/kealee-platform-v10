# Vercel Setup Guide

Complete guide for setting up Vercel CLI and configuring environment variables.

## Quick Start

### 1. Setup Vercel CLI

```bash
# Automated setup (recommended)
./scripts/setup-vercel-cli.sh

# Or manual setup
npm install -g vercel@latest
vercel login
```

### 2. Link Projects

```bash
# Automated linking (recommended)
./scripts/link-vercel-projects.sh

# Or via full setup script
./scripts/setup-vercel-cli.sh

# Or manual
cd apps/m-marketplace
vercel link
```

### 3. Set Environment Variables

```bash
# Single app
./scripts/setup-env.sh m-marketplace production

# All apps
./scripts/setup-env-all.sh production
```

## Detailed Setup

### Step 1: Install Vercel CLI

```bash
# Install globally
npm install -g vercel@latest

# Verify installation
vercel --version
```

### Step 2: Login to Vercel

```bash
# Login interactively
vercel login

# Verify login
vercel whoami
```

### Step 3: Link Projects

#### Automated Linking (Recommended)

```bash
# Link all projects at once
./scripts/link-vercel-projects.sh
```

This script will:
- ✅ Check if logged in to Vercel (login if needed)
- ✅ Link each app to its Vercel project
- ✅ Skip already linked projects (with option to relink)
- ✅ Provide summary of linked projects

#### Manual Linking

For each application, link it to a Vercel project:

```bash
# Navigate to app
cd apps/m-marketplace

# Link project
vercel link

# Follow prompts:
# - Select scope (team/personal)
# - Select/create project
# - Confirm settings
```

Or link all at once:

```bash
for app in m-marketplace os-admin os-pm m-ops-services m-project-owner m-architect m-permits-inspections; do
  cd apps/$app
  vercel link
  cd ../..
done
```

### Step 4: Set Environment Variables

#### Method 1: Using Setup Script (Recommended)

```bash
# Single app
./scripts/setup-env.sh m-marketplace production

# All apps
./scripts/setup-env-all.sh production
```

#### Method 2: Manual Setup

```bash
# Navigate to app
cd apps/m-marketplace

# Set individual variables
vercel env add DATABASE_URL production
# Paste value when prompted

# Or from file
vercel env add DATABASE_URL production < database_url.txt
```

#### Method 3: Using Vercel Dashboard

1. Go to Vercel dashboard
2. Select project
3. Go to Settings → Environment Variables
4. Add variables for each environment

## Environment Variables

### Common Variables (All Apps)

```bash
DATABASE_URL=postgresql://...
SUPABASE_URL=https://...
SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...
STRIPE_SECRET_KEY=sk_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_PUBLISHABLE_KEY=pk_...
SENTRY_DSN=https://...
SENTRY_AUTH_TOKEN=...
NEXT_PUBLIC_API_URL=https://api.kealee.com
NEXT_PUBLIC_APP_URL=https://...
NODE_ENV=production
```

### App-Specific Variables

#### m-marketplace
```bash
NEXT_PUBLIC_MAPBOX_TOKEN=pk...
```

#### m-ops-services
```bash
STRIPE_PRICE_PACKAGE_A=price_...
STRIPE_PRICE_PACKAGE_B=price_...
STRIPE_PRICE_PACKAGE_C=price_...
STRIPE_PRICE_PACKAGE_D=price_...
```

#### m-architect
```bash
S3_ACCESS_KEY_ID=...
S3_SECRET_ACCESS_KEY=...
S3_BUCKET_NAME=...
S3_REGION=us-east-1
```

#### m-permits-inspections
```bash
NEXT_PUBLIC_MAPBOX_TOKEN=pk...
```

## Setup Scripts

### setup-vercel-cli.sh

Automates Vercel CLI installation and project linking:

```bash
./scripts/setup-vercel-cli.sh
```

**What it does:**
1. ✅ Installs Vercel CLI (if not installed)
2. ✅ Checks/login to Vercel
3. ✅ Links all projects to Vercel

### setup-env.sh

Sets environment variables for a single app:

```bash
./scripts/setup-env.sh <app-name> <environment>
```

**Examples:**
```bash
./scripts/setup-env.sh m-marketplace production
./scripts/setup-env.sh os-admin preview
./scripts/setup-env.sh m-ops-services development
```

**What it does:**
1. ✅ Validates app and environment
2. ✅ Links project if not linked
3. ✅ Reads variables from .env.local or .env
4. ✅ Sets variables in Vercel
5. ✅ Reports summary

### setup-env-all.sh

Sets environment variables for all apps:

```bash
./scripts/setup-env-all.sh <environment>
```

**Examples:**
```bash
# Set production variables for all apps
./scripts/setup-env-all.sh production

# Set staging variables for all apps
./scripts/setup-env-all.sh preview
```

## Environment Variable Sources

The setup scripts look for variables in this order:

1. **Environment variables** - `$DATABASE_URL`
2. **.env.local file** - `apps/m-marketplace/.env.local`
3. **.env file** - `apps/m-marketplace/.env`
4. **Variable files** - `database_url.txt`, `stripe_key.txt`, etc.

### Using Variable Files

Create text files with variable values:

```bash
# database_url.txt
postgresql://user:password@host:port/database

# stripe_key.txt
sk_live_...

# sentry_dsn.txt
https://...@sentry.io/...
```

Then use with setup script or manually:

```bash
# Script will automatically read from files
./scripts/setup-env.sh m-marketplace production

# Or manually
vercel env add DATABASE_URL production < database_url.txt
```

## Verification

### Check Linked Projects

```bash
cd apps/m-marketplace
cat .vercel/project.json
```

### List Environment Variables

```bash
# Via CLI
cd apps/m-marketplace
vercel env ls

# Via Dashboard
# Go to project → Settings → Environment Variables
```

### Test Deployment

```bash
# Deploy to preview
cd apps/m-marketplace
vercel --prod=false

# Check deployment
vercel ls
```

## Troubleshooting

### Vercel CLI Not Found

```bash
# Install globally
npm install -g vercel@latest

# Or use npx
npx vercel@latest
```

### Not Logged In

```bash
# Login
vercel login

# Verify
vercel whoami
```

### Project Not Linked

```bash
# Link project
cd apps/m-marketplace
vercel link

# Or use setup script
./scripts/setup-vercel-cli.sh
```

### Environment Variables Not Set

1. **Check variable sources:**
   ```bash
   # Check .env.local
   cat apps/m-marketplace/.env.local
   
   # Check environment
   echo $DATABASE_URL
   ```

2. **Set manually:**
   ```bash
   cd apps/m-marketplace
   vercel env add VARIABLE_NAME production
   ```

3. **Verify:**
   ```bash
   vercel env ls
   ```

### Variable Already Exists

If a variable already exists, the script will skip it. To update:

```bash
# Remove existing
vercel env rm VARIABLE_NAME production

# Add new value
vercel env add VARIABLE_NAME production
```

## Best Practices

1. **Use setup scripts** - Automates the process
2. **Store secrets securely** - Don't commit .env files
3. **Use different values per environment** - production, preview, development
4. **Verify after setup** - Check variables are set correctly
5. **Document changes** - Keep track of variable updates

## Security

### Protecting Secrets

- ✅ Never commit `.env.local` files
- ✅ Use Vercel's environment variable encryption
- ✅ Rotate keys regularly
- ✅ Use different keys for staging/production
- ✅ Limit access to production variables

### Access Control

- ✅ Use team/organization scope
- ✅ Limit who can modify production variables
- ✅ Review variable changes
- ✅ Use audit logs

## Support

For setup issues:
1. Check Vercel CLI version: `vercel --version`
2. Verify login: `vercel whoami`
3. Check project linking: `cat .vercel/project.json`
4. Review Vercel dashboard
5. Contact DevOps team
