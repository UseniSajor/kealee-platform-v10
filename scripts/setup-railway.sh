#!/bin/bash
# scripts/setup-railway.sh
# Quick Railway setup (for basic setup, use setup-railway-environments.sh for full isolation)

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}🚂 Setting up Railway for API...${NC}"
echo ""
echo -e "${YELLOW}⚠️  NOTE: For proper staging/production isolation, use:${NC}"
echo -e "${YELLOW}   bash scripts/setup-railway-environments.sh${NC}"
echo ""
read -p "Continue with basic setup? (y/n): " CONTINUE
if [ "$CONTINUE" != "y" ] && [ "$CONTINUE" != "Y" ]; then
    echo "Setup cancelled. Run setup-railway-environments.sh for full setup."
    exit 0
fi

# Check Railway CLI
if ! command -v railway &> /dev/null; then
    echo "Installing Railway CLI..."
    npm i -g @railway/cli
fi

# Login
echo "Please login to Railway:"
railway login

# Navigate to API
cd services/api

# Link to project
echo ""
echo "Link to Railway project (or create new):"
railway link

# Set environment variables
echo ""
echo "Setting up environment variables..."
echo ""
echo -e "${YELLOW}⚠️  IMPORTANT: Ensure DATABASE_URL uses .internal hostname${NC}"
echo -e "${YELLOW}   Staging: staging-postgres.internal${NC}"
echo -e "${YELLOW}   Production: production-postgres.internal${NC}"
echo ""
echo "Please add these in Railway dashboard:"
echo "  • DATABASE_URL (use .internal hostname!)"
echo "  • SUPABASE_URL"
echo "  • SUPABASE_SERVICE_KEY"
echo "  • STRIPE_SECRET_KEY"
echo "  • STRIPE_WEBHOOK_SECRET"
echo "  • S3_ACCESS_KEY_ID"
echo "  • S3_SECRET_ACCESS_KEY"
echo "  • S3_BUCKET"
echo "  • S3_ENDPOINT"
echo "  • ANTHROPIC_API_KEY"
echo "  • RESEND_API_KEY"
echo "  • GOOGLE_MAPS_API_KEY"
echo "  • CORS_ORIGINS"
echo "  • JWT_SECRET"
echo ""
read -p "Press enter when environment variables are added..."

# Run initial deployment
echo ""
echo "Running initial deployment..."
railway up --detach

# Add custom domain
echo ""
echo "Add custom domain api.kealee.com in Railway dashboard:"
echo "Railway → Settings → Networking → Custom Domains"
echo ""
read -p "Press enter when custom domain is added..."

cd ../..

echo ""
echo -e "${GREEN}✅ Railway setup complete!${NC}"
echo ""
echo "Next steps:"
echo "1. Verify environment isolation: bash scripts/verify-railway-env-isolation.sh"
echo "2. Add CNAME record in NameBright DNS"
echo "3. Wait for SSL certificate"
echo "4. Test API: curl https://api.kealee.com/health"
echo ""
echo "📚 See RAILWAY_ENVIRONMENT_SETUP.md for complete guide"

