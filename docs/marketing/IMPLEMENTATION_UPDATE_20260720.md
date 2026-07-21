# Marketing Implementation Update — 2026-07-20

This update supplements `IMPLEMENTATION_STATUS.md`. The shared workspace sandbox
refused updates to existing files while another terminal session was active, so
this delta records the current verified state without overwriting concurrent work.

## Newly completed

- [x] Added the additive canonical marketing data migration. Applying it to a
  local/linked Supabase database and running advisors remain pending.
- [x] Added deterministic contact email/phone/domain normalization.
- [x] Added authoritative lead scoring with score, grade, reasons, recommended
  products, next action, and human-review decision.
- [x] Added deterministic Revenue Product Catalog matching and express-scope
  exclusions.
- [x] Added a centralized outreach-policy decision service covering approval,
  suppression, opt-out, bounce, complaint, purchase, holds, duplicates, consent,
  send limits, and send windows.
- [x] Added canonical idempotent lead/contact ingestion with first-touch
  attribution.
- [x] Added an optional Apollo API client with environment configuration,
  pagination, bounded retries, rate-limit handling, timeouts, and fail-closed
  missing credentials.
- [x] Added focused foundation and Apollo tests.

## Still incomplete from this slice

- [ ] Wire the existing marketing capture route to canonical ingestion and the
  outreach policy. The sandbox refused edits to the active route; no overwrite
  was forced.
- [ ] Persist consent at capture instead of accepting it only as request context.
- [ ] Add suppression database lookups to the capture and send paths.
- [ ] Implement Apollo import worker, persisted cursor, audience rules, import
  cap, retention, health, and audit log.
- [ ] Apply and validate the migration against Supabase.
- [ ] Add authenticated staff policies after verifying the auth-user-to-org
  membership mapping.
- [ ] Continue all remaining items in `IMPLEMENTATION_STATUS.md`.

## Verification

- `marketing-foundation.test.ts`: 6/6 passed.
- Full `web-main` typecheck with a 4 GB heap completed analysis but failed on
  existing Intelligence Loop routes, marketing workspace typing, and Balmoral
  scripts. No emitted error referenced a new marketing foundation file.

