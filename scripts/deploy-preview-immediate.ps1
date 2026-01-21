# Immediate Vercel Preview Deployment Script
# Deploys all apps to Vercel preview environment immediately

Write-Host ""
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host "VERCEL PREVIEW DEPLOYMENT - IMMEDIATE" -ForegroundColor Cyan
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host ""

# Check Vercel login
Write-Host "Checking Vercel login..." -ForegroundColor Yellow
try {
    $vercelUser = vercel whoami 2>&1
    if ($LASTEXITCODE -eq 0) {
        Write-Host "  ✅ Vercel: $vercelUser" -ForegroundColor Green
    }
} catch {
    Write-Host "  ❌ Vercel not logged in" -ForegroundColor Red
    Write-Host ""
    Write-Host "Logging into Vercel..." -ForegroundColor Yellow
    vercel login
    if ($LASTEXITCODE -ne 0) {
        Write-Host "  ❌ Login failed" -ForegroundColor Red
        exit 1
    }
    Write-Host "  ✅ Login successful" -ForegroundColor Green
}

Write-Host ""
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host "DEPLOYING ALL APPS TO VERCEL PREVIEW" -ForegroundColor Cyan
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host ""

# List of apps to deploy
$vercelApps = @(
    @{ name = "os-admin"; path = "apps/os-admin" },
    @{ name = "os-pm"; path = "apps/os-pm" },
    @{ name = "m-architect"; path = "apps/m-architect" },
    @{ name = "m-marketplace"; path = "apps/m-marketplace" },
    @{ name = "m-ops-services"; path = "apps/m-ops-services" },
    @{ name = "m-permits-inspections"; path = "apps/m-permits-inspections" },
    @{ name = "m-project-owner"; path = "apps/m-project-owner" }
)

$deploymentResults = @()

foreach ($app in $vercelApps) {
    Write-Host ""
    Write-Host "📦 Deploying $($app.name)..." -ForegroundColor Yellow
    
    Push-Location $app.path
    
    try {
        # Deploy to preview (using --yes to skip prompts)
        $deployOutput = vercel --yes --prod=false 2>&1
        
        if ($LASTEXITCODE -eq 0) {
            # Extract deployment URL from output
            $url = ($deployOutput | Select-String -Pattern "https://.*\.vercel\.app" | Select-Object -First 1)
            
            if ($url) {
                $deploymentUrl = $url.Matches.Value
                Write-Host "  ✅ Deployed: $deploymentUrl" -ForegroundColor Green
                $deploymentResults += @{
                    App = $app.name
                    Status = "Success"
                    URL = $deploymentUrl
                }
            } else {
                Write-Host "  ✅ Deployed (check Vercel dashboard for URL)" -ForegroundColor Green
                $deploymentResults += @{
                    App = $app.name
                    Status = "Success"
                    URL = "Check Vercel Dashboard"
                }
            }
        } else {
            Write-Host "  ❌ Deployment failed" -ForegroundColor Red
            $deploymentResults += @{
                App = $app.name
                Status = "Failed"
                URL = "N/A"
            }
        }
    } catch {
        Write-Host "  ❌ Error: $_" -ForegroundColor Red
        $deploymentResults += @{
            App = $app.name
            Status = "Error"
            URL = "N/A"
        }
    } finally {
        Pop-Location
    }
}

Write-Host ""
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host "DEPLOYMENT SUMMARY" -ForegroundColor Cyan
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host ""

foreach ($result in $deploymentResults) {
    $statusColor = if ($result.Status -eq "Success") { "Green" } else { "Red" }
    Write-Host "$($result.App): " -NoNewline
    Write-Host $result.Status -ForegroundColor $statusColor -NoNewline
    Write-Host " - $($result.URL)"
}

$successCount = ($deploymentResults | Where-Object { $_.Status -eq "Success" }).Count
$totalCount = $deploymentResults.Count

Write-Host ""
Write-Host "Deployed: $successCount/$totalCount apps" -ForegroundColor $(if ($successCount -eq $totalCount) { "Green" } else { "Yellow" })
Write-Host ""
Write-Host "View all deployments at: https://vercel.com/dashboard" -ForegroundColor Cyan
Write-Host ""

