# Complete API Modules Inventory
## All APIs Required for Kealee Platform V10

**Date:** January 2026  
**Total API Modules:** ~50+ route modules across 10 stages  
**Single API Server:** `services/api` (Fastify) with modular route organization

---

## 📊 EXECUTIVE SUMMARY

The Kealee Platform uses a **single unified API server** (`services/api`) with **modular route organization**. Each "hub" or "stage" adds new API route modules to the same Fastify server. All APIs share:

- ✅ Same authentication middleware
- ✅ Same database (Prisma)
- ✅ Same audit/event logging
- ✅ Same error handling
- ✅ Same rate limiting
- ✅ Same API structure

**Architecture:** Monolithic API server with modular routes (not microservices)

---

## 🗂️ COMPLETE API MODULE BREAKDOWN BY STAGE

### **STAGE 1: OS Foundation** (Weeks 2-3)
**Base Infrastructure APIs - Foundation for everything**

| Module | Routes File | Service File | Status | Endpoints |
|--------|-------------|--------------|--------|-----------|
| **Auth** | `auth.routes.ts` | `auth.service.ts` | ✅ Complete | ~8 endpoints |
| **Users** | `user.routes.ts` | `user.service.ts` | ✅ Complete | ~10 endpoints |
| **Organizations** | `org.routes.ts` | `org.service.ts` | ✅ Complete | ~12 endpoints |
| **RBAC** | `rbac.routes.ts` | `rbac.service.ts` | ✅ Complete | ~15 endpoints |
| **Events** | `event.routes.ts` | `event.service.ts` | ✅ Complete | ~6 endpoints |
| **Audit** | `audit.routes.ts` | `audit.service.ts` | ✅ Complete | ~5 endpoints |
| **Entitlements** | `entitlement.routes.ts` | `entitlement.service.ts` | ✅ Complete | ~8 endpoints |

**Total Stage 1:** ~64 endpoints

---

### **STAGE 2: Ops OS Core** (Weeks 4-5)
**Platform Management & Operations APIs**

| Module | Routes File | Service File | Status | Endpoints |
|--------|-------------|--------------|--------|-----------|
| **PM (Project Managers)** | `pm.routes.ts` | `pm.service.ts` | ✅ Complete | ~10 endpoints |
| **Disputes** | `dispute.routes.ts` | `dispute.service.ts` | ✅ Complete | ~12 endpoints |
| **Properties** | `property.routes.ts` | `property.service.ts` | ✅ Complete | ~8 endpoints |

**Total Stage 2:** ~30 endpoints

---

### **STAGE 3: Ops Services MVP** (Weeks 6-8)
**First Revenue Stream - PM Staffing Services**

| Module | Routes File | Service File | Status | Endpoints |
|--------|-------------|--------------|--------|-----------|
| **Billing** | `billing.routes.ts` | `billing.service.ts` | ✅ Complete | ~15 endpoints |
| **Service Requests** | *(TBD - may be in projects)* | *(TBD)* | ⏳ Pending | ~10 endpoints |
| **Service Packages** | *(TBD - may be in billing)* | *(TBD)* | ⏳ Pending | ~8 endpoints |

**Total Stage 3:** ~33 endpoints (estimated)

---

### **STAGE 4: Project Owner MVP** (Weeks 9-11)
**Project Management & Contracts**

