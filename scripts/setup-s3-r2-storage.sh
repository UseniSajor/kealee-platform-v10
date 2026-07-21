#!/bin/bash

# S3/R2 Storage Setup Script
# Sets up file storage for m-architect and other apps

set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

STORAGE_PROVIDER=${1:-r2}  # r2 or s3
BUCKET_NAME=${2:-kealee-uploads}

log() {
    echo -e "${GREEN}[$(date '+%Y-%m-%d %H:%M:%S')]${NC} $1"
}

error() {
    echo -e "${RED}[$(date '+%Y-%m-%d %H:%M:%S')] ERROR:${NC} $1"
    exit 1
}

warn() {
    echo -e "${YELLOW}[$(date '+%Y-%m-%d %H:%M:%S')] WARNING:${NC} $1"
}

if [ "$STORAGE_PROVIDER" = "r2" ]; then
    log "Setting up Cloudflare R2 storage..."
    
    # Check if R2 credentials are set
    if [ -z "$R2_ACCOUNT_ID" ] || [ -z "$R2_ACCESS_KEY_ID" ] || [ -z "$R2_SECRET_ACCESS_KEY" ]; then
        error "R2 credentials not set. Set R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, and R2_SECRET_ACCESS_KEY"
    fi
    
    log "R2 Account ID: $R2_ACCOUNT_ID"
    log "Bucket Name: $BUCKET_NAME"
    
    # Create bucket using R2 API
    log "Creating R2 bucket..."
    
    # Note: R2 buckets are created via Cloudflare Dashboard or API
    # This script provides instructions
    echo ""
    echo "To create R2 bucket:"
    echo "1. Go to Cloudflare Dashboard → R2"
    echo "2. Click 'Create bucket'"
    echo "3. Name: $BUCKET_NAME"
    echo "4. Location: Auto"
    echo ""
    echo "Or use Cloudflare API:"
    echo "curl -X POST \"https://api.cloudflare.com/client/v4/accounts/$R2_ACCOUNT_ID/r2/buckets\" \\"
    echo "  -H \"Authorization: Bearer \$CLOUDFLARE_API_TOKEN\" \\"
    echo "  -H \"Content-Type: application/json\" \\"
    echo "  -d '{\"name\":\"$BUCKET_NAME\"}'"
    echo ""
    
    # Configure CORS
    log "Configuring CORS..."
    echo "CORS configuration should be set in Cloudflare Dashboard → R2 → $BUCKET_NAME → Settings → CORS"
    echo ""
    echo "CORS Policy:"
    cat <<EOF
[
  {
    "AllowedOrigins": [
      "https://architect.kealee.com",
      "https://ops.kealee.com",
      "https://app.kealee.com"
    ],
    "AllowedMethods": ["GET", "PUT", "POST", "DELETE", "HEAD"],
    "AllowedHeaders": ["*"],
    "ExposeHeaders": ["ETag"],
    "MaxAgeSeconds": 3600
  }
]
EOF
    
    log "✅ R2 setup instructions provided"
    log "Next steps:"
    log "1. Create bucket in Cloudflare Dashboard"
    log "2. Configure CORS policy"
    log "3. Set environment variables in backend API"
    
