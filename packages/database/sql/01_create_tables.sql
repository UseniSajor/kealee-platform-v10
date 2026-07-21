-- ============================================================================
-- 01_create_tables.sql
-- Core Tables: User, Organization, and foundational models
-- Run this script first
-- ============================================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================================
-- ENUMS
-- ============================================================================

-- User status enum
DO $$ BEGIN
    CREATE TYPE user_status AS ENUM ('ACTIVE', 'INACTIVE', 'SUSPENDED', 'PENDING_VERIFICATION');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Organization status enum
DO $$ BEGIN
    CREATE TYPE org_status AS ENUM ('ACTIVE', 'INACTIVE', 'SUSPENDED', 'PENDING_SETUP');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- ============================================================================
-- USERS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS "User" (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    email TEXT UNIQUE NOT NULL,
    name TEXT,
    phone TEXT,
    avatar TEXT,
    status user_status DEFAULT 'PENDING_VERIFICATION',
    email_verified BOOLEAN DEFAULT false,
    phone_verified BOOLEAN DEFAULT false,
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_login_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX IF NOT EXISTS idx_user_email ON "User"(email);
CREATE INDEX IF NOT EXISTS idx_user_status ON "User"(status);
CREATE INDEX IF NOT EXISTS idx_user_created_at ON "User"(created_at);

-- ============================================================================
-- ORGANIZATIONS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS "Org" (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    name TEXT NOT NULL,
    slug TEXT UNIQUE,
    description TEXT,
    logo TEXT,
    website TEXT,
    status org_status DEFAULT 'PENDING_SETUP',
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_org_slug ON "Org"(slug);
CREATE INDEX IF NOT EXISTS idx_org_status ON "Org"(status);

-- ============================================================================
-- ORGANIZATION MEMBERS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS "OrgMember" (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    org_id TEXT NOT NULL REFERENCES "Org"(id) ON DELETE CASCADE,
    user_id TEXT NOT NULL REFERENCES "User"(id) ON DELETE CASCADE,
    role TEXT DEFAULT 'member',
    permissions JSONB,
    joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(org_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_org_member_org_id ON "OrgMember"(org_id);
CREATE INDEX IF NOT EXISTS idx_org_member_user_id ON "OrgMember"(user_id);
CREATE INDEX IF NOT EXISTS idx_org_member_role ON "OrgMember"(role);

-- ============================================================================
-- RBAC TABLES
-- ============================================================================

CREATE TABLE IF NOT EXISTS "Role" (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    key TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    org_id TEXT REFERENCES "Org"(id) ON DELETE CASCADE,
    permissions JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_role_key ON "Role"(key);
CREATE INDEX IF NOT EXISTS idx_role_org_id ON "Role"(org_id);

CREATE TABLE IF NOT EXISTS "Permission" (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    key TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    resource TEXT,
    action TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_permission_key ON "Permission"(key);
CREATE INDEX IF NOT EXISTS idx_permission_resource ON "Permission"(resource);

-- ============================================================================
-- MODULE ENTITLEMENTS
-- ============================================================================

CREATE TABLE IF NOT EXISTS "ModuleEntitlement" (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    org_id TEXT NOT NULL REFERENCES "Org"(id) ON DELETE CASCADE,
    module_key TEXT NOT NULL,
    enabled BOOLEAN DEFAULT false,
    enabled_at TIMESTAMP WITH TIME ZONE,
    disabled_at TIMESTAMP WITH TIME ZONE,
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(org_id, module_key)
);

CREATE INDEX IF NOT EXISTS idx_module_entitlement_org_id ON "ModuleEntitlement"(org_id);
CREATE INDEX IF NOT EXISTS idx_module_entitlement_module_key ON "ModuleEntitlement"(module_key);
CREATE INDEX IF NOT EXISTS idx_module_entitlement_enabled ON "ModuleEntitlement"(enabled);

-- ============================================================================
-- SERVICE PLANS
-- ============================================================================

CREATE TABLE IF NOT EXISTS "ServicePlan" (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    slug TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    price_monthly DECIMAL(12, 2),
    price_yearly DECIMAL(12, 2),
    stripe_price_id_monthly TEXT,
    stripe_price_id_yearly TEXT,
    features JSONB,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_service_plan_slug ON "ServicePlan"(slug);
CREATE INDEX IF NOT EXISTS idx_service_plan_active ON "ServicePlan"(is_active);

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON TABLE "User" IS 'Core user accounts for the Kealee Platform';
COMMENT ON TABLE "Org" IS 'Organizations (companies, teams) using the platform';
COMMENT ON TABLE "OrgMember" IS 'Many-to-many relationship between users and organizations';
COMMENT ON TABLE "Role" IS 'RBAC roles for access control';
COMMENT ON TABLE "Permission" IS 'RBAC permissions';
COMMENT ON TABLE "ModuleEntitlement" IS 'Module access control for organizations';
COMMENT ON TABLE "ServicePlan" IS 'Subscription service plans';
