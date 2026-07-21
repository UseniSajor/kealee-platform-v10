# Marketplace Deployment Script (PowerShell)
# Usage: .\scripts\deploy-marketplace.ps1 [environment]

param(
    [string]$Environment = "production"
)

$ErrorActionPreference = "Stop"
$APP_NAME = "m-marketplace"
$TIMESTAMP = Get-Date -Format "yyyyMMdd_HHmmss"
$DEPLOY_LOG = "deployments\deploy_$TIMESTAMP.log"

# Create deployments directory
New-Item -ItemType Directory -Force -Path "deployments" | Out-Null

function Write-Log {
    param([string]$Message)
    $timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    $logMessage = "[$timestamp] $Message"
    Write-Host $logMessage -ForegroundColor Green
    Add-Content -Path $DEPLOY_LOG -Value $logMessage
}

function Write-Error-Log {
    param([string]$Message)
    $timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    $logMessage = "[$timestamp] ERROR: $Message"
    Write-Host $logMessage -ForegroundColor Red
    Add-Content -Path $DEPLOY_LOG -Value $logMessage
    exit 1
}

function Write-Warning-Log {
    param([string]$Message)
    $timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    $logMessage = "[$timestamp] WARNING: $Message"
    Write-Host $logMessage -ForegroundColor Yellow
    Add-Content -Path $DEPLOY_LOG -Value $logMessage
}

function Test-Prerequisites {
    Write-Log "Checking prerequisites..."
    
    # Check Node.js version
    try {
        $nodeVersion = node -v
        $nodeMajor = [int]($nodeVersion -replace 'v(\d+)\..*', '$1')
        if ($nodeMajor -lt 18) {
            Write-Error-Log "Node.js 18 or higher is required. Current version: $nodeVersion"
        }
        Write-Log "✓ Node.js version: $nodeVersion"
    } catch {
        Write-Error-Log "Node.js not found. Please install Node.js 18 or higher."
    }
    
    # Check npm version
    $npmVersion = npm -v
    Write-Log "✓ npm version: $npmVersion"
    
    # Check Vercel CLI
    try {
        $vercelVersion = vercel --version
        Write-Log "✓ Vercel CLI version: $vercelVersion"
    } catch {
        Write-Warning-Log "Vercel CLI not found. Installing..."
        npm install -g vercel@latest
    }
    
    # Check if in correct directory
    if (-not (Test-Path "package.json")) {
        Write-Error-Log "package.json not found. Please run from project root."
    }
    
    # Check environment variables
    if (-not (Test-Path ".env.$Environment")) {
        Write-Warning-Log ".env.$Environment not found. Using .env.production"
        if (-not (Test-Path ".env.production")) {
            Write-Error-Log "No environment file found. Create .env.$Environment or .env.production"
        }
    }
    
    Write-Log "✓ All prerequisites satisfied"
}

function Load-Environment {
    Write-Log "Loading environment: $Environment"
    
    # Load environment variables
    if (Test-Path ".env.$Environment") {
        Get-Content ".env.$Environment" | ForEach-Object {
            if ($_ -match '^([^#][^=]+)=(.*)$') {
                [Environment]::SetEnvironmentVariable($matches[1], $matches[2], "Process")
            }
        }
        Write-Log "✓ Loaded .env.$Environment"
    } elseif (Test-Path ".env.production") {
        Get-Content ".env.production" | ForEach-Object {
            if ($_ -match '^([^#][^=]+)=(.*)$') {
                [Environment]::SetEnvironmentVariable($matches[1], $matches[2], "Process")
            }
        }
        Write-Log "✓ Loaded .env.production"
    }
    
    # Set deployment variables
    switch ($Environment) {
        "production" {
            $script:DEPLOY_URL = "https://marketplace.kealee.com"
            $script:VERCEL_PROJECT = "m-marketplace"
            $script:VERCEL_ORG = "kealee"
        }
        "staging" {
            $script:DEPLOY_URL = "https://staging-marketplace.kealee.com"
            $script:VERCEL_PROJECT = "m-marketplace-staging"
            $script:VERCEL_ORG = "kealee"
        }
        "preview" {
            $script:DEPLOY_URL = ""
            $script:VERCEL_PROJECT = "m-marketplace-preview"
            $script:VERCEL_ORG = "kealee"
        }
        default {
            Write-Error-Log "Unknown environment: $Environment"
        }
    }
    
    Write-Log "✓ Deployment target: $DEPLOY_URL"
}

