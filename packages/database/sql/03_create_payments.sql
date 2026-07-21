-- ============================================================================
-- 03_create_payments.sql
-- Payment Processing Tables
-- Depends on: 01_create_tables.sql, 02_create_subscriptions.sql
-- ============================================================================

-- ============================================================================
-- ENUMS
-- ============================================================================

DO $$ BEGIN
    CREATE TYPE payment_status AS ENUM (
        'pending', 'processing', 'succeeded', 'failed', 'canceled', 'refunded', 
        'partially_refunded', 'requires_action', 'requires_payment_method'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE invoice_status AS ENUM (
        'draft', 'open', 'paid', 'uncollectible', 'void'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- ============================================================================
-- PAYMENTS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS "Payment" (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    org_id TEXT REFERENCES "Org"(id) ON DELETE SET NULL,
    subscription_id TEXT REFERENCES "ServiceSubscription"(id) ON DELETE SET NULL,
    stripe_invoice_id TEXT,
    stripe_payment_intent_id TEXT UNIQUE,
    amount DECIMAL(10, 2) NOT NULL,
    currency TEXT DEFAULT 'usd',
    status payment_status DEFAULT 'pending',
    description TEXT,
    paid_at TIMESTAMP WITH TIME ZONE,
    failed_at TIMESTAMP WITH TIME ZONE,
    refunded_at TIMESTAMP WITH TIME ZONE,
    refund_amount DECIMAL(10, 2),
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_payment_org_id ON "Payment"(org_id);
CREATE INDEX IF NOT EXISTS idx_payment_subscription_id ON "Payment"(subscription_id);
CREATE INDEX IF NOT EXISTS idx_payment_stripe_payment_intent_id ON "Payment"(stripe_payment_intent_id);
CREATE INDEX IF NOT EXISTS idx_payment_stripe_invoice_id ON "Payment"(stripe_invoice_id);
CREATE INDEX IF NOT EXISTS idx_payment_status ON "Payment"(status);
CREATE INDEX IF NOT EXISTS idx_payment_created_at ON "Payment"(created_at);

-- ============================================================================
-- INVOICES TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS "Invoice" (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    org_id TEXT REFERENCES "Org"(id) ON DELETE SET NULL,
    subscription_id TEXT REFERENCES "ServiceSubscription"(id) ON DELETE SET NULL,
    stripe_invoice_id TEXT UNIQUE NOT NULL,
    invoice_number TEXT,
    amount DECIMAL(10, 2) NOT NULL,
    currency TEXT DEFAULT 'usd',
    status invoice_status DEFAULT 'draft',
    period_start TIMESTAMP WITH TIME ZONE,
    period_end TIMESTAMP WITH TIME ZONE,
    paid_at TIMESTAMP WITH TIME ZONE,
    hosted_invoice_url TEXT,
    invoice_pdf TEXT,
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_invoice_org_id ON "Invoice"(org_id);
CREATE INDEX IF NOT EXISTS idx_invoice_subscription_id ON "Invoice"(subscription_id);
CREATE INDEX IF NOT EXISTS idx_invoice_stripe_invoice_id ON "Invoice"(stripe_invoice_id);
CREATE INDEX IF NOT EXISTS idx_invoice_status ON "Invoice"(status);
CREATE INDEX IF NOT EXISTS idx_invoice_created_at ON "Invoice"(created_at);

-- ============================================================================
-- PAYMENT METHODS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS "PaymentMethod" (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    org_id TEXT REFERENCES "Org"(id) ON DELETE CASCADE,
    user_id TEXT REFERENCES "User"(id) ON DELETE CASCADE,
    stripe_payment_method_id TEXT UNIQUE NOT NULL,
    stripe_customer_id TEXT NOT NULL,
    type TEXT NOT NULL, -- card, bank_account, etc.
    is_default BOOLEAN DEFAULT false,
    card_brand TEXT,
    card_last4 TEXT,
    card_exp_month INTEGER,
    card_exp_year INTEGER,
    billing_details JSONB,
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_payment_method_org_id ON "PaymentMethod"(org_id);
CREATE INDEX IF NOT EXISTS idx_payment_method_user_id ON "PaymentMethod"(user_id);
CREATE INDEX IF NOT EXISTS idx_payment_method_stripe_payment_method_id ON "PaymentMethod"(stripe_payment_method_id);
CREATE INDEX IF NOT EXISTS idx_payment_method_stripe_customer_id ON "PaymentMethod"(stripe_customer_id);
CREATE INDEX IF NOT EXISTS idx_payment_method_is_default ON "PaymentMethod"(is_default);

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON TABLE "Payment" IS 'Payment records for subscriptions and one-time payments';
COMMENT ON TABLE "Invoice" IS 'Invoice records from Stripe';
COMMENT ON TABLE "PaymentMethod" IS 'Stored payment methods for customers';
