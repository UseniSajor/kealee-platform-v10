-- Durable export, deletion, and retention-change workflow for professional
-- white-label tenants. Homeowners remain project-scoped and are not granted
-- access to this control-plane table.

create type "TenantDataRequestType" as enum (
  'DATA_EXPORT',
  'DATA_DELETION',
  'RETENTION_CHANGE'
);

create type "TenantDataRequestStatus" as enum (
  'REQUESTED',
  'APPROVED',
  'PROCESSING',
  'COMPLETED',
  'REJECTED',
  'CANCELLED',
  'FAILED'
);

create type "TenantDataScope" as enum ('WHITE_LABEL_CONTROL_PLANE');

create table "tenant_data_lifecycle_requests" (
  "id" text primary key default gen_random_uuid()::text,
  "orgId" text not null references "Org"("id") on delete restrict,
  "requestType" "TenantDataRequestType" not null,
  "status" "TenantDataRequestStatus" not null default 'REQUESTED',
  "scope" "TenantDataScope" not null default 'WHITE_LABEL_CONTROL_PLANE',
  "requestedById" text not null,
  "requestedByType" text not null,
  "requestReason" text,
  "requestedRetentionDays" integer,
  "effectiveRetentionDays" integer,
  "scheduledFor" timestamptz,
  "approvedById" text,
  "approvalReason" text,
  "approvedAt" timestamptz,
  "rejectedAt" timestamptz,
  "processingStartedAt" timestamptz,
  "completedAt" timestamptz,
  "failedAt" timestamptz,
  "failureReason" text,
  "exportPayload" jsonb,
  "exportSha256" text,
  "exportExpiresAt" timestamptz,
  "executionSummary" jsonb,
  "createdAt" timestamptz not null default now(),
  "updatedAt" timestamptz not null default now(),
  constraint "tenant_data_lifecycle_retention_days_check"
    check (
      ("requestType" = 'RETENTION_CHANGE' and "requestedRetentionDays" between 1 and 3650)
      or ("requestType" <> 'RETENTION_CHANGE' and "requestedRetentionDays" is null)
    ),
  constraint "tenant_data_lifecycle_export_fields_check"
    check (
      "requestType" = 'DATA_EXPORT'
      or ("exportPayload" is null and "exportSha256" is null and "exportExpiresAt" is null)
    )
);

create index "tenant_data_lifecycle_requests_orgId_createdAt_idx"
  on "tenant_data_lifecycle_requests"("orgId", "createdAt");
create index "tenant_data_lifecycle_requests_orgId_status_requestType_idx"
  on "tenant_data_lifecycle_requests"("orgId", "status", "requestType");
create index "tenant_data_lifecycle_requests_status_scheduledFor_idx"
  on "tenant_data_lifecycle_requests"("status", "scheduledFor");

-- Avoid concurrent duplicate active requests while still preserving complete
-- request history. The service also checks this and returns a readable 409.
create unique index "tenant_data_lifecycle_one_active_request_idx"
  on "tenant_data_lifecycle_requests"("orgId", "requestType")
  where "status" in ('REQUESTED', 'APPROVED', 'PROCESSING');

alter table "tenant_data_lifecycle_requests" enable row level security;
revoke all on table "tenant_data_lifecycle_requests" from anon, authenticated;
grant select, insert, update, delete on table "tenant_data_lifecycle_requests" to service_role;
