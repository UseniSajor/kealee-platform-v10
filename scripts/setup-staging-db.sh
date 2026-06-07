#!/bin/bash

# Kealee Platform Staging Database Setup Script
# Automates Supabase staging project creation and configuration

set -e

echo "🚀 Kealee Platform Staging Database Setup"
echo "=========================================="
echo ""

# Configuration
SUPABASE_ORG="${SUPABASE_ORG:-}"
SUPABASE_PROJECT_NAME="kealee-staging"
SUPABASE_REGION="us-east-1"  # Change to match production

# Check for Supabase CLI
if ! command -v supabase &> /dev/null; then
    echo "❌ Supabase CLI not found"
    echo "Install from: https://github.com/supabase/cli"
    echo ""
    echo "Quick install:"
    echo "  macOS:  brew install supabase/tap/supabase"
    echo "  Linux:  curl -fsSL https://cli.supabase.io/install.sh | bash"
    echo "  Windows: scoop install supabase"
    exit 1
fi

echo "✅ Supabase CLI found"
echo ""

# Step 1: Check authentication
echo "📋 Checking Supabase authentication..."
if ! supabase projects list &> /dev/null; then
    echo "❌ Not authenticated with Supabase"
    echo ""
    echo "Run: supabase login"
    echo "Then re-run this script"
    exit 1
fi

echo "✅ Authenticated with Supabase"
echo ""

# Step 2: Create staging project via CLI
echo "🔨 Creating staging project in Supabase..."
echo "   Name: $SUPABASE_PROJECT_NAME"
echo "   Region: $SUPABASE_REGION"
echo ""

# Note: Supabase CLI doesn't support creating projects directly
# Must be created via dashboard or API
echo "⚠️  Manual step required:"
echo ""
echo "1. Go to https://app.supabase.com"
echo "2. Click 'New Project'"
echo "3. Configure:"
echo "   - Name: $SUPABASE_PROJECT_NAME"
echo "   - Region: $SUPABASE_REGION (same as production)"
echo "   - Database Password: [Generate and save securely]"
echo "4. Wait 5 minutes for initialization"
echo ""
echo "When ready, press ENTER to continue..."
read -r

# Step 3: Get connection string
echo ""
echo "📝 Getting connection details..."
echo ""
echo "From the Supabase dashboard:"
echo "1. Go to: Settings → Database → Connection Pooling"
echo "2. Copy the connection string (PostgreSQL)"
echo "3. Paste below:"
echo ""
read -p "DATABASE_URL: " STAGING_DATABASE_URL

if [ -z "$STAGING_DATABASE_URL" ]; then
    echo "❌ No connection string provided"
    exit 1
fi

echo ""
echo "✅ Connection string saved"
echo ""

# Step 4: Test connection
echo "🧪 Testing database connection..."
if psql "$STAGING_DATABASE_URL" -c "SELECT 1" > /dev/null 2>&1; then
    echo "✅ Connection successful"
else
    echo "❌ Connection failed"
    echo "Check your connection string and try again"
    exit 1
fi

echo ""

# Step 5: Create environment file
echo "📄 Creating .env.staging file..."

cat > packages/database/.env.staging << EOF
# Staging Database Environment
DATABASE_URL="$STAGING_DATABASE_URL"
ENVIRONMENT=staging
EOF

echo "✅ Created packages/database/.env.staging"
echo ""

# Step 6: Run migrations
echo "🔄 Running database migrations..."
echo ""

export DATABASE_URL="$STAGING_DATABASE_URL"

cd packages/database

# Generate Prisma client
echo "  Generating Prisma client..."
npx prisma generate

# Apply migrations
echo "  Applying migrations..."
npx prisma migrate deploy

echo ""
echo "✅ Migrations complete"
echo ""

# Step 7: Verify schema
echo "📊 Verifying schema..."

AGENTIC_TABLES=$(psql "$STAGING_DATABASE_URL" -t -c "
  SELECT count(*) FROM information_schema.tables
  WHERE table_name IN ('agentic_job_executions', 'tool_execution_logs', 'browser_audit_events', 'agentic_session_memories')
")

if [ "$AGENTIC_TABLES" -eq 4 ]; then
    echo "✅ All agentic tables created"
else
    echo "⚠️  Only $AGENTIC_TABLES/4 agentic tables found"
fi

echo ""

# Step 8: Create .env.railway
echo "📋 Creating Railway environment configuration..."
echo ""
echo "Add these to Railway dashboard (Variables):"
echo ""
echo "Staging Environment:"
echo "  DATABASE_URL=$STAGING_DATABASE_URL"
echo "  NODE_ENV=staging"
echo "  APP_ENV=staging"
echo ""

# Step 9: Summary
echo "=========================================="
echo "✅ Staging Database Setup Complete!"
echo "=========================================="
echo ""
echo "Next steps:"
echo ""
echo "1. Save staging database credentials securely"
echo "2. In Railway dashboard:"
echo "   - Create 'staging' environment"
echo "   - Set DATABASE_URL to the connection string above"
echo "   - Set NODE_ENV=staging, APP_ENV=staging"
echo ""
echo "3. Deploy staging environment:"
echo "   railway up --environment staging"
echo ""
echo "4. Keep this connection string for later:"
echo "   $STAGING_DATABASE_URL"
echo ""
