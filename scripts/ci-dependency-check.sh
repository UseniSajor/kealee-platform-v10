#!/bin/bash

# CI Dependency Check
# Validates monorepo health before build
# Run in CI pipeline to prevent dependency-related failures

set -e

echo "📊 Running dependency checks..."
echo ""

# Run health check
echo "1️⃣  Monorepo health check..."
node scripts/check-monorepo-health.mjs
HEALTH=$?

if [ $HEALTH -ne 0 ]; then
    echo ""
    echo "❌ Monorepo health check FAILED"
    echo "   Fix issues and retry"
    exit 1
fi

echo ""
echo "2️⃣  Checking for outdated lock file..."

# Verify lock file is in sync
if ! pnpm install --frozen-lockfile --dry-run > /dev/null 2>&1; then
    echo "❌ pnpm-lock.yaml is out of sync"
    echo "   Run: pnpm install --no-frozen-lockfile"
    echo "   Then commit pnpm-lock.yaml"
    exit 1
fi

echo "✅ Lock file is in sync"
echo ""

echo "3️⃣  Checking for problematic dependencies..."

# Check for known problematic patterns
if grep -r "workspace:\*" packages/*/package.json | grep -v '"@kealee/' > /dev/null 2>&1; then
    echo "⚠️  WARNING: Non-@kealee workspace dependencies found"
    grep -r "workspace:\*" packages/*/package.json | grep -v '"@kealee/' || true
fi

echo ""
echo "✅ All dependency checks PASSED"
echo ""
echo "Ready for build!"
exit 0
