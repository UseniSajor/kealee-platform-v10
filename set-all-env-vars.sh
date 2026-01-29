#!/bin/bash

VERCEL_TOKEN="a1p0t9iPEhT8gsixuZH8oFH1"
TEAM_ID="ottoway-5abe7e76"

# Environment variables
SUPABASE_ANON_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJrcmVxZnBreGF2cXBzcWV4YmZzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njg0MDc3NzAsImV4cCI6MjA4Mzk4Mzc3MH0.Zszenm7LrN7eRKi3-htbsQX8h4ulNvdCT_F1s-v0YJk"
SUPABASE_SERVICE_ROLE_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJrcmVxZnBreGF2cXBzcWV4YmZzIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2ODQwNzc3MCwiZXhwIjoyMDgzOTgzNzcwfQ.Q5KvqmDYy4yvLqDTTZxccFOpRcz3RivkS61XwD3w5GU"
SUPABASE_URL="https://rkreqfpkxavqpsqexbfs.supabase.co"
DATABASE_URL="postgresql://postgres:nBSLJLNmWGhvnChFBVedulYdZGKWFyjj@postgres.railway.internal:5432/railway"

# Project IDs mapping
declare -A PROJECTS=(
    ["m-marketplace"]="prj_9ePw8wILMqA6JR2xRL2cqgY3qtpA"
    ["os-pm"]="prj_Gvl5VSnBKGakM8XwnaSBfhdeTzmh"
    ["m-finance-trust"]="prj_97KvQFcqpfvBb0CzOPZfloxjKW0G"
    ["m-architect"]="prj_rIh2GQYado50TxqYs28zeOTyKnmI"
    ["m-ops-services"]="prj_GMjf9Pemf0Dj2v1sCCZCyu3v1kH2"
    ["m-permits-inspections"]="prj_dC8s3B8VgBl6qxoEKuhk9HzEZ96R"
    ["os-admin"]="prj_ikPZKt7vf70BxpzES0TtuAD0ZkgW"
    ["m-project-owner"]="prj_CYVVuRfpfvrZ8dhlA1dnEXDR9vnz"
)

add_env_var() {
    local project_id=$1
    local key=$2
    local value=$3

    curl -s -X POST "https://api.vercel.com/v10/projects/${project_id}/env?teamId=${TEAM_ID}" \
      -H "Authorization: Bearer ${VERCEL_TOKEN}" \
      -H "Content-Type: application/json" \
      -d "{
        \"key\": \"${key}\",
        \"value\": \"${value}\",
        \"target\": [\"production\", \"preview\", \"development\"],
        \"type\": \"encrypted\"
      }" 2>&1 | grep -o '"key":"[^"]*"' | head -1
}

for project_name in "${!PROJECTS[@]}"; do
    project_id="${PROJECTS[$project_name]}"
    echo "=== Setting env vars for $project_name ($project_id) ==="

    add_env_var "$project_id" "SUPABASE_ANON_KEY" "$SUPABASE_ANON_KEY"
    add_env_var "$project_id" "SUPABASE_SERVICE_ROLE_KEY" "$SUPABASE_SERVICE_ROLE_KEY"
    add_env_var "$project_id" "SUPABASE_URL" "$SUPABASE_URL"
    add_env_var "$project_id" "NEXT_PUBLIC_SUPABASE_ANON_KEY" "$SUPABASE_ANON_KEY"
    add_env_var "$project_id" "NEXT_PUBLIC_SUPABASE_URL" "$SUPABASE_URL"
    add_env_var "$project_id" "DATABASE_URL" "$DATABASE_URL"

    echo "=== Done with $project_name ==="
done
