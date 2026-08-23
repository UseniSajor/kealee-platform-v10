# Site plan reference material

Drop files here. This is the one place I look for ground truth about what a
Prince George's County site plan must actually contain.

## Why this directory exists

The sheet renderer currently draws from the sheet schedule in the original
brief plus general civil drafting convention — line weights, north arrow,
graphic scale, title block, revision table. That is *plausible*. It has never
been checked against a real approved plan or the county's own submission
requirements.

Worse, it is inconsistent with the standard the rest of the engine holds. Phase
3C exists to stop exactly this: zoning rules were probed live, mapped to secids,
hashed by region, and refused certification without authoritative provenance.
The drawing requirements went in on my own say-so. The thirteen items in
`review/checklist.ts` cite `'DPIE Site/Road Plan Checklist'` — **a string that
was typed, not a document that was retrieved.** No URL, no effective date, no
`lastVerifiedAt`. Those items would fail the Phase 3C certification gate on its
first condition.

## Why I cannot fetch these myself

Tried on 2026-08-22:

| Source | Result |
|---|---|
| `princegeorgescountymd.gov` DPIE pages | **HTTP 403**, 491-byte body |
| `dpie.mypgc.us` | **HTTP 403**, 461-byte body |

Both sit behind bot protection that rejects programmatic access regardless of
User-Agent. This is the third documented case in this project — EncodePlus needed
its print view, Municode serves a JS shell, and now DPIE blocks outright.

## What to upload, most useful first

1. **Two or three approved PG County site plans.** An infill lot is ideal —
   the case the engine is aimed at. These tell me the real sheet count, the
   notes that must appear verbatim, title-block content, signature and seal
   block layout, and how a small lot is actually laid out on a sheet.

2. **The DPIE site/road plan checklist**, as published. This is what turns the
   thirteen invented items into certifiable rules with a source, an effective
   date and a hash — the same treatment the zoning rules already get.

3. **A rejected plan with the county's review comments**, if you have one.
   Worth more than the approvals: it names the things reviewers actually catch,
   which is precisely what a generated plan will get wrong.

4. Any county drafting standard, standard-detail sheet, or general-notes
   boilerplate.

## Formats

PDF is fine and preferred for approved plans. DWG/DXF is better if you have it,
since the layer names show the drafting convention directly.

## What happens to them

They are read as reference to correct the renderer and to give the checklist
real provenance. They are **not** redistributed, and not used as content in any
customer deliverable — a third party's sealed drawing is their professional work
product, not a template.
