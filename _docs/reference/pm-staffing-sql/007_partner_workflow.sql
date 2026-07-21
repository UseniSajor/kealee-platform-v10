-- Partner workflow enhancements
-- Add onboarding status and document tracking

-- Add columns to partners table for invite workflow
alter table partners 
  add column if not exists onboarding_status text default 'PENDING' check (onboarding_status in ('PENDING', 'INVITED', 'ONBOARDING', 'COMPLETE', 'REJECTED')),
  add column if not exists invite_requested_by uuid references user_profiles(id),
  add column if not exists invite_requested_at timestamptz,
  add column if not exists approved_by uuid references user_profiles(id),
  add column if not exists approved_at timestamptz,
  add column if not exists rejection_reason text;

-- Partner documents table for tracking onboarding documents
create table if not exists partner_documents (
  id uuid primary key default gen_random_uuid(),
  partner_id uuid not null references partners(id) on delete cascade,
  document_type text not null, -- 'W9', 'COI', 'LICENSE', 'CONTRACT', etc.
  file_url text not null,
  file_name text,
  status text not null default 'PENDING' check (status in ('PENDING', 'APPROVED', 'REJECTED')),
  reviewed_by uuid references user_profiles(id),
  reviewed_at timestamptz,
  notes text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Indexes
create index if not exists idx_partner_documents_partner_id on partner_documents(partner_id);
create index if not exists idx_partners_onboarding_status on partners(onboarding_status);

-- RLS
alter table partner_documents enable row level security;

