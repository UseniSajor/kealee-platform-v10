#!/bin/bash

# Kealee Platform Agentic Framework Deployment Script
# Automates Phase 1 deployment with 5% canary rollout

set -e

echo "🚀 Agentic Framework Deployment"
echo "================================"
echo ""

# Configuration
GITHUB_REPO="${GITHUB_REPO:-.}"
RAILWAY_PROJECT="${RAILWAY_PROJECT:-kealee}"
RAILWAY_SERVICE_API="${RAILWAY_SERVICE_API:-api}"
RAILWAY_SERVICE_WORKER="${RAILWAY_SERVICE_WORKER:-worker}"
ROLLOUT_PERCENTAGE="${ROLLOUT_PERCENTAGE:-5}"

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Helper functions
log_info() { echo -e "${GREEN}✅${NC} $1"; }
log_warn() { echo -e "${YELLOW}⚠️${NC}  $1"; }
log_error() { echo -e "${RED}❌${NC} $1"; exit 1; }

# Phase 0: Pre-Flight Checks
echo "📋 Phase 0: Pre-Flight Checks"
echo "================================"
echo ""

# Check git status
if [[ -n $(git status -s) ]]; then
    log_error "Uncommitted changes detected. Commit all changes first."
fi
log_info "Git working directory clean"

# Check git branch
CURRENT_BRANCH=$(git rev-parse --abbrev-ref HEAD)
if [ "$CURRENT_BRANCH" != "main" ]; then
    log_warn "Current branch: $CURRENT_BRANCH (should be main)"
    read -p "Continue? (y/n) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
fi
log_info "On main branch"

# Check Prisma schema
if grep -q "model AgenticJobExecution" packages/database/prisma/schema.prisma; then
    log_info "Agentic models in schema"
else
    log_error "Agentic models not found in schema. Run: git pull origin main"
fi

# Check health endpoint code
if grep -q "getWorkerHealth" services/worker/src/index.ts; then
    log_info "Worker health monitoring in place"
else
    log_warn "Worker health monitoring not found"
fi

echo ""

# Phase 1: API Health Check
echo "🔍 Phase 1: Pre-Deploy Health Check"
echo "================================"
echo ""

log_info "Checking current production health..."

# Try to hit health endpoint
if curl -sf https://api.kealee.com/health > /dev/null 2>&1; then
    log_info "Production API healthy"
else
    log_warn "Could not reach production API"
fi

echo ""

# Phase 2: Deploy Code
echo "🚀 Phase 2: Deployment"
echo "================================"
echo ""

log_info "Pushing code to main branch..."
echo "Command: git push origin main"
echo ""
read -p "Ready to deploy? (y/n) " -n 1 -r
echo

if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    log_warn "Deployment cancelled"
    exit 0
fi

# Push code
if git push origin main; then
    log_info "Code pushed to main"
else
    log_error "Git push failed"
fi

echo ""
log_warn "Waiting 30 seconds for Railway to detect push..."
sleep 30

echo ""
log_info "Deployment started in Railway"
echo "Watch logs at: https://railway.app"
echo ""
log_warn "Waiting 2 minutes for services to start..."
sleep 120

echo ""

# Phase 3: Post-Deploy Verification
echo "✅ Phase 3: Post-Deploy Verification"
echo "================================"
echo ""

# Check health endpoint
log_info "Checking API health..."
MAX_RETRIES=5
RETRY=0
while [ $RETRY -lt $MAX_RETRIES ]; do
    if curl -sf https://api.kealee.com/health > /dev/null 2>&1; then
        log_info "API responding"
        break
    fi
    RETRY=$((RETRY + 1))
    if [ $RETRY -lt $MAX_RETRIES ]; then
        log_warn "Retry $RETRY/$MAX_RETRIES..."
        sleep 10
    fi
done

if [ $RETRY -eq $MAX_RETRIES ]; then
    log_error "API not responding after deployment"
fi

# Check agentic health
log_info "Checking agentic framework health..."
if curl -sf https://api.kealee.com/api/agentic-bots/health > /dev/null 2>&1; then
    log_info "Agentic framework ready"
else
    log_warn "Agentic health endpoint not responding"
fi

echo ""

# Phase 4: Enable Canary Rollout
echo "🎯 Phase 4: Enable Canary Rollout ($ROLLOUT_PERCENTAGE%)"
echo "================================"
echo ""

log_info "Manual step required:"
echo ""
echo "1. Go to: https://railway.app"
echo "2. Select project: $RAILWAY_PROJECT"
echo "3. Select environment: production"
echo "4. Click 'Variables'"
echo "5. Find: AGENTIC_DESIGN_BOT_ROLLOUT_PERCENTAGE"
echo "6. Change value from 0 to $ROLLOUT_PERCENTAGE"
echo "7. Click 'Save'"
echo ""
echo "After saving (no redeploy needed):"
echo "  - $ROLLOUT_PERCENTAGE% of design bot orders → agentic system"
echo "  - $((100 - ROLLOUT_PERCENTAGE))% → legacy system (safety net)"
echo ""
read -p "Canary enabled in Railway? (y/n) " -n 1 -r
echo

if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    log_warn "Canary not enabled. Skipping verification."
    exit 0
fi

echo ""

# Phase 5: Verify Canary
echo "📊 Phase 5: Verify Canary Rollout"
echo "================================"
echo ""

log_info "Checking queue stats..."
if STATS=$(curl -s https://api.kealee.com/api/agentic-bots/stats 2>/dev/null); then
    log_info "Queue stats:"
    echo "$STATS" | grep -E '"(queueSize|activeJobs|rolloutPercentage)"' || true
else
    log_warn "Could not fetch queue stats"
fi

echo ""
log_info "Checking Sentry..."
echo "Go to: https://sentry.io/organizations/your-org/issues/"
echo "Expected: First agentic job executions appearing"
echo ""

echo ""

# Phase 6: Summary
echo "=========================================="
echo "✅ Deployment Complete!"
echo "=========================================="
echo ""
echo "Next steps:"
echo ""
echo "1. Monitor for 24 hours:"
echo "   - Hourly: check error rate <1%"
echo "   - Hourly: check queue size <20"
echo "   - Hourly: verify no failed jobs"
echo ""
echo "2. View metrics:"
echo "   curl https://api.kealee.com/api/agentic-bots/health"
echo ""
echo "3. View Sentry errors:"
echo "   https://sentry.io"
echo ""
echo "4. After 24h of stability, scale rollout:"
echo "   AGENTIC_DESIGN_BOT_ROLLOUT_PERCENTAGE=10"
echo ""
echo "Timeline: $ROLLOUT_PERCENTAGE% → 10% → 25% → 50% → 100%"
echo ""
