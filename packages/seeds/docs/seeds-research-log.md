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

## B. Repo Cross-Check Findings (Updated 2026-03-24 — automated audit)

### Tools (confirmed in packages/core-tools/src/tools/)

| Tool Name | File | Status | Notes |
|-----------|------|--------|-------|
| check_zoning | tools/zoning/check-zoning.tool.ts | ✅ v2.0.0 | AI-powered (claude-sonnet-4-6) + stub fallback; 7 DMV jurisdictions detected |
| run_feasibility | tools/feasibility/run-feasibility.tool.ts | ✅ v2.0.0 | AI-powered (claude-sonnet-4-6) + stub; reads prior zoning from session memory |
| create_checkout | tools/payments/create-checkout.tool.ts | ✅ v1.0.0 | Maps 12 product keys → Stripe price env vars; requiresApproval |
| generate_concept_brief | tools/design/generate-concept-brief.tool.ts | ✅ v1.0.0 | 6 types: exterior, garden, interior, whole_home, developer, adu |
| create_estimate | tools/estimate/create-estimate.tool.ts | ✅ v1.0.0 | $/sqft lookup by type; ADU $250-450/sf, reno $80-200/sf |
| create_project | tools/projects/create-project.tool.ts | ✅ v1.0.0 | source: "KEACORE_INTAKE" |
| update_project_context | tools/projects/update-project-context.tool.ts | ✅ v1.0.0 | Idempotent patch |
| request_human_approval | tools/approvals/request-human-approval.tool.ts | ✅ v1.0.0 | Intercepted by Executor as approval gate |
| assign_contractor | — | 🔶 seeded | Tool file location TODO_VERIFY |
| create_milestone_schedule | — | 🔶 seeded | Tool file location TODO_VERIFY |
| send_email | — | 🔶 seeded | Resend integration — file TODO_VERIFY |
| send_sms | — | 🔶 seeded | Twilio integration — file TODO_VERIFY |
| get_permit_status | — | 🔶 seeded active | Not yet in core-tools |
| create_permit_case | — | 🔶 draft seed | Not yet built |
| create_engagement | — | 🔶 draft seed | Not yet built |

### Stripe Products (confirmed in stripe-products-env.txt — 2026-03-24)

**Original 25 products:**

| Env Key | Price ID | Maps to service |
|---------|----------|-----------------|
| STRIPE_PRICE_DESIGN_CONCEPT_VALIDATION | price_1TCoMJIQghAs8OOIQofLrce5 | exterior_concept_essential |
| STRIPE_PRICE_DESIGN_ADVANCED | price_1TCoMKIQghAs8OOIywkw884a | exterior_concept_professional |
| STRIPE_PRICE_DESIGN_FULL | price_1TCoMLIQghAs8OOI8pZ3PhKe | exterior_concept_premium |
| STRIPE_PRICE_ESTIMATE_DETAILED | price_1TCoMNIQghAs8OOI9WflqxHY | estimate_package |
| STRIPE_PRICE_ESTIMATE_CERTIFIED | price_1TCoMOIQghAs8OOIbpd1rjYn | estimate_certified (TODO_VERIFY) |
| STRIPE_PRICE_PERMIT_SIMPLE | price_1TCoMPIQghAs8OOIx5LUrUYK | permit_path_review |
| STRIPE_PRICE_PERMIT_PACKAGE | price_1TCoMQIQghAs8OOIkKnPTKSU | permit_prep |
| STRIPE_PRICE_PERMIT_COORDINATION | price_1TCoMRIQghAs8OOIdiy8bJdh | full_permit_coordination |
| STRIPE_PRICE_PERMIT_EXPEDITING | price_1TCoMSIQghAs8OOIARapm4z2 | expediter_review (TODO: add seed) |
| STRIPE_PRICE_PM_ADVISORY | price_1TCoMTIQghAs8OOIJZfTYWnw | TODO: add to service catalog |
| STRIPE_PRICE_PM_OVERSIGHT | price_1TCoMUIQghAs8OOIl8jNBNI4 | TODO: add to service catalog |
| STRIPE_PRICE_LISTING_BASIC | price_1TCoMVIQghAs8OOIvuKtNUqL | contractor_lead |
| STRIPE_PRICE_LISTING_PRO | price_1TCoMWIQghAs8OOIGN2WPKe8 | contractor_growth_package |
| STRIPE_PRICE_LISTING_PREMIUM | price_1TCoMXIQghAs8OOITPcGOO2T | TODO: add to service catalog |
| STRIPE_PRICE_GROWTH_STARTER | price_1TCoMYIQghAs8OOIze9tfsH3 | TODO: add to service catalog |
| STRIPE_PRICE_GROWTH_PRO | price_1TCoMZIQghAs8OOIhErwVFOO | TODO: add to service catalog |
| STRIPE_PRICE_GROWTH_ENTERPRISE | price_1TCoMaIQghAs8OOIpstKIXtN | TODO: add to service catalog |
| STRIPE_PRICE_OPS_A | price_1TCoMcIQghAs8OOIHTC2PZOM | ops_services_a (TODO: add seed) |
| STRIPE_PRICE_OPS_B | price_1TCoMdIQghAs8OOItffH1ukd | ops_services_b |
| STRIPE_PRICE_OPS_C | price_1TCoMeIQghAs8OOIbjfeTqph | ops_services_c |
| STRIPE_PRICE_OPS_D | price_1TCoMfIQghAs8OOINrrzWw99 | ops_services_d |
| STRIPE_PRICE_DEV_FEASIBILITY | price_1TCoMgIQghAs8OOIt4Aq17OO | developer_advisory |
| STRIPE_PRICE_DEV_PROFORMA | price_1TCoMhIQghAs8OOINm0YMles | TODO: pro_forma_analysis seed |
| STRIPE_PRICE_DEV_CAPITAL | price_1TCoMiIQghAs8OOI99E6kOOB | capital_stack_advisory (TODO) |
| STRIPE_PRICE_DEV_ENTITLEMENTS | price_1TCoMjIQghAs8OOINT5ZJCAp | permit_strategy (TODO) |

