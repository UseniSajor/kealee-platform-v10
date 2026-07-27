# Kealee Integration Checklist

**Nationwide Expansion + SMS/Email Delivery Setup**

---

## Immediate Setup (This Week)

### ✅ SMS/Email Delivery (Twilio + Resend)

#### Twilio Configuration

- [ ] **Account**: Already active (per user)
- [ ] **Phone Number**: `+1 (301) 575-8777` (Kealee HQ line)
- [ ] **Environment Variable Setup**:
  ```
  TWILIO_ACCOUNT_SID=AC[redacted]
  TWILIO_AUTH_TOKEN=[redacted]
  TWILIO_PHONE_NUMBER=+13015758777
  ```
- [ ] **Verify in development**:
  ```bash
  curl -X POST http://localhost:3000/api/intake/send-to-phone \
    -H "Content-Type: application/json" \
    -d '{
      "phone": "+15551234567",
      "projectPath": "kitchen_remodel",
      "intakeUrl": "https://kealee.com/intake/test"
    }'
  ```
- [ ] **Deploy to Railway**:
  1. Set variables in Railway dashboard
  2. Trigger redeploy of `web-main` service
  3. Verify SMS sends via production endpoint

#### Resend Configuration

- [ ] **Account**: Create at https://resend.com
- [ ] **API Key**: Generate at Resend → Settings → API Keys
- [ ] **Environment Variables**:
  ```
  RESEND_API_KEY=re_[redacted]
  RESEND_FROM_EMAIL=noreply@kealee.com
  RESEND_CONTACT_EMAIL=contact@kealee.com
  ```
- [ ] **Verify Domain** (optional but recommended):
  - [ ] Add CNAME record to DNS
  - [ ] Verify ownership in Resend dashboard
  - [ ] Switch from `resend.dev` to custom domain
- [ ] **Test in development**:
  ```bash
  curl -X POST http://localhost:3000/api/intake/send-to-phone \
    -H "Content-Type: application/json" \
    -d '{
      "email": "user@example.com",
      "projectPath": "kitchen_remodel",
      "intakeUrl": "https://kealee.com/intake/test"
    }'
  ```

#### Railway Deployment

- [ ] **Web-Main Service**:
  - [ ] Open https://railway.app dashboard
  - [ ] Select `kealee-web-main` service
  - [ ] Go to Variables tab
  - [ ] Add 6 new variables:
    ```
    TWILIO_ACCOUNT_SID
    TWILIO_AUTH_TOKEN
    TWILIO_PHONE_NUMBER
    RESEND_API_KEY
    RESEND_FROM_EMAIL
    RESEND_CONTACT_EMAIL
    ```
  - [ ] Click Deploy → Trigger redeploy
  - [ ] Verify deployment successful (green checkmark)
  - [ ] Test SMS/email delivery from production

#### Integration Testing

- [ ] **SMS Delivery**:
  - [ ] Send test SMS to your phone
  - [ ] Verify message arrives within 30 seconds
  - [ ] Check message content: "Kealee: Continue your [project] intake here: [URL]"

- [ ] **Email Delivery**:
  - [ ] Send test email to your inbox
  - [ ] Verify HTML formatting (logo, button, footer)
  - [ ] Check subject line: "Continue Your [project] – Kealee"
  - [ ] Verify "Continue Intake" button is clickable

- [ ] **Both Methods**:
  - [ ] Send with both phone AND email
  - [ ] Verify both arrive (may have different latencies)

---

### ✅ Mobile Measurement Integration

#### Package Installation

- [ ] **Development Setup**:
  ```bash
  cd apps/m-capture  # or mobile app root
  pnpm add @kealee/mobile-measurement
  pnpm install
  ```

- [ ] **Native Dependencies**:
  ```bash
  # For iOS LiDAR support
  npx pod-install
  ```

#### Integration in Mobile App