elif [ "$STORAGE_PROVIDER" = "s3" ]; then
    log "Setting up AWS S3 storage..."
    
    # Check if AWS credentials are set
    if [ -z "$AWS_ACCESS_KEY_ID" ] || [ -z "$AWS_SECRET_ACCESS_KEY" ]; then
        error "AWS credentials not set. Set AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY"
    fi
    
    AWS_REGION=${AWS_REGION:-us-east-1}
    log "AWS Region: $AWS_REGION"
    log "Bucket Name: $BUCKET_NAME"
    
    # Check if AWS CLI is installed
    if ! command -v aws &> /dev/null; then
        warn "AWS CLI not found. Install with: brew install awscli"
        warn "Or use AWS Console to create bucket"
        exit 1
    fi
    
    # Create bucket
    log "Creating S3 bucket..."
    if aws s3 mb "s3://$BUCKET_NAME" --region "$AWS_REGION" 2>/dev/null; then
        log "✅ Bucket created: $BUCKET_NAME"
    else
        warn "Bucket may already exist or creation failed"
    fi
    
    # Enable versioning
    log "Enabling versioning..."
    aws s3api put-bucket-versioning \
        --bucket "$BUCKET_NAME" \
        --versioning-configuration Status=Enabled
    
    # Enable encryption
    log "Enabling encryption..."
    aws s3api put-bucket-encryption \
        --bucket "$BUCKET_NAME" \
        --server-side-encryption-configuration '{
            "Rules": [{
                "ApplyServerSideEncryptionByDefault": {
                    "SSEAlgorithm": "AES256"
                }
            }]
        }'
    
    # Configure bucket policy
    log "Configuring bucket policy..."
    cat > /tmp/bucket-policy.json <<EOF
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "AllowPublicRead",
      "Effect": "Allow",
      "Principal": "*",
      "Action": "s3:GetObject",
      "Resource": "arn:aws:s3:::${BUCKET_NAME}/*",
      "Condition": {
        "StringEquals": {
          "s3:ExistingObjectTag/Public": "true"
        }
      }
    },
    {
      "Sid": "DenyUnencryptedUploads",
      "Effect": "Deny",
      "Principal": "*",
      "Action": "s3:PutObject",
      "Resource": "arn:aws:s3:::${BUCKET_NAME}/*",
      "Condition": {
        "StringNotEquals": {
          "s3:x-amz-server-side-encryption": "AES256"
        }
      }
    }
  ]
}
EOF
    
    aws s3api put-bucket-policy \
        --bucket "$BUCKET_NAME" \
        --policy file:///tmp/bucket-policy.json
    
    # Configure CORS
    log "Configuring CORS..."
    cat > /tmp/cors-config.json <<EOF
{
  "CORSRules": [
    {
      "AllowedOrigins": [
        "https://architect.kealee.com",
        "https://ops.kealee.com",
        "https://app.kealee.com"
      ],
      "AllowedMethods": ["GET", "PUT", "POST", "DELETE", "HEAD"],
      "AllowedHeaders": ["*"],
      "ExposeHeaders": ["ETag"],
      "MaxAgeSeconds": 3600
    }
  ]
}
EOF
    
    aws s3api put-bucket-cors \
        --bucket "$BUCKET_NAME" \
        --cors-configuration file:///tmp/cors-config.json
    
    log "✅ S3 bucket configured successfully"
    log "Bucket: $BUCKET_NAME"
    log "Region: $AWS_REGION"
    log "Versioning: Enabled"
    log "Encryption: Enabled"
    
    # Cleanup
    rm -f /tmp/bucket-policy.json /tmp/cors-config.json
    
else
    error "Invalid storage provider: $STORAGE_PROVIDER. Use 'r2' or 's3'"
fi

log "✅ Storage setup complete!"
log ""
log "Next steps:"
log "1. Set environment variables in backend API:"
if [ "$STORAGE_PROVIDER" = "r2" ]; then
    log "   R2_ACCOUNT_ID=$R2_ACCOUNT_ID"
    log "   R2_ACCESS_KEY_ID=$R2_ACCESS_KEY_ID"
    log "   R2_SECRET_ACCESS_KEY=$R2_SECRET_ACCESS_KEY"
    log "   R2_BUCKET_NAME=$BUCKET_NAME"
    log "   R2_ENDPOINT=https://$R2_ACCOUNT_ID.r2.cloudflarestorage.com"
else
    log "   AWS_ACCESS_KEY_ID=$AWS_ACCESS_KEY_ID"
    log "   AWS_SECRET_ACCESS_KEY=$AWS_SECRET_ACCESS_KEY"
    log "   AWS_REGION=$AWS_REGION"
    log "   S3_BUCKET_NAME=$BUCKET_NAME"
fi
log "2. Test file upload from m-architect app"
log "3. Verify files appear in bucket"
