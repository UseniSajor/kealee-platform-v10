# PowerShell version of update-portal-api script
# For Windows users

param(
    [string]$ApiUrl = "",
    [string]$ResendKey = "",
    [switch]$Help = $false
)

# Colors
$Green = "Green"
$Yellow = "Yellow"
$Red = "Red"
$Blue = "Blue"
$Null = "Gray"

function Write-Header {
    param([string]$Text)
    Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Blue
    Write-Host $Text -ForegroundColor Blue
    Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Blue
}

function Write-Success {
    param([string]$Text)
    Write-Host "✓ $Text" -ForegroundColor $Green
}

function Write-Info {
    param([string]$Text)
    Write-Host "ℹ $Text" -ForegroundColor $Blue
}

function Write-Warning {
    param([string]$Text)
    Write-Host "⚠ $Text" -ForegroundColor $Yellow
}

function Write-Error-Custom {
    param([string]$Text)
    Write-Host "✗ $Text" -ForegroundColor $Red
}

function Show-Help {
    Write-Host @"
Update Portal API Configuration Script

Usage:
    powershell -File scripts/update-portal-api.ps1 [-ApiUrl "URL"] [-ResendKey "KEY"]

Parameters:
    -ApiUrl         API endpoint URL (e.g., https://api.kealee.com)
    -ResendKey      Resend API key (e.g., re_xxxx)
    -Help           Show this help message

Examples:
    # Interactive mode
    powershell -File scripts/update-portal-api.ps1

    # With parameters
    powershell -File scripts/update-portal-api.ps1 -ApiUrl "https://api.kealee.com" -ResendKey "re_xxxxx"

    # Help
    powershell -File scripts/update-portal-api.ps1 -Help
"@
}

function Check-Prerequisites {
    Write-Header "Checking Prerequisites"
    
    $railwayInstalled = $null -ne (Get-Command railway -ErrorAction SilentlyContinue)
    
    if ($railwayInstalled) {
        Write-Success "Railway CLI is installed"
    } else {
        Write-Warning "Railway CLI not found"
        Write-Info "Install with: npm install -g @railway/cli"
        Write-Info "Or use Railway Dashboard to update variables manually"
    }
}

function Get-UserInput {
    if ([string]::IsNullOrWhiteSpace($ApiUrl)) {
        Write-Host ""
        $ApiUrl = Read-Host "Enter API URL (e.g., https://api.kealee.com)"
        if ([string]::IsNullOrWhiteSpace($ApiUrl)) {
            Write-Error-Custom "API URL is required"
            exit 1
        }
    }
    
    if ([string]::IsNullOrWhiteSpace($ResendKey)) {
        Write-Host ""
        Write-Host "Enter Resend API Key (press Enter to skip):"
        $ResendKey = Read-Host
    }
}

function Validate-ApiUrl {
    if ($ApiUrl -notmatch "^https?://") {
        Write-Error-Custom "API URL must start with http:// or https://"
        exit 1
    }
    Write-Success "API URL validated: $ApiUrl"
}

function Validate-ResendKey {
    if (![string]::IsNullOrWhiteSpace($ResendKey) -and $ResendKey -notmatch "^re_") {
        Write-Warning "Resend key should start with 're_'"
    }
}

function Show-Config {
    Write-Header "Configuration Summary"
    
    Write-Host ""
    Write-Host "API Configuration:"
    Write-Host "  NEXT_PUBLIC_API_URL=$ApiUrl"
    Write-Host ""
    
    if (![string]::IsNullOrWhiteSpace($ResendKey)) {
        Write-Host "Email Configuration:"
        Write-Host "  RESEND_API_KEY=re_[REDACTED]"
        Write-Host "  RESEND_FROM_EMAIL=Kealee Platform <noreply@kealee.com>"
        Write-Host ""
    } else {
        Write-Warning "No Resend key provided (email features will be disabled)"
        Write-Host ""
    }
}

function Generate-ManualInstructions {
    Write-Header "Manual Update Instructions (Railway Dashboard)"
    
    $portals = @("portal-owner", "portal-contractor", "portal-developer")
    
    foreach ($portal in $portals) {
        Write-Host ""
        Write-Host "=== $portal ===" -ForegroundColor $Yellow
        Write-Host "1. Open: https://railway.app → Your Project"
        Write-Host "2. Click on '$portal' service"
        Write-Host "3. Click 'Variables' tab"
        Write-Host "4. Click 'Add Variable' and add:"
        Write-Host ""
        Write-Host "   Key: NEXT_PUBLIC_API_URL"
        Write-Host "   Value: $ApiUrl"
        Write-Host ""
        
        if (![string]::IsNullOrWhiteSpace($ResendKey)) {
            Write-Host "   Key: RESEND_API_KEY"
            Write-Host "   Value: $ResendKey"
            Write-Host ""
            Write-Host "   Key: RESEND_FROM_EMAIL"
            Write-Host "   Value: Kealee Platform <noreply@kealee.com>"
            Write-Host ""
        }
        
        Write-Host "5. Click 'Deploy' → 'Trigger Deploy'"
        Write-Host "6. Wait for deployment to complete (2-5 minutes)"
        Write-Host ""
    }
}

function Generate-EnvFiles {
    Write-Header "Generating Local .env Files"
    
    $portals = @("portal-owner", "portal-contractor", "portal-developer")
    
    foreach ($portal in $portals) {
        $envFile = "apps\$portal\.env.local"
        
        Write-Info "Creating $envFile..."
        
        $content = "# Portal API Configuration (Development)`n"
        $content += "# WARNING: Never commit .env.local files to git`n`n"
        $content += "NEXT_PUBLIC_API_URL=$ApiUrl`n"
        
        if (![string]::IsNullOrWhiteSpace($ResendKey)) {
            $content += "RESEND_API_KEY=$ResendKey`n"
            $content += "RESEND_FROM_EMAIL=Kealee Platform <noreply@kealee.com>`n"
        }
        
        Set-Content -Path $envFile -Value $content
        Write-Success "Created $envFile"
    }
}

function Verify-Setup {
    Write-Header "Setup Verification Checklist"
    
    Write-Host ""
    Write-Host "After updating variables, verify your setup:"
    Write-Host ""
    Write-Host "Checklist:"
    Write-Host "  [ ] Updated NEXT_PUBLIC_API_URL in Railway dashboard"
    
    if (![string]::IsNullOrWhiteSpace($ResendKey)) {
        Write-Host "  [ ] Updated RESEND_API_KEY in Railway dashboard"
        Write-Host "  [ ] Updated RESEND_FROM_EMAIL in Railway dashboard"
    }
    
    Write-Host "  [ ] Triggered deployments for all 3 portals"
    Write-Host "  [ ] Deployments completed (2-5 minutes each)"
    Write-Host "  [ ] Cleared browser cache (Ctrl+Shift+Delete)"
    Write-Host "  [ ] Tested portal connectivity"
    Write-Host ""
    Write-Host "Testing:"
    Write-Host "  1. Open a portal URL (https://portal-owner.app/)"
    Write-Host "  2. Open DevTools → Network tab"
    Write-Host "  3. Look for /api/v1/* requests"
    Write-Host "  4. Verify 200 responses (not 404 or errors)"
    Write-Host ""
}

# Main
if ($Help) {
    Show-Help
    exit 0
}

Write-Header "Kealee Portal API Configuration"

Check-Prerequisites
Get-UserInput
Validate-ApiUrl
Validate-ResendKey
Show-Config

Write-Host ""
Write-Host "How would you like to update?" -ForegroundColor $Yellow
Write-Host "1) Generate manual instructions (Railway Dashboard)"
Write-Host "2) Generate local .env files (for development)"
Write-Host "3) Both"
Write-Host ""
$choice = Read-Host "Choose [1-3]"

switch ($choice) {
    "1" {
        Generate-ManualInstructions
    }
    "2" {
        Generate-EnvFiles
    }
    "3" {
        Generate-ManualInstructions
        Write-Host ""
        Generate-EnvFiles
    }
    default {
        Write-Error-Custom "Invalid choice"
        exit 1
    }
}

Verify-Setup
Write-Success "Done! Follow the checklist above to complete setup."
