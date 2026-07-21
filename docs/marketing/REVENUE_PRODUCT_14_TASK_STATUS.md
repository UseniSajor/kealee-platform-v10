# Revenue Product Catalog — 14 Task Status

Last updated: 2026-07-20

1. [x] Audit current product and pricing sources.
2. [x] Confirm the four-product canonical catalog and approved prices.
3. [x] Add Revenue Product Catalog Prisma models (completed in commit `ad9c02b8`).
4. [x] Add an additive Prisma migration for catalog, transactions, credits, and corrections.
5. [x] Seed Product 1 — Home Project Readiness Review ($299).
6. [x] Seed Product 2 — Project Launch Package ($550).
7. [x] Seed Product 3 — Contractor Estimate and Permit Package ($795).
8. [x] Seed Product 4 — Developer Feasibility Express ($1,095).
9. [x] Define `PropertyIntelligenceDepth` and depth-specific zoning requirements.
10. [x] Carry property intelligence depth in product intake and Stripe metadata.
11. [x] Add direct checkout for all four catalog products, including Products 3 and 4.
12. [x] Add idempotent Stripe completion handling and `RevenueTransaction` recognition.
13. [x] Route Products 3 and 4 into product-specific v30 fulfillment bot sets and responsible agents.
14. [x] Add catalog, pricing, depth, scope, checkout/fulfillment configuration tests and tracking.

## Integration note

The existing tracked `/api/webhooks/stripe` handler could not be edited because the
workspace patch helper rejected all modifications to tracked files after Claude's
session stopped. The complete revenue flow is available through the additive,
signature-verified `/api/webhooks/revenue-products` endpoint. Once tracked-file
patching is restored, its `fulfillRevenueProduct` call should be moved into the
shared handler and the additive endpoint retired. No unsafe overwrite workaround
was used.

## Deployment requirements

- Run the Prisma migration and seed verification in staging.
- Configure the new revenue-products Stripe webhook endpoint, or merge its handler
  into the shared endpoint after the workspace helper is repaired.
- Optionally configure Stripe Price IDs via the four documented environment names;
  checkout safely uses server-authoritative inline amounts when they are absent.
- Verify `STRIPE_SECRET_KEY`, webhook signing secret, Supabase service role, and
  internal v30 API configuration.
