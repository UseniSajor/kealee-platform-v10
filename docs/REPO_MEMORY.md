# Kealee Platform Repository Memory

This document contains core architectural principles, identity, and system-wide design patterns for the Kealee Platform. All developers and AI agents must read and adhere to these guidelines.

---

## 1. System Identity
Kealee is a **construction operating system** designed to turn complex customer intake into design guidance, pricing/estimates, permit guides, contractor bid packages, project management tasks, and financing routes. 

It acts as an orchestrator between homeowners, developers, municipalities, and contractors, removing friction from residential and light commercial development.

---

## 2. The Source of Truth: Digital Twin
- **The DigitalTwin is the absolute source of truth** for all projects in Kealee.
- All files, estimates, permits, layouts, decisions, and messages are represented within the DigitalTwin structure (represented in the database and active state).
- **Core Rule:** All automation bots, estimators, permit handlers, and AI agents **must read and write project state exclusively through the DigitalTwin API or database models**. Do not read/write from detached components or build isolated storage models.

---

## 3. Version 30: Loop Orchestration
Kealee v30 introduces a robust, event-driven loop orchestration system. 

### No Isolated Actions
> [!IMPORTANT]
> **Do not build isolated, one-off bot actions.**
> Every automation or agent task must run within a structured, repeatable Loop.

### The Canonical Loop Lifecycle
Every automation loop follows this strict lifecycle:

```
Event ➔ Loop Router ➔ Agent Executor ➔ DigitalTwin Update ➔ Deliverable Update ➔ User/Admin Decision ➔ Next Event
```

1. **Event Trigger:** A project update or user action publishes an `AutomationEvent` (e.g. `PROJECT_CREATED`, `INTAKE_UPDATED`, `PHOTO_UPLOADED`, etc.).
2. **Loop Router:** The `LoopRouter` captures the event, determines the correct `LoopType`, runs checks, and initiates a `LoopRun` with an active `LoopStep`.
3. **Agent Executor:** The appropriate domain agent (e.g. `FeasibilityAgent`, `EstimateAgent`, `PermitAgent`) executes. It receives the Digital Twin context, queries models, and returns a structured output contract.
4. **DigitalTwin Update:** The agent's output updates the project's Digital Twin (represented in database schema updates and state documents).
5. **Deliverable Update:** Updated designs, drawings, estimates, or permit packages are regenerated and updated.
6. **User/Admin Decision:** If confidence is high, the loop completes or prompts the customer for a decision. If confidence is low or risks are high, it flags for Admin Review, blocking automatic progression.
7. **Next Event:** A user/admin decision or completion event triggers the next stage in the pipeline.

---

## 4. Canonical Loop Types
Make sure to map automation logic to one of these types:
- `intake_refinement`: Scopes goals, site characteristics, and homeowner inputs.
- `estimate_revision`: Calculates and adjusts pricing using `V30PricingFormula`.
- `permit_correction`: Audits building codes, structural changes, and city comments.
- `contractor_bid`: Packages documents and collects contractor bid inputs.
- `project_management`: Tracks milestones, tasks, and progress.
- `developer_feasibility`: Performs zoning, geographic, and building code analyses.
- `finance_review`: Evaluates loan paths, budgets, and equity.
- `admin_review`: Interventions and overrides by human system operators.
