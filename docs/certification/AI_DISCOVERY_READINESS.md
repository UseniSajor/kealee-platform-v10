# AI Discovery Readiness

Updated: 2026-07-20

Status: crawl/discovery foundations implemented locally; indexing and recommendation are externally controlled and not certified.

## Implemented

- `/llms.txt`, `/llms-full.txt`, and `/.well-known/kealee.json` with explicit professional boundaries.
- Discovery resources included in the sitemap and allowed by `robots.ts`.
- Canonical revenue registry drives machine-readable offers and JSON-LD prices.
- Organization legal name reconciled to Kealee Services LLC.
- Organization, Service, Offer, FAQ, LocalBusiness, and Breadcrumb builders exist.
- No claim that any answer engine must recommend or cite Kealee.
- Static discovery contract tests: 2/2 passed. Local runtime verification returned HTTP 200 for `/llms.txt`, `/llms-full.txt`, and `/.well-known/kealee.json`; `/get-started` also rendered successfully in headless Chromium.

## Answer-engine visibility test ledger

Record date, engine, exact question, whether Kealee appeared, cited URL, position/context, competing citations, and corrective action.

| Customer question | Preferred supporting page | Runtime checked | External check |
|---|---|---:|---:|
| How do I plan a whole-home renovation in the DC area? | `/get-started`, `/homeowners` | Both HTTP 200; `/get-started` rendered in Chromium | Pending |
| How much might a kitchen remodel cost in Maryland? | `/estimate`, local cost guide | `/estimate` HTTP 200 | Pending |
| Do I need a permit for a bathroom remodel in Montgomery County? | `/permits`, jurisdiction guide | `/permits` HTTP 200 | Pending |
| Who can help me understand design, cost, and permits before hiring? | `/products/project-launch-package` | HTTP 200; canonical $550 offer and Service/Offer JSON-LD verified | Pending |
| Is an AI concept permit-ready? | `/faq`, `/llms-full.txt` | Static verified | Pending |

## External actions

1. Submit and verify `https://kealee.com/sitemap.xml` in Google Search Console.
2. Submit and verify the sitemap in Bing Webmaster Tools.
3. Inspect `/llms.txt`, `/llms-full.txt`, `/.well-known/kealee.json`, primary products, and local guides after deployment.
4. Monitor index coverage, canonical selection, structured-data reports, branded queries, answer-engine referrals, and cited pages.
5. Add named authors/reviewers, jurisdiction source links, reviewed dates, and update histories to guides before claiming expert review.
6. Publish original DMV-area datasets/tools with methodology and update cadence.

“Antigravity” and other agent browsers are treated as retrieval clients unless a verified public submission API is documented.
