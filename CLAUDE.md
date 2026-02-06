# Kealee Platform - Claude Code Context

This file preserves key context for Claude Code sessions working on this project.

## Project Overview

Kealee Platform is a construction project management system with 12 frontend apps and 15 command center mini-apps built as a monorepo using pnpm workspaces. It's a two-sided marketplace with managed PM services connecting homeowners, contractors, architects, and engineers.

## Repository Structure

```
kealee-platform-v10/
├── apps/                           # Next.js frontend applications (12 apps)
│   ├── os-admin/                   # Platform administration dashboard
│   ├── os-pm/                      # PM workspace (executes services)
│   ├── m-marketplace/              # Central hub, marketing, sales
│   ├── m-project-owner/            # Homeowner project portal
│   ├── m-ops-services/             # GC/Builder service portal
│   ├── m-architect/                # Architecture services hub
│   ├── m-engineer/                 # Engineering services hub
│   ├── m-permits-inspections/      # Permit tracking & acceleration
│   ├── m-finance-trust/            # Escrow & payment protection
│   ├── m-estimation/               # Cost estimation tool
│   ├── m-inspector/                # Third-party inspection portal
│   └── web/                        # Marketing landing page
├── services/
│   └── api/                        # Fastify v4 backend API
│       └── src/
│           ├── index.ts            # Route registration (60+ modules)
│           ├── modules/            # Feature modules
│           ├── middleware/          # Auth, RBAC, security, rate limiting
│           └── config/             # Environment configuration
├── packages/
│   ├── database/                   # Prisma schema and client
│   │   ├── prisma/
│   │   │   └── schema.prisma       # 7,349 lines, ~140 models
│   │   └── src/
│   │       └── client.ts           # Singleton PrismaClient with pool config
│   └── automation/
│       └── apps/
│           └── estimation-tool/    # APP-15: Construction estimation engine
├── _docs/                          # Documentation (see _docs/00_README_START_HERE.md)
├── PLATFORM_STATUS.md              # Current implementation status
├── PRODUCTION_READINESS_CHECKLIST.md # Production readiness items
└── pnpm-lock.yaml
```

## Key Technical Details

### Prisma Schema

- **Location**: `packages/database/prisma/schema.prisma`
- **Important**: The organization model is named `Org`, NOT `Organization`
- **Size**: 7,349 lines, ~140 models, 500+ indexes
- **Generate command**: `npx prisma generate` (run from packages/database/)

### Key Models by Feature

- **Core**: User, Org, OrgMember, Project, Property, Client
- **Finance**: EscrowAgreement, Account, JournalEntry, Transaction, Payment, Invoice
- **Permits**: Jurisdiction, Permit, Inspection, PermitTemplate, AIReviewResult
- **Contracts**: ContractAgreement, Milestone, ChangeOrder
- **Marketplace**: Lead, MarketplaceProfile, Portfolio, Quote, Contractor
- **Estimation**: CostDatabase, MaterialCost, LaborRate, EquipmentRate, Assembly, Estimate
- **SOP v2**: PMServiceSubscription, PermitServiceSubscription, ALaCarteService, ServicePlan
- **RBAC**: Role, Permission, RolePermission
- **Infrastructure**: DashboardWidget, JobQueue, SystemConfig, IntegrationCredential

### Backend Architecture

- **Framework**: Fastify v4 on Railway
- **Auth**: Supabase JWT + 2FA (speakeasy)
- **Payments**: Stripe Connect (36 products in test mode)
- **Database**: PostgreSQL + Prisma (Railway)
- **Cache**: Redis / Upstash
- **Monitoring**: Sentry

### Frontend Architecture

- **Framework**: Next.js 15 on Vercel (auto-deploy disabled)
- **Styling**: Tailwind CSS
- **State**: React Query

### Estimation Tool Package

- **Location**: `packages/automation/apps/estimation-tool/`
- **Build command**: `pnpm run build`
- **TypeScript config**: Uses CommonJS modules (`module: "NodeNext"`)
- **Key pattern**: Uses `require.main === module` for entry point detection

### Build Commands

```bash
# Build estimation-tool
cd packages/automation/apps/estimation-tool
pnpm run build

# Generate Prisma client
cd packages/database
npx prisma generate

# Root level commands
pnpm install
pnpm run build
```

### Common Issues & Solutions

1. **Prisma JSON filter errors**: Don't use `metadata: { equals: null }` for JSON fields. Use post-query filtering instead.
2. **CommonJS import.meta error**: Use `require.main === module` instead of `import.meta.url` checks.
3. **Model naming**: Always check actual model names in schema.prisma (e.g., `Org` not `Organization`).
4. **CSRF disabled**: `@fastify/csrf-protection` v5.x incompatible with Fastify v4.x. SameSite cookies + CORS provide partial protection.
5. **CSP unsafe-inline/unsafe-eval**: Required by Stripe.js - implement nonce-based CSP when Stripe supports it.

## Documentation

- **Master SOP**: `_docs/Kealee_Platform_Complete_SOP_Logic_v2.md` (business logic, service tiers, all SOPs)
- **API Inventory**: `_docs/API_MODULES_COMPLETE_INVENTORY.md` (all endpoints by stage)
- **Seed Data**: `_docs/SEED_DATA_REQUIREMENTS.md` (all data needed per app)
- **3rd Party**: `_docs/THIRD_PARTY_SERVICES_COMPLETE_INVENTORY.md` (external integrations)
- **Architecture**: `_docs/ARCHITECTURE_QUICK_REFERENCE.md` (quick reference)

## Construction Domain Concepts

- **CSI MasterFormat**: Industry standard for organizing construction specs (division codes like "03" for Concrete)
- **Cost Databases**: RSMeans and similar databases for unit costs
- **Assemblies**: Pre-built groups of line items (e.g., "8-inch CMU Wall" assembly)
- **Takeoff**: Quantity extraction from construction plans
- **Value Engineering**: Cost optimization analysis
- **SRP**: Suggested Retail Price - estimation baseline for bid engine
- **Fair Rotation**: Algorithm ensuring all qualified contractors get bid opportunities

## Environment

- Node.js 20+
- pnpm package manager (v8.15.9 for Vercel compatibility)
- TypeScript 5.6+
- Prisma 5.22+
