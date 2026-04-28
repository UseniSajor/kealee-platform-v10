# Kealee Bot System

## Bot Chain (in order)

| Stage | Bot | Output |
|-------|-----|--------|
| 1 | DesignBot | BotDesignConcept: renders, style, materials |
| 2 | EstimateBot | BotEstimateLineItem[]: itemized cost estimate |
| 3 | PermitBot | PermitCase: jurisdiction, requirements, path |
| 4 | ContractorBot | Contractor match recommendation + CTA |

## Required Output Fields (all bots)

Every bot response MUST include:
- `summary` — plain-language description
- `recommendations` — action items
- `nextStep` — single recommended action
- `conversion_product` — upsell product slug
- `confidence` — 0–100 score

## DCS Gate

- Minimum threshold: 60 (DCS_MIN_THRESHOLD)
- If DCS < 60 → return 422 DCS_GATE_FAILED before running chain
- Implemented in `bots.chain.routes.ts`

## DigitalTwin Injection

- `runChain()` fetches DigitalTwin before first bot
- Twin context injected into all bot user prompts via `buildTwinSection(input)`
- Production: throws if project has no DigitalTwin
- Dev: warns and continues

## Live Context

- All bots receive `projectId` + `address`
- Live DB lookup: Parcel + ZoningProfile injected into prompts
- Static RAG is fallback only (never primary)

## DB Persistence (with retry)

- `BotDesignConcept.create` — 3-attempt exponential backoff
- `BotEstimateLineItem.createMany` — 3-attempt exponential backoff
- `PermitCase.create` — 3-attempt exponential backoff
- `dbCreateRun` / `dbCompleteRun` / `dbFailRun` — retry + structured logging

## File Locations

- `services/api/src/bots/bots.chain.ts` — runChain(), bot orchestration
- `services/api/src/bots/bots.chain.routes.ts` — HTTP endpoints + DCS gate
- `services/api/src/utils/db-retry.ts` — retry helper
