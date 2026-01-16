# Third-Party Services & APIs - Complete Inventory
## All External Services Required for Kealee Platform V10

**Date:** January 2026  
**Purpose:** Comprehensive list of all third-party apps, APIs, and services needed to implement all platform features and workflows

---

## 📊 EXECUTIVE SUMMARY

This document catalogs **all third-party services, APIs, and integrations** required across all 10 stages of the Kealee Platform. Services are categorized by:
- **Category** (Authentication, Payments, Storage, etc.)
- **Stage** where they're first used
- **Status** (Required, Optional, Future)
- **Cost** (Free tier, Paid, Usage-based)

**Total Services:** ~25+ third-party integrations

---

## 🔐 AUTHENTICATION & USER MANAGEMENT

### 1. **Supabase Auth**
- **Purpose:** User authentication, JWT token management, user sessions
- **Used In:** Stage 1 (OS Foundation)
- **Status:** ✅ Required
- **Cost:** Free tier available, paid plans for higher usage
- **Features Used:**
  - User signup/login
  - JWT token generation/validation
  - Password reset flows
  - Email verification
  - Session management
- **Integration Points:**
  - `services/api/src/modules/auth/` - Authentication middleware
  - All API endpoints require Supabase JWT validation
- **API Keys Needed:**
  - `SUPABASE_URL`
  - `SUPABASE_ANON_KEY`
  - `SUPABASE_SERVICE_ROLE_KEY` (for admin operations)

---

## 💳 PAYMENT PROCESSING

### 2. **Stripe Connect**
- **Purpose:** Payment processing, escrow transactions, marketplace payouts
- **Used In:** Stage 5 (Finance & Trust), Stage 6 (Marketplace)
- **Status:** ✅ Required
- **Cost:** 2.9% + $0.30 per transaction (standard), Connect fees additional
- **Features Used:**
  - Payment intents for escrow deposits
  - Connected accounts for marketplace contractors
  - Payouts to contractors
  - Subscription billing (for service packages)
  - Refund processing
  - Dispute management
- **Integration Points:**
  - `services/api/src/modules/payments/` - Payment processing
  - `services/api/src/modules/marketplace/` - Contractor payouts
  - `services/api/src/modules/billing/` - Subscription billing
- **API Keys Needed:**
  - `STRIPE_SECRET_KEY`
  - `STRIPE_PUBLISHABLE_KEY`
  - `STRIPE_WEBHOOK_SECRET` (for webhook verification)

---

## 📧 EMAIL SERVICES

### 3. **SendGrid**
- **Purpose:** Transactional email delivery
- **Used In:** Stage 1 (OS Foundation) - Worker service
- **Status:** ✅ Required
- **Cost:** Free tier (100 emails/day), paid plans from $15/month
- **Features Used:**
  - Welcome emails
  - Password reset emails
  - Project notifications
  - Milestone alerts
  - Inspection reminders
  - Permit status updates
  - Weekly service reports
- **Integration Points:**
  - `services/worker/src/processors/email.processor.ts` - Email queue worker
  - `services/worker/src/queues/email.queue.ts` - Email job queue
- **API Keys Needed:**
  - `SENDGRID_API_KEY`
  - `SENDGRID_FROM_EMAIL`
  - `SENDGRID_FROM_NAME`

---

## 📄 DOCUMENT SIGNING

### 4. **DocuSign API**
- **Purpose:** Electronic signature for contracts, approvals, professional seals
- **Used In:** Stage 4 (Project Owner), Stage 7 (Architect Hub)
- **Status:** ✅ Required
- **Cost:** Plans from $15/user/month, API usage-based pricing
- **Features Used:**
  - Contract signing workflows
  - Multi-party signature collection
  - Signature tracking and reminders
  - Professional seal application (architect stamps)
  - Approval certificate generation
  - Document completion notifications
- **Integration Points:**
  - `services/api/src/modules/contracts/docusign.service.ts` - Contract signing
  - `services/api/src/modules/architect/approval.service.ts` - Professional approval workflows
- **API Keys Needed:**
  - `DOCUSIGN_INTEGRATION_KEY`
  - `DOCUSIGN_USER_ID`
  - `DOCUSIGN_ACCOUNT_ID`
  - `DOCUSIGN_RSA_PRIVATE_KEY` (for JWT authentication)
  - `DOCUSIGN_API_BASE_URL` (demo or production)

