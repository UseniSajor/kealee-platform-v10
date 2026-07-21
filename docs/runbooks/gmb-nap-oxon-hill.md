# Google Business Profile — NAP (Oxon Hill HQ)

Use this **exact NAP** on Google Business Profile, Yelp, BBB, and citations so local SEO matches kealee.com JSON-LD.

| Field | Value |
|-------|--------|
| Business name | Kealee Construction (or Kealee Platform — pick one primary GMB listing) |
| Phone | (301) 575-8777 |
| Website | https://kealee.com |
| City | Oxon Hill |
| State | MD |
| ZIP | 20745 |
| Service area | Washington DC; Prince George's County; Montgomery County; Northern Virginia |

## Code source of truth

- `apps/web-main/lib/site/contact.ts`
- Deploy with optional overrides: `NEXT_PUBLIC_KEALEE_PHONE_DISPLAY`, `NEXT_PUBLIC_KEALEE_PHONE_E164`, `NEXT_PUBLIC_KEALEE_STREET` (add street line when you publish a public suite number)

## GA4 recommended conversions (manual in Google Analytics)

Mark as conversions when `NEXT_PUBLIC_GA_MEASUREMENT_ID` is set:

| Event | Trigger |
|-------|---------|
| `intake_start` | Land on `/concept`, `/permits`, `/estimate` |
| `lead_submitted` | Contact form + intake submit (wire in API callbacks if needed) |
| `checkout_started` | Stripe checkout pages |
| `purchase` | Success pages |

## After deploy

1. Search Console → submit `https://kealee.com/sitemap.xml`
2. GMB → verify phone matches tel link on `/contact`
3. Request reviews from recent PG County / DMV clients
