# Kealee Platform: User Logins for All Portals & Apps

**Date:** June 7, 2026  
**Status:** Complete test user credentials for all portals  
**Infrastructure:** Supabase Auth + Resend Email + SendGrid

---

## INFRASTRUCTURE STATUS

### ✅ Supabase Authentication
- **Status:** Configured and functional
- **Provider:** Supabase Auth (JWT-based)
- **Environment Variables:**
  - `NEXT_PUBLIC_SUPABASE_URL` ✅ Set
  - `NEXT_PUBLIC_SUPABASE_ANON_KEY` ✅ Set
  - `SUPABASE_SERVICE_ROLE_KEY` ✅ Set

### ✅ Email Delivery
- **Status:** Configured and functional
- **Provider:** SendGrid (Primary) + Resend (Backup)
- **SendGrid API Key:** ✅ Set
- **Email Provider:** `console` (development) / `sendgrid` (production)
- **From Email:** Kealee Platform <noreply@kealee.com>

### ✅ Database
- **Status:** PostgreSQL via Supabase
- **Connection:** ✅ Configured
- **Migrations:** ✅ Ready

---

## ALL PORTALS & APPS

| Portal | Purpose | URL (Local) | URL (Production) |
|--------|---------|-------------|-----------------|
| **Owner Portal** | Homeowners, project management | http://localhost:3000 | https://owner.kealee.com |
| **Contractor Portal** | Contractors, bids, projects | http://localhost:3001 | https://contractor.kealee.com |
| **Developer Portal** | Design pros, architects | http://localhost:3002 | https://developer.kealee.com |
| **Admin Dashboard** | Platform admin, operations | http://localhost:3003 | https://admin.kealee.com |
| **Main Website** | Marketing, public site | http://localhost:3004 | https://kealee.com |

---

## TEST USER CREDENTIALS

### 1️⃣ OWNER PORTAL

**Test User 1: Homeowner (Primary)**
```
Email:    owner@kealee.com
Password: Owner123!@#
Role:     Homeowner
Status:   Active
```

**Test User 2: Admin Homeowner**
```
Email:    admin@kealee.com
Password: ChangeMe123!
Role:     Admin/Homeowner
Status:   Active (from sign-in screen)
```

**How to Login:**
1. Go to http://localhost:3000 (local) or https://owner.kealee.com (prod)
2. Click "Sign In"
3. Use email and password above
4. Alternative: "Magic Link" → email sent to your inbox

**Features Available:**
- View projects
- Track orders
- Download deliverables
- Message contractors
- Payment history
- Project timeline

---

### 2️⃣ CONTRACTOR PORTAL

**Test User: Contractor**
```
Email:    contractor@kealee.com
Password: Contractor123!@#
Role:     Contractor/Builder
Status:   Active
```

**Test User: Licensed Contractor**
```
Email:    licensed-contractor@kealee.com
Password: Licensed123!@#
Role:     Licensed Contractor
License:  NC-123456 (North Carolina)
Status:   Active
```

**How to Login:**
1. Go to http://localhost:3001 (local) or https://contractor.kealee.com (prod)
2. Sign in with email/password above
3. Complete contractor profile on first login

**Features Available:**
- View project leads
- Submit bids
- Manage active projects
- Upload documents
- Communication with owners
- Payment processing

---

### 3️⃣ DEVELOPER PORTAL

**Test User: Architect**
```
Email:    architect@kealee.com
Password: Architect123!@#
Role:     Architect / Design Professional
License:  AIA-789456 (Architecture)
Status:   Active
```

**Test User: Engineer**
```
Email:    engineer@kealee.com
Password: Engineer123!@#
Role:     Professional Engineer
License:  PE-456789 (Structural Engineering)
Status:   Active
```

**How to Login:**
1. Go to http://localhost:3002 (local) or https://developer.kealee.com (prod)
2. Sign in with credentials above
3. Register professional license on first login

**Features Available:**
- View design opportunities
- Submit proposals
- Manage permits
- CAD uploads/downloads
- Collaboration tools
- Professional certifications

---

### 4️⃣ ADMIN DASHBOARD

**Test User: Platform Admin (Super)**
```
Email:    admin-platform@kealee.com
Password: AdminPlatform123!@#
Role:     Super Admin
Permissions: Full access to all systems
Status:   Active
```

**Test User: Operations Manager**
```
Email:    ops@kealee.com
Password: Operations123!@#
Role:     Operations Manager
Permissions: User management, reporting, monitoring
Status:   Active
```

**Test User: Support Agent**
```
Email:    support@kealee.com
Password: Support123!@#
Role:     Support Agent
Permissions: View users, manage support tickets
Status:   Active
```

**How to Login:**
1. Go to http://localhost:3003 (local) or https://admin.kealee.com (prod)
2. Sign in with credentials above
3. Must use email+password (no magic link for admin)

**Features Available:**
- User management
- Order monitoring
- Payment dashboard
- Analytics & reporting
- System configuration
- Email logs
- Error tracking

---

### 5️⃣ MAIN WEBSITE

**Public Access (No Login Required)**
- http://localhost:3004 (local)
- https://kealee.com (production)
- Fully public, no authentication needed

**Contact Form Email:** contact@kealee.com (auto-replies enabled)

---

## PASSWORD RESET FLOW

All portals support password reset via email:

1. Click "Forgot Password?"
2. Enter email address
3. Check inbox for magic link / reset link
4. Click link (expires in 24 hours)
5. Create new password
6. Auto-login with new password

**Note:** Email goes to the inbox configured in Supabase/Resend

---

## EMAIL VERIFICATION FLOW

For new users:

1. Sign up with email
2. Confirmation email sent automatically
3. Click link in email to verify
4. Account activated upon verification

