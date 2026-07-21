# scripts/git-push-all.ps1
# PowerShell script to push all changes to git repositories

$ErrorActionPreference = "Stop"

function Write-Log {
    param([string]$Message)
    Write-Host "[GIT] $Message" -ForegroundColor Blue
}

function Write-Success {
    param([string]$Message)
    Write-Host "✅ $Message" -ForegroundColor Green
}

function Write-Warn {
    param([string]$Message)
    Write-Host "⚠️ $Message" -ForegroundColor Yellow
}

function Write-Error {
    param([string]$Message)
    Write-Host "❌ $Message" -ForegroundColor Red
}

Write-Host "📤 Git Push - Kealee Platform" -ForegroundColor Cyan
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# Check if git is initialized
if (-not (Test-Path ".git")) {
    Write-Log "Initializing git repository..."
    git init
    Write-Success "Git repository initialized"
}

# Check for changes
$status = git status --porcelain
if ([string]::IsNullOrWhiteSpace($status)) {
    Write-Warn "No changes to commit"
    exit 0
}

# Show status
Write-Log "Current git status:"
git status --short

# Ask for commit message
Write-Host ""
$commitMsg = Read-Host "Commit message (or press Enter for default)"
if ([string]::IsNullOrWhiteSpace($commitMsg)) {
    $commitMsg = "Deploy: Complete Kealee Platform v10 - All 77 TODOs completed"
}

# Stage all changes
Write-Log "Staging all changes..."
git add .
Write-Success "Changes staged"

# Commit
Write-Log "Committing changes..."
git commit -m $commitMsg
if ($LASTEXITCODE -ne 0) {
    Write-Error "Commit failed"
    exit 1
}
Write-Success "Changes committed"

# Check for remotes
Write-Log "Checking git remotes..."
$remotes = git remote

if ([string]::IsNullOrWhiteSpace($remotes)) {
    Write-Warn "No git remotes configured"
    Write-Host ""
    Write-Host "To add remotes, run:"
    Write-Host "  git remote add origin YOUR-REPO-URL"
    Write-Host "  git remote add railway RAILWAY-GIT-URL  (Optional)"
    Write-Host "  git remote add vercel VERCEL-GIT-URL   (Optional)"
    Write-Host ""
    $addRemotes = Read-Host "Add remotes now? (y/N)"
    
    if ($addRemotes -eq "y" -or $addRemotes -eq "Y") {
        $originUrl = Read-Host "Origin URL"
        if (-not [string]::IsNullOrWhiteSpace($originUrl)) {
            git remote add origin $originUrl
            Write-Success "Added origin remote"
        }
        
        $railwayUrl = Read-Host "Railway URL (optional)"
        if (-not [string]::IsNullOrWhiteSpace($railwayUrl)) {
            git remote add railway $railwayUrl
            Write-Success "Added railway remote"
        }
        
        $vercelUrl = Read-Host "Vercel URL (optional)"
        if (-not [string]::IsNullOrWhiteSpace($vercelUrl)) {
            git remote add vercel $vercelUrl
            Write-Success "Added vercel remote"
        }
    } else {
        Write-Warn "Skipping remote setup. Push manually later."
        exit 0
    }
}

# Push to remotes
Write-Host ""
Write-Log "Pushing to remotes..."

# Get current branch
$branch = git branch --show-current
if ([string]::IsNullOrWhiteSpace($branch)) {
    $branch = "main"
}

# Push to origin
$remotesList = git remote
if ($remotesList -match "origin") {
    Write-Log "Pushing to origin..."
    git push -u origin $branch
    if ($LASTEXITCODE -eq 0) {
        Write-Success "Pushed to origin/$branch"
    } else {
        Write-Error "Failed to push to origin"
        exit 1
    }
}

# Push to Railway
if ($remotesList -match "railway") {
    Write-Log "Pushing to Railway..."
    git push railway $branch
    if ($LASTEXITCODE -eq 0) {
        Write-Success "Pushed to Railway"
    } else {
        Write-Warn "Failed to push to Railway (may need authentication)"
    }
}

# Push to Vercel
if ($remotesList -match "vercel") {
    Write-Log "Pushing to Vercel..."
    git push vercel $branch
    if ($LASTEXITCODE -eq 0) {
        Write-Success "Pushed to Vercel"
    } else {
        Write-Warn "Failed to push to Vercel (may need authentication)"
    }
}

Write-Host ""
Write-Success "Git push complete!"
Write-Host ""
Write-Host "📊 Push Summary:"
git remote -v
