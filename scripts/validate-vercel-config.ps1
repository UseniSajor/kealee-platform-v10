# Validate all vercel.json files for schema compliance
# PowerShell version for Windows

Write-Host "🔍 Validating all vercel.json files..." -ForegroundColor Cyan
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

$ERRORS = 0
$APPS = @("m-marketplace", "m-project-owner", "m-permits-inspections", "m-ops-services", "m-architect", "os-pm", "os-admin")

foreach ($app in $APPS) {
    Write-Host ""
    Write-Host "📦 Checking: $app" -ForegroundColor Yellow
    Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    
    $VERCEL_JSON = "apps\$app\vercel.json"
    
    if (-not (Test-Path $VERCEL_JSON)) {
        Write-Host "❌ vercel.json not found: $VERCEL_JSON" -ForegroundColor Red
        $ERRORS++
        continue
    }
    
    $content = Get-Content $VERCEL_JSON -Raw
    
    # Check for _comment property
    if ($content -match '"_comment"' -or $content -match "'_comment'") {
        Write-Host "❌ ERROR: Found '_comment' property in $VERCEL_JSON" -ForegroundColor Red
        $lines = Get-Content $VERCEL_JSON
        for ($i = 0; $i -lt $lines.Length; $i++) {
            if ($lines[$i] -match "_comment") {
                Write-Host "   Line $($i + 1): $($lines[$i])" -ForegroundColor Red
            }
        }
        $ERRORS++
    }
    
    # Validate JSON syntax
    try {
        $json = Get-Content $VERCEL_JSON | ConvertFrom-Json
        Write-Host "✅ Valid JSON syntax" -ForegroundColor Green
    } catch {
        Write-Host "❌ ERROR: Invalid JSON syntax in $VERCEL_JSON" -ForegroundColor Red
        Write-Host $_.Exception.Message -ForegroundColor Red
        $ERRORS++
    }
    
    # Check for common invalid properties
    $INVALID_PROPS = @("_comment", "_notes", "_description", "comment", "notes")
    foreach ($prop in $INVALID_PROPS) {
        if ($content -match "`"$prop`"" -or $content -match "'$prop'") {
            Write-Host "⚠️  WARNING: Found potentially invalid property: $prop" -ForegroundColor Yellow
        }
    }
    
    if ($ERRORS -eq 0) {
        Write-Host "✅ $app : vercel.json is valid" -ForegroundColor Green
    }
}

Write-Host ""
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
if ($ERRORS -eq 0) {
    Write-Host "✅ All vercel.json files are valid!" -ForegroundColor Green
    exit 0
} else {
    Write-Host "❌ Found $ERRORS error(s) in vercel.json files" -ForegroundColor Red
    Write-Host ""
    Write-Host "💡 Fix Steps:" -ForegroundColor Yellow
    Write-Host "  1. Remove '_comment' or other invalid properties from vercel.json"
    Write-Host "  2. Only use properties from Vercel's official schema"
    Write-Host "  3. Re-run this script to verify"
    exit 1
}

Write-Host ""
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
if ($ERRORS -eq 0) {
    Write-Host "✅ All vercel.json files are valid!" -ForegroundColor Green
    exit 0
} else {
    Write-Host "❌ Found $ERRORS error(s) in vercel.json files" -ForegroundColor Red
    Write-Host ""
    Write-Host "💡 Fix Steps:" -ForegroundColor Yellow
    Write-Host "  1. Remove '_comment' or other invalid properties from vercel.json"
    Write-Host "  2. Only use properties from Vercel's official schema"
    Write-Host "  3. Re-run this script to verify"
    exit 1
}

