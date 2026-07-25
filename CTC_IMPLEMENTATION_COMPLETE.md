# CTC master estimation and cost book

## Completion status

CTC is embedded as Kealee's canonical master estimation cost-book domain:

- Native Prisma models: `CtcCostDatabase`, `CtcCostTask`, and
  `CtcTechnicalSpec`
- Canonical database ID: `CTC-2023`
- Compatibility aliases: `CTC-2026` and `CTC-Gordian-MD-DGS-2023`
- SQL migration: `20260724150000_ctc_master_cost_book`
- Import/load pipeline: `scripts/ctc/`
- Estimating APIs and compatibility `Assembly` crosswalks
- Explicit publisher, copyright, licensee, custodian, redistribution, and
  master-cost-book fields

## Verified data state

- The redistributable development sample contains 41 representative tasks.
- The restricted working extraction currently contains 115,064 parsed rows.
- Historical claims of 54,760 production tasks were not supported by the
  checked repository artifacts and must not be used as verification.

## Ownership and custody

Kealee Services LLC owns and maintains the Kealee platform implementation:
the schema, normalization, derived labor allocations, crosswalks, APIs, and
workflow integration. Kealee is recorded as `platformCustodian`.

The underlying Construction Task Catalog publication is identified as Gordian
copyright material licensed to Maryland DGS. The schema defaults
`redistributionAllowed` to false. This repository therefore does **not** claim
that Kealee owns Gordian's publication. A signed license or assignment must be
recorded before making that claim or redistributing the restricted extraction.

## Runtime verification

`packages/database/prisma/schema.prisma` is generated from the modular schema
sources and validates with Prisma. Applying the included migration to each
environment is the remaining environment-specific database operation.
