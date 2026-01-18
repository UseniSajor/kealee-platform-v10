#!/bin/bash

# 🚀 Vercel Preview Deployment Helper Script
# Automates the preview deployment workflow

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Functions
print_step() {
    echo -e "${BLUE}==>${NC} $1"
}

print_success() {
    echo -e "${GREEN}✓${NC} $1"
}

print_error() {
    echo -e "${RED}✗${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}!${NC} $1"
}

# Check if git is installed
if ! command -v git &> /dev/null; then
    print_error "Git is not installed. Please install Git first."
    exit 1
fi

# Main script
echo ""
echo "🚀 Vercel Preview Deployment Helper"
echo "===================================="
echo ""

# Step 1: Check current branch
CURRENT_BRANCH=$(git branch --show-current)
print_step "Current branch: $CURRENT_BRANCH"
echo ""

# Step 2: Get uncommitted changes
if [[ -n $(git status -s) ]]; then
    print_warning "You have uncommitted changes:"
    git status -s
    echo ""
    read -p "Do you want to commit these changes? (y/n): " -n 1 -r
    echo ""
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        read -p "Commit message: " COMMIT_MSG
        git add .
        git commit -m "$COMMIT_MSG"
        print_success "Changes committed"
    else
        print_warning "Continuing without committing..."
    fi
fi

# Step 3: Choose deployment type
echo ""
print_step "Choose deployment type:"
echo "1) Deploy current branch for preview"
echo "2) Create new feature branch and deploy"
echo "3) Deploy to preview-deploy branch"
echo "4) Promote preview-deploy to production (main)"
echo ""
read -p "Select option (1-4): " -n 1 -r DEPLOY_TYPE
echo ""

case $DEPLOY_TYPE in
    1)
        # Deploy current branch
        print_step "Deploying current branch: $CURRENT_BRANCH"
        git push origin $CURRENT_BRANCH
        print_success "Pushed to GitHub"
        print_step "Vercel will create preview deployment automatically"
        print_step "Check Vercel dashboard for preview URL"
        ;;
    
    2)
        # Create new feature branch
        read -p "Feature branch name (without feature/ prefix): " FEATURE_NAME
        BRANCH_NAME="feature/$FEATURE_NAME"
        print_step "Creating branch: $BRANCH_NAME"
        git checkout -b $BRANCH_NAME
        print_success "Branch created"
        git push origin $BRANCH_NAME
        print_success "Pushed to GitHub"
        print_step "Vercel will create preview deployment automatically"
        print_step "Check Vercel dashboard for preview URL"
        ;;
    
    3)
        # Deploy to preview-deploy
        print_step "Switching to preview-deploy branch"
        
        # Check if preview-deploy exists
        if git show-ref --verify --quiet refs/heads/preview-deploy; then
            git checkout preview-deploy
            print_success "Switched to preview-deploy"
            
            # Ask if they want to merge current branch
            if [ "$CURRENT_BRANCH" != "preview-deploy" ]; then
                read -p "Merge $CURRENT_BRANCH into preview-deploy? (y/n): " -n 1 -r
                echo ""
                if [[ $REPLY =~ ^[Yy]$ ]]; then
                    git merge $CURRENT_BRANCH
                    print_success "Merged $CURRENT_BRANCH into preview-deploy"
                fi
            fi
        else
            git checkout -b preview-deploy
            print_success "Created preview-deploy branch"
        fi
        
        git push origin preview-deploy
        print_success "Pushed to GitHub"
        print_step "Vercel will deploy preview-deploy branch"
        ;;
    
    4)
        # Promote to production
        print_warning "⚠️  PROMOTING TO PRODUCTION"
        echo ""
        print_step "This will:"
        echo "  1. Merge preview-deploy into main"
        echo "  2. Push to production"
        echo "  3. Trigger production deployment on Vercel"
        echo ""
        read -p "Have you tested the preview deployment? (y/n): " -n 1 -r
        echo ""
        
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            print_error "Please test preview deployment first!"
            exit 1
        fi
        
        read -p "Are you ABSOLUTELY SURE you want to deploy to production? (y/n): " -n 1 -r
        echo ""
        
        if [[ $REPLY =~ ^[Yy]$ ]]; then
            print_step "Checking out main branch"
            git checkout main
            
            print_step "Pulling latest changes"
            git pull origin main
            
            print_step "Merging preview-deploy into main"
            git merge preview-deploy
            
            print_step "Pushing to main (production)"
            git push origin main
            
            print_success "🎉 Deployed to production!"
            print_step "Monitor deployment in Vercel dashboard"
        else
            print_error "Production deployment cancelled"
            exit 0
        fi
        ;;
    
    *)
        print_error "Invalid option"
        exit 1
        ;;
esac

# Step 4: Show next steps
echo ""
echo "📋 Next Steps:"
echo "=============="
echo ""
if [ "$DEPLOY_TYPE" = "4" ]; then
    echo "1. Monitor production deployment in Vercel dashboard"
    echo "2. Run smoke tests on production URL"
    echo "3. Check error logs and analytics"
    echo "4. Notify team of deployment"
else
    echo "1. Wait for preview deployment to complete (~2-3 minutes)"
    echo "2. Check Vercel dashboard for preview URL"
    echo "3. Open preview URL and test thoroughly"
    echo "4. Use PREVIEW_TEST_CHECKLIST.md for testing"
    echo "5. If tests pass, run this script again and select option 4"
fi
echo ""

print_success "Script completed!"
echo ""
