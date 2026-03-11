# ADR-002: Digital Development Twin System (DDTS)

**Status:** Accepted
**Date:** 2026-03-09
**Context:** Projects span multiple phases (land, feasibility, permitting, construction, operations) with no unified lifecycle tracking

## Decision

Every project gets a Digital Twin (DigitalTwin model) at intake. The twin tracks lifecycle state, health score, KPIs, and active modules across all phases.

Three tiers:
- **L1 (Basic):** Health score + phase tracking (default for all projects)
- **L2 (Standard):** + KPI monitoring, snapshots, module activation
- **L3 (Enterprise):** + predictive analytics, real-time sensor data, AI-driven recommendations

## Rationale

- Provides a single source of truth for project health across all OS services
- State machine enforces valid phase transitions (INTAKE → LAND_ANALYSIS → ... → ARCHIVED)
- TwinEvents create a causality chain linking actions across services
- KPI-based health scoring (cost 30%, schedule 25%, quality 20%, risk 15%, safety 10%) gives instant project status

## Consequences

- Every OS service action should emit a TwinEvent
- Twin health recalculation runs on event triggers (not scheduled)
- Snapshots capture point-in-time state for auditing and rollback analysis
