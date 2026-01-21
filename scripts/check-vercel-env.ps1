# Check Vercel Environment Variables (PowerShell)
# This script helps identify missing environment variables for Vercel deployments

Write-Host ""
Write-Host "🔍 Checking Vercel Environment Variables..." -ForegroundColor Cyan
Write-Host ""

# Check if Vercel CLI is installed
try {
    $null = Get-Command vercel -ErrorAction Stop
    Write-Host "✅ Vercel CLI ready" -ForegroundColor Green
} catch {
    Write-Host "❌ Vercel CLI not found. Install with: npm i -g vercel" -ForegroundColor Red
    exit 1
}

# Check if logged in
try {
    $null = vercel whoami 2>&1
} catch {
    Write-Host "❌ Not logged in to Vercel. Run: vercel login" -ForegroundColor Red
    exit 1
}

Write-Host ""

# Required environment variables
$requiredVars = @(
    "DATABASE_URL",
    "NEXT_PUBLIC_API_URL",
    "SUPABASE_URL",
    "SUPABASE_ANON_KEY",
    "NEXT_PUBLIC_SUPABASE_URL",
    "NEXT_PUBLIC_SUPABASE_ANON_KEY"
)

# App-specific variables
$appVars = @{
    "m-marketplace" = @("NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY", "STRIPE_SECRET_KEY")
    "m-ops-services" = @("STRIPE_SECRET_KEY", "STRIPE_WEBHOOK_SECRET")
    "m-permits-inspections" = @("GOOGLE_PLACES_API_KEY", "AWS_ACCESS_KEY_ID", "AWS_SECRET_ACCESS_KEY", "AWS_S3_BUCKET")
}

$apps = @(
    "m-marketplace",
    "m-ops-services",
    "m-project-owner",
    "m-permits-inspections",
    "m-architect",
    "os-admin",
    "os-pm"
)

Write-Host "📋 Checking environment variables for all apps..." -ForegroundColor Cyan
Write-Host ""

foreach ($app in $apps) {
    Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Gray
    Write-Host "📦 $app" -ForegroundColor Yellow
    Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Gray
    
    # Get environment variables for this app
    try {
        $envList = vercel env ls $app production 2>&1 | Out-String
    } catch {
        Write-Host "  ⚠️  Could not fetch environment variables" -ForegroundColor Yellow
        Write-Host ""
        continue
    }
    
    # Check required vars
    $missing = 0
    foreach ($var in $requiredVars) {
        if ($envList -match $var) {
            Write-Host "  ✅ $var" -ForegroundColor Green
        } else {
            Write-Host "  ❌ $var (MISSING)" -ForegroundColor Red
            $missing++
        }
    }
    
    # Check app-specific vars
    if ($appVars.ContainsKey($app)) {
        foreach ($var in $appVars[$app]) {
            if ($envList -match $var) {
                Write-Host "  ✅ $var" -ForegroundColor Green
            } else {
                Write-Host "  ⚠️  $var (OPTIONAL)" -ForegroundColor Yellow
            }
        }
    }
    
    if ($missing -eq 0) {
        Write-Host ""
        Write-Host "  ✅ All required variables present" -ForegroundColor Green
    } else {
        Write-Host ""
        Write-Host "  ❌ Missing $missing required variable(s)" -ForegroundColor Red
    }
    
    Write-Host ""
}

Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Gray
Write-Host "📝 Next Steps:" -ForegroundColor Cyan
Write-Host ""
Write-Host "1. Update missing environment variables in Vercel dashboard" -ForegroundColor White
Write-Host "2. Or use: vercel env add <VAR_NAME> <PROJECT>" -ForegroundColor White
Write-Host "3. Redeploy after updating variables" -ForegroundColor White
Write-Host ""
Write-Host "For Railway database URL:" -ForegroundColor Yellow
Write-Host "  - Get from Railway dashboard → PostgreSQL → Connect" -ForegroundColor Gray
Write-Host "  - Format: postgresql://postgres:password@host:port/railway" -ForegroundColor Gray
Write-Host ""
Write-Host "For Railway API URL:" -ForegroundColor Yellow
Write-Host "  - Get from Railway dashboard → API Service → Settings → Public URL" -ForegroundColor Gray
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Gray
Write-Host ""


