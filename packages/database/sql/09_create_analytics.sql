-- ============================================================================
-- 09_create_analytics.sql
-- Analytics and Reporting Tables
-- Depends on: 01_create_tables.sql, 02_create_subscriptions.sql, 06_create_permits.sql
-- ============================================================================

-- ============================================================================
-- JURISDICTION ANALYTICS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS "JurisdictionAnalytics" (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    jurisdiction_id TEXT NOT NULL REFERENCES "Jurisdiction"(id) ON DELETE CASCADE,
    period_start TIMESTAMP WITH TIME ZONE NOT NULL,
    period_end TIMESTAMP WITH TIME ZONE NOT NULL,
    
    -- Volume Metrics
    total_permits INTEGER DEFAULT 0,
    permits_submitted INTEGER DEFAULT 0,
    permits_approved INTEGER DEFAULT 0,
    permits_rejected INTEGER DEFAULT 0,
    permits_expired INTEGER DEFAULT 0,
    
    -- Performance Metrics
    avg_review_time DECIMAL(10, 2), -- Days
    avg_approval_time DECIMAL(10, 2), -- Days
    first_time_approval_rate DECIMAL(5, 2), -- Percentage
    correction_rate DECIMAL(5, 2), -- Percentage needing corrections
    
    -- Inspection Metrics
    inspections_scheduled INTEGER DEFAULT 0,
    inspections_completed INTEGER DEFAULT 0,
    inspection_pass_rate DECIMAL(5, 2), -- Percentage
    
    -- AI Impact
    ai_reviews_run INTEGER DEFAULT 0,
    issues_caught_pre_review INTEGER DEFAULT 0,
    estimated_time_saved DECIMAL(10, 2), -- Hours
    
    -- Revenue (Kealee)
    expedited_fees DECIMAL(12, 2) DEFAULT 0,
    subscription_revenue DECIMAL(12, 2) DEFAULT 0,
    transaction_fees DECIMAL(12, 2) DEFAULT 0,
    
    -- Jurisdiction Stats
    avg_staff_workload DECIMAL(10, 2),
    backlog_size INTEGER,
    
    generated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_jurisdiction_analytics_jurisdiction_id ON "JurisdictionAnalytics"(jurisdiction_id);
CREATE INDEX IF NOT EXISTS idx_jurisdiction_analytics_period_start ON "JurisdictionAnalytics"(period_start);
CREATE INDEX IF NOT EXISTS idx_jurisdiction_analytics_period_end ON "JurisdictionAnalytics"(period_end);

-- ============================================================================
-- ORGANIZATION ANALYTICS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS "OrgAnalytics" (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    org_id TEXT NOT NULL REFERENCES "Org"(id) ON DELETE CASCADE,
    period_start TIMESTAMP WITH TIME ZONE NOT NULL,
    period_end TIMESTAMP WITH TIME ZONE NOT NULL,
    
    -- Project Metrics
    total_projects INTEGER DEFAULT 0,
    active_projects INTEGER DEFAULT 0,
    completed_projects INTEGER DEFAULT 0,
    total_project_value DECIMAL(12, 2) DEFAULT 0,
    
    -- Permit Metrics
    permits_submitted INTEGER DEFAULT 0,
    permits_approved INTEGER DEFAULT 0,
    avg_permit_processing_time DECIMAL(10, 2), -- Days
    
    -- Financial Metrics
    total_revenue DECIMAL(12, 2) DEFAULT 0,
    total_payments DECIMAL(12, 2) DEFAULT 0,
    subscription_cost DECIMAL(12, 2) DEFAULT 0,
    
    -- User Activity
    active_users INTEGER DEFAULT 0,
    total_logins INTEGER DEFAULT 0,
    api_calls INTEGER DEFAULT 0,
    
    -- Feature Usage
    features_used JSONB, -- Map of feature_key -> usage_count
    
    generated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_org_analytics_org_id ON "OrgAnalytics"(org_id);
CREATE INDEX IF NOT EXISTS idx_org_analytics_period_start ON "OrgAnalytics"(period_start);
CREATE INDEX IF NOT EXISTS idx_org_analytics_period_end ON "OrgAnalytics"(period_end);

-- ============================================================================
-- USER ANALYTICS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS "UserAnalytics" (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    user_id TEXT NOT NULL REFERENCES "User"(id) ON DELETE CASCADE,
    period_start TIMESTAMP WITH TIME ZONE NOT NULL,
    period_end TIMESTAMP WITH TIME ZONE NOT NULL,
    
    -- Activity Metrics
    logins INTEGER DEFAULT 0,
    projects_created INTEGER DEFAULT 0,
    permits_submitted INTEGER DEFAULT 0,
    inspections_scheduled INTEGER DEFAULT 0,
    files_uploaded INTEGER DEFAULT 0,
    
    -- Engagement Metrics
    sessions INTEGER DEFAULT 0,
    avg_session_duration INTEGER, -- Seconds
    pages_viewed INTEGER DEFAULT 0,
    
    -- Feature Usage
    features_used JSONB,
    
    generated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_user_analytics_user_id ON "UserAnalytics"(user_id);
CREATE INDEX IF NOT EXISTS idx_user_analytics_period_start ON "UserAnalytics"(period_start);
CREATE INDEX IF NOT EXISTS idx_user_analytics_period_end ON "UserAnalytics"(period_end);

-- ============================================================================
-- PERFORMANCE METRICS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS "PerformanceMetrics" (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    metric_type TEXT NOT NULL, -- API_RESPONSE_TIME, PAGE_LOAD_TIME, FILE_UPLOAD_TIME, etc.
    metric_name TEXT NOT NULL,
    value DECIMAL(12, 4) NOT NULL,
    unit TEXT, -- ms, seconds, bytes, etc.
    context JSONB, -- Additional context (endpoint, page, file_size, etc.)
    recorded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_performance_metrics_metric_type ON "PerformanceMetrics"(metric_type);
CREATE INDEX IF NOT EXISTS idx_performance_metrics_metric_name ON "PerformanceMetrics"(metric_name);
CREATE INDEX IF NOT EXISTS idx_performance_metrics_recorded_at ON "PerformanceMetrics"(recorded_at);

-- ============================================================================
-- REVENUE ANALYTICS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS "RevenueAnalytics" (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    org_id TEXT REFERENCES "Org"(id) ON DELETE SET NULL,
    period_start TIMESTAMP WITH TIME ZONE NOT NULL,
    period_end TIMESTAMP WITH TIME ZONE NOT NULL,
    
    -- Revenue Breakdown
    subscription_revenue DECIMAL(12, 2) DEFAULT 0,
    transaction_fees DECIMAL(12, 2) DEFAULT 0,
    expedited_fees DECIMAL(12, 2) DEFAULT 0,
    other_revenue DECIMAL(12, 2) DEFAULT 0,
    total_revenue DECIMAL(12, 2) DEFAULT 0,
    
    -- Subscription Metrics
    new_subscriptions INTEGER DEFAULT 0,
    canceled_subscriptions INTEGER DEFAULT 0,
    active_subscriptions INTEGER DEFAULT 0,
    mrr DECIMAL(12, 2) DEFAULT 0, -- Monthly Recurring Revenue
    arr DECIMAL(12, 2) DEFAULT 0, -- Annual Recurring Revenue
    
    -- Payment Metrics
    total_payments INTEGER DEFAULT 0,
    successful_payments INTEGER DEFAULT 0,
    failed_payments INTEGER DEFAULT 0,
    refunds DECIMAL(12, 2) DEFAULT 0,
    
    generated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_revenue_analytics_org_id ON "RevenueAnalytics"(org_id);
CREATE INDEX IF NOT EXISTS idx_revenue_analytics_period_start ON "RevenueAnalytics"(period_start);
CREATE INDEX IF NOT EXISTS idx_revenue_analytics_period_end ON "RevenueAnalytics"(period_end);

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON TABLE "JurisdictionAnalytics" IS 'Analytics for permit jurisdictions';
COMMENT ON TABLE "OrgAnalytics" IS 'Organization-level analytics';
COMMENT ON TABLE "UserAnalytics" IS 'User activity and engagement analytics';
COMMENT ON TABLE "PerformanceMetrics" IS 'System performance metrics';
COMMENT ON TABLE "RevenueAnalytics" IS 'Revenue and subscription analytics';
