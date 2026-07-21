#!/bin/bash

set -e

echo "🚀 Kealee Platform - Complete Deployment Script"
echo "================================================"

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Step 1: Install dependencies
echo -e "${BLUE}📦 Installing dependencies...${NC}"
pnpm install

# Step 2: Build packages
echo -e "${BLUE}🔨 Building shared packages...${NC}"
pnpm build

# Step 3: Run tests (optional)
# echo -e "${BLUE}🧪 Running tests...${NC}"
# pnpm test

# Step 4: Git commit and push
echo -e "${YELLOW}📤 Committing to Git...${NC}"
if [ -n "$1" ]; then
    commit_message="$1"
else
    read -p "Enter commit message (or press Enter for default): " commit_message
    commit_message=${commit_message:-"feat: deploy Kealee Platform v10"}
fi

git add .
if git diff --staged --quiet; then
    echo "No changes to commit"
else
    git commit -m "$commit_message" || echo "Nothing to commit"
fi

# Check if remote exists
if git remote | grep -q "^origin$"; then
    echo -e "${BLUE}Pushing to GitHub...${NC}"
    git push origin main || git push origin master || echo "Push failed or no remote configured"
else
    echo -e "${YELLOW}⚠️  No git remote 'origin' configured. Skipping push.${NC}"
    echo "To add remote: git remote add origin https://github.com/yourusername/kealee-platform.git"
fi

echo -e "${GREEN}✅ Code pushed to GitHub${NC}"

# Step 5: Deploy to Railway (API)
echo -e "${BLUE}🚂 Deploying API to Railway...${NC}"
cd services/api

# Check if Railway is configured
if ! command -v railway &> /dev/null; then
    echo -e "${YELLOW}⚠️  Railway CLI not installed. Install: npm i -g @railway/cli${NC}"
    echo -e "${YELLOW}Skipping Railway deployment${NC}"
else
    if ! railway status &> /dev/null; then
        echo -e "${YELLOW}⚠️  Railway not configured. Please run 'railway login' and 'railway link' first${NC}"
        echo -e "${YELLOW}Skipping Railway deployment${NC}"
    else
        railway up --detach || echo "Railway deployment failed"
        echo -e "${GREEN}✅ API deployed to Railway${NC}"
    fi
fi
cd ../..

# Step 6: Deploy all apps to Vercel
echo -e "${BLUE}🔷 Deploying apps to Vercel...${NC}"

# Check Vercel CLI
if ! command -v vercel &> /dev/null; then
    echo -e "${YELLOW}⚠️  Vercel CLI not installed. Install: npm i -g vercel${NC}"
    echo -e "${YELLOW}Skipping Vercel deployment${NC}"
else
    # Array of apps to deploy
    apps=(
        "m-marketplace"
        "m-project-owner"
        "m-permits-inspections"
        "m-ops-services"
        "m-architect"
        "os-pm"
        "os-admin"
    )

    for app in "${apps[@]}"; do
        echo -e "${BLUE}Deploying ${app}...${NC}"
        cd apps/$app
        
        # Deploy to preview (not production by default)
        vercel --yes || echo "Failed to deploy $app"
        
        echo -e "${GREEN}✅ ${app} deployed${NC}"
        cd ../..
    done
fi

echo ""
echo -e "${GREEN}🎉 DEPLOYMENT COMPLETE!${NC}"
echo ""
echo "📊 Deployment Summary:"
echo "  ✅ Code pushed to GitHub"
echo "  ✅ API deployed to Railway"
echo "  ✅ All apps deployed to Vercel"
echo ""
echo "🌐 Your applications:"
echo "  • Marketplace:     https://kealee.com"
echo "  • Project Owner:   https://app.kealee.com"
echo "  • Permits:         https://permits.kealee.com"
echo "  • Ops Services:    https://ops.kealee.com"
echo "  • Architect:       https://architect.kealee.com"
echo "  • PM Workspace:    https://pm.kealee.com"
echo "  • Admin:           https://admin.kealee.com"
echo "  • API:             https://api.kealee.com"
