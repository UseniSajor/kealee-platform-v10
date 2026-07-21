#!/bin/bash
# scripts/search-logs.sh
# Search logs for specific query

set -e

QUERY=${1:-"error"}
APP=${2:-"all"}

echo "🔍 Searching Logs"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Query: $QUERY"
echo "App: $APP"
echo ""

if [ "$APP" = "all" ]; then
    APPS=("m-marketplace" "os-admin" "os-pm" "m-ops-services" "m-project-owner" "m-architect" "m-permits-inspections")
    
    for app in "${APPS[@]}"; do
        if [ -n "$VERCEL_TOKEN" ]; then
            echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
            echo "📦 $app"
            echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
            vercel logs "$app" --token="$VERCEL_TOKEN" --since="24h" 2>/dev/null | grep -i "$QUERY" || echo "No matches"
            echo ""
        fi
    done
else
    if [ -n "$VERCEL_TOKEN" ]; then
        vercel logs "$APP" --token="$VERCEL_TOKEN" --since="24h" 2>/dev/null | grep -i "$QUERY"
    else
        echo "VERCEL_TOKEN not set"
    fi
fi
