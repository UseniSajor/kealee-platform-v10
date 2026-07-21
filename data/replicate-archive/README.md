# Replicate generation archive

Every completed Replicate image/video job is mirrored here (local dev) and in Supabase bucket `replicate-archive`.

| Path | Purpose |
|------|---------|
| `manifest.jsonl` | Append-only index (one JSON object per line) — safe to commit for training metadata |
| `manifests/{predictionId}.json` | Full manifest per prediction |
| `media/{predictionId}/*` | Binary outputs (large; gitignored by default) |

Set `REPLICATE_ARCHIVE_SAVE_LOCAL=false` to skip local writes. On Vercel, only Supabase storage is used.

Create the `replicate-archive` bucket in Supabase (private recommended; service role uploads).
