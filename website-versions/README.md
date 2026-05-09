# Website version archive (`website-versions`)

Snapshots of **`apps/web-main`** are stored here whenever the public marketing site changes in a meaningful way (navigation, IA, homepage, product catalog templates, global styles, etc.).

## Layout

```
website-versions/
  README.md              ← this file
  snapshot-web-main.ps1 ← run to save the current tree into the next vN folder
  v1/                   ← full copy of apps/web-main (minus heavy/generated dirs)
  v2/
  ...
```

- **Active development** stays in `apps/web-main`.
- **`vN/`** is a point-in-time copy you can diff against or restore from manually (or with git).

## When to create a new version

Create a new snapshot when any of these change in a significant way:

- Global layout, nav, footer, or design tokens / Tailwind theme
- Homepage or primary funnels (`/concept`, product index, milestone pay)
- Cross-cutting components under `apps/web-main/src`, `components`, or `app/`

Minor copy tweaks or bugfixes do not require a new folder unless you want a labeled checkpoint.

## How to snapshot (Windows)

From the **repo root**:

```powershell
.\website-versions\snapshot-web-main.ps1
```

Or from this directory:

```powershell
.\snapshot-web-main.ps1
```

The script picks the next free `vN` (`v1`, `v2`, …), copies `apps/web-main` into `website-versions/vN`, and skips `node_modules`, `.next`, `dist`, build caches, etc.

## Optional metadata

After snapshotting, you may append one line to this README under **Version log**:

`- **v3** — YYYY-MM-DD — short note (e.g. “New nav + catalog filter”)`

---

### Version log

- **v1** — Initial archive folder + first snapshot of current `apps/web-main`.
