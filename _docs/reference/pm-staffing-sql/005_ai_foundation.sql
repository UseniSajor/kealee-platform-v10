-- AI Foundation tables
-- Depends on: projects (from 001_base_schema.sql)

-- AI Notes table for storing future summaries/suggestions
create table ai_notes (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references projects(id) on delete cascade,
  note_type text not null, -- 'SUMMARY', 'SUGGESTION', 'RISK_ALERT', etc.
  content text not null,
  context jsonb, -- additional context data
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Indexes
create index idx_ai_notes_project_id on ai_notes(project_id);
create index idx_ai_notes_created_at on ai_notes(created_at);

-- RLS
alter table ai_notes enable row level security;

