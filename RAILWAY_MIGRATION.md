# Railway Migration Guide — Kealee Platform v10

## DNS Migration Checklist

For each domain, create a new Railway service, deploy, then update DNS.

### Step 1: Create Railway Services

In your Railway project, create one service per app. Each service should:
- **Source:** GitHub repo `kealee-platform-v10`
- **Root Directory:** (leave empty — repo root, Dockerfiles reference monorepo paths)
- **Dockerfile Path:** `apps/<app-name>/Dockerfile` or `services/<name>/Dockerfile`

### Step 2: Set Environment Variables

Every Railway service needs at minimum:
```
NEXT_PUBLIC_SUPABASE_URL=https://rkreqfpkxavqpsqexbfs.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<your-anon-key>
NEXT_PUBLIC_API_URL=https://api.kealee.com
PORT=3000
```

Backend services also need:
```
DATABASE_URL=postgresql://postgres:OAhPZZZvFbMiKcUkPWbCTKIPGsOuaOVd@ballast.proxy.rlwy.net:46074/railway
REDIS_URL=<your-redis-url>
```

The API service additionally needs:
```
CORS_ORIGINS=https://kealee.com,https://www.kealee.com,https://app.kealee.com,https://ops.kealee.com,https://architect.kealee.com,https://permits.kealee.com,https://pm.kealee.com,https://admin.kealee.com
```

### Step 3: Generate Railway Domains

For each service, go to **Settings > Networking > Generate Domain** to get a `*.up.railway.app` URL. Test each one before updating DNS.

### Step 4: DNS Records

Update DNS at your registrar (e.g., Cloudflare, Namecheap) for each domain.

| Domain | App | DNS Type | Record | Value | Notes |
|--------|-----|----------|--------|-------|-------|
| `kealee.com` | m-marketplace | CNAME | `@` | `<marketplace>.up.railway.app` | Some registrars require A record for apex; use Railway's IP if needed |
| `www.kealee.com` | m-marketplace | CNAME | `www` | `<marketplace>.up.railway.app` | |
| `app.kealee.com` | m-project-owner | CNAME | `app` | `<project-owner>.up.railway.app` | |
| `permits.kealee.com` | m-permits-inspections | CNAME | `permits` | `<permits>.up.railway.app` | |
| `ops.kealee.com` | m-ops-services | CNAME | `ops` | `<ops>.up.railway.app` | |
| `architect.kealee.com` | m-architect | CNAME | `architect` | `<architect>.up.railway.app` | |
| `pm.kealee.com` | os-pm (not yet built) | CNAME | `pm` | `<pm>.up.railway.app` | Defer until os-pm is ready |
| `admin.kealee.com` | os-admin | CNAME | `admin` | `<admin>.up.railway.app` | |
| `api.kealee.com` | api | CNAME | `api` | `<api>.up.railway.app` | Already on Railway |
| `engineer.kealee.com` | m-engineer | CNAME | `engineer` | `<engineer>.up.railway.app` | |
| `estimation.kealee.com` | m-estimation | CNAME | `estimation` | `<estimation>.up.railway.app` | |
| `finance.kealee.com` | m-finance-trust | CNAME | `finance` | `<finance>.up.railway.app` | |

### Step 5: Add Custom Domains in Railway

For each service in Railway dashboard:
1. Go to **Settings > Networking > Custom Domain**
2. Add the domain (e.g., `app.kealee.com`)
3. Railway will show the required CNAME target
4. Update DNS to point to that target
5. Railway auto-provisions SSL via Let's Encrypt

### Step 6: Update NEXT_PUBLIC_APP_URL

After DNS propagation, update each service's `NEXT_PUBLIC_APP_URL` to its production domain:

| Service | NEXT_PUBLIC_APP_URL |
|---------|-------------------|
| m-marketplace | `https://kealee.com` |
| m-project-owner | `https://app.kealee.com` |
| m-permits-inspections | `https://permits.kealee.com` |
| m-ops-services | `https://ops.kealee.com` |
| m-architect | `https://architect.kealee.com` |
| m-engineer | `https://engineer.kealee.com` |
| m-estimation | `https://estimation.kealee.com` |
| m-finance-trust | `https://finance.kealee.com` |
| os-admin | `https://admin.kealee.com` |

## Deployment Order (Recommended)

1. **api** — Already on Railway. Fix the import errors and redeploy.
2. **m-marketplace** — Primary public-facing site. Deploy first to unblock Facebook verification.
3. **m-project-owner** — Core user-facing app.
4. **os-admin** — Admin dashboard.
5. **m-ops-services** — Operations portal.
6. **m-permits-inspections** — Permits portal.
7. **m-architect** — Architect portal.
8. **m-engineer** — Engineer portal.
9. **m-estimation** — Estimation portal.
10. **m-finance-trust** — Finance portal.
11. **marketing** — Marketing site.
12. **worker** — Background job processor.
13. **command-center** — Already has Dockerfile. Deploy separately.

## Rollback Plan

Keep Vercel projects intact (just paused). If Railway has issues:
1. Unpause Vercel billing
2. Revert DNS CNAMEs to Vercel targets
3. DNS propagation takes 5-60 minutes

## Per-Service Dockerfile Reference

| Service | Dockerfile | Port |
|---------|-----------|------|
| m-marketplace | `apps/m-marketplace/Dockerfile` | 3000 |
| m-project-owner | `apps/m-project-owner/Dockerfile` | 3000 |
| m-permits-inspections | `apps/m-permits-inspections/Dockerfile` | 3000 |
| m-ops-services | `apps/m-ops-services/Dockerfile` | 3000 |
| m-architect | `apps/m-architect/Dockerfile` | 3000 |
| m-engineer | `apps/m-engineer/Dockerfile` | 3000 |
| m-estimation | `apps/m-estimation/Dockerfile` | 3000 |
| m-finance-trust | `apps/m-finance-trust/Dockerfile` | 3000 |
| os-admin | `apps/os-admin/Dockerfile` | 3000 |
| marketing | `apps/marketing/Dockerfile` | 3000 |
| api | Root `Dockerfile` | 3001 |
| command-center | `services/command-center/Dockerfile` | 3001 |
| worker | `services/worker/Dockerfile` | 3001 |
