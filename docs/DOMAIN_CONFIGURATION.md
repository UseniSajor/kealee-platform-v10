# 🌐 Domain Configuration Guide

> ## ⚠️ Live DNS status (verified 2026-07-13) — platform is on **Railway**, not Vercel
>
> The historical guide below describes a Vercel setup. Production DNS now points at
> Railway. Confirmed live records:
>
> | Host | Live record | HTTPS | Status |
> |---|---|---|---|
> | `kealee.com` | A → `69.46.46.79` (Railway) | 200 | ✅ main site + `/concept` checkout |
> | `www.kealee.com` | CNAME → `brt05n9h.up.railway.app` | 200 | ✅ (points to a different Railway service than apex — verify www→apex redirect) |
> | `api.kealee.com` | CNAME → `894gcuin.up.railway.app` | 200 | ✅ Stripe webhook host (`/webhooks/stripe`) |
> | `admin.kealee.com` | CNAME → Railway | — | ✅ resolves |
> | `owner.kealee.com` | **NXDOMAIN — not in DNS** | ❌ 000 | **BROKEN — owner portal / concept-delivery magic links are unreachable** |
> | `ops.kealee.com` | NXDOMAIN | — | ⚠️ not configured (OK if folded into main site) |
>
> **Action items:**
> 1. **Add `owner.kealee.com`** — CNAME to the Railway owner-portal service, then attach the
>    domain in Railway. Post-payment concept emails link to `owner.kealee.com/deliverables/…`
>    (see `apps/web-main/app/api/intake/diagnostics/route.ts`), so buyers currently cannot
>    reach what they purchased.
> 2. **SPF is missing Resend** — current record is
>    `v=spf1 include:zohomail.com include:sendgrid.net ~all`. The app sends via Resend
>    (`RESEND_API_KEY`); add `include:_spf.resend.com` so concept-delivery email passes SPF.
>    (DKIM `resend._domainkey` is already present.)
> 3. Remove the placeholder TXT `google-site-verification=YourUniqueGoogleVerificationCode`.
>
> DNS registrar records are managed at **NameBright**; custom domains are attached in the
> **Railway** dashboard (Service → Settings → Domains).

## Vercel Custom Domains (historical — pre-Railway)

### For Each App:

1. **os-admin** → `admin.kealee.com` (canonical admin UI; replaces deprecated `admin-console`)
2. **os-pm** → `pm.kealee.com`
3. **m-ops-services** → `ops.kealee.com` (or `kealee.com` for main site)
4. **m-project-owner** → `owner.kealee.com`
5. **m-architect** → `architect.kealee.com`
6. **m-permits-inspections** → `permits.kealee.com`

### Steps:

1. Go to Vercel dashboard
2. Select each project
3. Go to "Settings" → "Domains"
4. Add custom domain
5. Follow DNS configuration instructions

## Railway Custom Domain (API)

1. Go to Railway dashboard
2. Select API service
3. Go to "Settings" → "Domains"
4. Add custom domain: `api.kealee.com`
5. Configure DNS (see below)

## DNS Configuration (NameBright)

### CNAME Records:

```
admin.kealee.com        → cname.vercel-dns.com
pm.kealee.com           → cname.vercel-dns.com
ops.kealee.com          → cname.vercel-dns.com
owner.kealee.com        → cname.vercel-dns.com
architect.kealee.com    → cname.vercel-dns.com
permits.kealee.com      → cname.vercel-dns.com
api.kealee.com          → [Railway CNAME]
```

### A Records (if needed):

```
kealee.com              → [Vercel IP] (if using root domain)
www.kealee.com          → [Vercel IP] (if using www)
```

### Email Records (for Resend):

```
TXT @                   → v=spf1 include:_spf.resend.com ~all
TXT resend._domainkey   → [Resend DKIM key]
```

## SSL Certificates

- **Vercel:** Automatic SSL via Let's Encrypt
- **Railway:** Automatic SSL via Let's Encrypt
- **Verification:** Check SSL status in Vercel/Railway dashboards

## Redirects (www → non-www)

### In Vercel:

1. Go to project settings
2. "Domains" → "Redirects"
3. Add redirect:
   - Source: `www.kealee.com/*`
   - Destination: `https://kealee.com/$1`
   - Permanent: Yes (301)

## Verification Checklist

- [ ] All domains added to Vercel/Railway
- [ ] DNS records configured
- [ ] SSL certificates active
- [ ] Redirects configured
- [ ] Test each domain in browser
- [ ] Verify SSL certificate validity

---

**Last Updated:** January 19, 2025
