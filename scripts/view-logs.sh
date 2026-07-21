#!/bin/bash
# scripts/view-logs.sh
# View application logs

set -e

APP=${1:-"all"}
HOURS=${2:-24}

echo "📋 Viewing Logs"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "App: $APP"
echo "Hours: $HOURS"
echo ""

APPS=("m-marketplace" "os-admin" "os-pm" "m-ops-services" "m-project-owner" "m-architect" "m-permits-inspections")

if [ "$APP" = "all" ]; then
    for app in "${APPS[@]}"; do
        echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
        echo "📦 $app"
        echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
        
        # Check Vercel logs if token is set
        if [ -n "$VERCEL_TOKEN" ]; then
            vercel logs "$app" --token="$VERCEL_TOKEN" --since="${HOURS}h" 2>/dev/null | head -50 || echo "No logs available"
        else
            echo "VERCEL_TOKEN not set, skipping Vercel logs"
        fi
        echo ""
    done
    
    # API service logs
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo "📦 API Service"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    if command -v railway &> /dev/null; then
        railway logs --tail 2>/dev/null || echo "Railway CLI not available"
    else
        echo "Railway CLI not installed"
    fi
else
    if [ -n "$VERCEL_TOKEN" ]; then
        vercel logs "$APP" --token="$VERCEL_TOKEN" --since="${HOURS}h"
    else
        echo "VERCEL_TOKEN not set"
        echo "Set it: export VERCEL_TOKEN='your-token'"
    fi
fi
