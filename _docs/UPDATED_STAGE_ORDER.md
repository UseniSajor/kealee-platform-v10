# UPDATED STAGE ORDER WITH PERMITS & INSPECTIONS HUB

## NEW 10-STAGE BUILD PLAN (27 Weeks)

```
WEEK 1: Stage 0 - Design Review
└─ Review all designs, approve

WEEKS 2-3: Stage 1 - OS Foundation 🏗️
└─ Auth, orgs, RBAC, events, audit, API, workers

WEEKS 4-5: Stage 2 - Ops OS Core 🎛️
└─ Admin console, PM queues, disputes, automation governance

WEEKS 6-8: Stage 3 - Ops Services MVP 💰 FIRST REVENUE!
└─ kealee-pm-staffing ($1.9M-$2.2M Year 1)

WEEKS 9-11: Stage 4 - Project Owner MVP 💰
└─ Projects, readiness, contracts, milestones (3% platform fees)

WEEKS 12-14: Stage 5 - Finance & Trust MVP 💰
└─ Escrow, ledger, releases, Stripe integration

WEEKS 15-17: Stage 6 - Marketplace MVP 💰
└─ Contractor directory, leads, verification ($49-399/mo + lead fees)

WEEKS 18-19: Stage 7 - Architect MVP 💰
└─ Design deliverables, reviews, approvals (3% platform fees)

WEEKS 19-20: Stage 7.5 - Permits & Inspections MVP 💰 NEW!
└─ Permit applications, plan review, inspections
   Revenue: Jurisdiction fees ($500-2K/mo) + Expedited services + Document prep
   Year 1 Target: $800K-$1.2M

WEEKS 21-22: Stage 8 - Engineer MVP 💰
└─ Engineering deliverables, PE stamps, approvals (3% platform fees)

WEEKS 23-27: Stage 9 - Automation & ML
└─ Event detection, recommendations, performance scoring

RESULT: 7 REVENUE STREAMS, FULLY OPERATIONAL PLATFORM!
```

---

## UPDATED REVENUE MODEL (7 PROFIT CENTERS)

### **Year 1 Total Revenue: $3.4M - $5.2M**

```
Revenue Stream #1: Ops Services (kealee-pm-staffing)
├─ Packages A-D: $1,750-$16,500/month
├─ Year 1: $1.9M-$2.2M
└─ Gross margin: ~48%

Revenue Stream #2: Project Owner Platform Fees
├─ 3% on project value
├─ Year 1: $200K-$400K
└─ Example: $150K project = $4,500

Revenue Stream #3: Escrow & Transaction Fees
├─ Included in platform fees + wire fees
├─ Year 1: $50K-$100K
└─ Future: Interest on escrowed funds

Revenue Stream #4: Marketplace
├─ Subscriptions: $49-$399/month
├─ Lead fees: $15-$50 per lead
├─ Year 1: $400K-$1.1M
└─ Target: 500 contractors

Revenue Stream #5: Architect Platform Fees
├─ 3% on design contracts
├─ Year 1: $50K-$150K
└─ Example: $25K contract = $750

Revenue Stream #6: Permits & Inspections ⭐ NEW!
├─ Jurisdiction licensing: $500-$2,000/month per jurisdiction
├─ Expedited processing: 15-25% of permit cost
├─ Document prep: $150-$500 per submittal
├─ Integration fees: $50-$200/month per contractor
├─ Year 1: $800K-$1.2M
└─ Target: 20 jurisdictions + 150 expedited permits

Revenue Stream #7: Engineer Platform Fees
├─ 3% on engineering contracts
├─ Year 1: $30K-$100K
└─ Example: $15K contract = $450

TOTAL YEAR 1 REVENUE: $3.4M - $5.2M
```

---

## WHY PERMITS & INSPECTIONS IS CRITICAL

### **Problem It Solves**

Permitting is THE biggest pain point in construction:
- Average delay: 2-4 weeks (sometimes months)
- Manual, paper-based processes in most jurisdictions
- No visibility into status
- Costly mistakes in applications
- Inspection scheduling chaos

### **Market Opportunity**

- **Jurisdictions:** 35,000+ building departments in US, mostly using legacy systems or paper
- **Demand:** Every construction project requires permits
- **Willingness to pay:** Contractors will pay premium for speed
- **Recurring revenue:** Jurisdiction subscriptions = predictable income

### **Competitive Advantage**

Integration with Kealee platform creates seamless workflow:
1. Owner creates project
2. Architect/Engineer completes design
3. **Permits submitted directly from platform**
4. Automatic tracking in project timeline
5. **Cannot release escrow if permits expired**
6. **Cannot proceed to next milestone without inspection pass**
7. Inspections automatically linked to milestones

**This integration is the moat.** Standalone permit software exists, but none integrate with escrow + project management + design workflows.

---

## FOLDER STRUCTURE UPDATE

```
apps/
├── os-admin/              # Ops OS Core
├── m-ops-services/        # Profit Center #1
├── m-project-owner/       # Profit Center #2
├── m-finance-trust/       # Profit Center #3
├── m-marketplace/         # Profit Center #4
├── m-architect/           # Profit Center #5
├── m-permits-inspections/ # Profit Center #6 ⭐ NEW!
└── m-engineer/            # Profit Center #7
```

---

## UPDATED PRISMA SCHEMA ADDITIONS

Add to `packages/database/prisma/schema.prisma`:

- Jurisdiction model
- JurisdictionStaff model
- Permit model (with 15+ fields)
- PermitDocument model
- PermitReview model
- ReviewComment model
- PermitCorrection model
- Inspection model
- InspectionPhoto model
- InspectionChecklistItem model
- InspectionCorrection model
- PermitTemplate model
- PermitEvent model

**Total new models:** 13  
**Total schema size:** 3500+ lines (was 3000)

---

## CURSOR PROMPTS ADDITION

**New file:** `06.5_CURSOR_PROMPTS_PERMITS_INSPECTIONS.md`

Contains ~40 prompts:
- Database models (5 prompts)
- API endpoints (10 prompts)
- Permit application UI (10 prompts)
- Inspection scheduling UI (8 prompts)
- Plan review interface (7 prompts)

---

**END OF UPDATED STAGE ORDER**

The Permits & Inspections hub adds significant value and revenue to the platform while solving a critical construction pain point.

