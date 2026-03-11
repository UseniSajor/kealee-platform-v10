# ADR-001: Single Database with Shared Prisma Schema

**Status:** Accepted
**Date:** 2026-03-09
**Context:** v20 restructuring introduces 7 OS services that need data access

## Decision

All services share a single PostgreSQL database via the same Prisma schema (`packages/database/prisma/schema.prisma`). Services are logically separated by domain but physically share one database.

## Rationale

- Avoids distributed transaction complexity across service databases
- Maintains referential integrity via foreign keys (e.g., `projectId` links across domains)
- Prisma client generation is centralized — one `prisma generate` for all services
- Matches our current Railway deployment (single PostgreSQL instance)
- Migration path: can split databases later if scale requires it

## Consequences

- All services must coordinate on schema migrations
- Risk of coupling if services query each other's tables directly (mitigated by service API calls)
- Single point of failure for database (mitigated by Railway's managed PostgreSQL with replication)
