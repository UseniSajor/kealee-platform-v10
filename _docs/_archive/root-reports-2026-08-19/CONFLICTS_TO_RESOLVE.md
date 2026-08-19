# Consolidation Conflicts — Decisions Required

**See also:** CONSOLIDATION_ANALYSIS.md for full inventory

---

## SAFE ACTIONS (No conflicts — will execute automatically)

| # | Action | Details |
|---|--------|---------|
| A1 | Archive docs to `_docs/external/` | 25 business docs from 5 repos |
| A2 | Archive kealee-platform-v2 | 0 unique models, fully subsumed |
| A3 | Archive kealee-FINAL | CRA prototype, no backend |
| A4 | Archive kealee-EXACT | CRA prototype, nested duplicate |
| A5 | Archive PM+Staffing SQL | 9 Supabase migrations as reference |

---

## CONFLICTS REQUIRING DECISION

### Conflict #1: v3's 37 unique Prisma models

These models exist in v3 but NOT in MAIN. Should we add them?

**High-value candidates** (common construction PM features):
| Model | Purpose | Recommendation |
|-------|---------|---------------|
| `PurchaseOrder` | Track material/equipment purchases | ADD — standard PM feature |
| `Bill` | Vendor billing | ADD — pairs with PurchaseOrder |
| `CostCode` | Cost categorization (CSI codes) | ADD — essential for estimating |
| `LookaheadItem` | Short-term schedule planning | ADD — common PM tool |
| `Budget` | Project budgets | SKIP — MAIN has BudgetEntry/BudgetLine |
| `CloseoutItem` | Project closeout tracking | ADD — MAIN has closeout routes but no model |
| `RFQ` | Request for Quotation | ADD — complements BidOpportunity |
| `Delivery` | Material delivery tracking | ADD — useful for ops |
| `HandoffPackage` | Project handoff bundles | SKIP — MAIN has handoff module |

**Lower-value candidates** (v3-specific or superseded):
| Model | Purpose | Recommendation |
|-------|---------|---------------|
| `Organization` | Org model | SKIP — MAIN uses `Org` |
| `Escrow` / `EscrowRelease` | Simplified escrow | SKIP — MAIN has richer escrow models |
| `DesignAsset/Iteration/Message/Request/Version` | Design hub | SKIP — MAIN has full architect module |
| `MLFeedbackLabel` / `MLRecommendation` | ML features | SKIP — experimental, not in v10 roadmap |
| `AccountantExport` | Export records | SKIP — niche feature |
| `AutomationRule` | Automation config | SKIP — MAIN has workflow engine |
| `BidPackage` | Bid packaging | SKIP — MAIN has BidOpportunity pipeline |
| `ContractorApproval/PerformanceScore` | Contractor mgmt | SKIP — MAIN has ContractorScore/Review |
| `EventMonitor` | Event tracking | SKIP — MAIN has event bus |
| `IntegrationConnection/SyncLog` | Integration tracking | SKIP — MAIN has IntegrationCredential |
| `MediaAsset` | File storage | SKIP — MAIN has FileUpload |
| `PermitQueue` | Permit queueing | SKIP — MAIN has full permit module |
| `SubAssignment` | Sub assignments | SKIP — MAIN has BidSubRequest |
| `SupplierProfile` | Supplier directory | SKIP — could revisit later |
| `VerificationQueue` | Verification flow | SKIP — niche |
| `WarrantyCase` | Warranty tracking | SKIP — MAIN has Warranty/WarrantyClaim |
| `ClientUpdate` | Client notifications | SKIP — MAIN has notification system |
| `DesignHubUsage` | Analytics | SKIP — v3-specific |
| `ProjectEvent` | Project events | SKIP — MAIN has ActivityLog |
| `Return` | Material returns | SKIP — niche |

**Recommendation:** ADD 7 high-value models (`PurchaseOrder`, `Bill`, `CostCode`, `LookaheadItem`, `CloseoutItem`, `RFQ`, `Delivery`). SKIP the rest.

---

### Conflict #2: v3's 29 overlapping models — field comparison needed?

These 29 models exist in BOTH v3 and MAIN. MAIN's versions are:
- **Newer** (Feb 2026 vs Jan 2026)
- **Part of a larger, actively developed schema** (289 models)
- **Referenced by 2,906+ TypeScript files**

v3's versions are:
- **Older** (Jan 2026)
- **Part of a smaller, inactive schema** (66 models)
- **Not actively maintained**

**Recommendation:** KEEP MAIN versions for all 29. The v10 schema has been through multiple enhancement rounds and is the canonical source. If any v3 fields were lost in the v3→v10 migration, they can be reviewed later from the archived v3 code.

---

### Conflict #3: dev/kealee-platform's 10 unique models

| Model | Purpose | Recommendation |
|-------|---------|---------------|
| `Lender` | Lender/financing tracking | SKIP — not in v10 roadmap currently |
| `RoomScan` | Room scanning/measurement | SKIP — IoT/scanning feature, not current |
| `MilestonePhoto` | Photos attached to milestones | SKIP — MAIN has Photo + Evidence models |
| `ProjectItem` | Line items in project | SKIP — MAIN has EstimateLineItem |
| `ProjectPhoto` | Project-level photos | SKIP — MAIN has Photo model |
| `Review` | Reviews | SKIP — MAIN has ContractorReview |
| `SubscriptionTier` | Subscription levels | SKIP — MAIN has PMServiceSubscription |
| `Transaction` | Financial transactions | SKIP — MAIN has EscrowTransaction + Payment |
| `UserSubscription` | User-level subscriptions | SKIP — MAIN has subscription module |
| `Escrow` | Simple escrow | SKIP — MAIN has EscrowAgreement + full module |

**Recommendation:** SKIP ALL — every concept is already covered by MAIN's richer models. This repo (Dec 2025, 20 models) is a prototype that was superseded.

---

### Conflict #4: kealee-website's Lead model overlap

**MAIN's Lead model:** Part of marketplace module, used for development/GC/permit service leads. Rich model with many lead types.

**Website's Lead model:** Marketing intake form leads — has fields: `name`, `email`, `phone`, `company`, `projectType`, `budget`, `timeline`, `message`, `source`, `status`, `priority`, plus relations to `Note`, `Tag`.

**Recommendation:** SKIP schema merge — different databases (website uses its own DB). But ADD the website's `IntakeForm.tsx` and `IntakeModal.tsx` components to v10's `apps/web/` if a marketing intake flow is needed later. Archive for reference.

---

### Conflict #5: v3's 42 unique enums

Same logic as models — v3 enums serve v3 models. If we add the 7 high-value models from Conflict #1, we'll need their associated enums.

**Recommendation:** ADD only enums needed by the 7 approved models. SKIP the rest.

---

## Decision Summary

| # | Conflict | Recommendation | Impact |
|---|----------|---------------|--------|
| 1 | v3's 37 unique models | ADD 7 high-value, SKIP 30 | +7 models to schema |
| 2 | v3's 29 overlapping models | KEEP MAIN versions | No change |
| 3 | dev's 10 unique models | SKIP ALL (superseded) | No change |
| 4 | website's Lead overlap | SKIP (different DB) | No change |
| 5 | v3's 42 unique enums | ADD only what's needed for #1 | +~5 enums |

---

## How to respond

Reply with:
- **`auto`** — Accept all recommendations above
- **`manual`** — Walk through each conflict interactively
- **Conflict numbers** (e.g., `1,4`) — Review specific conflicts
- **Modifications** (e.g., "add Lender model from #3", "skip all from #1")
