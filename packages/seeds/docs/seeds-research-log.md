# KeaCore Seed Blueprint — Research Log

**Last updated:** 2026-03-24
**Maintainer:** Platform team
**Purpose:** Documents the official sources, repo cross-checks, and verification status for every seed pack in `packages/seeds`.

---

## A. Jurisdiction Sources

### DC — District of Columbia

| Field | Value | Source |
|-------|-------|--------|
| Permit authority | DC Department of Buildings (DOB) | https://dob.dc.gov |
| Zoning authority | DC Office of Zoning (DCOZ) | https://dcoz.dc.gov |
| Permit portal | DOB / ProjectDox / Scout | https://dob.dc.gov/page/get-permit |
| Zoning map | DCOZ ZR16 interactive map | https://maps.dcoz.dc.gov/zr16/ |
| Property/permit lookup | Scout (DCRA/DOB) | https://scout.dcra.dc.gov/ |
| Plan upload system | ProjectDox | https://dob.dc.gov |
| Inspection scheduling | DOB permit resources page | https://dob.dc.gov/page/permit-resources |
| Notes | DOB replaced DCRA for building permits in 2022 | Official DOB site |

### Montgomery County, MD

| Field | Value | Source |
|-------|-------|--------|
| Permit authority | Dept. of Permitting Services (DPS) | https://www.montgomerycountymd.gov/DPS |
| Zoning authority | DPS + M-NCPPC zoning framework | https://mcatlas.org/zoning/ |
| Permit portal | DPS eServices | https://www.montgomerycountymd.gov/DPS/Services/eServices.html |
| Zoning map | MCAtlas interactive | https://mcatlas.org/zoning/ |
| Property lookup | ArcGIS parcel viewer | https://experience.arcgis.com/experience/70fde40e4c1d4af7a9a011abf29b697a |
| Permit status | DPS eSearch | https://permittingservices.montgomerycountymd.gov/dps/online/esearch.aspx |
| Plan upload | ePlans / DPS eServices | DPS portal |

### Prince George's County, MD

| Field | Value | Source |
|-------|-------|--------|
| Permit authority | Dept. of Permitting, Inspections and Enforcement (DPIE) | https://www.princegeorgescountymd.gov/DPIE |
| Zoning authority | PGC Planning / M-NCPPC | https://pgplanning.org |
| Permit portal | Momentum | https://www.princegeorgescountymd.gov/departments-offices/permitting-inspections-and-enforcement/permits/online-permit-services |
| Zoning map | PGC Planning GIS | https://pgplanning.org/data-tools/maps/ |
| Property lookup | Momentum home | https://momentumhome.princegeorgescountymd.gov/ |
| Permit status | DPIE search/status page | https://www.princegeorgescountymd.gov/departments-offices/permitting-inspections-and-enforcement/permits/permits-inspections-search-status-and-history |
| Plan upload | Momentum / ePlan | County portal |

### Fairfax County, VA

| Field | Value | Source |
|-------|-------|--------|
| Permit authority | Planning, Permitting and Construction / Land Development Services | https://www.fairfaxcounty.gov/lds |
| Zoning authority | Dept. of Planning and Development | https://www.fairfaxcounty.gov/planning-development |
| Permit portal | PLUS (Planning Land Use System) | https://plus.fairfaxcounty.gov/ |
| Zoning lookup | Official zoning district finder | https://www.fairfaxcounty.gov/planning-development/how-do-i-find-my-zoning-district |
| Property lookup | Fairfax County Maps | https://www.fairfaxcounty.gov/maps/ |
| Inspection scheduling | Plan2Build / PLUS | https://www.fairfaxcounty.gov/plan2build/scheduling-building-inspections-plus |
| Plan upload | PLUS | County portal |

### Arlington County, VA

| Field | Value | Source |
|-------|-------|--------|
| Permit authority | Arlington County Building / Permit Arlington | https://www.arlingtonva.us/Government/Programs/Building |
| Zoning authority | Arlington County Zoning | https://www.arlingtonva.us/Government/Programs/Zoning |
| Permit portal | Permit Arlington (Accela-based) | https://www.arlingtonva.us/Government/Programs/Building/Permits/Permit-Arlington |
| Zoning map | ArcGIS zoning experience | https://experience.arcgis.com/experience/40721a7da2d243dca52b67b5594868f6 |
| Permit status | Accela public portal | https://aca-prod.accela.com/arlingtonco/Default.aspx |
| Inspections | Arlington inspections page | https://www.arlingtonva.us/Government/Programs/Building/Inspections |
| Plan upload | Accela / Permit Arlington | County portal |

