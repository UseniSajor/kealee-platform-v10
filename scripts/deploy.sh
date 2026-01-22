#!/bin/bash

# One-Click Deploy Script for Kealee Platform
# Usage: ./scripts/deploy.sh [staging|production|promote]

set -e

ENVIRONMENT=${1:-staging}
RAILWAY_PROJECT_ID=${RAILWAY_PROJECT_ID:-""}

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🚀 Kealee Platform Deployment${NC}"
echo -e "${BLUE}============================${NC}\n"

# Check if Railway CLI is installed
if ! command -v railway &> /dev/null; then
    echo -e "${YELLOW}⚠️  Railway CLI not found. Installing...${NC}"
    npm install -g @railway/cli
fi

# Check if logged in
if ! railway whoami &> /dev/null; then
    echo -e "${YELLOW}⚠️  Not logged into Railway. Please login:${NC}"
    railway login
fi

case $ENVIRONMENT in
    staging)
        echo -e "${GREEN}📦 Deploying to STAGING...${NC}"
        railway up --service api-staging --detach
        echo -e "${GREEN}✅ Staging deployment initiated${NC}"
        ;;
    production)
        echo -e "${RED}🚨 Deploying to PRODUCTION...${NC}"
        read -p "Are you sure you want to deploy to production? (yes/no): " confirm
        if [ "$confirm" != "yes" ]; then
            echo -e "${YELLOW}❌ Deployment cancelled${NC}"
            exit 1
        fi
        railway up --service api-production --detach
        echo -e "${GREEN}✅ Production deployment initiated${NC}"
        ;;
    promote)
        echo -e "${GREEN}⬆️  Promoting STAGING to PRODUCTION...${NC}"
        read -p "This will promote the latest staging deployment to production. Continue? (yes/no): " confirm
        if [ "$confirm" != "yes" ]; then
            echo -e "${YELLOW}❌ Promotion cancelled${NC}"
            exit 1
        fi
        railway promote --service api-production --from api-staging
        echo -e "${GREEN}✅ Promotion completed${NC}"
        ;;
    *)
        echo -e "${RED}❌ Invalid environment: $ENVIRONMENT${NC}"
        echo "Usage: ./scripts/deploy.sh [staging|production|promote]"
        exit 1
        ;;
esac

echo -e "\n${BLUE}📊 Check deployment status:${NC}"
echo "railway status --service api-${ENVIRONMENT}"




