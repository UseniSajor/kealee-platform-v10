# Training data — eligibility, examples, datasets

**Built (Phase 1):** every artifact carries an explicit `trainingEligibility`
(UNKNOWN · NOT_ELIGIBLE · RETRIEVAL_ONLY · EVAL_ELIGIBLE · TRAINING_CANDIDATE · TRAINING_APPROVED · EXCLUDED).
Policy (`packages/knowledge/src/policies`): customer/project data defaults to RETRIEVAL_ONLY; RESTRICTED is
EXCLUDED; PUBLIC is EVAL_ELIGIBLE; a **Kealee-generated output becomes TRAINING_CANDIDATE only when a person
approves it** (HUMAN_APPROVED / PROFESSIONAL_SEALED / JURISDICTION_APPROVED); a rejected generation is
EVAL_ELIGIBLE (analysis, never a positive example). Nothing is ever set TRAINING_APPROVED by software.
Secrets (API keys, tokens, JWTs, database URLs, private keys, SSNs, credential assignments) are redacted
before storage.

**Phase 7 plan:** `training_examples` (task_type, instruction, input, retrieved_context, expected/actual/
corrected output, source artifacts, quality, review status, provenance), versioned `training_datasets`
with reproducible selection queries and isolated train/validation/test splits. High-value pairs: source →
accepted output; draft → human correction; estimate → actuals; proposed → approved site plan; permit package
→ jurisdiction comments; AI code → accepted tested commit. **Phase 10:** `TrainingProvider` adapters
(OpenAI, Anthropic where supported, local) export normalised datasets; fine-tuning only with an eval
benchmark, baseline, approved set and privacy checks.