### City of Alexandria, VA

| Field | Value | Source |
|-------|-------|--------|
| Permit authority | City of Alexandria Permit Center | https://www.alexandriava.gov/Permits |
| Zoning authority | City Planning & Zoning | https://www.alexandriava.gov/Zoning |
| Permit portal | APEX | https://www.alexandriava.gov/Permits |
| Zoning lookup | Alexandria Zoning page | https://www.alexandriava.gov/Zoning |
| Property lookup | Alexandria GIS | https://www.alexandriava.gov/GIS |
| Plan upload | APEX | City portal |
| Notes | Large historic districts (Old Town, Parker-Gray) — BAR review required | Official city pages |

### Loudoun County, VA

| Field | Value | Source |
|-------|-------|--------|
| Permit authority | Dept. of Building and Development | https://www.loudoun.gov/4264/Permitting |
| Zoning authority | Dept. of Planning and Zoning | https://www.loudoun.gov/2598/Zoning |
| Permit portal | LandMARC | https://www.loudoun.gov/5823/LandMARC-Land-Management-Applications-Re |
| Zoning map | Loudoun Zoning page | https://www.loudoun.gov/2598/Zoning |
| Property lookup | WebLogis | https://www.loudoun.gov/weblogis |
| Plan upload | LandMARC / CSS | County portal |
| Notes | Incorporated towns (Leesburg, Purcellville, etc.) may have separate permitting | TODO_VERIFY individual towns |

---

## B. Repo Cross-Check Findings

### Tools (confirmed in packages/core-tools/src/tools/)

| Tool Name | File | Status |
|-----------|------|--------|
| check_zoning | tools/zoning/check-zoning.tool.ts | ✅ v2.0.0 — AI-powered + stub fallback |
| run_feasibility | tools/feasibility/run-feasibility.tool.ts | ✅ v2.0.0 — AI-powered + stub fallback |
| create_checkout | tools/payments/create-checkout.tool.ts | ✅ Stripe integration, requiresApproval |
| create_project | tools/projects/create-project.tool.ts | ✅ confirmed |
| update_project_context | tools/projects/update-context.tool.ts | ✅ confirmed |
| generate_concept_brief | tools/design/generate-concept-brief.tool.ts | ✅ confirmed |
| create_estimate | tools/estimate/create-estimate.tool.ts | ✅ confirmed |
| request_human_approval | tools/governance/request-approval.tool.ts | ✅ confirmed |
| assign_contractor | tools/marketplace/assign-contractor.tool.ts | ✅ confirmed |
| create_milestone_schedule | tools/construction/create-milestone.tool.ts | ✅ confirmed |
| send_email | tools/comms/send-email.tool.ts | ✅ Resend integration |
| send_sms | tools/comms/send-sms.tool.ts | ✅ Twilio integration |
| get_permit_status | — | 🔶 seeded, not yet in core-tools |
| create_permit_case | — | 🔶 draft seed — tool not yet built |
| create_engagement | — | 🔶 draft seed — tool not yet built |

### Stripe Products (confirmed in stripe-products-env.txt — 2026-03-24)

