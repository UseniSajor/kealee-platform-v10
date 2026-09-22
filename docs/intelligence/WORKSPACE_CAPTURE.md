# Workspace capture (Phase 6 — designed, not built)

A normalised `WorkspaceSession` (provider, session id, repository, branch, task, prompts, context
references, model/version, responses, tool calls, files read/changed, patches, tests and results, human
feedback, accepted/rejected, commit SHA, PR, deployment and rollback results) with provider adapters
`claude/`, `codex/`, `kealee/`, `generic/`. Claude Code sessions are readable from the local JSONL
transcript; the adapter records only what policy permits (no secrets, no customer content).

Labels: a session is a **positive coding example** only after human acceptance + passing tests + merge +
successful deployment + no rollback (+ evaluation pass); failures stay EVAL_ELIGIBLE. Artifact types
AGENT_SESSION, CODE_CHANGE, CODE_REVIEW, COMMIT already exist in the registry enum.
