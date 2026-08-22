# Planned Railway-to-Vercel frontend migration

Railway is the current frontend provider. Vercel projects are pre-provisioned migration targets and must not receive production DNS until each cutover gate passes.

For each application:

1. Match the app to `config/vercel-projects.json` and the Kealee team.
2. Scope preview credentials away from production data and payments.
3. Produce a READY deployment from the same commit running on Railway.
4. Run service-delivery, accessibility, performance, and runtime-error checks.
5. Record the Railway rollback URL.
6. Change DNS with a reduced TTL, verify traffic and telemetry, then retain Railway for the agreed rollback window.
7. Only after the rollback window, scale the corresponding Railway frontend to zero.

`m-marketplace` must be relinked from its current non-Kealee Vercel organization before migration work begins.
