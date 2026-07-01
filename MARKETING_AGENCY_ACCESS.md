# Marketing Agency Access — Zem & Kealee Admin

## Login URLs (production)

**Agency partners use only** `/marketing/login` — a dedicated email/password screen. It does **not** show homeowner, contractor, or developer portals.

| User | URL | Role |
|------|-----|------|
| **Zem (agency)** | [https://kealee.com/marketing/login](https://kealee.com/marketing/login) | `marketing_agency` |
| **Kealee admin (viewer + approvals)** | [https://kealee.com/auth/login?next=/admin/marketing/approvals](https://kealee.com/auth/login?next=/admin/marketing/approvals) | `marketing_admin` |

After login:

- **Zem workspace:** `/marketing/workspace` — assets, Replicate concept visuals, copy drafts, lead summaries
- **Kealee approvals:** `/admin/marketing/approvals` — approve, reject, publish agency content
- **Kealee admin** can also open `/marketing/workspace` to preview the agency view

## Create logins (one-time)

Set passwords in your shell (never commit these):

```powershell
$env:ZEM_AGENCY_EMAIL = "zem-marketing@access.kealee.com"
$env:ZEM_AGENCY_PASSWORD = "<choose-strong-password>"
$env:KEALEE_MARKETING_ADMIN_EMAIL = "marketing-admin@kealee.com"
$env:KEALEE_MARKETING_ADMIN_PASSWORD = "<choose-strong-password>"
$env:NEXT_PUBLIC_SUPABASE_URL = "<your-supabase-url>"
$env:SUPABASE_SERVICE_ROLE_KEY = "<service-role-key>"

node scripts/provision-marketing-agency-users.mjs
```

Or full deploy (migrations + users):

```powershell
$env:SUPABASE_DB_URL = "<postgres-direct-url-port-5432>"
node scripts/deploy-marketing-agency.mjs --provision-users
```

Default emails if env not set:

| Account | Email |
|---------|-------|
| Zem agency | `zem-marketing@access.kealee.com` |
| Kealee marketing admin | `marketing-admin@kealee.com` |

## API key (optional — for external tools)

Add to Railway `web-main` variables:

```json
MARKETING_API_KEYS=[{"key":"zem-live-REPLACE_ME","role":"marketing_agency","label":"Zem"}]
```

Use header: `Authorization: Bearer zem-live-REPLACE_ME` on `/api/marketing/*` only.

## Permissions

| Action | Zem (`marketing_agency`) | Kealee (`marketing_admin`) |
|--------|------------------------|----------------------------|
| View approved assets | Yes | Yes |
| Upload / draft content | Yes | Yes |
| Generate concept visuals (Replicate) | Yes | Yes |
| Approve / publish | No | Yes |
| View lead summaries (aggregated) | Yes | Yes |
| Intelligence admin / customer PII | No | Via separate ops roles |

## Deploy checklist

1. **Migrations** (Supabase SQL):
   - `20260701_marketing_agency_layer.sql`
   - `20260702_intelligence_rls.sql`

   ```bash
   pnpm run deploy:marketing-agency
   ```

2. **Env vars** on `web-main` (Railway):
   - `CRON_SECRET` — required in production
   - `REPLICATE_API_TOKEN` — concept visuals
   - Do **not** set `KEALEE_ENTERPRISE_CRM_ENABLED` until GHL/HubSpot enterprise is active (native drip is default)

3. **Provision users** (see above)

4. **Redeploy** `web-main` (GitHub Actions `Deploy to Production` or `railway redeploy --service web-main`)

5. **Verify**
   - Zem can open `/marketing/workspace`
   - Kealee admin can open `/admin/marketing/approvals`
   - `GET /api/marketing/leads/summary` returns aggregates only (no emails)

## Native drip (current default)

Until `KEALEE_ENTERPRISE_CRM_ENABLED=true` is set with GHL/HubSpot credentials, all nurture runs through **Kealee native drip** (`marketing_drip_queue` + Resend). GHL sequence cron is skipped automatically.
