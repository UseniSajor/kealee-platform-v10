# Marketplace Deployment Scripts

This directory contains deployment scripts for the m-marketplace application.

## Scripts

### `deploy-marketplace.sh` (Bash/Linux/macOS)
Main deployment script for Unix-like systems.

**Usage:**
```bash
# Deploy to production (default)
./scripts/deploy-marketplace.sh
# or
./scripts/deploy-marketplace.sh production

# Deploy to staging
./scripts/deploy-marketplace.sh staging

# Deploy to preview
./scripts/deploy-marketplace.sh preview
```

**Or using npm:**
```bash
npm run deploy              # Production
npm run deploy:production   # Production
npm run deploy:staging      # Staging
npm run deploy:preview      # Preview
```

### `deploy-marketplace.ps1` (PowerShell/Windows)
PowerShell version of the deployment script for Windows systems.

**Usage:**
```powershell
# Deploy to production (default)
.\scripts\deploy-marketplace.ps1
# or
.\scripts\deploy-marketplace.ps1 -Environment production

# Deploy to staging
.\scripts\deploy-marketplace.ps1 -Environment staging

# Deploy to preview
.\scripts\deploy-marketplace.ps1 -Environment preview
```

### `rollback.sh` (Bash/Linux/macOS)
Rollback script to revert to a previous deployment.

**Usage:**
```bash
# Rollback to most recent rollback point
./scripts/rollback.sh production

# Rollback to specific deployment
./scripts/rollback.sh production <deployment-id>
```

**Or using npm:**
```bash
npm run rollback production
```

## Prerequisites

1. **Node.js 18+** - Required for building the application
2. **Vercel CLI** - Will be installed automatically if not present
3. **Environment Variables** - Set in `.env.production`, `.env.staging`, or `.env.preview`
4. **Vercel Token** - Set as `VERCEL_TOKEN` environment variable

## Environment Variables

Required environment variables:

- `VERCEL_TOKEN` - Vercel API token for deployment
- `SLACK_WEBHOOK_URL` (optional) - Slack webhook for deployment notifications
- `EMAIL_API_KEY` (optional) - Email API key for email notifications

## Deployment Process

The deployment script performs the following steps:

1. **Prerequisites Check** - Verifies Node.js, npm, and Vercel CLI
2. **Environment Loading** - Loads environment-specific variables
3. **Tests** - Runs TypeScript compilation and build tests
4. **Linting** - Runs ESLint and security audits
5. **Performance Checks** - Runs Lighthouse CI and bundle analysis
6. **Deployment** - Deploys to Vercel
7. **Migrations** - Runs database migrations (if applicable)
8. **DNS Update** - Updates DNS records (production only)
9. **Post-Deploy Tests** - Runs health checks and smoke tests
10. **Rollback Point** - Creates a rollback point for easy reversion
11. **Notifications** - Sends deployment notifications

## Rollback Points

Rollback points are automatically created in the `deployments/` directory with the format:
```
rollback_<environment>_<timestamp>.json
```

Each rollback point contains:
- Deployment ID
- Environment
- Timestamp
- Git commit hash
- Deployment URL

## Logs

Deployment logs are saved in the `deployments/` directory with the format:
```
deploy_<timestamp>.log
```

## Troubleshooting

### Vercel CLI Not Found
```bash
npm install -g vercel@latest
```

### TypeScript Compilation Errors
Fix TypeScript errors before deploying:
```bash
npx tsc --noEmit
```

### Build Failures
Test the build locally:
```bash
npm run build
```

### Deployment Failures
Check the deployment log:
```bash
cat deployments/deploy_<timestamp>.log
```

## CI/CD Integration

These scripts can be integrated into CI/CD pipelines:

### GitHub Actions Example
```yaml
name: Deploy Marketplace
on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: npm ci
      - run: npm run deploy:production
        env:
          VERCEL_TOKEN: ${{ secrets.VERCEL_TOKEN }}
          SLACK_WEBHOOK_URL: ${{ secrets.SLACK_WEBHOOK_URL }}
```

## Security Notes

- Never commit `.env` files to version control
- Store sensitive tokens in CI/CD secrets
- Review deployment logs for sensitive information
- Use environment-specific configurations

## Support

For issues or questions, contact the development team or check the main project documentation.
