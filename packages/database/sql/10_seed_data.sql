-- ============================================================================
-- 10_seed_data.sql
-- Initial Seed Data
-- Depends on: All previous scripts (01-09)
-- ============================================================================

-- ============================================================================
-- SERVICE PLANS
-- ============================================================================

INSERT INTO "ServicePlan" (id, slug, name, description, price_monthly, price_yearly, stripe_price_id_monthly, stripe_price_id_yearly, features, is_active)
VALUES
    (
        gen_random_uuid()::text,
        'package-a',
        'Package A - Starter',
        'Essential features for small teams',
        99.00,
        990.00,
        'price_starter_monthly',
        'price_starter_yearly',
        '{"features": ["Basic project management", "Up to 5 projects", "Email support"]}'::jsonb,
        true
    ),
    (
        gen_random_uuid()::text,
        'package-b',
        'Package B - Professional',
        'Advanced features for growing teams',
        199.00,
        1990.00,
        'price_professional_monthly',
        'price_professional_yearly',
        '{"features": ["Advanced project management", "Unlimited projects", "Priority support", "Custom workflows"]}'::jsonb,
        true
    ),
    (
        gen_random_uuid()::text,
        'package-c',
        'Package C - Enterprise',
        'Full feature set for large organizations',
        499.00,
        4990.00,
        'price_enterprise_monthly',
        'price_enterprise_yearly',
        '{"features": ["All features", "Unlimited everything", "Dedicated support", "Custom integrations", "SLA guarantee"]}'::jsonb,
        true
    ),
    (
        gen_random_uuid()::text,
        'package-d',
        'Package D - Custom',
        'Custom pricing for enterprise needs',
        NULL,
        NULL,
        NULL,
        NULL,
        '{"features": ["Custom features", "Custom pricing", "Dedicated account manager"]}'::jsonb,
        true
    )
ON CONFLICT (slug) DO NOTHING;

-- ============================================================================
-- DEFAULT ROLES
-- ============================================================================

INSERT INTO "Role" (id, key, name, description, permissions)
VALUES
    (
        gen_random_uuid()::text,
        'admin',
        'Administrator',
        'Full system access',
        '{"permissions": ["*"]}'::jsonb,
        true
    ),
    (
        gen_random_uuid()::text,
        'owner',
        'Project Owner',
        'Project owner permissions',
        '{"permissions": ["project:read", "project:write", "contract:read", "contract:write", "payment:read", "payment:write"]}'::jsonb,
        true
    ),
    (
        gen_random_uuid()::text,
        'contractor',
        'Contractor',
        'Contractor permissions',
        '{"permissions": ["project:read", "milestone:read", "milestone:write", "evidence:write"]}'::jsonb,
        true
    ),
    (
        gen_random_uuid()::text,
        'pm',
        'Project Manager',
        'Project manager permissions',
        '{"permissions": ["project:read", "project:write", "task:read", "task:write", "report:read"]}'::jsonb,
        true
    ),
    (
        gen_random_uuid()::text,
        'reviewer',
        'Reviewer',
        'Permit review permissions',
        '{"permissions": ["permit:read", "permit:review", "inspection:read", "inspection:write"]}'::jsonb,
        true
    ),
    (
        gen_random_uuid()::text,
        'inspector',
        'Inspector',
        'Inspection permissions',
        '{"permissions": ["inspection:read", "inspection:write", "inspection:complete"]}'::jsonb,
        true
    ),
    (
        gen_random_uuid()::text,
        'member',
        'Member',
        'Basic member permissions',
        '{"permissions": ["project:read", "file:read"]}'::jsonb,
        true
    )
ON CONFLICT (key) DO NOTHING;

-- ============================================================================
-- DEFAULT PERMISSIONS
-- ============================================================================

