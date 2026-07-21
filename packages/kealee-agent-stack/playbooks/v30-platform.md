# Kealee Platform v30 — Agent Playbook

**Spec source:** `Kealee Platform Agents/v30/`

## Enable v30

```bash
KEALEE_V30_ENABLED=true
```

## API (services/api)

| Method | Path | Purpose |
|--------|------|---------|
| GET | `/v30/status` | Feature flag + version |
| POST | `/v30/intake` | 9-question form + IntakeBot analysis |
| GET | `/v30/intake/:projectId` | Fetch intake + package quote |
| POST | `/v30/project/:projectId/generate` | Run 10 bots in parallel |

## Code entry points

- `packages/kealee-agent-stack/src/v30/` — types, prompts, pricing, orchestrator
- `packages/database/prisma/schema.prisma` — `V30*` models
- `services/api/src/modules/v30/v30.routes.ts`

## Database

```bash
cd packages/database && npx prisma migrate deploy
```

Migration: `20260522120000_add_v30_models`
