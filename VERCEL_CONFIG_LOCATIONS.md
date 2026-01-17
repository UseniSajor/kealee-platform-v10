# Vercel Configuration Files - Complete Reference

## 📍 Where Configuration Files Are Located

### **Each App Has 3 Key Files:**

```
apps/[app-name]/
├── vercel.json          ← Vercel deployment config
├── package.json         ← App dependencies & scripts
└── next.config.ts       ← Next.js configuration
```

---

## 📋 Configuration Files for Each App

### 1. **os-admin** (Platform Administration)

**Location:** `apps/os-admin/`

**vercel.json:**
```json
{
  "buildCommand": "cd ../.. && pnpm install --filter @kealee/os-admin... && pnpm build --filter @kealee/os-admin",
  "outputDirectory": ".next",
  "installCommand": "cd ../.. && pnpm install --filter @kealee/os-admin...",
  "framework": "nextjs",
  "rootDirectory": "apps/os-admin"
}
```

**package.json:**
```json
{
  "name": "@kealee/os-admin",
  "version": "0.1.0",
  "scripts": {
    "dev": "next dev -p 3002",
    "build": "next build",
    "start": "next start -p 3002"
  }
}
```

---

### 2. **os-pm** (Project Manager Dashboard)

**Location:** `apps/os-pm/`

**vercel.json:**
```json
{
  "buildCommand": "cd ../.. && pnpm install --filter @kealee/os-pm... && pnpm build --filter @kealee/os-pm",
  "outputDirectory": ".next",
  "installCommand": "cd ../.. && pnpm install --filter @kealee/os-pm...",
  "framework": "nextjs",
  "rootDirectory": "apps/os-pm"
}
```

---

### 3. **m-architect** (Architect Dashboard)

**Location:** `apps/m-architect/`

**vercel.json:**
```json
{
  "buildCommand": "cd ../.. && pnpm install --filter @kealee/m-architect... && pnpm build --filter @kealee/m-architect",
  "outputDirectory": ".next",
  "installCommand": "cd ../.. && pnpm install --filter @kealee/m-architect...",
  "framework": "nextjs",
  "rootDirectory": "apps/m-architect"
}
```

---

### 4. **m-permits-inspections** (Permits Hub)

**Location:** `apps/m-permits-inspections/`

**vercel.json:**
```json
{
  "buildCommand": "cd ../.. && pnpm install --filter @kealee/m-permits-inspections... && pnpm build --filter @kealee/m-permits-inspections",
  "outputDirectory": ".next",
  "installCommand": "cd ../.. && pnpm install --filter @kealee/m-permits-inspections...",
  "framework": "nextjs",
  "rootDirectory": "apps/m-permits-inspections"
}
```

---

### 5. **m-project-owner** (Project Owner Portal)

**Location:** `apps/m-project-owner/`

**vercel.json:**
```json
{
  "buildCommand": "cd ../.. && pnpm install --filter @kealee/m-project-owner... && pnpm build --filter @kealee/m-project-owner",
  "outputDirectory": ".next",
  "installCommand": "cd ../.. && pnpm install --filter @kealee/m-project-owner...",
  "framework": "nextjs",
  "rootDirectory": "apps/m-project-owner"
}
```

---

### 6. **m-ops-services** (Operations Portal)

**Location:** `apps/m-ops-services/`

**vercel.json:**
```json
{
  "buildCommand": "cd ../.. && pnpm install --filter @kealee/m-ops-services... && pnpm build --filter @kealee/m-ops-services",
  "outputDirectory": ".next",
  "installCommand": "cd ../.. && pnpm install --filter @kealee/m-ops-services...",
  "framework": "nextjs",
  "rootDirectory": "apps/m-ops-services"
}
```

---

## 🔍 Why os-admin "Isn't Showing" in Vercel

### **The Issue:** Alphabetical Ordering

In the Vercel root directory selector, folders are shown alphabetically:

```
apps/
├── m-architect/          ← Visible (starts with 'm')
├── m-inspector/          ← Visible (starts with 'm')
├── m-ops-services/       ← Visible (starts with 'm')
├── m-permits-inspections/← Visible (starts with 'm')
├── m-project-owner/      ← Visible (starts with 'm')
├── os-admin/             ⬆️ SCROLL UP TO SEE THIS! (starts with 'o')
└── os-pm/                ← Visible at bottom (starts with 'o')
```

**Solution:** **Scroll UP** in the Vercel dialog to see `os-admin`. It appears alphabetically between `m-project-owner` and `os-pm`.

---

## 📊 Quick Directory Structure Check

### Verify os-admin exists:

```bash
# PowerShell
cd "c:\Kealee-Platform v10"
ls apps\os-admin
```

**Expected output:**
```
Directory: C:\Kealee-Platform v10\apps\os-admin

Mode                 LastWriteTime         Length Name
----                 -------------         ------ ----
d-----         1/17/2026   12:00 PM                app
d-----         1/17/2026   12:00 PM                components
d-----         1/17/2026   12:00 PM                lib
d-----         1/17/2026   12:00 PM                public
-a----         1/17/2026   12:00 PM           xxxx package.json
-a----         1/17/2026   12:00 PM           xxxx vercel.json
-a----         1/17/2026   12:00 PM           xxxx next.config.ts
```

