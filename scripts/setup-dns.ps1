# scripts/setup-dns.ps1
# Setup DNS records for all applications (PowerShell version)

$ErrorActionPreference = "Continue"

function Log-Dns {
    param([string]$Message)
    Write-Host "[DNS] $Message" -ForegroundColor Cyan
}

function Write-Success {
    param([string]$Message)
    Write-Host "✅ $Message" -ForegroundColor Green
}

function Write-Warn {
    param([string]$Message)
    Write-Host "⚠️  $Message" -ForegroundColor Yellow
}

$domain = if ($env:DOMAIN) { $env:DOMAIN } else { "kealee.com" }
$dnsProvider = if ($env:DNS_PROVIDER) { $env:DNS_PROVIDER } else { "namebright" }
$vercelTarget = "cname.vercel-dns.com"

$appDomains = @{
    "api" = "api.$domain"
    "marketplace" = "marketplace.$domain"
    "admin" = "admin.$domain"
    "pm" = "pm.$domain"
    "ops" = "ops.$domain"
    "app" = "app.$domain"
    "owner" = "owner.$domain"
    "architect" = "architect.$domain"
    "permits" = "permits.$domain"
}

Write-Host "🌐 DNS Setup for Kealee Platform" -ForegroundColor Cyan
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
Write-Host ""
Write-Host "This script helps you configure DNS records for all applications."
Write-Host "You'll need to manually add these records in your DNS provider."
Write-Host ""

Log-Dns "Domain: $domain"
Log-Dns "DNS Provider: $dnsProvider"
Write-Host ""

Write-Host "📋 DNS Records to Configure" -ForegroundColor Cyan
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
Write-Host ""
Write-Host "For each application, add a CNAME record:"
Write-Host ""

foreach ($app in $appDomains.Keys) {
    $appDomain = $appDomains[$app]
    Write-Host "  $appDomain"
    Write-Host "    Type: CNAME"
    Write-Host "    Name: $app"
    Write-Host "    Value: $vercelTarget"
    Write-Host "    TTL: 3600 (or Auto)"
    Write-Host ""
}

Write-Host "  api.$domain"
Write-Host "    Type: CNAME"
Write-Host "    Name: api"
Write-Host "    Value: [Your API server CNAME]"
Write-Host "    TTL: 3600 (or Auto)"
Write-Host "    Note: Update with your actual API server CNAME"
Write-Host ""

# Generate DNS records file
$dnsFile = "dns-records.txt"
Log-Dns "Generating DNS records file: $dnsFile"

$content = @"
# DNS Records for $domain
# Generated: $(Get-Date)
# DNS Provider: $dnsProvider

# Application Subdomains (CNAME to Vercel)
"@

foreach ($app in $appDomains.Keys) {
    $content += "`n$app.$domain CNAME $vercelTarget"
}

$content += "`n`n# API Subdomain (CNAME to API server)`napi.$domain CNAME [YOUR_API_SERVER_CNAME]"

$content | Out-File -FilePath $dnsFile -Encoding utf8

Write-Success "DNS records file created: $dnsFile"
Write-Host ""
Write-Host "📋 Next Steps:"
Write-Host "   1. Review $dnsFile"
Write-Host "   2. Add records in your DNS provider"
Write-Host "   3. Wait for DNS propagation (1-48 hours)"
Write-Host "   4. Configure SSL certificates: .\scripts\setup-ssl.ps1"
Write-Host "   5. Verify DNS: nslookup api.$domain"