| Module | Routes File | Service File | Status | Endpoints |
|--------|-------------|--------------|--------|-----------|
| **Projects** | `project.routes.ts` | `project.service.ts` | ✅ Complete | ~20 endpoints |
| **Readiness** | `readiness.routes.ts` | `readiness.service.ts` | ✅ Complete | ~12 endpoints |
| **Contracts** | `contract.routes.ts` | *(multiple)* | ✅ Complete | ~25 endpoints |
| **Contract Templates** | `contract-template.routes.ts` | `contract-template.service.ts` | ✅ Complete | ~10 endpoints |
| **Contract Compliance** | `contract-compliance.routes.ts` | `contract-compliance.service.ts` | ✅ Complete | ~8 endpoints |
| **Contract Security** | `contract-security.routes.ts` | `contract-security.service.ts` | ✅ Complete | ~6 endpoints |
| **Contract Dashboard** | `contract-dashboard.routes.ts` | `contract-dashboard.service.ts` | ✅ Complete | ~5 endpoints |
| **Milestones** | `milestone.routes.ts` | `milestone.service.ts` | ✅ Complete | ~15 endpoints |
| **Milestone Uploads** | `milestone-upload.routes.ts` | `milestone-upload.service.ts` | ✅ Complete | ~8 endpoints |
| **DocuSign** | `docusign.routes.ts` | `docusign.service.ts` | ✅ Complete | ~10 endpoints |
| **Handoff** | `handoff.routes.ts` | `handoff.service.ts` | ✅ Complete | ~8 endpoints |
| **Closeout** | `closeout.routes.ts` | `closeout.service.ts` | ✅ Complete | ~12 endpoints |

**Total Stage 4:** ~139 endpoints

---

### **STAGE 5: Finance & Trust MVP** (Weeks 12-14)
**Escrow & Payment Processing**

| Module | Routes File | Service File | Status | Endpoints |
|--------|-------------|--------------|--------|-----------|
| **Payments** | `payment.routes.ts` | `payment.service.ts` | ✅ Complete | ~20 endpoints |
| **Escrow** | *(TBD - may be in payments)* | *(TBD)* | ⏳ Pending | ~15 endpoints |
| **Ledger** | *(TBD - may be in payments)* | *(TBD)* | ⏳ Pending | ~12 endpoints |
| **Transactions** | *(TBD - may be in payments)* | *(TBD)* | ⏳ Pending | ~10 endpoints |

**Total Stage 5:** ~57 endpoints (estimated)

---

### **STAGE 6: Marketplace MVP** (Weeks 15-17)
**Contractor Directory & Lead Management**

| Module | Routes File | Service File | Status | Endpoints |
|--------|-------------|--------------|--------|-----------|
| **Marketplace** | `marketplace.routes.ts` | `marketplace.service.ts` | ✅ Complete | ~15 endpoints |
| **Leads** | `leads.routes.ts` | `leads.service.ts` | ✅ Complete | ~20 endpoints |
| **Quotes** | *(TBD - may be in marketplace)* | *(TBD)* | ⏳ Pending | ~12 endpoints |
| **Portfolio** | *(TBD - may be in marketplace)* | *(TBD)* | ⏳ Pending | ~10 endpoints |
| **Verification** | *(TBD - may be in marketplace)* | *(TBD)* | ⏳ Pending | ~8 endpoints |

**Total Stage 6:** ~65 endpoints (estimated)

---

### **STAGE 7: Architect Hub MVP** (Weeks 18-19)
**Design Project Management & Deliverables**

| Module | Routes File | Service File | Status | Endpoints |
|--------|-------------|--------------|--------|-----------|
| **Design Projects** | `architect/design-project.routes.ts` | `architect/design-project.service.ts` | ✅ Complete | ~12 endpoints |
| **Design Phases** | `architect/design-phase.routes.ts` | `architect/design-phase.service.ts` | ✅ Complete | ~10 endpoints |
| **Design Files** | `architect/design-file.routes.ts` | `architect/design-file.service.ts` | ✅ Complete | ~15 endpoints |
| **Deliverables** | `architect/deliverable.service.ts` | *(routes TBD)* | ⏳ Partial | ~10 endpoints |
| **Drawing Sets** | `architect/drawing-set.routes.ts` | *(service TBD)* | ⏳ Partial | ~12 endpoints |
| **BIM Models** | `architect/bim-model.routes.ts` | `architect/bim-model.service.ts` | ✅ Complete | ~10 endpoints |
| **Design Reviews** | `architect/review.routes.ts` | `architect/review.service.ts` | ✅ Complete | ~15 endpoints |
| **Collaboration** | `architect/collaboration.routes.ts` | `architect/collaboration.service.ts` | ✅ Complete | ~20 endpoints |
| **Version Control** | `architect/version-control.routes.ts` | `architect/version-control.service.ts` | ✅ Complete | ~18 endpoints |
| **Revisions** | `architect/revision.routes.ts` | `architect/revision.service.ts` | ✅ Complete | ~15 endpoints |
| **Validation** | `architect/validation.routes.ts` | `architect/validation.service.ts` | ✅ Complete | ~16 endpoints |
| **Approvals** | `architect/approval.routes.ts` | `architect/approval.service.ts` | ✅ Complete | ~13 endpoints |

