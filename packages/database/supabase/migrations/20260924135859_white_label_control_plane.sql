-- Kealee white-label professional tenant control plane.
-- Homeowners are deliberately excluded: they remain project-scoped customers.

create type "WhiteLabelTier" as enum ('MANAGED_BRANDED', 'FULL_WHITE_LABEL', 'PRIVATE_ENTERPRISE');
create type "WhiteLabelTenantStatus" as enum ('DRAFT', 'PROVISIONING', 'ACTIVE', 'SUSPENDED', 'ARCHIVED');
create type "TenantDomainStatus" as enum ('PENDING', 'VERIFYING', 'ACTIVE', 'FAILED');
create type "TenantDeploymentMode" as enum ('SHARED', 'DEDICATED_KEALEE', 'CUSTOMER_CLOUD');
create type "TenantUsageMetric" as enum (
  'AI_INPUT_TOKEN', 'AI_OUTPUT_TOKEN', 'AGENT_RUN', 'IMAGE_GENERATION',
  'VIDEO_GENERATION_SECOND', 'DOCUMENT_PROCESSED', 'REPORT_GENERATED',
  'PROPERTY_EVALUATED', 'STORAGE_GB_HOUR', 'EMAIL_SENT', 'NOTIFICATION_SENT',
  'API_CALL', 'BACKGROUND_JOB_SECOND', 'THIRD_PARTY_DATA_CENT'
);
create type "TenantUsageEventStatus" as enum ('RECORDED', 'REPORTED', 'BILLED', 'VOID');
create type "TenantEvaluationRunStatus" as enum ('QUEUED', 'RUNNING', 'PASSED', 'FAILED', 'CANCELLED');
create type "TenantSupportAccessStatus" as enum ('REQUESTED', 'APPROVED', 'ACTIVE', 'EXPIRED', 'REVOKED', 'DENIED');

create table "white_label_tenant_profiles" (
  "id" text primary key default gen_random_uuid()::text,
  "orgId" text not null unique references "Org"("id") on delete cascade,
  "tier" "WhiteLabelTier" not null default 'MANAGED_BRANDED',
  "status" "WhiteLabelTenantStatus" not null default 'DRAFT',
  "companyName" text not null,
  "productName" text,
  "logoUrl" text,
  "faviconUrl" text,
  "primaryColor" text not null default '#2563EB',
  "secondaryColor" text not null default '#0F172A',
  "accentColor" text not null default '#14B8A6',
  "emailFromName" text,
  "emailFromAddress" text,
  "emailReplyToAddress" text,
  "reportHeader" text,
  "reportFooter" text,
  "legalDisclaimer" text,
  "supportName" text,
  "supportEmail" text,
  "supportPhone" text,
  "supportUrl" text,
  "locale" text not null default 'en-US',
  "currency" text not null default 'USD',
  "timeZone" text not null default 'America/New_York',
  "navigationConfig" jsonb,
  "documentBranding" jsonb,
  "emailBranding" jsonb,
  "kealeeBrandingVisible" boolean not null default true,
  "clientAdminEnabled" boolean not null default false,
  "provisionedAt" timestamptz,
  "activatedAt" timestamptz,
  "suspendedAt" timestamptz,
  "createdAt" timestamptz not null default now(),
  "updatedAt" timestamptz not null default now()
);
create index "white_label_tenant_profiles_status_idx" on "white_label_tenant_profiles"("status");
create index "white_label_tenant_profiles_tier_idx" on "white_label_tenant_profiles"("tier");

create table "tenant_domains" (
  "id" text primary key default gen_random_uuid()::text,
  "orgId" text not null references "Org"("id") on delete cascade,
  "hostname" text not null unique,
  "status" "TenantDomainStatus" not null default 'PENDING',
  "isPrimary" boolean not null default false,
  "verificationToken" text not null unique,
  "verifiedAt" timestamptz,
  "lastCheckedAt" timestamptz,
  "failureReason" text,
  "createdAt" timestamptz not null default now(),
  "updatedAt" timestamptz not null default now()
);
create index "tenant_domains_orgId_status_idx" on "tenant_domains"("orgId", "status");
create index "tenant_domains_orgId_isPrimary_idx" on "tenant_domains"("orgId", "isPrimary");
create unique index "tenant_domains_one_primary_per_org_idx" on "tenant_domains"("orgId") where "isPrimary" = true;

