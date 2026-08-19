# Week 5 Smoke Test (Local)

## Goal
Verify **no 404s**, pages render, and build succeeds for Week 5 management/execution interfaces.

---

## 1) Start services

From repo root:

```powershell
docker-compose up -d
pnpm dev
```

---

## 2) os-admin route checks (browser)

Open and confirm you see a page (not 404):

### Core
- `http://localhost:3002/dashboard`
- `http://localhost:3002/orgs`
- `http://localhost:3002/users`

### New os-admin tabs
- `http://localhost:3002/financials`
- `http://localhost:3002/disputes`
- `http://localhost:3002/automation`
- `http://localhost:3002/monitoring`
- `http://localhost:3002/jurisdictions`
- `http://localhost:3002/project-managers`
- `http://localhost:3002/analytics`
- `http://localhost:3002/settings`

### Execution surfaces (currently under os-admin; planned to become os-pm)
- `http://localhost:3002/pm`
- `http://localhost:3002/pm/tasks`
- `http://localhost:3002/pm/tasks/test-1`
- `http://localhost:3002/pm/sops`
- `http://localhost:3002/pm/clients`
- `http://localhost:3002/pm/reports`

---

## 3) Production build check

```powershell
cd apps/os-admin
pnpm build
```

Expected: **build succeeds** (Next.js prints routes list).

