# Knowledge graph and provenance

**Built (Phase 1):** the lineage graph `knowledge_lineage_edges` — `subject —relation→ object` with
relations DERIVED_FROM, GENERATED_FROM, VERSION_OF, SUPERSEDES, CORRECTS, REVIEWS, APPROVES, INPUT_TO,
REFERENCES, DEPICTS, VALIDATES, EXTRACTED_FROM; every edge records who/what made it and the generation
run. `traceLineage(id)` walks both directions and answers: what sources produced this, which agent and
model, which prompt version/hash, which tools, was it reviewed, was it approved, how many later artifacts
depend on it.

Example as recorded today for a delivered site plan:
`PGAtlas parcel (VALIDATED_STRUCTURED_DATA) ←GENERATED_FROM— SITE_PLAN (AI_GENERATED) ←APPROVES— professional review (HUMAN_REVIEWED)`
→ the plan is HUMAN_APPROVED and a TRAINING_CANDIDATE.

**Planned (Phase 2/9):** typed entities (`artifact_entities`) and relationships — Project, Parcel, Building,
Room, Assembly, Material, CostItem, Jurisdiction, Rule, Permit, Inspection, DrawingSheet, SiteFeature,
Utility, StormwaterFeature, Setback… with relations such as PROJECT_HAS_DRAWING, RULE_APPLIES_TO_PROJECT,
ESTIMATE_DERIVED_FROM_DRAWING, ACTUAL_COST_VALIDATES_ESTIMATE, HUMAN_CORRECTION_MODIFIES_GENERATION.
Conflicts (`knowledge_conflicts`, Phase 3) are stored, never resolved silently.
