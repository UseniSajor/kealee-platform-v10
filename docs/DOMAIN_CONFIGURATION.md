# 🌐 Domain Configuration Guide

## Vercel Custom Domains

### For Each App:

1. **os-admin** → `admin.kealee.com`
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
