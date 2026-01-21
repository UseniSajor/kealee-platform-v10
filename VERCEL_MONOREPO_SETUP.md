# Vercel Monorepo Setup - Full Platform Deployment

## Important: Vercel Monorepo Architecture

**Each app is deployed as a separate Vercel project**, not one project for the whole platform. This is how Vercel handles monorepos - each app gets its own:
- Project name
- URL (e.g., `kealee-architect.vercel.app`)
- Environment variables
- Build settings

---

## Project Names for Each App

When importing to Vercel, use these project names:

| App | Vercel Project Name | Root Directory |
|-----|---------------------|----------------|
| `m-architect` | `kealee-architect` | `apps/m-architect` |
| `m-permits-inspections` | `kealee-permits-inspections` | `apps/m-permits-inspections` |
| `m-project-owner` | `kealee-project-owner` | `apps/m-project-owner` |
| `m-ops-services` | `kealee-ops-services` | `apps/m-ops-services` |
| `os-pm` | `kealee-pm-dashboard` | `apps/os-pm` |
| `os-admin` | `kealee-admin` | `apps/os-admin` |

---

## How to Deploy All Apps to Vercel

### Step 1: Connect Repository

1. Go to [vercel.com/new](https://vercel.com/new)
2. Import your Git repository
3. **Important:** Vercel will suggest a project name based on what it detects. **You can change this** in the next step.

### Step 2: Configure First App (e.g., m-architect)

When Vercel detects `m-architect` and suggests that name:

1. **Project Name:** Change to `kealee-architect` (or your preferred name)
2. **Root Directory:** Set to `apps/m-architect`
3. **Framework Preset:** Next.js (auto-detected)
4. **Build Settings:**
   - **Install Command:** `cd ../.. && pnpm install --filter @kealee/m-architect...`
   - **Build Command:** `cd ../.. && pnpm build --filter @kealee/m-architect`
   - **Output Directory:** `.next` (auto-detected)

### Step 3: Deploy All Other Apps

After deploying the first app:

1. **Vercel Dashboard → Add New Project**
2. Select the **same Git repository**
3. Configure each app with:
   - Unique project name
   - Correct root directory
   - App-specific build settings

**Repeat for all 6 apps.**

---

## Alternative: Remove vercel.json to Avoid Auto-Detection

If you don't want Vercel to auto-detect `m-architect`:

1. The `vercel.json` files in each app are for **local development**, not Vercel deployment
2. You can remove them or ignore them during deployment
3. Configure everything in Vercel Dashboard instead

---

## Recommended Deployment Order

Deploy in this order for easiest setup:

1. **m-ops-services** (customer-facing, main revenue driver)
2. **m-project-owner** (customer-facing)
3. **m-permits-inspections** (customer-facing)
4. **m-architect** (professional tool)
5. **os-pm** (internal tool)
6. **os-admin** (internal tool)

---

## Project Name Strategy

You can use a consistent naming pattern:

- `kealee-architect`
- `kealee-permits`
- `kealee-project-owner`
- `kealee-ops-services`
- `kealee-pm` (or `kealee-pm-dashboard`)
- `kealee-admin`

Or keep them short:
- `architect`
- `permits`
- `project-owner`
- `ops-services`
- `pm`
- `admin`

**Just make sure each project name is unique.**

---

## Quick Setup in Vercel

1. **First Import:**
   - Vercel may detect `m-architect` → **Change Project Name** to `kealee-architect`
   - Set Root Directory: `apps/m-architect`
   - Configure build settings
   - Deploy

2. **Subsequent Apps:**
   - Click "Add New Project" in Vercel Dashboard
   - Select the same repo
   - Configure each app individually

---

## All Apps Will Have Separate URLs

After deployment, you'll have:

- `https://kealee-architect.vercel.app`
- `https://kealee-permits-inspections.vercel.app`
- `https://kealee-project-owner.vercel.app`
- `https://kealee-ops-services.vercel.app`
- `https://kealee-pm-dashboard.vercel.app`
- `https://kealee-admin.vercel.app`

Each with their own landing pages!

---

## Summary

**Vercel detected `m-architect`?** That's normal - just **change the Project Name** in Vercel's setup screen to what you want (e.g., `kealee-architect` or `kealee-platform-architect`).

**Each app = One Vercel Project**. You'll have 6 separate projects, not one "full platform" project. This is the standard approach for monorepos on Vercel.

