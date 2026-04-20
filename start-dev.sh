#!/bin/bash
cd /home/tim_chamberlain/kealee-platform-v10

echo "Starting Kealee Platform v20 locally..."
echo ""
echo "Starting API server (port 3000)..."
cd services/api && pnpm dev > /tmp/api.log 2>&1 &
API_PID=$!
echo "API started with PID: $API_PID"

sleep 3

echo "Starting Web-main server (port 3024)..."
cd ../../apps/web-main && pnpm dev > /tmp/web-main.log 2>&1 &
WEB_PID=$!
echo "Web-main started with PID: $WEB_PID"

echo ""
echo "============================================"
echo "🚀 Kealee Platform Running Locally"
echo "============================================"
echo ""
echo "📱 Frontend:  http://localhost:3024"
echo "🔌 API:       http://localhost:3000"
echo "📚 API Docs:  http://localhost:3000/docs"
echo "💚 Health:    http://localhost:3000/health"
echo ""
echo "API Log:      tail -f /tmp/api.log"
echo "Web Log:      tail -f /tmp/web-main.log"
echo ""
echo "Press Ctrl+C to stop servers"
echo "============================================"
echo ""

wait
