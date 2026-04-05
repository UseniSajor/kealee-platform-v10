#!/bin/bash

###############################################################################
# UPDATE PORTAL API CONFIGURATION
#
# This script helps you update the Portal API configuration in Railway.
# It updates environment variables for:
#   - portal-owner
#   - portal-contractor
#   - portal-developer
#
# Usage:
#   ./scripts/update-portal-api.sh
#   ./scripts/update-portal-api.sh --api-url https://api.kealee.com
#   ./scripts/update-portal-api.sh --resend-key re_xxxxx --api-url https://api.kealee.com
#
###############################################################################

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Default values
API_URL=""
RESEND_KEY=""
RAILWAY_CLI_INSTALLED=false

# Functions
print_header() {
    echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${BLUE}$1${NC}"
    echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
}

print_success() {
    echo -e "${GREEN}✓ $1${NC}"
}

print_info() {
    echo -e "${BLUE}ℹ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠ $1${NC}"
}

print_error() {
    echo -e "${RED}✗ $1${NC}"
}

# Check prerequisites
check_prerequisites() {
    print_header "Checking Prerequisites"
    
    # Check if Railway CLI is installed
    if command -v railway &> /dev/null; then
        print_success "Railway CLI is installed"
        RAILWAY_CLI_INSTALLED=true
    else
        print_warning "Railway CLI not found"
        print_info "Install with: npm install -g @railway/cli"
        print_info "Or use Railway Dashboard to update variables manually"
        RAILWAY_CLI_INSTALLED=false
    fi
}

# Parse arguments
parse_args() {
    while [[ $# -gt 0 ]]; do
        case $1 in
            --api-url)
                API_URL="$2"
                shift 2
                ;;
            --resend-key)
                RESEND_KEY="$2"
                shift 2
                ;;
            --help)
                print_usage
                exit 0
                ;;
            *)
                print_error "Unknown argument: $1"
                print_usage
                exit 1
                ;;
        esac
    done
}

