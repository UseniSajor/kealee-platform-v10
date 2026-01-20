#!/bin/bash
# scripts/setup-sentry.sh
# Setup Sentry error monitoring for all applications

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Parse arguments
ENVIRONMENT="production"
SENTRY_ORG=""
SENTRY_AUTH_TOKEN=""

while [[ $# -gt 0 ]]; do
    case $1 in
        --env=*)
            ENVIRONMENT="${1#*=}"
            shift
            ;;
        --org=*)
            SENTRY_ORG="${1#*=}"
            shift
            ;;
        --token=*)
            SENTRY_AUTH_TOKEN="${1#*=}"
            shift
            ;;
        *)
            echo "Unknown option: $1"
            exit 1
            ;;
    esac
done

log() {
    echo -e "${BLUE}[SENTRY]${NC} $1"
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

echo "🔍 Sentry Error Monitoring Setup"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "   Environment: $ENVIRONMENT"
echo ""

# Check if Sentry CLI is installed
if ! command -v sentry-cli &> /dev/null; then
    warn "Sentry CLI not found"
    echo "   Install with:"
    echo "   npm install -g @sentry/cli"
    echo "   or"
    echo "   curl -sL https://sentry.io/get-cli/ | bash"
    echo ""
    read -p "Install Sentry CLI now? (y/N): " INSTALL_CLI
    
    if [ "$INSTALL_CLI" = "y" ] || [ "$INSTALL_CLI" = "Y" ]; then
        log "Installing Sentry CLI..."
        if curl -sL https://sentry.io/get-cli/ | bash; then
            success "Sentry CLI installed"
        else
            fail "Failed to install Sentry CLI"
            exit 1
        fi
    else
        warn "Skipping Sentry CLI installation"
        echo "   You can set up Sentry manually via dashboard"
    fi
fi

# Login to Sentry
if command -v sentry-cli &> /dev/null; then
    if [ -z "$SENTRY_AUTH_TOKEN" ]; then
        log "Sentry authentication required"
        echo ""
        echo "Get your auth token from:"
        echo "  https://sentry.io/settings/account/api/auth-tokens/"
        echo ""
        read -p "Enter Sentry auth token (or press Enter to skip): " SENTRY_AUTH_TOKEN
    fi
    
    if [ -n "$SENTRY_AUTH_TOKEN" ]; then
        export SENTRY_AUTH_TOKEN
        log "Authenticating with Sentry..."
        if sentry-cli login --auth-token "$SENTRY_AUTH_TOKEN"; then
            success "Authenticated with Sentry"
        else
            warn "Authentication failed, continuing with manual setup"
        fi
    fi
fi

# Application configuration
declare -A APP_CONFIG=(
    ["m-marketplace"]="marketplace.kealee.com"
    ["os-admin"]="admin.kealee.com"
    ["os-pm"]="pm.kealee.com"
    ["m-ops-services"]="ops.kealee.com"
    ["m-project-owner"]="app.kealee.com"
    ["m-architect"]="architect.kealee.com"
    ["m-permits-inspections"]="permits.kealee.com"
    ["api"]="api.kealee.com"
)

echo ""
echo "📋 Sentry Project Setup"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "For each application, you need to:"
echo "  1. Create a Sentry project"
echo "  2. Get the DSN (Data Source Name)"
echo "  3. Set environment variables"
echo ""

# Generate Sentry configuration
SENTRY_CONFIG_FILE="sentry-config.txt"
log "Generating Sentry configuration file: $SENTRY_CONFIG_FILE"

cat > "$SENTRY_CONFIG_FILE" << EOF
# Sentry Configuration for Kealee Platform
# Generated: $(date)
# Environment: $ENVIRONMENT

# Setup Instructions:
# 1. Go to https://sentry.io
# 2. Create a new organization (if needed)
# 3. For each app, create a new project:
#    - Platform: Next.js (for frontend apps) or Node.js (for API)
#    - Project name: kealee-<app-name>
#
# 4. Get the DSN from each project's Settings → Client Keys (DSN)
# 5. Set environment variables in Vercel/Railway

# Application Projects:
EOF

for app in "${!APP_CONFIG[@]}"; do
    domain="${APP_CONFIG[$app]}"
    project_name="kealee-${app}"
    
    echo "" >> "$SENTRY_CONFIG_FILE"
    echo "# $app ($domain)" >> "$SENTRY_CONFIG_FILE"
    echo "SENTRY_PROJECT_${app^^}=$project_name" >> "$SENTRY_CONFIG_FILE"
    echo "NEXT_PUBLIC_SENTRY_DSN=https://...@sentry.io/..." >> "$SENTRY_CONFIG_FILE"
    echo "SENTRY_DSN=https://...@sentry.io/..." >> "$SENTRY_CONFIG_FILE"
    echo "SENTRY_AUTH_TOKEN=..." >> "$SENTRY_CONFIG_FILE"
    echo "SENTRY_ORG=$SENTRY_ORG" >> "$SENTRY_CONFIG_FILE"
    echo "SENTRY_PROJECT=$project_name" >> "$SENTRY_CONFIG_FILE"
done

success "Sentry configuration file created: $SENTRY_CONFIG_FILE"

# Check if Vercel CLI is available for setting env vars
if command -v vercel &> /dev/null && vercel whoami &> /dev/null; then
    echo ""
    read -p "Set Sentry DSNs in Vercel environment variables? (y/N): " SET_VERCEL
    
    if [ "$SET_VERCEL" = "y" ] || [ "$SET_VERCEL" = "Y" ]; then
        log "Setting Sentry environment variables in Vercel..."
        
        for app in "${!APP_CONFIG[@]}"; do
            if [ "$app" = "api" ]; then
                continue  # API is on Railway, not Vercel
            fi
            
            APP_DIR="apps/$app"
            if [ ! -d "$APP_DIR" ]; then
                continue
            fi
            
            log "Configuring $app..."
            cd "$APP_DIR"
            
            # Check if project is linked
            if [ -f ".vercel/project.json" ]; then
                echo ""
                echo "  Enter Sentry DSN for $app:"
                read -p "  NEXT_PUBLIC_SENTRY_DSN: " SENTRY_DSN
                
                if [ -n "$SENTRY_DSN" ]; then
                    if echo "$SENTRY_DSN" | vercel env add "NEXT_PUBLIC_SENTRY_DSN" "$ENVIRONMENT" 2>&1 | grep -q "error\|Error"; then
                        warn "  Failed to set NEXT_PUBLIC_SENTRY_DSN (may already exist)"
                    else
                        success "  NEXT_PUBLIC_SENTRY_DSN set"
                    fi
                fi
            else
                warn "  Project not linked to Vercel, skipping"
            fi
            
            cd ../..
        done
    fi
fi

echo ""
echo "📋 Next Steps"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "1. ✅ Create Sentry projects:"
echo "   - Go to https://sentry.io"
echo "   - Create projects for each app"
echo ""
echo "2. ✅ Get DSNs from each project:"
echo "   - Settings → Client Keys (DSN)"
echo "   - Copy the DSN URL"
echo ""
echo "3. ✅ Set environment variables:"
echo "   - Vercel: For each app, set NEXT_PUBLIC_SENTRY_DSN"
echo "   - Railway: For API, set SENTRY_DSN"
echo ""
echo "4. ✅ Configure source maps (optional):"
echo "   - Enable source maps in build process"
echo "   - Upload source maps to Sentry"
echo ""
echo "5. ✅ Set up alerts:"
echo "   - Configure error alerts"
echo "   - Set up performance monitoring"
echo ""
echo "📄 Configuration saved to: $SENTRY_CONFIG_FILE"
