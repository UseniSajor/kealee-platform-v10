# Kealee Data Flow

## Primary Execution Pipeline

```
User → Intake Form → CTA (Stripe) → Webhook → ProjectOutput → Queue → Worker → Output → Upsell
```

## Step-by-Step

1. **Intake** — User submits project details via `/intake/[projectPath]`
2. **Payment** — Stripe checkout session created; user pays
3. **Webhook** — `/api/webhooks/stripe` receives `checkout.session.completed`
4. **ProjectOutput** — Record created with type, status='pending'
5. **Queue** — BullMQ job enqueued (`project.execution`)
6. **Worker** — Job processor runs bot chain:
   - Fetch intake + DigitalTwin context
   - Run DesignBot → EstimateBot → PermitBot → ContractorBot
   - Save outputs to DB
   - Update ProjectOutput status='completed'
7. **Output** — User views results at `/concept/deliverable?intakeId=...`
8. **Upsell** — nextStep CTA shown (permit filing, contractor match, etc.)

## DigitalTwin Data Flow

- Created at: project creation, land→project, precon→project, PM project creation
- Updated at: every bot chain completion (TwinEvent recorded)
- Read by: bot chain (injected into all bot prompts)

## Key DB Tables

| Table | Purpose |
|-------|---------|
| `public_intake_leads` | Intake form submissions |
| `project_outputs` | Bot-generated deliverables |
| `bot_design_concepts` | DesignBot output |
| `bot_estimate_line_items` | EstimateBot line items |
| `permit_cases` | PermitBot output |
| `digital_twins` | Live project state |
| `twin_events` | DigitalTwin history |
| `contact_inquiries` | Lead captures (contractor, design-pro) |

## OS Service → Queue Integration

All OS services MUST:
1. Create `ProjectOutput` with correct type
2. Enqueue `project.execution` job with `projectOutputId`

Services that do this:
- `os-feas`: feasibility GO decision → estimate ProjectOutput
- `os-land`: land conversion → project execution
- `os-ops`: service request with projectId + qualifying category
