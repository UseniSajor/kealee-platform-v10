-- ============================================================================
-- 02_create_subscriptions.sql
-- Subscription Management Tables
-- Depends on: 01_create_tables.sql
-- ============================================================================

-- ============================================================================
-- ENUMS
-- ============================================================================

DO $$ BEGIN
    CREATE TYPE subscription_status AS ENUM (
        'trialing', 'active', 'past_due', 'canceled', 'unpaid', 'incomplete', 
        'incomplete_expired', 'paused'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- ============================================================================
-- SERVICE SUBSCRIPTIONS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS "ServiceSubscription" (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    org_id TEXT NOT NULL REFERENCES "Org"(id) ON DELETE CASCADE,
    service_plan_id TEXT REFERENCES "ServicePlan"(id) ON DELETE SET NULL,
    stripe_id TEXT UNIQUE,
    stripe_customer_id TEXT,
    status subscription_status DEFAULT 'incomplete',
    current_period_start TIMESTAMP WITH TIME ZONE,
    current_period_end TIMESTAMP WITH TIME ZONE,
    cancel_at_period_end BOOLEAN DEFAULT false,
    canceled_at TIMESTAMP WITH TIME ZONE,
    trial_start TIMESTAMP WITH TIME ZONE,
    trial_end TIMESTAMP WITH TIME ZONE,
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_service_subscription_org_id ON "ServiceSubscription"(org_id);
CREATE INDEX IF NOT EXISTS idx_service_subscription_stripe_id ON "ServiceSubscription"(stripe_id);
CREATE INDEX IF NOT EXISTS idx_service_subscription_stripe_customer_id ON "ServiceSubscription"(stripe_customer_id);
CREATE INDEX IF NOT EXISTS idx_service_subscription_status ON "ServiceSubscription"(status);
CREATE INDEX IF NOT EXISTS idx_service_subscription_current_period_end ON "ServiceSubscription"(current_period_end);

-- ============================================================================
-- SUBSCRIPTION USAGE TRACKING
-- ============================================================================

CREATE TABLE IF NOT EXISTS "SubscriptionUsage" (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    subscription_id TEXT NOT NULL REFERENCES "ServiceSubscription"(id) ON DELETE CASCADE,
    feature_key TEXT NOT NULL,
    usage_count INTEGER DEFAULT 0,
    limit_count INTEGER,
    period_start TIMESTAMP WITH TIME ZONE,
    period_end TIMESTAMP WITH TIME ZONE,
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(subscription_id, feature_key, period_start)
);

CREATE INDEX IF NOT EXISTS idx_subscription_usage_subscription_id ON "SubscriptionUsage"(subscription_id);
CREATE INDEX IF NOT EXISTS idx_subscription_usage_feature_key ON "SubscriptionUsage"(feature_key);
CREATE INDEX IF NOT EXISTS idx_subscription_usage_period ON "SubscriptionUsage"(period_start, period_end);

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON TABLE "ServiceSubscription" IS 'Organization subscriptions to service plans';
COMMENT ON TABLE "SubscriptionUsage" IS 'Feature usage tracking for subscriptions';
