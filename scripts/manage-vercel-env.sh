#!/bin/bash
# scripts/manage-vercel-env.sh
# Manage Vercel environment variables

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m'

log() {
    echo -e "${BLUE}[VERCEL ENV]${NC} $1"
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

info() {
    echo -e "${CYAN}ℹ️${NC} $1"
}

# Check Vercel CLI
if ! command -v vercel &> /dev/null; then
    fail "Vercel CLI is not installed"
    info "Install: npm install -g vercel"
    exit 1
fi

# Check Vercel token
if [ -z "$VERCEL_TOKEN" ]; then
    warn "VERCEL_TOKEN is not set"
    info "Set it: export VERCEL_TOKEN='your-token'"
    info "Or login: vercel login"
    
    if ! vercel whoami > /dev/null 2>&1; then
        fail "Not logged in to Vercel"
        info "Login: vercel login"
        exit 1
    fi
    success "Using Vercel login session"
else
    success "Using VERCEL_TOKEN"
fi

# Applications
APPS=(
    "m-marketplace"
    "os-admin"
    "os-pm"
    "m-ops-services"
    "m-project-owner"
    "m-architect"
    "m-permits-inspections"
)

# Function to list environment variables
list_env_vars() {
    local app=$1
    local env=${2:-"production"}
    
    log "Listing $env environment variables for $app..."
    
    if [ -n "$VERCEL_TOKEN" ]; then
        vercel env ls "$app" --environment="$env" --token="$VERCEL_TOKEN" 2>/dev/null || {
            warn "Could not list variables (project may not be linked)"
            return 1
        }
    else
        cd "apps/$app" 2>/dev/null || {
            warn "App directory not found: apps/$app"
            return 1
        }
        vercel env ls --environment="$env" 2>/dev/null || {
            warn "Could not list variables (project may not be linked)"
            cd ../..
            return 1
        }
        cd ../..
    fi
}

# Function to add environment variable
add_env_var() {
    local app=$1
    local var_name=$2
    local var_value=$3
    local env=${4:-"production"}
    
    log "Adding $var_name to $app ($env)..."
    
    if [ -z "$var_value" ]; then
        read -sp "Enter value for $var_name: " var_value
        echo ""
    fi
    
    if [ -n "$VERCEL_TOKEN" ]; then
        if echo "$var_value" | vercel env add "$var_name" "$env" --token="$VERCEL_TOKEN" --scope="$app" 2>/dev/null; then
            success "Added $var_name to $app ($env)"
        else
            # Try without scope
            if echo "$var_value" | vercel env add "$var_name" "$env" --token="$VERCEL_TOKEN" 2>/dev/null; then
                success "Added $var_name to $app ($env)"
            else
                fail "Failed to add $var_name"
                return 1
            fi
        fi
    else
        cd "apps/$app" 2>/dev/null || {
            fail "App directory not found: apps/$app"
            return 1
        }
        if echo "$var_value" | vercel env add "$var_name" "$env" 2>/dev/null; then
            success "Added $var_name to $app ($env)"
        else
            fail "Failed to add $var_name"
            cd ../..
            return 1
        fi
        cd ../..
    fi
}

# Function to remove environment variable
remove_env_var() {
    local app=$1
    local var_name=$2
    local env=${3:-"production"}
    
    log "Removing $var_name from $app ($env)..."
    
    read -p "Are you sure you want to remove $var_name? (y/N): " CONFIRM
    if [ "$CONFIRM" != "y" ] && [ "$CONFIRM" != "Y" ]; then
        info "Cancelled"
        return 0
    fi
    
    if [ -n "$VERCEL_TOKEN" ]; then
        if vercel env rm "$var_name" "$env" --token="$VERCEL_TOKEN" --yes 2>/dev/null; then
            success "Removed $var_name from $app ($env)"
        else
            fail "Failed to remove $var_name"
            return 1
        fi
    else
        cd "apps/$app" 2>/dev/null || {
            fail "App directory not found: apps/$app"
            return 1
        }
        if vercel env rm "$var_name" "$env" --yes 2>/dev/null; then
            success "Removed $var_name from $app ($env)"
        else
            fail "Failed to remove $var_name"
            cd ../..
            return 1
        fi
        cd ../..
    fi
}

# Function to pull environment variables
pull_env_vars() {
    local app=$1
    local env=${2:-"production"}
    
    log "Pulling $env environment variables for $app..."
    
    if [ -d "apps/$app" ]; then
        cd "apps/$app"
        if vercel env pull ".env.$env" --environment="$env" 2>/dev/null; then
            success "Pulled environment variables to .env.$env"
        else
            fail "Failed to pull environment variables"
            cd ../..
            return 1
        fi
        cd ../..
    else
        fail "App directory not found: apps/$app"
        return 1
    fi
}

# Main menu
echo "🔐 Vercel Environment Variables Manager"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "Select action:"
echo "  1) List environment variables"
echo "  2) Add environment variable"
echo "  3) Remove environment variable"
echo "  4) Pull environment variables"
echo "  5) List all apps' variables"
echo ""
read -p "Enter choice (1-5): " ACTION

case $ACTION in
    1)
        echo ""
        echo "Select app:"
        for i in "${!APPS[@]}"; do
            echo "  $((i+1))) ${APPS[$i]}"
        done
        read -p "Enter choice: " APP_CHOICE
        APP=${APPS[$((APP_CHOICE-1))]}
        
        echo ""
        echo "Select environment:"
        echo "  1) production"
        echo "  2) preview"
        echo "  3) development"
        read -p "Enter choice (1-3): " ENV_CHOICE
        case $ENV_CHOICE in
            1) ENV="production" ;;
            2) ENV="preview" ;;
            3) ENV="development" ;;
            *) ENV="production" ;;
        esac
        
        list_env_vars "$APP" "$ENV"
        ;;
    2)
        echo ""
        echo "Select app:"
        for i in "${!APPS[@]}"; do
            echo "  $((i+1))) ${APPS[$i]}"
        done
        read -p "Enter choice: " APP_CHOICE
        APP=${APPS[$((APP_CHOICE-1))]}
        
        echo ""
        echo "Select environment:"
        echo "  1) production"
        echo "  2) preview"
        echo "  3) development"
        read -p "Enter choice (1-3): " ENV_CHOICE
        case $ENV_CHOICE in
            1) ENV="production" ;;
            2) ENV="preview" ;;
            3) ENV="development" ;;
            *) ENV="production" ;;
        esac
        
        read -p "Variable name: " VAR_NAME
        read -sp "Variable value (leave empty to enter securely): " VAR_VALUE
        echo ""
        
        add_env_var "$APP" "$VAR_NAME" "$VAR_VALUE" "$ENV"
        ;;
    3)
        echo ""
        echo "Select app:"
        for i in "${!APPS[@]}"; do
            echo "  $((i+1))) ${APPS[$i]}"
        done
        read -p "Enter choice: " APP_CHOICE
        APP=${APPS[$((APP_CHOICE-1))]}
        
        echo ""
        echo "Select environment:"
        echo "  1) production"
        echo "  2) preview"
        echo "  3) development"
        read -p "Enter choice (1-3): " ENV_CHOICE
        case $ENV_CHOICE in
            1) ENV="production" ;;
            2) ENV="preview" ;;
            3) ENV="development" ;;
            *) ENV="production" ;;
        esac
        
        read -p "Variable name to remove: " VAR_NAME
        
        remove_env_var "$APP" "$VAR_NAME" "$ENV"
        ;;
    4)
        echo ""
        echo "Select app:"
        for i in "${!APPS[@]}"; do
            echo "  $((i+1))) ${APPS[$i]}"
        done
        read -p "Enter choice: " APP_CHOICE
        APP=${APPS[$((APP_CHOICE-1))]}
        
        echo ""
        echo "Select environment:"
        echo "  1) production"
        echo "  2) preview"
        echo "  3) development"
        read -p "Enter choice (1-3): " ENV_CHOICE
        case $ENV_CHOICE in
            1) ENV="production" ;;
            2) ENV="preview" ;;
            3) ENV="development" ;;
            *) ENV="production" ;;
        esac
        
        pull_env_vars "$APP" "$ENV"
        ;;
    5)
        echo ""
        echo "Select environment:"
        echo "  1) production"
        echo "  2) preview"
        echo "  3) development"
        read -p "Enter choice (1-3): " ENV_CHOICE
        case $ENV_CHOICE in
            1) ENV="production" ;;
            2) ENV="preview" ;;
            3) ENV="development" ;;
            *) ENV="production" ;;
        esac
        
        echo ""
        for app in "${APPS[@]}"; do
            echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
            echo "📦 $app ($ENV)"
            echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
            list_env_vars "$app" "$ENV"
            echo ""
        done
        ;;
    *)
        fail "Invalid choice"
        exit 1
        ;;
esac

echo ""
success "Operation complete"
