-- Usage idempotency is tenant-local. A globally unique key allows one tenant's
-- retry key to collide with another tenant and must never return that row.
alter table "tenant_usage_events"
  drop constraint if exists "tenant_usage_events_idempotencyKey_key";

create unique index if not exists "tenant_usage_events_orgId_idempotencyKey_key"
  on "tenant_usage_events" ("orgId", "idempotencyKey");
