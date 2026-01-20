#!/bin/bash
# scripts/setup-datadog.sh
# Setup Datadog monitoring for all applications

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

log() {
    echo -e "${BLUE}[DATADOG]${NC} $1"
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

echo "📊 Datadog Monitoring Setup"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "This script helps you configure Datadog monitoring."
echo "Datadog provides APM, logs, metrics, and real user monitoring."
echo ""

# Check for Datadog API key
if [ -z "$DATADOG_API_KEY" ]; then
    log "Datadog API key required"
    echo ""
    echo "Get your API key from:"
    echo "  https://app.datadoghq.com/organization-settings/api-keys"
    echo ""
    read -p "Enter Datadog API key (or press Enter to skip): " DATADOG_API_KEY
fi

# Check for Datadog App key (for some operations)
if [ -z "$DATADOG_APP_KEY" ]; then
    log "Datadog Application key (optional)"
    echo ""
    echo "Get your App key from:"
    echo "  https://app.datadoghq.com/organization-settings/application-keys"
    echo ""
    read -p "Enter Datadog App key (or press Enter to skip): " DATADOG_APP_KEY
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
echo "📋 Datadog Integration Setup"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Generate Datadog configuration
DATADOG_CONFIG_FILE="datadog-config.txt"
log "Generating Datadog configuration file: $DATADOG_CONFIG_FILE"

cat > "$DATADOG_CONFIG_FILE" << EOF
# Datadog Configuration for Kealee Platform
# Generated: $(date)

# Setup Instructions:
# 1. Sign up at https://www.datadoghq.com (if not already)
# 2. Get API key from: Organization Settings → API Keys
# 3. Install Datadog agent or use Datadog RUM (Real User Monitoring)
#
# For Next.js apps (Vercel):
#   - Use @datadog/nextjs package
#   - Configure RUM (Real User Monitoring)
#   - Set up APM (Application Performance Monitoring)
#
# For API (Railway):
#   - Use dd-trace for Node.js
#   - Configure APM
#   - Set up log collection

# Environment Variables:
DATADOG_API_KEY=$DATADOG_API_KEY
DATADOG_APP_KEY=$DATADOG_APP_KEY
DATADOG_SITE=datadoghq.com  # or datadoghq.eu for EU
NEXT_PUBLIC_DD_RUM_APPLICATION_ID=...
NEXT_PUBLIC_DD_RUM_CLIENT_TOKEN=...
DD_SERVICE=kealee-platform
DD_ENV=production
DD_VERSION=1.0.0

# Application Configuration:
EOF

for app in "${!APP_CONFIG[@]}"; do
    domain="${APP_CONFIG[$app]}"
    echo "" >> "$DATADOG_CONFIG_FILE"
    echo "# $app ($domain)" >> "$DATADOG_CONFIG_FILE"
    echo "DD_SERVICE_${app^^}=kealee-${app}" >> "$DATADOG_CONFIG_FILE"
    echo "NEXT_PUBLIC_DD_RUM_APPLICATION_ID_${app^^}=..." >> "$DATADOG_CONFIG_FILE"
    echo "NEXT_PUBLIC_DD_RUM_CLIENT_TOKEN_${app^^}=..." >> "$DATADOG_CONFIG_FILE"
done

success "Datadog configuration file created: $DATADOG_CONFIG_FILE"

echo ""
echo "📦 Installation Steps"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "1. Install Datadog packages:"
echo ""
echo "   # For Next.js apps"
echo "   cd apps/m-marketplace"
echo "   npm install @datadog/nextjs"
echo ""
echo "   # For API"
echo "   cd services/api"
echo "   npm install dd-trace"
echo ""

echo "2. Configure Datadog RUM (Real User Monitoring):"
echo ""
echo "   # In next.config.js for each Next.js app"
echo "   const { datadogRum } = require('@datadog/nextjs');"
echo ""
echo "   datadogRum.init({"
echo "     applicationId: process.env.NEXT_PUBLIC_DD_RUM_APPLICATION_ID,"
echo "     clientToken: process.env.NEXT_PUBLIC_DD_RUM_CLIENT_TOKEN,"
echo "     site: 'datadoghq.com',"
echo "     service: 'kealee-<app-name>',"
echo "     env: 'production',"
echo "     version: '1.0.0',"
echo "     sampleRate: 100,"
echo "     trackInteractions: true,"
echo "   });"
echo ""

echo "3. Configure Datadog APM (API):"
echo ""
echo "   # In services/api/src/index.ts"
echo "   require('dd-trace').init({"
echo "     service: 'kealee-api',"
echo "     env: 'production',"
echo "     version: '1.0.0',"
echo "   });"
echo ""

# Check if Vercel CLI is available
if command -v vercel &> /dev/null && vercel whoami &> /dev/null; then
    echo ""
    read -p "Set Datadog environment variables in Vercel? (y/N): " SET_VERCEL
    
    if [ "$SET_VERCEL" = "y" ] || [ "$SET_VERCEL" = "Y" ]; then
        log "Setting Datadog environment variables in Vercel..."
        
        for app in "${!APP_CONFIG[@]}"; do
            if [ "$app" = "api" ]; then
                continue  # API is on Railway
            fi
            
            APP_DIR="apps/$app"
            if [ ! -d "$APP_DIR" ]; then
                continue
            fi
            
            log "Configuring $app..."
            cd "$APP_DIR"
            
            if [ -f ".vercel/project.json" ]; then
                if [ -n "$DATADOG_API_KEY" ]; then
                    echo "$DATADOG_API_KEY" | vercel env add "DATADOG_API_KEY" "production" 2>&1 | grep -q "error\|Error" || success "  DATADOG_API_KEY set"
                fi
                
                echo ""
                read -p "  Enter RUM Application ID for $app (or press Enter to skip): " RUM_APP_ID
                if [ -n "$RUM_APP_ID" ]; then
                    echo "$RUM_APP_ID" | vercel env add "NEXT_PUBLIC_DD_RUM_APPLICATION_ID" "production" 2>&1 | grep -q "error\|Error" || success "  RUM Application ID set"
                fi
                
                read -p "  Enter RUM Client Token for $app (or press Enter to skip): " RUM_TOKEN
                if [ -n "$RUM_TOKEN" ]; then
                    echo "$RUM_TOKEN" | vercel env add "NEXT_PUBLIC_DD_RUM_CLIENT_TOKEN" "production" 2>&1 | grep -q "error\|Error" || success "  RUM Client Token set"
                fi
            fi
            
            cd ../..
        done
    fi
fi

echo ""
echo "📋 Next Steps"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "1. ✅ Get Datadog credentials:"
echo "   - API Key: https://app.datadoghq.com/organization-settings/api-keys"
echo "   - RUM App ID & Token: https://app.datadoghq.com/rum/application/create"
echo ""
echo "2. ✅ Install Datadog packages in each app"
echo ""
echo "3. ✅ Configure Datadog in code (see instructions above)"
echo ""
echo "4. ✅ Set environment variables in Vercel/Railway"
echo ""
echo "5. ✅ Set up dashboards in Datadog:"
echo "   - Application Performance Monitoring"
echo "   - Real User Monitoring"
echo "   - Custom metrics and alerts"
echo ""
echo "📄 Configuration saved to: $DATADOG_CONFIG_FILE"
