#!/bin/bash
# Stripe Production Setup Verification Script
# Verifies that all Stripe LIVE configuration is correct

set -e

echo "=========================================="
echo "Stripe Production Setup Verification"
echo "=========================================="
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

ERRORS=0
WARNINGS=0

# Check if Stripe CLI is installed
if ! command -v stripe &> /dev/null; then
    echo -e "${YELLOW}⚠${NC} Stripe CLI not installed (optional for testing)"
    echo "   Install: https://stripe.com/docs/stripe-cli"
    WARNINGS=$((WARNINGS + 1))
else
    echo -e "${GREEN}✓${NC} Stripe CLI installed"
fi

echo ""

# Check environment variables
echo "Checking Environment Variables..."
echo "----------------------------------------"

# Railway API variables
echo "Railway (API Service):"
if [ -z "$STRIPE_SECRET_KEY" ]; then
    echo -e "${RED}✗${NC} STRIPE_SECRET_KEY not set"
    ERRORS=$((ERRORS + 1))
else
    if [[ $STRIPE_SECRET_KEY == sk_live_* ]]; then
        echo -e "${GREEN}✓${NC} STRIPE_SECRET_KEY is LIVE key"
    else
        echo -e "${RED}✗${NC} STRIPE_SECRET_KEY is not a LIVE key (should start with sk_live_)"
        ERRORS=$((ERRORS + 1))
    fi
fi

if [ -z "$STRIPE_PUBLISHABLE_KEY" ]; then
    echo -e "${RED}✗${NC} STRIPE_PUBLISHABLE_KEY not set"
    ERRORS=$((ERRORS + 1))
else
    if [[ $STRIPE_PUBLISHABLE_KEY == pk_live_* ]]; then
        echo -e "${GREEN}✓${NC} STRIPE_PUBLISHABLE_KEY is LIVE key"
    else
        echo -e "${RED}✗${NC} STRIPE_PUBLISHABLE_KEY is not a LIVE key (should start with pk_live_)"
        ERRORS=$((ERRORS + 1))
    fi
fi

if [ -z "$STRIPE_WEBHOOK_SECRET" ]; then
    echo -e "${RED}✗${NC} STRIPE_WEBHOOK_SECRET not set"
    ERRORS=$((ERRORS + 1))
else
    if [[ $STRIPE_WEBHOOK_SECRET == whsec_* ]]; then
        echo -e "${GREEN}✓${NC} STRIPE_WEBHOOK_SECRET is set"
    else
        echo -e "${RED}✗${NC} STRIPE_WEBHOOK_SECRET format incorrect (should start with whsec_)"
        ERRORS=$((ERRORS + 1))
    fi
fi

echo ""

# Check product/price IDs
echo "Stripe Product/Price IDs:"
PACKAGES=("A" "B" "C" "D")
for PACKAGE in "${PACKAGES[@]}"; do
    PRODUCT_VAR="STRIPE_PRODUCT_PACKAGE_${PACKAGE}"
    PRICE_VAR="STRIPE_PRICE_PACKAGE_${PACKAGE}_MONTHLY"
    
    PRODUCT_ID="${!PRODUCT_VAR}"
    PRICE_ID="${!PRICE_VAR}"
    
    if [ -z "$PRODUCT_ID" ]; then
        echo -e "${RED}✗${NC} ${PRODUCT_VAR} not set"
        ERRORS=$((ERRORS + 1))
    else
        if [[ $PRODUCT_ID == prod_* ]]; then
            echo -e "${GREEN}✓${NC} ${PRODUCT_VAR} is set: ${PRODUCT_ID:0:20}..."
        else
            echo -e "${RED}✗${NC} ${PRODUCT_VAR} format incorrect (should start with prod_)"
            ERRORS=$((ERRORS + 1))
        fi
    fi
    
    if [ -z "$PRICE_ID" ]; then
        echo -e "${RED}✗${NC} ${PRICE_VAR} not set"
        ERRORS=$((ERRORS + 1))
    else
        if [[ $PRICE_ID == price_* ]]; then
            echo -e "${GREEN}✓${NC} ${PRICE_VAR} is set: ${PRICE_ID:0:20}..."
        else
            echo -e "${RED}✗${NC} ${PRICE_VAR} format incorrect (should start with price_)"
            ERRORS=$((ERRORS + 1))
        fi
    fi
done

echo ""

# Check Vercel variables (if checking from local)
if [ -f ".env.local" ] || [ -f ".env" ]; then
    echo "Local Environment (Vercel):"
    if grep -q "NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY" .env.local 2>/dev/null || grep -q "NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY" .env 2>/dev/null; then
        PUB_KEY=$(grep "NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY" .env.local 2>/dev/null || grep "NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY" .env 2>/dev/null | cut -d '=' -f2)
        if [[ $PUB_KEY == pk_live_* ]]; then
            echo -e "${GREEN}✓${NC} NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY is LIVE key"
        else
            echo -e "${YELLOW}⚠${NC} NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY may not be LIVE key"
            WARNINGS=$((WARNINGS + 1))
        fi
    else
        echo -e "${YELLOW}⚠${NC} NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY not found in local .env"
        echo "   (This should be set in Vercel dashboard)"
        WARNINGS=$((WARNINGS + 1))
    fi
fi

echo ""

# Summary
echo "=========================================="
if [ $ERRORS -eq 0 ]; then
    echo -e "${GREEN}✓ All critical checks passed!${NC}"
    if [ $WARNINGS -gt 0 ]; then
        echo -e "${YELLOW}⚠ ${WARNINGS} warning(s)${NC}"
    fi
    echo ""
    echo "Next steps:"
    echo "1. Verify products in Stripe Dashboard"
    echo "2. Test webhook endpoint"
    echo "3. Create test subscription"
    echo "4. Run seed script: npm run db:seed"
    exit 0
else
    echo -e "${RED}✗ ${ERRORS} error(s) found${NC}"
    if [ $WARNINGS -gt 0 ]; then
        echo -e "${YELLOW}⚠ ${WARNINGS} warning(s)${NC}"
    fi
    echo ""
    echo "Please fix errors before proceeding with production setup."
    exit 1
fi
