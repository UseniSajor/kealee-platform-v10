# Kealee Repository Consolidation Analysis

**Date:** 2026-02-23
**Target (main):** `/mnt/c/Kealee-Platform v10` (289 models, 173 enums, 2,906 .ts files)

---

## Repository Inventory

### HIGH PRIORITY (Code repos)

| # | Repo | Type | Git? | Models | Enums | .ts Files | Last Activity |
|---|------|------|------|--------|-------|-----------|---------------|
| 0 | **Kealee-Platform v10 (MAIN)** | pnpm monorepo | Yes | **289** | **173** | **2,906** | Feb 23, 2026 |
| 1 | kealee-platform v3 | pnpm monorepo | Yes | 66 | 55 | 238 | Jan 11, 2026 |
| 2 | dev/kealee-platform | Express API | No | 20 | 1 | 23 | Dec 12, 2025 |
| 3 | kealee-pm-staffing-mvp | Next.js + Supabase | No | 0 (SQL) | 0 | 38 | N/A |
| 4 | kealee-platform-v2 | Express + React | Yes | 3 | 0 | 63 | Dec 29, 2025 |
| 5 | kealee-FINAL | React SPA (CRA) | No | 0 | 0 | 71 (.tsx) | N/A |
| 6 | kealee-EXACT | React SPA (CRA) | No | 0 | 0 | 140 (.tsx, has nested dup) | N/A |

### MEDIUM PRIORITY (Docs & marketing)

| # | Repo | Type | Files | Notable Content |
|---|------|------|-------|-----------------|
| 7 | Kealee-Platform-v10-Marketing | Docs only | 3 | GTM strategy, marketing channels |
| 8 | Kealee-platform-v10 external docs | Docs only | 8 | Economics, CAC, profit margins, handoff |
| 9 | Kealee Dev/kealee-website | Next.js app | 39 | Lead intake site, 6 models, intake forms |
| 10 | Kealee Pm + Staffing Module | Docs only | 2 | Module design & revenue model |

---

## Schema Conflict Analysis

### Repo 1: kealee-platform v3 (66 models) — HIGHEST OVERLAP

**29 conflicting model names** (exist in both v3 and MAIN):
```
AuditLog          Bid               ChangeOrder       DesignProject
Dispute           Document          EscrowHold        EscrowTransaction
Estimate          Inspection        Invoice           MarketplaceProfile
Milestone         ModuleEntitlement OrgMember         Permission
Project           ProjectMembership ProjectPhase      Property
Quote             RFI               Role              RolePermission
ScheduleItem      Selection         SiteVisit         Submittal
User
```

**37 unique models** (not in MAIN — merge candidates):
```
AccountantExport      AutomationRule        BidPackage        Bill
Budget                ClientUpdate          CloseoutItem      ContractorApproval
ContractorPerformanceScore  CostCode        Delivery          DesignAsset
DesignHubUsage        DesignIteration       DesignMessage     DesignRequest
DesignVersion         Escrow                EscrowRelease     EventMonitor
HandoffPackage        IntegrationConnection IntegrationSyncLog  LookaheadItem
MLFeedbackLabel       MLRecommendation      MediaAsset        Organization
PermitQueue           ProjectEvent          PurchaseOrder     RFQ
Return                SubAssignment         SupplierProfile   VerificationQueue
WarrantyCase
```

**13 conflicting enums** | **42 unique enums**

NOTE: v3 uses `Organization` while MAIN uses `Org` — different naming for same concept.

### Repo 2: dev/kealee-platform (20 models)

**10 conflicting models:**
```
Contractor  DepositRequest  Document  Message  Milestone
Notification  Payment  Project  Receipt  User
```

**10 unique models** (merge candidates):
```
Escrow  Lender  MilestonePhoto  ProjectItem  ProjectPhoto
Review  RoomScan  SubscriptionTier  Transaction  UserSubscription
```

### Repo 9: kealee-website (6 models)

**1 conflicting model:** `Lead` (MAIN has Lead in marketplace module)
**1 conflicting enum:** `LeadStatus`

