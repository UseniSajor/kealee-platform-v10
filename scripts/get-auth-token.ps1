# scripts/get-auth-token.ps1
# Helper script to get authentication token from API (PowerShell version)

param(
    [string]$ApiUrl = "http://localhost:3001",
    [string]$Email = "test@example.com",
    [string]$Password = "test123456"
)

Write-Host "🔐 Getting authentication token..." -ForegroundColor Cyan
Write-Host "   API URL: $ApiUrl"
Write-Host "   Email: $Email"
Write-Host ""

try {
    $body = @{
        email = $Email
        password = $Password
    } | ConvertTo-Json

    $headers = @{
        "Content-Type" = "application/json"
    }

    $response = Invoke-WebRequest -Uri "$ApiUrl/auth/login" -Method Post -Headers $headers -Body $body -UseBasicParsing -ErrorAction Stop
    $content = $response.Content | ConvertFrom-Json

    if ($content.session -and $content.session.access_token) {
        $accessToken = $content.session.access_token
        Write-Host "✅ Authentication successful!" -ForegroundColor Green
        Write-Host ""
        Write-Host "Access Token:"
        Write-Host $accessToken
        Write-Host ""
        Write-Host "To use this token:"
        Write-Host "  `$env:AUTH_TOKEN = `"$accessToken`""
        Write-Host ""
        Write-Host "Or add to your test script:"
        Write-Host "  `$env:AUTH_TOKEN = `"$accessToken`"; .\scripts\test-all-api-endpoints.ps1"
    } else {
        Write-Host "❌ Could not extract access token from response" -ForegroundColor Red
        Write-Host "Response: $($response.Content)"
        exit 1
    }
} catch {
    Write-Host "❌ Authentication failed" -ForegroundColor Red
    Write-Host "Error: $($_.Exception.Message)"
    if ($_.Exception.Response) {
        $reader = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())
        $responseBody = $reader.ReadToEnd()
        Write-Host "Response: $responseBody"
    }
    exit 1
}