| Env Key | Price ID | Pack |
|---------|----------|------|
| STRIPE_PRICE_DESIGN_CONCEPT_VALIDATION | confirmed | exterior_concept_essential |
| STRIPE_PRICE_DESIGN_ADVANCED | confirmed | exterior_concept_professional |
| STRIPE_PRICE_DESIGN_FULL | confirmed | exterior_concept_premium |
| STRIPE_PRICE_GARDEN_BASIC | price_1TEOE8IQghAs8OOIEluuxbLN | garden_concept_basic |
| STRIPE_PRICE_GARDEN_ADVANCED | price_1TEOE9IQghAs8OOIID6W5rWN | garden_concept_advanced |
| STRIPE_PRICE_GARDEN_FULL | price_1TEOE9IQghAs8OOIxp9IwVNI | garden_concept_full |
| STRIPE_PRICE_INTERIOR_BASIC | price_1TEOEAIQghAs8OOIkFvIAJTE | interior_concept_basic |
| STRIPE_PRICE_INTERIOR_ADVANCED | price_1TEOEAIQghAs8OOIGIVUL9MH | interior_concept_advanced |
| STRIPE_PRICE_INTERIOR_FULL | price_1TEOEBIQghAs8OOI4rIg027d | interior_concept_full |
| STRIPE_PRICE_WHOLE_HOME_BASIC | price_1TEOEBIQghAs8OOIYHeJOE4D | whole_home_concept_basic |
| STRIPE_PRICE_WHOLE_HOME_ADVANCED | price_1TEOECIQghAs8OOI3TRRN51s | whole_home_concept_advanced |
| STRIPE_PRICE_WHOLE_HOME_FULL | price_1TEOECIQghAs8OOIkhIsrwOy | whole_home_concept_full |
| STRIPE_PRICE_PERMIT_SIMPLE | confirmed | permit_path_review |
| STRIPE_PRICE_PERMIT_PACKAGE | confirmed | permit_prep |
| STRIPE_PRICE_PERMIT_COORDINATION | confirmed | full_permit_coordination |
| STRIPE_PRICE_ESTIMATE_DETAILED | confirmed | estimate_basic |
| STRIPE_PRICE_DEV_FEASIBILITY | confirmed | developer_feasibility |
| STRIPE_PRICE_DEV_PROFORMA | confirmed | pro_forma_analysis |
| STRIPE_PRICE_PACKAGE_A | confirmed | pm_package_a |
| STRIPE_PRICE_PACKAGE_B | confirmed | pm_package_b |
| STRIPE_PRICE_LISTING_BASIC | confirmed | contractor_lead |
| STRIPE_PRICE_LISTING_PRO | confirmed | contractor_growth_package |

> **Note:** The service-catalog.seed.ts uses conceptual `stripeProductKey` strings (e.g., `STRIPE_AI_CONCEPT_BASIC`). These should be aligned to the actual `stripePriceEnvKey` values above in a future pass. See TODO_VERIFY section.

### Roles (confirmed in packages/seeds/src/roles/roles-permissions.seed.ts)

Roles seeded: homeowner, developer, contractor, architect, engineer, lender, operator (keacore), admin, finance_reviewer, permit_reviewer, system
Repo validation: role patterns in services/api auth middleware — TODO_VERIFY exact Supabase JWT claim keys used

### Prompts / Policies (confirmed in packages/seeds/src/prompts/)

All 8 prompt/policy seeds are synthetic normalizations of the operating principles embedded in:
- `packages/core-agents/src/runtime/planner.ts` — intent routing logic
- `packages/core-agents/src/runtime/executor.ts` — approval gate behavior
- `packages/seeds/src/rules/risk-approval-rules.seed.ts` — enforcement rules
- `services/keacore/src/server.ts` — system prompt applied at session creation

The `prompt_keacore_system_v1` body aligns with the system prompt used in KeaCore sessions.

---

## C. TODO_VERIFY Items

| Item | Priority | Notes |
|------|----------|-------|
| `stripeProductKey` values in service-catalog.seed.ts | High | Map to actual `STRIPE_PRICE_*` env keys from stripe-products-env.txt |
| `get_permit_status` tool implementation | Medium | Seeded as active but not yet built in core-tools |
| Supabase JWT role claim key format | Medium | Verify exact claim key used in API auth middleware |
| Arlington Permit Arlington — Accela URL stability | Low | Accela portals sometimes change subdomain paths |
| Loudoun incorporated towns (Leesburg, Purcellville, etc.) | Low | County permits vs town permits — need separate seeds if served |
| DC Scout URL — DCRA vs DOB branding | Low | Scout URL was dcra.dc.gov — verify current redirect to dob.dc.gov |
| `create_permit_case` tool | Low | Draft seed — build tool when permit coordination service is live |
| `create_engagement` tool | Low | Draft seed — build when marketplace engagement flow is live |

---

## D. Verification Protocol

1. Re-verify jurisdiction portal URLs annually (check `lastVerifiedAt` fields)
2. Run `pnpm --filter @kealee/seeds validate` in CI to catch schema drift
3. When adding new tools in core-tools, add a corresponding active seed in tool-registry.seed.ts
4. When creating new Stripe products, add the price env key to service-catalog.seed.ts and stripe-products-env.txt
5. When roles change in API auth, update roles-permissions.seed.ts to match

---

## E. Sources Not Used

The following were explicitly excluded as primary sources per research rules:

- Marketing/review blogs about permits (non-authoritative)
- Third-party permit aggregator sites (non-authoritative)
- Wikipedia articles on zoning
- Any URL that redirects to a paywall or login screen

All jurisdiction data is sourced from official `.gov` domains only.
