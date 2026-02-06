# Production Readiness Checklist

**Date:** February 6, 2026
**Status:** In Progress
**Overall Completion:** ~75%

---

## 1. SECURITY CHECKLIST

### Authentication & Authorization
- [x] All API endpoints require authentication via `authenticateUser` middleware
- [x] RBAC enforced via `requirePermission` middleware
- [x] SQL injection prevention (Prisma ORM, no raw SQL with user input)
- [x] XSS prevention (React escaping + HTML sanitization middleware)
- [x] Rate limiting: 100 req/min per user, 500/org, 50 global, 10 for auth routes
- [x] Environment variables not committed to git (`.env.local` gitignored)
- [x] Secrets stored in Railway/Vercel platform dashboards
- [x] 2FA/TOTP support with backup codes (SHA256 hashed)
- [x] API key authentication with SHA256 hashing and scoped access
- [x] Webhook signature verification (Stripe HMAC-SHA256)

### Security Headers (Implemented)
- [x] HSTS with preload (`max-age=31536000; includeSubDomains; preload`)
- [x] X-Frame-Options: DENY
- [x] X-Content-Type-Options: nosniff
- [x] Referrer-Policy: strict-origin-when-cross-origin
- [x] Permissions-Policy (geo, mic, camera disabled; payment self-only)
- [x] X-Powered-By header removed
- [x] Content-Security-Policy configured

### Production Hardening (NEW - Feb 2026)
- [x] **Graceful shutdown handler** - SIGTERM/SIGINT signals, Prisma disconnect, log flush
- [x] **Test routes gated** - `/api/test-sentry` only available in non-production
- [x] **Swagger/API docs gated** - `/docs` only available in non-production
- [x] **CORS wildcards tightened** - Explicit origin list instead of `*.kealee.com`
- [x] **Error handler hardened** - Stack traces only in local development, never in staging/preview
- [x] **Request ID traceability** - X-Request-ID header on all requests/responses
- [x] **Unhandled rejection/exception handlers** - Logged + Sentry capture + clean exit
- [x] **Environment validation enforced** - Missing required vars in production = fatal exit
- [x] **Duplicate route registrations removed** - Cleaned /api scope duplication
- [x] **Connection pool configured** - Prisma pool_timeout=30, configurable via DATABASE_POOL_SIZE

### Remaining Security Items
- [ ] **CSRF protection** - `@fastify/csrf-protection` v5.x incompatible with Fastify v4.x
  - Workaround: SameSite=strict cookies + CORS restrictions provide partial protection
  - Action: Upgrade to Fastify v5 or use compatible CSRF package
- [ ] **CSP unsafe-inline/unsafe-eval** - Required by Stripe.js and Swagger UI
  - Action: Implement nonce-based CSP when Stripe supports it

---

## 2. DATABASE CHECKLIST

- [x] **Prisma schema** - 7,349 lines, 100+ models, 500+ indexes
- [x] **Connection pooling** - Configurable via `DATABASE_POOL_SIZE` env var (default: 10)
- [x] **Singleton pattern** - Global PrismaClient caching prevents connection exhaustion
- [x] **Financial precision** - `@db.Decimal(12,2)` and `@db.Decimal(19,4)` for money fields
- [x] **Cascade policies** - Proper onDelete: Cascade/SetNull on all relations
- [x] **Immutable audit logs** - PostgreSQL trigger prevents UPDATE/DELETE on SecurityAuditLog
- [x] **Transaction patterns** - Atomic operations for escrow, journal entries, financial ops
- [x] **Graceful disconnect** - Prisma `$disconnect()` called on shutdown signals
- [ ] **Run migrations in production** - `npx prisma migrate deploy`
- [ ] **Automated daily backups** - Configure Railway PostgreSQL backup schedule
- [ ] **Complete seed data** - Admin user, default roles, jurisdictions

---

## 3. ENVIRONMENT VARIABLES

