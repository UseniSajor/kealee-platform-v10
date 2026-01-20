#!/bin/bash
# scripts/restart-service.sh
# Restart specific service

set -e

SERVICE=${1:-""}

if [ -z "$SERVICE" ]; then
    echo "Usage: ./scripts/restart-service.sh --service=<service>"
    echo "Services: postgresql, redis, api"
    exit 1
fi

echo "🔄 Restarting Service: $SERVICE"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

case $SERVICE in
    postgresql)
        if command -v systemctl &> /dev/null; then
            sudo systemctl restart postgresql && echo "✅ PostgreSQL restarted" || echo "❌ Failed"
        else
            echo "systemctl not available"
        fi
        ;;
    redis)
        if command -v systemctl &> /dev/null; then
            sudo systemctl restart redis && echo "✅ Redis restarted" || echo "❌ Failed"
        else
            echo "systemctl not available"
        fi
        ;;
    api)
        if command -v railway &> /dev/null; then
            railway restart && echo "✅ API Service restarted" || echo "❌ Failed"
        else
            echo "Railway CLI not available"
        fi
        ;;
    *)
        echo "Unknown service: $SERVICE"
        exit 1
        ;;
esac
