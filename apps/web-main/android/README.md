# Kealee — Android / Google Play

This Bubblewrap project packages `https://kealee.com/` as a
Trusted Web Activity.

## Identity

- Package ID: `com.kealee.app`
- Target SDK: Android 16 / API 36
- Minimum SDK: API 21
- Web origin: `https://kealee.com`
- Manifest: `https://kealee.com/site.webmanifest`
- Digital Asset Links: `https://kealee.com/.well-known/assetlinks.json`

## Release build

1. Generate the upload key once:

   `node scripts/generate-play-upload-key.mjs`

2. Back up `android.keystore` and `play-signing.local.json` in Kealee's
   encrypted credential vault. Neither file is committed.
3. Run `bubblewrap build` in this directory and enter the locally stored
   passwords when prompted.
4. Upload `app-release-bundle.aab` to Play Console and enable Play App Signing.
5. Add the Play App Signing SHA-256 certificate fingerprint to
   `ANDROID_SHA256_CERT_FINGERPRINTS` in the Project Owner deployment. Keep the
   upload-key fingerprint there too, comma-separated.
6. Redeploy and verify Digital Asset Links before promotion beyond internal
   testing.

The package ID cannot be changed after the first Play release.
