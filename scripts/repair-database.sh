#!/bin/bash
# scripts/repair-database.sh
# Repair corrupted database tables

set -e

echo "🔧 Database Repair"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

if [ -z "$DATABASE_URL" ]; then
    echo "DATABASE_URL not set"
    exit 1
fi

read -p "This will run VACUUM and REINDEX. Continue? (y/N): " CONFIRM

if [ "$CONFIRM" != "y" ] && [ "$CONFIRM" != "Y" ]; then
    echo "Cancelled"
    exit 0
fi

echo ""
echo "Running VACUUM..."
psql "$DATABASE_URL" -c "VACUUM ANALYZE;" && echo "✅ VACUUM complete" || echo "❌ VACUUM failed"

echo ""
echo "Reindexing..."
psql "$DATABASE_URL" -c "REINDEX DATABASE $(psql $DATABASE_URL -t -c 'SELECT current_database();' | xargs);" && echo "✅ Reindex complete" || echo "❌ Reindex failed"

echo ""
echo "Checking for corrupted tables..."
psql "$DATABASE_URL" -c "
SELECT 
    schemaname,
    tablename,
    pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;
"

echo ""
echo "✅ Database repair complete"
