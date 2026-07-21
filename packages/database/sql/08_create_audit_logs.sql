-- ============================================================================
-- 08_create_audit_logs.sql
-- Audit Trail and Event Logging Tables
-- Depends on: 01_create_tables.sql
-- ============================================================================

-- ============================================================================
-- ENUMS
-- ============================================================================

DO $$ BEGIN
    CREATE TYPE audit_action AS ENUM (
        'CREATE', 'UPDATE', 'DELETE', 'VIEW', 'EXPORT', 'LOGIN', 'LOGOUT',
        'PERMISSION_GRANTED', 'PERMISSION_REVOKED', 'ROLE_ASSIGNED', 'ROLE_REVOKED',
        'SUBSCRIPTION_CREATED', 'SUBSCRIPTION_UPDATED', 'SUBSCRIPTION_CANCELLED',
        'PAYMENT_PROCESSED', 'PAYMENT_REFUNDED', 'FILE_UPLOADED', 'FILE_DELETED',
        'CONTRACT_SIGNED', 'MILESTONE_COMPLETED', 'PERMIT_SUBMITTED', 'PERMIT_APPROVED',
        'INSPECTION_SCHEDULED', 'INSPECTION_COMPLETED', 'APPROVAL_REQUESTED', 'APPROVAL_APPROVED'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- ============================================================================
-- AUDIT LOGS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS "AuditLog" (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    user_id TEXT REFERENCES "User"(id) ON DELETE SET NULL,
    org_id TEXT REFERENCES "Org"(id) ON DELETE SET NULL,
    action audit_action NOT NULL,
    entity_type TEXT NOT NULL, -- User, Org, Project, Permit, etc.
    entity_id TEXT,
    entity_name TEXT, -- Human-readable entity name
    changes JSONB, -- Before/after changes
    ip_address INET,
    user_agent TEXT,
    reason TEXT, -- Reason for action (if applicable)
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_audit_log_user_id ON "AuditLog"(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_log_org_id ON "AuditLog"(org_id);
CREATE INDEX IF NOT EXISTS idx_audit_log_action ON "AuditLog"(action);
CREATE INDEX IF NOT EXISTS idx_audit_log_entity_type ON "AuditLog"(entity_type);
CREATE INDEX IF NOT EXISTS idx_audit_log_entity_id ON "AuditLog"(entity_id);
CREATE INDEX IF NOT EXISTS idx_audit_log_created_at ON "AuditLog"(created_at);

-- Composite index for common queries
CREATE INDEX IF NOT EXISTS idx_audit_log_entity_lookup ON "AuditLog"(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_audit_log_user_activity ON "AuditLog"(user_id, created_at DESC);

-- ============================================================================
-- EVENTS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS "Event" (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    type TEXT NOT NULL, -- Event type (e.g., 'USER_SIGNED_UP', 'PROJECT_CREATED')
    entity_type TEXT,
    entity_id TEXT,
    org_id TEXT REFERENCES "Org"(id) ON DELETE SET NULL,
    user_id TEXT REFERENCES "User"(id) ON DELETE SET NULL,
    payload JSONB, -- Event-specific data
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_event_type ON "Event"(type);
CREATE INDEX IF NOT EXISTS idx_event_entity_type ON "Event"(entity_type);
CREATE INDEX IF NOT EXISTS idx_event_entity_id ON "Event"(entity_id);
CREATE INDEX IF NOT EXISTS idx_event_org_id ON "Event"(org_id);
CREATE INDEX IF NOT EXISTS idx_event_user_id ON "Event"(user_id);
CREATE INDEX IF NOT EXISTS idx_event_created_at ON "Event"(created_at);

-- Composite indexes for common queries
CREATE INDEX IF NOT EXISTS idx_event_entity_lookup ON "Event"(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_event_org_timeline ON "Event"(org_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_event_user_timeline ON "Event"(user_id, created_at DESC);

-- ============================================================================
-- SECURITY AUDIT LOGS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS "SecurityAuditLog" (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    user_id TEXT REFERENCES "User"(id) ON DELETE SET NULL,
    event_type TEXT NOT NULL, -- LOGIN_ATTEMPT, LOGIN_SUCCESS, LOGIN_FAILED, PASSWORD_CHANGE, etc.
    ip_address INET,
    user_agent TEXT,
    location JSONB, -- Geographic location if available
    risk_level TEXT, -- LOW, MEDIUM, HIGH, CRITICAL
    details JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_security_audit_log_user_id ON "SecurityAuditLog"(user_id);
CREATE INDEX IF NOT EXISTS idx_security_audit_log_event_type ON "SecurityAuditLog"(event_type);
CREATE INDEX IF NOT EXISTS idx_security_audit_log_risk_level ON "SecurityAuditLog"(risk_level);
CREATE INDEX IF NOT EXISTS idx_security_audit_log_created_at ON "SecurityAuditLog"(created_at);
CREATE INDEX IF NOT EXISTS idx_security_audit_log_ip_address ON "SecurityAuditLog"(ip_address);

-- ============================================================================
-- API USAGE TRACKING TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS "ApiUsage" (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    api_key_id TEXT, -- References ApiKey if applicable
    user_id TEXT REFERENCES "User"(id) ON DELETE SET NULL,
    org_id TEXT REFERENCES "Org"(id) ON DELETE SET NULL,
    endpoint TEXT NOT NULL,
    method TEXT NOT NULL, -- GET, POST, PUT, DELETE, etc.
    status_code INTEGER,
    response_time_ms INTEGER, -- Response time in milliseconds
    request_size_bytes INTEGER,
    response_size_bytes INTEGER,
    ip_address INET,
    user_agent TEXT,
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_api_usage_api_key_id ON "ApiUsage"(api_key_id);
CREATE INDEX IF NOT EXISTS idx_api_usage_user_id ON "ApiUsage"(user_id);
CREATE INDEX IF NOT EXISTS idx_api_usage_org_id ON "ApiUsage"(org_id);
CREATE INDEX IF NOT EXISTS idx_api_usage_endpoint ON "ApiUsage"(endpoint);
CREATE INDEX IF NOT EXISTS idx_api_usage_status_code ON "ApiUsage"(status_code);
CREATE INDEX IF NOT EXISTS idx_api_usage_created_at ON "ApiUsage"(created_at);

-- ============================================================================
-- WEBHOOK DELIVERIES TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS "WebhookDelivery" (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    webhook_id TEXT, -- References Webhook if applicable
    event_type TEXT NOT NULL,
    payload JSONB NOT NULL,
    status TEXT NOT NULL, -- PENDING, SUCCESS, FAILED, RETRYING
    status_code INTEGER,
    response_body TEXT,
    attempt_number INTEGER DEFAULT 1,
    max_attempts INTEGER DEFAULT 3,
    next_retry_at TIMESTAMP WITH TIME ZONE,
    delivered_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_webhook_delivery_webhook_id ON "WebhookDelivery"(webhook_id);
CREATE INDEX IF NOT EXISTS idx_webhook_delivery_event_type ON "WebhookDelivery"(event_type);
CREATE INDEX IF NOT EXISTS idx_webhook_delivery_status ON "WebhookDelivery"(status);
CREATE INDEX IF NOT EXISTS idx_webhook_delivery_created_at ON "WebhookDelivery"(created_at);
CREATE INDEX IF NOT EXISTS idx_webhook_delivery_next_retry_at ON "WebhookDelivery"(next_retry_at);

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON TABLE "AuditLog" IS 'Comprehensive audit trail for all system actions';
COMMENT ON TABLE "Event" IS 'System events for analytics and notifications';
COMMENT ON TABLE "SecurityAuditLog" IS 'Security-related audit events';
COMMENT ON TABLE "ApiUsage" IS 'API usage tracking and analytics';
COMMENT ON TABLE "WebhookDelivery" IS 'Webhook delivery tracking and retry management';
