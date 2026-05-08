# Orchestration reports

`pnpm run orchestrate:launch` (runs `node scripts/orchestrate-launch.mjs`) writes **`latest.json`** here after each run.

Fields include timestamps, `API_URL`, per-phase status, exit codes, and short notes.

CLI: `pnpm run orchestrate:launch -- --skip-preflight` (etc.). Use **`pnpm run orchestrate:launch+prep`** or **`--with-marketing-prep`** to run `setup:marketing` after smoke when bash is available. Set **`ORCHESTRATE_WITH_MARKETING_PREP=true`** in CI for the same behavior.

To run the full bash launch-prep chain (checklists, marketing prep, etc.), use **`pnpm run launch:all`** from Git Bash or WSL — that is separate from this orchestrator.

SESSION 12 smoke and production deploy promotion remain manual gates per platform rules.
