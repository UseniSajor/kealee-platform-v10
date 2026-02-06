# Kealee Platform v10 - Documentation Guide

**Version:** 3.0
**Last Updated:** February 6, 2026

---

## Documentation Structure

```
kealee-platform-v10/
├── CLAUDE.md                          # Claude Code project context
├── PLATFORM_STATUS.md                 # Current implementation status
├── PRODUCTION_READINESS_CHECKLIST.md  # Security & infrastructure checklist
│
├── _docs/
│   ├── 00_README_START_HERE.md        # This file - documentation guide
│   │
│   ├── CORE REFERENCE
│   │   ├── Kealee_Platform_Complete_SOP_Logic_v2.md  # Master SOP & business logic
│   │   ├── API_MODULES_COMPLETE_INVENTORY.md         # All API endpoints by stage
│   │   ├── THIRD_PARTY_SERVICES_COMPLETE_INVENTORY.md # External service integrations
│   │   ├── SEED_DATA_REQUIREMENTS.md                  # Seed data per app/module
│   │   ├── ARCHITECTURE_QUICK_REFERENCE.md            # Architecture overview
│   │   └── Kealee_Tools_Inventory.md                  # Platform tools inventory
│   │
│   ├── SPECIFICATIONS
│   │   ├── PERMITS_INSPECTIONS_HUB_SPEC.md  # Permits hub full specification
│   │   └── Kealee_Figma_Design_Guide.md     # UI/UX design guide
│   │
│   ├── OPERATIONS
│   │   ├── ENVIRONMENT_VARIABLES.md     # All env vars needed
│   │   ├── DATABASE_MIGRATIONS.md       # Migration procedures
│   │   ├── REDIS_SETUP_GUIDE.md         # Redis configuration
│   │   ├── MONITORING_SETUP.md          # Monitoring & alerting
│   │   ├── ROLLBACK_PLAN.md             # Rollback procedures
│   │   ├── SECURITY_AUDIT_CHECKLIST.md  # Security audit items
│   │   ├── SECURITY_IMPLEMENTATION_GUIDE.md # Security implementation details
│   │   ├── LAUNCH_PREP_CHECKLIST.md     # Pre-launch checklist
│   │   ├── TESTING_GUIDE.md             # Testing procedures
│   │   └── UAT_TESTING_GUIDE.md         # User acceptance testing
│   │
│   ├── TRAINING
│   │   ├── ADMIN_TRAINING_MATERIALS.md    # Admin user training
│   │   ├── ARCHITECT_TRAINING_MATERIALS.md # Architect user training
│   │   └── USER_ONBOARDING_GUIDE.md       # General user onboarding
│   │
│   ├── Kealee command center and estimation app/  # Build specs
│   │   ├── kealee-command-center-build.md
│   │   └── kealee-estimation-tool-build.md
│   │
│   └── _archive/                        # Historical docs (not needed for development)
│       ├── stage-specs/                 # Original stage specification documents
│       ├── build-prompts/               # Cursor build prompts and planning docs
│       └── session-reports/             # Implementation session summaries
```

---

## Key Documents

### For Understanding the Platform
1. **`Kealee_Platform_Complete_SOP_Logic_v2.md`** - Master document defining all business logic, service tiers, SOPs, command center apps, and integration architecture
2. **`PLATFORM_STATUS.md`** (root) - Current implementation status of all backend, frontend, and command center components

### For Development
3. **`API_MODULES_COMPLETE_INVENTORY.md`** - All API route modules by stage with status
4. **`SEED_DATA_REQUIREMENTS.md`** - All seed data needed per app with 3rd party data sources
5. **`THIRD_PARTY_SERVICES_COMPLETE_INVENTORY.md`** - All external service integrations

### For Deployment
6. **`PRODUCTION_READINESS_CHECKLIST.md`** (root) - Security and infrastructure checklist
7. **`ENVIRONMENT_VARIABLES.md`** - All environment variables needed
8. **`LAUNCH_PREP_CHECKLIST.md`** - Pre-launch tasks

### For Reference
9. **`ARCHITECTURE_QUICK_REFERENCE.md`** - Quick architecture overview
10. **`PERMITS_INSPECTIONS_HUB_SPEC.md`** - Detailed permits hub specification

---

## Repository Structure

```
kealee-platform-v10/
├── apps/                          # Frontend Next.js applications (12 apps)
│   ├── os-admin/                  # Admin dashboard
│   ├── os-pm/                     # PM workspace
│   ├── m-marketplace/             # Central hub & marketplace
│   ├── m-project-owner/           # Homeowner project portal
│   ├── m-ops-services/            # GC/Builder service portal
│   ├── m-architect/               # Architecture services
│   ├── m-engineer/                # Engineering services
│   ├── m-permits-inspections/     # Permit tracking
│   ├── m-finance-trust/           # Escrow & payments
│   ├── m-estimation/              # Cost estimation tool
│   ├── m-inspector/               # Third-party inspections
│   └── web/                       # Marketing landing page
│
├── services/
│   └── api/                       # Fastify backend API
│       └── src/
│           ├── modules/           # Route modules (60+)
│           ├── middleware/         # Auth, RBAC, security, rate limiting
│           └── config/            # Environment config
│
├── packages/
│   ├── database/                  # Prisma schema & client
│   │   └── prisma/
│   │       └── schema.prisma      # 7,349 lines, ~140 models
│   └── automation/
│       └── apps/
│           └── estimation-tool/   # APP-15 estimation engine
│
└── _docs/                         # Documentation (you are here)
```

---

## Technology Stack

| Layer | Technology | Purpose |
|-------|-----------|---------|
| Frontend | Next.js 15 + React | 12 web applications |
| Styling | Tailwind CSS | Utility-first CSS |
| Backend | Fastify v4 | API server |
| Database | PostgreSQL + Prisma | Data persistence |
| Auth | Supabase + JWT + 2FA | Authentication |
| Payments | Stripe Connect | Payment processing |
| Hosting | Railway (API) + Vercel (Frontend) | Deployment |
| Cache | Redis / Upstash | Caching & job queues |
| Monitoring | Sentry | Error tracking |
| Package Manager | pnpm | Monorepo management |

---

**Questions?** Ask Claude Code (this tool) for help with any aspect of the platform.
