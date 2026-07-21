#!/bin/bash
set -e

echo "🌍 Starting DMV Data Seeding"
echo "============================"
echo ""

cd packages/database

echo "📦 Generating Prisma client..."
npx prisma generate --schema=./prisma/schema.prisma || pnpm exec prisma generate --schema=./prisma/schema.prisma

echo ""
echo "🌱 Seeding Maryland (15 counties)..."
npx tsx scripts/seed-gis-data.ts --state MD

echo ""
echo "🌱 Seeding Virginia (13 DMV counties)..."
npx tsx scripts/seed-gis-data.ts --state VA

echo ""
echo "🌱 Seeding DC (District of Columbia)..."
npx tsx scripts/seed-gis-data.ts --state DC

echo ""
echo "✅ DMV Data Seeding Complete!"
echo "============================"
echo ""
echo "Next steps:"
echo "1. Verify data: psql your_database -c 'SELECT COUNT(*) FROM \"Parcel\";'"
echo "2. Test PermitBot with real jurisdiction data"
echo "3. Monitor real-time growth dashboard"
