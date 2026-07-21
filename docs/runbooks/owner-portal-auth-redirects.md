# Owner portal magic links → `owner.kealee.com` (not `kealee.com`)

## Symptom

- Email button **“Open My Owner Portal”** lands on `https://kealee.com` (homepage).
- Concept-ready email deliverable link goes to `kealee.com/deliverables/...` (404 → homepage).
- Link reaches `owner.kealee.com` but bounces to **`/login`** (session cookie never set, or bare deliverable URL without magic link).

## Root cause

Supabase Auth only honors `redirectTo` when the URL is listed under **Authentication → URL Configuration → Redirect URLs**. If `https://owner.kealee.com/**` is missing, GoTrue falls back to **Site URL** (`https://kealee.com`).

Vercel env `NEXT_PUBLIC_OWNER_PORTAL_URL` is already correct on `kealee-web-main` and `kealee-portal-owner` when set to `https://owner.kealee.com`.

## Fix (Supabase Dashboard — required)

Project: `rkreqfpkxavqpsqexbfs` (or your project ref)

1. **Authentication → URL Configuration**
2. **Site URL** — keep `https://kealee.com` (marketing site).
3. **Redirect URLs** — add (one per line):

```
https://owner.kealee.com/**
https://owner.kealee.com/auth/callback
https://owner.kealee.com/auth/callback/**
http://localhost:3008/**
http://localhost:3008/auth/callback
```

Adjust port if local `portal-owner` uses a different dev port.

4. Save.

## Vercel env (both apps)

| App | Variable | Value |
|-----|----------|--------|
| `kealee-web-main` | `NEXT_PUBLIC_OWNER_PORTAL_URL` | `https://owner.kealee.com` |
| `kealee-portal-owner` | `NEXT_PUBLIC_OWNER_PORTAL_URL` | `https://owner.kealee.com` |
| `kealee-web-main` | `SUPABASE_SERVICE_ROLE_KEY` | (same as API / Supabase service role) |
| `kealee-portal-owner` | `SUPABASE_SERVICE_ROLE_KEY` | (same) |
| `kealee-portal-owner` | `RESEND_API_KEY` | (required for custom magic-link email) |

`NEXT_PUBLIC_APP_URL` on **portal-owner** should stay `https://owner.kealee.com` for pay/checkout flows — not `https://kealee.com`.

Redeploy both apps after env changes.

## Verify

### Automated — Vercel `SUPABASE_SERVICE_ROLE_KEY` (Production + Preview)

```powershell
# Token: https://vercel.com/account/tokens (never commit)
$env:VERCEL_TOKEN = "your_token"
pnpm run verify:vercel-supabase
```

Checks **kealee-web-main** and **kealee-portal-owner** for:

- `SUPABASE_SERVICE_ROLE_KEY` — Production + Preview (required)
- `NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `NEXT_PUBLIC_OWNER_PORTAL_URL` = `https://owner.kealee.com` (not `kealee.com`)

Manual dashboard (same check):

- [kealee-web-main env](https://vercel.com/kealee/kealee-web-main/settings/environment-variables)
- [kealee-portal-owner env](https://vercel.com/kealee/kealee-portal-owner/settings/environment-variables)

Service role value: Supabase → Project Settings → API → **service_role** (secret).

### Owner portal URL (local / CI)

```bash
node scripts/verify-owner-portal-config.mjs
```

Or send a magic link from `https://owner.kealee.com/login` and confirm the link host is `*.supabase.co` with `redirect_to=https://owner.kealee.com/auth/callback`.

## Code paths (reference)

- **Concept-ready email CTA**: `GET https://owner.kealee.com/auth/claim?t=…&i=…` → server session → `/deliverables/[intakeId]` (`apps/portal-owner/app/auth/claim/route.ts`)
- Magic link (login form): `apps/portal-owner/app/api/auth/magic-link/route.ts` → `redirectTo = ${portalBase}/auth/callback?next=...`
- web-main `/concept/access` redirects to owner portal login (legacy links)
- Deliverable URL: `apps/web-main/lib/owner-portal-urls.ts` → `getOwnerPortalDeliverableUrl()`
- Auth callback: `apps/portal-owner/app/auth/callback/route.ts` (PKCE `code` / `token_hash`)

### Resend access email (expired link)

```bash
curl -X POST https://kealee.com/api/emails/resend-portal-access \
  -H "Content-Type: application/json" \
  -d '{"intakeId":"<uuid>","email":"customer@example.com"}'
```

## v30 intake (not this fix)

Paid concept intake today uses **web-main** `/api/concept/generate` (Claude + Replicate). v30 bots/workers are a separate path — see `docs/runbooks/v30-intake-bridge.md`.
