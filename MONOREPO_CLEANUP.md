# Kealee Platform Monorepo Cleanup & Architecture Guide

**Status**: Ongoing cleanup as of 2026-07-07

## ✅ Completed Cleanups

### Dead Code Removal
- ✅ **Removed `packages/core-auth`** (unused; use `@kealee/auth` instead)
- ✅ **Deleted `apps/portal-admin`** (orphaned: only .tsbuildinfo cache, no code)
- ⏳ **Archived: `_archived-apps/os-pm-merged-to-marketplace`** (flagged for removal)
- ⏳ **Archived: `website-versions/v1`** (legacy, flagged for removal)

### Dependency Standardization
- ✅ **Unified `@anthropic-ai/sdk` → ^0.74.0** across 5 packages
- ✅ **Unified `@prisma/client` → ^5.22.0** across 3 packages
- ✅ **Standardized `zod` → ^3.22.4** within v3 ecosystem
- ⚠️ **Note**: packages/ai and packages/ui use zod ^4.3.6 (langchain compatibility)

### Duplicate Dependencies
- ✅ **Removed duplicates from `@kealee/core-llm`** and `@kealee/core-bots`

## Source of Truth — APIs

### Active API
**`services/api`** (Fastify) — PRIMARY, AUTHORITATIVE
- Location: `services/api/`
- Entry point: `services/api/src/index.ts`
- Build output: `services/api/dist/index.js`
- Status: Production-ready, handles all backend business logic
- Root start script: `"start": "cd services/api && node dist/index.js"`
- Used by: Command Center, Portals, Mobile apps

### Legacy API (DO NOT USE)
**`apps/api`** (Express-based) — DEPRECATED
- Status: Legacy, kept for reference only
- No longer deployed or maintained
- Do NOT add new features here
- Migration: Any code should move to `services/api`

### Web Frontend (Next.js)
**`apps/web-main`** — Primary marketing & intake web app
- Entry: `apps/web-main/app/`
- Build: Standalone Next.js server
- Deployment: Railway (production)

## Package Recommendations

### Core Utilities (USE THESE)
| Package | Purpose | Status |
|---------|---------|--------|
| `@kealee/auth` | Supabase auth, used by 5+ services | ✅ Active |
| `@kealee/database` | Prisma schema & client | ✅ Active |
| `@kealee/core-llm` | LLM provider routing | ✅ Active |
| `@kealee/core-agents` | Agent orchestration | ✅ Active |
| `@kealee/observability` | Logging & monitoring | ✅ Active |

### DO NOT USE
| Package | Reason |
|---------|--------|
| `@kealee/core-auth` | Unused, replaced by `@kealee/auth` |
| `@kealee/core-config` | Unused, exports from src/ as fallback |

## Package Count

**Current:** 126 packages
- **Apps** (21): web-main, portals, mini-apps
- **Packages** (59): core utilities, services, shared code
- **Services** (27): APIs, workers, automation
- **Bots** (19): AI bot implementations

**Consolidation opportunity:** 19 `core-*` packages could reduce to 4-5 logical domains

## Next Steps (MEDIUM Priority)

1. **Documentation** (in progress)
   - [ ] Create `ARCHITECTURE.md` for system overview
   - [ ] Document service-to-service API contracts
   - [ ] Add deployment runbooks for each service

2. **Code Consolidation**
   - [ ] Consider merging `core-*` packages into logical domains
   - [ ] Remove placeholder service directories (marketing-cron-* shells)
   - [ ] Archive or delete legacy website-versions/v1

3. **Testing**
   - [ ] Add integration tests between services
   - [ ] Verify package boundaries (no circular deps)

## Build & Dependency Health

**Last audit:** 2026-07-07
- Duplicate dependencies: **FIXED** (3 removed)
- Broken exports: **FIXED** (core-config updated)
- Version conflicts: **FIXED** (25 packages standardized)
- Unused packages: **CLEANED** (core-auth removed)

**Monorepo Status:** HEALTHY ✅
