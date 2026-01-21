#!/bin/bash
# scripts/commit-and-push-fixes.sh
# Commit and push the TypeScript fixes for Railway deployment

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

log() {
    echo -e "${BLUE}[COMMIT]${NC} $1"
}

success() {
    echo -e "${GREEN}✅${NC} $1"
}

fail() {
    echo -e "${RED}❌${NC} $1"
}

warn() {
    echo -e "${YELLOW}⚠️${NC} $1"
}

echo "📦 Committing and Pushing Fixes"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Check if git is initialized
if ! git rev-parse --git-dir > /dev/null 2>&1; then
    fail "Git repository not initialized"
    echo "   Initialize with: git init"
    exit 1
fi

# Check if there are changes to commit
if git diff --quiet && git diff --cached --quiet; then
    warn "No changes to commit"
    echo "   All changes are already committed"
    exit 0
fi

# Show what will be committed
log "Files to be committed:"
git status --short
echo ""

# Confirm
read -p "Commit and push these changes? (y/n): " CONFIRM
if [ "$CONFIRM" != "y" ] && [ "$CONFIRM" != "Y" ]; then
    echo "Cancelled."
    exit 0
fi

# Add all changes
log "Staging changes..."
git add -A

# Commit
log "Committing changes..."
git commit -m "fix: Add missing catch blocks in stripe webhook handler and fix GitHub Actions pnpm setup

- Add catch blocks for invoice and payment creation try blocks
- Fix GitHub Actions workflow to setup pnpm before Node.js
- Resolves TypeScript compilation errors in Railway builds"

if [ $? -eq 0 ]; then
    success "Changes committed"
else
    fail "Commit failed"
    exit 1
fi

# Push
log "Pushing to remote..."
if git push; then
    success "Changes pushed successfully!"
    echo ""
    echo "🚀 Railway will automatically rebuild with the fixes"
    echo "📊 Monitor deployment in Railway dashboard"
else
    fail "Push failed"
    echo ""
    echo "💡 You may need to:"
    echo "   1. Set up remote: git remote add origin <url>"
    echo "   2. Or push manually: git push"
    exit 1
fi

echo ""
success "All done! Railway should rebuild automatically."

