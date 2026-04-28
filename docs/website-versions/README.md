# Website Versioning

This directory contains point-in-time snapshots of key pages before significant redesigns.

## Convention

Each version folder is named: `vX.Y-YYYY-MM-DD/`

- **vX.Y** — semantic version (increment minor for redesigns, major for full overhauls)
- **YYYY-MM-DD** — date the snapshot was taken

## Snapshotted Files

Each version folder contains copies of these key files:

| Snapshot filename | Source |
|-------------------|--------|
| `homepage.tsx` | `apps/web-main/app/page.tsx` |
| `marketplace.tsx` | `apps/web-main/app/marketplace/page.tsx` |
| `concept-step1.tsx` | `apps/web-main/app/concept/page.tsx` |
| `concept-confirm.tsx` | `apps/web-main/app/concept/confirm/page.tsx` |
| `permits.tsx` | `apps/web-main/app/permits/page.tsx` |
| `nav.tsx` | `apps/web-main/components/nav.tsx` |

## Versions

| Version | Date | Notes |
|---------|------|-------|
| v1.0 | 2026-04-28 | Initial snapshot before marketplace redesign |
