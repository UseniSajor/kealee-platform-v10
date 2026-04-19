#!/bin/bash
set -e

# Post-Deployment Health Check Script
# Usage: ./scripts/validate-deploy.sh <service-name>
# Example: ./scripts/validate-deploy.sh kealee-api

SERVICE=${1:?Usage: validate-deploy.sh <service-name>}

# Map service to health check URL
case "$SERVICE" in
  "kealee-api")
    URL="https://api.kealee.com/health"
    ;;
  "web-main")
    URL="https://www.kealee.com/api/health"
    ;;
  "portal-owner")
    URL="https://owner.kealee.com/"
    ;;
  "portal-contractor")
    URL="https://contractor.kealee.com/"
    ;;
  "portal-developer")
    URL="https://developer.kealee.com/"
    ;;
  "command-center")
    URL="https://command.kealee.com/"
    ;;
  "admin-console")
    URL="https://admin.kealee.com/"
    ;;
  "worker")
    echo "⏭️  Worker: no HTTP health endpoint, skipping HTTP checks"
    echo "   → Monitoring in Railway dashboard: https://railway.app"
    exit 0
    ;;
  *)
    echo "❌ ERROR: Unknown service: $SERVICE"
    exit 1
    ;;
esac

echo "🏥 Health checking $SERVICE"
echo "   → URL: $URL"
echo ""

# Check health endpoint up to 12 times (2 minutes total with 10s delays)
max_attempts=12
attempt=0

while [ $attempt -lt $max_attempts ]; do
  attempt=$((attempt + 1))

  if curl -sf "$URL" > /dev/null 2>&1; then
    echo "✅ PASS: $SERVICE is healthy (attempt $attempt/$max_attempts)"
    echo ""
    echo "📊 Service Status:"
    if [[ "$URL" == *"/health" ]]; then
      curl -s "$URL" | jq . 2>/dev/null || echo "   (response received, but not JSON)"
    fi
    exit 0
  fi

  if [ $attempt -lt $max_attempts ]; then
    echo "⏳ Attempt $attempt/$max_attempts failed, retrying in 10s..."
    sleep 10
  fi
done

echo "❌ FAIL: $SERVICE did not become healthy after $max_attempts attempts (2 minutes)"
echo ""
echo "📋 Troubleshooting:"
echo "   1. Check Railway dashboard logs: https://railway.app"
echo "   2. Verify environment variables are set correctly"
echo "   3. Check database and Redis connectivity"
echo "   4. Review recent commits for breaking changes"
echo "   5. Run: ./scripts/rollback.sh $SERVICE (to revert)"
exit 1
