#!/bin/bash

# Create Test Users in Supabase
# Automatically creates all test user accounts for all portals

set -e

echo "🔐 Kealee Platform: Create Test Users in Supabase"
echo "=================================================="
echo ""

# Configuration
SUPABASE_URL="${SUPABASE_URL:-https://your-project.supabase.co}"
SUPABASE_ANON_KEY="${SUPABASE_ANON_KEY:-your-anon-key}"
SUPABASE_SERVICE_KEY="${SUPABASE_SERVICE_KEY:-your-service-role-key}"

# Check for environment variables
if [ -z "$SUPABASE_URL" ] || [ "$SUPABASE_URL" = "https://your-project.supabase.co" ]; then
    echo "❌ SUPABASE_URL not configured"
    echo ""
    echo "Set environment variables:"
    echo "  export SUPABASE_URL=https://your-project.supabase.co"
    echo "  export SUPABASE_ANON_KEY=your-anon-public-key"
    echo "  export SUPABASE_SERVICE_KEY=your-service-role-key"
    echo ""
    echo "Get these from Supabase dashboard:"
    echo "  Settings → API → Project URL and Keys"
    echo ""
    exit 1
fi

echo "ℹ️  Supabase Project: $SUPABASE_URL"
echo ""

# Function to create user via Supabase API
create_user() {
    local email=$1
    local password=$2
    local display_name=$3
    local role=$4

    echo "Creating user: $email ($role)..."

    # Create user via Supabase Auth API
    curl -X POST "$SUPABASE_URL/auth/v1/users" \
      -H "apikey: $SUPABASE_SERVICE_KEY" \
      -H "Content-Type: application/json" \
      -d "{
        \"email\": \"$email\",
        \"password\": \"$password\",
        \"email_confirm\": true,
        \"user_metadata\": {
          \"display_name\": \"$display_name\",
          \"role\": \"$role\"
        }
      }" \
      -s -w "\n%{http_code}\n" > /tmp/response.txt

    # Check response
    local http_code=$(tail -n 1 /tmp/response.txt)
    local body=$(head -n -1 /tmp/response.txt)

    if [ "$http_code" = "201" ]; then
        echo "  ✅ Created successfully"
        return 0
    elif [[ "$body" == *"already exists"* ]] || [ "$http_code" = "400" ]; then
        echo "  ℹ️  Already exists (skipping)"
        return 0
    else
        echo "  ❌ Error (HTTP $http_code)"
        echo "  Response: $body"
        return 1
    fi
}

# Create users for Owner Portal
echo ""
echo "📦 Owner Portal Users"
echo "────────────────────"
create_user "owner@kealee.com" "Owner123!@#" "Test Owner" "homeowner"
create_user "admin@kealee.com" "ChangeMe123!" "Admin Owner" "admin"

# Create users for Contractor Portal
echo ""
echo "🏗️  Contractor Portal Users"
echo "────────────────────────────"
create_user "contractor@kealee.com" "Contractor123!@#" "Test Contractor" "contractor"
create_user "licensed-contractor@kealee.com" "Licensed123!@#" "Licensed Contractor" "licensed_contractor"

# Create users for Developer Portal
echo ""
echo "🏢 Developer Portal Users"
echo "─────────────────────────"
create_user "architect@kealee.com" "Architect123!@#" "Test Architect" "architect"
create_user "engineer@kealee.com" "Engineer123!@#" "Test Engineer" "engineer"

# Create users for Admin Dashboard
echo ""
echo "⚙️  Admin Dashboard Users"
echo "────────────────────────"
create_user "admin-platform@kealee.com" "AdminPlatform123!@#" "Platform Admin" "super_admin"
create_user "ops@kealee.com" "Operations123!@#" "Operations Manager" "ops_manager"
create_user "support@kealee.com" "Support123!@#" "Support Agent" "support"

# Summary
echo ""
echo "════════════════════════════════════════════════"
echo "✅ Test Users Creation Complete!"
echo "════════════════════════════════════════════════"
echo ""
echo "Next steps:"
echo ""
echo "1. Go to http://localhost:3000 (Owner Portal)"
echo "2. Sign in with:"
echo "   Email: admin@kealee.com"
echo "   Password: ChangeMe123!"
echo ""
echo "3. Or use magic link:"
echo "   Click 'Magic Link' and enter email"
echo "   Check email for login link"
echo ""
echo "All test credentials saved in: USER_LOGINS.md"
echo ""