---

## ☁️ FILE STORAGE

### 5. **AWS S3** (or **Cloudflare R2**)
- **Purpose:** File storage for documents, drawings, photos, reports
- **Used In:** All stages (file uploads throughout platform)
- **Status:** ✅ Required
- **Cost:** 
  - AWS S3: ~$0.023/GB storage, $0.005/1,000 requests
  - Cloudflare R2: $0.015/GB storage, free egress
- **Features Used:**
  - Design file storage (DWG, RVT, PDF, SKP)
  - Drawing sheet storage
  - BIM model storage
  - Photo uploads (inspections, milestones)
  - Document storage (contracts, permits, reports)
  - Deliverable package storage
  - Report generation output
- **Integration Points:**
  - All file upload endpoints across modules
  - `services/api/src/modules/files/` - File management
  - `services/worker/src/processors/reports.processor.ts` - Report storage
- **API Keys Needed:**
  - `AWS_ACCESS_KEY_ID`
  - `AWS_SECRET_ACCESS_KEY`
  - `AWS_S3_BUCKET_NAME`
  - `AWS_S3_REGION`
  - OR
  - `CLOUDFLARE_R2_ACCOUNT_ID`
  - `CLOUDFLARE_R2_ACCESS_KEY_ID`
  - `CLOUDFLARE_R2_SECRET_ACCESS_KEY`
  - `CLOUDFLARE_R2_BUCKET_NAME`

---

## 🤖 AI/ML SERVICES

### 6. **Anthropic Claude API**
- **Purpose:** AI-powered features, ML processing, content generation
- **Used In:** Stage 1 (OS Foundation) - Worker service, Stage 9 (Automation & ML Hub)
- **Status:** ✅ Required (for ML features)
- **Cost:** Usage-based pricing (~$0.008 per 1K input tokens, $0.024 per 1K output tokens)
- **Features Used:**
  - Automated report generation
  - Content summarization
  - ML-based recommendations
  - Natural language processing
  - Automated compliance checking (future)
  - Design pattern recognition (future)
- **Integration Points:**
  - `services/worker/src/processors/ml.processor.ts` - ML queue worker
  - `services/worker/src/queues/ml.queue.ts` - ML job queue
- **API Keys Needed:**
  - `ANTHROPIC_API_KEY`

---

## 🗄️ DATABASE & CACHING

### 7. **PostgreSQL**
- **Purpose:** Primary database (via Prisma ORM)
- **Used In:** Stage 1 (OS Foundation)
- **Status:** ✅ Required
- **Cost:** 
  - Self-hosted: Free
  - Managed (Railway, Supabase, AWS RDS): $5-50/month+
- **Features Used:**
  - All data persistence
  - Prisma ORM integration
  - Transactions and relationships
- **Integration Points:**
  - `packages/database/prisma/` - Database schema
  - All API services use Prisma client
- **Connection String:**
  - `DATABASE_URL=postgresql://user:password@host:port/database`

### 8. **Redis / Upstash**
- **Purpose:** Caching, session storage, job queue backend
- **Used In:** Stage 1 (OS Foundation) - Worker service
- **Status:** ✅ Required
- **Cost:**
  - Redis (self-hosted): Free
  - Upstash: Free tier (10K commands/day), paid from $0.20/100K commands
- **Features Used:**
  - BullMQ job queue backend
  - Session caching
  - Rate limiting storage
  - Real-time presence tracking
- **Integration Points:**
  - `services/worker/` - All queue workers
  - `services/api/src/middleware/rate-limit.middleware.ts` - Rate limiting
- **Connection String:**
  - `REDIS_URL=redis://localhost:6379` or `rediss://default:password@host:port`

---

## 🏗️ HOSTING & INFRASTRUCTURE

### 9. **Railway** (or **AWS/Vercel**)
- **Purpose:** Backend API hosting
- **Used In:** All stages (production deployment)
- **Status:** ✅ Required (for production)
- **Cost:** 
  - Railway: $5/month starter, usage-based
  - AWS: Pay-as-you-go
  - Vercel: Free tier for frontend
- **Features Used:**
  - API server hosting
  - Worker service hosting
  - Database hosting (optional)
  - Environment variable management