**Total Stage 7:** ~176 endpoints

---

### **STAGE 7.5: Permits & Inspections Hub** (Weeks 19-20)
**Permit Applications & Inspection Management**

| Module | Routes File | Service File | Status | Endpoints |
|--------|-------------|--------------|--------|-----------|
| **Permits** | `permits/permit.routes.ts` | *(TBD)* | ⏳ Pending | ~25 endpoints |
| **Permit Documents** | `permits/permit-document.routes.ts` | *(TBD)* | ⏳ Pending | ~12 endpoints |
| **Permit Reviews** | `permits/permit-review.routes.ts` | *(TBD)* | ⏳ Pending | ~15 endpoints |
| **Permit Compliance** | `permits/permit-compliance.routes.ts` | `permits/permit-compliance.service.ts` | ✅ Complete | ~8 endpoints |
| **Inspections** | `inspections/inspection.routes.ts` | *(TBD)* | ⏳ Pending | ~20 endpoints |
| **Inspection Scheduling** | `inspections/inspection-schedule.routes.ts` | *(TBD)* | ⏳ Pending | ~10 endpoints |
| **Jurisdictions** | *(TBD - may be in os-admin)* | *(TBD)* | ⏳ Pending | ~15 endpoints |

**Total Stage 7.5:** ~105 endpoints (estimated)

---

### **STAGE 8: Engineer Hub** (Weeks 21-22)
**Engineering Deliverables & PE Stamps**

| Module | Routes File | Service File | Status | Endpoints |
|--------|-------------|--------------|--------|-----------|
| **Engineering Projects** | `engineer/engineering-project.routes.ts` | *(TBD)* | ⏳ Pending | ~12 endpoints |
| **Engineering Deliverables** | `engineer/engineering-deliverable.routes.ts` | *(TBD)* | ⏳ Pending | ~10 endpoints |
| **Calculations** | `engineer/calculation.routes.ts` | *(TBD)* | ⏳ Pending | ~12 endpoints |
| **PE Stamps** | `engineer/pe-stamp.routes.ts` | *(TBD)* | ⏳ Pending | ~15 endpoints |
| **Engineering Reviews** | `engineer/engineering-review.routes.ts` | *(TBD)* | ⏳ Pending | ~12 endpoints |
| **Engineering Approvals** | `engineer/engineering-approval.routes.ts` | *(TBD)* | ⏳ Pending | ~10 endpoints |

**Total Stage 8:** ~71 endpoints (estimated)

---

### **STAGE 9: Automation & ML Hub** (Weeks 23-27)
**AI/ML Features & Automation**

| Module | Routes File | Service File | Status | Endpoints |
|--------|-------------|--------------|--------|-----------|
| **ML Recommendations** | `ml/recommendations.routes.ts` | *(TBD)* | ⏳ Pending | ~8 endpoints |
| **Event Detection** | `ml/event-detection.routes.ts` | *(TBD)* | ⏳ Pending | ~10 endpoints |
| **Performance Scoring** | `ml/performance-scoring.routes.ts` | *(TBD)* | ⏳ Pending | ~8 endpoints |
| **Automation Rules** | `ml/automation-rules.routes.ts` | *(TBD)* | ⏳ Pending | ~12 endpoints |
| **ML Training** | `ml/training.routes.ts` | *(TBD)* | ⏳ Pending | ~6 endpoints |

