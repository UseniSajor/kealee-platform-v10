#!/bin/bash
# scripts/copy-env-to-staging.sh
# Copy production environment variables to staging (preview)

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Counters
COPIED=0
SKIPPED=0
FAILED=0

log() {
    echo -e "${BLUE}[COPY]${NC} $1"
}

success() {
    echo -e "${GREEN}✅${NC} $1"
    COPIED=$((COPIED + 1))
}

fail() {
    echo -e "${RED}❌${NC} $1"
    FAILED=$((FAILED + 1))
}

warn() {
    echo -e "${YELLOW}⚠️${NC} $1"
    SKIPPED=$((SKIPPED + 1))
}

# Check if Vercel CLI is installed
if ! command -v vercel &> /dev/null; then
    fail "Vercel CLI not installed"
    echo "   Install with: npm install -g vercel@latest"
    exit 1
fi

# Check if logged in
if ! vercel whoami &> /dev/null; then
    fail "Not logged in to Vercel"
    echo "   Login with: vercel login"
    exit 1
fi

# Parse arguments
APP_NAME=""
FORCE=false
DRY_RUN=false

while [[ $# -gt 0 ]]; do
    case $1 in
        --app=*)
            APP_NAME="${1#*=}"
            shift
            ;;
        --app)
            APP_NAME="$2"
            shift 2
            ;;
        --force)
            FORCE=true
            shift
            ;;
        --dry-run)
            DRY_RUN=true
            shift
            ;;
        *)
            echo "Unknown option: $1"
            echo "Usage: $0 [--app=APP_NAME] [--force] [--dry-run]"
            exit 1
            ;;
    esac
done

echo "📋 Copy Production Environment Variables to Staging"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
if [ "$DRY_RUN" = "true" ]; then
    warn "DRY RUN MODE: No changes will be made"
fi
echo ""

# Function to copy env vars for an app
copy_env_for_app() {
    local app=$1
    local app_dir="apps/$app"
    
    if [ ! -d "$app_dir" ]; then
        warn "Directory not found: $app_dir"
        return 1
    fi
    
    log "Processing $app..."
    
    cd "$app_dir"
    
    # Check if project is linked
    if [ ! -f ".vercel/project.json" ]; then
        warn "$app: Project not linked, skipping"
        cd ../..
        return 1
    fi
    
    # Get production environment variables
    log "  Fetching production environment variables..."
    PROD_ENV=$(vercel env ls production 2>/dev/null || echo "")
    
    if [ -z "$PROD_ENV" ]; then
        warn "$app: No production environment variables found"
        cd ../..
        return 1
    fi
    
    # Pull production env vars first
    if [ "$DRY_RUN" != "true" ]; then
        if [ -f ".env.production" ]; then
            rm -f .env.production
        fi
        
        log "  Pulling production environment variables..."
        vercel env pull .env.production --environment=production --yes > /dev/null 2>&1 || true
    fi
    
    # Parse and copy each variable
    VAR_COUNT=0
    
    if [ -f ".env.production" ] || [ "$DRY_RUN" = "true" ]; then
        # Get list of production variables
        PROD_VARS=$(vercel env ls production 2>/dev/null | grep -v "^Name\|^Environment\|^Created\|^Updated" | awk '{print $1}' | grep -v "^$" || echo "")
        PREVIEW_VARS=$(vercel env ls preview 2>/dev/null | grep -v "^Name\|^Environment\|^Created\|^Updated" | awk '{print $1}' | grep -v "^$" || echo "")
        
        if [ -f ".env.production" ]; then
            # Read from .env.production file
            while IFS='=' read -r var_name var_value || [ -n "$var_name" ]; do
                # Skip comments and empty lines
                if [[ "$var_name" =~ ^# ]] || [ -z "$var_name" ]; then
                    continue
                fi
                
                VAR_NAME=$(echo "$var_name" | xargs)
                VAR_VALUE=$(echo "$var_value" | sed 's/^"//;s/"$//' | xargs)
                
                # Skip if empty
                if [ -z "$VAR_NAME" ]; then
                    continue
                fi
                
                # Check if variable already exists in preview
                if echo "$PREVIEW_VARS" | grep -q "^$VAR_NAME$"; then
                    if [ "$FORCE" != "true" ]; then
                        warn "  $VAR_NAME already exists in preview, skipping (use --force to overwrite)"
                        continue
                    fi
                fi
                
                log "  Copying $VAR_NAME..."
                
                if [ "$DRY_RUN" = "true" ]; then
                    success "  [DRY RUN] Would copy $VAR_NAME"
                    VAR_COUNT=$((VAR_COUNT + 1))
                else
                    # Remove existing if force
                    if [ "$FORCE" = "true" ] && echo "$PREVIEW_VARS" | grep -q "^$VAR_NAME$"; then
                        vercel env rm "$VAR_NAME" preview --yes > /dev/null 2>&1 || true
                    fi
                    
                    # Set in preview
                    if echo "$VAR_VALUE" | vercel env add "$VAR_NAME" preview --yes 2>&1 | grep -q "error\|Error"; then
                        fail "  Failed to copy $VAR_NAME"
                    else
                        success "  Copied $VAR_NAME"
                        VAR_COUNT=$((VAR_COUNT + 1))
                    fi
                fi
            done < .env.production
            
            # Cleanup
            rm -f .env.production
        else
            warn "  Could not pull production environment variables"
        fi
    else
        warn "  Could not access production environment variables"
    fi
    
    cd ../..
    
    if [ "$VAR_COUNT" -gt 0 ]; then
        success "$app: Copied $VAR_COUNT variables"
    else
        warn "$app: No variables copied"
    fi
    
    return 0
}

# If app specified, copy only that app
if [ -n "$APP_NAME" ]; then
    copy_env_for_app "$APP_NAME"
else
    # Copy for all apps
    APPS=(
        "m-marketplace"
        "os-admin"
        "os-pm"
        "m-ops-services"
        "m-project-owner"
        "m-architect"
        "m-permits-inspections"
    )
    
    for app in "${APPS[@]}"; do
        copy_env_for_app "$app"
        echo ""
    done
fi

# Summary
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📊 Copy Summary"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
success "Variables copied: $COPIED"
if [ $SKIPPED -gt 0 ]; then
    warn "Variables skipped: $SKIPPED"
fi
if [ $FAILED -gt 0 ]; then
    fail "Variables failed: $FAILED"
fi
echo ""

if [ "$DRY_RUN" = "true" ]; then
    echo "ℹ️  This was a dry run. No changes were made."
    echo "   Run without --dry-run to apply changes."
elif [ $FAILED -eq 0 ]; then
    echo "✅ Environment variables copied successfully!"
    echo ""
    echo "To verify:"
    if [ -n "$APP_NAME" ]; then
        echo "  cd apps/$APP_NAME"
    else
        echo "  cd apps/m-marketplace  # or any app"
    fi
    echo "  vercel env ls preview"
else
    echo "⚠️  Some variables failed to copy. Review errors above."
    exit 1
fi
