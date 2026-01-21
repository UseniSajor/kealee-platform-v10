#!/bin/bash

set -e

echo "🚀 Deploying API to production..."

# Build
echo "📦 Building..."
npm run build

# Run migrations
echo "🗄️  Running database migrations..."
cd ../database
pnpm prisma migrate deploy
cd ../api

# Seed production data (optional - uncomment if needed)
# echo "🌱 Seeding production data..."
# npm run db:seed

# Restart service (Railway handles this automatically)
echo "✅ Deployment complete!"
echo ""
echo "Next steps:"
echo "  1. Verify health endpoint: curl https://api.kealee.com/health"
echo "  2. Check logs: railway logs"
echo "  3. Monitor: railway status"

