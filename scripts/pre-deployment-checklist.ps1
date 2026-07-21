# scripts/pre-deployment-checklist.ps1
# Pre-deployment validation checklist (PowerShell version)

$ErrorActionPreference = "Continue"

# Counters
$script:Passed = 0
$script:Failed = 0
$script:Warnings = 0
$script:Skipped = 0

function Log-Check {
    param([string]$Message)
    Write-Host "[CHECK] $Message" -ForegroundColor Cyan
}

function Write-Pass {
    param([string]$Message)
    Write-Host "✅ $Message" -ForegroundColor Green
    $script:Passed++
}

function Write-Fail {
    param([string]$Message)
    Write-Host "❌ $Message" -ForegroundColor Red
    $script:Failed++
}

function Write-Warn {
    param([string]$Message)
    Write-Host "⚠️  $Message" -ForegroundColor Yellow
    $script:Warnings++
}

function Write-Skip {
    param([string]$Message)
    Write-Host "⏭️  $Message" -ForegroundColor Yellow
    $script:Skipped++
}

Write-Host "🔍 Pre-Deployment Checklist" -ForegroundColor Cyan
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
Write-Host ""

# 1. Code Quality Checks
Write-Host "1. Code Quality" -ForegroundColor Cyan
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan

# 1.1 All tests passing
Log-Check "1.1 Checking tests..."
if (Test-Path "package.json") {
    $packageJson = Get-Content "package.json" | ConvertFrom-Json
    if ($packageJson.scripts.test) {
        try {
            $testResult = pnpm test --run 2>&1
            if ($testResult -match "passed|PASS") {
                Write-Pass "All tests passing"
            } else {
                Write-Fail "Some tests failing"
            }
        } catch {
            Write-Warn "Could not run tests: $($_.Exception.Message)"
        }
    } else {
        Write-Skip "No test script found"
    }
} else {
    Write-Skip "No package.json found (not in root?)"
}

# 1.2 Linting passes
Log-Check "1.2 Checking linting..."
try {
    $null = Get-Command pnpm -ErrorAction Stop
    $lintResult = pnpm lint 2>&1
    if ($lintResult -match "error|Error" -and $lintResult -notmatch "No lint errors") {
        Write-Fail "Linting errors found"
    } else {
        Write-Pass "Linting passes"
    }
} catch {
    Write-Warn "pnpm not found, skipping lint check"
}

# 1.3 Type checking
Log-Check "1.3 Checking TypeScript..."
try {
    $null = Get-Command pnpm -ErrorAction Stop
    $tscResult = pnpm exec tsc --noEmit 2>&1
    if ($tscResult -match "error TS") {
        Write-Fail "TypeScript errors found"
    } else {
        Write-Pass "Type checking passes"
    }
} catch {
    Write-Warn "pnpm not found, skipping type check"
}

# 2. Environment Variables
Write-Host ""
Write-Host "2. Environment Variables" -ForegroundColor Cyan
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan

# 2.1 Required env vars
Log-Check "2.1 Checking required environment variables..."
$requiredVars = @("DATABASE_URL", "SUPABASE_URL", "SUPABASE_ANON_KEY")
$missingVars = @()

foreach ($var in $requiredVars) {
    $envValue = [Environment]::GetEnvironmentVariable($var)
    $envFileValue = $null
    
    if (Test-Path ".env.local") {
        $envFileValue = Select-String -Path ".env.local" -Pattern "^$var=" | ForEach-Object { ($_ -split '=', 2)[1] }
    }
    if (-not $envFileValue -and (Test-Path ".env")) {
        $envFileValue = Select-String -Path ".env" -Pattern "^$var=" | ForEach-Object { ($_ -split '=', 2)[1] }
    }
    
    if (-not $envValue -and -not $envFileValue) {
        $missingVars += $var
    }
}

if ($missingVars.Count -eq 0) {
    Write-Pass "Required environment variables set"
} else {
    Write-Fail "Missing environment variables: $($missingVars -join ', ')"
}

# 2.2 Database connection
Log-Check "2.2 Verifying database connection..."
$dbUrl = $env:DATABASE_URL
if (-not $dbUrl -and (Test-Path ".env.local")) {
    $dbUrl = (Select-String -Path ".env.local" -Pattern "^DATABASE_URL=" | ForEach-Object { ($_ -split '=', 2)[1] }).Trim('"')
}
if (-not $dbUrl -and (Test-Path ".env")) {
    $dbUrl = (Select-String -Path ".env" -Pattern "^DATABASE_URL=" | ForEach-Object { ($_ -split '=', 2)[1] }).Trim('"')
}

