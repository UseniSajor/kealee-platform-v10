#!/bin/bash
# scripts/tail-logs.sh
# Monitor real-time logs

set -e

APP=${1:-"api"}

echo "👀 Tailing Logs: $APP"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Press Ctrl+C to stop"
echo ""

if [ "$APP" = "api" ]; then
    if command -v railway &> /dev/null; then
        railway logs --tail
    else
        echo "Railway CLI not installed"
        echo "Install: npm install -g @railway/cli"
    fi
else
    if [ -n "$VERCEL_TOKEN" ]; then
        vercel logs "$APP" --token="$VERCEL_TOKEN" --follow
    else
        echo "VERCEL_TOKEN not set"
    fi
fi
