# 🏗️ Kealee Development - System Architecture

## Overview

```
┌─────────────────────────────────────────────────────────────┐
│                      CLIENT BROWSER                          │
│  (Next.js 14 App Router - Server-Side Rendered)            │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                    FRONTEND PAGES                            │
├─────────────────────────────────────────────────────────────┤
│  • Home (/  )                                               │
│  • Services (/services)                                      │
│  • How It Works (/how-it-works)                             │
│  • Experience (/experience)                                  │
│  • Contact (/contact)                                        │
│                                                              │
│  Components: Header, Footer, IntakeModal, IntakeForm        │
└─────────────────────────────────────────────────────────────┘
                            │
                ┌───────────┴───────────┐
                ▼                       ▼
┌──────────────────────────┐  ┌──────────────────────────┐
│   PUBLIC API ROUTES      │  │   ADMIN API ROUTES       │
│   (No Auth Required)     │  │   (Auth Required)        │
├──────────────────────────┤  ├──────────────────────────┤
│ POST /api/intake         │  │ POST /admin/login        │
│ POST /analytics/track    │  │ POST /admin/logout       │
└──────────────────────────┘  │ GET  /admin/leads        │
                              │ PATCH /admin/leads       │
                              │ GET  /admin/leads/[id]   │
                              │ DEL  /admin/leads/[id]   │
                              │ POST /admin/leads/[id]/  │
                              │      notes               │
                              │ GET  /admin/analytics    │
                              │ GET  /admin/export       │
                              └──────────────────────────┘
                                        │
                              ┌─────────┴─────────┐
                              ▼                   ▼
                    ┌──────────────────┐  ┌──────────────────┐
                    │  AUTHENTICATION  │  │   VALIDATION     │
                    ├──────────────────┤  ├──────────────────┤
                    │ • JWT Tokens     │  │ • Zod Schemas    │
                    │ • bcrypt Hashing │  │ • Type Safety    │
                    │ • HttpOnly       │  │ • Input Sanitize │
                    │   Cookies        │  │ • Spam Check     │
                    │ • RBAC (Roles)   │  │                  │
                    └──────────────────┘  └──────────────────┘
                              │                   │
                              └─────────┬─────────┘
                                        ▼
                              ┌──────────────────┐
                              │  BUSINESS LOGIC  │
                              ├──────────────────┤
                              │ • Lead Priority  │
                              │ • Email Sending  │
                              │ • Analytics Calc │
                              │ • Export Format  │
                              └──────────────────┘
                                        │
                    ┌───────────────────┼───────────────────┐
                    ▼                   ▼                   ▼
          ┌──────────────────┐  ┌──────────────┐  ┌──────────────┐
          │   PRISMA ORM     │  │ EMAIL SERVICE│  │  ANALYTICS   │
          ├──────────────────┤  ├──────────────┤  ├──────────────┤
          │ • Type-safe      │  │ • Resend OR  │  │ • Event Track│
          │ • Migrations     │  │ • SendGrid   │  │ • Metrics    │
          │ • Relationships  │  │ • Templates  │  │ • Trends     │
          └──────────────────┘  └──────────────┘  └──────────────┘
                    │
                    ▼
          ┌──────────────────────────────────┐
          │         DATABASE                 │
          ├──────────────────────────────────┤
          │  SQLite (dev) / PostgreSQL (prod)│
          │                                  │
          │  Models:                         │
          │  • Lead                          │
          │  • Admin                         │
          │  • Note                          │
          │  • Tag                           │
          │  • EmailLog                      │
          │  • AnalyticsEvent                │
          └──────────────────────────────────┘
```

## Data Flow

### 1. Lead Submission Flow

```
User fills form → Validation (Zod) → Spam Check
                                         │
                                         ▼
                            ┌────────────┴────────────┐
                            ▼                         ▼
                    Save to Database         Send Email
                    (Prisma → DB)           (Resend/SendGrid)
                            │                         │
                            ▼                         ▼
                    Log Analytics           Log Email Status
                            │                         │
                            └────────────┬────────────┘
                                         ▼
                              Return Success Response
```

### 2. Admin Authentication Flow

```
Login Request → Validate Credentials
                        │
                        ▼
              Find Admin in Database
                        │
                        ▼
              Verify Password (bcrypt)
                        │
                        ▼
              Generate JWT Token
                        │
                        ▼
              Set HttpOnly Cookie
                        │
                        ▼
              Return Admin Info
```

### 3. Protected API Request Flow

```
Request → Extract Cookie → Verify JWT
                               │
                    ┌──────────┴──────────┐
                    ▼                     ▼
                 Valid              Invalid
                    │                     │
                    ▼                     ▼
            Check Role           Return 401
                    │
        ┌───────────┴───────────┐
        ▼                       ▼
    Sufficient          Insufficient
        │                       │
        ▼                       ▼
   Execute Query        Return 403
        │
        ▼
   Return Data
```