if ($dbUrl) {
    try {
        $null = Get-Command psql -ErrorAction Stop
        $testResult = psql $dbUrl -c "SELECT 1;" 2>&1
        if ($LASTEXITCODE -eq 0) {
            Write-Pass "Database connection verified"
        } else {
            Write-Fail "Database connection failed"
        }
    } catch {
        Write-Skip "psql not found, skipping database connection test"
    }
} else {
    Write-Fail "DATABASE_URL not set"
}

# 2.3 API keys configured
Log-Check "2.3 Checking API keys..."
$apiKeys = @("STRIPE_SECRET_KEY", "STRIPE_WEBHOOK_SECRET")
$missingKeys = @()

foreach ($key in $apiKeys) {
    $envValue = [Environment]::GetEnvironmentVariable($key)
    $envFileValue = $null
    
    if (Test-Path ".env.local") {
        $envFileValue = Select-String -Path ".env.local" -Pattern "^$key=" | ForEach-Object { ($_ -split '=', 2)[1] }
    }
    
    if (-not $envValue -and -not $envFileValue) {
        $missingKeys += $key
    }
}

if ($missingKeys.Count -eq 0) {
    Write-Pass "API keys configured"
} else {
    Write-Warn "Some API keys may be missing: $($missingKeys -join ', ')"
}

# 3. Database
Write-Host ""
Write-Host "3. Database" -ForegroundColor Cyan
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan

# 3.1 Migrations reviewed
Log-Check "3.1 Checking migration status..."
if (Test-Path "packages/database/prisma/migrations") {
    Push-Location packages/database
    try {
        $null = Get-Command npx -ErrorAction Stop
        $migrationStatus = npx prisma migrate status --schema=./prisma/schema.prisma 2>&1
        if ($migrationStatus -match "Database schema is up to date|migrations pending") {
            Write-Pass "Migration status checked"
        } else {
            Write-Warn "Migration status unclear"
        }
    } catch {
        Write-Skip "npx not found, skipping migration check"
    }
    Pop-Location
} else {
    Write-Skip "Migrations directory not found"
}

# 3.2 Backup created
Log-Check "3.2 Checking for database backup..."
if (Test-Path "backups") {
    $backups = Get-ChildItem -Path "backups" -Filter "*.sql" -ErrorAction SilentlyContinue
    if ($backups) {
        $latestBackup = $backups | Sort-Object LastWriteTime -Descending | Select-Object -First 1
        $backupAge = [math]::Round(((Get-Date) - $latestBackup.LastWriteTime).TotalHours)
        if ($backupAge -lt 24) {
            Write-Pass "Recent backup found ($($backups.Count) backups, latest: ${backupAge}h ago)"
        } else {
            Write-Warn "Backup exists but is old (${backupAge}h ago)"
        }
    } else {
        Write-Warn "Backup directory exists but no backups found"
    }
} else {
    Write-Warn "No database backup found (recommended before deployment)"
}

# 4. Dependencies
Write-Host ""
Write-Host "4. Dependencies" -ForegroundColor Cyan
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan

# 4.1 All dependencies installed
Log-Check "4.1 Checking dependencies..."
if ((Test-Path "pnpm-lock.yaml") -or (Test-Path "package-lock.json")) {
    if (Test-Path "node_modules") {
        Write-Pass "Dependencies installed"
    } else {
        Write-Fail "Dependencies not installed (run: pnpm install)"
    }
} else {
    Write-Skip "No lock file found"
}

# 4.2 Lock files committed
Log-Check "4.2 Checking lock files..."
if (Test-Path "pnpm-lock.yaml") {
    if (Test-Path ".git") {
        $gitStatus = git ls-files --error-unmatch pnpm-lock.yaml 2>&1
        if ($LASTEXITCODE -eq 0) {
            Write-Pass "Lock file committed"
        } else {
            Write-Warn "Lock file not committed"
        }
    } else {
        Write-Skip "Not a git repository"
    }
} else {
    Write-Skip "No lock file found"
}

