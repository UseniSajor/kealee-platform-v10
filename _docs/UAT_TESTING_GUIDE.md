# 🧪 UAT Testing Guide for Kealee Platform

## Overview
Comprehensive User Acceptance Testing (UAT) guide for validating the Kealee Platform before production deployment.

---

## 📋 Testing Strategy

### Test Levels
1. **Smoke Tests** (5 min) - Critical paths working
2. **Functional Tests** (30 min) - All features working
3. **Integration Tests** (1 hour) - End-to-end workflows
4. **Performance Tests** (30 min) - Load and response times
5. **Security Tests** (30 min) - Auth, permissions, vulnerabilities

---

## 🔥 SMOKE TESTS (CRITICAL)

### 1. Health Checks

**API Service:**
```bash
curl https://api-staging.kealee.com/health

# Expected response:
{
  "status": "ok",
  "timestamp": "2026-01-22T10:30:00.000Z",
  "uptime": 3600,
  "services": {
    "database": "connected",
    "redis": "connected"
  }
}
```

**All Frontend Apps:**
```bash
# Check each app loads
curl -I https://m-architect-staging.vercel.app
curl -I https://m-finance-trust-staging.vercel.app
curl -I https://m-marketplace-staging.vercel.app

# Should return: HTTP/2 200
```

### 2. Database Connectivity

```bash
# Test database query
curl https://api-staging.kealee.com/api/health/db

# Expected:
{
  "database": "connected",
  "latency": "15ms"
}
```

### 3. Authentication

```bash
# Test login endpoint
curl -X POST https://api-staging.kealee.com/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@kealee.com",
    "password": "TestPassword123!"
  }'

# Expected: JWT token returned
{
  "accessToken": "eyJhbGc...",
  "refreshToken": "eyJhbGc...",
  "user": {
    "id": "...",
    "email": "test@kealee.com",
    "role": "USER"
  }
}
```

### 4. Payment Processing

```bash
# Test Stripe connection
curl https://api-staging.kealee.com/api/health/stripe

# Expected:
{
  "stripe": "connected",
  "mode": "test"
}
```

---

## ✅ FUNCTIONAL TESTS

### Module 1: User Management

**Test Case 1.1: User Registration**
```
1. Navigate to: https://app-staging.kealee.com/register
2. Fill in registration form:
   - Email: uat+test@kealee.com
   - Password: Test123!@#
   - Name: UAT Test User
3. Submit form
4. ✅ Verify: Email verification sent
5. ✅ Verify: User redirected to verification page
```

**Test Case 1.2: Email Verification**
```
1. Check email inbox (uat+test@kealee.com)
2. Click verification link
3. ✅ Verify: Account activated
4. ✅ Verify: Auto-login after verification
```

**Test Case 1.3: Login**
```
1. Logout
2. Navigate to: https://app-staging.kealee.com/login
3. Enter credentials
4. Click "Login"
5. ✅ Verify: Redirected to dashboard
6. ✅ Verify: JWT token stored in cookies
```

**Test Case 1.4: 2FA Setup (if enabled)**
```
1. Go to Settings → Security
2. Click "Enable 2FA"
3. Scan QR code with authenticator app
4. Enter verification code
5. ✅ Verify: 2FA enabled
6. ✅ Verify: Backup codes generated
```

### Module 2: Finance & Trust Hub

**Test Case 2.1: Create Contract with Escrow**
```
1. Login as Project Owner
2. Navigate to Projects → Create Contract
3. Fill in contract details:
   - Contractor: Select test contractor
   - Amount: $10,000
   - Milestones: 3 milestones ($3k, $4k, $3k)
4. Submit contract
5. ✅ Verify: Contract created
6. ✅ Verify: Escrow account auto-created
7. ✅ Verify: Escrow number generated (ESC-YYYYMMDD-XXXX)
```

