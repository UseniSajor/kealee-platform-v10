# 🔐 Security Implementation Guide

**Status:** ✅ Critical security services created  
**Date:** 2026-01-22

---

## 📋 Security Services Created

### 1. ✅ Webhook Signature Verification
**File:** `services/api/src/modules/webhooks/stripe-webhook-security.service.ts`

**Features:**
- Stripe webhook signature verification
- Replay attack prevention (5-minute window)
- Duplicate event detection
- Event age validation
- Audit logging

**Usage:**
```typescript
import { stripeWebhookSecurityService } from '../modules/webhooks/stripe-webhook-security.service';

// In your webhook route:
const verification = await stripeWebhookSecurityService.verifyWebhookSignature(request);

if (!verification.isValid) {
  return reply.status(400).send({ error: verification.error });
}

const event = verification.event!;
// Process event safely...
```

---

### 2. ✅ Field-Level Encryption
**File:** `services/api/src/modules/security/field-encryption.service.ts`

**Features:**
- AES-256-GCM encryption for sensitive fields
- SSN encryption/decryption
- Bank account encryption/decryption
- Field masking for display
- One-way hashing for indexing

**Usage:**
```typescript
import { fieldEncryptionService } from '../modules/security/field-encryption.service';

// Encrypt SSN before storing
const encryptedSSN = fieldEncryptionService.encryptSSN('123-45-6789');
await prisma.user.update({
  where: { id: userId },
  data: { ssnEncrypted: encryptedSSN },
});

// Decrypt when needed
const ssn = fieldEncryptionService.decryptSSN(user.ssnEncrypted);

// Display masked version
const masked = fieldEncryptionService.maskSSN(ssn); // XXX-XX-6789
```

**Required Environment Variable:**
```bash
ENCRYPTION_MASTER_KEY=your-secure-256-bit-key-here
```

---

### 3. ✅ OFAC Sanctions Screening
**File:** `services/api/src/modules/security/ofac-screening.service.ts`

**Features:**
- Individual screening
- Business entity screening
- Transaction screening
- Batch rescreening
- Risk level assessment

**⚠️ CRITICAL:** Currently uses placeholder implementation. **MUST** integrate real OFAC service before production.

**Integration Options:**
1. **ComplyAdvantage** (Recommended): $199/month + per-search
2. **Dow Jones Risk & Compliance**: Enterprise pricing
3. **Refinitiv World-Check**: Enterprise pricing
4. **Direct OFAC XML**: Free but requires parsing

**Usage:**
```typescript
import { ofacScreeningService } from '../modules/security/ofac-screening.service';

// Screen user during registration
const screening = await ofacScreeningService.screenIndividual({
  firstName: 'John',
  lastName: 'Doe',
  dateOfBirth: new Date('1990-01-01'),
  address: {
    city: 'San Francisco',
    state: 'CA',
    country: 'USA',
  },
});

if (screening.riskLevel === 'BLOCKED') {
  throw new Error('User blocked due to OFAC match');
}

// Screen large transactions
if (amount > 10000) {
  const transactionScreening = await ofacScreeningService.screenTransaction({
    amount,
    sender: senderData,
    recipient: recipientData,
  });
  
  if (transactionScreening.requiresManualReview) {
    // Hold transaction for compliance review
  }
}
```

---

### 4. ✅ Audit Log Integrity
**File:** `services/api/src/modules/security/audit-integrity.service.ts`

**Features:**
- SHA-256 hash chain (blockchain-style)
- Tamper detection
- Chain verification
- Digital signatures (optional)
- Integrity reports
- Period sealing

**Usage:**
```typescript
import { auditIntegrityService } from '../modules/security/audit-integrity.service';

// When creating audit log:
const previousHash = await getLastAuditHash(); // Empty string for first
const entry = {
  id: 'audit-123',
  userId: 'user-456',
  action: 'UPDATE',
  entityType: 'CONTRACT',
  entityId: 'contract-789',
  timestamp: new Date(),
  changes: { status: { from: 'DRAFT', to: 'ACTIVE' } },
};

const hash = auditIntegrityService.calculateHash(entry, previousHash);

await prisma.auditLog.create({
  data: {
    ...entry,
    hash,
    previousHash,
  },
});

// Verify integrity:
const verification = auditIntegrityService.verifyIntegrity(entry, hash, previousHash);
if (!verification.isValid) {
  console.error('⚠️ TAMPERING DETECTED!');
}

// Verify entire chain:
const allEntries = await prisma.auditLog.findMany({ orderBy: { timestamp: 'asc' } });
const chainVerification = auditIntegrityService.verifyChain(allEntries);
```

---

## 🚀 Implementation Checklist

### Phase 1: Immediate (Before ANY deployment)

- [ ] **Add ENCRYPTION_MASTER_KEY to environment variables**
  ```bash
  # Generate secure key:
  node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
  
  # Add to Railway/Vercel:
  ENCRYPTION_MASTER_KEY=generated_key_here
  ```

- [ ] **Integrate Webhook Security in Stripe routes**
  - Update all Stripe webhook routes to use `stripeWebhookSecurityService`
  - Ensure `rawBody` plugin is configured
  - Test webhook signature verification