### Railway (API & PostgreSQL) - Required
| Variable | Status | Notes |
|----------|--------|-------|
| `DATABASE_URL` | Auto-provided | From Railway PostgreSQL |
| `SUPABASE_URL` | Verify | Must be production URL |
| `SUPABASE_SERVICE_ROLE_KEY` | Verify | Production key |
| `STRIPE_SECRET_KEY` | Verify | Must be `sk_live_*` |
| `API_BASE_URL` | Verify | `https://api.kealee.com` |
| `APP_ENV` | Set | `production` |
| `SENTRY_DSN` | Recommended | Error tracking |
| `REDIS_URL` | Recommended | Caching & job queues |
| `DATABASE_POOL_SIZE` | Optional | Default: 10 |

**NEW**: App will fail to start in production if `DATABASE_URL`, `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `STRIPE_SECRET_KEY`, or `API_BASE_URL` is missing.

### Vercel (All Apps)
| Variable | Status | Notes |
|----------|--------|-------|
| `NEXT_PUBLIC_API_URL` | Verify | Production API URL |
| `NEXT_PUBLIC_SUPABASE_URL` | Verify | Production Supabase |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Verify | Production anon key |

---

## 4. STRIPE SETUP

- [ ] Switch to live mode (update `STRIPE_SECRET_KEY` to `sk_live_*`)
- [ ] Create products/prices in live mode (Package A-D)
- [ ] Configure webhook endpoint: `https://api.kealee.com/webhooks/stripe`
- [ ] Test webhook signature verification with Stripe CLI
- [ ] Test billing portal session creation

---

## 5. DOMAIN CONFIGURATION

- [ ] Add custom domains to Vercel projects
  - `admin.kealee.com` -> os-admin
  - `pm.kealee.com` -> os-pm
  - `ops.kealee.com` -> m-ops-services
  - `architect.kealee.com` -> m-architect
  - `permits.kealee.com` -> m-permits-inspections
- [ ] Configure DNS CNAME records
- [ ] Verify SSL certificates (auto-provisioned by Vercel/Railway)
- [ ] Set up www -> non-www redirects

---

## 6. EMAIL SETUP

- [ ] Configure Resend or SendGrid with API key
- [ ] Create transactional email templates (welcome, password reset, invoice, etc.)
- [ ] Set up SPF/DKIM DNS records for `kealee.com`
- [ ] Test email deliverability

---

## 7. OBSERVABILITY

- [x] **Sentry error tracking** - Initialized with environment-aware sampling (10% prod, 100% dev)
- [x] **Structured request logging** - Method, URL, duration, user ID, org ID
- [x] **Health check endpoints** - `/health`, `/health/detailed`, `/health/db`, `/health/redis`
- [x] **Request ID correlation** - X-Request-ID in all request/response/error payloads
- [x] **Batch request logging** - Async database writes with 50-record batches
- [ ] Set `SENTRY_DSN` in production Railway dashboard
- [ ] Configure alerting thresholds for health degradation

---

## SUMMARY

### Completed (~75%)
- Authentication, RBAC, API key management, 2FA
- Security headers (HSTS, CSP, X-Frame-Options, etc.)
- Rate limiting (multi-tier: user, org, global, endpoint-specific)
- Error handling with structured responses and request ID correlation
- Graceful shutdown with signal handling
- Database indexing, connection pooling, transactions
- Health check endpoints with dependency checks
- Sentry integration and structured logging
- Production environment validation (fail-fast)
- Test route and Swagger gating in production

### Remaining (~25%)
- CSRF protection (blocked by Fastify v4/plugin incompatibility)
- Stripe live mode activation
- Domain/DNS configuration
- Email provider setup
- Automated database backups
- End-to-end testing in production environment

---

### CRITICAL BLOCKERS FOR GO-LIVE

1. **Stripe LIVE Mode** - Cannot process real payments without live keys
2. **Database Migrations** - Run `prisma migrate deploy` in production
3. **Environment Variables** - Verify all required vars are set in Railway/Vercel
4. **Domain Configuration** - Apps not accessible via custom domains
5. **Email Setup** - Cannot send transactional emails

---

**Last Updated:** February 6, 2026
**Next Review:** Before go-live