- [ ] **Import Component**:
  ```typescript
  import { MeasurementCapture } from '@kealee/mobile-measurement'
  ```

- [ ] **Wire to Screen**:
  ```typescript
  export default function MeasureScreen() {
    return (
      <MeasurementCapture
        autoCalibrate={true}
        onMeasurementComplete={async (result) => {
          // Send to backend
          await fetch('/api/intake/measurements', {
            method: 'POST',
            body: JSON.stringify({
              distance: result.distance,
              unit: result.unit,
              method: result.method,
              confidence: result.confidence,
            }),
          })
        }}
      />
    )
  }
  ```

- [ ] **Test on Devices**:
  - [ ] iPhone 14 Pro+ (LiDAR): Measure without calibration → should work instantly
  - [ ] iPhone 11 (No LiDAR): Show credit card → should calibrate → measure
  - [ ] Android (ToF or standard): Test reference object calibration

#### Measurements API

- [ ] **Database Schema** (Prisma):
  - [ ] Add `MeasurementSession` model to schema
  - [ ] Add `Measurement` model to schema
  - [ ] Run `npx prisma migrate dev --name add_measurements`
  - [ ] Generate Prisma client: `npx prisma generate`

- [ ] **API Endpoint** (`/api/intake/measurements`):
  - [ ] Wire Prisma to route (currently has TODO)
  - [ ] Test POST `/api/intake/measurements` with sample data
  - [ ] Verify measurements stored in database

- [ ] **Intake Update Trigger**:
  - [ ] When measurement recorded → update intake record
  - [ ] Add measurement to intake form_data JSONB
  - [ ] [Future] Trigger cost estimation update

---

### ✅ Marketplace Production Readiness

#### Verified (Already Fixed)
- [x] Og-image reference: `/kealee-og-image.jpg` ✅
- [x] Contact phone number: Real number, no placeholder ✅
- [x] Service listings: Current pricing from core-rules.ts ✅

#### Still Needed
- [ ] **Screenshot/Walkthrough**:
  - [ ] Start dev server: `pnpm run dev`
  - [ ] Visit https://marketplace.kealee.com (or local equivalent)
  - [ ] Take screenshots of:
    - [ ] Homepage (concept packages visible)
    - [ ] Product pages (kitchen, bathroom, permits)
    - [ ] Pricing tiers (should match core-rules.ts)
    - [ ] Checkout flow
    - [ ] Contact page

- [ ] **SEO Verification**:
  - [ ] Homepage: Meta description present
  - [ ] Product pages: Keywords in titles + descriptions
  - [ ] Pricing page: Structured data (Schema.org)
  - [ ] Mobile responsiveness: Test on mobile device

- [ ] **Analytics Wiring**:
  - [ ] GA4 tracking: Page views, clicks
  - [ ] Form submission events tracked
  - [ ] Checkout funnel visible in GA4

---

## Phase 1: Nationwide Foundation (Next 2 Weeks)

### Database Schema

- [ ] **Jurisdiction Model**:
  ```bash
  # Create Prisma model in schema.prisma
  # Run: npx prisma migrate dev --name add_jurisdictions
  ```

- [ ] **Seed DMV Jurisdictions**:
  ```bash
  # Migrate hardcoded DMV from packages/os-engineering/src/jurisdictions.ts
  # to Prisma Jurisdiction table
  ```

### Admin Console

- [ ] **Jurisdiction Management**:
  - [ ] CRUD interface at `/admin/jurisdictions`
  - [ ] Add/edit/delete jurisdictions
  - [ ] Set region pricing multipliers
  - [ ] Upload compliance rules

### API Endpoints

- [ ] **GET /api/jurisdictions/{code}**
  - [ ] Return jurisdiction details by code
  - [ ] Include cost multipliers, permit pathways

- [ ] **POST /api/jurisdictions/lookup**
  - [ ] Accept address → return jurisdiction code + details
  - [ ] Uses reverse geocoding (Google Maps API)