## Database Schema

```
┌─────────────────────────────────────────────────────────────┐
│                          Lead                                │
├─────────────────────────────────────────────────────────────┤
│ id (PK)              String                                  │
│ createdAt            DateTime                                │
│ fullName             String                                  │
│ email                String                                  │
│ company              String                                  │
│ role                 String                                  │
│ location             String                                  │
│ assetType            String                                  │
│ units                String                                  │
│ projectStage         String                                  │
│ budgetRange          String                                  │
│ timeline             String                                  │
│ needs                String (CSV)                            │
│ message              String                                  │
│ status               LeadStatus                              │
│ priority             Priority                                │
│ contacted            Boolean                                 │
│ contactedAt          DateTime?                               │
│ ipAddress            String?                                 │
│ userAgent            String?                                 │
└─────────────────────────────────────────────────────────────┘
                              │
                ┌─────────────┼─────────────┐
                ▼             ▼             ▼
         ┌──────────┐  ┌──────────┐  ┌──────────┐
         │   Note   │  │   Tag    │  │ EmailLog │
         ├──────────┤  ├──────────┤  ├──────────┤
         │ id (PK)  │  │ id (PK)  │  │ id (PK)  │
         │ leadId   │  │ name     │  │ leadId?  │
         │ content  │  │ color    │  │ to       │
         │ authorId │  └──────────┘  │ status   │
         │ created  │                │ provider │
         └──────────┘                └──────────┘

┌─────────────────────┐        ┌─────────────────────┐
│       Admin         │        │  AnalyticsEvent     │
├─────────────────────┤        ├─────────────────────┤
│ id (PK)             │        │ id (PK)             │
│ email (unique)      │        │ event               │
│ name                │        │ page                │
│ passwordHash        │        │ data (JSON)         │
│ role                │        │ timestamp           │
│ active              │        │ ipAddress           │
│ lastLogin           │        │ userAgent           │
└─────────────────────┘        └─────────────────────┘
```

## Security Layers

```
┌─────────────────────────────────────────────────────────────┐
│                     SECURITY LAYERS                          │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  Layer 1: INPUT VALIDATION                                  │
│  • Zod schema validation                                    │
│  • Type checking (TypeScript)                               │
│  • Spam detection (honeypot + timing)                       │
│                                                              │
│  Layer 2: AUTHENTICATION                                    │
│  • JWT tokens with expiration                               │
│  • HttpOnly cookies (no JavaScript access)                  │
│  • Secure flag in production                                │
│  • SameSite protection                                      │
│                                                              │
│  Layer 3: AUTHORIZATION                                     │
│  • Role-based access control (RBAC)                         │
│  • Permission checks on every endpoint                      │
│  • Admin roles: VIEWER / EDITOR / ADMIN                     │
│                                                              │
│  Layer 4: DATA PROTECTION                                   │
│  • Password hashing (bcrypt, 12 rounds)                     │
│  • SQL injection prevention (Prisma)                        │
│  • XSS prevention (React escaping)                          │
│  • Generic error messages                                   │
│                                                              │
│  Layer 5: TRANSPORT SECURITY                                │
│  • HTTPS in production (Vercel)                             │
│  • Secure headers                                           │
│  • CORS configuration                                       │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

## Deployment Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    PRODUCTION (Vercel)                       │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌────────────────────────────────────────────────┐        │
│  │         Edge Network (Global CDN)              │        │
│  │  • Static assets cached                        │        │
│  │  • SSL/TLS termination                         │        │
│  │  • DDoS protection                             │        │
│  └────────────────────────────────────────────────┘        │
│                         │                                    │
│                         ▼                                    │
│  ┌────────────────────────────────────────────────┐        │
│  │         Next.js Application                    │        │
│  │  • Server-side rendering                       │        │
│  │  • API routes                                  │        │
│  │  • Static generation where possible            │        │
│  └────────────────────────────────────────────────┘        │
│                         │                                    │
│          ┌──────────────┼──────────────┐                   │
│          ▼              ▼              ▼                    │
│  ┌──────────┐  ┌──────────────┐  ┌──────────┐            │
│  │PostgreSQL│  │ Email Service│  │ Analytics│            │
│  │(Supabase)│  │   (Resend)   │  │  (Built) │            │
│  └──────────┘  └──────────────┘  └──────────┘            │
│                                                              │
└─────────────────────────────────────────────────────────────┘

```

## Technology Choices & Rationale

### Frontend
**Next.js 14**
- ✅ Server-side rendering for SEO
- ✅ API routes for backend
- ✅ File-based routing
- ✅ Excellent DX
- ✅ Vercel deployment optimized

**TypeScript**
- ✅ Type safety
- ✅ Better IDE support
- ✅ Catch errors at compile time
- ✅ Self-documenting code

**Tailwind CSS**
- ✅ Utility-first approach
- ✅ Consistent design system
- ✅ Small bundle size
- ✅ Responsive design easy

