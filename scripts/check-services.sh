#!/bin/bash
# scripts/check-services.sh
# Quick service status check script

set -e

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo "🔍 Service Status Check"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# PostgreSQL
echo -n "PostgreSQL: "
if pg_isready -q 2>/dev/null; then
    echo -e "${GREEN}✅ Running${NC}"
else
    echo -e "${RED}❌ Not Running${NC}"
fi

# Redis
echo -n "Redis: "
if redis-cli ping > /dev/null 2>&1; then
    echo -e "${GREEN}✅ Running${NC}"
else
    echo -e "${RED}❌ Not Running${NC}"
fi

# API Service
echo -n "API Service: "
if curl -s http://localhost:3000/health > /dev/null 2>&1; then
    echo -e "${GREEN}✅ Running${NC}"
else
    echo -e "${RED}❌ Not Running${NC}"
fi

# Environment Variables
echo -n "DATABASE_URL: "
if [ -n "$DATABASE_URL" ]; then
    echo -e "${GREEN}✅ Set${NC}"
else
    echo -e "${YELLOW}⚠️  Not Set${NC}"
fi

# Vercel
echo -n "Vercel CLI: "
if command -v vercel &> /dev/null; then
    if vercel whoami > /dev/null 2>&1; then
        USER=$(vercel whoami)
        echo -e "${GREEN}✅ Logged in as $USER${NC}"
    else
        echo -e "${YELLOW}⚠️  Not Logged In${NC}"
    fi
else
    echo -e "${RED}❌ Not Installed${NC}"
fi

echo ""
echo "For detailed troubleshooting: ./scripts/troubleshoot.sh"
