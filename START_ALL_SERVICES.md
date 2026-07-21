# 🚀 Start All Kealee Services

## 📍 Dedicated Localhost URLs

Each service runs on its own port for independent development:

| Service | URL | Port | App |
|---------|-----|------|-----|
| **Kealee Development** | http://localhost:3005/development | 3005 | m-ops-services |
| **Kealee GC Operations** | http://localhost:3006/gc-services | 3006 | m-ops-services |
| **Kealee Permits** | http://localhost:5173/contractors | 5173 | m-permits-inspections |

---

## 🎯 Start Individual Services

### Development Services (Owner's Rep)
```powershell
cd apps\m-ops-services
pnpm dev:dev
# Opens on http://localhost:3005
# Visit: http://localhost:3005/development
```

### GC Operations Services
```powershell
cd apps\m-ops-services
pnpm dev:gc
# Opens on http://localhost:3006
# Visit: http://localhost:3006/gc-services
```

### Permits & Inspections
```powershell
cd apps\m-permits-inspections
pnpm dev
# Opens on http://localhost:5173
# Visit: http://localhost:5173/contractors
```

---

## 🚀 Start All Services At Once

**Open 3 separate terminals:**

**Terminal 1 - Development:**
```powershell
cd "c:\Kealee-Platform v10\apps\m-ops-services"
pnpm dev:dev
```

**Terminal 2 - GC Operations:**
```powershell
cd "c:\Kealee-Platform v10\apps\m-ops-services"
pnpm dev:gc
```

**Terminal 3 - Permits:**
```powershell
cd "c:\Kealee-Platform v10\apps\m-permits-inspections"
pnpm dev
```

---

## 📊 Service Access Matrix

### Development Services
- **Home:** http://localhost:3005/development
- **Services:** http://localhost:3005/development/services
- **Contact:** http://localhost:3005/development/contact
- **Admin:** http://localhost:3005/portal/development-leads

### GC Operations Services
- **Home:** http://localhost:3006/gc-services
- **Services:** http://localhost:3006/gc-services/services
- **Pricing:** http://localhost:3006/gc-services/pricing
- **Contact:** http://localhost:3006/gc-services/contact
- **Admin:** http://localhost:3006/portal/gc-ops-leads

### Permits & Inspections
- **Home:** http://localhost:5173/contractors
- **Services:** http://localhost:5173/contractors/services
- **Pricing:** http://localhost:5173/contractors/pricing
- **Contact:** http://localhost:5173/contractors/contact
- **Admin:** http://localhost:5173/portal/permit-leads

---

## 🗄️ Database & Tools

### Prisma Studio
```powershell
cd packages\database
npx prisma studio
# Opens on http://localhost:5555
```

---

## 🎨 Service Overview

| Port | Service | Target Audience | Color |
|------|---------|-----------------|-------|
| **3005** | Development | Owners, Investors | 🟠 Orange |
| **3006** | GC Operations | GCs, Builders | 🔵 Blue |
| **5173** | Permits | All (Contractors, Devs, Owners) | 🟢 Emerald |
| **5555** | Prisma Studio | Database Admin | ⚪ White |

---

## ✅ Verification

**After starting all services, verify:**

- [ ] http://localhost:3005/development loads (Development)
- [ ] http://localhost:3006/gc-services loads (GC Ops)
- [ ] http://localhost:5173/contractors loads (Permits)
- [ ] http://localhost:5555 loads (Prisma Studio)

---

## 🔄 Stop All Services

**Press Ctrl+C in each terminal** to stop the dev servers.

---

**Now each service has its own dedicated localhost port!** 🎉

- Development: Port 3005
- GC Operations: Port 3006 (dedicated!)
- Permits: Port 5173
