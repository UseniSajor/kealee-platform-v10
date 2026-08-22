# Production service catalog

Last reconciled: 2026-08-20.

## Target production catalog

| Service | Platform | State | Purpose |
| --- | --- | --- | --- |
| web-main and customer portals | Railway | retained | Current customer-facing Next.js applications |
| os-admin | Railway | retained | Current administrative interface |
| m-marketplace | Railway | retained | Current marketplace interface |
| kealee-platform-v10 | Railway | retained | Canonical Fastify API |
| command-center-workers | Railway | retained | BullMQ consumers and operational automation |
| marketing-cron | Railway | consolidate | One scheduler/dispatcher replacing per-channel services |
| Redis | Railway | retained | BullMQ backing store |
| Postgres | Supabase | retained | Canonical relational database; Railway Postgres is not application primary |

## Planned Vercel migration

`web-main`, `portal-owner`, `portal-contractor`, `portal-developer`, `os-admin`, `m-marketplace`, and `command-center` remain active on Railway. Their Vercel projects are migration candidates only. Cut over one application at a time with DNS verification and an immediate Railway rollback path.

Per-channel or orphaned cron services to merge into `marketing-cron`: parcel enrichment/outreach, LinkedIn, YouTube, Facebook, Instagram, Twitter, Reddit, ad-spend sync, lead scoring, sequences, cold requalification, campaign generation/sending, and marketing drip.

`launch-integrity`, `engineering-worker`, and `worker` require an owner and unique workload. If no unique queue or schedule is documented, merge them into `command-center-workers`.

## Workspace classification rule

Every workspace package must declare one of these lifecycle classes in the generated inventory: `production`, `supporting`, `experimental`, `duplicate`, or `obsolete`. Production deployment configuration may reference only `production` and `supporting` units.
