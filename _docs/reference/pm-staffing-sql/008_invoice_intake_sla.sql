-- Invoice Intake + SLA Tracking
-- This migration creates tables for invoice intake processing and SLA event tracking

-- Invoice intake submissions (from external sources)
create table if not exists invoices (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references projects(id) on delete cascade,
  invoice_number text not null,
  vendor_name text,
  vendor_email text,
  submitted_date date not null,
  invoice_date date not null,
  due_date date not null,
  total_amount_cents integer not null,
  currency text default 'USD',
  description text,
  status text not null default 'SUBMITTED' check (status in ('SUBMITTED','PROCESSING','APPROVED','REJECTED','PAID')),
  submitted_by_email text,
  submitted_by_name text,
  metadata jsonb, -- Additional invoice data (line items, attachments, etc.)
  processed_by uuid references user_profiles(id),
  processed_at timestamptz,
  notes text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- SLA events tracking
create table if not exists sla_events (
  id uuid primary key default gen_random_uuid(),
  invoice_id uuid not null references invoices(id) on delete cascade,
  sla_type text not null, -- 'RESPONSE_TIME', 'PROCESSING_TIME', 'APPROVAL_TIME', etc.
  target_hours integer not null, -- Target SLA in hours
  actual_hours integer, -- Actual time taken (null if not yet completed)
  status text not null default 'PENDING' check (status in ('PENDING','MET','BREACHED')),
  started_at timestamptz not null default now(),
  completed_at timestamptz,
  created_at timestamptz default now()
);

-- Indexes
create index if not exists idx_invoices_project_id on invoices(project_id);
create index if not exists idx_invoices_status on invoices(status);
create index if not exists idx_invoices_submitted_date on invoices(submitted_date);
create index if not exists idx_sla_events_invoice_id on sla_events(invoice_id);
create index if not exists idx_sla_events_status on sla_events(status);

-- RLS Policies (if needed - adjust based on your security requirements)
-- For now, we'll rely on application-level access control via service role

