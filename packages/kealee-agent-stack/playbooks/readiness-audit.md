# Kealee Blocking Launch Readiness Audit

This playbook is the tracked template for the internal Agent Ops readiness audit.
Actual audit memory, reports, screenshots, and JSON summaries belong in the local
Obsidian vault configured by `OBSIDIAN_VAULT_PATH` and are not tracked in git.

## Agents

1. Build/Types QA
   - Verify package install health, ambient type roots, TypeScript, build, broken imports, and launch-blocking tests.
   - Output blockers with file references and acceptance criteria.

2. Website Funnel QA
   - Smoke `/`, `/concept`, concept details/contact/confirm, service pages, pricing/contact pages, mobile layout, CTA consistency, lead capture, and checkout handoff.
   - Output route-level findings with reproduction steps.

3. Sales Copy QA
   - Review positioning consistency, pricing clarity, CTA clarity, and market-message fit.
   - Output high-impact conversion fixes with owner and acceptance criteria.

4. Trust/Compliance QA
   - Review trust signals, policy/compliance gaps, customer-risk language, and handoff clarity.
   - Output launch blockers and mitigations.

5. Agent Ops QA
   - Inventory KeaBots and agent surfaces, orchestration contracts, rate/cost guardrails, audit logging, and human handoff points.
   - Output missing contracts and operational controls.

## Required Output

- Score from 0-100.
- Blockers first, then high-impact conversion fixes.
- Owner, route/file reference, and acceptance criteria for every actionable finding.
- Structured JSON summary plus Markdown report written to Obsidian.
