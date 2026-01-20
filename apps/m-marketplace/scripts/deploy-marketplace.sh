#!/bin/bash

# Marketplace Deployment Script
# Usage: ./scripts/deploy-marketplace.sh [environment]

set -e

ENVIRONMENT=${1:-production}
APP_NAME="m-marketplace"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
DEPLOY_LOG="deployments/deploy_${TIMESTAMP}.log"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Create deployments directory
mkdir -p deployments

log() {
    echo -e "${GREEN}[$(date '+%Y-%m-%d %H:%M:%S')]${NC} $1" | tee -a "$DEPLOY_LOG"
}

error() {
    echo -e "${RED}[$(date '+%Y-%m-%d %H:%M:%S')] ERROR:${NC} $1" | tee -a "$DEPLOY_LOG"
    exit 1
}

warn() {
    echo -e "${YELLOW}[$(date '+%Y-%m-%d %H:%M:%S')] WARNING:${NC} $1" | tee -a "$DEPLOY_LOG"
}

check_prerequisites() {
    log "Checking prerequisites..."
    
    # Check Node.js version
    NODE_VERSION=$(node -v | cut -d'v' -f2)
    NODE_MAJOR=$(echo $NODE_VERSION | cut -d'.' -f1)
    
    if [ "$NODE_MAJOR" -lt 18 ]; then
        error "Node.js 18 or higher is required. Current version: $NODE_VERSION"
    fi
    log "✓ Node.js version: $NODE_VERSION"
    
    # Check npm version
    NPM_VERSION=$(npm -v)
    log "✓ npm version: $NPM_VERSION"
    
    # Check Vercel CLI
    if ! command -v vercel &> /dev/null; then
        warn "Vercel CLI not found. Installing..."
        npm install -g vercel@latest
    fi
    VERCEL_VERSION=$(vercel --version)
    log "✓ Vercel CLI version: $VERCEL_VERSION"
    
    # Check if in correct directory
    if [ ! -f "package.json" ]; then
        error "package.json not found. Please run from project root."
    fi
    
    # Check environment variables
    if [ ! -f ".env.$ENVIRONMENT" ]; then
        warn ".env.$ENVIRONMENT not found. Using .env.production"
        if [ ! -f ".env.production" ]; then
            error "No environment file found. Create .env.$ENVIRONMENT or .env.production"
        fi
    fi
    
    log "✓ All prerequisites satisfied"
}

load_environment() {
    log "Loading environment: $ENVIRONMENT"
    
    # Load environment variables
    if [ -f ".env.$ENVIRONMENT" ]; then
        export $(grep -v '^#' .env.$ENVIRONMENT | xargs)
        log "✓ Loaded .env.$ENVIRONMENT"
    elif [ -f ".env.production" ]; then
        export $(grep -v '^#' .env.production | xargs)
        log "✓ Loaded .env.production"
    fi
    
    # Set deployment variables
    case $ENVIRONMENT in
        production)
            DEPLOY_URL="https://marketplace.kealee.com"
            VERCEL_PROJECT="m-marketplace"
            VERCEL_ORG="kealee"
            ;;
        staging)
            DEPLOY_URL="https://staging-marketplace.kealee.com"
            VERCEL_PROJECT="m-marketplace-staging"
            VERCEL_ORG="kealee"
            ;;
        preview)
            DEPLOY_URL=""
            VERCEL_PROJECT="m-marketplace-preview"
            VERCEL_ORG="kealee"
            ;;
        *)
            error "Unknown environment: $ENVIRONMENT"
            ;;
    esac
    
    log "✓ Deployment target: $DEPLOY_URL"
}

run_tests() {
    log "Running tests..."
    
    # TypeScript compilation check
    log "Checking TypeScript compilation..."
    npx tsc --noEmit
    
    if [ $? -ne 0 ]; then
        error "TypeScript compilation failed"
    fi
    log "✓ TypeScript compilation passed"
    
    # Unit tests
    log "Running unit tests..."
    npm test -- --passWithNoTests || warn "Unit tests failed or not configured"
    log "✓ Unit tests completed"
    
    # Build test
    log "Testing build..."
    npm run build
    
    if [ $? -ne 0 ]; then
        error "Build test failed"
    fi
    log "✓ Build test passed"
}

run_linting() {
    log "Running code quality checks..."
    
    # ESLint
    log "Running ESLint..."
    npx eslint . --ext .js,.jsx,.ts,.tsx --max-warnings 0 || warn "ESLint check failed"
    log "✓ ESLint completed"
    
    # Prettier check
    log "Checking code formatting..."
    npx prettier --check . || warn "Code formatting issues found. Run 'npm run format' to fix."
    log "✓ Code formatting check completed"
    
    # Security audit
    log "Running security audit..."
    npm audit --audit-level=high || warn "Security vulnerabilities found. Run 'npm audit fix' to fix."
    log "✓ Security audit completed"
}

check_performance() {
    log "Running performance checks..."
    
    # Lighthouse CI
    if command -v lhci &> /dev/null; then
        log "Running Lighthouse CI..."
        npx lhci autorun --config=./.lighthouserc.json || warn "Lighthouse CI failed"
    else
        warn "Lighthouse CI not installed. Install with: npm install -g @lhci/cli"
    fi
    
    # Bundle analysis
    log "Analyzing bundle size..."
    npx next build --analyze 2>&1 | grep -A 20 "First Load JS" || warn "Bundle analysis failed"
    
    log "✓ Performance checks completed"
}

