-- CreateEnum
CREATE TYPE "TwinTier" AS ENUM ('L1', 'L2', 'L3');

-- CreateEnum
CREATE TYPE "TwinStatus" AS ENUM ('INTAKE', 'LAND_ANALYSIS', 'FEASIBILITY', 'ENTITLEMENT', 'PRE_CONSTRUCTION', 'CONSTRUCTION', 'CLOSEOUT', 'OPERATIONS', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "TwinHealthStatus" AS ENUM ('HEALTHY', 'AT_RISK', 'CRITICAL', 'UNKNOWN');

-- CreateEnum
CREATE TYPE "ParcelStatus" AS ENUM ('IDENTIFIED', 'UNDER_ANALYSIS', 'OFFER_PENDING', 'UNDER_CONTRACT', 'DUE_DILIGENCE', 'ACQUIRED', 'CONVERTED', 'REJECTED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "AssessmentType" AS ENUM ('ENVIRONMENTAL', 'GEOTECHNICAL', 'SURVEY', 'TITLE', 'TRAFFIC', 'UTILITY', 'FLOOD', 'WETLAND');

-- CreateEnum
CREATE TYPE "AssessmentStatus" AS ENUM ('NOT_STARTED', 'IN_PROGRESS', 'COMPLETED', 'FLAGGED', 'CLEARED');

-- CreateEnum
CREATE TYPE "FeasibilityStatus" AS ENUM ('DRAFT', 'DATA_GATHERING', 'ANALYZING', 'REVIEW', 'GO', 'NO_GO', 'ON_HOLD', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "CapitalSourceType" AS ENUM ('SENIOR_DEBT', 'MEZZANINE', 'PREFERRED_EQUITY', 'COMMON_EQUITY', 'GRANT', 'TAX_CREDIT', 'SELLER_FINANCING', 'OTHER');

-- CreateEnum
CREATE TYPE "DrawStatus" AS ENUM ('DRAFT', 'SUBMITTED', 'IN_REVIEW', 'APPROVED', 'FUNDED', 'REJECTED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "EntitlementType" AS ENUM ('REZONING', 'VARIANCE', 'CONDITIONAL_USE', 'SITE_PLAN', 'SUBDIVISION', 'PUD', 'ENVIRONMENTAL', 'HISTORIC', 'OTHER');

-- CreateEnum
CREATE TYPE "EntitlementStatus" AS ENUM ('NOT_STARTED', 'APPLICATION_PREP', 'SUBMITTED', 'UNDER_REVIEW', 'PUBLIC_HEARING', 'APPROVED', 'APPROVED_WITH_CONDITIONS', 'DENIED', 'APPEALED', 'EXPIRED');

-- CreateEnum
CREATE TYPE "TurnoverItemStatus" AS ENUM ('PENDING', 'IN_PROGRESS', 'COMPLETED', 'NOT_APPLICABLE', 'DEFERRED');

-- CreateEnum
CREATE TYPE "WorkOrderPriority" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'URGENT', 'EMERGENCY');

-- CreateEnum
CREATE TYPE "WorkOrderStatus" AS ENUM ('OPEN', 'ASSIGNED', 'IN_PROGRESS', 'ON_HOLD', 'COMPLETED', 'CLOSED', 'CANCELLED');

-- CreateTable
CREATE TABLE "digital_twins" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "orgId" TEXT NOT NULL,
    "tier" "TwinTier" NOT NULL DEFAULT 'L1',
    "status" "TwinStatus" NOT NULL DEFAULT 'INTAKE',
    "healthStatus" "TwinHealthStatus" NOT NULL DEFAULT 'UNKNOWN',
    "healthScore" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "label" TEXT,
    "currentPhase" TEXT,
    "phaseStartedAt" TIMESTAMP(3),
    "phaseHistory" JSONB,
    "metrics" JSONB,
    "lastMetricsCalc" TIMESTAMP(3),
    "enabledModules" TEXT[],
    "config" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "digital_twins_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "twin_snapshots" (
    "id" TEXT NOT NULL,
    "twinId" TEXT NOT NULL,
    "label" TEXT,
    "snapshotAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "trigger" TEXT,
    "status" "TwinStatus" NOT NULL,
    "healthScore" DOUBLE PRECISION NOT NULL,
    "metrics" JSONB NOT NULL,
    "moduleState" JSONB,
    "kpiValues" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "twin_snapshots_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "twin_events" (
    "id" TEXT NOT NULL,
    "twinId" TEXT NOT NULL,
    "eventType" TEXT NOT NULL,
    "source" TEXT NOT NULL,
    "severity" TEXT NOT NULL DEFAULT 'INFO',
    "payload" JSONB NOT NULL,
    "description" TEXT,
    "correlationId" TEXT,
    "causedBy" TEXT,
    "actorType" TEXT NOT NULL DEFAULT 'SYSTEM',
    "actorId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "twin_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "twin_modules" (
    "id" TEXT NOT NULL,
    "twinId" TEXT NOT NULL,
    "moduleKey" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "activatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deactivatedAt" TIMESTAMP(3),
    "state" JSONB,
    "lastSyncAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "twin_modules_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "twin_kpis" (
    "id" TEXT NOT NULL,
    "twinId" TEXT NOT NULL,
    "kpiKey" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "currentValue" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "unit" TEXT,
    "targetValue" DOUBLE PRECISION,
    "warningMin" DOUBLE PRECISION,
    "warningMax" DOUBLE PRECISION,
    "criticalMin" DOUBLE PRECISION,
    "criticalMax" DOUBLE PRECISION,
    "status" TEXT NOT NULL DEFAULT 'HEALTHY',
    "lastUpdated" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "history" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "twin_kpis_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "parcels" (
    "id" TEXT NOT NULL,
    "orgId" TEXT NOT NULL,
    "parcelNumber" TEXT,
    "legalDesc" TEXT,
    "label" TEXT NOT NULL,
    "address" TEXT,
    "city" TEXT,
    "county" TEXT,
    "state" TEXT,
    "zipCode" TEXT,
    "latitude" DOUBLE PRECISION,
    "longitude" DOUBLE PRECISION,
    "geoBoundary" JSONB,
    "acreage" DECIMAL(10,4),
    "squareFeet" DECIMAL(14,2),
    "frontage" DECIMAL(10,2),
    "depth" DECIMAL(10,2),
    "topography" TEXT,
    "currentUse" TEXT,
    "currentOwner" TEXT,
    "ownerContact" JSONB,
    "taxAssessment" DECIMAL(14,2),
    "annualTaxes" DECIMAL(10,2),
    "developmentScore" DOUBLE PRECISION,
    "scoringFactors" JSONB,
    "status" "ParcelStatus" NOT NULL DEFAULT 'IDENTIFIED',
    "identifiedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "identifiedBy" TEXT,
    "projectId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "parcels_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "parcel_zonings" (
    "id" TEXT NOT NULL,
    "parcelId" TEXT NOT NULL,
    "zoningCode" TEXT NOT NULL,
    "zoningDesc" TEXT,
    "overlay" TEXT,
    "jurisdiction" TEXT,
    "maxDensity" DOUBLE PRECISION,
    "maxHeight" DOUBLE PRECISION,
    "maxFAR" DOUBLE PRECISION,
    "maxLotCoverage" DOUBLE PRECISION,
    "minLotSize" DECIMAL(10,2),
    "frontSetback" DOUBLE PRECISION,
    "sideSetback" DOUBLE PRECISION,
    "rearSetback" DOUBLE PRECISION,
    "allowedUses" TEXT[],
    "conditionalUses" TEXT[],
    "prohibitedUses" TEXT[],
    "parkingRatio" DOUBLE PRECISION,
    "parkingNotes" TEXT,
    "aiAnalysis" JSONB,
    "complianceNotes" TEXT,
    "sourceUrl" TEXT,
    "verifiedAt" TIMESTAMP(3),
    "verifiedBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "parcel_zonings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "site_assessments" (
    "id" TEXT NOT NULL,
    "parcelId" TEXT NOT NULL,
    "assessmentType" "AssessmentType" NOT NULL,
    "status" "AssessmentStatus" NOT NULL DEFAULT 'NOT_STARTED',
    "title" TEXT,
    "description" TEXT,
    "vendorName" TEXT,
    "vendorContact" JSONB,
    "estimatedCost" DECIMAL(10,2),
    "actualCost" DECIMAL(10,2),
    "orderedAt" TIMESTAMP(3),
    "scheduledAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "findings" JSONB,
    "summary" TEXT,
    "riskLevel" TEXT,
    "flaggedIssues" JSONB,
    "reportUrl" TEXT,
    "attachments" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "site_assessments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "parcel_comparables" (
    "id" TEXT NOT NULL,
    "parcelId" TEXT NOT NULL,
    "address" TEXT,
    "saleDate" TIMESTAMP(3),
    "salePrice" DECIMAL(14,2),
    "pricePerSqFt" DECIMAL(10,2),
    "pricePerAcre" DECIMAL(14,2),
    "acreage" DECIMAL(10,4),
    "zoningCode" TEXT,
    "distanceMiles" DOUBLE PRECISION,
    "similarity" DOUBLE PRECISION,
    "adjustments" JSONB,
    "adjustedPrice" DECIMAL(14,2),
    "sourceUrl" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "parcel_comparables_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "parcel_documents" (
    "id" TEXT NOT NULL,
    "parcelId" TEXT NOT NULL,
    "documentType" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "fileUrl" TEXT NOT NULL,
    "fileSize" INTEGER,
    "mimeType" TEXT,
    "uploadedBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "parcel_documents_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "parcel_notes" (
    "id" TEXT NOT NULL,
    "parcelId" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "authorId" TEXT NOT NULL,
    "authorName" TEXT,
    "isPinned" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "parcel_notes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "land_offers" (
    "id" TEXT NOT NULL,
    "parcelId" TEXT NOT NULL,
    "offerAmount" DECIMAL(14,2) NOT NULL,
    "earnestMoney" DECIMAL(10,2),
    "offerDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expirationDate" TIMESTAMP(3),
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "counterAmount" DECIMAL(14,2),
    "counterDate" TIMESTAMP(3),
    "counterNotes" TEXT,
    "ddPeriodDays" INTEGER,
    "ddStartDate" TIMESTAMP(3),
    "ddEndDate" TIMESTAMP(3),
    "ddCompleted" BOOLEAN NOT NULL DEFAULT false,
    "closingDate" TIMESTAMP(3),
    "closingAmount" DECIMAL(14,2),
    "closedAt" TIMESTAMP(3),
    "offerDocUrl" TEXT,
    "notes" TEXT,
    "createdBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "land_offers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "feasibility_studies" (
    "id" TEXT NOT NULL,
    "projectId" TEXT,
    "parcelId" TEXT,
    "orgId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "status" "FeasibilityStatus" NOT NULL DEFAULT 'DRAFT',
    "landCost" DECIMAL(14,2),
    "targetUnits" INTEGER,
    "targetSqFt" DECIMAL(14,2),
    "productType" TEXT,
    "constructionType" TEXT,
    "aiAnalysis" JSONB,
    "aiConfidence" DOUBLE PRECISION,
    "aiModelUsed" TEXT,
    "decision" TEXT,
    "decisionDate" TIMESTAMP(3),
    "decisionBy" TEXT,
    "decisionNotes" TEXT,
    "bestIRR" DOUBLE PRECISION,
    "bestROI" DOUBLE PRECISION,
    "bestNOI" DECIMAL(14,2),
    "totalProjectCost" DECIMAL(14,2),
    "createdBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "feasibility_studies_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "feasibility_scenarios" (
    "id" TEXT NOT NULL,
    "studyId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "isBaseline" BOOLEAN NOT NULL DEFAULT false,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "unitMix" JSONB NOT NULL,
    "totalUnits" INTEGER NOT NULL DEFAULT 0,
    "totalSqFt" DECIMAL(14,2),
    "landCost" DECIMAL(14,2),
    "hardCosts" DECIMAL(14,2),
    "softCosts" DECIMAL(14,2),
    "contingency" DECIMAL(14,2),
    "totalDevelopCost" DECIMAL(14,2),
    "costPerUnit" DECIMAL(10,2),
    "costPerSqFt" DECIMAL(10,2),
    "grossRevenue" DECIMAL(14,2),
    "grossRentalIncome" DECIMAL(14,2),
    "vacancyRate" DOUBLE PRECISION,
    "effectiveGrossIncome" DECIMAL(14,2),
    "operatingExpenses" DECIMAL(14,2),
    "netOperatingIncome" DECIMAL(14,2),
    "irr" DOUBLE PRECISION,
    "roi" DOUBLE PRECISION,
    "cashOnCash" DOUBLE PRECISION,
    "capRate" DOUBLE PRECISION,
    "equityMultiple" DOUBLE PRECISION,
    "paybackMonths" INTEGER,
    "proformaYears" INTEGER NOT NULL DEFAULT 10,
    "proforma" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "feasibility_scenarios_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "feasibility_cost_assumptions" (
    "id" TEXT NOT NULL,
    "studyId" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "subcategory" TEXT,
    "lineItem" TEXT NOT NULL,
    "amount" DECIMAL(14,2) NOT NULL,
    "unit" TEXT,
    "quantity" DECIMAL(10,2),
    "totalCost" DECIMAL(14,2),
    "source" TEXT,
    "confidence" DOUBLE PRECISION,
    "notes" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "feasibility_cost_assumptions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "feasibility_revenue_assumptions" (
    "id" TEXT NOT NULL,
    "studyId" TEXT NOT NULL,
    "unitType" TEXT NOT NULL,
    "unitCount" INTEGER NOT NULL,
    "avgSqFt" DECIMAL(10,2),
    "pricePerUnit" DECIMAL(14,2),
    "pricePerSqFt" DECIMAL(10,2),
    "monthlyRent" DECIMAL(10,2),
    "annualEscalation" DOUBLE PRECISION,
    "stabilizedOccupancy" DOUBLE PRECISION,
    "absorptionMonths" INTEGER,
    "notes" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "feasibility_revenue_assumptions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "feasibility_comparisons" (
    "id" TEXT NOT NULL,
    "studyId" TEXT NOT NULL,
    "projectName" TEXT NOT NULL,
    "address" TEXT,
    "completedAt" TIMESTAMP(3),
    "productType" TEXT,
    "totalUnits" INTEGER,
    "totalSqFt" DECIMAL(14,2),
    "totalCost" DECIMAL(14,2),
    "costPerUnit" DECIMAL(10,2),
    "costPerSqFt" DECIMAL(10,2),
    "avgSalePrice" DECIMAL(14,2),
    "avgRent" DECIMAL(10,2),
    "capRate" DOUBLE PRECISION,
    "similarity" DOUBLE PRECISION,
    "notes" TEXT,
    "sourceUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "feasibility_comparisons_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "capital_stacks" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "orgId" TEXT NOT NULL,
    "totalCapital" DECIMAL(14,2) NOT NULL,
    "seniorDebt" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "mezzanineDebt" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "preferredEquity" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "commonEquity" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "grants" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "otherSources" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "loanToValue" DOUBLE PRECISION,
    "loanToCost" DOUBLE PRECISION,
    "debtServiceCoverage" DOUBLE PRECISION,
    "isFinalized" BOOLEAN NOT NULL DEFAULT false,
    "finalizedAt" TIMESTAMP(3),
    "finalizedBy" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "capital_stacks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "capital_sources" (
    "id" TEXT NOT NULL,
    "capitalStackId" TEXT NOT NULL,
    "sourceType" "CapitalSourceType" NOT NULL,
    "lenderName" TEXT NOT NULL,
    "contactInfo" JSONB,
    "commitmentAmount" DECIMAL(14,2) NOT NULL,
    "fundedAmount" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "remainingAmount" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "interestRate" DOUBLE PRECISION,
    "term" INTEGER,
    "amortization" INTEGER,
    "ioPeriod" INTEGER,
    "origFee" DOUBLE PRECISION,
    "exitFee" DOUBLE PRECISION,
    "prepayPenalty" TEXT,
    "covenants" JSONB,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "closedAt" TIMESTAMP(3),
    "maturityDate" TIMESTAMP(3),
    "notes" TEXT,
    "documentUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "capital_sources_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "draw_schedules" (
    "id" TEXT NOT NULL,
    "capitalStackId" TEXT NOT NULL,
    "drawNumber" INTEGER NOT NULL,
    "requestDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "periodStart" TIMESTAMP(3),
    "periodEnd" TIMESTAMP(3),
    "requestedAmount" DECIMAL(14,2) NOT NULL,
    "approvedAmount" DECIMAL(14,2),
    "retainage" DECIMAL(14,2),
    "netDisbursement" DECIMAL(14,2),
    "lineItems" JSONB,
    "status" "DrawStatus" NOT NULL DEFAULT 'DRAFT',
    "submittedAt" TIMESTAMP(3),
    "reviewedAt" TIMESTAMP(3),
    "reviewedBy" TEXT,
    "approvedAt" TIMESTAMP(3),
    "approvedBy" TEXT,
    "fundedAt" TIMESTAMP(3),
    "rejectionReason" TEXT,
    "inspectionRequired" BOOLEAN NOT NULL DEFAULT true,
    "inspectionDate" TIMESTAMP(3),
    "inspectionResult" TEXT,
    "inspectorName" TEXT,
    "inspectionReport" TEXT,
    "completionPercent" DOUBLE PRECISION,
    "lienWaiversRequired" BOOLEAN NOT NULL DEFAULT true,
    "lienWaiversReceived" BOOLEAN NOT NULL DEFAULT false,
    "lienWaiverDocs" JSONB,
    "supportingDocs" JSONB,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "draw_schedules_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "investor_reports" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "orgId" TEXT NOT NULL,
    "reportType" TEXT NOT NULL,
    "periodStart" TIMESTAMP(3) NOT NULL,
    "periodEnd" TIMESTAMP(3) NOT NULL,
    "title" TEXT,
    "totalInvested" DECIMAL(14,2),
    "totalSpent" DECIMAL(14,2),
    "budgetRemaining" DECIMAL(14,2),
    "budgetVariance" DOUBLE PRECISION,
    "overallCompletion" DOUBLE PRECISION,
    "scheduleVariance" DOUBLE PRECISION,
    "distributionAmount" DECIMAL(14,2),
    "distributionDate" TIMESTAMP(3),
    "distributionType" TEXT,
    "narrative" TEXT,
    "highlights" JSONB,
    "risks" JSONB,
    "nextSteps" JSONB,
    "reportPdfUrl" TEXT,
    "attachments" JSONB,
    "aiGenerated" BOOLEAN NOT NULL DEFAULT false,
    "aiModelUsed" TEXT,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "publishedAt" TIMESTAMP(3),
    "publishedBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "investor_reports_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "entitlements" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "orgId" TEXT NOT NULL,
    "entitlementType" "EntitlementType" NOT NULL,
    "status" "EntitlementStatus" NOT NULL DEFAULT 'NOT_STARTED',
    "title" TEXT NOT NULL,
    "description" TEXT,
    "jurisdiction" TEXT,
    "department" TEXT,
    "caseNumber" TEXT,
    "applicationDate" TIMESTAMP(3),
    "hearingDate" TIMESTAMP(3),
    "decisionDate" TIMESTAMP(3),
    "expirationDate" TIMESTAMP(3),
    "conditions" JSONB,
    "conditionsMet" BOOLEAN NOT NULL DEFAULT false,
    "applicationFee" DECIMAL(10,2),
    "legalCosts" DECIMAL(10,2),
    "consultantCosts" DECIMAL(10,2),
    "impactFees" DECIMAL(14,2),
    "totalCosts" DECIMAL(14,2),
    "applicationUrl" TEXT,
    "approvalUrl" TEXT,
    "attachments" JSONB,
    "notes" TEXT,
    "assignedTo" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "entitlements_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "payment_schedule_templates" (
    "id" TEXT NOT NULL,
    "orgId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "projectType" TEXT,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "milestones" JSONB NOT NULL,
    "totalMilestones" INTEGER NOT NULL DEFAULT 0,
    "usageCount" INTEGER NOT NULL DEFAULT 0,
    "lastUsedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "payment_schedule_templates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "escrow_reconciliations" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "orgId" TEXT NOT NULL,
    "periodStart" TIMESTAMP(3) NOT NULL,
    "periodEnd" TIMESTAMP(3) NOT NULL,
    "reconciliationDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expectedBalance" DECIMAL(14,2) NOT NULL,
    "actualBalance" DECIMAL(14,2) NOT NULL,
    "discrepancy" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "totalDeposits" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "totalDisbursements" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "totalHolds" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "hasDiscrepancy" BOOLEAN NOT NULL DEFAULT false,
    "discrepancyItems" JSONB,
    "discrepancyResolved" BOOLEAN NOT NULL DEFAULT false,
    "resolvedAt" TIMESTAMP(3),
    "resolvedBy" TEXT,
    "resolutionNotes" TEXT,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "reviewedBy" TEXT,
    "approvedBy" TEXT,
    "approvedAt" TIMESTAMP(3),
    "reportUrl" TEXT,
    "attachments" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "escrow_reconciliations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "turnover_checklists" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "orgId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "category" TEXT,
    "totalItems" INTEGER NOT NULL DEFAULT 0,
    "completedItems" INTEGER NOT NULL DEFAULT 0,
    "completionPct" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "targetDate" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "signedOffBy" TEXT,
    "signedOffAt" TIMESTAMP(3),
    "templateId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "turnover_checklists_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "turnover_items" (
    "id" TEXT NOT NULL,
    "checklistId" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "status" "TurnoverItemStatus" NOT NULL DEFAULT 'PENDING',
    "completedAt" TIMESTAMP(3),
    "completedBy" TEXT,
    "requiresPhoto" BOOLEAN NOT NULL DEFAULT false,
    "requiresDocument" BOOLEAN NOT NULL DEFAULT false,
    "requiresSignature" BOOLEAN NOT NULL DEFAULT false,
    "photoUrl" TEXT,
    "documentUrl" TEXT,
    "signatureUrl" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "turnover_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "maintenance_schedules" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "orgId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "category" TEXT,
    "frequency" TEXT NOT NULL,
    "nextDueDate" TIMESTAMP(3),
    "lastCompletedDate" TIMESTAMP(3),
    "assignedTo" TEXT,
    "assignedName" TEXT,
    "vendorName" TEXT,
    "vendorContact" JSONB,
    "estimatedCost" DECIMAL(10,2),
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "maintenance_schedules_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "maintenance_work_orders" (
    "id" TEXT NOT NULL,
    "scheduleId" TEXT,
    "projectId" TEXT NOT NULL,
    "orgId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "category" TEXT,
    "priority" "WorkOrderPriority" NOT NULL DEFAULT 'MEDIUM',
    "status" "WorkOrderStatus" NOT NULL DEFAULT 'OPEN',
    "assignedTo" TEXT,
    "assignedName" TEXT,
    "reportedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "reportedBy" TEXT,
    "scheduledDate" TIMESTAMP(3),
    "startedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "location" TEXT,
    "estimatedCost" DECIMAL(10,2),
    "actualCost" DECIMAL(10,2),
    "laborHours" DECIMAL(6,2),
    "materialsCost" DECIMAL(10,2),
    "photos" JSONB,
    "attachments" JSONB,
    "resolution" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "maintenance_work_orders_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "digital_twins_projectId_key" ON "digital_twins"("projectId");

-- CreateIndex
CREATE INDEX "digital_twins_orgId_idx" ON "digital_twins"("orgId");

-- CreateIndex
CREATE INDEX "digital_twins_status_idx" ON "digital_twins"("status");

-- CreateIndex
CREATE INDEX "digital_twins_healthStatus_idx" ON "digital_twins"("healthStatus");

-- CreateIndex
CREATE INDEX "digital_twins_tier_idx" ON "digital_twins"("tier");

-- CreateIndex
CREATE INDEX "twin_snapshots_twinId_idx" ON "twin_snapshots"("twinId");

-- CreateIndex
CREATE INDEX "twin_snapshots_snapshotAt_idx" ON "twin_snapshots"("snapshotAt");

-- CreateIndex
CREATE INDEX "twin_events_twinId_idx" ON "twin_events"("twinId");

-- CreateIndex
CREATE INDEX "twin_events_eventType_idx" ON "twin_events"("eventType");

-- CreateIndex
CREATE INDEX "twin_events_source_idx" ON "twin_events"("source");

-- CreateIndex
CREATE INDEX "twin_events_correlationId_idx" ON "twin_events"("correlationId");

-- CreateIndex
CREATE INDEX "twin_events_createdAt_idx" ON "twin_events"("createdAt");

-- CreateIndex
CREATE INDEX "twin_modules_twinId_idx" ON "twin_modules"("twinId");

-- CreateIndex
CREATE INDEX "twin_modules_moduleKey_idx" ON "twin_modules"("moduleKey");

-- CreateIndex
CREATE UNIQUE INDEX "twin_modules_twinId_moduleKey_key" ON "twin_modules"("twinId", "moduleKey");

-- CreateIndex
CREATE INDEX "twin_kpis_twinId_idx" ON "twin_kpis"("twinId");

-- CreateIndex
CREATE INDEX "twin_kpis_category_idx" ON "twin_kpis"("category");

-- CreateIndex
CREATE INDEX "twin_kpis_status_idx" ON "twin_kpis"("status");

-- CreateIndex
CREATE UNIQUE INDEX "twin_kpis_twinId_kpiKey_key" ON "twin_kpis"("twinId", "kpiKey");

-- CreateIndex
CREATE INDEX "parcels_orgId_idx" ON "parcels"("orgId");

-- CreateIndex
CREATE INDEX "parcels_status_idx" ON "parcels"("status");

-- CreateIndex
CREATE INDEX "parcels_state_county_idx" ON "parcels"("state", "county");

-- CreateIndex
CREATE INDEX "parcels_developmentScore_idx" ON "parcels"("developmentScore");

-- CreateIndex
CREATE INDEX "parcels_projectId_idx" ON "parcels"("projectId");

-- CreateIndex
CREATE INDEX "parcel_zonings_parcelId_idx" ON "parcel_zonings"("parcelId");

-- CreateIndex
CREATE INDEX "parcel_zonings_zoningCode_idx" ON "parcel_zonings"("zoningCode");

-- CreateIndex
CREATE INDEX "site_assessments_parcelId_idx" ON "site_assessments"("parcelId");

-- CreateIndex
CREATE INDEX "site_assessments_assessmentType_idx" ON "site_assessments"("assessmentType");

-- CreateIndex
CREATE INDEX "site_assessments_status_idx" ON "site_assessments"("status");

-- CreateIndex
CREATE INDEX "parcel_comparables_parcelId_idx" ON "parcel_comparables"("parcelId");

-- CreateIndex
CREATE INDEX "parcel_documents_parcelId_idx" ON "parcel_documents"("parcelId");

-- CreateIndex
CREATE INDEX "parcel_documents_documentType_idx" ON "parcel_documents"("documentType");

-- CreateIndex
CREATE INDEX "parcel_notes_parcelId_idx" ON "parcel_notes"("parcelId");

-- CreateIndex
CREATE INDEX "land_offers_parcelId_idx" ON "land_offers"("parcelId");

-- CreateIndex
CREATE INDEX "land_offers_status_idx" ON "land_offers"("status");

-- CreateIndex
CREATE INDEX "feasibility_studies_orgId_idx" ON "feasibility_studies"("orgId");

-- CreateIndex
CREATE INDEX "feasibility_studies_projectId_idx" ON "feasibility_studies"("projectId");

-- CreateIndex
CREATE INDEX "feasibility_studies_parcelId_idx" ON "feasibility_studies"("parcelId");

-- CreateIndex
CREATE INDEX "feasibility_studies_status_idx" ON "feasibility_studies"("status");

-- CreateIndex
CREATE INDEX "feasibility_scenarios_studyId_idx" ON "feasibility_scenarios"("studyId");

-- CreateIndex
CREATE INDEX "feasibility_cost_assumptions_studyId_idx" ON "feasibility_cost_assumptions"("studyId");

-- CreateIndex
CREATE INDEX "feasibility_cost_assumptions_category_idx" ON "feasibility_cost_assumptions"("category");

-- CreateIndex
CREATE INDEX "feasibility_revenue_assumptions_studyId_idx" ON "feasibility_revenue_assumptions"("studyId");

-- CreateIndex
CREATE INDEX "feasibility_comparisons_studyId_idx" ON "feasibility_comparisons"("studyId");

-- CreateIndex
CREATE UNIQUE INDEX "capital_stacks_projectId_key" ON "capital_stacks"("projectId");

-- CreateIndex
CREATE INDEX "capital_stacks_orgId_idx" ON "capital_stacks"("orgId");

-- CreateIndex
CREATE INDEX "capital_stacks_projectId_idx" ON "capital_stacks"("projectId");

-- CreateIndex
CREATE INDEX "capital_sources_capitalStackId_idx" ON "capital_sources"("capitalStackId");

-- CreateIndex
CREATE INDEX "capital_sources_sourceType_idx" ON "capital_sources"("sourceType");

-- CreateIndex
CREATE INDEX "draw_schedules_capitalStackId_idx" ON "draw_schedules"("capitalStackId");

-- CreateIndex
CREATE INDEX "draw_schedules_status_idx" ON "draw_schedules"("status");

-- CreateIndex
CREATE INDEX "draw_schedules_drawNumber_idx" ON "draw_schedules"("drawNumber");

-- CreateIndex
CREATE INDEX "investor_reports_projectId_idx" ON "investor_reports"("projectId");

-- CreateIndex
CREATE INDEX "investor_reports_orgId_idx" ON "investor_reports"("orgId");

-- CreateIndex
CREATE INDEX "investor_reports_reportType_idx" ON "investor_reports"("reportType");

-- CreateIndex
CREATE INDEX "investor_reports_periodEnd_idx" ON "investor_reports"("periodEnd");

-- CreateIndex
CREATE INDEX "entitlements_projectId_idx" ON "entitlements"("projectId");

-- CreateIndex
CREATE INDEX "entitlements_orgId_idx" ON "entitlements"("orgId");

-- CreateIndex
CREATE INDEX "entitlements_entitlementType_idx" ON "entitlements"("entitlementType");

-- CreateIndex
CREATE INDEX "entitlements_status_idx" ON "entitlements"("status");

-- CreateIndex
CREATE INDEX "payment_schedule_templates_orgId_idx" ON "payment_schedule_templates"("orgId");

-- CreateIndex
CREATE INDEX "payment_schedule_templates_projectType_idx" ON "payment_schedule_templates"("projectType");

-- CreateIndex
CREATE INDEX "escrow_reconciliations_projectId_idx" ON "escrow_reconciliations"("projectId");

-- CreateIndex
CREATE INDEX "escrow_reconciliations_orgId_idx" ON "escrow_reconciliations"("orgId");

-- CreateIndex
CREATE INDEX "escrow_reconciliations_periodEnd_idx" ON "escrow_reconciliations"("periodEnd");

-- CreateIndex
CREATE INDEX "escrow_reconciliations_hasDiscrepancy_idx" ON "escrow_reconciliations"("hasDiscrepancy");

-- CreateIndex
CREATE INDEX "turnover_checklists_projectId_idx" ON "turnover_checklists"("projectId");

-- CreateIndex
CREATE INDEX "turnover_checklists_orgId_idx" ON "turnover_checklists"("orgId");

-- CreateIndex
CREATE INDEX "turnover_checklists_status_idx" ON "turnover_checklists"("status");

-- CreateIndex
CREATE INDEX "turnover_items_checklistId_idx" ON "turnover_items"("checklistId");

-- CreateIndex
CREATE INDEX "turnover_items_category_idx" ON "turnover_items"("category");

-- CreateIndex
CREATE INDEX "turnover_items_status_idx" ON "turnover_items"("status");

-- CreateIndex
CREATE INDEX "maintenance_schedules_projectId_idx" ON "maintenance_schedules"("projectId");

-- CreateIndex
CREATE INDEX "maintenance_schedules_orgId_idx" ON "maintenance_schedules"("orgId");

-- CreateIndex
CREATE INDEX "maintenance_schedules_nextDueDate_idx" ON "maintenance_schedules"("nextDueDate");

-- CreateIndex
CREATE INDEX "maintenance_schedules_isActive_idx" ON "maintenance_schedules"("isActive");

-- CreateIndex
CREATE INDEX "maintenance_work_orders_projectId_idx" ON "maintenance_work_orders"("projectId");

-- CreateIndex
CREATE INDEX "maintenance_work_orders_orgId_idx" ON "maintenance_work_orders"("orgId");

-- CreateIndex
CREATE INDEX "maintenance_work_orders_scheduleId_idx" ON "maintenance_work_orders"("scheduleId");

-- CreateIndex
CREATE INDEX "maintenance_work_orders_status_idx" ON "maintenance_work_orders"("status");

-- CreateIndex
CREATE INDEX "maintenance_work_orders_priority_idx" ON "maintenance_work_orders"("priority");

-- AddForeignKey
ALTER TABLE "digital_twins" ADD CONSTRAINT "digital_twins_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "twin_snapshots" ADD CONSTRAINT "twin_snapshots_twinId_fkey" FOREIGN KEY ("twinId") REFERENCES "digital_twins"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "twin_events" ADD CONSTRAINT "twin_events_twinId_fkey" FOREIGN KEY ("twinId") REFERENCES "digital_twins"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "twin_modules" ADD CONSTRAINT "twin_modules_twinId_fkey" FOREIGN KEY ("twinId") REFERENCES "digital_twins"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "twin_kpis" ADD CONSTRAINT "twin_kpis_twinId_fkey" FOREIGN KEY ("twinId") REFERENCES "digital_twins"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "parcel_zonings" ADD CONSTRAINT "parcel_zonings_parcelId_fkey" FOREIGN KEY ("parcelId") REFERENCES "parcels"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "site_assessments" ADD CONSTRAINT "site_assessments_parcelId_fkey" FOREIGN KEY ("parcelId") REFERENCES "parcels"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "parcel_comparables" ADD CONSTRAINT "parcel_comparables_parcelId_fkey" FOREIGN KEY ("parcelId") REFERENCES "parcels"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "parcel_documents" ADD CONSTRAINT "parcel_documents_parcelId_fkey" FOREIGN KEY ("parcelId") REFERENCES "parcels"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "parcel_notes" ADD CONSTRAINT "parcel_notes_parcelId_fkey" FOREIGN KEY ("parcelId") REFERENCES "parcels"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "land_offers" ADD CONSTRAINT "land_offers_parcelId_fkey" FOREIGN KEY ("parcelId") REFERENCES "parcels"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "feasibility_studies" ADD CONSTRAINT "feasibility_studies_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "feasibility_scenarios" ADD CONSTRAINT "feasibility_scenarios_studyId_fkey" FOREIGN KEY ("studyId") REFERENCES "feasibility_studies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "feasibility_cost_assumptions" ADD CONSTRAINT "feasibility_cost_assumptions_studyId_fkey" FOREIGN KEY ("studyId") REFERENCES "feasibility_studies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "feasibility_revenue_assumptions" ADD CONSTRAINT "feasibility_revenue_assumptions_studyId_fkey" FOREIGN KEY ("studyId") REFERENCES "feasibility_studies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "feasibility_comparisons" ADD CONSTRAINT "feasibility_comparisons_studyId_fkey" FOREIGN KEY ("studyId") REFERENCES "feasibility_studies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "capital_stacks" ADD CONSTRAINT "capital_stacks_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "capital_sources" ADD CONSTRAINT "capital_sources_capitalStackId_fkey" FOREIGN KEY ("capitalStackId") REFERENCES "capital_stacks"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "draw_schedules" ADD CONSTRAINT "draw_schedules_capitalStackId_fkey" FOREIGN KEY ("capitalStackId") REFERENCES "capital_stacks"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "investor_reports" ADD CONSTRAINT "investor_reports_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "entitlements" ADD CONSTRAINT "entitlements_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "escrow_reconciliations" ADD CONSTRAINT "escrow_reconciliations_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "turnover_checklists" ADD CONSTRAINT "turnover_checklists_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "turnover_items" ADD CONSTRAINT "turnover_items_checklistId_fkey" FOREIGN KEY ("checklistId") REFERENCES "turnover_checklists"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "maintenance_schedules" ADD CONSTRAINT "maintenance_schedules_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "maintenance_work_orders" ADD CONSTRAINT "maintenance_work_orders_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "maintenance_work_orders" ADD CONSTRAINT "maintenance_work_orders_scheduleId_fkey" FOREIGN KEY ("scheduleId") REFERENCES "maintenance_schedules"("id") ON DELETE SET NULL ON UPDATE CASCADE;

