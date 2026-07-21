# How to Access What's Been Built

## 🚀 Quick Start Guide

This guide will help you access and run the Admin UI and API that have been built.

---

## Prerequisites

Before starting, make sure you have:
- ✅ Node.js 20+ installed (You have: v24.11.1 ✅)
- ✅ pnpm 8+ installed (You have: 8.12.0 ✅)
- ✅ Docker Desktop installed (for PostgreSQL and Redis)
- ✅ Supabase account (for authentication)

**Your Current Status:**
- ✅ Node.js: Ready
- ✅ pnpm: Ready
- ✅ Docker: Ready
- ✅ Supabase: Ready

---

## Step 1: Start Database & Redis

The platform requires PostgreSQL and Redis to be running.

### Option A: Using Docker Compose (Recommended)

```powershell
# From the root directory
docker-compose up -d
```

This will start:
- **PostgreSQL** on port `5432`
- **Redis** on port `6379`

### Option B: Manual Setup

If you prefer to run PostgreSQL and Redis manually, make sure they're running on the default ports.

---

## Step 2: Set Up Environment Variables

### API Service Environment

Create `services/api/.env.local`:

```env
PORT=3001
SUPABASE_URL=your_supabase_project_url
SUPABASE_ANON_KEY=your_supabase_anon_key
DATABASE_URL=postgresql://kealee:kealee_dev@localhost:5432/kealee?schema=public
REDIS_URL=redis://localhost:6379
```

**Note:** 
- If using Docker Compose, the DATABASE_URL above should work
- Get your Supabase credentials from your Supabase project dashboard

### Admin UI Environment

Create `apps/os-admin/.env.local`:

```env
NEXT_PUBLIC_API_URL=http://localhost:3001
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

---

## Step 3: Install Dependencies

From the root directory:

```powershell
pnpm install
```

This will install all dependencies for the monorepo.

---

## Step 4: Set Up Database

```powershell
# Navigate to database package
cd packages/database

# Generate Prisma client
pnpm db:generate

# Run migrations (if you have any)
pnpm db:migrate