- **Integration Points:**
  - `services/api/` - API server deployment
  - `services/worker/` - Worker service deployment

### 10. **Vercel**
- **Purpose:** Frontend application hosting
- **Used In:** All stages (all Next.js apps)
- **Status:** ✅ Required (for production)
- **Cost:** Free tier available, paid plans for teams
- **Features Used:**
  - Next.js app deployment
  - Edge functions
  - CDN for static assets
  - Preview deployments
- **Integration Points:**
  - All `apps/` directories (Next.js applications)

---

## 📊 MONITORING & LOGGING

### 11. **Sentry**
- **Purpose:** Error tracking and performance monitoring
- **Used In:** All stages (production monitoring)
- **Status:** ⚠️ Recommended
- **Cost:** Free tier (5K events/month), paid from $26/month
- **Features Used:**
  - Error tracking
  - Performance monitoring
  - Release tracking
  - User feedback collection
- **Integration Points:**
  - All API services
  - All frontend applications
- **API Keys Needed:**
  - `SENTRY_DSN`
  - `SENTRY_AUTH_TOKEN` (for releases)

### 12. **LogRocket**
- **Purpose:** Session replay and user analytics
- **Used In:** All stages (production monitoring)
- **Status:** ⚠️ Optional
- **Cost:** Plans from $99/month
- **Features Used:**
  - Session replay
  - User behavior analytics
  - Error reproduction
  - Performance insights
- **Integration Points:**
  - Frontend applications
- **API Keys Needed:**
  - `LOGROCKET_APP_ID`

---

## 🏛️ PERMITS & INSPECTIONS INTEGRATIONS

### 13. **State License Validation APIs**
- **Purpose:** Verify architect/engineer license status
- **Used In:** Stage 7 (Architect Hub) - Stamp workflow
- **Status:** ✅ Required (for professional stamp verification)
- **Cost:** Varies by state (some free, some paid)
- **Features Used:**
  - Architect license verification
  - Engineer license verification
  - Landscape architect license verification
  - License expiration tracking
  - State-specific validation rules
- **Integration Points:**
  - `services/api/src/modules/architect/stamp.service.ts` - License validation
- **API Keys Needed:**
  - State-specific API keys (varies by state)
  - Examples:
    - California: CA DCA License API
    - Texas: TBAE License Lookup API
    - New York: NYSED License Verification API
- **Note:** Each state has different APIs/endpoints. May require custom integration per state.

### 14. **GIS Services** (ArcGIS, Google Maps, Mapbox)
- **Purpose:** Parcel lookup, zoning verification, flood zone checks
- **Used In:** Stage 7.5 (Permits & Inspections Hub)
- **Status:** ✅ Required (for permit features)
- **Cost:**
  - Google Maps: $200/month free credit, then usage-based
  - Mapbox: Free tier (50K requests/month), then usage-based
  - ArcGIS: Enterprise pricing
- **Features Used:**
  - Parcel identification
  - Zoning information lookup
  - Setback calculations
  - Flood zone verification
  - Address geocoding
  - Property boundary visualization
- **Integration Points:**
  - `services/api/src/modules/permits/` - Permit application features
- **API Keys Needed:**
  - `GOOGLE_MAPS_API_KEY` or
  - `MAPBOX_ACCESS_TOKEN` or
  - `ARCGIS_API_KEY`

---

## 🔧 CAD/BIM SOFTWARE INTEGRATIONS (Future)

### 15. **Autodesk Forge API**
- **Purpose:** CAD file viewing, conversion, BIM model access
- **Used In:** Stage 7 (Architect Hub) - Future enhancement
- **Status:** 🔮 Future / Optional
- **Cost:** Free tier available, paid plans for higher usage
- **Features Used:**
  - DWG file viewing
  - RVT (Revit) model viewing
  - File format conversion
  - Model data extraction
  - Drawing markup integration
- **Integration Points:**
  - `apps/m-architect/app/projects/[id]/models/` - 3D/BIM model viewer
- **API Keys Needed:**
  - `AUTODESK_CLIENT_ID`
  - `AUTODESK_CLIENT_SECRET`

### 16. **SketchUp 3D Warehouse API**
- **Purpose:** 3D model library access
- **Used In:** Stage 7 (Architect Hub) - Future enhancement
- **Status:** 🔮 Future / Optional
- **Cost:** Free (with API key)
- **Features Used:**
  - 3D model search and import
  - Model library integration
