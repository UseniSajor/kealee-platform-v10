-- CreateTable: service_subscriptions
-- Resolves missing model referenced 17x in stripe.webhook.ts
CREATE TABLE "service_subscriptions" (
    "id"                   TEXT NOT NULL,
    "orgId"                TEXT NOT NULL,
    "servicePlanId"        TEXT NOT NULL,
    "status"               TEXT NOT NULL DEFAULT 'active',
    "stripeId"             TEXT NOT NULL,
    "stripeCustomerId"     TEXT,
    "currentPeriodStart"   TIMESTAMP(3) NOT NULL,
    "currentPeriodEnd"     TIMESTAMP(3) NOT NULL,
    "cancelAtPeriodEnd"    BOOLEAN NOT NULL DEFAULT false,
    "canceledAt"           TIMESTAMP(3),
    "metadata"             JSONB,
    "createdAt"            TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt"            TIMESTAMP(3) NOT NULL,

    CONSTRAINT "service_subscriptions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "service_subscriptions_stripeId_key" ON "service_subscriptions"("stripeId");
CREATE INDEX "service_subscriptions_orgId_idx" ON "service_subscriptions"("orgId");
CREATE INDEX "service_subscriptions_status_idx" ON "service_subscriptions"("status");
CREATE INDEX "service_subscriptions_stripeId_idx" ON "service_subscriptions"("stripeId");

-- AddForeignKey
ALTER TABLE "service_subscriptions" ADD CONSTRAINT "service_subscriptions_orgId_fkey"
    FOREIGN KEY ("orgId") REFERENCES "Org"("id") ON DELETE CASCADE ON UPDATE CASCADE;
