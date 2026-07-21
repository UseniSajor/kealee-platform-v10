-- ============================================================================
-- 07_create_inspections.sql
-- Inspection Tracking Tables
-- Depends on: 01_create_tables.sql, 06_create_permits.sql
-- ============================================================================

-- ============================================================================
-- ENUMS
-- ============================================================================

DO $$ BEGIN
    CREATE TYPE inspection_status AS ENUM (
        'SCHEDULED', 'IN_PROGRESS', 'PASSED', 'FAILED', 'CANCELLED', 'RESCHEDULED'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE inspection_type AS ENUM (
        'FOUNDATION', 'FRAMING', 'ELECTRICAL', 'PLUMBING', 'MECHANICAL', 
        'INSULATION', 'DRYWALL', 'FINAL', 'OCCUPANCY', 'OTHER'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- ============================================================================
-- INSPECTIONS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS "Inspection" (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    permit_id TEXT NOT NULL REFERENCES "Permit"(id) ON DELETE CASCADE,
    inspection_type inspection_type NOT NULL,
    status inspection_status DEFAULT 'SCHEDULED',
    
    -- Scheduling
    scheduled_date TIMESTAMP WITH TIME ZONE NOT NULL,
    scheduled_time_start TIMESTAMP WITH TIME ZONE,
    scheduled_time_end TIMESTAMP WITH TIME ZONE,
    inspector_id TEXT REFERENCES "User"(id) ON DELETE SET NULL,
    inspector_name TEXT,
    inspector_phone TEXT,
    
    -- Results
    result TEXT, -- PASSED, FAILED, PARTIAL
    notes TEXT,
    deficiencies JSONB, -- Array of deficiency objects
    photos JSONB, -- Array of photo URLs
    completed_at TIMESTAMP WITH TIME ZONE,
    
    -- Rescheduling
    rescheduled_from_inspection_id TEXT REFERENCES "Inspection"(id) ON DELETE SET NULL,
    reschedule_reason TEXT,
    
    -- Metadata
    metadata JSONB,
    created_by TEXT REFERENCES "User"(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_inspection_permit_id ON "Inspection"(permit_id);
CREATE INDEX IF NOT EXISTS idx_inspection_status ON "Inspection"(status);
CREATE INDEX IF NOT EXISTS idx_inspection_inspection_type ON "Inspection"(inspection_type);
CREATE INDEX IF NOT EXISTS idx_inspection_scheduled_date ON "Inspection"(scheduled_date);
CREATE INDEX IF NOT EXISTS idx_inspection_inspector_id ON "Inspection"(inspector_id);

-- ============================================================================
-- INSPECTION ASSIGNMENTS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS "InspectionAssignment" (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    inspection_id TEXT NOT NULL REFERENCES "Inspection"(id) ON DELETE CASCADE,
    inspector_id TEXT NOT NULL REFERENCES "User"(id) ON DELETE CASCADE,
    assigned_by TEXT REFERENCES "User"(id) ON DELETE SET NULL,
    assigned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    notes TEXT,
    metadata JSONB
);

CREATE INDEX IF NOT EXISTS idx_inspection_assignment_inspection_id ON "InspectionAssignment"(inspection_id);
CREATE INDEX IF NOT EXISTS idx_inspection_assignment_inspector_id ON "InspectionAssignment"(inspector_id);

-- ============================================================================
-- REMOTE INSPECTIONS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS "RemoteInspection" (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    inspection_id TEXT NOT NULL REFERENCES "Inspection"(id) ON DELETE CASCADE,
    video_url TEXT,
    video_provider TEXT, -- ZOOM, TEAMS, CUSTOM, etc.
    meeting_id TEXT,
    meeting_password TEXT,
    scheduled_start TIMESTAMP WITH TIME ZONE,
    scheduled_end TIMESTAMP WITH TIME ZONE,
    started_at TIMESTAMP WITH TIME ZONE,
    ended_at TIMESTAMP WITH TIME ZONE,
    recording_url TEXT,
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_remote_inspection_inspection_id ON "RemoteInspection"(inspection_id);
CREATE INDEX IF NOT EXISTS idx_remote_inspection_scheduled_start ON "RemoteInspection"(scheduled_start);

-- ============================================================================
-- INSPECTION CHECKLISTS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS "InspectionChecklist" (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    inspection_id TEXT NOT NULL REFERENCES "Inspection"(id) ON DELETE CASCADE,
    item_name TEXT NOT NULL,
    item_description TEXT,
    category TEXT,
    required BOOLEAN DEFAULT true,
    checked BOOLEAN DEFAULT false,
    checked_by TEXT REFERENCES "User"(id) ON DELETE SET NULL,
    checked_at TIMESTAMP WITH TIME ZONE,
    notes TEXT,
    photos JSONB, -- Array of photo URLs for this item
    order_index INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_inspection_checklist_inspection_id ON "InspectionChecklist"(inspection_id);
CREATE INDEX IF NOT EXISTS idx_inspection_checklist_checked ON "InspectionChecklist"(checked);
CREATE INDEX IF NOT EXISTS idx_inspection_checklist_category ON "InspectionChecklist"(category);

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON TABLE "Inspection" IS 'Building inspections for permits';
COMMENT ON TABLE "InspectionAssignment" IS 'Inspector assignments for inspections';
COMMENT ON TABLE "RemoteInspection" IS 'Remote/virtual inspection sessions';
COMMENT ON TABLE "InspectionChecklist" IS 'Inspection checklist items';