**Test Case 2.2: Make Deposit (Test Card)**
```
1. Navigate to Escrow → Make Deposit
2. Enter amount: $5,000
3. Select payment method: Card
4. Use Stripe test card: 4242 4242 4242 4242
5. Expiry: 12/26, CVC: 123
6. Submit payment
7. ✅ Verify: Payment processing
8. ✅ Verify: Deposit status updates to "COMPLETED"
9. ✅ Verify: Escrow balance updated
10. ✅ Verify: Email notification sent
```

**Test Case 2.3: Milestone Approval & Payment Release**
```
1. Login as Project Owner
2. Navigate to Project → Milestones
3. Mark milestone 1 as "Completed" (contractor view)
4. Switch to Project Owner view
5. Review milestone
6. Click "Approve Milestone"
7. ✅ Verify: Milestone status = "APPROVED"
8. ✅ Verify: Payment release initiated
9. ✅ Verify: Escrow balance decreased
10. ✅ Verify: Contractor notified
```

**Test Case 2.4: Initiate Dispute**
```
1. Login as Contractor
2. Navigate to Project → Disputes
3. Click "Initiate Dispute"
4. Fill in details:
   - Type: PAYMENT
   - Amount: $3,000
   - Description: "Payment not received"
5. Upload evidence
6. Submit dispute
7. ✅ Verify: Dispute created
8. ✅ Verify: Escrow frozen
9. ✅ Verify: Hold placed on escrow
10. ✅ Verify: Project Owner notified
```

**Test Case 2.5: Generate Lien Waiver**
```
1. Complete milestone payment
2. Navigate to Project → Documents
3. Click "Generate Lien Waiver"
4. ✅ Verify: Waiver generated (state-specific)
5. ✅ Verify: Digital signature request sent
6. Sign waiver
7. ✅ Verify: Signed waiver stored
8. ✅ Verify: Available for download
```

### Module 3: Architect Hub

**Test Case 3.1: Create Design Project**
```
1. Login as Architect
2. Navigate to Design Projects → Create
3. Fill in project details
4. Upload plans (PDF/DWG)
5. Submit project
6. ✅ Verify: Project created
7. ✅ Verify: Files uploaded successfully
8. ✅ Verify: Thumbnails generated
```

**Test Case 3.2: BIM Model Upload**
```
1. Open Design Project
2. Click "Upload BIM Model"
3. Upload .ifc or .rvt file
4. ✅ Verify: Model uploaded
5. ✅ Verify: Model viewer loads
6. ✅ Verify: Metadata extracted
```

**Test Case 3.3: Quality Check**
```
1. Navigate to Quality Checks
2. Run automated check
3. ✅ Verify: Check completes
4. ✅ Verify: Issues flagged (if any)
5. ✅ Verify: Report generated
```

### Module 4: Permits & Inspections

**Test Case 4.1: Submit Permit Application**
```
1. Login as Contractor
2. Navigate to Permits → New Application
3. Fill in permit details
4. Attach required documents
5. Submit application
6. ✅ Verify: Application submitted
7. ✅ Verify: Jurisdiction notified
8. ✅ Verify: Application number assigned
```

**Test Case 4.2: Schedule Inspection**
```
1. Navigate to Inspections
2. Click "Schedule Inspection"
3. Select date/time
4. Choose inspector
5. Submit request
6. ✅ Verify: Inspection scheduled
7. ✅ Verify: Calendar updated
8. ✅ Verify: Inspector notified
```

### Module 5: Marketplace

**Test Case 5.1: Browse Contractors**
```
1. Navigate to Marketplace
2. Search for contractors
3. Apply filters (location, trade, rating)
4. ✅ Verify: Results displayed
5. ✅ Verify: Filters work correctly
6. ✅ Verify: Pagination works
```

**Test Case 5.2: Request Quote**
```
1. Click on contractor profile
2. Click "Request Quote"
3. Fill in project details
4. Submit request
5. ✅ Verify: Quote request sent
6. ✅ Verify: Contractor notified
7. ✅ Verify: Request visible in dashboard
```

---

## 🔄 INTEGRATION TESTS (End-to-End)

### E2E Test 1: Complete Project Lifecycle

