# Kealee Platform - Pre-Construction Workflow Documentation

## Overview

The Pre-Construction (Pre-Con) workflow enables project owners to receive professional design concepts and connect with qualified contractors through a marketplace bidding system. This system generates platform revenue through design package fees and contract commissions.

---

## Workflow Phases

```
INTAKE → DESIGN → REVIEW → APPROVE → PRICE → MARKETPLACE → AWARD → CONTRACT → COMPLETE
```

### Phase Details

| Phase | Description | Owner Action | Platform Action |
|-------|-------------|--------------|-----------------|
| **INTAKE** | Project request submitted | Submit project details, pay design fee | Validate and queue for design |
| **DESIGN_IN_PROGRESS** | Design team creating concepts | Wait | Create 2-5 design concepts |
| **DESIGN_REVIEW** | Concepts ready for review | Review concepts, provide feedback | Present options |
| **DESIGN_APPROVED** | Owner selects final design | Select concept, approve | Lock selection |
| **SRP_GENERATED** | Suggested Retail Price calculated | Review pricing | Calculate estimate |
| **MARKETPLACE_READY** | Project listed for bidding | Set bidding preferences | Notify contractors |
| **BIDDING_OPEN** | Accepting contractor bids | Review bids | Collect and rank bids |
| **AWARDED** | Contractor selected | Award bid | Prepare contract |
| **CONTRACT_PENDING** | Contract preparation | Review contract | Generate documents |
| **CONTRACT_RATIFIED** | Contract signed | Sign contract | **Collect platform fee** |
| **COMPLETED** | Pre-con complete | Begin construction | Link to main project |

---

## Fee Structure

### Revenue Streams for Kealee Platform

| Fee Type | Amount | Paid By | When Collected |
|----------|--------|---------|----------------|
| **Design Package** | $199 - $999 | Project Owner | Before design starts |
| **Platform Commission** | 3.5% of contract | Contractor | At contract ratification |
| **Lead Sale** (B2B only) | Variable | Contractor | When lead purchased |

### Design Package Tiers

| Tier | Price | Includes |
|------|-------|----------|
| **BASIC** | $199 | 2 concepts, basic floor plan, material suggestions |
| **STANDARD** | $499 | 3 concepts, detailed plans, 3D renderings, cost estimate |
| **PREMIUM** | $999 | 5 concepts, full architectural drawings, permit-ready docs |

---

## Guaranteed Fee Collection Method

### Contract Commission Collection (3.5%)

The platform commission is **guaranteed** through escrow hold at contract ratification:

```
┌─────────────────────────────────────────────────────────────────┐
│                    FEE COLLECTION FLOW                          │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  1. CONTRACT SIGNED                                             │
│     └─> Contract ratified by both parties                       │
│                                                                 │
│  2. ESCROW HOLD CREATED                                         │
│     └─> Platform fee (3.5%) held from contract total            │
│     └─> Status: HOLD                                            │
│                                                                 │
│  3. FIRST MILESTONE PAYMENT                                     │
│     └─> Contractor receives payment                             │
│     └─> Platform fee deducted automatically                     │
│                                                                 │
│  4. FEE COLLECTED                                               │
│     └─> Fee transferred to Kealee platform account              │
│     └─> Status: COLLECTED                                       │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### Why This Method is Guaranteed

1. **Escrow Integration**: Fee is held in escrow system before contractor receives any payment
2. **Automatic Deduction**: No manual intervention required - system handles collection
3. **Pre-Agreed Terms**: Contractor agrees to fee during bid submission
4. **Transparent**: All parties see fee breakdown before signing

---

## Client-Facing Portal (m-project-owner)

### Dashboard Features

- **Pre-Con Pipeline Widget**: Visual pipeline showing INTAKE → DESIGN → MARKETPLACE → COMPLETE
- **Quick Stats**: Total projects, active projects, awaiting bids, completed
- **Recent Projects**: List of recent pre-con projects with status
- **Pending Fees Alert**: Notification for unpaid design package fees

### Pages

| Page | Path | Purpose |
|------|------|---------|
| Dashboard | `/dashboard` | Main dashboard with pre-con pipeline |
| Pre-Con List | `/precon` | List all pre-con projects |
| New Project | `/precon/new` | Create new pre-con project |
| Project Detail | `/precon/[id]` | View project details, designs, bids |

### What Owners CAN See

- Design package pricing and tiers
- Platform commission rate (3.5%)
- Design concepts for their project
- Contractor bids and profiles
- Project timeline and phase history

### What Owners CANNOT See

- Lead sale options (B2B feature only)
- Internal platform metrics
- Contractor cost structures
- Backend bidding algorithms

---

## API Endpoints

### Pre-Con Endpoints (`/precon`)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/precon/dashboard` | Get owner's dashboard summary |
| GET | `/precon/fee-info` | Get fee structure information |
| POST | `/precon/projects` | Create new pre-con project |
| GET | `/precon/projects` | List owner's pre-con projects |
| GET | `/precon/projects/:id` | Get project details |
| POST | `/precon/projects/:id/pay-design-fee` | Pay design package fee |
| POST | `/precon/projects/:id/select-concept` | Select a design concept |
| POST | `/precon/projects/:id/generate-srp` | Generate suggested retail price |
| POST | `/precon/projects/:id/open-marketplace` | Open project for bidding |
| POST | `/precon/projects/:id/award-bid` | Award bid to contractor |
| POST | `/precon/projects/:id/ratify-contract` | Ratify signed contract |
| GET | `/precon/projects/:id/concepts` | Get design concepts |
| GET | `/precon/projects/:id/bids` | Get contractor bids |
| GET | `/precon/projects/:id/fees` | Get project fees |

