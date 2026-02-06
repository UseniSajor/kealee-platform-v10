# Test All Kealee Domains
# This script tests HTTPS access and SSL certificates for all domains

Write-Host "🔍 Testing All Kealee Domains" -ForegroundColor Cyan
Write-Host ""

$domains = @(
    @{Name="kealee.com"; Type="Marketplace"},
    @{Name="www.kealee.com"; Type="Marketplace"},
    @{Name="ops.kealee.com"; Type="Client App"},
    @{Name="app.kealee.com"; Type="Client App"},
    @{Name="architect.kealee.com"; Type="Client App"},
    @{Name="permits.kealee.com"; Type="Client App"},
    @{Name="pm.kealee.com"; Type="Internal"},
    @{Name="admin.kealee.com"; Type="Internal"},
    @{Name="api.kealee.com/health"; Type="API"}
)

foreach ($domain in $domains) {
    $url = "https://$($domain.Name)"
    Write-Host "Testing: $url" -ForegroundColor Yellow
    
    try {
        $response = Invoke-WebRequest -Uri $url -Method Head -UseBasicParsing -ErrorAction Stop
        $status = $response.StatusCode
        
        if ($status -eq 200 -or $status -eq 301 -or $status -eq 302) {
            Write-Host "  ✅ Status: $status" -ForegroundColor Green
            if ($response.Headers.Location) {
                Write-Host "  ➡️  Redirects to: $($response.Headers.Location)" -ForegroundColor Cyan
            }
        } else {
            Write-Host "  ⚠️  Status: $status" -ForegroundColor Yellow
        }
    }
    catch {
        $statusCode = $_.Exception.Response.StatusCode.value__
        $statusDescription = $_.Exception.Response.StatusDescription
        
        if ($statusCode) {
            Write-Host "  ⚠️  Status: $statusCode $statusDescription" -ForegroundColor Yellow
        }
        elseif ($_.Exception.Message -like "*SSL*" -or $_.Exception.Message -like "*certificate*") {
            Write-Host "  ❌ SSL Error: $($_.Exception.Message)" -ForegroundColor Red
        }
        elseif ($_.Exception.Message -like "*404*") {
            Write-Host "  ⚠️  404 Not Found - Domain resolves but app not deployed" -ForegroundColor Yellow
        }
        else {
            Write-Host "  ❌ Error: $($_.Exception.Message)" -ForegroundColor Red
        }
    }
    
    Write-Host ""
}

Write-Host "📊 Test Summary" -ForegroundColor Cyan
Write-Host ""
Write-Host "✅ Status Code 200-302 = Working" -ForegroundColor Green
Write-Host "⚠️  404 = DNS working, but app not deployed/configured in Vercel" -ForegroundColor Yellow
Write-Host "❌ SSL Error = Certificate issue" -ForegroundColor Red
Write-Host "❌ Connection Error = DNS or network issue" -ForegroundColor Red
