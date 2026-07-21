-- ============================================================================
-- 06_create_permits.sql
-- Permit System Tables
-- Depends on: 01_create_tables.sql, 05_create_projects.sql
-- ============================================================================

-- ============================================================================
-- ENUMS
-- ============================================================================

DO $$ BEGIN
    CREATE TYPE permit_status AS ENUM (
        'DRAFT', 'SUBMITTED', 'UNDER_REVIEW', 'REVIEW_COMPLETE', 'APPROVED', 
        'REJECTED', 'ISSUED', 'EXPIRED', 'CLOSED', 'WITHDRAWN'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE permit_type AS ENUM (
        'BUILDING', 'ELECTRICAL', 'PLUMBING', 'MECHANICAL', 'FIRE', 
        'GRADING', 'DEMOLITION', 'SIGN', 'FENCE', 'ROOFING'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE permit_priority AS ENUM ('NORMAL', 'EXPEDITED', 'RUSH');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- ============================================================================
-- JURISDICTIONS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS "Jurisdiction" (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    name TEXT NOT NULL,
    code TEXT UNIQUE, -- Jurisdiction code (e.g., "SF", "LA")
    type TEXT, -- CITY, COUNTY, STATE, FEDERAL
    address TEXT,
    city TEXT,
    state TEXT,
    zip_code TEXT,
    phone TEXT,
    email TEXT,
    website TEXT,
    is_active BOOLEAN DEFAULT true,
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_jurisdiction_code ON "Jurisdiction"(code);
CREATE INDEX IF NOT EXISTS idx_jurisdiction_is_active ON "Jurisdiction"(is_active);

-- ============================================================================
-- JURISDICTION STAFF TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS "JurisdictionStaff" (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    jurisdiction_id TEXT NOT NULL REFERENCES "Jurisdiction"(id) ON DELETE CASCADE,
    user_id TEXT REFERENCES "User"(id) ON DELETE SET NULL,
    name TEXT NOT NULL,
    email TEXT,
    phone TEXT,
    role TEXT, -- REVIEWER, INSPECTOR, ADMIN, etc.
    department TEXT,
    is_active BOOLEAN DEFAULT true,
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_jurisdiction_staff_jurisdiction_id ON "JurisdictionStaff"(jurisdiction_id);
CREATE INDEX IF NOT EXISTS idx_jurisdiction_staff_user_id ON "JurisdictionStaff"(user_id);
CREATE INDEX IF NOT EXISTS idx_jurisdiction_staff_role ON "JurisdictionStaff"(role);

-- ============================================================================
-- PERMIT TEMPLATES TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS "PermitTemplate" (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    jurisdiction_id TEXT NOT NULL REFERENCES "Jurisdiction"(id) ON DELETE CASCADE,
    permit_type permit_type NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    form_fields JSONB, -- Form field definitions
    requirements JSONB, -- Requirements checklist
    fees JSONB, -- Fee structure
    is_active BOOLEAN DEFAULT true,
    created_by TEXT NOT NULL REFERENCES "User"(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_permit_template_jurisdiction_id ON "PermitTemplate"(jurisdiction_id);
CREATE INDEX IF NOT EXISTS idx_permit_template_permit_type ON "PermitTemplate"(permit_type);
CREATE INDEX IF NOT EXISTS idx_permit_template_is_active ON "PermitTemplate"(is_active);

-- ============================================================================
-- PERMITS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS "Permit" (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    project_id TEXT REFERENCES "Project"(id) ON DELETE SET NULL,
    jurisdiction_id TEXT NOT NULL REFERENCES "Jurisdiction"(id) ON DELETE CASCADE,
    permit_type permit_type NOT NULL,
    application_number TEXT UNIQUE,
    status permit_status DEFAULT 'DRAFT',
    priority permit_priority DEFAULT 'NORMAL',
    
    -- Project information
    address TEXT NOT NULL,
    parcel_id TEXT,
    valuation DECIMAL(12, 2),
    scope TEXT NOT NULL,
    owner_name TEXT,
    contractor_name TEXT,
    contractor_license TEXT,
    square_footage DECIMAL(12, 2),
    
    -- Application data
    application_data JSONB, -- Full application form data
    submitted_at TIMESTAMP WITH TIME ZONE,
    reviewed_at TIMESTAMP WITH TIME ZONE,
    approved_at TIMESTAMP WITH TIME ZONE,
    issued_at TIMESTAMP WITH TIME ZONE,
    expires_at TIMESTAMP WITH TIME ZONE,
    
    -- Fees
    application_fee DECIMAL(10, 2),
    permit_fee DECIMAL(10, 2),
    expedited_fee DECIMAL(10, 2),
    total_fee DECIMAL(10, 2),
    
    -- Metadata
    metadata JSONB,
    created_by TEXT REFERENCES "User"(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_permit_project_id ON "Permit"(project_id);
CREATE INDEX IF NOT EXISTS idx_permit_jurisdiction_id ON "Permit"(jurisdiction_id);
CREATE INDEX IF NOT EXISTS idx_permit_application_number ON "Permit"(application_number);
CREATE INDEX IF NOT EXISTS idx_permit_status ON "Permit"(status);
CREATE INDEX IF NOT EXISTS idx_permit_permit_type ON "Permit"(permit_type);
CREATE INDEX IF NOT EXISTS idx_permit_submitted_at ON "Permit"(submitted_at);

-- ============================================================================
-- PERMIT SUBMISSIONS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS "PermitSubmission" (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    permit_id TEXT NOT NULL REFERENCES "Permit"(id) ON DELETE CASCADE,
    submission_type TEXT, -- INITIAL, CORRECTION, RESUBMISSION
    documents JSONB, -- Array of document references
    submitted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    submitted_by TEXT REFERENCES "User"(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_permit_submission_permit_id ON "PermitSubmission"(permit_id);
CREATE INDEX IF NOT EXISTS idx_permit_submission_submitted_at ON "PermitSubmission"(submitted_at);

-- ============================================================================
-- PERMIT CORRECTIONS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS "PermitCorrection" (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    permit_id TEXT NOT NULL REFERENCES "Permit"(id) ON DELETE CASCADE,
    correction_type TEXT, -- DEFICIENCY, CLARIFICATION, ADDITIONAL_INFO
    field_name TEXT,
    issue_description TEXT NOT NULL,
    required_action TEXT,
    corrected BOOLEAN DEFAULT false,
    corrected_at TIMESTAMP WITH TIME ZONE,
    created_by TEXT REFERENCES "User"(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_permit_correction_permit_id ON "PermitCorrection"(permit_id);
CREATE INDEX IF NOT EXISTS idx_permit_correction_corrected ON "PermitCorrection"(corrected);

-- ============================================================================
-- PERMIT EVENTS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS "PermitEvent" (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    permit_id TEXT NOT NULL REFERENCES "Permit"(id) ON DELETE CASCADE,
    event_type TEXT NOT NULL, -- SUBMITTED, REVIEWED, APPROVED, REJECTED, etc.
    description TEXT,
    performed_by TEXT REFERENCES "User"(id) ON DELETE SET NULL,
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_permit_event_permit_id ON "PermitEvent"(permit_id);
CREATE INDEX IF NOT EXISTS idx_permit_event_event_type ON "PermitEvent"(event_type);
CREATE INDEX IF NOT EXISTS idx_permit_event_created_at ON "PermitEvent"(created_at);

-- ============================================================================
-- PERMIT ROUTING TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS "PermitRouting" (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    permit_id TEXT NOT NULL REFERENCES "Permit"(id) ON DELETE CASCADE,
    reviewer_id TEXT REFERENCES "User"(id) ON DELETE SET NULL,
    review_discipline TEXT, -- STRUCTURAL, ELECTRICAL, PLUMBING, etc.
    status TEXT DEFAULT 'PENDING', -- PENDING, IN_REVIEW, APPROVED, REJECTED
    assigned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    reviewed_at TIMESTAMP WITH TIME ZONE,
    comments TEXT,
    escalated BOOLEAN DEFAULT false,
    escalated_to TEXT REFERENCES "User"(id) ON DELETE SET NULL,
    escalated_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_permit_routing_permit_id ON "PermitRouting"(permit_id);
CREATE INDEX IF NOT EXISTS idx_permit_routing_reviewer_id ON "PermitRouting"(reviewer_id);
CREATE INDEX IF NOT EXISTS idx_permit_routing_status ON "PermitRouting"(status);
CREATE INDEX IF NOT EXISTS idx_permit_routing_review_discipline ON "PermitRouting"(review_discipline);

-- ============================================================================
-- ROUTING RULES TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS "RoutingRule" (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    jurisdiction_id TEXT NOT NULL REFERENCES "Jurisdiction"(id) ON DELETE CASCADE,
    permit_type permit_type,
    review_discipline TEXT,
    conditions JSONB, -- Rule conditions (valuation, project type, etc.)
    reviewer_id TEXT REFERENCES "User"(id) ON DELETE SET NULL,
    reviewer_role TEXT,
    priority INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_by TEXT NOT NULL REFERENCES "User"(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_routing_rule_jurisdiction_id ON "RoutingRule"(jurisdiction_id);
CREATE INDEX IF NOT EXISTS idx_routing_rule_permit_type ON "RoutingRule"(permit_type);
CREATE INDEX IF NOT EXISTS idx_routing_rule_is_active ON "RoutingRule"(is_active);

-- ============================================================================
-- PERMIT NOTIFICATIONS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS "PermitNotification" (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    permit_id TEXT NOT NULL REFERENCES "Permit"(id) ON DELETE CASCADE,
    recipient_id TEXT NOT NULL REFERENCES "User"(id) ON DELETE CASCADE,
    notification_type TEXT NOT NULL, -- STATUS_UPDATE, CORRECTION_REQUIRED, APPROVAL, etc.
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    read BOOLEAN DEFAULT false,
    read_at TIMESTAMP WITH TIME ZONE,
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_permit_notification_permit_id ON "PermitNotification"(permit_id);
CREATE INDEX IF NOT EXISTS idx_permit_notification_recipient_id ON "PermitNotification"(recipient_id);
CREATE INDEX IF NOT EXISTS idx_permit_notification_read ON "PermitNotification"(read);
CREATE INDEX IF NOT EXISTS idx_permit_notification_created_at ON "PermitNotification"(created_at);

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON TABLE "Jurisdiction" IS 'Permit jurisdictions (cities, counties, states)';
COMMENT ON TABLE "JurisdictionStaff" IS 'Staff members for jurisdictions';
COMMENT ON TABLE "PermitTemplate" IS 'Permit application templates by jurisdiction';
COMMENT ON TABLE "Permit" IS 'Permit applications';
COMMENT ON TABLE "PermitSubmission" IS 'Permit submission history';
COMMENT ON TABLE "PermitCorrection" IS 'Permit correction requests';
COMMENT ON TABLE "PermitEvent" IS 'Permit event history';
COMMENT ON TABLE "PermitRouting" IS 'Permit review routing assignments';
COMMENT ON TABLE "RoutingRule" IS 'Automated routing rules for permit reviews';
COMMENT ON TABLE "PermitNotification" IS 'Permit status notifications';
