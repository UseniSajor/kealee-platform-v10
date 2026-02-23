-- Suppliers module tables
-- Depends on: orgs, projects (from 001_base_schema.sql)

create table suppliers (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references orgs(id), -- supplier belongs to supplier org or Kealee directory
  name text not null,
  category text, -- lumber, roofing, HVAC, electrical, concrete, etc.
  email text,
  phone text,
  notes text,
  created_at timestamptz default now()
);

create table rfqs (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references projects(id) on delete cascade,
  created_by_org_id uuid not null references orgs(id),
  supplier_id uuid references suppliers(id),
  title text not null,
  status text not null default 'DRAFT' check (status in ('DRAFT','SENT','RECEIVED','AWARDED','CLOSED')),
  need_by_date date,
  created_at timestamptz default now()
);

create table rfq_items (
  id uuid primary key default gen_random_uuid(),
  rfq_id uuid not null references rfqs(id) on delete cascade,
  description text not null,
  qty numeric not null default 1,
  unit text
);

create table supplier_quotes (
  id uuid primary key default gen_random_uuid(),
  rfq_id uuid not null references rfqs(id) on delete cascade,
  supplier_id uuid references suppliers(id),
  status text not null default 'RECEIVED' check (status in ('RECEIVED','SELECTED','REJECTED')),
  total_cents integer not null default 0,
  lead_time_days integer,
  notes text,
  created_at timestamptz default now()
);

create table deliveries (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references projects(id) on delete cascade,
  supplier_id uuid references suppliers(id),
  status text not null default 'SCHEDULED' check (status in ('SCHEDULED','IN_TRANSIT','DELIVERED','DELAYED','CANCELLED')),
  scheduled_date date,
  delivered_date date,
  proof_url text, -- link to photo/POD doc
  notes text,
  created_at timestamptz default now()
);

create table returns_rma (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references projects(id) on delete cascade,
  supplier_id uuid references suppliers(id),
  status text not null default 'OPEN' check (status in ('OPEN','APPROVED','SHIPPED','CREDIT_ISSUED','CLOSED')),
  reason text,
  amount_cents integer default 0,
  notes text,
  created_at timestamptz default now()
);

-- Indexes
create index idx_suppliers_org_id on suppliers(org_id);
create index idx_rfqs_project_id on rfqs(project_id);
create index idx_rfqs_supplier_id on rfqs(supplier_id);
create index idx_supplier_quotes_rfq_id on supplier_quotes(rfq_id);
create index idx_deliveries_project_id on deliveries(project_id);
create index idx_returns_rma_project_id on returns_rma(project_id);

-- RLS
alter table suppliers enable row level security;
alter table rfqs enable row level security;
alter table rfq_items enable row level security;
alter table supplier_quotes enable row level security;
alter table deliveries enable row level security;
alter table returns_rma enable row level security;