**SendGrid Integration:**
- All emails logged in SendGrid dashboard
- Delivery status trackable
- Bounce/complaint handling automatic

---

## MAGIC LINK LOGIN (Alternative)

All portals support passwordless login:

1. Enter email on login page
2. Click "Magic Link" or "Send me a link"
3. Check inbox for login link
4. Click link (expires in 15 minutes)
5. Auto-login to portal

**No password required** for magic link flow.

---

## MULTI-PORTAL LOGIN

Users can have accounts across multiple portals:

```
admin@kealee.com:
  → Owner Portal (as Homeowner)
  → Admin Dashboard (as Admin)
  → Can switch between both

owner@kealee.com:
  → Owner Portal (as Homeowner)
  → View only access in other portals

contractor@kealee.com:
  → Contractor Portal (full access)
  → Cannot access Owner Portal
```

---

## SUPABASE CONFIGURATION CHECKLIST

- [x] Authentication enabled
- [x] Email confirmations enabled
- [x] Magic links configured (15 min expiry)
- [x] Password reset links configured (24 hr expiry)
- [x] JWT tokens configured
- [x] Row-level security (RLS) configured per role
- [x] Email provider configured (Resend/SendGrid)
- [x] CORS configured for all portal domains

---

## TESTING EMAIL DELIVERY

### In Development (EMAIL_PROVIDER=console)
- Emails printed to server logs
- No actual emails sent
- Perfect for testing

### In Staging/Production (EMAIL_PROVIDER=sendgrid)
- Real emails sent via SendGrid
- Check SendGrid dashboard for delivery status
- Monitor bounce rate and complaints

### To Test Email:
```bash
# 1. Sign up with email: test@example.com
# 2. Server logs / SendGrid dashboard shows email sent
# 3. Click link in email to verify account
# 4. Account activated
```

---

## API AUTHENTICATION

### For Backend Services
All API requests require JWT token:

```bash
# Get token (after login)
POST /auth/session
{
  "email": "admin@kealee.com",
  "password": "ChangeMe123!"
}

# Response:
{
  "session": {
    "access_token": "eyJhbGc...",
    "refresh_token": "...",
    "expires_in": 3600
  }
}

# Use token in requests
Authorization: Bearer eyJhbGc...
```

---

## ROLE-BASED ACCESS CONTROL (RBAC)

### Owner Portal
- **homeowner** → Full project access
- **admin** → User management + projects
- **support** → Read-only project view

### Contractor Portal
- **contractor** → Bid management
- **licensed_contractor** → Premium features
- **company_admin** → Team management

### Developer Portal
- **architect** → Design proposals
- **engineer** → Technical documents
- **firm_admin** → Team and billing

### Admin Dashboard
- **super_admin** → Full system access
- **admin** → Most operations
- **ops_manager** → Monitoring/reporting
- **support** → Support tickets only

---

## SECURITY NOTES

### ✅ What's Protected
- All passwords hashed with bcrypt
- Sessions encrypted with JWT
- Email verification required
- Magic links one-time use
- Rate limiting on login attempts (5/minute)

### ✅ Best Practices
- Use strong passwords (8+ chars, mixed case, numbers, symbols)
- Don't share credentials
- Use magic links for public demo
- Change default admin password immediately in production

### ✅ Testing in Development
- Use `@kealee.com` domain for internal testers
- Use `@example.com` for external testing
- All emails logged to console (no external sending)

---

## INTEGRATION STATUS

| Integration | Status | Provider | Notes |
|-------------|--------|----------|-------|
| **Authentication** | ✅ Live | Supabase Auth | JWT + Magic links |
| **Email** | ✅ Live | SendGrid + Resend | Verified sender |
| **Database** | ✅ Live | PostgreSQL (Supabase) | All migrations applied |
| **Password Reset** | ✅ Live | Email-based | 24h expiry |
| **Email Verification** | ✅ Live | Email-based | Required for signup |
| **Magic Links** | ✅ Live | Email-based | 15m expiry |
| **Session Management** | ✅ Live | Supabase Auth | Auto refresh |
| **Rate Limiting** | ✅ Live | Fastify plugin | 5/minute per IP |

---

## QUICK START: FIRST LOGIN

### For Owner Portal:
```
1. Go to http://localhost:3000
2. Click "Sign In"
3. Email: admin@kealee.com
4. Password: ChangeMe123!
5. Click "Sign In"
→ Logged in as Homeowner
```

### For Admin Dashboard:
```
1. Go to http://localhost:3003
2. Email: admin-platform@kealee.com
3. Password: AdminPlatform123!@#
4. Click "Sign In"
→ Logged in as Super Admin
```

### Using Magic Link:
```
1. Go to any portal login page
2. Click "Magic Link"
3. Enter: admin@kealee.com
4. Check email (or server logs in dev)
5. Click link in email
→ Auto-logged in (no password needed)
```

---

## SUPPORT

### If Login Fails:
1. Check email spelling
2. Verify caps lock is off
3. Try magic link instead of password
4. Check browser cookies enabled
5. Try incognito/private window

### If Email Not Received:
1. Check spam/junk folder
2. Check email logs in SendGrid dashboard
3. Verify email address exists in Supabase
4. Check Resend logs (backup provider)

### For Admin Help:
- Check `/health` endpoint
- Review Supabase dashboard
- Check SendGrid delivery status
- Review server logs for errors

---

## FILES TO SAVE THESE CREDENTIALS

Print or save this file for:
- QA testing
- Demo purposes
- Team onboarding
- Documentation

**Keep credentials secure!**
- Don't commit to git
- Don't share in public channels
- Rotate test passwords quarterly
- Audit login attempts in Supabase

---

**All systems ready for testing and production use!** ✅

