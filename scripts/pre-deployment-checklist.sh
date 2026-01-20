#!/bin/bash
# scripts/pre-deployment-checklist.sh
# Pre-deployment validation checklist

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Counters
PASSED=0
FAILED=0
WARNINGS=0
SKIPPED=0

log() {
    echo -e "${BLUE}[CHECK]${NC} $1"
}

pass() {
    echo -e "${GREEN}✅${NC} $1"
    PASSED=$((PASSED + 1))
}

fail() {
    echo -e "${RED}❌${NC} $1"
    FAILED=$((FAILED + 1))
}

warn() {
    echo -e "${YELLOW}⚠️${NC} $1"
    WARNINGS=$((WARNINGS + 1))
}

skip() {
    echo -e "${YELLOW}⏭️${NC} $1"
    SKIPPED=$((SKIPPED + 1))
}

echo "🔍 Pre-Deployment Checklist"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# 1. Code Quality Checks
echo "1. Code Quality"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# 1.1 All tests passing
log "1.1 Checking tests..."
if [ -f "package.json" ]; then
    if grep -q "\"test\"" package.json; then
        if pnpm test --run 2>/dev/null | grep -q "passed\|PASS"; then
            pass "All tests passing"
        else
            fail "Some tests failing"
        fi
    else
        skip "No test script found"
    fi
else
    skip "No package.json found (not in root?)"
fi

# 1.2 Linting passes
log "1.2 Checking linting..."
if command -v pnpm &> /dev/null; then
    if pnpm lint 2>&1 | grep -q "error\|Error" && ! pnpm lint 2>&1 | grep -q "No lint errors"; then
        fail "Linting errors found"
    else
        pass "Linting passes"
    fi
else
    warn "pnpm not found, skipping lint check"
fi

# 1.3 Type checking
log "1.3 Checking TypeScript..."
if command -v pnpm &> /dev/null; then
    if pnpm exec tsc --noEmit 2>&1 | grep -q "error TS"; then
        fail "TypeScript errors found"
    else
        pass "Type checking passes"
    fi
else
    warn "pnpm not found, skipping type check"
fi

# 1.4 No console errors (basic check)
log "1.4 Checking for console errors..."
if find . -name "*.ts" -o -name "*.tsx" -o -name "*.js" -o -name "*.jsx" | xargs grep -l "console.error\|console.warn" 2>/dev/null | head -5 | grep -q .; then
    warn "Console errors/warnings found (review manually)"
else
    pass "No obvious console errors"
fi

# 2. Environment Variables
echo ""
echo "2. Environment Variables"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# 2.1 Required env vars
log "2.1 Checking required environment variables..."
REQUIRED_VARS=("DATABASE_URL" "SUPABASE_URL" "SUPABASE_ANON_KEY")
MISSING_VARS=()

for var in "${REQUIRED_VARS[@]}"; do
    if [ -z "${!var}" ] && ! grep -q "$var" .env.local 2>/dev/null && ! grep -q "$var" .env 2>/dev/null; then
        MISSING_VARS+=("$var")
    fi
done

