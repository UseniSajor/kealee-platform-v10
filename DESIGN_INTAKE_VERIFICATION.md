# Design Concept Intake - Operational Verification ✅

**Status**: PRODUCTION READY

## Tier Configuration

### Basic (Tier 1) - $349
- 3 photorealistic renders (1920×1080)
- Design concept summary (style, palette, features)
- Floor plan / layout direction
- Permit + zoning brief
- Estimated permit fees & timeline
- BOM with cost comparison
- PDF design report
- 1 revision

### Premium (Tier 2) - $699
- 6 enhanced renders (2560×1440)
- 2D architectural floor plan with MEP layers
- 60-second AI transformation video
- Permit + zoning deep-dive (variance, HOA flags)
- Editable BOM with market cost ranges
- 3 revisions
- 30-day email support

### Premium+ (Tier 3) - $1,299
- 12 photorealistic renders (4K)
- Multi-layer 3D floor plan + CAD (DWG/DXF)
- 4 video formats (60s, 30s, 15s, 10s) in HD/4K
- Permit + zoning entitlement notes
- Structural/PE requirement flags
- 15-minute expert consultation call
- 3 revisions
- 90-day email support

## Service Families (All Operational)

✅ Kitchen / Kitchen Remodel
✅ Bathroom / Bathroom Remodel
✅ Garden Concept
✅ Addition / Addition Expansion
✅ Exterior / Facade / Deck
✅ Whole House / Whole Home
✅ Design Only / Design Services
✅ Building / General Remodel

## Critical Rule (Always Enforced)

**Permit and zoning are included in EVERY tier** - Basic, Premium, Premium+

- Never remove from marketing copy
- Never remove from checkout
- Never remove from portal deliverables
- Depth increases by tier (brief → deep-dive → full package)

## Code References

| Component | Path | Status |
|-----------|------|--------|
| **Tier Definitions** | `packages/core-rules/src/concept-package-deliverables.ts` | ✅ Active |
| **Service Config** | `apps/web-main/lib/services-config.ts` | ✅ Active |
| **Intake Form** | `apps/web-main/app/intake/[projectPath]/page.tsx` | ✅ Active |
| **Concept Page** | `apps/web-main/app/intake/concept/page.tsx` | ✅ Active |
| **Checkout** | `apps/web-main/app/checkout/page.tsx` | ✅ Active |
| **Portal Deliverables** | `apps/web-main/app/deliverables/[intakeId]/page.tsx` | ✅ Active |

## Route Flow (Verified)

1. **User Selects Service** → `/kitchen`, `/addition`, `/garden`, etc.
2. **Intake Form** → `/intake/kitchen_remodel/` (collects project details)
3. **Tier Selection** → Radio buttons: Basic / Premium / Premium+
4. **Checkout** → Stripe payment (Stripe webhook → ProjectOutput)
5. **Concept Generation** → `concept/generate` handler (AI renders + permit scope)
6. **Portal Access** → `/deliverables/[intakeId]` (lifetime portal for customer)

## Intake Pricing Tiers (Verified)

```typescript
// From services-config.ts
tier1(price: number)    // Basic
tier2(price: number)    // Premium
tier3(price: number)    // Premium+
```

## Testing Checklist

- [x] All service families configured
- [x] Three tiers defined with pricing
- [x] Permit/zoning in all tiers
- [x] Tier labels render correctly (Basic, Premium, Premium+)
- [x] Checkout flow accepts tier selection
- [x] Portal displays tier-appropriate deliverables
- [x] Concept generation respects tier (3 vs 6 vs 12 renders)
- [x] Permit scope brief included in all tiers

## Next Steps (Optional Enhancements)

- Add tier comparison table to service pages
- Implement tier upgrade flow (Basic → Premium, etc)
- Add "what's included" modal per tier
- Track tier distribution analytics
- A/B test tier positioning

---

**Last Verified**: 2026-07-04
**Source of Truth**: `packages/core-rules/src/concept-package-deliverables.ts`
**Status**: ✅ Production Ready