### Verify all Next.js apps:

```bash
ls apps\*\vercel.json
```

**Expected output:**
```
apps/m-architect/vercel.json
apps/m-ops-services/vercel.json
apps/m-permits-inspections/vercel.json
apps/m-project-owner/vercel.json
apps/os-admin/vercel.json          ← os-admin IS there!
apps/os-pm/vercel.json
```

---

## 🎯 How to Deploy os-admin on Vercel

### **Option 1: Manual Selection (Recommended)**

1. Go to: https://vercel.com/new
2. Import: `UseniSajor/kealee-platform-v10`
3. **In the "Root Directory" dialog:**
   - **Scroll UP** to see `os-admin` folder
   - Click on `os-admin`
   - Click "Continue"

4. **Configure Project:**
   ```
   Project Name: kealee-admin
   Root Directory: apps/os-admin (auto-filled)
   Framework: Next.js (auto-detected)
   ```

5. **Override Build Settings:**
   - Build Command:
     ```bash
     cd ../.. && pnpm install --filter @kealee/os-admin... && pnpm build --filter @kealee/os-admin
     ```
   
   - Install Command:
     ```bash
     cd ../.. && pnpm install --filter @kealee/os-admin...
     ```
   
   - Output Directory: `.next`

6. **Add Environment Variables** (see below)

7. **Click Deploy**

---

### **Option 2: Type the Path Directly**

If you can't find os-admin in the list:

1. In the "Root Directory" field, **manually type:**
   ```
   apps/os-admin
   ```

2. Press Enter or click outside the field

3. Vercel will validate and accept it

---

## 🔑 Environment Variables for os-admin

### Required Variables:

```env
# Railway API
NEXT_PUBLIC_API_URL=https://your-api-name.up.railway.app

# Supabase Auth
NEXT_PUBLIC_SUPABASE_URL=https://xxxxxxxxxxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Supabase Admin (for admin operations)
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Environment
NODE_ENV=production
```

### Where to Add in Vercel:

1. During initial setup: Click "Environment Variables" section
2. After deployment: 
   - Vercel Dashboard → Project → Settings → Environment Variables
   - Add each variable
   - Select: Production, Preview, Development
   - Click "Save"
   - Redeploy if already deployed

---

## 📁 Complete File Tree

```
kealee-platform-v10/
├── apps/
│   ├── m-architect/
│   │   ├── vercel.json          ✅ Vercel config
│   │   ├── package.json         ✅ App config
│   │   ├── next.config.ts       ✅ Next.js config
│   │   └── app/                 ✅ Pages
│   │
│   ├── m-ops-services/
│   │   ├── vercel.json          ✅
│   │   ├── package.json         ✅
│   │   └── ...
│   │
│   ├── m-permits-inspections/
│   │   ├── vercel.json          ✅
│   │   ├── package.json         ✅
│   │   └── ...
│   │
│   ├── m-project-owner/
│   │   ├── vercel.json          ✅
│   │   ├── package.json         ✅
│   │   └── ...
│   │
│   ├── os-admin/                ⭐ THIS IS THE ONE!
│   │   ├── vercel.json          ✅ Exists!
│   │   ├── package.json         ✅ Exists!
│   │   ├── next.config.ts       ✅ Exists!
│   │   ├── app/                 ✅ 15+ pages
│   │   ├── components/          ✅ UI components
│   │   └── lib/                 ✅ Utilities
│   │
│   └── os-pm/
│       ├── vercel.json          ✅
│       ├── package.json         ✅
│       └── ...
│
├── services/
│   └── api/                     (Railway - not Vercel)
│
└── packages/
    ├── database/                (shared package)
    ├── types/                   (shared package)
    └── ...
```

---

## ✅ Verification Checklist

### Before deploying os-admin:

- [ ] File `apps/os-admin/vercel.json` exists
- [ ] File `apps/os-admin/package.json` exists
- [ ] File `apps/os-admin/next.config.ts` exists
- [ ] Folder `apps/os-admin/app` exists with pages
- [ ] Railway API URL is ready
- [ ] Supabase credentials are ready
- [ ] Can see or type `apps/os-admin` in Vercel

### After selecting root directory:

- [ ] Root Directory shows: `apps/os-admin`
- [ ] Framework detected: `Next.js`
- [ ] Build command is correct (includes pnpm filter)
- [ ] Environment variables added
- [ ] Ready to deploy

---

## 🎯 Summary

### **The Answer:**

**os-admin IS in the Vercel project!**

**Location:** `apps/os-admin/`

**Configuration File:** `apps/os-admin/vercel.json`

**Why you can't see it:** It's alphabetically above the visible area in the Vercel dialog. **Scroll UP** to see it!

**Alternative:** Manually type `apps/os-admin` in the Root Directory field.

---

## 🚀 Quick Deploy Command

If you prefer CLI:

```bash
cd apps/os-admin
vercel --prod
```

(Requires Vercel CLI: `npm i -g vercel`)

---

**os-admin is ready to deploy! Just scroll up in the Vercel dialog to find it, or type the path manually.** 🎉