create table "white_label_product_templates" (
  "id" text primary key default gen_random_uuid()::text,
  "key" text not null unique,
  "name" text not null,
  "description" text,
  "enabledModuleKeys" text[] not null default '{}',
  "navigationConfig" jsonb,
  "workflowBlueprint" jsonb,
  "defaultAssistantConfig" jsonb,
  "pricingGuidance" jsonb,
  "version" integer not null default 1,
  "isActive" boolean not null default true,
  "createdAt" timestamptz not null default now(),
  "updatedAt" timestamptz not null default now()
);
create index "white_label_product_templates_isActive_idx" on "white_label_product_templates"("isActive");

create table "tenant_product_assignments" (
  "id" text primary key default gen_random_uuid()::text,
  "orgId" text not null references "Org"("id") on delete cascade,
  "productTemplateId" text not null references "white_label_product_templates"("id") on delete restrict,
  "displayName" text,
  "configuration" jsonb,
  "enabled" boolean not null default true,
  "enabledAt" timestamptz not null default now(),
  "disabledAt" timestamptz,
  "createdAt" timestamptz not null default now(),
  "updatedAt" timestamptz not null default now(),
  unique ("orgId", "productTemplateId")
);
create index "tenant_product_assignments_orgId_enabled_idx" on "tenant_product_assignments"("orgId", "enabled");
create index "tenant_product_assignments_productTemplateId_idx" on "tenant_product_assignments"("productTemplateId");

create table "tenant_plans" (
  "id" text primary key default gen_random_uuid()::text,
  "orgId" text not null unique references "Org"("id") on delete cascade,
  "planKey" text not null,
  "planName" text not null,
  "baseMonthlyAmountCents" integer not null,
  "supportTier" text not null default 'STANDARD',
  "includedUsage" jsonb,
  "overageRates" jsonb,
  "billingStatus" text not null default 'DRAFT',
  "stripeCustomerId" text,
  "stripeSubscriptionId" text unique,
  "stripeBasePriceId" text,
  "stripeMeterPriceIds" jsonb,
  "currentPeriodStart" timestamptz,
  "currentPeriodEnd" timestamptz,
  "cancelAtPeriodEnd" boolean not null default false,
  "createdAt" timestamptz not null default now(),
  "updatedAt" timestamptz not null default now()
);
create index "tenant_plans_planKey_idx" on "tenant_plans"("planKey");
create index "tenant_plans_billingStatus_idx" on "tenant_plans"("billingStatus");

create table "tenant_usage_events" (
  "id" text primary key default gen_random_uuid()::text,
  "orgId" text not null references "Org"("id") on delete restrict,
  "metric" "TenantUsageMetric" not null,
  "quantity" numeric(20,6) not null,
  "unit" text not null,
  "provider" text,
  "model" text,
  "resourceType" text,
  "resourceId" text,
  "idempotencyKey" text not null unique,
  "occurredAt" timestamptz not null default now(),
  "unitCostCents" numeric(20,6),
  "status" "TenantUsageEventStatus" not null default 'RECORDED',
  "stripeEventId" text unique,
  "metadata" jsonb,
  "createdAt" timestamptz not null default now()
);
create index "tenant_usage_events_orgId_metric_occurredAt_idx" on "tenant_usage_events"("orgId", "metric", "occurredAt");
create index "tenant_usage_events_orgId_status_occurredAt_idx" on "tenant_usage_events"("orgId", "status", "occurredAt");
create index "tenant_usage_events_resourceType_resourceId_idx" on "tenant_usage_events"("resourceType", "resourceId");

