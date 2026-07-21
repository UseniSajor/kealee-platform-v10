-- Kealee Project Support Portal - Base Schema
-- This migration creates all core tables needed for the application

-- Enable necessary extensions
create extension if not exists "uuid-ossp";
create extension if not exists "pgcrypto";

-- ============================================================================
-- ORGANIZATIONS & USERS
-- ============================================================================

-- Organization types: OWNER, PRIME, SUB, KEALEE
create table orgs (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  org_type text not null check (org_type in ('OWNER','PRIME','SUB','KEALEE')),
  email text,
  phone text,
  address text,
  city text,
  state text,
  zip text,
  website text,
  logo_url text,
  status text not null default 'ACTIVE' check (status in ('ACTIVE','INACTIVE','SUSPENDED')),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- User roles enum (13 roles total)
create type user_role as enum (
  'OWNER_ADMIN', 'OWNER_USER',
  'PRIME_ADMIN', 'PRIME_USER',
  'SUB_ADMIN', 'SUB_USER',
  'KEALEE_ADMIN', 'OPS_LEAD', 'PM_ASSISTANT', 'SCHEDULER', 'ESTIMATOR', 'COMPLIANCE', 'SALES'
);

-- User profiles (linked to Supabase auth.users)
create table user_profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  org_id uuid not null references orgs(id),
  email text not null,
  full_name text,
  role user_role not null,
  phone text,
  avatar_url text,
  must_reset_password boolean default false, -- for Kealee users created by admin
  last_login_at timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Organization relationships (for multi-org scenarios)
create table org_relationships (
  id uuid primary key default gen_random_uuid(),
  owner_org_id uuid not null references orgs(id),
  prime_org_id uuid references orgs(id),
  sub_org_id uuid references orgs(id),
  status text not null default 'ACTIVE' check (status in ('ACTIVE','INACTIVE')),
  created_at timestamptz default now()
);

-- ============================================================================
-- PACKAGES & PRICING
-- ============================================================================

-- Service packages (A, B, C, D + a la carte)
create table service_packages (
  id uuid primary key default gen_random_uuid(),
  code text not null unique, -- 'PACKAGE_A', 'PACKAGE_B', 'PACKAGE_C', 'PACKAGE_D', 'A_LA_CARTE'
  name text not null,
  description text,
  price_monthly_cents integer, -- null for a la carte
  price_range text, -- e.g., "$1,750–$2,750 / month"
  features jsonb, -- array of feature descriptions
  is_active boolean default true,
  display_order integer default 0,
  created_at timestamptz default now()
);

-- A la carte service items
create table service_items (
  id uuid primary key default gen_random_uuid(),
  code text not null unique, -- 'PM_ASSISTANT', 'SCHEDULER', 'ESTIMATOR', etc.
  name text not null,
  description text,
  price_range text, -- e.g., "$1,750–$4,000"
  category text, -- 'STAFFING', 'SERVICES'
  is_active boolean default true,
  display_order integer default 0,
  created_at timestamptz default now()
);

-- ============================================================================
-- PROJECTS
-- ============================================================================

-- Project modes: OWNER_DIRECT, PRIME_MANAGED, SUB_ONLY
create type project_mode as enum ('OWNER_DIRECT', 'PRIME_MANAGED', 'SUB_ONLY');

-- Project status
create type project_status as enum ('DRAFT', 'SETUP', 'ACTIVE', 'PAUSED', 'AT_RISK', 'COMPLETED', 'CANCELLED');

create table projects (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text,
  project_number text unique,
  mode project_mode not null default 'PRIME_MANAGED',
  status project_status not null default 'DRAFT',
  
  -- Organization relationships
  owner_org_id uuid not null references orgs(id),
  prime_org_id uuid references orgs(id),
  sub_org_id uuid references orgs(id),
  
  -- Project details
  address text,
  city text,
  state text,
  zip text,
  start_date date,
  target_completion_date date,
  actual_completion_date date,
  
  -- Service package assignment
  package_id uuid references service_packages(id),
  monthly_fee_cents integer, -- actual monthly fee for this project
  
  -- Metadata
  created_by uuid references user_profiles(id),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Project events (for AI foundation and audit)
create table project_events (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references projects(id) on delete cascade,
  event_type text not null, -- 'STATUS_CHANGE', 'MILESTONE', 'DOCUMENT_UPLOAD', 'INVOICE_CREATED', etc.
  event_data jsonb,
  created_by uuid references user_profiles(id),
  created_at timestamptz default now()
);

-- Project team members
create table project_team (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references projects(id) on delete cascade,
  user_id uuid not null references user_profiles(id),
  role text, -- project-specific role
  assigned_at timestamptz default now(),
  unique(project_id, user_id)
);

-- ============================================================================
-- CONSTRUCTION BILLING
-- ============================================================================

-- Construction estimates
create table construction_estimates (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references projects(id) on delete cascade,
  estimate_number text not null,
  created_by_org_id uuid not null references orgs(id), -- PRIME or SUB creating the estimate
  to_org_id uuid not null references orgs(id), -- OWNER or PRIME receiving the estimate
  status text not null default 'DRAFT' check (status in ('DRAFT','SUBMITTED','APPROVED','REJECTED','CONVERTED')),
  total_cents integer not null default 0,
  notes text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table construction_estimate_items (
  id uuid primary key default gen_random_uuid(),
  estimate_id uuid not null references construction_estimates(id) on delete cascade,
  description text not null,
  qty numeric not null default 1,
  unit text,
  unit_price_cents integer not null,
  total_cents integer not null,
  line_order integer default 0
);

-- Construction invoices
create table construction_invoices (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references projects(id) on delete cascade,
  invoice_number text not null,
  estimate_id uuid references construction_estimates(id), -- if converted from estimate
  created_by_org_id uuid not null references orgs(id), -- PRIME or SUB creating invoice
  to_org_id uuid not null references orgs(id), -- OWNER or PRIME receiving invoice
  
  -- Prime approval workflow for SUB invoices
  requires_prime_approval boolean default false,
  prime_approval_status text default 'N/A' check (prime_approval_status in ('N/A','PENDING','APPROVED','REJECTED')),
  prime_approved_by uuid references user_profiles(id),
  prime_approved_at timestamptz,
  
  status text not null default 'DRAFT' check (status in ('DRAFT','SUBMITTED','APPROVED','PAID','OVERDUE','CANCELLED')),
  total_cents integer not null default 0,
  due_date date,
  paid_date date,
  notes text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table construction_invoice_items (
  id uuid primary key default gen_random_uuid(),
  invoice_id uuid not null references construction_invoices(id) on delete cascade,
  description text not null,
  qty numeric not null default 1,
  unit text,
  unit_price_cents integer not null,
  total_cents integer not null,
  line_order integer default 0
);

-- ============================================================================
-- KEALEE SERVICE BILLING
-- ============================================================================

-- Project subscriptions (recurring monthly service fees)
create table project_subscriptions (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references projects(id) on delete cascade,
  package_id uuid references service_packages(id),
  monthly_amount_cents integer not null,
  status text not null default 'ACTIVE' check (status in ('ACTIVE','PAUSED','CANCELLED')),
  start_date date not null,
  end_date date,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Kealee service invoices (monthly recurring + one-time charges)
create table kealee_service_invoices (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references projects(id) on delete cascade,
  subscription_id uuid references project_subscriptions(id),
  invoice_number text not null,
  invoice_date date not null,
  due_date date not null,
  total_cents integer not null,
  status text not null default 'PENDING' check (status in ('PENDING','PAID','OVERDUE','CANCELLED')),
  paid_date date,
  paid_amount_cents integer default 0,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table kealee_service_invoice_items (
  id uuid primary key default gen_random_uuid(),
  invoice_id uuid not null references kealee_service_invoices(id) on delete cascade,
  description text not null,
  amount_cents integer not null,
  line_order integer default 0
);

-- ============================================================================
-- ESCALATIONS
-- ============================================================================

-- Note: PostgreSQL enum values cannot be easily added in transactions
-- To add SUPPLY_CHAIN, run: ALTER TYPE escalation_type ADD VALUE 'SUPPLY_CHAIN';
-- For now, using text with check constraint for flexibility in MVP
-- create type escalation_type as enum ('PAYMENT', 'BLOCKER', 'SCHEDULE', 'SCOPE', 'SUPPLY_CHAIN');
create type escalation_priority as enum ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL');

create table escalations (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references projects(id) on delete cascade,
  escalation_type text not null check (escalation_type in ('PAYMENT', 'BLOCKER', 'SCHEDULE', 'SCOPE', 'SUPPLY_CHAIN')),
  priority escalation_priority not null,
  title text not null,
  description text,
  status text not null default 'OPEN' check (status in ('OPEN','ACKNOWLEDGED','RESOLVED','CLOSED')),
  resolved_at timestamptz,
  resolved_by uuid references user_profiles(id),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- ============================================================================
-- PROJECT DETAILS
-- ============================================================================

-- Action items
create table action_items (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references projects(id) on delete cascade,
  title text not null,
  description text,
  assigned_to uuid references user_profiles(id),
  status text not null default 'OPEN' check (status in ('OPEN','IN_PROGRESS','BLOCKED','COMPLETED','CANCELLED')),
  priority text default 'MEDIUM' check (priority in ('LOW','MEDIUM','HIGH')),
  due_date date,
  completed_at timestamptz,
  blocked_reason text,
  blocked_at timestamptz,
  created_by uuid references user_profiles(id),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Schedule milestones
create table milestones (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references projects(id) on delete cascade,
  name text not null,
  description text,
  scheduled_date date not null,
  completed_date date,
  status text not null default 'SCHEDULED' check (status in ('SCHEDULED','IN_PROGRESS','COMPLETED','MISSED','CANCELLED')),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Approvals
create table approvals (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references projects(id) on delete cascade,
  approval_type text not null, -- 'CHANGE_ORDER', 'PAYMENT', 'DOCUMENT', 'SCOPE', etc.
  title text not null,
  description text,
  requested_by uuid references user_profiles(id),
  requested_by_org_id uuid references orgs(id),
  status text not null default 'PENDING' check (status in ('PENDING','APPROVED','REJECTED','CANCELLED')),
  approved_by uuid references user_profiles(id),
  approved_at timestamptz,
  rejected_reason text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Documents
create table documents (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references projects(id) on delete cascade,
  name text not null,
  description text,
  file_url text not null,
  file_type text,
  file_size_bytes integer,
  category text, -- 'PLAN', 'CONTRACT', 'PHOTO', 'REPORT', 'WARRANTY', etc.
  uploaded_by uuid references user_profiles(id),
  created_at timestamptz default now()
);

-- Partners (subcontractors/vendors in project context)
create table partners (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references projects(id) on delete cascade,
  org_id uuid references orgs(id), -- if partner is an org in system
  name text not null,
  contact_name text,
  email text,
  phone text,
  trade text, -- 'Electrical', 'Plumbing', 'HVAC', etc.
  status text not null default 'ACTIVE' check (status in ('ACTIVE','INACTIVE')),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Trade coordination (only for PRIME_MANAGED mode)
create table trade_coordination (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references projects(id) on delete cascade,
  trade text not null,
  partner_id uuid references partners(id),
  status text,
  notes text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Weekly reports
create table weekly_reports (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references projects(id) on delete cascade,
  report_date date not null,
  week_ending date not null,
  summary text,
  completed_section text,
  planned_section text,
  decisions_needed_section text,
  risks_blockers_section text,
  schedule_snapshot text,
  billing_snapshot text,
  change_activity_section text,
  photos_section text, -- JSON array of photo URLs/descriptions
  warranty_items_section text,
  created_by uuid references user_profiles(id),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Warranty items
create table warranty_items (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references projects(id) on delete cascade,
  title text not null,
  description text,
  reported_by text, -- name of reporter
  reported_date date,
  status text not null default 'OPEN' check (status in ('OPEN','TRIAGED','SCHEDULED','IN_PROGRESS','RESOLVED','CLOSED')),
  scheduled_date date,
  resolved_date date,
  partner_id uuid references partners(id),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- ============================================================================
-- INDEXES
-- ============================================================================

create index idx_user_profiles_org_id on user_profiles(org_id);
create index idx_user_profiles_role on user_profiles(role);
create index idx_projects_owner_org_id on projects(owner_org_id);
create index idx_projects_prime_org_id on projects(prime_org_id);
create index idx_projects_status on projects(status);
create index idx_project_events_project_id on project_events(project_id);
create index idx_project_events_created_at on project_events(created_at);
create index idx_construction_invoices_project_id on construction_invoices(project_id);
create index idx_construction_invoices_to_org_id on construction_invoices(to_org_id);
create index idx_construction_invoices_prime_approval_status on construction_invoices(prime_approval_status);
create index idx_kealee_service_invoices_project_id on kealee_service_invoices(project_id);
create index idx_kealee_service_invoices_status on kealee_service_invoices(status);
create index idx_kealee_service_invoices_due_date on kealee_service_invoices(due_date);
create index idx_escalations_project_id on escalations(project_id);
create index idx_escalations_status on escalations(status);
create index idx_action_items_project_id on action_items(project_id);
create index idx_action_items_status on action_items(status);
create index idx_action_items_blocked_at on action_items(blocked_at);
create index idx_milestones_project_id on milestones(project_id);
create index idx_milestones_status on milestones(status);

-- ============================================================================
-- RLS POLICIES (Row Level Security)
-- ============================================================================

-- Enable RLS on all tables
alter table orgs enable row level security;
alter table user_profiles enable row level security;
alter table projects enable row level security;
alter table project_events enable row level security;
alter table construction_estimates enable row level security;
alter table construction_invoices enable row level security;
alter table kealee_service_invoices enable row level security;
alter table escalations enable row level security;
alter table action_items enable row level security;
alter table documents enable row level security;
alter table weekly_reports enable row level security;

-- Note: RLS policies should be created separately based on specific access rules
-- This is a basic structure - policies need to be implemented based on role-based access

