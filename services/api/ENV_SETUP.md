# Environment Variables Setup

## Required Environment Variables

Copy this to your `.env` file in `services/api/`:

```env
# Database
SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
SUPABASE_ANON_KEY=your_supabase_anon_key

# API Configuration
API_BASE_URL=http://localhost:3001
PORT=3001

# API Key Security
# Use 'sha256' (default, fast) or 'bcrypt' (slower, more secure)
API_KEY_HASH_ALGORITHM=sha256
# Only used if hashAlgorithm is 'bcrypt'
API_KEY_BCRYPT_ROUNDS=12

# Rate Limiting
RATE_LIMIT_WINDOW_MS=60000
RATE_LIMIT_GLOBAL_MAX=100
RATE_LIMIT_USE_KEY_LIMIT=true

# Redis Configuration (Optional - for distributed rate limiting)
# If not configured, rate limiting falls back to in-memory store
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=
REDIS_DB=0

# Immutable Audit Logging
# IMPORTANT: Set a strong, random key for production
# Generate with: openssl rand -hex 32
AUDIT_SIGNING_KEY=your_audit_signing_key_here
AUDIT_SEPARATE_STORAGE=false
AUDIT_ARCHIVE_AFTER_DAYS=365
AUDIT_HASH_SENSITIVE_DATA=true
AUDIT_INCLUDE_REQUEST_BODY=true
AUDIT_INCLUDE_RESPONSE_BODY=false
AUDIT_RETENTION_DAYS=2555

# Security
NODE_ENV=development
```

## Supabase Credentials

**📖 See [SUPABASE_SETUP.md](./SUPABASE_SETUP.md) for detailed instructions on retrieving your Supabase credentials.**

Quick steps:
1. Go to your Supabase project dashboard
2. Navigate to **Settings > API**
3. Copy your **Project URL** → `SUPABASE_URL`
4. Copy your **anon/public** key → `SUPABASE_ANON_KEY`
5. Copy your **service_role** key → `SUPABASE_SERVICE_ROLE_KEY`

## Quick Setup Commands

### Generate Audit Signing Key
```bash
# Using OpenSSL
openssl rand -hex 32

# Or using Node.js
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### Test Redis Connection
```bash
redis-cli ping
# Should return: PONG
```
