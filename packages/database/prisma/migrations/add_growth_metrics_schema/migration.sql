-- CreateEnum for AcquisitionSource
CREATE TYPE "AcquisitionSource" AS ENUM ('GOOGLE_ADS', 'META_ADS', 'TIKTOK', 'ORGANIC', 'PARTNERSHIP', 'REFERRAL', 'DIRECT', 'OTHER');

-- CreateEnum for ConversionEventType
CREATE TYPE "ConversionEventType" AS ENUM ('SIGNUP', 'FIRST_PROJECT', 'PAYMENT', 'CONTRACTOR_HIRED', 'CONCEPT_GENERATED', 'ESTIMATE_COMPLETED', 'PERMIT_SUBMITTED');

-- CreateTable UserAcquisition
CREATE TABLE "growth_user_acquisitions" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "source" "AcquisitionSource" NOT NULL,
    "medium" TEXT,
    "campaign" TEXT,
    "gclid" TEXT,
    "fbclid" TEXT,
    "utmSource" TEXT,
    "utmMedium" TEXT,
    "utmCampaign" TEXT,
    "utmContent" TEXT,
    "metadata" JSONB,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "growth_user_acquisitions_pkey" PRIMARY KEY ("id")
);

-- CreateTable ConversionEvent
CREATE TABLE "growth_conversion_events" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "eventType" "ConversionEventType" NOT NULL,
    "projectId" TEXT,
    "projectValue" DECIMAL(12,2),
    "metadata" JSONB,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "growth_conversion_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable FunnelMetrics
CREATE TABLE "growth_funnel_metrics" (
    "id" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "channel" TEXT NOT NULL,
    "newSignups" INTEGER NOT NULL DEFAULT 0,
    "intakeStarted" INTEGER NOT NULL DEFAULT 0,
    "intakeCompleted" INTEGER NOT NULL DEFAULT 0,
    "paymentsProcessed" INTEGER NOT NULL DEFAULT 0,
    "projectsCreated" INTEGER NOT NULL DEFAULT 0,
    "firstConversion" INTEGER NOT NULL DEFAULT 0,
    "conversionRate" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "totalSpend" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "costPerAcquisition" DECIMAL(10,4) NOT NULL DEFAULT 0,
    "costPerConversion" DECIMAL(10,4) NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "growth_funnel_metrics_pkey" PRIMARY KEY ("id")
);

-- CreateTable ChannelMetrics
CREATE TABLE "growth_channel_metrics" (
    "id" TEXT NOT NULL,
    "channel" TEXT NOT NULL,
    "totalUsers" INTEGER NOT NULL DEFAULT 0,
    "totalSpend" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "totalRevenue" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "cac" DECIMAL(10,4) NOT NULL DEFAULT 0,
    "ltv" DECIMAL(10,4) NOT NULL DEFAULT 0,
    "roi" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "conversionRate" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "retentionRate" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "averageOrderValue" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "repeatPurchaseRate" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "attributionValue" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "lastUpdated" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "growth_channel_metrics_pkey" PRIMARY KEY ("id")
);

-- CreateTable CohortAnalysis
CREATE TABLE "growth_cohort_analysis" (
    "id" TEXT NOT NULL,
    "cohortDate" DATE NOT NULL,
    "cohortSize" INTEGER NOT NULL DEFAULT 0,
    "channel" TEXT,
    "day0Retained" INTEGER NOT NULL DEFAULT 0,
    "day1Retained" INTEGER NOT NULL DEFAULT 0,
    "day7Retained" INTEGER NOT NULL DEFAULT 0,
    "day30Retained" INTEGER NOT NULL DEFAULT 0,
    "day60Retained" INTEGER NOT NULL DEFAULT 0,
    "day90Retained" INTEGER NOT NULL DEFAULT 0,
    "d0Rate" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "d1Rate" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "d7Rate" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "d30Rate" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "d60Rate" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "d90Rate" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "lastCalculatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "growth_cohort_analysis_pkey" PRIMARY KEY ("id")
);