create table "tenant_usage_rollups" (
  "id" text primary key default gen_random_uuid()::text,
  "orgId" text not null references "Org"("id") on delete cascade,
  "metric" "TenantUsageMetric" not null,
  "periodStart" timestamptz not null,
  "periodEnd" timestamptz not null,
  "quantity" numeric(20,6) not null,
  "costCents" numeric(20,6) not null default 0,
  "includedAmount" numeric(20,6),
  "overageAmount" numeric(20,6),
  "finalizedAt" timestamptz,
  "createdAt" timestamptz not null default now(),
  "updatedAt" timestamptz not null default now(),
  unique ("orgId", "metric", "periodStart", "periodEnd")
);
create index "tenant_usage_rollups_orgId_periodStart_periodEnd_idx" on "tenant_usage_rollups"("orgId", "periodStart", "periodEnd");

create table "tenant_secret_references" (
  "id" text primary key default gen_random_uuid()::text,
  "orgId" text not null references "Org"("id") on delete cascade,
  "key" text not null,
  "provider" text not null,
  "vaultRef" text not null,
  "description" text,
  "active" boolean not null default true,
  "rotatedAt" timestamptz,
  "expiresAt" timestamptz,
  "createdAt" timestamptz not null default now(),
  "updatedAt" timestamptz not null default now(),
  unique ("orgId", "key")
);
create index "tenant_secret_references_orgId_active_idx" on "tenant_secret_references"("orgId", "active");

create table "tenant_deployment_configs" (
  "id" text primary key default gen_random_uuid()::text,
  "orgId" text not null unique references "Org"("id") on delete cascade,
  "mode" "TenantDeploymentMode" not null default 'SHARED',
  "environmentKey" text,
  "databaseRef" text,
  "storageNamespace" text not null,
  "vectorNamespace" text not null,
  "queueNamespace" text not null,
  "region" text,
  "dataRetentionDays" integer,
  "backupPolicy" jsonb,
  "securityControls" jsonb,
  "customerCloudMetadata" jsonb,
  "serviceLevel" text not null default 'STANDARD',
  "createdAt" timestamptz not null default now(),
  "updatedAt" timestamptz not null default now()
);
create index "tenant_deployment_configs_mode_idx" on "tenant_deployment_configs"("mode");

create table "tenant_evaluation_suites" (
  "id" text primary key default gen_random_uuid()::text,
  "orgId" text not null references "Org"("id") on delete cascade,
  "name" text not null,
  "description" text,
  "moduleKey" text,
  "accuracyThreshold" numeric(5,4),
  "humanReviewPolicy" jsonb,
  "active" boolean not null default true,
  "promptVersion" text,
  "modelVersion" text,
  "createdAt" timestamptz not null default now(),
  "updatedAt" timestamptz not null default now()
);
create index "tenant_evaluation_suites_orgId_active_idx" on "tenant_evaluation_suites"("orgId", "active");
create index "tenant_evaluation_suites_orgId_moduleKey_idx" on "tenant_evaluation_suites"("orgId", "moduleKey");

create table "tenant_evaluation_cases" (
  "id" text primary key default gen_random_uuid()::text,
  "suiteId" text not null references "tenant_evaluation_suites"("id") on delete cascade,
  "name" text not null,
  "input" jsonb not null,
  "expectedOutput" jsonb,
  "assertions" jsonb not null,
  "active" boolean not null default true,
  "createdAt" timestamptz not null default now(),
  "updatedAt" timestamptz not null default now()
);
create index "tenant_evaluation_cases_suiteId_active_idx" on "tenant_evaluation_cases"("suiteId", "active");

create table "tenant_evaluation_runs" (
  "id" text primary key default gen_random_uuid()::text,
  "suiteId" text not null references "tenant_evaluation_suites"("id") on delete cascade,
  "status" "TenantEvaluationRunStatus" not null default 'QUEUED',
  "promptVersion" text,
  "modelVersion" text,
  "passedCases" integer not null default 0,
  "failedCases" integer not null default 0,
  "totalCases" integer not null default 0,
  "score" numeric(5,4),
  "results" jsonb,
  "errorMessage" text,
  "startedAt" timestamptz,
  "completedAt" timestamptz,
  "createdAt" timestamptz not null default now()
);
create index "tenant_evaluation_runs_suiteId_createdAt_idx" on "tenant_evaluation_runs"("suiteId", "createdAt");
create index "tenant_evaluation_runs_status_idx" on "tenant_evaluation_runs"("status");

