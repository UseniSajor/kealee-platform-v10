# Kealee Google Play release status

## Android downloads

These are four separate Google Play applications. Each has a unique Android
application ID, web origin, audience, upload key, and signed app bundle.

| App | Package ID | Production origin | Bundle |
|---|---|---|---|
| Web Main | `com.kealee.app` | `https://kealee.com` | `apps/web-main/android/app-release-bundle.aab` |
| Project Owner | `com.kealee.projectowner` | `https://owner.kealee.com` | `apps/project-owner/android/app-release-bundle.aab` |
| Command Center | `com.kealee.commandcenter` | `https://command.kealee.com` | `apps/command-center/android/app-release-bundle.aab` |
| Admin | `com.kealee.admin` | `https://admin.kealee.com` | `apps/os-admin/android/app-release-bundle.aab` |

All projects compile and target Android API 36 with a minimum API of 21.
The AABs and upload-key credentials are intentionally ignored by Git.

## Implemented

- Bubblewrap 1.24.1 and Android build tooling
- PWA web manifests with Kealee icons
- Service-worker registration
- Trusted Web Activity projects
- Per-app upload keys and signed APK/AAB outputs
- `/.well-known/assetlinks.json` routes
- Railway certificate-fingerprint variables
- Privacy route for public Web Main and Project Owner experiences
- Kealee logo/nav icon in all four application shells

## Required release operations

Source readiness is complete. Publishing is a separate Google Play Console
operation and cannot be represented as complete until an authorized console
account performs it:

1. Back up each ignored `android.keystore` and
   `play-signing.local.json` in Kealee's encrypted credential vault.
2. Deploy the four web applications so their manifests and asset-link routes
   are live.
3. Create four Play Console applications and enroll each in Play App Signing.
4. Upload the matching AAB to an internal/closed test track.
5. Complete store listings, data-safety declarations, content ratings,
   testing requirements, and reviewer access.
6. Replace each asset-link fingerprint with or append the Play App Signing
   certificate fingerprint supplied by Play Console before production rollout.

Command Center and Admin should normally use closed/internal distribution or
Managed Google Play because they are privileged staff applications.

## Verification

- Four Next.js production builds completed successfully.
- Four signed AABs passed `jarsigner -verify`.
- Prisma schema validates and the CTC client was generated.
- Command Center and Project Owner pass `tsc --noEmit`.
- Admin's production build passes; its strict standalone type audit still
  reports pre-existing typing debt outside the Google Play integration.