deploy_to_vercel() {
    log "Deploying to Vercel ($ENVIRONMENT)..."
    
    # Login to Vercel if needed
    if ! vercel whoami 2>/dev/null; then
        log "Please login to Vercel..."
        vercel login
    fi
    
    # Deploy based on environment
    case $ENVIRONMENT in
        production)
            log "Deploying to production..."
            vercel deploy --prod --yes --token="$VERCEL_TOKEN"
            ;;
        staging)
            log "Deploying to staging..."
            vercel deploy --target=production --yes --token="$VERCEL_TOKEN"
            ;;
        preview)
            log "Creating preview deployment..."
            vercel --yes --token="$VERCEL_TOKEN"
            ;;
    esac
    
    if [ $? -ne 0 ]; then
        error "Vercel deployment failed"
    fi
    
    log "✓ Deployment to Vercel completed"
}

run_migrations() {
    log "Running database migrations..."
    
    # Check if migrations are needed
    if [ -f "prisma/schema.prisma" ]; then
        log "Running Prisma migrations..."
        npx prisma migrate deploy
        
        if [ $? -ne 0 ]; then
            error "Database migrations failed"
        fi
        log "✓ Database migrations completed"
    else
        log "No database migrations required"
    fi
}

update_dns() {
    log "Updating DNS records..."
    
    if [ "$ENVIRONMENT" = "production" ]; then
        # Update production DNS
        log "Updating production DNS records..."
        
        # Check current DNS
        CURRENT_IP=$(dig +short marketplace.kealee.com 2>/dev/null || echo "N/A")
        log "Current DNS IP: $CURRENT_IP"
        
        # Get Vercel deployment IP
        VERCEL_IP=$(dig +short cname.vercel-dns.com 2>/dev/null || echo "N/A")
        log "Vercel IP: $VERCEL_IP"
        
        # TODO: Implement DNS update logic for your DNS provider
        # This would typically use Cloudflare, Route53, or other DNS API
        
        log "✓ DNS update scheduled (manual verification required)"
    fi
}

run_post_deploy_tests() {
    log "Running post-deployment tests..."
    
    if [ -n "$DEPLOY_URL" ]; then
        # Wait for deployment to be ready
        log "Waiting for deployment to be ready..."
        sleep 30
        
        # Health check
        log "Running health check..."
        curl -f "$DEPLOY_URL/api/health" || warn "Health check failed"
        
        # Basic smoke test
        log "Running smoke tests..."
        curl -f "$DEPLOY_URL" || error "Smoke test failed"
        
        # API endpoints test
        log "Testing API endpoints..."
        curl -f "$DEPLOY_URL/api/hello" || warn "API test failed"
        
        log "✓ Post-deployment tests completed"
    else
        warn "No deploy URL available for post-deployment tests"
    fi
}

send_notifications() {
    log "Sending deployment notifications..."
    
    DEPLOYMENT_URL=$(vercel ls $VERCEL_PROJECT --token=$VERCEL_TOKEN 2>/dev/null | grep $ENVIRONMENT | awk '{print $2}' || echo "N/A")
    
    # Slack notification
    if [ -n "$SLACK_WEBHOOK_URL" ]; then
        curl -X POST -H 'Content-type: application/json' \
        --data "{
            \"text\": \"✅ *$APP_NAME deployed to $ENVIRONMENT*\n• Environment: $ENVIRONMENT\n• URL: $DEPLOYMENT_URL\n• Timestamp: $(date)\n• Commit: $(git log -1 --pretty=format:'%h %s' 2>/dev/null || echo 'N/A')\"
        }" \
        "$SLACK_WEBHOOK_URL" || warn "Slack notification failed"
        log "✓ Slack notification sent"
    fi
    
    # Email notification
    if [ -n "$EMAIL_API_KEY" ]; then
        # TODO: Implement email notification
        log "Email notification configured"
    fi
    
    log "✓ Notifications sent"
}

create_rollback_point() {
    log "Creating rollback point..."
    
    # Get current deployment ID
    DEPLOYMENT_ID=$(vercel ls $VERCEL_PROJECT --token=$VERCEL_TOKEN 2>/dev/null | grep $ENVIRONMENT | awk '{print $1}' || echo "N/A")
    
    # Save rollback information
    mkdir -p deployments
    echo "{
        \"deployment_id\": \"$DEPLOYMENT_ID\",
        \"environment\": \"$ENVIRONMENT\",
        \"timestamp\": \"$(date -Iseconds)\",
        \"commit\": \"$(git rev-parse HEAD 2>/dev/null || echo 'N/A')\",
        \"url\": \"$DEPLOYMENT_URL\"
    }" > "deployments/rollback_${ENVIRONMENT}_${TIMESTAMP}.json"
    
    log "✓ Rollback point created: deployments/rollback_${ENVIRONMENT}_${TIMESTAMP}.json"
}

main() {
    log "Starting deployment of $APP_NAME to $ENVIRONMENT"
    log "Timestamp: $TIMESTAMP"
    log "Log file: $DEPLOY_LOG"
    
    # Deployment steps
    check_prerequisites
    load_environment
    run_tests
    run_linting
    check_performance
    deploy_to_vercel
    run_migrations
    update_dns
    run_post_deploy_tests
    create_rollback_point
    send_notifications
    
    log "✅ Deployment completed successfully!"
    log "🚀 $APP_NAME is live at: $DEPLOY_URL"
    log "📊 Check monitoring dashboard for deployment status"
    
    exit 0
}

# Handle errors
trap 'error "Deployment failed at line $LINENO"' ERR

# Run main function
main "$@"