- **API Keys Needed:**
  - `SKETCHUP_API_KEY`

---

## 📱 SMS NOTIFICATIONS (Future)

### 17. **Twilio**
- **Purpose:** SMS notifications for inspections, reminders
- **Used In:** Stage 7.5 (Permits & Inspections Hub) - Future enhancement
- **Status:** 🔮 Future / Optional
- **Cost:** ~$0.0075 per SMS
- **Features Used:**
  - Inspection reminders
  - Permit status updates
  - Two-factor authentication
- **Integration Points:**
  - `services/worker/src/processors/` - SMS queue worker (future)
- **API Keys Needed:**
  - `TWILIO_ACCOUNT_SID`
  - `TWILIO_AUTH_TOKEN`
  - `TWILIO_PHONE_NUMBER`

---

## 🔄 WEBHOOKS & INTEGRATIONS

### 18. **Webhook Delivery Service**
- **Purpose:** Outbound webhook delivery to external systems
- **Used In:** Stage 1 (OS Foundation) - Worker service
- **Status:** ✅ Required (for integrations)
- **Cost:** Included in infrastructure
- **Features Used:**
  - Webhook delivery to external APIs
  - Retry logic for failed webhooks
  - Webhook signature verification
- **Integration Points:**
  - `services/worker/src/processors/webhook.processor.ts` - Webhook queue worker
- **Configuration:**
  - `WEBHOOK_SECRET` (for signing)

---

## 📄 PDF GENERATION

### 19. **PDFKit** (Library, not service)
- **Purpose:** PDF report generation
- **Used In:** Stage 1 (OS Foundation) - Worker service
- **Status:** ✅ Required (library, not external service)
- **Cost:** Free (open source)
- **Features Used:**
  - Weekly summary reports
  - Project status reports
  - Financial summaries
  - Custom report generation
- **Integration Points:**
  - `services/worker/src/processors/reports.processor.ts` - Report generation
- **Note:** This is a Node.js library, not an external API

---

## 🎯 SPECIALIZED INTEGRATIONS

### 20. **Building Code Database APIs** (Future)
- **Purpose:** Automated code compliance checking
- **Used In:** Stage 7 (Architect Hub) - Design validation
- **Status:** 🔮 Future / Optional
- **Cost:** Varies by provider
- **Features Used:**
  - Building code lookup
  - Compliance rule validation
  - Code cross-referencing
- **Potential Providers:**
  - ICC (International Code Council) API
  - UpCodes API
  - Custom database integration
- **Integration Points:**
  - `services/api/src/modules/architect/validation.service.ts` - Code compliance

### 21. **Energy Code Compliance APIs** (Future)
- **Purpose:** Energy code compliance verification
- **Used In:** Stage 7 (Architect Hub) - Design validation
- **Status:** 🔮 Future / Optional
- **Cost:** Varies by provider
- **Features Used:**
  - Energy code compliance checking
  - HERS rating integration
  - LEED compliance tracking
- **Potential Providers:**
  - RESNET API
  - Energy Star API
  - Custom integration

---

## 📋 SUMMARY BY CATEGORY

### **Required Services (Must Have)**
1. ✅ Supabase Auth
2. ✅ Stripe Connect
3. ✅ SendGrid
4. ✅ DocuSign API
5. ✅ AWS S3 / Cloudflare R2
6. ✅ PostgreSQL
7. ✅ Redis / Upstash
8. ✅ Railway / AWS (hosting)
9. ✅ Vercel (hosting)
10. ✅ State License Validation APIs (for architect stamps)

### **Recommended Services (Should Have)**
11. ⚠️ Sentry (error tracking)
12. ⚠️ GIS Services (for permits)

### **Optional / Future Services**
13. 🔮 LogRocket (session replay)
14. 🔮 Anthropic Claude API (ML features - already integrated in worker)
15. 🔮 Autodesk Forge API (CAD viewing)
16. 🔮 SketchUp API (3D models)
17. 🔮 Twilio (SMS notifications)
18. 🔮 Building Code APIs (compliance)
19. 🔮 Energy Code APIs (compliance)

---

## 💰 ESTIMATED MONTHLY COSTS

