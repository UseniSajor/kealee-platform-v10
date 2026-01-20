-- ============================================================================
-- 05_create_projects.sql
-- Project Management Tables
-- Depends on: 01_create_tables.sql
-- ============================================================================

-- ============================================================================
-- ENUMS
-- ============================================================================

DO $$ BEGIN
    CREATE TYPE project_status AS ENUM (
        'DRAFT', 'PLANNING', 'ACTIVE', 'ON_HOLD', 'COMPLETED', 'CANCELLED', 'ARCHIVED'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE contract_status AS ENUM (
        'DRAFT', 'SENT', 'SENT_FOR_SIGNATURE', 'PARTIALLY_SIGNED', 'FULLY_SIGNED', 
        'SIGNED', 'ACTIVE', 'COMPLETED', 'CANCELLED', 'ARCHIVED'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE milestone_status AS ENUM (
        'PENDING', 'SUBMITTED', 'UNDER_REVIEW', 'APPROVED', 'REJECTED', 'DISPUTED', 'PAID'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE escrow_status AS ENUM ('ACTIVE', 'FROZEN', 'CLOSED');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- ============================================================================
-- PROJECTS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS "Project" (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    org_id TEXT NOT NULL REFERENCES "Org"(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    status project_status DEFAULT 'DRAFT',
    project_type TEXT,
    address TEXT,
    city TEXT,
    state TEXT,
    zip_code TEXT,
    country TEXT DEFAULT 'US',
    start_date TIMESTAMP WITH TIME ZONE,
    end_date TIMESTAMP WITH TIME ZONE,
    budget DECIMAL(12, 2),
    metadata JSONB,
    created_by TEXT NOT NULL REFERENCES "User"(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_project_org_id ON "Project"(org_id);
CREATE INDEX IF NOT EXISTS idx_project_status ON "Project"(status);
CREATE INDEX IF NOT EXISTS idx_project_created_by ON "Project"(created_by);
CREATE INDEX IF NOT EXISTS idx_project_created_at ON "Project"(created_at);

-- ============================================================================
-- CONTRACT AGREEMENTS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS "ContractAgreement" (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    project_id TEXT NOT NULL REFERENCES "Project"(id) ON DELETE CASCADE,
    owner_id TEXT NOT NULL REFERENCES "User"(id) ON DELETE CASCADE,
    contractor_id TEXT NOT NULL REFERENCES "User"(id) ON DELETE CASCADE,
    amount DECIMAL(12, 2) NOT NULL,
    status contract_status DEFAULT 'DRAFT',
    terms TEXT, -- HTML or markdown contract terms
    signed_at TIMESTAMP WITH TIME ZONE,
    expires_at TIMESTAMP WITH TIME ZONE,
    docusign_envelope_id TEXT,
    signed_document_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_contract_agreement_project_id ON "ContractAgreement"(project_id);
CREATE INDEX IF NOT EXISTS idx_contract_agreement_owner_id ON "ContractAgreement"(owner_id);
CREATE INDEX IF NOT EXISTS idx_contract_agreement_contractor_id ON "ContractAgreement"(contractor_id);
CREATE INDEX IF NOT EXISTS idx_contract_agreement_status ON "ContractAgreement"(status);
CREATE INDEX IF NOT EXISTS idx_contract_agreement_docusign_envelope_id ON "ContractAgreement"(docusign_envelope_id);

-- ============================================================================
-- MILESTONES TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS "Milestone" (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    contract_id TEXT NOT NULL REFERENCES "ContractAgreement"(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    amount DECIMAL(12, 2) NOT NULL,
    status milestone_status DEFAULT 'PENDING',
    depends_on_id TEXT REFERENCES "Milestone"(id) ON DELETE SET NULL,
    completed_at TIMESTAMP WITH TIME ZONE,
    approved_at TIMESTAMP WITH TIME ZONE,
    paid_at TIMESTAMP WITH TIME ZONE,
    approved_by TEXT REFERENCES "User"(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_milestone_contract_id ON "Milestone"(contract_id);
CREATE INDEX IF NOT EXISTS idx_milestone_status ON "Milestone"(status);
CREATE INDEX IF NOT EXISTS idx_milestone_depends_on_id ON "Milestone"(depends_on_id);

-- ============================================================================
-- EVIDENCE TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS "Evidence" (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    milestone_id TEXT NOT NULL REFERENCES "Milestone"(id) ON DELETE CASCADE,
    type TEXT NOT NULL, -- photo, document, video, etc.
    file_url TEXT NOT NULL,
    caption TEXT,
    uploaded_by TEXT NOT NULL REFERENCES "User"(id) ON DELETE CASCADE,
    uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_evidence_milestone_id ON "Evidence"(milestone_id);
CREATE INDEX IF NOT EXISTS idx_evidence_uploaded_by ON "Evidence"(uploaded_by);

-- ============================================================================
-- ESCROW AGREEMENTS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS "EscrowAgreement" (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    contract_id TEXT UNIQUE NOT NULL REFERENCES "ContractAgreement"(id) ON DELETE CASCADE,
    project_id TEXT NOT NULL REFERENCES "Project"(id) ON DELETE CASCADE,
    total_amount DECIMAL(12, 2) NOT NULL,
    current_balance DECIMAL(12, 2) DEFAULT 0,
    holdback_percent INTEGER DEFAULT 10,
    status escrow_status DEFAULT 'ACTIVE',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_escrow_agreement_contract_id ON "EscrowAgreement"(contract_id);
CREATE INDEX IF NOT EXISTS idx_escrow_agreement_project_id ON "EscrowAgreement"(project_id);
CREATE INDEX IF NOT EXISTS idx_escrow_agreement_status ON "EscrowAgreement"(status);

-- ============================================================================
-- ESCROW TRANSACTIONS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS "EscrowTransaction" (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    escrow_id TEXT NOT NULL REFERENCES "EscrowAgreement"(id) ON DELETE CASCADE,
    type TEXT NOT NULL, -- DEPOSIT, RELEASE, RELEASE_FINAL, REFUND, FEE
    amount DECIMAL(12, 2) NOT NULL,
    balance_before DECIMAL(12, 2) NOT NULL,
    balance_after DECIMAL(12, 2) NOT NULL,
    status TEXT DEFAULT 'PENDING', -- PENDING, COMPLETED, FAILED, CANCELLED
    stripe_payment_id TEXT,
    processed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_escrow_transaction_escrow_id ON "EscrowTransaction"(escrow_id);
CREATE INDEX IF NOT EXISTS idx_escrow_transaction_status ON "EscrowTransaction"(status);
CREATE INDEX IF NOT EXISTS idx_escrow_transaction_type ON "EscrowTransaction"(type);

-- ============================================================================
-- DISPUTES TABLE
-- ============================================================================

DO $$ BEGIN
    CREATE TYPE dispute_status AS ENUM (
        'FILED', 'FREEZE_APPLIED', 'UNDER_INVESTIGATION', 'PENDING_MEDIATION', 
        'PENDING_RESOLUTION', 'RESOLVED', 'CANCELLED'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

CREATE TABLE IF NOT EXISTS "Dispute" (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    project_id TEXT NOT NULL REFERENCES "Project"(id) ON DELETE CASCADE,
    contract_id TEXT REFERENCES "ContractAgreement"(id) ON DELETE SET NULL,
    escrow_id TEXT REFERENCES "EscrowAgreement"(id) ON DELETE SET NULL,
    milestone_id TEXT REFERENCES "Milestone"(id) ON DELETE SET NULL,
    initiated_by TEXT NOT NULL REFERENCES "User"(id) ON DELETE CASCADE,
    initiated_by_role TEXT NOT NULL, -- OWNER, CONTRACTOR
    reason TEXT NOT NULL,
    description TEXT NOT NULL,
    priority TEXT DEFAULT 'normal', -- low, normal, high, urgent
    status dispute_status DEFAULT 'FILED',
    resolution TEXT,
    resolved_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_dispute_project_id ON "Dispute"(project_id);
CREATE INDEX IF NOT EXISTS idx_dispute_contract_id ON "Dispute"(contract_id);
CREATE INDEX IF NOT EXISTS idx_dispute_status ON "Dispute"(status);
CREATE INDEX IF NOT EXISTS idx_dispute_initiated_by ON "Dispute"(initiated_by);

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON TABLE "Project" IS 'Construction projects';
COMMENT ON TABLE "ContractAgreement" IS 'Contracts between project owners and contractors';
COMMENT ON TABLE "Milestone" IS 'Project milestones for payment tracking';
COMMENT ON TABLE "Evidence" IS 'Evidence files for milestone completion';
COMMENT ON TABLE "EscrowAgreement" IS 'Escrow accounts for project funds';
COMMENT ON TABLE "EscrowTransaction" IS 'Escrow transaction history';
COMMENT ON TABLE "Dispute" IS 'Payment and service disputes';
