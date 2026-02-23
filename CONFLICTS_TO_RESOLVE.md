# Merge Conflict Resolution Report

**Local (WSL):** `c7572a6` — 2026-02-23 13:24 — "Complete bid pipeline implementation (all 3 phases)"
**Remote (Windows):** `415fcc04` — 2026-02-23 13:34 — "Add bid pipeline Phase 3 - AI tools, analysis, alerts, and document management"
**Conflicted files:** 2 (`schema.prisma`, `index.ts`)

---

## AUTOMATIC — No approval needed (unique to one side)

| Source | Item | Action |
|--------|------|--------|
| Windows | 7 API files: bid.service.ts (734 lines), bid.routes.ts (252), bid-automation.routes.ts, bid-analysis.service.ts, bid-document.service.ts, bid-ingest.service.ts, bid-notify.service.ts | ADD |
| Windows | 4 AI chat tools: analyze-bid.ts, get-bid-alerts.ts, get-bid-pipeline.ts, search-bids.ts | ADD |
| Windows | 2 worker jobs: bid-daily-alerts.job.ts, bid-urgent-check.job.ts | ADD |
| Windows | SOP engine: sop.routes.ts, sop.service.ts, seed-51-units.ts + frontend pages | ADD |
| Windows | Schema models (no conflict): ProjectMembership, BidScanLog, BidChecklistItem, BidDocument, BidSubRequest, SOP models (6) | ADD |
| Windows | Enums (no conflict): BidPipelineStatus, BidPriority, BidChecklistStatus, BidDocumentType, BidSubRequestStatus, SOP enums (3) | ADD |
| WSL | bids-rag.service.ts (144 lines), bids.types.ts (45), n8n-bidscanner.ts | ADD |
| WSL | Schema models (no conflict): OpportunityBid, OpportunityBidDocument, OpportunityBidChecklist, SubcontractorQuote, BidSimilarity | ADD |
| WSL | Enum (no conflict): BidStatus | ADD |
| WSL | Docs: BID_PIPELINE_COMPLETE.md, N8N_WORKFLOW_GUIDE.md, enable_pgvector.sql | ADD |

---

## CONFLICTS — Approval required

### Conflict #1: `BidSource` enum

Both sides define this enum with different values. Neither can be dropped.

| Value | WSL | Windows | Used by |
|-------|:---:|:-------:|---------|
| BUILDINGCONNECTED | Y | - | WSL code |
| BUILDING_CONNECTED | - | Y | Windows code |
| EMARYLAND_MARKETPLACE | Y | - | WSL code |
| EMMA | - | Y | Windows code |
| OPENGOV | Y | Y | Both |
| SHA_MDOT | Y | Y | Both |
| DIRECT_EMAIL | Y | - | WSL code |
| DIRECT_INVITE | - | Y | Windows code |
| NETWORKING | Y | - | WSL code |
| MANUAL | - | Y | Windows code |
| OTHER | Y | - | WSL code |

**Recommendation:** MERGE all 11 values into one superset. Zero breakage for either side.

---

### Conflict #2: `BidActivity` model

Both define a model named `BidActivity` that maps to the same table `bid_activities`, but they relate to different parent models.

```
WSL version (7 fields):                    Windows version (6 fields):
─────────────────────────                  ─────────────────────────
id       String @default(cuid())           id       String @default(uuid())
bidId    String                            bidId    String
type     String                            action   String
description String                         actor    String?
metadata Json?                             details  Json?
createdBy String?                          createdAt DateTime
createdAt DateTime

Relates to: OpportunityBid                 Relates to: BidOpportunity
Table map:  "bid_activities"               Table map:  "bid_activities"
```

**Problem:** Same name + same table = Prisma error. They relate to different parent models so they cannot be merged into one.

**Recommendation:** RENAME WSL version → `OpportunityBidActivity` mapping to `opportunity_bid_activities`. Keep Windows version as `BidActivity`. Then update WSL's `bids.service.ts` to use `prisma.opportunityBidActivity`.

---

### Conflict #3: `BidEmbedding` model

Both define `BidEmbedding` mapping to `bid_embeddings`, but with fundamentally different architectures.

```
WSL version (5 fields):                    Windows version (8 fields):
─────────────────────────                  ─────────────────────────
id        String @default(cuid())          id         String @default(uuid())
bidId     String @unique                   bidId      String
embedding Unsupported("vector(1536)")      documentId String?
metadata  Json                             content    String @db.Text
createdAt DateTime                         embedding  Float[]
                                           metadata   Json?
                                           chunkIndex Int @default(0)
                                           createdAt  DateTime

Purpose: 1 embedding per bid,             Purpose: Chunked document embeddings,
pgvector cosine similarity search          multiple chunks per bid for RAG search
```

**Problem:** Same name + same table, completely different designs.

**Recommendation:** KEEP BOTH as separate models. Rename WSL → `OpportunityBidEmbedding` mapping to `opportunity_bid_embeddings`. Then update WSL's `bids-rag.service.ts` to reference the renamed table. Both serve different use cases.

---

### Conflict #4: `services/api/src/index.ts`

Entire file is one conflict block. Both add route registrations to the same base file.

| Aspect | WSL (HEAD) | Windows (origin) |
|--------|-----------|------------------|
| Lines | 975 | 982 |
| New route blocks added | 1 block (opportunityBidsRoutes at `/api/bids`) | 2 blocks (bidRoutes at `/bids`, bidAutomationRoutes at `/bids/automation`, sopRoutes at `/sop`) |
| Other changes | None beyond bid routes | SOP routes, multifamily service, pm.routes changes |

**Recommendation:** Use Windows version as base (it has 3 new route blocks + other file changes), then ADD the WSL `opportunityBidsRoutes` block alongside.

---

## Summary Table

| # | Conflict | Recommendation | Impact |
|---|----------|---------------|--------|
| 1 | BidSource enum | Merge superset (11 values) | Zero breakage |
| 2 | BidActivity model | Rename WSL → OpportunityBidActivity | Update 1 file (bids.service.ts) |
| 3 | BidEmbedding model | Rename WSL → OpportunityBidEmbedding | Update 1 file (bids-rag.service.ts) |
| 4 | index.ts | Windows base + add WSL route block | Zero breakage |

**After resolving:** `prisma generate` + `tsc` build to verify.
