#!/bin/bash

# File Upload Testing Script
# Tests file uploads for m-architect app

set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

API_URL=${API_URL:-http://localhost:3001}
AUTH_TOKEN=${AUTH_TOKEN:-""}

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

# Check if auth token is provided
if [ -z "$AUTH_TOKEN" ]; then
    warn "AUTH_TOKEN not set. Set it to test authenticated endpoints."
    warn "Example: AUTH_TOKEN=your_token ./scripts/test-file-upload.sh"
fi

log "Testing file upload for m-architect"
log "API URL: $API_URL"
echo ""

# Test 1: Get presigned URL
log "Test 1: Getting presigned URL for small file..."
SMALL_FILE="test-small.txt"
echo "Test file content" > "$SMALL_FILE"

RESPONSE=$(curl -s -X POST "$API_URL/architect/files/presigned-url" \
  -H "Authorization: Bearer $AUTH_TOKEN" \
  -H "Content-Type: application/json" \
  -d "{
    \"designProjectId\": \"test-project-uuid\",
    \"fileName\": \"$SMALL_FILE\",
    \"mimeType\": \"text/plain\",
    \"fileSize\": $(stat -f%z "$SMALL_FILE" 2>/dev/null || stat -c%s "$SMALL_FILE" 2>/dev/null || echo 0)
  }")

if echo "$RESPONSE" | grep -q "uploadUrl"; then
    log "✅ Presigned URL received"
    UPLOAD_URL=$(echo "$RESPONSE" | grep -o '"uploadUrl":"[^"]*' | cut -d'"' -f4)
    FILE_ID=$(echo "$RESPONSE" | grep -o '"fileId":"[^"]*' | cut -d'"' -f4)
    log "   Upload URL: ${UPLOAD_URL:0:50}..."
    log "   File ID: $FILE_ID"
else
    error "Failed to get presigned URL: $RESPONSE"
fi

# Test 2: Upload small file
log ""
log "Test 2: Uploading small file..."
UPLOAD_RESPONSE=$(curl -s -X PUT "$UPLOAD_URL" \
  -H "Content-Type: text/plain" \
  --data-binary "@$SMALL_FILE")

if [ $? -eq 0 ]; then
    log "✅ Small file uploaded successfully"
else
    error "Failed to upload small file"
fi

# Test 3: Upload large file (if available)
log ""
log "Test 3: Testing large file upload..."
LARGE_FILE="test-large.bin"
if [ ! -f "$LARGE_FILE" ]; then
    log "Creating test large file (100MB)..."
    dd if=/dev/zero of="$LARGE_FILE" bs=1M count=100 2>/dev/null || {
        warn "Failed to create large test file. Skipping large file test."
        LARGE_FILE=""
    }
fi

if [ -n "$LARGE_FILE" ] && [ -f "$LARGE_FILE" ]; then
    FILE_SIZE=$(stat -f%z "$LARGE_FILE" 2>/dev/null || stat -c%s "$LARGE_FILE" 2>/dev/null || echo 0)
    
    RESPONSE=$(curl -s -X POST "$API_URL/architect/files/presigned-url" \
      -H "Authorization: Bearer $AUTH_TOKEN" \
      -H "Content-Type: application/json" \
      -d "{
        \"designProjectId\": \"test-project-uuid\",
        \"fileName\": \"$LARGE_FILE\",
        \"mimeType\": \"application/octet-stream\",
        \"fileSize\": $FILE_SIZE
      }")
    
    if echo "$RESPONSE" | grep -q "uploadUrl"; then
        UPLOAD_URL=$(echo "$RESPONSE" | grep -o '"uploadUrl":"[^"]*' | cut -d'"' -f4)
        log "✅ Presigned URL for large file received"
        log "   Uploading $FILE_SIZE bytes..."
        
        UPLOAD_RESPONSE=$(curl -s -X PUT "$UPLOAD_URL" \
          -H "Content-Type: application/octet-stream" \
          --data-binary "@$LARGE_FILE")
        
        if [ $? -eq 0 ]; then
            log "✅ Large file uploaded successfully"
        else
            warn "Large file upload may have failed"
        fi
    fi
fi

# Test 4: List files
log ""
log "Test 4: Listing files..."
LIST_RESPONSE=$(curl -s -X GET "$API_URL/architect/files?designProjectId=test-project-uuid" \
  -H "Authorization: Bearer $AUTH_TOKEN")

if echo "$LIST_RESPONSE" | grep -q "files"; then
    log "✅ Files listed successfully"
    FILE_COUNT=$(echo "$LIST_RESPONSE" | grep -o '"files"' | wc -l)
    log "   Found files in response"
else
    warn "File listing may have failed: $LIST_RESPONSE"
fi

# Cleanup
rm -f "$SMALL_FILE" "$LARGE_FILE"

log ""
log "✅ File upload testing complete!"
log ""
log "Next steps:"
log "1. Test version control features"
log "2. Test collaboration features"
log "3. Verify files in S3/R2 bucket"
log "4. Test file download"
