#!/bin/bash
# scripts/restart-all.sh
# Restart all services

set -e

echo "🔄 Restarting All Services"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# PostgreSQL
if command -v systemctl &> /dev/null; then
    echo "Restarting PostgreSQL..."
    sudo systemctl restart postgresql && echo "✅ PostgreSQL restarted" || echo "❌ Failed to restart PostgreSQL"
fi

# Redis
if command -v systemctl &> /dev/null; then
    echo "Restarting Redis..."
    sudo systemctl restart redis && echo "✅ Redis restarted" || echo "❌ Failed to restart Redis"
fi

# API Service (if using Railway)
if command -v railway &> /dev/null; then
    echo "Restarting API Service..."
    railway restart && echo "✅ API Service restarted" || echo "❌ Failed to restart API Service"
fi

echo ""
echo "✅ Service restart complete"