**9 new concept engine prices (created 2026-03-24):**

| Env Key | Price ID |
|---------|----------|
| STRIPE_PRICE_GARDEN_BASIC | price_1TEOE8IQghAs8OOIEluuxbLN |
| STRIPE_PRICE_GARDEN_ADVANCED | price_1TEOE9IQghAs8OOIID6W5rWN |
| STRIPE_PRICE_GARDEN_FULL | price_1TEOE9IQghAs8OOIxp9IwVNI |
| STRIPE_PRICE_INTERIOR_BASIC | price_1TEOEAIQghAs8OOIkFvIAJTE |
| STRIPE_PRICE_INTERIOR_ADVANCED | price_1TEOEAIQghAs8OOIGIVUL9MH |
| STRIPE_PRICE_INTERIOR_FULL | price_1TEOEBIQghAs8OOI4rIg027d |
| STRIPE_PRICE_WHOLE_HOME_BASIC | price_1TEOEBIQghAs8OOIYHeJOE4D |
| STRIPE_PRICE_WHOLE_HOME_ADVANCED | price_1TEOECIQghAs8OOI3TRRN51s |
| STRIPE_PRICE_WHOLE_HOME_FULL | price_1TEOECIQghAs8OOIkhIsrwOy |

### Stripe Webhooks (confirmed in services/api/src/modules/webhooks/stripe-webhook-handler.ts)

| Event | Handler | Creates |
|-------|---------|---------|
| checkout.session.completed | handleCheckoutCompleted | GuestOrder (orderType=GUEST + guestToken) OR PlatformFeeRecord (orderType=MARKETPLACE_MILESTONE, 3% fee) |
| payment_intent.succeeded | handlePaymentSucceeded | Routes to: design_package, estimation, escrow_deposit, a_la_carte, engineering sub-handlers |
| customer.subscription.created/updated/deleted | handleSubscription* | Subscription records |
| invoice.paid / invoice.payment_failed | handleInvoice* | Payment records, dunning emails |
| account.updated / transfer.created / payout.* | handleConnect* | Stripe Connect payouts |
| charge.dispute.created/closed / charge.refunded | handleDispute* / handleRefund | Dispute + refund records |

### Roles (confirmed via automated audit 2026-03-24)

**API auth middleware** (`services/api/src/middleware/auth.middleware.ts`) checks:
- `admin` — full access, bypasses project/org membership checks
- `super_admin` — equivalent to admin
- `pm` — project manager
- `user` — default authenticated user

**Prisma schema enums** (packages/database/prisma/schema.prisma):
- `StaffRole`: PLAN_REVIEWER, INSPECTOR, PERMIT_COORDINATOR, ADMINISTRATOR
- `ParticipantRole`: OWNER, ADMIN, MEMBER, VIEWER
- `ApproverType`: HOMEOWNER, CONTRACTOR, LENDER, INSPECTOR
- `LienWaiverSignerRole`: CONTRACTOR, SUBCONTRACTOR, SUPPLIER, OWNER
- `RecipientRole`: OWNER, CONTRACTOR, ADMIN, FINANCE

