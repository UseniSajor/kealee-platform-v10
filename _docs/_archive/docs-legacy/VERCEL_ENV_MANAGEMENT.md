# Vercel Environment Variables Management

Complete guide for managing environment variables in Vercel deployments.

## Quick Commands

```bash
# List environment variables
vercel env ls m-marketplace --token=$VERCEL_TOKEN

# Add environment variable
vercel env add VARIABLE_NAME production "value" --token=$VERCEL_TOKEN

# Remove environment variable
vercel env rm VARIABLE_NAME production --token=$VERCEL_TOKEN --yes

# Pull environment variables
cd apps/m-marketplace
vercel env pull .env.production --environment=production
```

## Interactive Management

```bash
# Use the management script
./scripts/manage-vercel-env.sh

# Or PowerShell
.\scripts\manage-vercel-env.ps1
```

## Listing Environment Variables

### List for Specific App

```bash
# Production environment
vercel env ls m-marketplace --environment=production --token=$VERCEL_TOKEN

# Preview environment
vercel env ls m-marketplace --environment=preview --token=$VERCEL_TOKEN

# Development environment
vercel env ls m-marketplace --environment=development --token=$VERCEL_TOKEN
```

### List All Environments

```bash
# All environments for an app
vercel env ls m-marketplace --token=$VERCEL_TOKEN
```

### List for All Apps

```bash
# Use the management script
./scripts/manage-vercel-env.sh
# Select option 5: List all apps' variables
```

## Adding Environment Variables

### Add to Production

```bash
# Add with value
vercel env add DATABASE_URL production "postgresql://..." --token=$VERCEL_TOKEN

# Add with interactive input
vercel env add STRIPE_SECRET_KEY production --token=$VERCEL_TOKEN
# Enter value when prompted
```

### Add to Preview/Staging

```bash
vercel env add DATABASE_URL preview "postgresql://..." --token=$VERCEL_TOKEN
```

### Add to Development

```bash
vercel env add DATABASE_URL development "postgresql://..." --token=$VERCEL_TOKEN
```

### Add to Multiple Environments

```bash
# Add to all environments
for env in production preview development; do
    vercel env add VARIABLE_NAME $env "value" --token=$VERCEL_TOKEN
done
```

## Removing Environment Variables

### Remove from Production

```bash
vercel env rm VARIABLE_NAME production --token=$VERCEL_TOKEN --yes
```

### Remove from All Environments

```bash
for env in production preview development; do
    vercel env rm VARIABLE_NAME $env --token=$VERCEL_TOKEN --yes
done
```

## Pulling Environment Variables

### Pull to Local File

```bash
# Navigate to app directory
cd apps/m-marketplace

# Pull production variables
vercel env pull .env.production --environment=production

# Pull preview variables
vercel env pull .env.preview --environment=preview

# Pull development variables
vercel env pull .env.development --environment=development
```

### Pull All Environments

```bash
cd apps/m-marketplace
for env in production preview development; do
    vercel env pull ".env.$env" --environment=$env
done
```

## Environment Variable Types

### Plain Text

```bash
vercel env add API_URL production "https://api.example.com" --token=$VERCEL_TOKEN
```

### Secrets (Encrypted)

```bash
# Secrets are automatically encrypted by Vercel
vercel env add DATABASE_URL production "postgresql://user:pass@host/db" --token=$VERCEL_TOKEN
```

### JSON Values

```bash
# For complex values, use quotes
vercel env add CONFIG production '{"key":"value"}' --token=$VERCEL_TOKEN
```

## Common Environment Variables

### Database

```bash
vercel env add DATABASE_URL production "postgresql://..." --token=$VERCEL_TOKEN
```

### Authentication

```bash
vercel env add NEXTAUTH_SECRET production "your-secret" --token=$VERCEL_TOKEN
vercel env add NEXTAUTH_URL production "https://app.example.com" --token=$VERCEL_TOKEN
```

### Stripe

