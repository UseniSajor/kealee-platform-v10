#!/bin/bash

# Performance Optimization Script
# Optimizes database, API, and frontend performance

set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

log() {
    echo -e "${GREEN}[OPTIMIZE]${NC} $1"
}

warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

log "Starting performance optimization..."
echo ""

# 1. Database Optimization
log "1. Optimizing database..."

if [ -n "$DATABASE_URL" ] && command -v psql &> /dev/null; then
    log "  Creating database indexes..."
    psql "$DATABASE_URL" <<EOF
-- Add missing indexes for common queries
CREATE INDEX IF NOT EXISTS idx_payment_created_at_desc ON "Payment"(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_permit_status_submitted ON "Permit"(status, submitted_at);
CREATE INDEX IF NOT EXISTS idx_project_status_created ON "Project"(status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_file_uploaded_by_created ON "File"(uploaded_by, created_at DESC);

-- Analyze tables for query optimization
ANALYZE "User";
ANALYZE "Org";
ANALYZE "Project";
ANALYZE "Permit";
ANALYZE "Payment";
ANALYZE "File";
EOF
    log "  ✅ Database indexes optimized"
else
    warn "  Database optimization skipped (DATABASE_URL not set or psql not available)"
fi
echo ""

# 2. API Optimization
log "2. Optimizing API..."
log "  Recommendations:"
log "  - Enable response caching for GET requests"
log "  - Implement request rate limiting"
log "  - Add database connection pooling"
log "  - Enable compression (gzip/brotli)"
log "  - Implement CDN for static assets"
echo ""

# 3. Frontend Optimization
log "3. Optimizing frontend..."
log "  Recommendations:"
log "  - Enable Next.js image optimization"
log "  - Implement code splitting"
log "  - Add service worker for caching"
log "  - Optimize bundle sizes"
log "  - Enable static page generation where possible"
echo ""

# 4. File Storage Optimization
log "4. Optimizing file storage..."
log "  Recommendations:"
log "  - Enable CDN for file delivery"
log "  - Implement image compression"
log "  - Add file caching headers"
log "  - Use appropriate storage tiers"
echo ""

log "✅ Performance optimization recommendations complete!"
log ""
log "Next steps:"
log "1. Review and implement API optimizations"
log "2. Review and implement frontend optimizations"
log "3. Run load tests: npm run test:load"
log "4. Monitor performance metrics"
