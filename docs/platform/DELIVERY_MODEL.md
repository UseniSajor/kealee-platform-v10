# Kealee delivery model

This document is the source of truth for production ownership.

| Capability | System of record | Responsibility |
| --- | --- | --- |
| Customer web applications | Railway (current) | Build and run the production Next.js frontends |
| Customer web applications | Vercel (planned) | Migration target for preview, promote, CDN, and frontend runtime |
| API and background workers | Railway | Fastify API, durable consumers, scheduled worker entrypoints |
| Relational data | Supabase Postgres | Primary database, migrations, RLS, backups |
| Identity | Clerk | Authentication, sessions, organizations, user identity |
| Authorization/data access | Kealee API + Postgres RLS | Tenant and resource authorization; never Supabase user metadata |
| Queues | BullMQ on Redis | Asynchronous work, retries, dead-letter handling |
| Payments | Stripe | Products, checkout, subscriptions, webhooks |
| Transactional email | Resend | Product email; provider calls go through communications package |
| AI inference | `@kealee/core-ai-gateway` | Model policy, routing, fallbacks, cost attribution, audit metadata |
| Errors and traces | Sentry + OpenTelemetry | Release-tagged errors and cross-service tracing |

## Deployment rules

1. Railway remains the frontend production provider until the planned Vercel cutover. No Railway frontend is drained until its Vercel replacement, custom domain, environment, smoke tests, and rollback path are verified.
2. Production artifacts are built once and verified before Railway deployment. A failed migration, build, typecheck, test, or security gate blocks deployment.
3. `packages/database/prisma/migrations` is the only Prisma migration history. Supabase-specific SQL lives under `packages/database/supabase/migrations` and is applied by one migration job.
4. Secrets live only in provider environment stores. Local secrets use ignored `.env.local` files.
5. Clerk user IDs are the canonical external identity. Supabase Auth must not create a parallel login/session authority.

## Environments

Production and preview must use different credentials and databases. Preview deployments must never receive production `DATABASE_URL`, `DIRECT_URL`, service-role, Stripe secret, or webhook secrets.
