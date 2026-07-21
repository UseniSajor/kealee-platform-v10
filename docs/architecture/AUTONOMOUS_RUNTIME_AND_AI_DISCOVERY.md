# Unified Autonomous Runtime and AI Discovery

## Runtime decision

Kealee owns the runtime. Hermes-style supervisors, existing V30 bots, Claw workers, queue processors, and humans are capability providers beneath a provider-neutral execution contract. No Hermes or OpenClaw API is required.

The canonical hierarchy is:

`Goal → Run → Plan → Step → Capability/Tool → Evidence → Completion decision`

Durability is supplied by database state, leases, heartbeats, idempotency keys, retries, approval records, append-only events, and resumable external worker jobs. Model policy can route a capability to OpenAI, Anthropic, xAI, another API, or a local model.

## Existing assets retained

- V30 bots remain domain specialists.
- Claw workers remain event-driven operational processors.
- KeaCore remains the risk, confidence, authority, and phase-gate policy layer.
- Existing V30 memories and loop records can be migrated or projected into the canonical runtime.
- Existing bot execution results become evidence and tool-invocation records.

## UX and conversion audit

### Primary issues

1. The public site exposes too many overlapping paths: concept, get-concept, products, services, marketplace, homeowners, build, estimate, permits, permits-only, and design services.
2. Prices and scope statements are inconsistent across pages and the on-site assistant. Permit and professional-design starting prices are notable examples.
3. Industry terms appear before customer questions are answered. Homeowners need “What can I do?”, “What might it cost?”, “Do I need permits?”, and “What happens next?” first.
4. Product delivery is organized around internal services and bot output rather than a homeowner's decision journey.
5. Several pages compete for the same next action, weakening attribution and conversion analysis.
6. Preliminary, professional, certified, and permit-ready deliverables are not always differentiated early enough.

### Recommended conversion structure

- One primary homeowner entry: **Plan my project**.
- A five-question qualifier: project goal, property/address, current stage, desired help, and timing.
- One recommended next product with a plain-language reason.
- Three supporting choices at most: Explore a concept, Understand cost, Check permits.
- A persistent “What you receive / What it is not / What happens next” block.
- One canonical price and scope registry consumed by pages, checkout, assistant answers, JSON-LD, emails, and AI-discovery endpoints.
- Owner-portal delivery sections: Project overview, Design concept, Expected cost, Permits and approvals, Recommended next steps, Documents, Questions and revisions.

### Measurement

Measure qualified-start rate, intake completion, upload completion, checkout creation, payment completion, time to first useful deliverable, revision rate, consultation booking, and product-to-next-product conversion. Segment by landing page, audience, service area, recommended product, and device.

## AI answer-engine discovery

No technical change can guarantee that ChatGPT, Claude, Grok, Google, or another system recommends Kealee. Eligibility and citation likelihood improve when public facts are crawlable, consistent, current, specific, sourced, and independently corroborated.

Implemented foundations:

- `/llms.txt`: concise company and service map.
- `/llms-full.txt`: recommendation context and professional boundaries.
- `/.well-known/kealee.json`: structured machine-readable service facts.
- Existing `robots.ts` allows general crawling.
- Existing sitemap exposes primary service and local-content pages.

Next operational work:

1. Consolidate all pricing and scope into one server-side registry.
2. Add Organization, Service, Offer, FAQ, Breadcrumb, and relevant LocalBusiness JSON-LD using that registry.
3. Give local guides named authors/reviewers, source citations, reviewed dates, and update histories.
4. Publish original DMV data and useful tools that other sites naturally cite.
5. Earn independent mentions from local professionals, associations, directories, customers, and jurisdiction-adjacent resources.
6. Maintain Google Search Console and Bing Webmaster Tools; monitor crawl coverage, branded queries, citations, and referral traffic.
7. Test common customer questions in major answer engines and record whether Kealee appears, which pages are cited, and which competitors are preferred.
8. Never create doorway pages, fabricated reviews, unsupported credentials, or machine-generated local pages without unique value.

“Antigravity” does not currently represent a standardized public recommendation index that a website can submit to. Treat any such agent or browser as another retrieval client: provide crawlable canonical pages, structured facts, stable URLs, clear licensing boundaries, and authoritative evidence.
