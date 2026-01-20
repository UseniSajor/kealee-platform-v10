# scripts/setup-ssl.ps1
# Setup SSL certificates for all domains (PowerShell version)

$ErrorActionPreference = "Continue"

function Log-Ssl {
    param([string]$Message)
    Write-Host "[SSL] $Message" -ForegroundColor Cyan
}

function Write-Success {
    param([string]$Message)
    Write-Host "✅ $Message" -ForegroundColor Green
}

function Write-Fail {
    param([string]$Message)
    Write-Host "❌ $Message" -ForegroundColor Red
}

function Write-Warn {
    param([string]$Message)
    Write-Host "⚠️  $Message" -ForegroundColor Yellow
}

$domain = if ($env:DOMAIN) { $env:DOMAIN } else { "kealee.com" }

$domains = @(
    "api.$domain",
    "marketplace.$domain",
    "admin.$domain",
    "pm.$domain",
    "ops.$domain",
    "app.$domain",
    "owner.$domain",
    "architect.$domain",
    "permits.$domain"
)

$appProjects = @{
    "api" = "api"
    "marketplace" = "m-marketplace"
    "admin" = "os-admin"
    "pm" = "os-pm"
    "ops" = "m-ops-services"
    "app" = "m-project-owner"
    "owner" = "m-project-owner"
    "architect" = "m-architect"
    "permits" = "m-permits-inspections"
}

Write-Host "🔒 SSL Certificate Setup" -ForegroundColor Cyan
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
Write-Host ""
Write-Host "This script helps you configure SSL certificates for all domains."
Write-Host "Vercel automatically provisions SSL certificates via Let's Encrypt."
Write-Host ""

Log-Ssl "Domain: $domain"
Log-Ssl "Total domains: $($domains.Count)"
Write-Host ""

# Check if Vercel CLI is installed
try {
    $null = Get-Command vercel -ErrorAction Stop
} catch {
    Write-Fail "Vercel CLI not installed"
    Write-Host "   Install with: npm install -g vercel@latest"
    exit 1
}

# Check if logged in
try {
    $null = vercel whoami 2>&1 | Out-Null
} catch {
    Write-Fail "Not logged in to Vercel"
    Write-Host "   Login with: vercel login"
    exit 1
}

Write-Host "📋 SSL Certificate Configuration" -ForegroundColor Cyan
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
Write-Host ""
Write-Host "Vercel automatically provisions SSL certificates for all domains."
Write-Host "Certificates are issued by Let's Encrypt and auto-renewed."
Write-Host ""

Write-Host "🔧 Vercel SSL Setup Steps" -ForegroundColor Cyan
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
Write-Host ""
Write-Host "1. Add Custom Domains in Vercel:"
Write-Host "   - Go to each project in Vercel dashboard"
Write-Host "   - Navigate to: Settings → Domains"
Write-Host "   - Add each domain (e.g., admin.$domain)"
Write-Host ""
Write-Host "2. Vercel will automatically:"
Write-Host "   ✅ Verify domain ownership (via DNS)"
Write-Host "   ✅ Provision SSL certificate (Let's Encrypt)"
Write-Host "   ✅ Configure HTTPS redirect"
Write-Host "   ✅ Set up auto-renewal"
Write-Host ""

Write-Host "📝 Domains to Add in Vercel" -ForegroundColor Cyan
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
Write-Host ""

foreach ($domainName in $domains) {
    $subdomain = $domainName.Split('.')[0]
    $project = $appProjects[$subdomain]
    Write-Host "  $domainName"
    Write-Host "    Project: $project"
    Write-Host "    Vercel Dashboard: https://vercel.com/[team]/$project/settings/domains"
    Write-Host ""
}

Write-Host ""
Write-Host "📋 Next Steps" -ForegroundColor Cyan
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
Write-Host ""
Write-Host "1. ✅ Add all domains in Vercel dashboard"
Write-Host "2. ✅ Wait for DNS propagation"
Write-Host "3. ✅ Wait for SSL certificate provisioning"
Write-Host "4. ✅ Verify SSL: .\scripts\ssl-test-subdomains.sh"
Write-Host "5. ✅ Set up auto-renewal: .\scripts\ssl-setup-auto-renewal.sh"
Write-Host ""
Write-Host "💡 Tips:"
Write-Host "   - SSL certificates auto-renew via Vercel"
Write-Host "   - Monitor certificate expiration"
Write-Host "   - Use SSL Labs to test: https://www.ssllabs.com/ssltest/"
Write-Host ""
