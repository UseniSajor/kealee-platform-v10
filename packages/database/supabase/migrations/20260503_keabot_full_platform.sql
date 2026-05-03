-- ============================================================================
-- KEALEE PLATFORM — KeaBot Full Platform Migration
-- 2026-05-03
-- ============================================================================
-- Creates 3 missing tables, seeds bot_prompts, adds all RLS policies,
-- and declares Supabase Storage buckets + policies.
-- ============================================================================

-- ┌──────────────────────────────────────────────────────────────────────────┐
-- │ 1. CREATE TABLES                                                        │
-- └──────────────────────────────────────────────────────────────────────────┘

-- agent_sessions: persistent session store for KeaCoreRuntime
CREATE TABLE IF NOT EXISTS agent_sessions (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id      TEXT,
  user_id     TEXT,
  project_id  TEXT,
  thread_id   TEXT,
  source      TEXT        NOT NULL,  -- web | portal-owner | portal-developer | command-center | api
  mode        TEXT        NOT NULL DEFAULT 'assisted',  -- autonomous | assisted | operator
  status      TEXT        NOT NULL DEFAULT 'active',    -- active | paused | closed
  memory      JSONB       NOT NULL DEFAULT '{}',
  metadata    JSONB,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  closed_at   TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_agent_sessions_user_id   ON agent_sessions (user_id);
CREATE INDEX IF NOT EXISTS idx_agent_sessions_project_id ON agent_sessions (project_id);
CREATE INDEX IF NOT EXISTS idx_agent_sessions_status     ON agent_sessions (status);

-- bot_prompts: versioned prompt storage
CREATE TABLE IF NOT EXISTS bot_prompts (
  id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  bot_name     TEXT        NOT NULL,  -- keabot-design | __master__ | __orchestrator__
  prompt_type  TEXT        NOT NULL,  -- master | wrapper | orchestrator
  version      INT         NOT NULL DEFAULT 1,
  content      TEXT        NOT NULL,
  variables    JSONB,
  is_active    BOOLEAN     NOT NULL DEFAULT TRUE,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  UNIQUE (bot_name, version)
);

CREATE INDEX IF NOT EXISTS idx_bot_prompts_bot_name  ON bot_prompts (bot_name);
CREATE INDEX IF NOT EXISTS idx_bot_prompts_is_active ON bot_prompts (is_active);

-- keabot_events: orchestrator execution records
CREATE TABLE IF NOT EXISTS keabot_events (
  id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id      TEXT,
  session_id      TEXT,
  event_type      TEXT        NOT NULL,  -- new_project | updated_design | user_request | milestone_completion
  payload         JSONB       NOT NULL DEFAULT '{}',
  context         JSONB,
  triggered_bots  TEXT[]      NOT NULL DEFAULT '{}',
  execution_plan  JSONB,
  status          TEXT        NOT NULL DEFAULT 'pending',  -- pending | running | completed | failed
  errors          JSONB,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at    TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_keabot_events_project_id  ON keabot_events (project_id);
CREATE INDEX IF NOT EXISTS idx_keabot_events_session_id  ON keabot_events (session_id);
CREATE INDEX IF NOT EXISTS idx_keabot_events_event_type  ON keabot_events (event_type);
CREATE INDEX IF NOT EXISTS idx_keabot_events_status      ON keabot_events (status);

-- ┌──────────────────────────────────────────────────────────────────────────┐
-- │ 2. SEED bot_prompts                                                     │
-- └──────────────────────────────────────────────────────────────────────────┘

INSERT INTO bot_prompts (bot_name, prompt_type, version, content, variables) VALUES
  ('__master__', 'master', 1,
   'You are a KeaBot agent in the Kealee construction platform. You assist homeowners, developers, and construction professionals with project planning, cost estimation, permit navigation, and design concepts. Always be accurate, concise, and actionable. Reference specific data when available.',
   '{"platform": "Kealee", "version": "v20"}'),

  ('__orchestrator__', 'orchestrator', 1,
   'You are the KeaBot Orchestrator. Given an event and project context, determine which specialized bots to invoke and in what order. Return a JSON execution plan with: triggeredBots (array of bot names), executionOrder (sequential or parallel), rationale (brief explanation), and dependencies (map of bot → prerequisite bots).',
   '{"maxBots": 18, "outputFormat": "json"}'),

  ('keabot-design', 'wrapper', 1,
   'You are KeaBot Design, specializing in architectural concepts, space planning, and 3D visualization for residential and commercial construction. Generate design concepts based on owner requirements, site constraints, and budget parameters.',
   '{"speciality": "design"}'),

  ('keabot-estimate', 'wrapper', 1,
   'You are KeaBot Estimate, specializing in construction cost estimation using 2026 DMV market rates. Provide detailed line-item estimates organized by CSI MasterFormat divisions.',
   '{"speciality": "estimate"}'),

  ('keabot-permit', 'wrapper', 1,
   'You are KeaBot Permit, specializing in permit research and navigation for DC, Maryland, and Virginia jurisdictions. Identify required permits, fees, timelines, and document checklists.',
   '{"speciality": "permit"}'),

  ('keabot-finance', 'wrapper', 1,
   'You are KeaBot Finance, specializing in construction financing, escrow management, and budget oversight. Analyze project financials and recommend funding strategies.',
   '{"speciality": "finance"}'),

  ('keabot-feasibility', 'wrapper', 1,
   'You are KeaBot Feasibility, specializing in project feasibility analysis including site assessment, zoning compliance, and go/no-go recommendations.',
   '{"speciality": "feasibility"}'),

  ('keabot-marketplace', 'wrapper', 1,
   'You are KeaBot Marketplace, specializing in contractor matching, bid evaluation, and vendor selection for construction projects.',
   '{"speciality": "marketplace"}'),

  ('keabot-operations', 'wrapper', 1,
   'You are KeaBot Operations, specializing in construction project scheduling, resource allocation, and on-site coordination.',
   '{"speciality": "operations"}'),

  ('keabot-land', 'wrapper', 1,
   'You are KeaBot Land, specializing in land acquisition, due diligence, title research, and lot analysis for development projects.',
   '{"speciality": "land"}'),

  ('keabot-construction', 'wrapper', 1,
   'You are KeaBot Construction, specializing in construction administration, daily logs, RFIs, submittals, and quality control.',
   '{"speciality": "construction"}'),

  ('keabot-payments', 'wrapper', 1,
   'You are KeaBot Payments, specializing in progress billing, lien waivers, retainage management, and payment dispute resolution.',
   '{"speciality": "payments"}'),

  ('keabot-developer', 'wrapper', 1,
   'You are KeaBot Developer, specializing in real estate development strategy, proforma analysis, entitlements, and investor relations.',
   '{"speciality": "developer"}'),

  ('keabot-owner', 'wrapper', 1,
   'You are KeaBot Owner, the primary interface for homeowners and project owners. Guide owners through project milestones, answer questions, and escalate to specialized bots when needed.',
   '{"speciality": "owner"}'),

  ('keabot-gc', 'wrapper', 1,
   'You are KeaBot GC, specializing in general contractor operations, subcontractor management, safety compliance, and project delivery.',
   '{"speciality": "gc"}'),

  ('keabot-architect', 'wrapper', 1,
   'You are KeaBot Architect, assisting licensed architects with technical documentation, code compliance, drawing review, and client communication.',
   '{"speciality": "architect"}'),

  ('keabot-closeout', 'wrapper', 1,
   'You are KeaBot Closeout, specializing in project closeout procedures including punch lists, certificate of occupancy, warranty documentation, and final payment.',
   '{"speciality": "closeout"}'),

  ('keabot-inspections', 'wrapper', 1,
   'You are KeaBot Inspections, specializing in construction inspection scheduling, deficiency tracking, and compliance verification with AHJ requirements.',
   '{"speciality": "inspections"}'),

  ('keabot-keacore', 'wrapper', 1,
   'You are KeaCore, the master AI coordinator for the Kealee platform. Orchestrate all specialized bots, maintain project context, and ensure seamless handoffs between agents.',
   '{"speciality": "keacore"}')

ON CONFLICT (bot_name, version) DO NOTHING;

-- ┌──────────────────────────────────────────────────────────────────────────┐
-- │ 3. ENABLE RLS ON NEW TABLES                                             │
-- └──────────────────────────────────────────────────────────────────────────┘

ALTER TABLE agent_sessions  ENABLE ROW LEVEL SECURITY;
ALTER TABLE bot_prompts     ENABLE ROW LEVEL SECURITY;
ALTER TABLE keabot_events   ENABLE ROW LEVEL SECURITY;

-- Enable RLS on existing tables that were missing it
ALTER TABLE IF EXISTS public_intake_leads        ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS project_outputs            ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS keabot_runs                ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS ai_conversations           ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS concept_packages           ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS concept_floorplans         ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS orchestration_gates        ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS orchestration_action_log   ENABLE ROW LEVEL SECURITY;

-- ┌──────────────────────────────────────────────────────────────────────────┐
-- │ 4. RLS POLICIES — NEW TABLES                                            │
-- └──────────────────────────────────────────────────────────────────────────┘

-- agent_sessions: users see/update their own sessions
CREATE POLICY "agent_sessions_select_own" ON agent_sessions
  FOR SELECT USING (user_id = auth.uid()::text);

CREATE POLICY "agent_sessions_update_own" ON agent_sessions
  FOR UPDATE USING (user_id = auth.uid()::text);

-- bot_prompts: any authenticated user can read prompts
CREATE POLICY "bot_prompts_select_authenticated" ON bot_prompts
  FOR SELECT USING (auth.role() = 'authenticated');

-- keabot_events: project members can read their project events
CREATE POLICY "keabot_events_select_project_members" ON keabot_events
  FOR SELECT USING (
    project_id IS NULL
    OR is_project_member(project_id::uuid)
  );

-- ┌──────────────────────────────────────────────────────────────────────────┐
-- │ 5. RLS POLICIES — EXISTING TABLES                                       │
-- └──────────────────────────────────────────────────────────────────────────┘

-- public_intake_leads: users see leads matching their auth email
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'public_intake_leads') THEN
    CREATE POLICY "intake_leads_select_own_email" ON public_intake_leads
      FOR SELECT USING (
        contact_email = (SELECT email FROM auth.users WHERE id = auth.uid())
      );
  END IF;
END $$;

-- project_outputs: project members OR intake lead email match
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'project_outputs') THEN
    CREATE POLICY "project_outputs_select_owner" ON project_outputs
      FOR SELECT USING (
        (project_id IS NOT NULL AND is_project_member(project_id::uuid))
        OR intake_id IN (
          SELECT id::text FROM public_intake_leads
          WHERE contact_email = (SELECT email FROM auth.users WHERE id = auth.uid())
        )
      );
  END IF;
