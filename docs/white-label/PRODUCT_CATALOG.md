# White-Label Product Catalog

## Catalog model

A product is a versioned template that recommends modules, workflows,
navigation, assistant configuration, reports, and evaluation cases. Assigning a
product to a tenant creates tenant configuration and proposed entitlements.
Access remains controlled by `ModuleEntitlement` and the tenant's contract.

The catalog is a commercial and provisioning abstraction. It does not create a
new application or repository for each customer.

## Initial products

### Builder Acquisition Intelligence OS

For home builders and residential developers.

- property discovery and acquisition filtering;
- teardown and redevelopment scoring;
- comparable sales;
- preliminary feasibility and maximum purchase price;
- daily opportunity reports and priority alerts;
- acquisition pipeline dashboard.

This is the recommended first managed branded pilot and should be implemented
as a tenant product assignment, not Dallas-specific source code.

### Developer Feasibility OS

For developers, brokers, and investment groups.

- parcel and zoning screening;
- development and site-plan concepts;
- unit and square-footage scenarios;
- construction budgets and pro formas;
- capital-stack and sensitivity analysis;
- investment memoranda.

### Contractor Preconstruction OS

For general contractors.

- bid intake and scope extraction;
- addenda tracking;
- estimating and bid leveling;
- compliance matrices;
- proposal generation and go/no-go recommendations;
- subcontractor communication and submission checklists.

### Property Operations OS

For property managers and multifamily operators.

- maintenance intake and work-order classification;
- vendor routing;
- turnover scopes and cost estimates;
- tenant communications;
- inspection documentation and daily operating reports.

### Permit and Design Coordination OS

For architects, permit expediters, and design-build firms.

- design and site-plan coordination;
- permit-document and jurisdictional checklists;
- submission tracking;
- review-comment and revision coordination;
- professional-review routing.

### Agency Operations OS

For professional service organizations beyond construction and real estate.

- email/document intake and client onboarding;
- technical project and SOP workflows;
- RFP and proposal intake;
- knowledge assistants;
- tasks, approvals, executive reporting, and AI-assisted quality control.

## Module keys

Use stable machine keys. Product display names may be branded per tenant.

```text
acquisition
feasibility
site_plans
design_concepts
estimating
permits
project_management
payments
marketplace
operations
knowledge_base
executive_reporting
```

Adding a new module key requires:

1. documented ownership and purpose;
2. server-side entitlement enforcement;
3. tenant and role authorization tests;
4. usage metrics where the module creates billable consumption;
5. navigation mapping;
6. product-template version update;
7. auditability of enable/disable actions.

## Commercial package principles

The platform should support, but not hard-code, commercial guidance such as:

| Package | Typical delivery | Commercial audience |
| --- | --- | --- |
| Kealee Branded Starter | Managed branded | Small contractor or consultant |
| Kealee Builder Intelligence | Managed branded or full SaaS | Builder or developer |
| Kealee Operations Pro | Managed branded or full SaaS | Regional operating company |
| Kealee Private Enterprise | Dedicated/private | Large builder, agency, or institution |

Exact pricing belongs in an approved price book and payment-provider catalog.
Repository documentation may contain planning ranges, but runtime code must use
versioned plan/rate records and external price identifiers.

The billing model is:

```text
monthly charge = base platform license
               + usage overages
               + support tier
               + contract-approved pass-through costs
```

Third-party data, model usage, storage, and custom integrations must be
classified as included, metered, pass-through, or fixed-fee before activation.
Unlimited AI or third-party consumption is not a supported default.

## Configuration hierarchy

Resolve product behavior in this order, with changes recorded:

1. platform-safe defaults;
2. versioned product template;
3. tenant product assignment;
4. approved tenant workflow/business-rule configuration;
5. per-project inputs that the workflow explicitly allows.

Tenant configuration cannot weaken platform security, data isolation, audit,
professional-review, or legal/compliance controls.

## Prohibited packaging

- source-code ownership as part of an ordinary subscription;
- client-specific repository forks;
- lifetime or unlimited infrastructure/model use;
- uncapped custom integrations or support;
- guaranteed AI, financial, engineering, design, or permitting accuracy;
- representing generated work as professional certification;
- use of data without appropriate rights;
- dedicated deployments at standard shared-platform pricing.
