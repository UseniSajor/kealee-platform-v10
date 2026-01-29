#!/bin/bash

VERCEL_TOKEN="a1p0t9iPEhT8gsixuZH8oFH1"

# Environment variables to set
SUPABASE_ANON_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJrcmVxZnBreGF2cXBzcWV4YmZzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njg0MDc3NzAsImV4cCI6MjA4Mzk4Mzc3MH0.Zszenm7LrN7eRKi3-htbsQX8h4ulNvdCT_F1s-v0YJk"
SUPABASE_SERVICE_ROLE_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJrcmVxZnBreGF2cXBzcWV4YmZzIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2ODQwNzc3MCwiZXhwIjoyMDgzOTgzNzcwfQ.Q5KvqmDYy4yvLqDTTZxccFOpRcz3RivkS61XwD3w5GU"
SUPABASE_URL="https://rkreqfpkxavqpsqexbfs.supabase.co"
DATABASE_URL="postgresql://postgres:nBSLJLNmWGhvnChFBVedulYdZGKWFyjj@postgres.railway.internal:5432/railway"

# Function to set env var
set_env() {
    local project_dir=$1
    local var_name=$2
    local var_value=$3

    cd "$project_dir"

    # Remove existing var if it exists (ignore errors)
    npx vercel env rm "$var_name" production --yes --token "$VERCEL_TOKEN" 2>/dev/null || true

    # Add new var
    echo "$var_value" | npx vercel env add "$var_name" production --token "$VERCEL_TOKEN" 2>&1
}

# Projects and their directories
PROJECTS=(
    "apps/m-marketplace:m-marketplace"
    "apps/os-pm:os-pm"
    "apps/m-finance-trust:m-finance-trust"
    "apps/m-architect:m-architect"
    "apps/m-ops-services:m-ops-services"
    "apps/m-permits-inspections:m-permits-inspections"
    "apps/os-admin:os-admin"
    "apps/m-project-owner:m-project-owner"
)

for project in "${PROJECTS[@]}"; do
    IFS=':' read -r dir name <<< "$project"
    echo "=== Processing $name ==="

    # Link project
    cd "/c/Kealee-Platform v10/$dir"
    npx vercel link --yes --project "$name" --token "$VERCEL_TOKEN" 2>&1

    # Set environment variables
    for var in SUPABASE_ANON_KEY SUPABASE_SERVICE_ROLE_KEY SUPABASE_URL DATABASE_URL; do
        eval "value=\$$var"
        npx vercel env rm "$var" production --yes --token "$VERCEL_TOKEN" 2>/dev/null || true
        echo "$value" | npx vercel env add "$var" production --token "$VERCEL_TOKEN" 2>&1
    done

    # Also set NEXT_PUBLIC_ versions for client-side
    npx vercel env rm "NEXT_PUBLIC_SUPABASE_ANON_KEY" production --yes --token "$VERCEL_TOKEN" 2>/dev/null || true
    echo "$SUPABASE_ANON_KEY" | npx vercel env add "NEXT_PUBLIC_SUPABASE_ANON_KEY" production --token "$VERCEL_TOKEN" 2>&1

    npx vercel env rm "NEXT_PUBLIC_SUPABASE_URL" production --yes --token "$VERCEL_TOKEN" 2>/dev/null || true
    echo "$SUPABASE_URL" | npx vercel env add "NEXT_PUBLIC_SUPABASE_URL" production --token "$VERCEL_TOKEN" 2>&1

    echo "=== Done with $name ==="
done