### **Minimum Viable (Free/Low Cost)**
- Supabase Auth: Free tier
- SendGrid: Free tier (100 emails/day)
- PostgreSQL: $5-10/month (Railway)
- Redis: Free (self-hosted) or $0.20/100K commands (Upstash)
- Railway: $5/month starter
- Vercel: Free tier
- **Total: ~$10-15/month**

### **Production Scale (Recommended)**
- Supabase Auth: $25/month
- Stripe: 2.9% + $0.30 per transaction
- SendGrid: $15/month (40K emails)
- DocuSign: $45/user/month
- AWS S3: ~$20/month (100GB storage)
- PostgreSQL: $20/month (managed)
- Redis: $10/month (Upstash)
- Railway: $20/month
- Vercel: $20/month (Pro)
- Sentry: $26/month
- GIS API: $200/month (Google Maps)
- **Total: ~$400-500/month base + transaction fees**

### **Enterprise Scale**
- All services at higher tiers
- Multiple DocuSign users
- Higher storage/bandwidth
- Additional monitoring tools
- **Total: ~$1,000-2,000/month + transaction fees**

---

## 🔑 API KEY MANAGEMENT

### **Environment Variables Required**

All API keys should be stored in environment variables:

```env
# Authentication
SUPABASE_URL=
SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# Payments
STRIPE_SECRET_KEY=
STRIPE_PUBLISHABLE_KEY=
STRIPE_WEBHOOK_SECRET=

# Email
SENDGRID_API_KEY=
SENDGRID_FROM_EMAIL=
SENDGRID_FROM_NAME=

# Document Signing
DOCUSIGN_INTEGRATION_KEY=
DOCUSIGN_USER_ID=
DOCUSIGN_ACCOUNT_ID=
DOCUSIGN_RSA_PRIVATE_KEY=
DOCUSIGN_API_BASE_URL=

# File Storage
AWS_ACCESS_KEY_ID=
AWS_SECRET_ACCESS_KEY=
AWS_S3_BUCKET_NAME=
AWS_S3_REGION=

# AI/ML
ANTHROPIC_API_KEY=

# Database
DATABASE_URL=

# Caching
REDIS_URL=

# Monitoring
SENTRY_DSN=
SENTRY_AUTH_TOKEN=
LOGROCKET_APP_ID=

# GIS
GOOGLE_MAPS_API_KEY=
# OR
MAPBOX_ACCESS_TOKEN=

# State License APIs (varies by state)
CA_DCA_API_KEY=
TX_TBAE_API_KEY=
NY_NYSED_API_KEY=
# ... (other states)

# Webhooks
WEBHOOK_SECRET=
```

---

## 📝 INTEGRATION NOTES

### **State License Validation**
- Each state has different APIs and requirements
- Some states provide free public APIs
- Others require paid access or custom integration
- May need to implement state-by-state adapters
- Consider using a third-party aggregator service if available

### **GIS Services**
- Google Maps is most comprehensive but expensive at scale
- Mapbox is good alternative with better pricing
- ArcGIS required for some government integrations
- Consider caching GIS data to reduce API calls

### **File Storage**
- Cloudflare R2 has free egress (better for high download volumes)
- AWS S3 has better ecosystem integration
- Consider CDN for file delivery (Cloudflare CDN)

### **Payment Processing**
- Stripe Connect required for marketplace payouts
- Consider Stripe Connect Express for faster onboarding
- Webhook verification critical for security

### **Document Signing**
- DocuSign JWT authentication recommended for server-to-server
- OAuth flow available for user-initiated actions
- Consider template management for common documents

---

## 🚀 IMPLEMENTATION PRIORITY

### **Phase 1: Core Infrastructure (Weeks 2-3)**
1. Supabase Auth
2. PostgreSQL
3. Redis
4. SendGrid

### **Phase 2: Revenue Features (Weeks 6-14)**
5. Stripe Connect
6. DocuSign API
7. AWS S3 / Cloudflare R2

### **Phase 3: Specialized Features (Weeks 18-22)**
8. State License Validation APIs
9. GIS Services
10. Anthropic Claude API (if not already integrated)

### **Phase 4: Enhancements (Future)**
11. Autodesk Forge API
12. Twilio
13. Building Code APIs
14. Additional monitoring tools

---

**Last Updated:** January 2026  
**Next Review:** After Stage 7.5 (Permits & Inspections) implementation