# 4.3 Security vulnerabilities
Log-Check "4.3 Checking for security vulnerabilities..."
try {
    $null = Get-Command pnpm -ErrorAction Stop
    $auditResult = pnpm audit --audit-level=high 2>&1
    if ($auditResult -match "found.*vulnerabilities") {
        Write-Warn "Security vulnerabilities found (run: pnpm audit)"
    } else {
        Write-Pass "No high-severity vulnerabilities"
    }
} catch {
    Write-Skip "pnpm not found, skipping security audit"
}

# 4.4 Build succeeds
Log-Check "4.4 Testing build..."
try {
    $null = Get-Command pnpm -ErrorAction Stop
    $buildResult = pnpm build 2>&1
    if ($buildResult -match "error|Error|failed") {
        Write-Fail "Build failed"
    } else {
        Write-Pass "Build succeeds"
    }
} catch {
    Write-Skip "pnpm not found, skipping build test"
}

# 5. Git Status
Write-Host ""
Write-Host "5. Git Status" -ForegroundColor Cyan
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan

# 5.1 Clean working directory
Log-Check "5.1 Checking git status..."
if (Test-Path ".git") {
    $gitStatus = git status --porcelain 2>&1
    if ([string]::IsNullOrWhiteSpace($gitStatus)) {
        Write-Pass "Working directory clean"
    } else {
        Write-Warn "Uncommitted changes found"
        git status --short | Select-Object -First 5
    }
} else {
    Write-Skip "Not a git repository"
}

# 5.2 On correct branch
Log-Check "5.2 Checking current branch..."
if (Test-Path ".git") {
    $currentBranch = git branch --show-current 2>&1
    if ($currentBranch -eq "main" -or $currentBranch -eq "master") {
        Write-Pass "On main/master branch"
    } else {
        Write-Warn "Not on main/master branch (current: $currentBranch)"
    }
} else {
    Write-Skip "Not a git repository"
}

# 5.3 Up to date with remote
Log-Check "5.3 Checking if up to date with remote..."
if (Test-Path ".git") {
    git fetch -q 2>&1 | Out-Null
    $local = git rev-parse @ 2>&1
    $remote = git rev-parse @{u} 2>&1
    if ($LASTEXITCODE -ne 0) {
        Write-Skip "No remote tracking branch"
    } elseif ($local -eq $remote) {
        Write-Pass "Up to date with remote"
    } else {
        Write-Warn "Not up to date with remote (run: git pull)"
    }
} else {
    Write-Skip "Not a git repository"
}

# 6. Application-Specific Checks
Write-Host ""
Write-Host "6. Application-Specific Checks" -ForegroundColor Cyan
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan

# 6.1 API service
Log-Check "6.1 Checking API service..."
if (Test-Path "services/api") {
    if (Test-Path "services/api/package.json") {
        Write-Pass "API service found"
    } else {
        Write-Fail "API service package.json missing"
    }
} else {
    Write-Skip "API service not found"
}

# 6.2 Frontend apps
Log-Check "6.2 Checking frontend applications..."
$apps = @("apps/m-ops-services", "apps/os-admin", "apps/m-project-owner")
$foundApps = 0

foreach ($app in $apps) {
    if ((Test-Path $app) -and (Test-Path "$app/package.json")) {
        $foundApps++
    }
}

if ($foundApps -eq $apps.Count) {
    Write-Pass "All frontend applications found"
} else {
    Write-Warn "Some applications missing ($foundApps/$($apps.Count) found)"
}

# Summary
Write-Host ""
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
Write-Host "📊 Checklist Summary" -ForegroundColor Cyan
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
Write-Host "✅ Passed: $($script:Passed)" -ForegroundColor Green
Write-Host "⚠️  Warnings: $($script:Warnings)" -ForegroundColor Yellow
Write-Host "❌ Failed: $($script:Failed)" -ForegroundColor Red
Write-Host "⏭️  Skipped: $($script:Skipped)" -ForegroundColor Yellow
Write-Host ""

if ($script:Failed -eq 0) {
    if ($script:Warnings -eq 0) {
        Write-Host "✅ All checks passed! Ready for deployment." -ForegroundColor Green
        exit 0
    } else {
        Write-Host "⚠️  Checks passed with warnings. Review warnings before deploying." -ForegroundColor Yellow
        exit 0
    }
} else {
    Write-Host "❌ Some checks failed. Please fix issues before deploying." -ForegroundColor Red
    exit 1
}