**Total Stage 9:** ~44 endpoints (estimated)

---

## 📈 SUMMARY STATISTICS

### **By Status**

| Status | Count | Percentage |
|--------|-------|------------|
| ✅ **Complete** | ~30 modules | ~60% |
| ⏳ **Pending** | ~20 modules | ~40% |
| **Total Modules** | ~50 modules | 100% |

### **By Endpoint Count**

| Stage | Estimated Endpoints | Status |
|-------|---------------------|--------|
| Stage 1 (Foundation) | ~64 | ✅ Complete |
| Stage 2 (Ops OS) | ~30 | ✅ Complete |
| Stage 3 (Ops Services) | ~33 | ⏳ Partial |
| Stage 4 (Project Owner) | ~139 | ✅ Complete |
| Stage 5 (Finance & Trust) | ~57 | ⏳ Partial |
| Stage 6 (Marketplace) | ~65 | ⏳ Partial |
| Stage 7 (Architect) | ~176 | ✅ Complete |
| Stage 7.5 (Permits) | ~105 | ⏳ Pending |
| Stage 8 (Engineer) | ~71 | ⏳ Pending |
| Stage 9 (Automation/ML) | ~44 | ⏳ Pending |
| **TOTAL** | **~784 endpoints** | **~60% Complete** |

---

## 🏗️ ARCHITECTURE NOTES

### **Single API Server Pattern**

All APIs are in **one Fastify server** (`services/api`) with:
- Modular route organization by feature/hub
- Shared middleware (auth, RBAC, audit, rate limiting)
- Shared database (Prisma)
- Shared error handling
- Shared validation (Zod schemas)

### **Route Organization**

```
services/api/src/modules/
├── auth/              # Stage 1
├── users/             # Stage 1
├── orgs/              # Stage 1
├── rbac/              # Stage 1
├── events/            # Stage 1
├── audit/             # Stage 1
├── pm/                # Stage 2
├── disputes/          # Stage 2
├── properties/        # Stage 2
├── billing/           # Stage 3
├── projects/          # Stage 4
├── contracts/         # Stage 4
├── milestones/        # Stage 4
├── payments/          # Stage 5
├── marketplace/       # Stage 6
├── architect/         # Stage 7 (11 modules)
├── permits/           # Stage 7.5
├── inspections/       # Stage 7.5
├── engineer/          # Stage 8
└── ml/                # Stage 9
```

### **API Registration Pattern**

All routes registered in `services/api/src/index.ts`:

```typescript
await fastify.register(authRoutes, { prefix: '/auth' })
await fastify.register(projectRoutes, { prefix: '/projects' })
await fastify.register(architectRoutes, { prefix: '/architect' })
// etc.
```

---

## 🎯 IMPLEMENTATION PRIORITY

### **High Priority (Revenue-Generating)**
1. ✅ Stage 3: Ops Services (FIRST REVENUE)
2. ✅ Stage 4: Project Owner (Platform fees)
3. ⏳ Stage 5: Finance & Trust (Escrow)
4. ⏳ Stage 6: Marketplace (Subscriptions)
5. ✅ Stage 7: Architect Hub (Platform fees)
6. ⏳ Stage 7.5: Permits & Inspections (HIGHEST REVENUE: $800K-$1.2M)
7. ⏳ Stage 8: Engineer Hub (Platform fees)

### **Lower Priority (Enhancement)**
8. ⏳ Stage 9: Automation & ML (Future enhancement)

---

## 📝 NOTES

- **Not Microservices:** All APIs in one server for simplicity
- **Shared Infrastructure:** All modules share auth, database, audit
- **Modular Design:** Easy to extract modules later if needed
- **Type Safety:** All APIs use TypeScript + Zod validation
- **Consistent Patterns:** Same structure across all modules

---

**Last Updated:** January 2026  
**Next Review:** After Stage 7.5 completion