**shadcn/ui**
- ✅ Accessible components
- ✅ Customizable
- ✅ Copy-paste, not NPM dependency
- ✅ Built on Radix UI

### Backend
**Prisma**
- ✅ Type-safe database queries
- ✅ Auto-generated TypeScript types
- ✅ Easy migrations
- ✅ Great developer experience
- ✅ Supports multiple databases

**SQLite (dev) / PostgreSQL (prod)**
- ✅ SQLite: No setup, file-based, perfect for dev
- ✅ PostgreSQL: Production-grade, scalable, reliable
- ✅ Same Prisma schema works for both

**JWT + HttpOnly Cookies**
- ✅ Stateless authentication
- ✅ XSS protection (HttpOnly)
- ✅ CSRF protection (SameSite)
- ✅ Easy to scale

**bcrypt**
- ✅ Industry standard
- ✅ Automatic salting
- ✅ Configurable work factor
- ✅ Battle-tested

## Performance Considerations

### Frontend Optimization
- ✅ Server-side rendering (SSR)
- ✅ Static generation where possible
- ✅ Image optimization (Next.js)
- ✅ Code splitting (automatic)
- ✅ Tree shaking
- ✅ Minimal JavaScript

### Database Optimization
- ✅ Indexes on frequently queried fields
  - email, status, createdAt, budgetRange
- ✅ Efficient queries (Prisma generates optimal SQL)
- ✅ Connection pooling
- ✅ Pagination for large datasets

### API Optimization
- ✅ Efficient serialization
- ✅ Minimal response payloads
- ✅ Caching headers where appropriate
- ✅ Gzip compression (Vercel)

## Scalability

### Current Capacity
- **Frontend:** Unlimited (Vercel edge network)
- **API:** ~1000 requests/second (Vercel serverless)
- **Database:** Depends on plan
  - SQLite: Single-server, good for < 10k leads
  - PostgreSQL: Scales to millions of records

### Scaling Strategies
1. **Database:** Upgrade PostgreSQL plan
2. **API:** Vercel auto-scales serverless functions
3. **Caching:** Add Redis for frequently accessed data
4. **CDN:** Already optimized (Vercel edge)

## Monitoring & Observability

### Built-in Logging
- ✅ Console logs in development
- ✅ Structured error logging
- ✅ Email delivery tracking
- ✅ Analytics event tracking

### Recommended Additions
- [ ] Sentry for error tracking
- [ ] LogRocket for session replay
- [ ] Vercel Analytics
- [ ] Uptime monitoring (UptimeRobot)
- [ ] Database monitoring (Prisma Pulse)

## Future Enhancements

### Phase 1 (Admin Dashboard)
- [ ] Build admin UI pages
- [ ] Lead management interface
- [ ] Analytics dashboards
- [ ] Export functionality UI

### Phase 2 (CRM Integration)
- [ ] Webhook endpoints
- [ ] HubSpot integration
- [ ] Salesforce integration
- [ ] Zapier webhooks

### Phase 3 (Advanced Features)
- [ ] Email campaigns
- [ ] Drip sequences
- [ ] Lead scoring
- [ ] Automated follow-ups
- [ ] SMS notifications

### Phase 4 (AI Features)
- [ ] Lead qualification AI
- [ ] Response time optimization
- [ ] Predictive analytics
- [ ] Chatbot for pre-qualification

---

## Quick Reference

### Environment Variables
```
DATABASE_URL=              # Database connection
JWT_SECRET=                # JWT signing key
EMAIL_PROVIDER=            # RESEND or SENDGRID
RESEND_API_KEY=           # Resend API key
SENDGRID_API_KEY=         # SendGrid API key
EMAIL_TO=                 # Recipient email
EMAIL_FROM=               # Sender email
NODE_ENV=                 # development/production
```

### NPM Scripts
```bash
npm run dev        # Start dev server
npm run build      # Build for production
npm run start      # Start production server
npm run db:generate # Generate Prisma Client
npm run db:push    # Push schema to database
npm run db:studio  # Open Prisma Studio
npm run db:seed    # Seed database
```

### API Endpoints Quick Reference
```
Public:
POST   /api/intake                     # Submit lead
POST   /api/analytics/track            # Track event

Admin (Auth Required):
POST   /api/admin/login                # Login
POST   /api/admin/logout               # Logout
GET    /api/admin/leads                # List leads
PATCH  /api/admin/leads                # Update lead
GET    /api/admin/leads/[id]           # Get lead
DELETE /api/admin/leads/[id]           # Delete lead
POST   /api/admin/leads/[id]/notes     # Add note
GET    /api/admin/analytics            # Get stats
GET    /api/admin/export               # Export CSV
```

---

**Architecture designed for:**
- 🚀 Performance
- 🔒 Security
- 📈 Scalability
- 🛠️ Maintainability
- 💰 Cost-effectiveness
