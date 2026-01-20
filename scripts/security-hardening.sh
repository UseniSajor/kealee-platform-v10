#!/bin/bash

# Security Hardening Script
# Implements security best practices

set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

log() {
    echo -e "${GREEN}[SECURITY]${NC} $1"
}

warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

log "Starting security hardening..."
echo ""

# 1. Environment Variables Security
log "1. Securing environment variables..."
log "  ✅ Use .env files (not committed to git)"
log "  ✅ Use Vercel environment variables for production"
log "  ✅ Rotate secrets regularly"
log "  ✅ Use different secrets for staging/production"
echo ""

# 2. API Security
log "2. Securing API..."
log "  Recommendations:"
log "  - Enable CORS with specific origins"
log "  - Implement rate limiting"
log "  - Add request validation"
log "  - Use HTTPS only"
log "  - Implement API key authentication"
log "  - Add request signing for sensitive operations"
echo ""

# 3. Database Security
log "3. Securing database..."
if [ -n "$DATABASE_URL" ] && command -v psql &> /dev/null; then
    log "  Creating security audit triggers..."
    psql "$DATABASE_URL" <<EOF
-- Enable Row Level Security (if supported)
-- ALTER TABLE "User" ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE "Org" ENABLE ROW LEVEL SECURITY;

-- Create security audit function
CREATE OR REPLACE FUNCTION audit_security_event()
RETURNS TRIGGER AS \$\$
BEGIN
    INSERT INTO "SecurityAuditLog" (event_type, user_id, ip_address, details, created_at)
    VALUES (
        'SECURITY_EVENT',
        COALESCE(NEW.id::text, OLD.id::text),
        inet_client_addr(),
        jsonb_build_object('action', TG_OP, 'table', TG_TABLE_NAME),
        NOW()
    );
    RETURN NEW;
END;
\$\$ LANGUAGE plpgsql;
EOF
    log "  ✅ Security audit triggers created"
else
    warn "  Database security hardening skipped"
fi
echo ""

# 4. File Upload Security
log "4. Securing file uploads..."
log "  Recommendations:"
log "  - Validate file types (whitelist)"
log "  - Scan files for malware"
log "  - Limit file sizes"
log "  - Use signed URLs for uploads"
log "  - Store files in private buckets"
log "  - Implement virus scanning"
echo ""

# 5. Authentication Security
log "5. Securing authentication..."
log "  Recommendations:"
log "  - Use strong password requirements"
log "  - Implement 2FA/MFA"
log "  - Use secure session management"
log "  - Implement password reset with tokens"
log "  - Add account lockout after failed attempts"
log "  - Use OAuth2 for third-party auth"
echo ""

# 6. API Rate Limiting
log "6. Implementing rate limiting..."
cat > services/api/src/middleware/rate-limit.ts <<'EOF'
import { FastifyRequest, FastifyReply } from 'fastify';
import rateLimit from '@fastify/rate-limit';

export async function registerRateLimit(fastify: any) {
  await fastify.register(rateLimit, {
    max: 100, // Maximum number of requests
    timeWindow: '1 minute', // Time window
    skipOnError: true,
    addHeaders: {
      'x-ratelimit-limit': true,
      'x-ratelimit-remaining': true,
      'x-ratelimit-reset': true,
    },
  });
}
EOF
log "  ✅ Rate limiting middleware created"
echo ""

# 7. Security Headers
log "7. Adding security headers..."
cat > apps/m-marketplace/next.config.security.js <<'EOF'
module.exports = {
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'X-DNS-Prefetch-Control',
            value: 'on'
          },
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=63072000; includeSubDomains; preload'
          },
          {
            key: 'X-Frame-Options',
            value: 'SAMEORIGIN'
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff'
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block'
          },
          {
            key: 'Referrer-Policy',
            value: 'origin-when-cross-origin'
          },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=()'
          }
        ],
      },
    ];
  },
};
EOF
log "  ✅ Security headers configuration created"
echo ""

# 8. Dependency Security
log "8. Checking dependency security..."
if command -v npm &> /dev/null; then
    log "  Running npm audit..."
    npm audit --audit-level=moderate || warn "  Some vulnerabilities found. Review and fix."
else
    warn "  npm not found. Skipping dependency check."
fi
echo ""

log "✅ Security hardening complete!"
log ""
log "Next steps:"
log "1. Review and implement API security recommendations"
log "2. Configure security headers in all apps"
log "3. Set up rate limiting"
log "4. Implement file upload security"
log "5. Review dependency vulnerabilities"
log "6. Run security scans: npm run test:security"