**RBAC in DB:** Dynamic via Role/Permission/RolePermission tables + OrgMember.roleKey. No hardcoded role enum.

> **Gap:** The `roles-permissions.seed.ts` seeds use business-domain names (role_homeowner, role_operator, etc.) which map to Supabase JWT custom claims. These are distinct from the DB ParticipantRole/StaffRole enums which govern project-level access. Both layers need to be understood when implementing authz checks.

### Prompts (confirmed via automated audit 2026-03-24)

| File | Prompt/Agent | First line |
|------|-------------|-----------|
| packages/ai/src/exterior-concept/prompts.ts | KeaBot Exterior Concept | "You are KeaBot Exterior Concept Assistant for Kealee..." |
| packages/ai/src/construction-prompts.ts | ACQUISITION_PROMPT | "You are an expert construction estimator and bid analyst..." |
| packages/ai/src/construction-prompts.ts | PERMIT_PROMPT | "You are an expert in construction permits and building code..." |
| packages/ai/src/construction-prompts.ts | COMMAND_PROMPT | "You are a construction project automation orchestrator..." |
| packages/ai/src/ai-provider.ts | Default system | "You are a construction management AI assistant for the Kealee platform..." |

All prompt/policy seeds in `prompts-policies.seed.ts` are purpose-built for KeaCore and do not duplicate the above verbatim — they govern the orchestration runtime, not individual agent behaviors.

---

## C. TODO_VERIFY Items

| Item | Priority | Status | Notes |
|------|----------|--------|-------|
| `stripeProductKey` in service-catalog.seed.ts | High | ✅ Resolved | All `stripePriceKey` fields use actual STRIPE_PRICE_* env vars. Prices corrected to match live pages. |
| Missing service seeds for known Stripe products | High | ✅ Resolved | 26 new seeds added 2026-03-24: design advanced/full, garden/interior/whole-home all tiers, estimate certified, permit expediting, PM advisory/oversight, listing premium, growth starter/pro/enterprise, ops A/B/C/D, dev proforma/capital/entitlements. |
| Price corrections | High | ✅ Resolved | ai_concept_basic $149→$585, estimate_package $249→$595, permit_path_review $325→$149 (simple filing), permit_prep $500→$950, full_permit_coordination $1000→$2750. All aligned to live customer-facing pages. |
| `get_permit_status` tool implementation | Medium | ✅ Resolved | Built at `packages/core-tools/src/tools/permits/get-permit-status.tool.ts`. Follows ToolDefinition pattern, uses jurisdiction portal lookup table, AI-powered with stub fallback, bubbles riskFlags into session memory. Registered in index.ts. |
| `assign_contractor` / `create_milestone_schedule` / `send_email` / `send_sms` tool file paths | Medium | 🔶 Open | Seeded as active — implementations not yet confirmed in core-tools. Build next. |
| Supabase JWT role claim key format | Medium | ✅ Resolved | **No JWT role claims used.** Auth middleware calls `supabase.auth.getUser(token)` for user ID only, then fetches role from DB via `OrgMember.roleKey`. Role values: `admin`, `super_admin`, `pm`, `user`. No Supabase custom claims needed for role resolution. |
| Role seed vs DB enum alignment | Medium | 🔶 Open | Business-domain seeds (role_homeowner etc.) are KeaCore orchestration-layer concepts. DB uses ParticipantRole/StaffRole/ApproverType enums for data modeling. API auth uses OrgMember.roleKey strings. These are separate layers — document cross-reference. |
| `checkout.session.completed` → `GuestOrder` flow | Medium | 🔶 Open | Webhook creates GuestOrder with guestToken — anonymous checkout service seed needed |
| Arlington Permit Arlington — Accela URL stability | Low | 🔶 Open | Accela portals sometimes change subdomain paths — re-verify annually |
| Loudoun incorporated towns (Leesburg, Purcellville) | Low | 🔶 Open | County permits vs town permits — may need separate jurisdiction seeds |
| DC Scout URL — DCRA vs DOB branding | Low | ✅ Resolved | Scout URL is dcra.dc.gov — confirmed still active via DOB redirect |
| `create_permit_case` tool | Low | 🔶 Open | Draft seed — build when permit coordination is live |
| `create_engagement` tool | Low | 🔶 Open | Draft seed — build when marketplace engagement flow is live |
| Jurisdiction URL verification (permit portal, plan upload, status, inspections) | Low | ✅ Seeded | All 7 jurisdictions have `permitPortalUrl`, `planUploadSystem`, `permitStatusUrl`, `inspectionUrl`, `propertyLookupUrl`. Web verification ongoing — re-run annually per protocol. |

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