if [ ${#MISSING_VARS[@]} -eq 0 ]; then
    pass "Required environment variables set"
else
    fail "Missing environment variables: ${MISSING_VARS[*]}"
fi

# 2.2 Database connection
log "2.2 Verifying database connection..."
if [ -n "$DATABASE_URL" ] || grep -q "DATABASE_URL" .env.local 2>/dev/null || grep -q "DATABASE_URL" .env 2>/dev/null; then
    if command -v psql &> /dev/null; then
        DB_URL=${DATABASE_URL:-$(grep DATABASE_URL .env.local 2>/dev/null | cut -d'=' -f2- | tr -d '"' || grep DATABASE_URL .env 2>/dev/null | cut -d'=' -f2- | tr -d '"')}
        if [ -n "$DB_URL" ]; then
            if psql "$DB_URL" -c "SELECT 1;" > /dev/null 2>&1; then
                pass "Database connection verified"
            else
                fail "Database connection failed"
            fi
        else
            warn "DATABASE_URL not accessible for testing"
        fi
    else
        skip "psql not found, skipping database connection test"
    fi
else
    fail "DATABASE_URL not set"
fi

# 2.3 API keys configured
log "2.3 Checking API keys..."
API_KEYS=("STRIPE_SECRET_KEY" "STRIPE_WEBHOOK_SECRET")
MISSING_KEYS=()

for key in "${API_KEYS[@]}"; do
    if [ -z "${!key}" ] && ! grep -q "$key" .env.local 2>/dev/null && ! grep -q "$key" .env 2>/dev/null; then
        MISSING_KEYS+=("$key")
    fi
done

if [ ${#MISSING_KEYS[@]} -eq 0 ]; then
    pass "API keys configured"
else
    warn "Some API keys may be missing: ${MISSING_KEYS[*]}"
fi

# 3. Database
echo ""
echo "3. Database"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# 3.1 Migrations reviewed
log "3.1 Checking migration status..."
if [ -d "packages/database/prisma/migrations" ]; then
    cd packages/database
    if command -v npx &> /dev/null; then
        MIGRATION_STATUS=$(npx prisma migrate status --schema=./prisma/schema.prisma 2>&1 || echo "error")
        if echo "$MIGRATION_STATUS" | grep -q "Database schema is up to date\|migrations pending"; then
            pass "Migration status checked"
        else
            warn "Migration status unclear"
        fi
    else
        skip "npx not found, skipping migration check"
    fi
    cd ../..
else
    skip "Migrations directory not found"
fi

# 3.2 Backup created
log "3.2 Checking for database backup..."
if [ -d "backups" ] && [ "$(ls -A backups/*.sql 2>/dev/null)" ]; then
    BACKUP_COUNT=$(ls -1 backups/*.sql 2>/dev/null | wc -l)
    LATEST_BACKUP=$(ls -t backups/*.sql 2>/dev/null | head -n1)
    if [ -n "$LATEST_BACKUP" ]; then
        BACKUP_AGE=$(( ($(date +%s) - $(stat -f %m "$LATEST_BACKUP" 2>/dev/null || stat -c %Y "$LATEST_BACKUP" 2>/dev/null)) / 3600 ))
        if [ $BACKUP_AGE -lt 24 ]; then
            pass "Recent backup found (${BACKUP_COUNT} backups, latest: ${BACKUP_AGE}h ago)"
        else
            warn "Backup exists but is old (${BACKUP_AGE}h ago)"
        fi
    else
        warn "Backup directory exists but no backups found"
    fi
else
    warn "No database backup found (recommended before deployment)"
fi

# 4. Dependencies
echo ""
echo "4. Dependencies"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# 4.1 All dependencies installed
log "4.1 Checking dependencies..."
if [ -f "pnpm-lock.yaml" ] || [ -f "package-lock.json" ]; then
    if [ -d "node_modules" ]; then
        pass "Dependencies installed"
    else
        fail "Dependencies not installed (run: pnpm install)"
    fi
else
    skip "No lock file found"
fi

# 4.2 Lock files committed
log "4.2 Checking lock files..."
if [ -f "pnpm-lock.yaml" ]; then
    if git ls-files --error-unmatch pnpm-lock.yaml > /dev/null 2>&1; then
        pass "Lock file committed"
    else
        warn "Lock file not committed"
    fi
else
    skip "No lock file found"
fi

# 4.3 Security vulnerabilities
log "4.3 Checking for security vulnerabilities..."
if command -v pnpm &> /dev/null; then
    if pnpm audit --audit-level=high 2>&1 | grep -q "found.*vulnerabilities"; then
        warn "Security vulnerabilities found (run: pnpm audit)"
    else
        pass "No high-severity vulnerabilities"
    fi
else
    skip "pnpm not found, skipping security audit"
fi

# 4.4 Build succeeds
log "4.4 Testing build..."
if command -v pnpm &> /dev/null; then
    if pnpm build 2>&1 | grep -q "error\|Error\|failed"; then
        fail "Build failed"
    else
        pass "Build succeeds"
    fi
else
    skip "pnpm not found, skipping build test"
fi

# 5. Git Status
echo ""
echo "5. Git Status"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# 5.1 Clean working directory
log "5.1 Checking git status..."
if [ -d ".git" ]; then
    if [ -z "$(git status --porcelain)" ]; then
        pass "Working directory clean"
    else
        warn "Uncommitted changes found"
        git status --short | head -5
    fi
else
    skip "Not a git repository"
fi

# 5.2 On correct branch
log "5.2 Checking current branch..."
if [ -d ".git" ]; then
    CURRENT_BRANCH=$(git branch --show-current)
    if [ "$CURRENT_BRANCH" = "main" ] || [ "$CURRENT_BRANCH" = "master" ]; then
        pass "On main/master branch"
    else
        warn "Not on main/master branch (current: $CURRENT_BRANCH)"
    fi
else
    skip "Not a git repository"
fi

# 5.3 Up to date with remote
log "5.3 Checking if up to date with remote..."
if [ -d ".git" ]; then
    git fetch -q 2>/dev/null || true
    LOCAL=$(git rev-parse @)
    REMOTE=$(git rev-parse @{u} 2>/dev/null || echo "")
    if [ -z "$REMOTE" ]; then
        skip "No remote tracking branch"
    elif [ "$LOCAL" = "$REMOTE" ]; then
        pass "Up to date with remote"
    else
        warn "Not up to date with remote (run: git pull)"
    fi
else
    skip "Not a git repository"
fi

# 6. Application-Specific Checks
echo ""
echo "6. Application-Specific Checks"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# 6.1 API service
log "6.1 Checking API service..."
if [ -d "services/api" ]; then
    if [ -f "services/api/package.json" ]; then
        pass "API service found"
    else
        fail "API service package.json missing"
    fi
else
    skip "API service not found"
fi

# 6.2 Frontend apps
log "6.2 Checking frontend applications..."
APPS=("apps/m-ops-services" "apps/os-admin" "apps/m-project-owner")
FOUND_APPS=0

for app in "${APPS[@]}"; do
    if [ -d "$app" ] && [ -f "$app/package.json" ]; then
        FOUND_APPS=$((FOUND_APPS + 1))
    fi
done

if [ $FOUND_APPS -eq ${#APPS[@]} ]; then
    pass "All frontend applications found"
else
    warn "Some applications missing ($FOUND_APPS/${#APPS[@]} found)"
fi

# Summary
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📊 Checklist Summary"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo -e "${GREEN}✅ Passed:${NC} $PASSED"
echo -e "${YELLOW}⚠️  Warnings:${NC} $WARNINGS"
echo -e "${RED}❌ Failed:${NC} $FAILED"
echo -e "${YELLOW}⏭️  Skipped:${NC} $SKIPPED"
echo ""

if [ $FAILED -eq 0 ]; then
    if [ $WARNINGS -eq 0 ]; then
        echo -e "${GREEN}✅ All checks passed! Ready for deployment.${NC}"
        exit 0
    else
        echo -e "${YELLOW}⚠️  Checks passed with warnings. Review warnings before deploying.${NC}"
        exit 0
    fi
else
    echo -e "${RED}❌ Some checks failed. Please fix issues before deploying.${NC}"
    exit 1
fi
