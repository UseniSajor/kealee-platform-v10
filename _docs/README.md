# Kealee Platform v10 — Documentation

> These docs are the source of truth. AI tools (Cursor, Claude Code) read these before making changes.

## Files

| Document | What It Is |
|----------|-----------|
| [kealee-architecture.md](architecture/kealee-architecture.md) | **THE** reference. Platform overview, all 8 claws (config, events, workers, guardrails), event system, AI layer, Kealee Messenger, deployment, team scaling. |
| [claude-code-prompt.md](architecture/claude-code-prompt.md) | One prompt to paste into Claude Code that builds the entire claw system. |

## Quick Reference

### 8 Claws (Brain + Hands Combined)

| Claw | Domain | Key Workers |
|------|--------|-------------|
| A | Acquisition & PreCon | bid-engine, estimation |
| B | Contract & Commercials | change-orders, payments |
| C | Schedule & Field Ops | scheduler, visits, inspections |
| D | Budget & Cost Control | budget-tracker |
| E | Permits & Compliance | permit-tracker, qa-inspector |
| F | Docs & Communication | doc-generator, comms-hub, kealee-messenger |
| G | Risk & Predictions | predictive-engine, decision-support |
| H | Command & Automation | task-orchestrator, job-scheduler |

### Build Order
Phase 0 (Foundation) → 1 (A+D) → 2 (B+C) → 3 (E) → 4 (G) → 5 (F) → 6 (H) → 7 (Gateway) → 8 (Schema) → 9 (.cursorrules)