END $$;

-- keabot_runs: project members only
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'keabot_runs') THEN
    CREATE POLICY "keabot_runs_select_project_members" ON keabot_runs
      FOR SELECT USING (
        is_project_member(project_id::uuid)
      );
  END IF;
END $$;

-- ai_conversations: users see/update their own conversations
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'ai_conversations') THEN
    CREATE POLICY "ai_conversations_select_own" ON ai_conversations
      FOR SELECT USING (user_id = auth.uid()::text);

    CREATE POLICY "ai_conversations_update_own" ON ai_conversations
      FOR UPDATE USING (user_id = auth.uid()::text);
  END IF;
END $$;

-- concept_packages: homeowner by userId or email
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'concept_packages') THEN
    CREATE POLICY "concept_packages_select_owner" ON concept_packages
      FOR SELECT USING (
        homeowner_id = auth.uid()::text
        OR contact_email = (SELECT email FROM auth.users WHERE id = auth.uid())
      );
  END IF;
END $$;

-- concept_floorplans: via concept_packages join
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'concept_floorplans') THEN
    CREATE POLICY "concept_floorplans_select_via_package" ON concept_floorplans
      FOR SELECT USING (
        concept_package_id IN (
          SELECT id::text FROM concept_packages
          WHERE homeowner_id = auth.uid()::text
            OR contact_email = (SELECT email FROM auth.users WHERE id = auth.uid())
        )
      );
  END IF;