---

## Phase 2: Regional Cost Database (Weeks 3-4)

### RSMeans Integration

- [ ] **Account Setup**:
  - [ ] Create account at RSMeans
  - [ ] Purchase API access ($500-1000)
  - [ ] Generate API credentials

- [ ] **API Integration**:
  ```bash
  # Create lib/services/rsmeans.ts
  # Implement cost lookup by location code + unit
  ```

- [ ] **Cost Multiplier Lookup**:
  - [ ] Get city index for each jurisdiction
  - [ ] Apply to base costs: `base_cost * (city_index / 100)`

### CostDatabase Prisma Model

- [ ] **Schema Addition**:
  - [ ] Source, jurisdiction, cityIndex, laborIndex, materialIndex
  - [ ] effectiveDate, expiresAt

- [ ] **Seed Production Data**:
  - [ ] Import RSMeans data for top 5 metros
  - [ ] Test cost lookups for sample projects

---

## Phase 3: Compliance Rules (Weeks 5-6)

### State Research

- [ ] **TX, CO, WA, MA, GA**:
  - [ ] Setback requirements
  - [ ] Lot coverage limits
  - [ ] Height limits
  - [ ] Parking requirements (commercial)

### ComplianceRule Prisma Model

- [ ] **Schema Addition**:
  - [ ] jurisdiction, ruleType, ruleValue, appliesTo
  - [ ] sourceCode, sourceUrl, lastVerified

- [ ] **Admin UI**:
  - [ ] Add rules at `/admin/compliance-rules`
  - [ ] Verify against source documents

---

## Post-Launch Monitoring

### Metrics Dashboard

- [ ] **Services**:
  - [ ] Twilio: SMS sent/failed, delivery rate
  - [ ] Resend: Email sent/failed, open rate
  - [ ] Measurements: Methods used, confidence scores

- [ ] **Location Coverage**:
  - [ ] Jurisdictions available: [number]
  - [ ] Cost databases available: [number]
  - [ ] Contractors active: [number]

### Logs & Alerts

- [ ] **SMS Failures** (alert if > 1% failure rate):
  ```
  Sentry alert: [Twilio] SMS delivery failed
  ```

- [ ] **Email Bounces** (alert if > 0.5%):
  ```
  Sentry alert: [Resend] Email bounce or complaint
  ```

- [ ] **Measurement Recording** (alert if endpoint down):
  ```
  Monitor: POST /api/intake/measurements status
  ```

---

## Environment Variables Reference

### Development (.env.local)

```bash
# Twilio
TWILIO_ACCOUNT_SID=AC[your_account_sid]
TWILIO_AUTH_TOKEN=your_auth_token_here
TWILIO_PHONE_NUMBER=+13015758777

# Resend
RESEND_API_KEY=re_your_api_key_here
RESEND_FROM_EMAIL=noreply@kealee.com
RESEND_CONTACT_EMAIL=contact@kealee.com

# Measurements API (optional for testing)
# NEXT_PUBLIC_MEASUREMENTS_API=http://localhost:3000/api/intake/measurements
```

### Production (Railway)

Set the same 6 variables in Railway dashboard under web-main service Variables tab.

---

## Documentation References

- [Twilio + Resend Setup](./twilio-resend-setup.md)
- [Measurements Database Schema](./measurements-prisma-schema.md)
- [Nationwide Expansion Plan](../decisions/nationwide-expansion-plan.md)
- [Mobile Measurement README](../../packages/mobile-measurement/README.md)

---

## Sign-Off

- [ ] SMS delivery tested and working
- [ ] Email delivery tested and working
- [ ] Measurements API receiving data
- [ ] Mobile app can send measurements
- [ ] Marketplace screenshots verified
- [ ] All environment variables in Railway

**Estimated Time**: 3-4 hours  
**Target Date**: [Date]  
**Completed By**: [Name]  