---

## Database Schema

### New Models Added

```prisma
// Pre-Con Workflow
enum PreConPhase { ... }
enum DesignPackageTier { BASIC, STANDARD, PREMIUM }
enum PlatformFeeType { DESIGN_PACKAGE, CONTRACT_COMMISSION, LEAD_SALE }
enum PlatformFeeStatus { PENDING, HOLD, COLLECTED, REFUNDED, WAIVED }

model PreConProject { ... }     // Main pre-con entity
model DesignConcept { ... }     // Design options for owner
model ContractorBid { ... }     // Bids from marketplace
model PlatformFee { ... }       // Fee tracking
model PreConPhaseHistory { ... } // Phase audit trail
model PlatformFeeConfig { ... }  // Fee configuration
```

---

## Files Created/Modified

### New Files

| File | Purpose |
|------|---------|
| `packages/database/prisma/schema.prisma` | Added PreCon models |
| `services/api/src/modules/precon/precon.service.ts` | Pre-con business logic |
| `services/api/src/modules/precon/precon.routes.ts` | API endpoints |
| `apps/m-project-owner/components/PreConPipeline.tsx` | Pipeline UI component |
| `apps/m-project-owner/app/precon/page.tsx` | Pre-con list page |
| `apps/m-project-owner/app/precon/new/page.tsx` | New project wizard |
| `apps/m-project-owner/app/precon/[id]/page.tsx` | Project detail page |
| `apps/m-project-owner/app/dashboard/page.tsx` | Updated with PreCon widget |

### Modified Files

| File | Changes |
|------|---------|
| `services/api/src/index.ts` | Added precon routes registration |

---

## Integration Points

### With Existing Systems

1. **Escrow System**: Platform fee held via EscrowAgreement
2. **Payments (Stripe)**: Design fee payment processing
3. **Contracts**: Contract generation and signing
4. **Marketplace**: Contractor notification and bidding
5. **Projects**: Link pre-con to main project after award

### Event Flow

```typescript
// Events emitted during workflow
'PRECON_PROJECT_CREATED'
'PRECON_PHASE_CHANGED'
'PRECON_DESIGN_SELECTED'
'PRECON_SRP_GENERATED'
'PRECON_BIDDING_OPENED'
'PRECON_BID_AWARDED'
'PRECON_CONTRACT_RATIFIED'
'PLATFORM_FEE_COLLECTED'
```

---

## Security Considerations

1. **Owner Authorization**: All endpoints verify owner access
2. **Fee Transparency**: Fees clearly disclosed before payment
3. **Escrow Protection**: Funds held securely until milestones
4. **Audit Trail**: Full phase history maintained
5. **Lead Sale Hidden**: B2B feature not exposed to owners

---

## Future Enhancements

1. **Design Review AI**: AI-assisted design generation
2. **Bid Scoring**: Automated contractor ranking
3. **Payment Plans**: Split design fee payments
4. **Subscription Model**: Monthly contractor marketplace access
5. **White-Label**: Custom branded pre-con portals

---

*Document Version: 1.0*
*Last Updated: January 2026*