# Or push schema to database
pnpm db:push
```

---

## Step 5: Start the Services

### Option A: Start All Services at Once (Recommended)

From the root directory:

```powershell
pnpm dev
```

This uses Turbo to start both the API and Admin UI simultaneously.

### Option B: Start Services Separately

**Terminal 1 - Start API:**
```powershell
cd services/api
pnpm dev
```

The API will be available at: **http://localhost:3001**

**Terminal 2 - Start Admin UI:**
```powershell
cd apps/os-admin
pnpm dev
```

The Admin UI will be available at: **http://localhost:3002**

**Terminal 3 - Start PM Workspace (os-pm):**
```powershell
cd apps/os-pm
pnpm dev
```

The PM Workspace will be available at: **http://localhost:3004**

**Terminal 3 - Start Customer Portal (m-ops-services):**
```powershell
cd apps/m-ops-services
pnpm dev
```

The Customer Portal will be available at: **http://localhost:3003**

---

## Step 6: Access the Applications

### Admin UI (os-admin)
🌐 **URL:** http://localhost:3002

**Pages Available:**
- `/login` - Login page
- `/dashboard` - Dashboard with system metrics
- `/orgs` - Organization list
- `/orgs/new` - Create new organization
- `/orgs/[id]` - Organization detail page
- `/orgs/[id]/edit` - Edit organization
- `/users` - User list (placeholder)

### PM Workspace (os-pm)
🌐 **URL:** http://localhost:3004

**Pages Available:**
- `/login` - PM login
- `/dashboard` - PM dashboard
- `/queue` - Work queue
- `/queue/[taskId]` - Task detail
- `/clients` - Clients list

### Customer Portal (m-ops-services)
🌐 **URL:** http://localhost:3003

**Pages Available:**
- `/` - Landing page
- `/packages` - Package comparison
- `/signup` - Signup (UI-first; wiring comes next)

### API Service
🌐 **URL:** http://localhost:3001

**Endpoints:**
- `GET /health` - Health check
- `GET /docs` - Swagger API documentation
- `/auth/*` - Authentication endpoints
- `/orgs/*` - Organization endpoints
- `/users/*` - User endpoints
- `/rbac/*` - RBAC endpoints
- `/entitlements/*` - Module entitlements
- `/events/*` - Event logging
- `/audit/*` - Audit logging

---

## Step 7: Create a Test User (First Time)

To access the Admin UI, you'll need a user account. You can create one via:

### Option A: Using Supabase Dashboard
1. Go to your Supabase project dashboard
2. Navigate to Authentication > Users
3. Create a new user manually

### Option B: Using API
```powershell
# Sign up via API
curl -X POST http://localhost:3001/auth/signup \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@kealee.com",
    "password": "your-password",
    "name": "Admin User"
  }'
```

Then login at http://localhost:3002/login

---

## Troubleshooting

### Port Already in Use

If port 3001, 3002, 3003, or 3004 is already in use:

**For API (port 3001):**
- Change `PORT` in `services/api/.env.local`

**For Admin UI (port 3002):**
- Change the port in `apps/os-admin/package.json` scripts:
  ```json
  "dev": "next dev -p 3004"
  ```

**For Customer Portal (port 3003):**
- Change the port in `apps/m-ops-services/package.json` scripts:
  ```json
  "dev": "next dev -p 3005"
  ```

**For PM Workspace (port 3004):**
- Change the port in `apps/os-pm/package.json` scripts:
  ```json
  "dev": "next dev -p 3006"
  ```

### Database Connection Issues

1. Make sure Docker containers are running:
   ```powershell
   docker ps
   ```

2. Check database connection:
   ```powershell
   docker exec -it kealee-postgres psql -U kealee -d kealee
   ```

3. Verify DATABASE_URL in `services/api/.env.local`

### API Not Responding

1. Check if API is running:
   ```powershell
   curl http://localhost:3001/health
   ```

2. Check API logs for errors

3. Verify environment variables are set correctly

### Admin UI Can't Connect to API

1. Verify `NEXT_PUBLIC_API_URL` in `apps/os-admin/.env.local`
2. Make sure API is running on the correct port
3. Check browser console for CORS errors

### Authentication Issues

1. Verify Supabase credentials in both `.env.local` files
2. Make sure you have a user account created
3. Check browser console for auth errors

---

## What's Been Built So Far

### ✅ Completed Features

**Week 3 (OS Foundation):**
- ✅ Complete API with authentication
- ✅ Organization management endpoints
- ✅ User management endpoints
- ✅ RBAC (Roles & Permissions)
- ✅ Module entitlements
- ✅ Event & audit logging
- ✅ Worker infrastructure (BullMQ)
- ✅ Queue processing (email, webhook, ML, reports)
- ✅ Cron jobs
- ✅ Rate limiting
- ✅ API documentation (Swagger)

**Week 4 (Admin UI - In Progress):**
- ✅ Admin UI setup (Next.js + Tailwind + Shadcn)
- ✅ Authentication pages (login/logout)
- ✅ Navigation (sidebar + header)
- ✅ Dashboard with system metrics
- ✅ Organization list page
- ✅ Organization detail page
- ✅ Create organization page
- ✅ Edit organization page
- ⏳ Module enablement interface (Task 39 - Next)

---

## Next Steps

After accessing the applications:

1. **Test the Admin UI:**
   - Login at http://localhost:3002/login
   - View the dashboard
   - Create a new organization
   - Edit an organization
   - View organization details

2. **Explore the API:**
   - Visit http://localhost:3001/docs for Swagger documentation
   - Test endpoints using the Swagger UI
   - Check `/health` endpoint

3. **Continue Development:**
   - Task 39: Module enablement interface
   - Task 40-44: User management pages
   - And more...

---

## Quick Reference

| Service | Port | URL | Status |
|---------|------|-----|--------|
| Admin UI | 3002 | http://localhost:3002 | ✅ Ready |
| Customer Portal | 3003 | http://localhost:3003 | ✅ Ready |
| PM Workspace | 3004 | http://localhost:3004 | ✅ Ready |
| API | 3001 | http://localhost:3001 | ✅ Ready |
| API Docs | 3001 | http://localhost:3001/docs | ✅ Ready |
| PostgreSQL | 5432 | localhost:5432 | ✅ Ready (Docker) |
| Redis | 6379 | localhost:6379 | ✅ Ready (Docker) |

---

## Need Help?

If you encounter issues:
1. Check the logs in the terminal where services are running
2. Verify all environment variables are set
3. Ensure Docker containers are running
4. Check that ports are not in use by other applications

Happy coding! 🚀
