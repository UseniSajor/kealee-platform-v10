# ADR-003: Bot vs Service Layer Separation

**Status:** Accepted
**Date:** 2026-03-09
**Context:** 13 KeaBots provide AI-powered automation but must not replace the system-of-record services

## Decision

Two distinct layers:
- **Layer 1 (OS Services):** Own data, enforce business rules, are the system of record
- **Layer 2 (KeaBots):** Orchestrate, assist, and monitor — call OS service APIs via HTTP, never access the database directly

## Rationale

- Prevents bots from bypassing business rules and validation in services
- Enables bots to be updated/replaced independently of services
- Clear ownership: if data is wrong, it's a service bug; if recommendations are wrong, it's a bot bug
- Bots can be disabled without affecting core platform functionality

## Key Separation: GC Bot vs Construction Bot

- **KeaBot GC:** Business operations (bids, sub coordination, compliance, crew scheduling)
- **KeaBot Construction:** Execution state (progress, dependencies, inspections, daily logs)

This split prevents a single bot from becoming too broad and ensures domain expertise.

## Consequences

- Bots need HTTP client to call service APIs (adds latency vs direct DB)
- Bot tools must map 1:1 to service API endpoints
- Handoff protocol enables cross-domain bot routing without losing context