```
Scenario: Project Owner hires contractor, completes project, releases all payments

Steps:
1. Create user accounts (Owner, Contractor, Architect)
2. Create project
3. Upload plans (Architect)
4. Create contract with 3 milestones
5. Escrow created automatically
6. Make initial deposit ($10,000)
7. Milestone 1: Complete → Approve → Payment released ($3,000)
8. Milestone 2: Complete → Approve → Payment released ($4,000)
9. Milestone 3: Complete → Approve → Final payment ($3,000)
10. Generate lien waivers for all milestones
11. Close project

Expected Results:
✅ Escrow balance = $0
✅ All payments released
✅ All lien waivers signed
✅ Project status = "COMPLETED"
✅ Accounting entries balanced (debits = credits)
```

### E2E Test 2: Dispute Resolution Flow

```
Scenario: Payment dispute raised, mediator resolves, funds released

Steps:
1. Create contract with escrow ($10,000)
2. Make deposit
3. Complete milestone 1
4. Contractor raises dispute (payment not received)
5. Escrow automatically frozen
6. Evidence uploaded by both parties
7. Mediator assigned
8. Mediator reviews evidence
9. Mediator makes decision (approve payment)
10. Hold released
11. Payment processed

Expected Results:
✅ Dispute status = "RESOLVED"
✅ Escrow unfrozen
✅ Payment released to contractor
✅ Both parties notified
✅ Dispute resolution logged
```

### E2E Test 3: Multi-User Collaboration

```
Scenario: Multiple users working on same project simultaneously

Steps:
1. Project Owner creates project
2. Invites Architect, Contractor, PM
3. Architect uploads plans
4. PM creates milestones
5. Contractor accepts contract
6. All users receive notifications
7. Multiple users view project concurrently

Expected Results:
✅ Real-time updates visible to all users
✅ No race conditions
✅ Permissions enforced correctly
✅ Audit log tracks all actions
```

---

## ⚡ PERFORMANCE TESTS

### Load Testing

**Tool: Apache Bench (ab) or k6**

```bash
# Install k6
brew install k6 # macOS
choco install k6 # Windows

# Run load test
k6 run load-test.js

# Or use ab
ab -n 1000 -c 10 https://api-staging.kealee.com/api/health
```

**Create `load-test.js`:**
```javascript
import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  stages: [
    { duration: '30s', target: 20 }, // Ramp up to 20 users
    { duration: '1m', target: 50 },  // Stay at 50 users
    { duration: '30s', target: 0 },  // Ramp down
  ],
  thresholds: {
    http_req_duration: ['p(95)<200'], // 95% requests < 200ms
  },
};

export default function () {
  const res = http.get('https://api-staging.kealee.com/api/health');
  check(res, {
    'status is 200': (r) => r.status === 200,
    'response time < 200ms': (r) => r.timings.duration < 200,
  });
  sleep(1);
}
```

**Run test:**
```bash
k6 run load-test.js

# Expected results:
✅ 95th percentile < 200ms
✅ 99th percentile < 500ms
✅ 0% error rate
✅ Throughput > 100 req/s
```

### Database Query Performance

```bash
# Enable query logging
ENABLE_QUERY_LOGGING=true

# Run app and monitor slow queries
railway logs -s api-staging --filter "slow query"

# Check for queries > 50ms
# Optimize with indexes if found
```

---

## 🔒 SECURITY TESTS

### Authentication & Authorization

**Test Case S1: JWT Expiration**
```bash
# Login and get token
TOKEN=$(curl -X POST https://api-staging.kealee.com/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@kealee.com","password":"Test123!"}' \
  | jq -r '.accessToken')

# Use token immediately (should work)
curl -H "Authorization: Bearer $TOKEN" \
  https://api-staging.kealee.com/api/users/me

# Wait 16 minutes (token expires after 15m)
sleep 960

# Try again (should fail)
curl -H "Authorization: Bearer $TOKEN" \
  https://api-staging.kealee.com/api/users/me

# Expected: 401 Unauthorized
```

**Test Case S2: Permission Enforcement**
```bash
# Login as regular user
USER_TOKEN=$(curl -X POST ... | jq -r '.accessToken')

# Try to access admin endpoint
curl -H "Authorization: Bearer $USER_TOKEN" \
  https://api-staging.kealee.com/api/admin/users

# Expected: 403 Forbidden
```

