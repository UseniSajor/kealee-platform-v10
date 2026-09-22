# Evaluations (Phase 8 — designed, not built)

Gold cases: buildable area, setback lookup, quantities, estimate divisions, plan conflicts, evidence
citation, no hallucinated dimensions, existing vs proposed, approved vs draft, jurisdiction-specific rules,
reproduce known site-plan logic, cost within thresholds, recognise when professional verification is required.
Metrics: accuracy, citation/provenance accuracy, numeric error, retrieval precision/recall, hallucination
rate, cost error, dimension error, classification accuracy, human acceptance rate.
No model, prompt, retrieval algorithm or agent version is promoted without a passing run recorded in
`evaluation_runs`; `learning_events.EVALUATION_COMPLETED` is already reserved for it.
The first candidates for gold cases are the engine's own certified-table checks and the site-plan QC
checklist (`packages/spatial-engine/src/review/checklist.ts`).
