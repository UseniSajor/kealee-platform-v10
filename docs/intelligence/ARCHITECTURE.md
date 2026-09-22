# Kealee Construction Intelligence — architecture

**Status: Phase 1 implemented (2026-09-22).** Phases 2–10 are designed here and not built.
Vocabulary, used precisely throughout: *ingested → indexed → retrievable → reviewed →
training candidate → training approved → dataset → evaluated → deployed.* Nothing in this
system is "trained" because it was embedded or recorded.

## Current-state findings (the audit, spec §37)

| Concern | What the repo already has | Decision |
|---|---|---|
| Vector retrieval | `packages/ai/src/rag` — `rag_documents` / `rag_chunks`, OpenAI embeddings, cosine in SQL (FLOAT8[]); `services/api/src/modules/rag` ingester; `PlatformKnowledge` model | Reuse for Phase 2; add provenance columns rather than a parallel store |
| Agent memory | `AgentSession`, `AgentMemory`, `IntelligenceRun`, `ProjectDecision`, `PropertyTwin`/`ProjectTwin` in `schema-src/intelligence/`; `@kealee/intelligence` (v30 loops) | Left as is. The registry POINTS at these rows; project memory (Phase 3) reads them |
| Event bus | `@kealee/core-events` — `EVENT_TYPES_V20`, `createEvent`, `StreamPublisher` (Redis Streams) | Knowledge events use the same dot-namespace and envelope; publishing is an injected sink |
| Prompts | `@kealee/agent-prompts` (code constants), `DesignBotEnterprise._buildConceptPrompt` | Phase 10 registry; until then generation runs record a prompt hash + version label |
| Documents | `Document` (base64 in `content`, `fileUrl`), `File`, `FileUpload` | Artifacts point at them (`sourceSystem='documents'`); bytes stay where they are |
| Site plans | `site_plan_*` persistence (sheets, revisions, approvals, evidence, audit) — the engine's own record | Deliveries and reviews become generation runs + lineage; the engine tables stay authoritative |
| Estimates / permits | `Estimate`, permit models under `schema-src/pm` | Adapters in later phases |
| RBAC | Clerk (`getClerkUser`, `requireCommandCenterApi`) | Retrieval (Phase 2) filters by `organizationId`/`projectId` + `retrievalEligibility` before ranking |
| Training | `services/ai-learning` (federated trainer, unused), `packages/shared-ai/training-pipeline` | Superseded by the dataset/eval design here; not wired |

The spec asked for `packages/intelligence/`; that name is taken by the v30 twin/loop layer, so the
new module is **`packages/knowledge` (`@kealee/knowledge`)**, schema domain `schema-src/knowledge/`.

## The five layers

```
A  RAW EVIDENCE        knowledge_artifacts (+versions, files)      immutable; a change is a new version
B  STRUCTURED KNOWLEDGE artifact chunks/regions/facts/entities      Phase 2 + 9 (extraction is versioned, confidence stored)
C  RETRIEVAL / MEMORY  embeddings, hybrid ranking, project memory   Phase 2 + 3 (reuses rag_chunks; authority in the rank)
D  DATASETS / EVAL     training_examples, datasets, eval suites     Phase 7 + 8
E  MODEL / AGENT       prompt registry, model registry, adapters    Phase 10
```

Cross-cutting from Phase 1: **provenance** (`knowledge_lineage_edges`), **generation records**
(`generation_runs/inputs/outputs`), **governance** (approval ladder, authority, training and retrieval
eligibility, confidentiality, secret redaction) and the **learning ledger** (`learning_events`).

## Integration map

```
site-plan engine (worker)  deliver_preliminary ──► recordSitePlanDelivery ──► GenerationRun + SITE_PLAN artifact
                           route_review (decided) ─► recordSitePlanReview ──► REVIEWS/APPROVES edge, approval ladder
concept generator (web)    /api/concept/generate ──► recordConceptGeneration ─► GenerationRun + DESIGN_CONCEPT + RENDERING
OS Architecture desk       reviewDesignConcept ────► recordConceptReview ─────► review edge, ladder
engine output folders      scripts/register-output-folders.ts ─► YIELD_STUDY / SITE_PLAN artifacts with PGAtlas parcels as sources
admin                      GET /api/admin/knowledge ─► corpus stats + learning ledger
```

Every hook is fire-and-forget and logs a miss (`[knowledge] !! … NOT recorded`); the customer's
deliverable never waits on the corpus.

## Lifecycle of a piece of knowledge

RAW → EXTRACTED → NORMALIZED → RETRIEVABLE → REVIEWED → (training eligibility) TRAINING_CANDIDATE →
TRAINING_APPROVED → DATASET → EVALUATED MODEL/AGENT. `KnowledgeArtifactStatus` carries the first five;
`TrainingEligibility` the next two; datasets and evaluations are Phase 7/8 tables.

## Phases

1. **Schema + artifact registry + provenance + generation records — DONE.**
2. Ingestion + artifact-aware chunking + embeddings + hybrid retrieval (extend `rag_chunks` with artifactId/version/region, authority, approval).
3. Project Intelligence Profile + `IntelligenceContext` (reads ProjectTwin/AgentMemory/ProjectDecision + registry).
4. Agent integration (every bot calls the context service; records a run).
5. Human feedback/corrections as first-class rows (`human_feedback`, `human_corrections`).
6. Workspace capture (Claude Code / Codex adapters → `workspace_sessions`).
7. Training-example promotion + Dataset Builder.
8. Evaluation suites/cases/runs.
9. Multimodal (drawing regions, photo metadata, visual embeddings).
10. Prompt registry, model registry, `TrainingProvider` adapters.
