$VERCEL_TOKEN = "a1p0t9iPEhT8gsixuZH8oFH1"

$envVars = @{
    "SUPABASE_ANON_KEY" = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJrcmVxZnBreGF2cXBzcWV4YmZzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njg0MDc3NzAsImV4cCI6MjA4Mzk4Mzc3MH0.Zszenm7LrN7eRKi3-htbsQX8h4ulNvdCT_F1s-v0YJk"
    "SUPABASE_SERVICE_ROLE_KEY" = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJrcmVxZnBreGF2cXBzcWV4YmZzIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2ODQwNzc3MCwiZXhwIjoyMDgzOTgzNzcwfQ.Q5KvqmDYy4yvLqDTTZxccFOpRcz3RivkS61XwD3w5GU"
    "SUPABASE_URL" = "https://rkreqfpkxavqpsqexbfs.supabase.co"
    "NEXT_PUBLIC_SUPABASE_ANON_KEY" = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJrcmVxZnBreGF2cXBzcWV4YmZzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njg0MDc3NzAsImV4cCI6MjA4Mzk4Mzc3MH0.Zszenm7LrN7eRKi3-htbsQX8h4ulNvdCT_F1s-v0YJk"
    "NEXT_PUBLIC_SUPABASE_URL" = "https://rkreqfpkxavqpsqexbfs.supabase.co"
    "DATABASE_URL" = "postgresql://postgres:nBSLJLNmWGhvnChFBVedulYdZGKWFyjj@postgres.railway.internal:5432/railway"
}

$apps = @(
    "apps/m-marketplace",
    "apps/os-pm",
    "apps/m-finance-trust",
    "apps/m-architect",
    "apps/m-ops-services",
    "apps/m-permits-inspections",
    "apps/os-admin",
    "apps/m-project-owner"
)

foreach ($app in $apps) {
    Write-Host "=== Processing $app ===" -ForegroundColor Cyan
    Push-Location $app

    foreach ($var in $envVars.Keys) {
        Write-Host "Setting $var..." -ForegroundColor Yellow
        # Remove existing
        npx vercel env rm $var production --yes --token $VERCEL_TOKEN 2>$null
        # Add new
        $envVars[$var] | npx vercel env add $var production --token $VERCEL_TOKEN
    }

    Pop-Location
    Write-Host "=== Done with $app ===" -ForegroundColor Green
}
