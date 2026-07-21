# ADR-007: Housing Act Legislative Alignment

**Status:** Accepted
**Date:** 2026-03-09
**Context:** Kealee Platform features align with Rebuilding America's Housing Act (Sections 201-211)

## Decision

Maintain an explicit mapping between platform features and legislative provisions in `packages/shared/src/housing-act-alignment.ts`. Each provision maps to:
- Primary OS service responsible for the capability
- Supporting services that contribute
- Implementation status (active / partial / planned)

## Coverage Summary

| Status | Count | Coverage |
|--------|-------|----------|
| Active | 6 | Sec 201, 202, 203, 204, 210, 211 |
| Partial | 3 | Sec 205, 206, 209 |
| Planned | 2 | Sec 207, 208 |
| **Total** | **11** | **68% coverage** |

## Key Alignments

- **Sec 201 (Regulatory Barriers):** AI zoning analysis via OS-Land
- **Sec 202 (Speed Approvals):** Automated permit tracking via OS-PM
- **Sec 204 (Housing Finance):** Capital stack builder via OS-Dev
- **Sec 211 (Land to Delivery):** Full DDTS lifecycle tracking

## Rationale

- Positions Kealee for federal grant eligibility (Sec 205 Innovation Fund)
- Demonstrates compliance for institutional customers
- Guides product roadmap priorities (planned provisions = near-term features)

## Consequences

- Must update coverage status as features ship
- Marketing can reference specific provisions in sales materials
- Compliance reporting can auto-generate Housing Act alignment reports
