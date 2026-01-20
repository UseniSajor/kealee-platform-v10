#!/bin/bash
# scripts/setup-env-local.sh
# Set up .env.local files for all apps from .env.example templates

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

log() {
    echo -e "${BLUE}[SETUP]${NC} $1"
}

success() {
    echo -e "${GREEN}✅${NC} $1"
}

warn() {
    echo -e "${YELLOW}⚠️${NC} $1"
}

fail() {
    echo -e "${RED}❌${NC} $1"
}

echo "🔧 Setting Up Environment Variables"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Apps directory
APPS_DIR="apps"
SERVICES_DIR="services"

# Default database URL
DEFAULT_DB_URL="postgresql://kealee:kealee_dev@localhost:5433/kealee_development"

# Function to setup env file for an app
setup_app_env() {
    local APP_DIR=$1
    local APP_NAME=$(basename "$APP_DIR")
    local ENV_EXAMPLE="$APP_DIR/.env.example"
    local ENV_LOCAL="$APP_DIR/.env.local"
    
    if [ ! -f "$ENV_EXAMPLE" ]; then
        warn "No .env.example found for $APP_NAME, skipping..."
        return
    fi
    
    if [ -f "$ENV_LOCAL" ]; then
        warn ".env.local already exists for $APP_NAME"
        read -p "  Overwrite? (y/N): " OVERWRITE
        if [ "$OVERWRITE" != "y" ] && [ "$OVERWRITE" != "Y" ]; then
            log "Skipping $APP_NAME"
            return
        fi
    fi
    
    log "Setting up $APP_NAME..."
    
    # Copy example to local
    cp "$ENV_EXAMPLE" "$ENV_LOCAL"
    
    # Replace default DATABASE_URL if it's the placeholder
    if grep -q "postgresql://postgres:password@localhost:5432" "$ENV_LOCAL"; then
        sed -i.bak "s|postgresql://postgres:password@localhost:5432/kealee_development|$DEFAULT_DB_URL|g" "$ENV_LOCAL"
        rm -f "$ENV_LOCAL.bak"
    fi
    
    # Generate NEXTAUTH_SECRET if it's a placeholder
    if grep -q "your-secret-key-here" "$ENV_LOCAL"; then
        if command -v openssl &> /dev/null; then
            SECRET=$(openssl rand -base64 32)
            sed -i.bak "s|your-secret-key-here-generate-with-openssl-rand-base64-32|$SECRET|g" "$ENV_LOCAL"
            rm -f "$ENV_LOCAL.bak"
            log "  Generated NEXTAUTH_SECRET"
        else
            warn "  openssl not found, please set NEXTAUTH_SECRET manually"
        fi
    fi
    
    success "Created $ENV_LOCAL"
}

# Setup apps
log "Setting up app environment files..."
for APP_DIR in "$APPS_DIR"/*; do
    if [ -d "$APP_DIR" ]; then
        setup_app_env "$APP_DIR"
    fi
done

# Setup services
log "Setting up service environment files..."
for SERVICE_DIR in "$SERVICES_DIR"/*; do
    if [ -d "$SERVICE_DIR" ]; then
        setup_app_env "$SERVICE_DIR"
    fi
done

echo ""
success "Environment setup complete!"
echo ""
echo "📋 Next Steps:"
echo "   1. Review and update .env.local files with your actual values"
echo "   2. Set Stripe keys from your Stripe Dashboard"
echo "   3. Set Supabase keys from your Supabase project"
echo "   4. Configure analytics IDs if needed"
echo ""
echo "💡 Tip: Use the same NEXTAUTH_SECRET across all apps for SSO"
