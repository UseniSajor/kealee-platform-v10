# Kealee v30 — zip2 delivery (Days 1–7 combined)

Extracted from `kealeev30 2.zip` (May 22, 2026). Use alongside `../` (first v30 zip).

| File | Purpose |
|------|---------|
| [README-START-HERE.md](./README-START-HERE.md) | Orientation |
| [KEALEE-v30-IMPLEMENTATION-GUIDE.md](./KEALEE-v30-IMPLEMENTATION-GUIDE.md) | Checklist + critical changes |
| [KEALEE-v30-COMPLETE-MASTER-SPEC.md](./KEALEE-v30-COMPLETE-MASTER-SPEC.md) | **Actionable build spec** — os-intake, os-ai-orch, Cursor prompts |
| [DELIVERY-SUMMARY.txt](./DELIVERY-SUMMARY.txt) | Delivery overview |

## Runnable implementation (this repo)

| zip2 spec | Code |
|-----------|------|
| os-intake | `packages/os-intake` |
| os-ai-orch | `packages/os-ai-orch` |
| API `/v30/*` | `services/api/src/modules/v30/v30.routes.ts` |
| web-main intake + generate | `apps/web-main/app/get-concept`, `/api/v30/*` |

Set `KEALEE_V30_PUBLIC_USER_ID` on the API service to a valid `User.id` for public `/get-concept` generation.
