#!/bin/bash
# Database Migration Deployment Script
# Run this in production to apply all migrations

echo "═══════════════════════════════════════════════════════════════════"
echo "🗄️  DATABASE MIGRATION DEPLOYMENT"
echo "═══════════════════════════════════════════════════════════════════"
echo ""

# Check environment
ENV=${NODE_ENV:-development}
echo "Environment: $ENV"
echo "Database: ${DATABASE_URL//:[^:@]*@/:****@}"
echo ""

# Safety check for production
if [ "$ENV" = "production" ]; then
    echo "⚠️  WARNING: You are about to run migrations on PRODUCTION database!"
    echo ""
    read -p "Type 'CONFIRM PRODUCTION' to proceed: " CONFIRM
    
    if [ "$CONFIRM" != "CONFIRM PRODUCTION" ]; then
        echo ""
        echo "❌ Migration cancelled."
        exit 0
    fi
    echo ""
fi

# Run migrations
echo "📦 Running Prisma migrations..."
echo ""

npx prisma migrate deploy

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Migrations deployed successfully!"
    echo ""
    
    # Ask about seed data
    read -p "Run seed data? (y/n): " RUN_SEED
    
    if [ "$RUN_SEED" = "y" ] || [ "$RUN_SEED" = "Y" ]; then
        echo ""
        echo "🌱 Running seed script..."
        echo ""
        npx tsx prisma/seed-complete.ts
        echo ""
        echo "✅ Seed data complete!"
    fi
    
    echo ""
    echo "═══════════════════════════════════════════════════════════════════"
    echo "✅ Database deployment complete!"
    echo "═══════════════════════════════════════════════════════════════════"
else
    echo ""
    echo "❌ Migration failed!"
    exit 1
fi