function Test-Build {
    Write-Log "Running tests..."
    
    # TypeScript compilation check
    Write-Log "Checking TypeScript compilation..."
    npx tsc --noEmit
    if ($LASTEXITCODE -ne 0) {
        Write-Error-Log "TypeScript compilation failed"
    }
    Write-Log "✓ TypeScript compilation passed"
    
    # Build test
    Write-Log "Testing build..."
    npm run build
    if ($LASTEXITCODE -ne 0) {
        Write-Error-Log "Build test failed"
    }
    Write-Log "✓ Build test passed"
}

function Test-Linting {
    Write-Log "Running code quality checks..."
    
    # ESLint
    Write-Log "Running ESLint..."
    npx eslint . --ext .js,.jsx,.ts,.tsx --max-warnings 0
    if ($LASTEXITCODE -ne 0) {
        Write-Warning-Log "ESLint check failed"
    }
    Write-Log "✓ ESLint completed"
    
    # Security audit
    Write-Log "Running security audit..."
    npm audit --audit-level=high
    if ($LASTEXITCODE -ne 0) {
        Write-Warning-Log "Security vulnerabilities found. Run 'npm audit fix' to fix."
    }
    Write-Log "✓ Security audit completed"
}

function Deploy-ToVercel {
    Write-Log "Deploying to Vercel ($Environment)..."
    
    # Login to Vercel if needed
    try {
        vercel whoami | Out-Null
    } catch {
        Write-Log "Please login to Vercel..."
        vercel login
    }
    
    # Deploy based on environment
    switch ($Environment) {
        "production" {
            Write-Log "Deploying to production..."
            vercel deploy --prod --yes --token="$env:VERCEL_TOKEN"
        }
        "staging" {
            Write-Log "Deploying to staging..."
            vercel deploy --target=production --yes --token="$env:VERCEL_TOKEN"
        }
        "preview" {
            Write-Log "Creating preview deployment..."
            vercel --yes --token="$env:VERCEL_TOKEN"
        }
    }
    
    if ($LASTEXITCODE -ne 0) {
        Write-Error-Log "Vercel deployment failed"
    }
    
    Write-Log "✓ Deployment to Vercel completed"
}

function Send-Notifications {
    Write-Log "Sending deployment notifications..."
    
    try {
        $deploymentUrl = vercel ls $VERCEL_PROJECT --token=$env:VERCEL_TOKEN 2>$null | Select-String $Environment | ForEach-Object { ($_ -split '\s+')[1] }
    } catch {
        $deploymentUrl = "N/A"
    }
    
    # Slack notification
    if ($env:SLACK_WEBHOOK_URL) {
        $commit = try { git log -1 --pretty=format:'%h %s' } catch { "N/A" }
        $body = @{
            text = "✅ *$APP_NAME deployed to $Environment*`n• Environment: $Environment`n• URL: $deploymentUrl`n• Timestamp: $(Get-Date)`n• Commit: $commit"
        } | ConvertTo-Json
        
        try {
            Invoke-RestMethod -Uri $env:SLACK_WEBHOOK_URL -Method Post -Body $body -ContentType "application/json"
            Write-Log "✓ Slack notification sent"
        } catch {
            Write-Warning-Log "Slack notification failed"
        }
    }
    
    Write-Log "✓ Notifications sent"
}

function New-RollbackPoint {
    Write-Log "Creating rollback point..."
    
    try {
        $deploymentId = vercel ls $VERCEL_PROJECT --token=$env:VERCEL_TOKEN 2>$null | Select-String $Environment | ForEach-Object { ($_ -split '\s+')[0] }
    } catch {
        $deploymentId = "N/A"
    }
    
    $commit = try { git rev-parse HEAD } catch { "N/A" }
    
    $rollbackData = @{
        deployment_id = $deploymentId
        environment = $Environment
        timestamp = Get-Date -Format "o"
        commit = $commit
        url = $DEPLOY_URL
    } | ConvertTo-Json
    
    $rollbackFile = "deployments\rollback_${Environment}_${TIMESTAMP}.json"
    $rollbackData | Out-File -FilePath $rollbackFile -Encoding utf8
    
    Write-Log "✓ Rollback point created: $rollbackFile"
}

# Main execution
Write-Log "Starting deployment of $APP_NAME to $Environment"
Write-Log "Timestamp: $TIMESTAMP"
Write-Log "Log file: $DEPLOY_LOG"

Test-Prerequisites
Load-Environment
Test-Build
Test-Linting
Deploy-ToVercel
New-RollbackPoint
Send-Notifications

Write-Log "✅ Deployment completed successfully!"
Write-Log "🚀 $APP_NAME is live at: $DEPLOY_URL"
Write-Log "📊 Check monitoring dashboard for deployment status"
