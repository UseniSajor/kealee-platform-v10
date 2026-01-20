# scripts/test-s3-upload.ps1
# Test S3 upload permissions and configuration (PowerShell)

$ErrorActionPreference = "Continue"

function Log-S3Test {
    param([string]$Message)
    Write-Host "[S3 TEST] $Message" -ForegroundColor Cyan
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

Write-Host "🔍 S3 Upload Test" -ForegroundColor Cyan
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
Write-Host ""

# Check AWS CLI
$awsPath = Get-Command aws -ErrorAction SilentlyContinue
if (-not $awsPath) {
    Write-Fail "AWS CLI is not installed"
    Write-Host "Install: pip install awscli or choco install awscli"
    exit 1
}
Write-Success "AWS CLI is installed"

# Check environment variables
Log-S3Test "Checking environment variables..."

if (-not $env:AWS_ACCESS_KEY_ID) {
    Write-Fail "AWS_ACCESS_KEY_ID is not set"
    Write-Host "Set it: `$env:AWS_ACCESS_KEY_ID='your-key'"
    exit 1
}
Write-Success "AWS_ACCESS_KEY_ID is set"

if (-not $env:AWS_SECRET_ACCESS_KEY) {
    Write-Fail "AWS_SECRET_ACCESS_KEY is not set"
    Write-Host "Set it: `$env:AWS_SECRET_ACCESS_KEY='your-secret'"
    exit 1
}
Write-Success "AWS_SECRET_ACCESS_KEY is set"

if (-not $env:S3_BUCKET_NAME) {
    Write-Fail "S3_BUCKET_NAME is not set"
    Write-Host "Set it: `$env:S3_BUCKET_NAME='your-bucket'"
    exit 1
}
Write-Success "S3_BUCKET_NAME is set: $env:S3_BUCKET_NAME"

$s3Region = if ($env:S3_REGION) { $env:S3_REGION } else { "us-east-1" }
Write-Host "S3_REGION: $s3Region" -ForegroundColor Cyan

# Test AWS credentials
Log-S3Test "Testing AWS credentials..."
try {
    $identity = & aws sts get-caller-identity 2>&1
    if ($LASTEXITCODE -eq 0) {
        Write-Success "AWS credentials valid"
        $user = ($identity | ConvertFrom-Json).Arn
        Write-Host "User: $user" -ForegroundColor Cyan
    } else {
        Write-Fail "AWS credentials invalid"
        exit 1
    }
} catch {
    Write-Fail "AWS credentials invalid"
    exit 1
}

# Test bucket access
Log-S3Test "Testing bucket access..."
try {
    & aws s3 ls "s3://$env:S3_BUCKET_NAME" 2>&1 | Out-Null
    if ($LASTEXITCODE -eq 0) {
        Write-Success "Bucket access granted"
    } else {
        Write-Fail "Cannot access bucket: $env:S3_BUCKET_NAME"
        exit 1
    }
} catch {
    Write-Fail "Cannot access bucket: $env:S3_BUCKET_NAME"
    exit 1
}

# Test upload
Log-S3Test "Testing upload..."
$testFile = "s3-test-$(Get-Date -Format 'yyyyMMddHHmmss').txt"
$testContent = "S3 upload test - $(Get-Date)"

try {
    $testContent | & aws s3 cp - "s3://$env:S3_BUCKET_NAME/$testFile" 2>&1 | Out-Null
    if ($LASTEXITCODE -eq 0) {
        Write-Success "Upload successful"
    } else {
        Write-Fail "Upload failed"
        exit 1
    }
} catch {
    Write-Fail "Upload failed"
    exit 1
}

# Test download
Log-S3Test "Testing download..."
try {
    & aws s3 cp "s3://$env:S3_BUCKET_NAME/$testFile" - 2>&1 | Out-Null
    if ($LASTEXITCODE -eq 0) {
        Write-Success "Download successful"
    } else {
        Write-Fail "Download failed"
    }
} catch {
    Write-Fail "Download failed"
}

# Test delete
Log-S3Test "Testing delete..."
try {
    & aws s3 rm "s3://$env:S3_BUCKET_NAME/$testFile" 2>&1 | Out-Null
    if ($LASTEXITCODE -eq 0) {
        Write-Success "Delete successful"
    } else {
        Write-Warn "Delete failed (file may need manual cleanup)"
    }
} catch {
    Write-Warn "Delete failed (file may need manual cleanup)"
}

Write-Host ""
Write-Success "S3 upload test complete!"