INSERT INTO "Permission" (id, key, name, description, resource, action)
VALUES
    (gen_random_uuid()::text, 'project:read', 'View Projects', 'View project information', 'project', 'read'),
    (gen_random_uuid()::text, 'project:write', 'Manage Projects', 'Create and edit projects', 'project', 'write'),
    (gen_random_uuid()::text, 'project:delete', 'Delete Projects', 'Delete projects', 'project', 'delete'),
    (gen_random_uuid()::text, 'contract:read', 'View Contracts', 'View contract information', 'contract', 'read'),
    (gen_random_uuid()::text, 'contract:write', 'Manage Contracts', 'Create and edit contracts', 'contract', 'write'),
    (gen_random_uuid()::text, 'payment:read', 'View Payments', 'View payment information', 'payment', 'read'),
    (gen_random_uuid()::text, 'payment:write', 'Process Payments', 'Process payments', 'payment', 'write'),
    (gen_random_uuid()::text, 'permit:read', 'View Permits', 'View permit information', 'permit', 'read'),
    (gen_random_uuid()::text, 'permit:write', 'Submit Permits', 'Submit permit applications', 'permit', 'write'),
    (gen_random_uuid()::text, 'permit:review', 'Review Permits', 'Review permit applications', 'permit', 'review'),
    (gen_random_uuid()::text, 'inspection:read', 'View Inspections', 'View inspection information', 'inspection', 'read'),
    (gen_random_uuid()::text, 'inspection:write', 'Schedule Inspections', 'Schedule inspections', 'inspection', 'write'),
    (gen_random_uuid()::text, 'inspection:complete', 'Complete Inspections', 'Complete inspections', 'inspection', 'complete'),
    (gen_random_uuid()::text, 'file:read', 'View Files', 'View files', 'file', 'read'),
    (gen_random_uuid()::text, 'file:write', 'Upload Files', 'Upload files', 'file', 'write'),
    (gen_random_uuid()::text, 'file:delete', 'Delete Files', 'Delete files', 'file', 'delete'),
    (gen_random_uuid()::text, 'user:read', 'View Users', 'View user information', 'user', 'read'),
    (gen_random_uuid()::text, 'user:write', 'Manage Users', 'Create and edit users', 'user', 'write'),
    (gen_random_uuid()::text, 'org:read', 'View Organizations', 'View organization information', 'org', 'read'),
    (gen_random_uuid()::text, 'org:write', 'Manage Organizations', 'Create and edit organizations', 'org', 'write'),
    (gen_random_uuid()::text, 'report:read', 'View Reports', 'View reports and analytics', 'report', 'read'),
    (gen_random_uuid()::text, 'task:read', 'View Tasks', 'View task information', 'task', 'read'),
    (gen_random_uuid()::text, 'task:write', 'Manage Tasks', 'Create and edit tasks', 'task', 'write')
ON CONFLICT (key) DO NOTHING;

-- ============================================================================
-- SAMPLE JURISDICTION
-- ============================================================================

INSERT INTO "Jurisdiction" (id, name, code, type, city, state, is_active)
VALUES
    (
        gen_random_uuid()::text,
        'San Francisco Department of Building Inspection',
        'SF-DBI',
        'CITY',
        'San Francisco',
        'CA',
        true
    ),
    (
        gen_random_uuid()::text,
        'Los Angeles Department of Building and Safety',
        'LA-DBS',
        'CITY',
        'Los Angeles',
        'CA',
        true
    )
ON CONFLICT (code) DO NOTHING;

-- ============================================================================
-- APPROVAL WORKFLOW TABLES (if not already created)
-- ============================================================================

-- Note: These tables should be created in a separate script if not already in schema
-- Adding here for completeness

DO $$ BEGIN
    CREATE TYPE approval_request_type AS ENUM ('EXPENSE', 'TIME_OFF', 'PURCHASE', 'DOCUMENT', 'CUSTOM');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE approval_request_status AS ENUM ('DRAFT', 'PENDING', 'APPROVED', 'REJECTED', 'CANCELLED');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE approval_priority AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE approval_step_status AS ENUM ('PENDING', 'APPROVED', 'REJECTED', 'SKIPPED');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON TABLE "ServicePlan" IS 'Service plans seeded with default packages';
COMMENT ON TABLE "Role" IS 'Default roles seeded for RBAC';
COMMENT ON TABLE "Permission" IS 'Default permissions seeded for RBAC';
COMMENT ON TABLE "Jurisdiction" IS 'Sample jurisdictions for testing';