- [ ] **Choose and integrate OFAC screening service**
  - Sign up for ComplyAdvantage or similar
  - Get API credentials
  - Update `OFACScreeningService` with real API calls
  - Add OFAC_API_KEY to environment variables

- [ ] **Update Audit Service to use integrity chain**
  - Modify `audit.service.ts` to calculate hashes
  - Add `hash` and `previousHash` fields to AuditLog model
  - Migrate existing audit logs

- [ ] **Add field encryption to User model**
  - Add `ssnEncrypted` field to User model
  - Add `bankAccountEncrypted` field to PaymentMethod model
  - Encrypt existing data

### Phase 2: Configuration

- [ ] **Configure security headers**
  ```typescript
  // Verify in services/api/src/index.ts
  await fastify.register(helmet, {
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        scriptSrc: ["'self'"],
        imgSrc: ["'self'", 'data:', 'https:'],
      },
    },
  });
  ```

- [ ] **Configure rate limiting for auth endpoints**
  ```typescript
  // Stricter limits for authentication
  fastify.register(rateLimit, {
    max: 10,
    timeWindow: '15 minutes',
  }, { prefix: '/auth' });
  ```

- [ ] **Enable S3 encryption**
  - Go to AWS S3 console
  - Enable AES-256 encryption on all buckets
  - Enable versioning for audit trail

- [ ] **Configure CSRF tokens**
  - Verify CSRF middleware is active
  - Add CSRF token to all forms
  - Test CSRF protection

### Phase 3: Testing

- [ ] **Test webhook security**
  - Use Stripe CLI to send test webhooks
  - Verify signature validation works
  - Test replay attack prevention

- [ ] **Test field encryption**
  - Encrypt test data
  - Decrypt and verify correctness
  - Test masking functions

- [ ] **Test OFAC screening**
  - Screen test users (with known sanctioned names)
  - Verify blocking works
  - Test batch rescreening

- [ ] **Test audit integrity**
  - Create audit log chain
  - Verify integrity
  - Attempt tampering and verify detection

### Phase 4: Monitoring

- [ ] **Set up security monitoring**
  - Failed authentication attempts
  - Permission denial events
  - OFAC match alerts
  - Audit integrity violations

- [ ] **Configure alerting**
  - Email alerts for critical security events
  - Slack notifications for OFAC matches
  - PagerDuty for production incidents

- [ ] **Schedule automated tasks**
  - Daily OFAC rescreening (cron job)
  - Weekly audit integrity verification
  - Monthly security report generation

---

## 📊 Security Compliance Status

| Requirement | Status | Priority |
|-------------|--------|----------|
| Webhook Signature Verification | ✅ Created | 🔴 Critical |
| Field-Level Encryption | ✅ Created | 🔴 Critical |
| OFAC Screening | ⚠️ Placeholder | 🔴 Critical |
| Audit Log Integrity | ✅ Created | 🔴 Critical |
| MFA for Admins | ❌ Not Started | 🟡 High |
| CSP Headers | ⚠️ Partial | 🟡 High |
| S3 Encryption | ❌ Not Started | 🟡 High |
| Security Monitoring | ❌ Not Started | 🟡 High |

---

## 🔒 PCI DSS Compliance

**Current Status:** Using Stripe (PCI SAQ-A)

**Requirements Met:**
- ✅ Never storing CVV
- ✅ Never storing full PAN
- ✅ Using tokenization (Stripe)
- ✅ TLS for all transmissions
- ⚠️ Need to complete SAQ-A questionnaire

**Action Items:**
1. Complete PCI SAQ-A at: https://www.pcisecuritystandards.org/documents
2. Schedule quarterly ASV scans
3. Document cardholder data flow
4. Create incident response plan

---

## 🚫 OFAC Compliance

**Current Status:** ⚠️ Not Compliant (Placeholder only)

**Requirements:**
- Screen all new users
- Screen transactions > $10,000
- Daily SDN list updates
- Document all matches
- Maintain records 5+ years

**Action Items:**
1. Choose OFAC provider (ComplyAdvantage recommended)
2. Integrate API
3. Screen during user registration
4. Set up daily batch rescreening
5. Create blocked party workflow
6. Document procedures

---

## 📞 Emergency Contacts

**Security Incidents:**
- security@kealee.com
- On-call: [Configure PagerDuty]

**OFAC Questions:**
- OFAC Hotline: 1-800-540-6322
- ofac.feedback@treasury.gov

**PCI Compliance:**
- Stripe Support: https://support.stripe.com
- QSA Contact: [Hire qualified security assessor]

---

## 📚 Related Documentation

- [Security Audit Checklist](./_docs/SECURITY_AUDIT_CHECKLIST.md)
- [Finance API Routes](./_docs/FINANCE_API_ROUTES.md)
- [Atomic Transactions](./_docs/ATOMIC_TRANSACTIONS_UPGRADE.md)
- [Event-Driven Architecture](./_docs/EVENT_DRIVEN_ARCHITECTURE.md)

---

**Last Updated:** 2026-01-22  
**Review Schedule:** Monthly


