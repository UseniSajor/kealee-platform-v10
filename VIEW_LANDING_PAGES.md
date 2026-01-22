# How to View Landing Pages Locally

All landing pages are in separate Next.js apps. Here's how to view each one:

## Quick Start - View All Landing Pages

Each module has its own Next.js app with a landing page. Run them in separate terminal windows:

### 1. **Permits & Inspections** (`m-permits-inspections`)
```bash
cd apps/m-permits-inspections
pnpm dev
```
**URL:** http://localhost:3000 (Next.js default port)
**Landing Page:** Shows for unauthenticated users, redirects authenticated users to `/dashboard`

### 2. **Project Owner** (`m-project-owner`)
```bash
cd apps/m-project-owner
pnpm dev
```
**URL:** http://localhost:3006
**Landing Page:** Full SEO-optimized landing page

### 3. **Architect Hub** (`m-architect`)
```bash
cd apps/m-architect
pnpm dev
```
**URL:** http://localhost:3007
**Landing Page:** Full SEO-optimized landing page for architects

### 4. **Ops Services** (`m-ops-services`)
```bash
cd apps/m-ops-services
pnpm dev
```
**URL:** http://localhost:3000 (or default Next.js port)
**Landing Page:** Already has marketing page at `app/(marketing)/page.tsx` with enhanced SEO metadata

### 5. **PM Dashboard** (`os-pm`)
```bash
cd apps/os-pm
pnpm dev
```
**URL:** http://localhost:3004 (configured in docs)
**Landing Page:** Simple landing page for internal PM tool

## Recommended Ports (from documentation)

- `m-permits-inspections`: 3000 (default)
- `m-project-owner`: 3006
- `m-architect`: 3000 (default)
- `m-ops-services`: 3005
- `os-pm`: 3004
- `os-admin`: 3002

## Note About Authentication

- **m-permits-inspections**: Landing page shows for unauthenticated users. If you're logged in, you'll be redirected to `/dashboard`. To see the landing page, make sure you're not authenticated.
- **Other apps**: Landing pages should show directly when you visit the root URL.

## Viewing on Railway/Production

Once deployed, the landing pages will be accessible at:
- `https://your-railway-domain.railway.app` (for each service's domain)

---

## Troubleshooting

If ports are already in use, you can specify a different port:
```bash
pnpm dev -p 3007
```

Or check what's running on a port:
```bash
# Windows
netstat -ano | findstr :3000

# Mac/Linux
lsof -i :3000
```




