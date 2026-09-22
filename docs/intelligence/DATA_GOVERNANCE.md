# Data governance

- **Raw evidence is immutable.** Changing bytes creates a new `knowledge_artifact_versions` row; the head
  moves, history stays. Generated information never overwrites source evidence — it is a separate artifact
  linked GENERATED_FROM / DERIVED_FROM.
- **Approval ladder** (`KnowledgeApprovalStatus`): UNREVIEWED → AI_GENERATED → HUMAN_REVIEWED → HUMAN_APPROVED →
  PROFESSIONAL_SEALED → JURISDICTION_APPROVED (or REJECTED). `setApproval` refuses HUMAN_* and sealed/
  jurisdiction rungs from an `agent` actor and records the person.
- **Authority hierarchy** (`KnowledgeAuthority`, spec §24) is a column with a defined order so ranking can use
  it: approved government record > jurisdiction-issued > sealed professional > approved construction document >
  verified field measurement > human-reviewed Kealee final > project contract > manufacturer documentation >
  validated structured data > uploaded source document > AI-derived structured data > AI-generated draft >
  unverified inference. Law or project circumstance may override — it is a default, not a verdict.
- **Confidentiality / retention / retrieval eligibility** are explicit columns; retrieval (Phase 2) filters by
  organisation, project and eligibility before ranking. An agent never sees a project because its
  embeddings exist.
- **Training eligibility** — see TRAINING.md. Customer/project data is never promoted to an external
  provider's fine-tuning without a recorded policy decision.
- **Secrets** are scanned out of summaries, metadata, requests and tool records at write time.
- **Observability:** every registry write is a `learning_events` row; every hook logs a miss loudly; the worker
  also writes a `knowledge.record_failed` audit event when a delivery is not recorded.
- **Migrations are additive** (`20260921120000_knowledge_registry_phase1`: 12 enums, 10 tables, 30 indexes,
  14 FKs; every statement guarded). Applied to production 2026-09-22.