```bash
vercel env add STRIPE_SECRET_KEY production "sk_live_..." --token=$VERCEL_TOKEN
vercel env add NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY production "pk_live_..." --token=$VERCEL_TOKEN
```

### Monitoring

```bash
vercel env add SENTRY_DSN production "https://..." --token=$VERCEL_TOKEN
vercel env add NEXT_PUBLIC_SENTRY_DSN production "https://..." --token=$VERCEL_TOKEN
vercel env add DATADOG_API_KEY production "..." --token=$VERCEL_TOKEN
```

## Bulk Operations

### Add Multiple Variables from File

```bash
# Create variables file
cat > vars.txt << EOF
DATABASE_URL=postgresql://...
STRIPE_SECRET_KEY=sk_live_...
NEXTAUTH_SECRET=...
EOF

# Add each variable
while IFS='=' read -r key value; do
    echo "$value" | vercel env add "$key" production --token=$VERCEL_TOKEN
done < vars.txt
```

### Copy from Production to Preview

```bash
# List production variables
vercel env ls m-marketplace --environment=production --token=$VERCEL_TOKEN > prod-vars.txt

# Add to preview (manual process)
# Use the management script for easier bulk operations
```

### Sync from Local .env File

```bash
cd apps/m-marketplace

# Load .env.local and add to Vercel
while IFS='=' read -r key value; do
    # Skip comments and empty lines
    [[ $key =~ ^#.*$ ]] && continue
    [[ -z $key ]] && continue
    
    echo "$value" | vercel env add "$key" production --token=$VERCEL_TOKEN
done < .env.local
```

## Best Practices

### 1. Use Environment-Specific Values

```bash
# Production
vercel env add API_URL production "https://api.kealee.com" --token=$VERCEL_TOKEN

# Preview/Staging
vercel env add API_URL preview "https://api-staging.kealee.com" --token=$VERCEL_TOKEN

# Development
vercel env add API_URL development "http://localhost:3000" --token=$VERCEL_TOKEN
```

### 2. Secure Sensitive Values

- Never commit `.env` files to git
- Use Vercel's encrypted storage for secrets
- Rotate secrets regularly
- Use different secrets per environment

### 3. Document Required Variables

Create a `.env.example` file documenting required variables:

```bash
# .env.example
DATABASE_URL=postgresql://user:pass@host:port/db
STRIPE_SECRET_KEY=sk_test_...
NEXTAUTH_SECRET=your-secret-here
```

### 4. Verify After Changes

```bash
# List variables to verify
vercel env ls m-marketplace --environment=production --token=$VERCEL_TOKEN

# Test deployment
vercel deploy --prod --token=$VERCEL_TOKEN
```

## Troubleshooting

### Variables Not Available

```bash
# Check if variable exists
vercel env ls m-marketplace --environment=production --token=$VERCEL_TOKEN | grep VARIABLE_NAME

# Verify environment
vercel env ls m-marketplace --token=$VERCEL_TOKEN

# Redeploy to pick up new variables
vercel deploy --prod --token=$VERCEL_TOKEN
```

### Wrong Environment

```bash
# Check current environment
vercel env ls m-marketplace --token=$VERCEL_TOKEN

# Add to correct environment
vercel env add VARIABLE_NAME production "value" --token=$VERCEL_TOKEN
```

### Permission Issues

```bash
# Verify authentication
vercel whoami

# Check token
echo $VERCEL_TOKEN

# Re-authenticate if needed
vercel login
```

## Automation Scripts

### Setup All Environment Variables

```bash
# Use the setup script
./scripts/setup-env-all.sh production

# Or for specific app
./scripts/setup-env.sh m-marketplace production
```

### Copy Production to Staging

```bash
./scripts/copy-env-to-staging.sh
```

## Additional Resources

- [Vercel Environment Variables Docs](https://vercel.com/docs/concepts/projects/environment-variables)
- [Vercel CLI Reference](https://vercel.com/docs/cli)
- [Environment Variables Best Practices](https://vercel.com/docs/concepts/projects/environment-variables#best-practices)
