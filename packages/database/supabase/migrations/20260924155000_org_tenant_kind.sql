-- Separate Kealee's direct homeowner/project business from professional
-- white-label organizations. Existing organizations remain KEALEE_DIRECT;
-- organizations already carrying a canonical white-label profile are promoted.
do $migration$
begin
  if not exists (select 1 from pg_type where typname = 'OrgTenantKind') then
    create type "OrgTenantKind" as enum ('KEALEE_DIRECT', 'WHITE_LABEL');
  end if;
end
$migration$;

alter table "Org"
  add column if not exists "tenantKind" "OrgTenantKind" not null default 'KEALEE_DIRECT';

update "Org" org
set "tenantKind" = 'WHITE_LABEL'
where exists (
  select 1 from "white_label_tenant_profiles" profile where profile."orgId" = org."id"
);

create index if not exists "Org_tenantKind_status_idx" on "Org" ("tenantKind", "status");
