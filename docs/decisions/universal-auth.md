# Universal Auth (Phases 1–3)

## Auth hub
- **Login:** `https://kealee.com/auth/login?next=<return-url>&email=`
- **Account complete:** `https://kealee.com/auth/complete`
- Env: `NEXT_PUBLIC_AUTH_HUB_URL` (defaults to `https://kealee.com/auth`)

## Intake linking
- `metadata.linkedUserId` + `form_data.linkedUserId` on claim/magic-link/callback
- Optional DB column: run `packages/database/prisma/migrations/manual/20260526_intake_user_id.sql`

## Deliverable email
- `POST /api/emails/deliverable-ready` — all paid intake types (replaces concept-only for generation path)

## Upsells
- `@kealee/core-rules` → `getBuildPathUpsells({ sourceProjectPath, fromIntakeId })`
- Always includes estimate + permit; structural paths primary-upsell `professional_drawings`

## Entitlements
- `GET /api/entitlements` on portal-owner — products + apps for signed-in user

## Pro apps
- `m-estimation`, `m-permits-inspections` redirect unauthenticated users to auth hub