-- CreateTable GrowthMetric
CREATE TABLE "growth_daily_metrics" (
    "id" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "totalOwners" INTEGER NOT NULL DEFAULT 0,
    "totalContractors" INTEGER NOT NULL DEFAULT 0,
    "newOwners" INTEGER NOT NULL DEFAULT 0,
    "newContractors" INTEGER NOT NULL DEFAULT 0,
    "activeOwners" INTEGER NOT NULL DEFAULT 0,
    "activeContractors" INTEGER NOT NULL DEFAULT 0,
    "churnOwners" INTEGER NOT NULL DEFAULT 0,
    "churnContractors" INTEGER NOT NULL DEFAULT 0,
    "churnRate" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "averageCAC" DECIMAL(10,4) NOT NULL DEFAULT 0,
    "estimatedARR" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "totalProjects" INTEGER NOT NULL DEFAULT 0,
    "totalRevenue" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "insights" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "growth_daily_metrics_pkey" PRIMARY KEY ("id")
);

-- CreateTable PartnershipMetric
CREATE TABLE "growth_partnership_metrics" (
    "id" TEXT NOT NULL,
    "partnerName" TEXT NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL,
    "usersFromPartner" INTEGER NOT NULL DEFAULT 0,
    "revenueFromPartner" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "costToPartner" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "roi" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "integrationPoints" TEXT[],
    "lastUpdated" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "growth_partnership_metrics_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "growth_user_acquisitions_userId_idx" ON "growth_user_acquisitions"("userId");
CREATE INDEX "growth_user_acquisitions_source_idx" ON "growth_user_acquisitions"("source");
CREATE INDEX "growth_user_acquisitions_timestamp_idx" ON "growth_user_acquisitions"("timestamp");
CREATE INDEX "growth_user_acquisitions_campaign_idx" ON "growth_user_acquisitions"("campaign");

-- CreateIndex
CREATE INDEX "growth_conversion_events_userId_idx" ON "growth_conversion_events"("userId");
CREATE INDEX "growth_conversion_events_eventType_idx" ON "growth_conversion_events"("eventType");
CREATE INDEX "growth_conversion_events_timestamp_idx" ON "growth_conversion_events"("timestamp");

-- CreateIndex
CREATE UNIQUE INDEX "growth_funnel_metrics_date_channel_key" ON "growth_funnel_metrics"("date", "channel");
CREATE INDEX "growth_funnel_metrics_date_idx" ON "growth_funnel_metrics"("date");
CREATE INDEX "growth_funnel_metrics_channel_idx" ON "growth_funnel_metrics"("channel");

-- CreateIndex
CREATE UNIQUE INDEX "growth_channel_metrics_channel_key" ON "growth_channel_metrics"("channel");

-- CreateIndex
CREATE UNIQUE INDEX "growth_cohort_analysis_cohortDate_channel_key" ON "growth_cohort_analysis"("cohortDate", "channel");
CREATE INDEX "growth_cohort_analysis_cohortDate_idx" ON "growth_cohort_analysis"("cohortDate");
CREATE INDEX "growth_cohort_analysis_channel_idx" ON "growth_cohort_analysis"("channel");

-- CreateIndex
CREATE UNIQUE INDEX "growth_daily_metrics_date_key" ON "growth_daily_metrics"("date");
CREATE INDEX "growth_daily_metrics_date_idx" ON "growth_daily_metrics"("date");

-- CreateIndex
CREATE INDEX "growth_partnership_metrics_partnerName_idx" ON "growth_partnership_metrics"("partnerName");
CREATE INDEX "growth_partnership_metrics_status_idx" ON "growth_partnership_metrics"("status");

-- AddForeignKey
ALTER TABLE "growth_user_acquisitions" ADD CONSTRAINT "growth_user_acquisitions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "growth_conversion_events" ADD CONSTRAINT "growth_conversion_events_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
