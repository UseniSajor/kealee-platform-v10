# Test API Service
# Run from root: .\test-api.ps1

Write-Host "🧪 Testing Kealee Platform API Service..." -ForegroundColor Cyan
Write-Host ""

# Change to API directory
Set-Location "services\api"

Write-Host "📦 Installing dependencies..." -ForegroundColor Yellow
pnpm install --silent

Write-Host ""
Write-Host "🔨 Building TypeScript..." -ForegroundColor Yellow
pnpm build

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Build failed!" -ForegroundColor Red
    Set-Location ..\..
    exit 1
}

Write-Host ""
Write-Host "✅ Build successful!" -ForegroundColor Green
Write-Host ""
Write-Host "🧪 Running tests..." -ForegroundColor Yellow
pnpm test

if ($LASTEXITCODE -ne 0) {
    Write-Host ""
    Write-Host "❌ Tests failed!" -ForegroundColor Red
    Set-Location ..\..
    exit 1
}

Write-Host ""
Write-Host "✅ All tests passed!" -ForegroundColor Green
Write-Host ""
Write-Host "📊 Running tests with coverage..." -ForegroundColor Yellow
pnpm test:coverage

Set-Location ..\..

Write-Host ""
Write-Host "✨ Testing complete!" -ForegroundColor Green
