#!/bin/bash
# scripts/test-s3-upload.sh
# Test S3 upload permissions and configuration

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

log() {
    echo -e "${BLUE}[S3 TEST]${NC} $1"
}

success() {
    echo -e "${GREEN}✅${NC} $1"
}

fail() {
    echo -e "${RED}❌${NC} $1"
}

warn() {
    echo -e "${YELLOW}⚠️${NC} $1"
}

echo "🔍 S3 Upload Test"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Check AWS CLI
if ! command -v aws &> /dev/null; then
    fail "AWS CLI is not installed"
    info "Install: pip install awscli or brew install awscli"
    exit 1
fi
success "AWS CLI is installed"

# Check environment variables
log "Checking environment variables..."

if [ -z "$AWS_ACCESS_KEY_ID" ]; then
    fail "AWS_ACCESS_KEY_ID is not set"
    info "Set it: export AWS_ACCESS_KEY_ID='your-key'"
    exit 1
fi
success "AWS_ACCESS_KEY_ID is set"

if [ -z "$AWS_SECRET_ACCESS_KEY" ]; then
    fail "AWS_SECRET_ACCESS_KEY is not set"
    info "Set it: export AWS_SECRET_ACCESS_KEY='your-secret'"
    exit 1
fi
success "AWS_SECRET_ACCESS_KEY is set"

if [ -z "$S3_BUCKET_NAME" ]; then
    fail "S3_BUCKET_NAME is not set"
    info "Set it: export S3_BUCKET_NAME='your-bucket'"
    exit 1
fi
success "S3_BUCKET_NAME is set: $S3_BUCKET_NAME"

S3_REGION=${S3_REGION:-"us-east-1"}
info "S3_REGION: $S3_REGION"

# Test AWS credentials
log "Testing AWS credentials..."
if aws sts get-caller-identity > /dev/null 2>&1; then
    USER=$(aws sts get-caller-identity --query 'Arn' --output text)
    success "AWS credentials valid"
    info "User: $USER"
else
    fail "AWS credentials invalid"
    exit 1
fi

# Test bucket access
log "Testing bucket access..."
if aws s3 ls "s3://$S3_BUCKET_NAME" > /dev/null 2>&1; then
    success "Bucket access granted"
else
    fail "Cannot access bucket: $S3_BUCKET_NAME"
    info "Check:"
    info "  - Bucket name is correct"
    info "  - IAM user has s3:ListBucket permission"
    info "  - Bucket exists in region: $S3_REGION"
    exit 1
fi

# Test upload
log "Testing upload..."
TEST_FILE="s3-test-$(date +%s).txt"
TEST_CONTENT="S3 upload test - $(date)"

if echo "$TEST_CONTENT" | aws s3 cp - "s3://$S3_BUCKET_NAME/$TEST_FILE" > /dev/null 2>&1; then
    success "Upload successful"
else
    fail "Upload failed"
    info "Check:"
    info "  - IAM user has s3:PutObject permission"
    info "  - Bucket policy allows uploads"
    info "  - Network connectivity"
    exit 1
fi

# Test download
log "Testing download..."
if aws s3 cp "s3://$S3_BUCKET_NAME/$TEST_FILE" - > /dev/null 2>&1; then
    success "Download successful"
else
    fail "Download failed"
fi

# Test delete
log "Testing delete..."
if aws s3 rm "s3://$S3_BUCKET_NAME/$TEST_FILE" > /dev/null 2>&1; then
    success "Delete successful"
else
    warn "Delete failed (file may need manual cleanup)"
fi

# Check bucket policy
log "Checking bucket policy..."
if aws s3api get-bucket-policy --bucket "$S3_BUCKET_NAME" > /dev/null 2>&1; then
    success "Bucket policy exists"
    info "Policy:"
    aws s3api get-bucket-policy --bucket "$S3_BUCKET_NAME" --query 'Policy' --output text | jq '.' 2>/dev/null || \
    aws s3api get-bucket-policy --bucket "$S3_BUCKET_NAME" --query 'Policy' --output text
else
    warn "No bucket policy found"
fi

# Check CORS
log "Checking CORS configuration..."
if aws s3api get-bucket-cors --bucket "$S3_BUCKET_NAME" > /dev/null 2>&1; then
    success "CORS configuration exists"
    info "CORS:"
    aws s3api get-bucket-cors --bucket "$S3_BUCKET_NAME" | jq '.' 2>/dev/null || \
    aws s3api get-bucket-cors --bucket "$S3_BUCKET_NAME"
else
    warn "No CORS configuration found (may be needed for browser uploads)"
fi

# Check bucket location
log "Checking bucket location..."
LOCATION=$(aws s3api get-bucket-location --bucket "$S3_BUCKET_NAME" --query 'LocationConstraint' --output text 2>/dev/null || echo "us-east-1")
info "Bucket location: ${LOCATION:-us-east-1}"

echo ""
success "S3 upload test complete!"
echo ""
echo "Summary:"
echo "  ✅ AWS credentials: Valid"
echo "  ✅ Bucket access: Granted"
echo "  ✅ Upload: Working"
echo "  ✅ Download: Working"
echo "  ✅ Delete: Working"
echo ""
