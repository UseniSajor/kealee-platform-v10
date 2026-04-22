#!/bin/bash
# Deployment Verification Script
# Checks Railway build status, service health, and database migrations

set -e

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo "🚀 Deployment Verification Script"
echo "=================================="
echo ""

# Check 1: Verify commits are pushed
echo "📝 Check 1: Verify commits pushed to main"
LATEST_COMMIT=$(git log -1 --oneline)
if [[ $LATEST_COMMIT == *"5ccc9eb6"* ]]; then
  echo -e "${GREEN}✓ Latest commit (5ccc9eb6) is on main${NC}"
else
  echo -e "${YELLOW}⚠ Latest commit is different: $LATEST_COMMIT${NC}"
  echo "  Expected: 5ccc9eb6 (FIX: Use correct Nixpacks TOML format)"
fi
echo ""

# Check 2: Verify .nixpacks.toml is configured correctly
echo "🔧 Check 2: Verify .nixpacks.toml configuration"
if grep -q "pnpm@8.15.9" .nixpacks.toml; then
  echo -e "${GREEN}✓ pnpm version locked in setup phase${NC}"
else
  echo -e "${RED}✗ pnpm version not found in .nixpacks.toml${NC}"
  exit 1
fi

if grep -q "pnpm install --frozen-lockfile" .nixpacks.toml; then
  echo -e "${GREEN}✓ pnpm install configured in install phase${NC}"
else
  echo -e "${RED}✗ pnpm install not found in .nixpacks.toml${NC}"
  exit 1
fi

if grep -q "\[phases.setup\]" .nixpacks.toml; then
  echo -e "${GREEN}✓ Nixpacks phases correctly structured${NC}"
else
  echo -e "${RED}✗ Nixpacks phases structure incorrect${NC}"
  exit 1
fi
echo ""

# Check 3: Verify no Docker files remain
echo "🐳 Check 3: Verify Docker files removed"
DOCKER_FILES=$(find . -maxdepth 2 -name "Dockerfile*" -not -path "./.git/*" | wc -l)
if [ "$DOCKER_FILES" -eq 0 ]; then
  echo -e "${GREEN}✓ No Dockerfile files found (Nixpacks will be used)${NC}"
else
  echo -e "${RED}✗ Found $DOCKER_FILES Dockerfile files:${NC}"
  find . -maxdepth 2 -name "Dockerfile*" -not -path "./.git/*"
  exit 1
fi
echo ""

# Check 4: Verify migrations exist
echo "📦 Check 4: Verify Prisma migrations"
if [ -d "packages/database/prisma/migrations/20260418_add_project_output" ]; then
  echo -e "${GREEN}✓ Migration 20260418_add_project_output exists${NC}"
else
  echo -e "${RED}✗ Migration 20260418_add_project_output not found${NC}"
  exit 1
fi

if [ -d "packages/database/prisma/migrations/20260425_enhance_project_output_for_deliverables" ]; then
  echo -e "${GREEN}✓ Migration 20260425_enhance_project_output_for_deliverables exists${NC}"
else
  echo -e "${RED}✗ Migration 20260425_enhance_project_output_for_deliverables not found${NC}"
  exit 1
fi
echo ""

# Check 5: Verify deliverable storage files
echo "💾 Check 5: Verify deliverable storage files"
FILES_TO_CHECK=(
  "services/api/src/lib/deliverable-generator.ts"
  "services/api/src/lib/project-output-manager.ts"
  "services/api/src/lib/pdf-generator-enhanced.ts"
  "services/api/src/lib/concept-image-generator.ts"
  "services/api/src/lib/deliverable-email-service.ts"
  "services/api/src/lib/realtime-notifications.ts"
)

for file in "${FILES_TO_CHECK[@]}"; do
  if [ -f "$file" ]; then
    echo -e "${GREEN}✓ $file exists${NC}"
  else
    echo -e "${RED}✗ $file not found${NC}"
    exit 1
  fi
done
echo ""

# Check 6: Test API health endpoint (if available)
echo "🏥 Check 6: Test service health endpoints"
if command -v curl &> /dev/null; then
  echo "Testing web-main health endpoint..."
  if curl -s https://kealee.com/api/health 2>/dev/null | grep -q "healthy"; then
    echo -e "${GREEN}✓ web-main is responding${NC}"
  else
    echo -e "${YELLOW}⚠ web-main not yet responding (may still be deploying)${NC}"
  fi

  echo "Testing kealee-api health endpoint..."
  if curl -s https://api.kealee.com/health 2>/dev/null | grep -q "healthy"; then
    echo -e "${GREEN}✓ kealee-api is responding${NC}"
  else
    echo -e "${YELLOW}⚠ kealee-api not yet responding (may still be deploying)${NC}"
  fi
else
  echo -e "${YELLOW}⚠ curl not available, skipping endpoint tests${NC}"
fi
echo ""

# Check 7: Verify DATABASE_URL is set
echo "🗄️  Check 7: Verify database configuration"
if [ -z "$DATABASE_URL" ]; then
  echo -e "${YELLOW}⚠ DATABASE_URL not set in environment${NC}"
  echo "  To run migrations, set DATABASE_URL and run:"
  echo "  pnpm exec prisma migrate deploy"
else
  echo -e "${GREEN}✓ DATABASE_URL is configured${NC}"
  echo "  Ready to run: pnpm exec prisma migrate deploy"
fi
echo ""

# Summary
echo "=================================="
echo -e "${GREEN}✓ Pre-deployment verification complete!${NC}"
echo ""
echo "📋 Next Steps:"
echo "1. Monitor Railway dashboard: https://dashboard.railway.app"
echo "   Project: artistic-kindness"
echo "   Look for successful build with 'pnpm install' in logs"
echo ""
echo "2. Run Prisma migration (when DATABASE_URL is set):"
echo "   pnpm exec prisma migrate deploy --skip-generate"
echo ""
echo "3. Verify services are healthy:"
echo "   curl https://api.kealee.com/health"
echo "   curl https://kealee.com/api/health"
echo ""
echo "4. Test end-to-end flow:"
echo "   See DEPLOYMENT_VERIFICATION.md for detailed test steps"
echo ""
echo "📚 Documentation:"
echo "   - DEPLOYMENT_VERIFICATION.md — Full verification guide"
echo "   - SESSION_SUMMARY.md — Complete session overview"
echo "   - RAILWAY_BUILD_FIX.md — Build configuration details"
echo ""
