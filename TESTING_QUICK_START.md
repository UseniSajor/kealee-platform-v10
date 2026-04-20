# E2E Testing — Quick Start Guide

## 1️⃣ Install

```bash
pnpm install
npx playwright install --with-deps
```

## 2️⃣ Run Tests

```bash
# All tests (headless, fast)
pnpm test:e2e

# Interactive UI (Playwright Inspector)
pnpm test:e2e:ui

# With browser visible (debug)
pnpm test:e2e:headed

# Step-by-step debug
pnpm test:e2e:debug

# View HTML report
pnpm test:e2e:report
```

## 3️⃣ Run Specific Tests

```bash
# Single file
npx playwright test tests/e2e/ai-concept.spec.ts

# Single test
npx playwright test -g "should display concept card"

# Match pattern
npx playwright test -g "checkout"
```

## 4️⃣ Prerequisites

Make sure services are running:

```bash
# Terminal 1: web-main
cd apps/web-main && pnpm dev

# Terminal 2: API
cd services/api && pnpm dev

# PostgreSQL & Redis should be running
```

## 5️⃣ What Gets Tested

✅ **AI Concept Flow** — View AI insights for projects
✅ **Cost Estimation** — Fill form, view pricing
✅ **Permit Service** — Permit intake and recommendations
✅ **Checkout** — Order placement (Stripe mocked)
✅ **Output** — View generated project recommendations
✅ **Error Handling** — System resilience under failures

## 6️⃣ CI/CD

Tests run automatically on:
- Push to `main` or `develop`
- Pull requests to `main`/`develop`

**View results:** GitHub → Actions → E2E Tests

## 📖 Full Documentation

See: **`tests/e2e/README.md`**

## 🆘 Troubleshooting

**Tests timeout?**
```bash
npx playwright test --timeout=60000
```

**Port in use?**
```bash
lsof -i :3024 && kill -9 <PID>
```

**Playwright issues?**
```bash
rm -rf ~/Library/Caches/ms-playwright
npx playwright install --with-deps
```

## ✅ Expected Results

- All 50+ tests pass
- Duration: ~5 minutes
- Green checkmark in CI/CD

---

**Status:** Ready to test! 🚀