**Test Case S3: Rate Limiting**
```bash
# Hit endpoint 100+ times quickly
for i in {1..110}; do
  curl https://api-staging.kealee.com/api/health
done

# Expected: 429 Too Many Requests after 100 requests
```

### SQL Injection Prevention

```bash
# Try SQL injection in login
curl -X POST https://api-staging.kealee.com/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@kealee.com'\'' OR 1=1--",
    "password": "anything"
  }'

# Expected: 400 Bad Request or 401 Unauthorized
# Should NOT login successfully
```

### XSS Prevention

```html
<!-- Try XSS in form field -->
<script>alert('XSS')</script>

<!-- Expected: Sanitized before storage -->
<!-- Displayed as text, not executed -->
```

---

## 📊 UAT Test Results Template

### Test Execution Record

```
Test Date: YYYY-MM-DD
Tester: [Name]
Environment: Staging
Build Version: [commit hash]

┌──────────────────────────────┬─────────┬──────────────┐
│ Test Case                    │ Status  │ Notes        │
├──────────────────────────────┼─────────┼──────────────┤
│ 1.1 User Registration        │ ✅ PASS │              │
│ 1.2 Email Verification       │ ✅ PASS │              │
│ 1.3 Login                    │ ✅ PASS │              │
│ 2.1 Create Contract          │ ✅ PASS │              │
│ 2.2 Make Deposit             │ ⚠️ WARN │ Slow (3s)    │
│ 2.3 Release Payment          │ ✅ PASS │              │
│ 2.4 Initiate Dispute         │ ❌ FAIL │ Error 500    │
│ ...                          │         │              │
└──────────────────────────────┴─────────┴──────────────┘

Summary:
- Total Tests: 50
- Passed: 47 (94%)
- Failed: 1 (2%)
- Warnings: 2 (4%)

Critical Issues:
- Test 2.4 (Dispute) fails with 500 error
  → Check logs: [link to Railway logs]
  → Assigned to: [developer]
  → Priority: HIGH

Sign-off:
✅ Approved for Production (after fixing critical issues)
❌ Not Approved

Approver: _________________
Date: ___________________
```

---

## 🐛 Bug Report Template

```markdown
## Bug Report

**Title:** [Short description]

**Priority:** Critical / High / Medium / Low

**Environment:** Staging / Production

**Reported By:** [Name]
**Date:** YYYY-MM-DD

### Steps to Reproduce:
1. [Step 1]
2. [Step 2]
3. [Step 3]

### Expected Behavior:
[What should happen]

### Actual Behavior:
[What actually happened]

### Screenshots/Logs:
[Attach screenshots or log snippets]

### Browser/Device:
- Browser: Chrome 120
- OS: macOS 14
- Device: Desktop

### Additional Context:
[Any other relevant information]
```

---

## 📋 UAT Sign-Off Checklist

Before approving for production:

- [ ] All smoke tests passed
- [ ] All functional tests passed (>95%)
- [ ] All integration tests passed
- [ ] Performance benchmarks met (<200ms p95)
- [ ] Security tests passed
- [ ] No critical bugs
- [ ] All high-priority bugs fixed
- [ ] Documentation updated
- [ ] Team trained on new features
- [ ] Rollback plan documented
- [ ] Monitoring alerts configured

**Approval:**
```
✅ APPROVED FOR PRODUCTION DEPLOYMENT

Signed: _________________________
Title: __________________________
Date: ___________________________
```

---

## 📞 Support During UAT

**If you encounter issues:**

1. **Check logs:**
   ```bash
   railway logs -s api-staging --tail
   ```

2. **Check Sentry for errors:**
   - Go to: https://sentry.io
   - View recent errors

3. **Report bugs:**
   - Use bug report template above
   - Post in #uat-testing Slack channel

4. **Get help:**
   - Technical issues: engineering@kealee.com
   - Business questions: product@kealee.com

---

**All documentation complete! Ready to deploy.**
