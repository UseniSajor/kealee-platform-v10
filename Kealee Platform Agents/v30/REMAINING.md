# Kealee v30 — remaining work

**Last updated:** 2026-05-22

## Implemented in repo

| Area | Status |
|------|--------|
| Wired bots + canonical DesignBot | ✅ |
| Replicate for v30 imagePrompts (not Pascal) | ✅ `docs/system/REPLICATE-VS-PASCAL.md` |
| portal-admin live prompt PATCH | ✅ `apps/portal-admin` |
| portal-white-label | ✅ `apps/portal-white-label` |
| Command Center bridge doc API | ✅ `GET /v30/command-center/bridge` |
| Traffic → `/get-concept` when flag on | ✅ hero, final CTA, `/concept` redirect |
| DB prompt overrides | ✅ `resolveV30SystemPrompt` |
| Ops scripts | ✅ `pnpm v30:prod-rollout`, `v30:setup-check`, `v30:smoke` |

## Production ops (run on live Supabase / Vercel / Railway)

```bash
pnpm v30:prod-rollout
# or: pnpm v30:migrate && pnpm v30:setup-check && pnpm v30:smoke --api <api> --web <web>
```

Set on **all live apps**:

```bash
KEALEE_V30_ENABLED=true
NEXT_PUBLIC_KEALEE_V30_ENABLED=true
KEALEE_V30_PUBLIC_USER_ID=<User.id>
ANTHROPIC_API_KEY=...
KEALEE_V30_LLM_ENABLED=true
REPLICATE_API_TOKEN=...          # required for renders
INTERNAL_API_URL=<railway-api>
```

## Optional next

- [ ] Poll Replicate predictions → fill `renderUrls` on concept automatically
- [ ] portal-admin auth + audit log on prompt save
- [ ] Custom domain routing for white-label partners
