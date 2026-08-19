# 🗄️ Database Migration Guide

**Quick Reference for Running Prisma Migrations**

---

## 📍 Current Location

You're in the **root directory** (`C:\Kealee-Platform v10`). Database migrations need to be run from the correct package directory.

---

## ✅ Correct Commands

### **Option 1: From API Service** (Recommended)

```powershell
cd services\api
pnpm db:migrate
```

This runs: `cd ../database && pnpm prisma migrate dev`

### **Option 2: From Database Package** (Direct)

```powershell
cd packages\database
pnpm db:migrate
```

Or directly:
```powershell
cd packages\database
pnpm prisma migrate dev
```

### **Option 3: From Root** (If workspace script exists)

```powershell
# Check if root package.json has db:migrate script
pnpm db:migrate
```

---

## 🔧 Available Migration Commands

### **Development Migrations**

```powershell
# Create and apply migration
cd packages\database
pnpm prisma migrate dev

# Or from API service
cd services\api
pnpm db:migrate
```

### **Production Migrations**

```powershell
cd packages\database
pnpm prisma migrate deploy
```

### **Other Useful Commands**

```powershell
# Check migration status
cd packages\database
pnpm prisma migrate status

# Reset database (WARNING: Deletes all data)
cd packages\database
pnpm prisma migrate reset

# Push schema without migration (development only)
cd packages\database
pnpm prisma db push

# Open Prisma Studio (database GUI)
cd packages\database
pnpm prisma studio
```

---

## 📂 Project Structure

```
Kealee-Platform v10/
├── packages/
│   └── database/          ← Prisma schema and migrations here
│       ├── prisma/
│       │   ├── schema.prisma
│       │   └── migrations/
│       └── package.json   ← Has db:migrate script
├── services/
│   └── api/               ← API service
│       └── package.json   ← Has db:migrate script (calls database package)
└── package.json           ← Root package.json
```

---

## 🚀 Quick Start

**To run migrations right now:**

```powershell
# Navigate to database package
cd packages\database

# Run migration
pnpm prisma migrate dev
```

**Or from API service:**

```powershell
# Navigate to API service
cd services\api

# Run migration (it will cd to database package automatically)
pnpm db:migrate
```

---

## ⚠️ Common Issues

### **Issue: "db:migrate is not recognized"**

**Solution:** You're trying to run it as a direct command. Use `pnpm db:migrate` or `npm run db:migrate` instead.

### **Issue: "Cannot find module '@prisma/client'"**

**Solution:** Run `pnpm install` in the database package first:
```powershell
cd packages\database
pnpm install
```

### **Issue: "DATABASE_URL not set"**

**Solution:** Create `.env` file in `packages/database/`:
```bash
DATABASE_URL="postgresql://user:password@localhost:5432/kealee"
```

---

## 📝 Migration Workflow

1. **Make schema changes** in `packages/database/prisma/schema.prisma`
2. **Create migration:**
   ```powershell
   cd packages\database
   pnpm prisma migrate dev --name your_migration_name
   ```
3. **Review migration** in `packages/database/prisma/migrations/`
4. **Apply to production:**
   ```powershell
   pnpm prisma migrate deploy
   ```

---

## 🔍 Verify Migration

```powershell
# Check migration status
cd packages\database
pnpm prisma migrate status

# View database in Prisma Studio
pnpm prisma studio
```

---

**Last Updated:** January 2026  
**Prisma Version:** Check `packages/database/package.json`




