# Kealee.com digital assessment — corrected (May 2026)

This document reconciles the external **“Comprehensive Digital Assessment”** with the **Kealee Platform v10 `apps/web-main` codebase** and records what was fixed in-repo.

## Verdict: partially true, largely outdated

The original assessment described kealee.com as a traditional design-build brochure site with **no chat**, **no platform messaging**, and **no SEO infrastructure**. That was accurate for an older marketing site; it is **not accurate** for the current Next.js app in this monorepo.

| Claim (original) | Actual state in `apps/web-main` | Severity |
|------------------|----------------------------------|----------|
| “Construction company only” positioning | Homepage + metadata: AI design, permits, estimates, DMV | **Outdated** |
| Zero chat / no AI assistant | `AskChatBar` + `GlobalChatBar` → `/api/ask` (Claude-backed) | **False** |
| No FAQ | `/faq` with platform Q&A | **False** |
| No blog / content | `/blog` index + 4 live SEO articles | **Partial** — index lists more posts than have routes |
| No landing pages | `/concept`, `/permits`, `/estimate`, `/marketplace`, `/pricing`, `/homeowners`, etc. | **False** |
| No sitemap / robots | `app/sitemap.ts`, `app/robots.ts` | **False** |
| Missing schema everywhere | Blog articles had Article JSON-LD; site-wide graph was missing | **Partial** — fixed May 2026 |
| No Intercom/Drift | Custom Kealee chat (intentional — routes to product CTAs) | **By design** |
| Contact shows Austin TX | Placeholder phone/location | **True** — fixed to DMV + configurable phone |
| Sitemap listed dead blog URLs | Old slugs 404’d | **True** — fixed to `PUBLISHED_BLOG_SLUGS` only |
| Revenue / traffic numbers | Estimates only; not verifiable from repo | **Unverified** |

**Revised maturity (marketing site in repo):** ~6.5/10 — solid platform UX and conversion paths; gaps in published content volume, GMB/off-site SEO, and blog route parity.

## Implemented in this pass (code)

1. **Global JSON-LD** — Organization, WebSite, LocalBusiness (`HomeAndConstructionBusiness`), Service catalog (`lib/seo/site-json-ld.ts` + root layout).
2. **FAQPage schema** on `/faq`.
3. **Sitemap** — conversion routes + only published blog slugs (`lib/content/public-blog-slugs.ts`).
4. **Root metadata** — keywords, canonical base, robots.
5. **Mobile CRO** — click-to-call + “open assistant” rail (`MobileConversionRail.tsx`).
6. **Contact page** — HQ Oxon Hill MD, phone (301) 575-8777, service areas (`lib/site/contact.ts`).
7. **9 platform blog routes** — `app/blog/[slug]` + `lib/content/platform-blog-articles.ts`.
8. **7 service-area landing pages** — `/service-areas/*` (Oxon Hill HQ featured).
9. **GA4 path events** — `ConversionPathTracker` on concept / permits / estimate / marketplace.
10. **GMB NAP runbook** — `docs/runbooks/gmb-nap-oxon-hill.md`.

## Still recommended (not fully automatable in git)

| Priority | Action | Owner |
|----------|--------|-------|
| P0 | Publish remaining blog index posts as real `/blog/[slug]` pages (9+ listed, 4 live) | Content |
| P0 | Google Search Console + GA4 conversion events (concept start, permit intake, estimate) | Marketing |
| P1 | Google Business Profile (DC metro) — align NAP with `lib/site/contact.ts` | Ops |
| P1 | Service-area landing pages (Silver Spring, Oxon Hill, etc.) if local SEO is a goal | Content |
| P2 | Third-party chat (Intercom) only if Kealee Ask cannot cover live human handoff | Product |
| P2 | Neighborhood/county pages beyond `/permits/dmv` | SEO |

## Intercom / Drift note

The assessment recommends Intercom/Drift. The platform already ships **Kealee Ask** with service-aware CTAs (permits, concept, estimate, marketplace). Adding a second widget increases weight and splits analytics unless it replaces Ask. Prefer enhancing `/api/ask` and Command Center lead routing over a generic SaaS widget.

## Traffic / ROI figures

Treat projected **$450K–600K/month** and **3% → 12% conversion** as illustrative. Validate with GA4, Stripe intake volume, and Search Console before budgeting ads.

---

**Last updated:** 2026-05-22  
**Related:** `apps/web-main/app/sitemap.ts`, `apps/web-main/lib/seo/site-json-ld.ts`
