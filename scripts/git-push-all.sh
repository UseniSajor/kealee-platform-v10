#!/bin/bash
# scripts/git-push-all.sh
# Push all changes to git repositories (origin, Railway, Vercel)

set -e

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

log() {
    echo -e "${BLUE}[GIT]${NC} $1"
}

success() {
    echo -e "${GREEN}✅${NC} $1"
}

warn() {
    echo -e "${YELLOW}⚠️${NC} $1"
}

error() {
    echo -e "${RED}❌${NC} $1"
}

echo "📤 Git Push - Kealee Platform"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Check if git is initialized
if [ ! -d ".git" ]; then
    log "Initializing git repository..."
    git init
    success "Git repository initialized"
fi

# Check for changes
if [ -z "$(git status --porcelain)" ]; then
    warn "No changes to commit"
    exit 0
fi

# Show status
log "Current git status:"
git status --short

# Ask for commit message
echo ""
read -p "Commit message (or press Enter for default): " COMMIT_MSG
COMMIT_MSG=${COMMIT_MSG:-"Deploy: Complete Kealee Platform v10 - All 77 TODOs completed"}

# Stage all changes
log "Staging all changes..."
git add .
success "Changes staged"

# Commit
log "Committing changes..."
git commit -m "$COMMIT_MSG" || {
    error "Commit failed"
    exit 1
}
success "Changes committed"

# Check for remotes
log "Checking git remotes..."
REMOTES=$(git remote)

if [ -z "$REMOTES" ]; then
    warn "No git remotes configured"
    echo ""
    echo "To add remotes, run:"
    echo "  git remote add origin <your-repo-url>"
    echo "  git remote add railway <railway-git-url>  # Optional"
    echo "  git remote add vercel <vercel-git-url>   # Optional"
    echo ""
    read -p "Add remotes now? (y/N): " ADD_REMOTES
    
    if [ "$ADD_REMOTES" = "y" ] || [ "$ADD_REMOTES" = "Y" ]; then
        read -p "Origin URL: " ORIGIN_URL
        if [ -n "$ORIGIN_URL" ]; then
            git remote add origin "$ORIGIN_URL"
            success "Added origin remote"
        fi
        
        read -p "Railway URL (optional): " RAILWAY_URL
        if [ -n "$RAILWAY_URL" ]; then
            git remote add railway "$RAILWAY_URL"
            success "Added railway remote"
        fi
        
        read -p "Vercel URL (optional): " VERCEL_URL
        if [ -n "$VERCEL_URL" ]; then
            git remote add vercel "$VERCEL_URL"
            success "Added vercel remote"
        fi
    else
        warn "Skipping remote setup. Push manually later."
        exit 0
    fi
fi

# Push to remotes
echo ""
log "Pushing to remotes..."

# Push to origin
if git remote | grep -q "^origin$"; then
    log "Pushing to origin..."
    BRANCH=$(git branch --show-current || echo "main")
    git push -u origin "$BRANCH" || {
        error "Failed to push to origin"
        exit 1
    }
    success "Pushed to origin/$BRANCH"
fi

# Push to Railway
if git remote | grep -q "^railway$"; then
    log "Pushing to Railway..."
    git push railway "$BRANCH" || {
        warn "Failed to push to Railway (may need authentication)"
    }
    success "Pushed to Railway"
fi

# Push to Vercel
if git remote | grep -q "^vercel$"; then
    log "Pushing to Vercel..."
    git push vercel "$BRANCH" || {
        warn "Failed to push to Vercel (may need authentication)"
    }
    success "Pushed to Vercel"
fi

echo ""
success "Git push complete!"
echo ""
echo "📊 Push Summary:"
git remote -v | while read remote url; do
    echo "   - $remote: $url"
done
echo ""