**5 unique models:** `Admin`, `AnalyticsEvent`, `EmailLog`, `Note`, `Tag`
**3 unique enums:** `AdminRole`, `EmailStatus`, `Priority`

### Repo 4: kealee-platform-v2 (3 models)

**3 conflicting models:** `Contractor`, `Project`, `User`
**0 unique models** — fully subsumed by MAIN. Nothing to merge.

---

## Unique Code Assets Worth Evaluating

### Apps with no v10 equivalent (from v3)
| v3 App | Potential v10 Mapping |
|--------|----------------------|
| `design-hub` | Could become `m-design` mini-app |
| `engineer-hub` | v10 has `m-engineer` already |
| `homeowner-hub` | Could become `m-homeowner` mini-app |
| `marketing` | v10 has `web` app |
| `web` | v10 has `web` app |

### Portal components (from kealee-FINAL)
- `contractor` portal — no dedicated contractor portal in v10
- `developer` portal — no developer portal in v10
- `ml` portal — no ML portal in v10
(Note: These are CRA-based React prototypes, likely outdated)

### Unique code from kealee-website
- `IntakeForm.tsx`, `IntakeModal.tsx` — lead intake components
- `lib/email.ts` — email sending utility
- `lib/storage.ts` — file storage utility
- `prisma/seed.js` — lead database seed

### Supabase migrations (from kealee-pm-staffing-mvp)
9 SQL migration files covering: base schema, suppliers, AI foundation, auth, invoicing, partner workflows. These are Supabase-native (not Prisma) but contain domain logic.

---

## Documentation Inventory (to consolidate into `_docs/`)

| Source | Files | Format |
|--------|-------|--------|
| v10-Marketing | 3 | .md, .pdf, .docx |
| v10 external docs | 8 | .pdf, .docx, .xlsx, .md |
| PM + Staffing Module | 2 | .docx, .md |
| kealee-website | 7 | .md, .pdf |
| dev/kealee-platform Docs/ | 5 | .pdf (financial projections, execution plan, TAM analysis) |
| **Total** | **25** | |

---

## Recommendations

### IMMEDIATE ACTIONS (Safe, no conflicts)

1. **Archive docs** — Copy all 25 business/strategy docs into `_docs/external/` in main repo
2. **Archive kealee-platform-v2** — Fully subsumed, zero unique models
3. **Archive kealee-FINAL / kealee-EXACT** — CRA prototypes with no backend, likely obsolete
4. **Archive PM+Staffing SQL** — Copy Supabase migrations to `_docs/reference/pm-staffing-sql/` for reference

### REQUIRES FIELD-BY-FIELD REVIEW (Conflicts)

5. **v3's 29 conflicting models** — Need to compare field counts/features vs MAIN's versions. MAIN is newer and likely more complete, but v3 may have fields that were dropped during the v3→v10 migration.
6. **v3's 37 unique models** — Evaluate which represent features MAIN should have (e.g., `PurchaseOrder`, `Bill`, `CostCode`, `LookaheadItem` are common construction PM features).
7. **dev/kealee-platform's 10 unique models** — `Lender`, `RoomScan`, `MilestonePhoto` may add value.
8. **kealee-website's Lead conflict** — Compare fields; website's Lead model is for marketing intake, MAIN's is for marketplace leads.

### LOW PRIORITY (Nice to have)

9. **v3 app code** — `design-hub` and `homeowner-hub` could be ported but would need full rewrite for v10 architecture.
10. **kealee-FINAL portals** — Prototype UI patterns for contractor/developer/ML portals (reference only).
11. **kealee-website intake components** — Could be useful for v10's `web` app.

---

## Summary

| Category | Count |
|----------|-------|
| Repos scanned | 11 |
| Repos with code | 7 |
| Repos with Prisma schemas | 4 |
| Total unique models across all repos (not in MAIN) | ~52 |
| Conflicting models requiring review | ~43 |
| Repos fully subsumed (safe to archive) | 3 (v2, FINAL, EXACT) |
| Documentation files to consolidate | 25 |