END $$;

-- orchestration_gates: project members
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'orchestration_gates') THEN
    CREATE POLICY "orchestration_gates_select_project_members" ON orchestration_gates
      FOR SELECT USING (
        is_project_member(project_id::uuid)
      );
  END IF;
END $$;

-- orchestration_action_log: project members
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'orchestration_action_log') THEN
    CREATE POLICY "orchestration_action_log_select_project_members" ON orchestration_action_log
      FOR SELECT USING (
        is_project_member(project_id::uuid)
      );
  END IF;
END $$;

-- ┌──────────────────────────────────────────────────────────────────────────┐
-- │ 6. SUPABASE STORAGE BUCKETS                                             │
-- └──────────────────────────────────────────────────────────────────────────┘
-- Note: bucket creation via SQL requires the storage extension.
-- These INSERT statements are idempotent via ON CONFLICT DO NOTHING.

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES
  ('concept-renders',    'concept-renders',    TRUE,  52428800,  ARRAY['image/png', 'image/jpeg', 'image/webp', 'image/gif']),
  ('deliverables',       'deliverables',       FALSE, 104857600, ARRAY['application/pdf', 'application/zip', 'image/png', 'image/jpeg', 'video/mp4']),
  ('project-documents',  'project-documents',  FALSE, 52428800,  ARRAY['application/pdf', 'image/png', 'image/jpeg', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']),
  ('portal-uploads',     'portal-uploads',     FALSE, 52428800,  NULL)
ON CONFLICT (id) DO NOTHING;

-- concept-renders: service_role INSERT, public SELECT
CREATE POLICY "concept_renders_service_insert" ON storage.objects
  FOR INSERT TO service_role
  USING (bucket_id = 'concept-renders');

CREATE POLICY "concept_renders_public_select" ON storage.objects
  FOR SELECT USING (bucket_id = 'concept-renders');

-- deliverables: service_role INSERT, authenticated user SELECT (path includes userId)
CREATE POLICY "deliverables_service_insert" ON storage.objects
  FOR INSERT TO service_role
  USING (bucket_id = 'deliverables');

CREATE POLICY "deliverables_owner_select" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'deliverables'
    AND auth.role() = 'authenticated'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

-- project-documents: project members
CREATE POLICY "project_documents_service_insert" ON storage.objects
  FOR INSERT TO service_role
  USING (bucket_id = 'project-documents');

CREATE POLICY "project_documents_member_select" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'project-documents'
    AND auth.role() = 'authenticated'
    AND is_project_member((storage.foldername(name))[1]::uuid)
  );

-- portal-uploads: authenticated owner can INSERT/SELECT own folder
CREATE POLICY "portal_uploads_owner_insert" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'portal-uploads'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "portal_uploads_owner_select" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'portal-uploads'
    AND auth.role() = 'authenticated'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );
