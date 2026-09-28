# Qwen — Kealee's internal model

How the platform uses models, and how Qwen is trained to do more of the work.

## How a paid bot is produced (`KEALEE_BOT_MODE=engine-first`, the default)

1. **Kealee's engines** compute the deliverable — costs from the assembly
   library, zoning and permits from the jurisdiction data, narratives from the
   order (`packages/kealee-agent-stack/src/v30/model-free/`). Every number comes
   from here. This runs with no model at all.
2. **Qwen** (internal, self-hosted) polishes narrative prose and drafts what the
   engines cannot: ops copy, a first pass on a scope with no cost recipe.
   A rewrite that changes any number is rejected (`numbersPreserved`).
3. **Claude** escalates: complex reasoning, and whenever Qwen is off, fails or
   returns something the guards reject.
4. What nothing can produce goes to staff (`requiresHumanFulfillment`); a
   model's draft rides along for them. Contractor recommendations are never
   given to a model.

Claude, chat and the other Claude features of the platform are unchanged.
`KEALEE_BOT_MODE=model-first` restores the original model-led bots.
`KEALEE_MODEL_FREE=true` turns every model off.

| Variable | Meaning |
|---|---|
| `INTERNAL_LLM_ENABLED=true` | Use Qwen |
| `INTERNAL_TEXT_BASE_URL` | Its OpenAI-compatible endpoint, e.g. `http://gpu-host:8010/v1` |
| `INTERNAL_TEXT_MODEL` | Model or adapter name served there (`Qwen/Qwen3-8B`, `kealee-v1`) |
| `INTERNAL_API_KEY` | Bearer token, if the server wants one |
| `ANTHROPIC_API_KEY` | Claude, the escalation model |
| `KEALEE_CLAUDE_ASSIST=false` | Qwen only — never escalate |
| `KEALEE_NARRATIVE_POLISH=off` | Keep Kealee's narrative text verbatim |

## Serving Qwen

On any GPU host (one L4/A10 runs an 8B model; an A100/L40S is comfortable):

```bash
pip install vllm
vllm serve Qwen/Qwen3-8B --port 8010 --max-model-len 16384            # base model, usable today
vllm serve Qwen/Qwen3-8B --port 8010 --enable-lora \
  --lora-modules kealee-v1=training/qwen/adapters/kealee-v1            # after training
```

Then set `INTERNAL_LLM_ENABLED=true`, `INTERNAL_TEXT_BASE_URL`, `INTERNAL_TEXT_MODEL`
on the worker and os-ai-orch services.

## Training loop

Every bot result — and every model call inside it — is recorded in the
knowledge registry by the worker (`services/worker/src/v30/knowledge.ts`).

1. **Approve.** A reviewer accepts or rejects a run:
   `POST /api/admin/knowledge/runs/:runId {"disposition":"accepted"}`.
   Only accepted runs become training candidates. Nothing trains on
   unreviewed output.
2. **Export.** `pnpm tsx training/qwen/export-sft.ts` → `data/train.jsonl`,
   `eval.jsonl` (10% held out), `negatives.jsonl` (guard- or person-rejected),
   `manifest.json`. White-label tenants are never exported; addresses and
   contact fields are stripped.
3. **Train.** `python training/qwen/train_lora.py --out training/qwen/adapters/kealee-v1`
   (LoRA; refuses to run on fewer than 50 approved examples).
4. **Evaluate.** Serve the adapter, then
   `pnpm tsx training/qwen/eval.ts --model kealee-v1`. It runs the held-out set
   through the adapter and Claude and scores JSON validity, key recall, number
   fidelity and the rewrite guard. Exit 0 = within tolerance of Claude on every
   metric.
5. **Promote.** Only on a passing report: set `INTERNAL_TEXT_MODEL=kealee-v1`.
   Claude remains the escalation either way.

## What to expect, honestly

- Where Kealee's engines compute the answer, quality does not depend on the
  model at all.
- A base Qwen polishes prose and drafts ops copy well; it trails Claude on long
  reasoning and vision. The eval gate is how that gap is measured per task.
- Fine-tuning on approved Kealee work narrows the gap on Kealee's own tasks.
  It will not make Qwen a general match for Claude, which is why Claude stays in
  the loop as the escalation.