create table "tenant_support_access_sessions" (
  "id" text primary key default gen_random_uuid()::text,
  "orgId" text not null references "Org"("id") on delete cascade,
  "requestedById" text not null,
  "approvedById" text,
  "reason" text not null,
  "status" "TenantSupportAccessStatus" not null default 'REQUESTED',
  "permissions" text[] not null default '{}',
  "startsAt" timestamptz,
  "expiresAt" timestamptz not null,
  "revokedAt" timestamptz,
  "revokedById" text,
  "createdAt" timestamptz not null default now(),
  "updatedAt" timestamptz not null default now()
);
create index "tenant_support_access_sessions_orgId_status_expiresAt_idx" on "tenant_support_access_sessions"("orgId", "status", "expiresAt");
create index "tenant_support_access_sessions_requestedById_idx" on "tenant_support_access_sessions"("requestedById");

create table "tenant_audit_events" (
  "id" text primary key default gen_random_uuid()::text,
  "orgId" text not null references "Org"("id") on delete restrict,
  "actorUserId" text,
  "actorType" text not null,
  "action" text not null,
  "resourceType" text not null,
  "resourceId" text,
  "reason" text,
  "ipAddress" text,
  "userAgent" text,
  "beforeData" jsonb,
  "afterData" jsonb,
  "metadata" jsonb,
  "occurredAt" timestamptz not null default now(),
  "createdAt" timestamptz not null default now()
);
create index "tenant_audit_events_orgId_occurredAt_idx" on "tenant_audit_events"("orgId", "occurredAt");
create index "tenant_audit_events_orgId_action_idx" on "tenant_audit_events"("orgId", "action");
create index "tenant_audit_events_actorUserId_occurredAt_idx" on "tenant_audit_events"("actorUserId", "occurredAt");

-- These tables are server/control-plane only. They are not exposed to the
-- browser Data API; the API service performs authorization and audit logging.
alter table "white_label_tenant_profiles" enable row level security;
alter table "tenant_domains" enable row level security;
alter table "white_label_product_templates" enable row level security;
alter table "tenant_product_assignments" enable row level security;
alter table "tenant_plans" enable row level security;
alter table "tenant_usage_events" enable row level security;
alter table "tenant_usage_rollups" enable row level security;
alter table "tenant_secret_references" enable row level security;
alter table "tenant_deployment_configs" enable row level security;
alter table "tenant_evaluation_suites" enable row level security;
alter table "tenant_evaluation_cases" enable row level security;
alter table "tenant_evaluation_runs" enable row level security;
alter table "tenant_support_access_sessions" enable row level security;
alter table "tenant_audit_events" enable row level security;

revoke all on table
  "white_label_tenant_profiles", "tenant_domains", "white_label_product_templates",
  "tenant_product_assignments", "tenant_plans", "tenant_usage_events",
  "tenant_usage_rollups", "tenant_secret_references", "tenant_deployment_configs",
  "tenant_evaluation_suites", "tenant_evaluation_cases", "tenant_evaluation_runs",
  "tenant_support_access_sessions", "tenant_audit_events"
from anon, authenticated;

insert into "white_label_product_templates"
  ("key", "name", "description", "enabledModuleKeys", "navigationConfig", "workflowBlueprint", "defaultAssistantConfig", "pricingGuidance")