# Print usage
print_usage() {
    cat << EOF
Usage: ./scripts/update-portal-api.sh [OPTIONS]

Options:
    --api-url URL           Set the API URL (e.g., https://api.kealee.com)
    --resend-key KEY        Set the Resend API key (e.g., re_xxxx)
    --help                  Print this help message

Examples:
    # Interactive mode (you'll be prompted for values)
    ./scripts/update-portal-api.sh

    # With arguments
    ./scripts/update-portal-api.sh --api-url https://api.kealee.com --resend-key re_xxxxx

    # Partial update
    ./scripts/update-portal-api.sh --api-url https://api.kealee.com

EOF
}

# Interactive input if no args provided
get_user_input() {
    if [ -z "$API_URL" ]; then
        echo -e "${YELLOW}Enter API URL (e.g., https://api.kealee.com):${NC}"
        read -r API_URL
        if [ -z "$API_URL" ]; then
            print_error "API URL is required"
            exit 1
        fi
    fi
    
    if [ -z "$RESEND_KEY" ]; then
        echo -e "${YELLOW}Enter Resend API Key (press Enter to skip):${NC}"
        read -rs RESEND_KEY
        echo ""
    fi
}

# Validate URLs
validate_api_url() {
    if [[ ! $API_URL =~ ^https?:// ]]; then
        print_error "API URL must start with http:// or https://"
        exit 1
    fi
    print_success "API URL validated: $API_URL"
}

validate_resend_key() {
    if [ -n "$RESEND_KEY" ] && [[ ! $RESEND_KEY =~ ^re_ ]]; then
        print_warning "Resend key should start with 're_'"
    fi
}

# Display configuration
show_config() {
    print_header "Configuration Summary"
    
    echo ""
    echo "API Configuration:"
    echo "  NEXT_PUBLIC_API_URL=$API_URL"
    echo ""
    
    if [ -n "$RESEND_KEY" ]; then
        echo "Email Configuration:"
        echo "  RESEND_API_KEY=re_[REDACTED]"
        echo "  RESEND_FROM_EMAIL=Kealee Platform <noreply@kealee.com>"
        echo ""
    else
        print_warning "No Resend key provided (email features will be disabled)"
        echo ""
    fi
}

# Update via Railway CLI
update_via_cli() {
    if [ "$RAILWAY_CLI_INSTALLED" = false ]; then
        print_warning "Railway CLI not installed, skipping CLI update"
        return
    fi
    
    print_header "Updating Portal Services via Railway CLI"
    
    PORTALS=("portal-owner" "portal-contractor" "portal-developer")
    
    for portal in "${PORTALS[@]}"; do
        echo ""
        print_info "Updating $portal..."
        
        # Link to service (if not already linked)
        # railway service select might be needed here, but we'll just set variables
        
        # Set API URL
        print_info "  Setting NEXT_PUBLIC_API_URL..."
        # This would require being in the right context, so we'll show instructions instead
        
        echo -e "${YELLOW}Note: Railway CLI variable updates require service context.${NC}"
        echo -e "${YELLOW}Please use Railway Dashboard instead, or run from service directory.${NC}"
    done
}

# Generate manual update instructions
generate_manual_instructions() {
    print_header "Manual Update Instructions (Railway Dashboard)"
    
    PORTALS=("portal-owner" "portal-contractor" "portal-developer")
    
    for portal in "${PORTALS[@]}"; do
        echo ""
        echo -e "${YELLOW}=== $portal ===${NC}"
        echo "1. Open: https://railway.app → Your Project"
        echo "2. Click on '$portal' service"
        echo "3. Click 'Variables' tab"
        echo "4. Click 'Add Variable' and add:"
        echo ""
        echo "   Key: NEXT_PUBLIC_API_URL"
        echo "   Value: $API_URL"
        echo ""
        
        if [ -n "$RESEND_KEY" ]; then
            echo "   Key: RESEND_API_KEY"
            echo "   Value: $RESEND_KEY"
            echo ""
            echo "   Key: RESEND_FROM_EMAIL"
            echo "   Value: Kealee Platform <noreply@kealee.com>"
            echo ""
        fi
        
        echo "5. Click 'Deploy' → 'Trigger Deploy'"
        echo "6. Wait for deployment to complete (2-5 minutes)"
        echo ""
    done
}

# Generate .env files locally
generate_env_files() {
    print_header "Generating Local .env Files"
    
    PORTALS=("portal-owner" "portal-contractor" "portal-developer")
    
    for portal in "${PORTALS[@]}"; do
        env_file="apps/$portal/.env.local"
        
        print_info "Creating $env_file..."
        
        cat > "$env_file" << EOF
# Portal API Configuration (Development)
# WARNING: Never commit .env.local files to git

NEXT_PUBLIC_API_URL=$API_URL
EOF
        
        if [ -n "$RESEND_KEY" ]; then
            echo "RESEND_API_KEY=$RESEND_KEY" >> "$env_file"
            echo "RESEND_FROM_EMAIL=Kealee Platform <noreply@kealee.com>" >> "$env_file"
        fi
        
        print_success "Created $env_file"
    done
}

# Verify the setup
verify_setup() {
    print_header "Setup Verification Checklist"
    
    echo ""
    echo "After updating variables, verify your setup:"
    echo ""
    echo "Checklist:"
    echo "  [ ] Updated NEXT_PUBLIC_API_URL in Railway dashboard"
    if [ -n "$RESEND_KEY" ]; then
        echo "  [ ] Updated RESEND_API_KEY in Railway dashboard"
        echo "  [ ] Updated RESEND_FROM_EMAIL in Railway dashboard"
    fi
    echo "  [ ] Triggered deployments for all 3 portals"
    echo "  [ ] Deployments completed (2-5 minutes each)"
    echo "  [ ] Cleared browser cache (Cmd+Shift+Delete)"
    echo "  [ ] Tested portal connectivity"
    echo ""
    echo "Testing:"
    echo "  1. Open a portal URL (https://portal-owner.app/)"
    echo "  2. Open DevTools → Network tab"
    echo "  3. Look for /api/v1/* requests"
    echo "  4. Verify 200 responses (not 404 or errors)"
    echo ""
}

# Main flow
main() {
    print_header "Kealee Portal API Configuration"
    
    parse_args "$@"
    check_prerequisites
    get_user_input
    validate_api_url
    validate_resend_key
    
    show_config
    
    echo ""
    echo -e "${YELLOW}How would you like to update?${NC}"
    echo "1) Generate manual instructions (Railway Dashboard)"
    echo "2) Generate local .env files (for development)"
    echo "3) Both"
    echo ""
    read -p "Choose [1-3]: " choice
    
    case $choice in
        1)
            generate_manual_instructions
            ;;
        2)
            generate_env_files
            ;;
        3)
            generate_manual_instructions
            echo ""
            generate_env_files
            ;;
        *)
            print_error "Invalid choice"
            exit 1
            ;;
    esac
    
    verify_setup
    print_success "Done! Follow the checklist above to complete setup."
}

# Run main function
main "$@"
