# 🔐 Security Implementation - Complete Guide

## Overview

This document provides a comprehensive guide to the **production-ready security implementation** for the Kealee Platform. All security features have been implemented and are ready for deployment.

**Last Updated:** January 22, 2026  
**Status:** ✅ COMPLETE - Production Ready

---

## Table of Contents

1. [Authentication & Authorization](#1-authentication--authorization)
2. [Rate Limiting](#2-rate-limiting)
3. [Security Headers](#3-security-headers)
4. [Input Validation](#4-input-validation)
5. [Password Security](#5-password-security)
6. [Two-Factor Authentication](#6-two-factor-authentication)
7. [Security Event Logging](#7-security-event-logging)
8. [API Key Management](#8-api-key-management)
9. [Integration Guide](#9-integration-guide)
10. [Security Checklist](#10-security-checklist)

---

## 1. Authentication & Authorization

### Enhanced JWT Authentication

**File:** `services/api/src/middleware/enhanced-auth.ts`

#### Features:
- ✅ **Short-lived access tokens** (15 minutes)
- ✅ **Long-lived refresh tokens** (7 days)
- ✅ **Session management** with Redis
- ✅ **Automatic token refresh** mechanism
- ✅ **Session revocation** (logout/logout-all)
- ✅ **Device tracking** (User-Agent, IP address)

#### Usage:

```typescript
import { enhancedAuthMiddleware, createSession } from './middleware/enhanced-auth';

// Apply to protected routes
fastify.addHook('onRequest', enhancedAuthMiddleware);

// Login endpoint
const { accessToken, refreshToken } = await createSession(
  userId,
  request.headers['user-agent'],
  request.ip
);
```

#### Token Structure:

**Access Token Payload:**
```json
{
  "userId": "user_123",
  "email": "user@example.com",
  "role": "CONTRACTOR",
  "sessionId": "session_456",
  "iat": 1706000000,
  "exp": 1706000900
}
```

### Role-Based Access Control (RBAC)

**File:** `services/api/src/middleware/rbac.ts`

#### Roles:
- `ADMIN` - Full system access
- `PROJECT_OWNER` - Manage projects, approve milestones
- `CONTRACTOR` - View projects, submit milestones
- `ARCHITECT` - Design and planning
- `PROJECT_MANAGER` - Project coordination
- `ENGINEER` - Technical tasks
- `INSPECTOR` - Compliance verification

#### Permissions (65+ granular):
- User Management: `user:create`, `user:read`, `user:update`, `user:delete`
- Finance: `finance:view:all`, `finance:deposit`, `finance:release`, `finance:admin`
- Contracts: `contract:create`, `contract:sign`, `contract:approve`
- Projects: `project:create`, `project:manage`
- Compliance: `compliance:view`, `oversight:access`
- Analytics: `analytics:view:basic`, `analytics:view:advanced`

#### Usage:

```typescript
import { requireRole, requirePermission, Permission } from './middleware/rbac';

// Require specific role
fastify.addHook('onRequest', requireRole(['ADMIN', 'PROJECT_OWNER']));

// Require specific permission
fastify.addHook('onRequest', requirePermission(Permission.FINANCE_ADMIN));

// Require any of multiple permissions
fastify.addHook('onRequest', requireAnyPermission([
  Permission.FINANCE_VIEW_ALL,
  Permission.FINANCE_VIEW_OWN,
]));

// Resource ownership check
fastify.addHook('onRequest', requireOwnership(async (request) => {
  const escrow = await getEscrow(request.params.id);
  return escrow.userId;
}));
```

---

## 2. Rate Limiting

**File:** `services/api/src/middleware/advanced-rate-limit.ts`

### Features:
- ✅ **Redis-backed** for distributed systems
- ✅ **In-memory fallback** when Redis unavailable
- ✅ **Sliding window** algorithm
- ✅ **Per-IP and per-user** limits
- ✅ **Endpoint-specific** limits

### Rate Limit Tiers:

| Tier | Window | Max Requests | Use Case |
|------|--------|--------------|----------|
| PUBLIC | 15 min | 100 | Unauthenticated endpoints |
| AUTH | 15 min | 5 | Login/register |
| AUTHENTICATED | 1 min | 60 | Authenticated API |
| FINANCIAL | 1 min | 10 | Financial transactions |
| ADMIN | 1 min | 120 | Admin operations |
| WEBHOOK | 1 min | 300 | Webhook receivers |

### Usage:

```typescript
import { 
  publicRateLimit, 
  authRateLimit, 
  financialRateLimit 
} from './middleware/advanced-rate-limit';

// Public endpoints
fastify.addHook('onRequest', publicRateLimit);

// Auth endpoints
fastify.post('/login', { preHandler: authRateLimit }, loginHandler);

// Financial endpoints
fastify.post('/deposits', { preHandler: financialRateLimit }, depositHandler);
```

### Custom Rate Limit:

```typescript
import { rateLimitMiddleware } from './middleware/advanced-rate-limit';

const customLimit = rateLimitMiddleware({
  windowMs: 60 * 1000, // 1 minute
  max: 30,
  message: 'Custom rate limit exceeded',
  keyGenerator: (request) => `custom:${request.user.id}`,
});
```

---

## 3. Security Headers

**File:** `services/api/src/middleware/security-headers.ts`

### Headers Implemented:

#### Content Security Policy (CSP)
```
default-src 'self';
script-src 'self' 'unsafe-inline' https://js.stripe.com;
style-src 'self' 'unsafe-inline' https://fonts.googleapis.com;
img-src 'self' data: https: blob:;
connect-src 'self' https://api.stripe.com;
```

#### Other Headers:
- ✅ `Strict-Transport-Security` (HSTS)
- ✅ `X-Frame-Options: DENY`
- ✅ `X-Content-Type-Options: nosniff`
- ✅ `X-XSS-Protection: 1; mode=block`
- ✅ `Referrer-Policy: strict-origin-when-cross-origin`
- ✅ `Permissions-Policy`

### Usage:

```typescript
import { securityHeadersMiddleware } from './middleware/security-headers';

// Apply globally
fastify.addHook('onRequest', securityHeadersMiddleware());

// Customize for specific routes
fastify.addHook('onRequest', securityHeadersMiddleware({
  enableCSP: false, // Disable CSP for this route
}));
```

### CORS Configuration:

```typescript
import { PRODUCTION_CORS, DEVELOPMENT_CORS, getCORSConfig } from './middleware/security-headers';

// Production-ready CORS
await fastify.register(cors, getCORSConfig());
```

---

## 4. Input Validation

**File:** `services/api/src/middleware/input-validation.ts`

### Features:
- ✅ **SQL injection detection**
- ✅ **XSS prevention**
- ✅ **Path traversal detection**
- ✅ **Automatic sanitization**
- ✅ **Zod schema validation**
- ✅ **File upload validation**

### Usage:

**Zod Schema Validation:**
```typescript
import { validateBody, validateQuery, CommonSchemas } from './middleware/input-validation';
import { z } from 'zod';

const createUserSchema = z.object({
  email: CommonSchemas.email,
  password: CommonSchemas.password,
  firstName: z.string().min(1).max(50),
  lastName: z.string().min(1).max(50),
});

fastify.post('/users', {
  preHandler: validateBody(createUserSchema),
}, createUserHandler);
```

**Malicious Input Detection:**
```typescript
import { detectMaliciousInput, sanitizeRequest } from './middleware/input-validation';

// Detect and block malicious input
fastify.addHook('onRequest', detectMaliciousInput);

// Sanitize all input
fastify.addHook('onRequest', sanitizeRequest);
```

**File Upload Validation:**
```typescript
import { validateFile, FILE_VALIDATION_PRESETS } from './middleware/input-validation';

fastify.post('/upload', {
  preHandler: validateFile(FILE_VALIDATION_PRESETS.IMAGES),
}, uploadHandler);
```

---

## 5. Password Security

**File:** `services/api/src/services/password.service.ts`

### Password Policy:
- ✅ **Minimum 12 characters**
- ✅ **Uppercase + lowercase + numbers + special characters**
- ✅ **No common passwords** (top 100 blocked)
- ✅ **No user info** (name, email) in password
- ✅ **Max 3 consecutive identical characters**
- ✅ **Minimum 8 unique characters**
- ✅ **Password history** (last 5 passwords blocked)

### Password Hashing:
- Algorithm: **bcrypt**
- Salt rounds: **12**
- Time complexity: ~0.25s per hash

### Usage:

**Validate Password:**
```typescript
import { validatePassword, hashPassword } from './services/password.service';

const validation = validatePassword(password, {
  email: user.email,
  firstName: user.firstName,
  lastName: user.lastName,
});

if (!validation.isValid) {
  throw new Error(validation.errors.join(', '));
}

// Result includes strength score (0-100)
console.log(validation.strength); // 'WEAK', 'FAIR', 'GOOD', 'STRONG', 'VERY_STRONG'
console.log(validation.score); // 85
```

**Change Password:**
```typescript
import { changePassword } from './services/password.service';

const result = await changePassword(userId, currentPassword, newPassword);

if (!result.success) {
  console.error(result.error);
}
```

**Password Reset:**
```typescript
import { 
  generatePasswordResetToken, 
  resetPasswordWithToken 
} from './services/password.service';

// Generate reset token (email to user)
const token = await generatePasswordResetToken(email);

// Reset with token
const result = await resetPasswordWithToken(token, newPassword);
```

---

## 6. Two-Factor Authentication

**File:** `services/api/src/services/two-factor-auth.service.ts`

### Features:
- ✅ **TOTP-based** (Time-based One-Time Password)
- ✅ **Compatible with Google Authenticator, Authy, 1Password**
- ✅ **QR code generation** for easy setup
- ✅ **Backup codes** (10 one-time use codes)
- ✅ **60-second time window**

### Setup Flow:

**1. Generate Secret:**
```typescript
import { generate2FASecret } from './services/two-factor-auth.service';

const { secret, qrCodeUrl, manualEntryKey } = await generate2FASecret(userId);

// Display QR code to user
res.send({ qrCodeUrl, manualEntryKey });
```

**2. Verify Setup:**
```typescript
import { verify2FASetup } from './services/two-factor-auth.service';

const isValid = await verify2FASetup(userId, userEnteredCode);

if (isValid) {
  // 2FA enabled, backup codes generated
  console.log('2FA enabled successfully');
}
```

**3. Login with 2FA:**
```typescript
import { verify2FALogin, verifyBackupCode } from './services/two-factor-auth.service';

// Verify TOTP code
const isValid = await verify2FALogin(userId, totpCode);

// OR verify backup code
const isValidBackup = await verifyBackupCode(userId, backupCode);
```

**4. Disable 2FA:**
```typescript
import { disable2FA } from './services/two-factor-auth.service';

const success = await disable2FA(userId, totpCode);
```

---

## 7. Security Event Logging

**File:** `services/api/src/services/security-logging.service.ts`

### Event Types (30+):

#### Authentication:
- `LOGIN_SUCCESS`, `LOGIN_FAILED`, `LOGOUT`
- `PASSWORD_CHANGED`, `PASSWORD_RESET_REQUESTED`
- `TWO_FA_ENABLED`, `TWO_FA_SUCCESS`, `TWO_FA_FAILED`

#### Authorization:
- `UNAUTHORIZED_ACCESS_ATTEMPT`
- `PERMISSION_DENIED`
- `ROLE_CHANGED`

#### Security Threats:
- `MALICIOUS_INPUT_DETECTED`
- `SQL_INJECTION_ATTEMPT`
- `XSS_ATTEMPT`
- `RATE_LIMIT_EXCEEDED`
- `SUSPICIOUS_ACTIVITY`

#### Financial:
- `ESCROW_CREATED`, `DEPOSIT_INITIATED`
- `PAYMENT_RELEASED`, `ESCROW_FROZEN`

#### Compliance:
- `OFAC_SCREENING_MATCH`
- `COMPLIANCE_CHECK_FAILED`

### Usage:

**Log Authentication:**
```typescript
import { logAuthEvent, SecurityEventType } from './services/security-logging.service';

await logAuthEvent(
  SecurityEventType.LOGIN_SUCCESS,
  request,
  'SUCCESS',
  userId
);
```

**Log Security Threat:**
```typescript
import { logSecurityThreat, SecurityEventType } from './services/security-logging.service';

await logSecurityThreat(
  SecurityEventType.SQL_INJECTION_ATTEMPT,
  request,
  'SQL injection detected in query parameter',
  { parameter: 'id', value: "1' OR '1'='1" }
);
```

**Log Financial Event:**
```typescript
import { logFinancialEvent, SecurityEventType } from './services/security-logging.service';

await logFinancialEvent(
  SecurityEventType.DEPOSIT_INITIATED,
  userId,
  `escrow:${escrowId}`,
  amount,
  { paymentMethod: 'card' }
);
```

### Alerting:

Critical events (severity: `CRITICAL`) trigger immediate alerts:
- Console logging (always)
- Slack webhook (configure `SLACK_SECURITY_WEBHOOK_URL`)
- PagerDuty (integrate as needed)

---

## 8. API Key Management

**File:** `services/api/src/services/api-key.service.ts`

### Features:
- ✅ **Secure generation** (256-bit random)
- ✅ **SHA-256 hashing** (stored hashed, never plaintext)
- ✅ **Scope-based permissions**
- ✅ **Expiration dates**
- ✅ **Key rotation** with grace period
- ✅ **Usage tracking**

### API Key Scopes:

```typescript
export const API_KEY_SCOPES = {
  READ_USERS: 'users:read',
  WRITE_USERS: 'users:write',
  READ_FINANCE: 'finance:read',
  WRITE_FINANCE: 'finance:write',
  WEBHOOKS: 'webhooks:receive',
  ADMIN: 'admin:*',
  ALL: '*',
};
```

### Usage:

**Generate API Key:**
```typescript
import { generateAPIKey, API_KEY_SCOPES } from './services/api-key.service';

const { key, apiKey } = await generateAPIKey(
  userId,
  'Production API Key',
  [API_KEY_SCOPES.READ_FINANCE, API_KEY_SCOPES.WRITE_FINANCE],
  365 // Expires in 365 days
);

// Return key to user (only shown once)
res.send({ apiKey: key });
```

**Validate API Key:**
```typescript
import { validateAPIKey } from './services/api-key.service';

const apiKey = request.headers['x-api-key'];
const validation = await validateAPIKey(apiKey);

if (!validation.isValid) {
  throw new Error(validation.error);
}

// Attach API key to request
request.apiKey = validation.apiKey;
```

**Rotate API Key:**
```typescript
import { rotateAPIKey } from './services/api-key.service';

const newKey = await rotateAPIKey(oldKeyId, userId, 7); // 7-day grace period

// Return new key to user
res.send({ apiKey: newKey.key, message: 'Old key will expire in 7 days' });
```

---

## 9. Integration Guide

### Step 1: Update `index.ts`

Add security middleware to your Fastify application:

```typescript
// Import security middleware
import { enhancedAuthMiddleware } from './middleware/enhanced-auth';
import { securityHeadersMiddleware } from './middleware/security-headers';
import { publicRateLimit } from './middleware/advanced-rate-limit';
import { detectMaliciousInput, sanitizeRequest } from './middleware/input-validation';
import { initializeRedis } from './middleware/advanced-rate-limit';

// Initialize Redis (for rate limiting and sessions)
await initializeRedis();

// Apply security headers globally
fastify.addHook('onRequest', securityHeadersMiddleware());

// Apply input validation globally
fastify.addHook('onRequest', detectMaliciousInput);
fastify.addHook('onRequest', sanitizeRequest);

// Apply rate limiting to public endpoints
fastify.addHook('onRequest', publicRateLimit);

// Protected routes need authentication
fastify.register(async (protectedRoutes) => {
  protectedRoutes.addHook('onRequest', enhancedAuthMiddleware);
  
  // Register protected route modules
  await protectedRoutes.register(escrowRoutes, { prefix: '/api/escrow' });
  await protectedRoutes.register(depositRoutes, { prefix: '/api/deposits' });
  // ... other protected routes
});
```

### Step 2: Environment Variables

Add to `.env`:

```bash
# JWT Secrets (min 64 characters)
JWT_SECRET=your-super-secret-jwt-key-at-least-64-characters-long-for-production
JWT_REFRESH_SECRET=your-super-secret-refresh-key-at-least-64-characters-long-for-production
JWT_EXPIRY=15m
JWT_REFRESH_EXPIRY=7d

# Redis (for rate limiting and sessions)
REDIS_URL=redis://localhost:6379

# Security
CSRF_SECRET=your-csrf-secret-key-min-32-characters

# Slack Alerts (optional)
SLACK_SECURITY_WEBHOOK_URL=https://hooks.slack.com/services/YOUR/WEBHOOK/URL
```

### Step 3: Install Dependencies

```bash
pnpm install
```

Required packages (already in `package.json`):
- `jsonwebtoken` - JWT tokens
- `bcrypt` - Password hashing
- `redis` - Rate limiting & sessions
- `speakeasy` - 2FA TOTP
- `qrcode` - 2FA QR codes
- `isomorphic-dompurify` - XSS protection

### Step 4: Database Migrations

Run migrations to add security tables:

```bash
pnpm db:migrate:deploy
```

Tables added:
- `UserSession` - Session tracking
- `TwoFactorSecret` - 2FA secrets
- `BackupCode` - 2FA backup codes
- `PasswordHistory` - Password history
- `PasswordResetToken` - Password reset tokens
- `SecurityEvent` - Security event logs
- `APIKey` - API key management

---

## 10. Security Checklist

### Pre-Launch Checklist

#### Authentication & Authorization
- [ ] JWT secrets are at least 64 characters
- [ ] Refresh tokens enabled and working
- [ ] Session management tested
- [ ] RBAC permissions configured correctly
- [ ] All protected routes have auth middleware

#### Rate Limiting
- [ ] Redis connection tested
- [ ] Rate limits configured per environment
- [ ] Fallback to in-memory working
- [ ] Rate limit headers visible in responses

#### Input Validation
- [ ] All POST/PUT endpoints have Zod validation
- [ ] Malicious input detection enabled
- [ ] File upload limits configured
- [ ] SQL injection tests passed

#### Password Security
- [ ] Password policy enforced
- [ ] Password history enabled
- [ ] Password reset flow tested
- [ ] Bcrypt salt rounds = 12

#### Two-Factor Authentication
- [ ] 2FA setup flow tested
- [ ] Backup codes generated
- [ ] QR codes displaying correctly
- [ ] TOTP verification working

#### Security Logging
- [ ] All auth events logged
- [ ] Security threats logged
- [ ] Critical alerts configured
- [ ] Log retention policy set (90+ days)

#### API Keys
- [ ] API key generation tested
- [ ] Scope validation working
- [ ] Key rotation tested
- [ ] Expired keys auto-revoked

#### Headers & CORS
- [ ] CSP configured correctly
- [ ] HSTS enabled (production)
- [ ] CORS origins whitelisted
- [ ] No sensitive headers exposed

---

## Security Metrics

### Target Metrics:

- **Authentication Success Rate:** ≥99.5%
- **Failed Login Lockout:** After 5 attempts
- **Session Duration:** 15 min (access), 7 days (refresh)
- **Password Hash Time:** ~250ms
- **2FA Adoption:** Target 50%+
- **Security Event Response:** <5 minutes for critical
- **API Key Rotation:** Every 365 days

---

## Testing Security

### Manual Testing:

**1. Test SQL Injection:**
```bash
curl -X POST http://localhost:4000/api/users \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@example.com","password":"pass' OR '1'='1"}'
```
Expected: `400 Bad Request` - Malicious input detected

**2. Test Rate Limiting:**
```bash
for i in {1..10}; do
  curl -X POST http://localhost:4000/api/auth/login
done
```
Expected: `429 Too Many Requests` after 5 attempts

**3. Test XSS:**
```bash
curl -X POST http://localhost:4000/api/comments \
  -H "Content-Type: application/json" \
  -d '{"text":"<script>alert(1)</script>"}'
```
Expected: `400 Bad Request` - XSS attempt detected

**4. Test 2FA:**
- Enable 2FA in user settings
- Scan QR code with Google Authenticator
- Login and verify TOTP code required

### Automated Testing:

Run security test suite:

```bash
pnpm test src/tests/security/
```

---

## Support & Resources

### Documentation:
- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [JWT Best Practices](https://tools.ietf.org/html/rfc8725)
- [NIST Password Guidelines](https://pages.nist.gov/800-63-3/)

### Security Contacts:
- **Security Team:** security@kealee.com
- **Incident Response:** +1 (555) 0100
- **Bug Bounty:** https://kealee.com/security/bounty

---

**Document Version:** 1.0  
**Last Updated:** January 22, 2026  
**Maintained By:** Security Team

**STATUS: ✅ PRODUCTION READY**