values
  ('builder-acquisition-intelligence', 'Builder Acquisition Intelligence OS', 'Property discovery, acquisition filtering, teardown scoring, comparable sales, feasibility, maximum purchase price, reports and alerts.', array['acquisition','property-intelligence','comparables','feasibility','executive-reporting'], '{"sections":["opportunities","property-analysis","feasibility","pipeline","reports"]}', '{"dailyOpportunityReport":true,"priorityAlerts":true}', '{"persona":"builder acquisition analyst","humanReviewRequired":["purchase-price recommendation","financial assumptions"]}', '{"setupMin":15000,"setupMax":35000,"monthlyMin":3000,"monthlyMax":7500}'),
  ('developer-feasibility', 'Developer Feasibility OS', 'Parcel, zoning, development concepts, site planning, construction budgets, pro formas and investment memoranda.', array['land','zoning','feasibility','site-plans','estimating','capital-stack','executive-reporting'], '{"sections":["parcels","zoning","concepts","feasibility","capital","memoranda"]}', '{"stageGates":["screening","concept","budget","investment-review"]}', '{"persona":"development feasibility analyst","humanReviewRequired":["zoning conclusion","investment recommendation"]}', '{"setupMin":15000,"setupMax":60000,"monthlyMin":3000,"monthlyMax":12000}'),
  ('contractor-preconstruction', 'Contractor Preconstruction OS', 'Bid intake, scope extraction, addenda, estimating, bid leveling, compliance, proposals and submission controls.', array['bid-intake','scope','estimating','bid-leveling','compliance','proposals','communications'], '{"sections":["inbox","opportunities","estimates","bid-leveling","proposals","submissions"]}', '{"stageGates":["intake","scope-review","estimate-review","go-no-go","submission"]}', '{"persona":"preconstruction manager","humanReviewRequired":["final estimate","go-no-go","proposal issue"]}', '{"setupMin":7500,"setupMax":60000,"monthlyMin":1500,"monthlyMax":12000}'),
  ('property-operations', 'Property Operations OS', 'Maintenance intake, work orders, vendor routing, turnover scopes, estimates, communications and inspections.', array['operations','maintenance','work-orders','vendors','turnover','inspections','communications','executive-reporting'], '{"sections":["maintenance","work-orders","vendors","turnovers","inspections","reports"]}', '{"routing":true,"dailyOperatingReport":true}', '{"persona":"property operations coordinator","humanReviewRequired":["high-cost work order","life-safety issue"]}', '{"setupMin":15000,"setupMax":60000,"monthlyMin":3000,"monthlyMax":12000}'),
  ('permit-design-coordination', 'Permit and Design Coordination OS', 'Design concepts, site-plan coordination, code rules, permit checklists, submissions, review comments and professional routing.', array['design-concepts','site-plans','permits','jurisdictions','documents','review-routing','communications'], '{"sections":["design","site-plans","permit-packages","submissions","review-comments","revisions"]}', '{"stageGates":["concept-review","professional-review","submission","agency-response","revision"]}', '{"persona":"permit and design coordinator","humanReviewRequired":["code interpretation","professional certification","permit submission"]}', '{"setupMin":15000,"setupMax":60000,"monthlyMin":3000,"monthlyMax":12000}'),
  ('agency-operations', 'Agency Operations OS', 'Cross-industry intake, onboarding, technical project management, SOPs, proposals, knowledge, approvals and executive reporting.', array['intake','onboarding','project-management','sop','proposals','knowledge','approvals','executive-reporting'], '{"sections":["intake","clients","projects","knowledge","approvals","reports"]}', '{"configurable":true}', '{"persona":"agency operations coordinator","humanReviewRequired":["client commitment","final proposal","quality-control exception"]}', '{"setupMin":7500,"setupMax":60000,"monthlyMin":1500,"monthlyMax":12000}')
on conflict ("key") do update set
  "name" = excluded."name",
  "description" = excluded."description",
  "enabledModuleKeys" = excluded."enabledModuleKeys",
  "navigationConfig" = excluded."navigationConfig",
  "workflowBlueprint" = excluded."workflowBlueprint",
  "defaultAssistantConfig" = excluded."defaultAssistantConfig",
  "pricingGuidance" = excluded."pricingGuidance",
  "updatedAt" = now();
