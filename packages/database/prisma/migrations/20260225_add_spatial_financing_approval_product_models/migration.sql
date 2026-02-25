-- Backend Consolidation v10: Spatial, Financing, Approval, Product Models
-- Migration: add_spatial_financing_approval_product_models

-- ============================================================================
-- ENUMS
-- ============================================================================

-- CreateEnum: ScanType
CREATE TYPE "ScanType" AS ENUM ('LIDAR', 'PHOTOGRAMMETRY', 'DRONE', 'MOBILE_SCAN', 'BEFORE', 'DURING', 'AFTER');

-- CreateEnum: VerificationStatus
CREATE TYPE "VerificationStatus" AS ENUM ('PENDING', 'IN_PROGRESS', 'PASSED', 'FAILED', 'NEEDS_REVIEW');

-- CreateEnum: FinancingStatus
CREATE TYPE "FinancingStatus" AS ENUM ('PENDING', 'UNDER_REVIEW', 'APPROVED', 'REJECTED', 'FUNDED', 'CLOSED');

-- CreateEnum: ApproverType
CREATE TYPE "ApproverType" AS ENUM ('HOMEOWNER', 'CONTRACTOR', 'LENDER', 'INSPECTOR');

-- CreateEnum: ApprovalStatus
CREATE TYPE "ApprovalStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- CreateEnum: ProductCategory
CREATE TYPE "ProductCategory" AS ENUM ('KITCHEN', 'BATH', 'WHOLE_HOME', 'ADDITION', 'FACADE', 'ELECTRICAL', 'PLUMBING', 'HVAC', 'FLOORING', 'ROOFING', 'WINDOWS_DOORS');

-- ============================================================================
-- TABLES
-- ============================================================================

-- CreateTable: SpatialScan
CREATE TABLE "SpatialScan" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "scanType" "ScanType" NOT NULL,
    "scanDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "fileUrl" TEXT NOT NULL,
    "fileSize" INTEGER,
    "format" TEXT,
    "deviceInfo" JSONB,
    "pointCount" INTEGER,
    "coverage" DOUBLE PRECISION,
    "accuracy" DOUBLE PRECISION,
    "processed" BOOLEAN NOT NULL DEFAULT false,
    "processedAt" TIMESTAMP(3),
    "processingNotes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SpatialScan_pkey" PRIMARY KEY ("id")
);

-- CreateTable: SpatialVerification
CREATE TABLE "SpatialVerification" (
    "id" TEXT NOT NULL,
    "milestoneId" TEXT NOT NULL,
    "scanId" TEXT NOT NULL,
    "verifiedById" TEXT,
    "aiScore" DOUBLE PRECISION,
    "aiNotes" JSONB,
    "manualReview" BOOLEAN NOT NULL DEFAULT false,
    "reviewNotes" TEXT,
    "status" "VerificationStatus" NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "verifiedAt" TIMESTAMP(3),

    CONSTRAINT "SpatialVerification_pkey" PRIMARY KEY ("id")
);

-- CreateTable: FinancingApplication
CREATE TABLE "FinancingApplication" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "applicantId" TEXT NOT NULL,
    "requestedAmount" DECIMAL(18,2) NOT NULL,
    "approvedAmount" DECIMAL(18,2),
    "interestRate" DOUBLE PRECISION,
    "termMonths" INTEGER,
    "lenderName" TEXT,
    "loanOfficer" TEXT,
    "loanNumber" TEXT,
    "status" "FinancingStatus" NOT NULL DEFAULT 'PENDING',
    "applicationUrl" TEXT,
    "approvalUrl" TEXT,
    "appliedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "reviewedAt" TIMESTAMP(3),
    "approvedAt" TIMESTAMP(3),
    "fundedAt" TIMESTAMP(3),

    CONSTRAINT "FinancingApplication_pkey" PRIMARY KEY ("id")
);

-- CreateTable: MilestoneApproval
CREATE TABLE "MilestoneApproval" (
    "id" TEXT NOT NULL,
    "milestoneId" TEXT NOT NULL,
    "approverType" "ApproverType" NOT NULL,
    "approverId" TEXT NOT NULL,
    "status" "ApprovalStatus" NOT NULL DEFAULT 'PENDING',
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "decidedAt" TIMESTAMP(3),

    CONSTRAINT "MilestoneApproval_pkey" PRIMARY KEY ("id")
);

-- CreateTable: Product
CREATE TABLE "Product" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "sku" TEXT NOT NULL,
    "category" "ProductCategory" NOT NULL,
    "brand" TEXT,
    "manufacturer" TEXT,
    "unitPrice" DECIMAL(18,2) NOT NULL,
    "unitOfMeasure" TEXT,
    "leadTimeDays" INTEGER,
    "supplier" TEXT,
    "imageUrl" TEXT,
    "arModelUrl" TEXT,
    "dimensions" JSONB,
    "specifications" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Product_pkey" PRIMARY KEY ("id")
);

-- CreateTable: ProjectItem
CREATE TABLE "ProjectItem" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "unitPrice" DECIMAL(18,2) NOT NULL,
    "totalPrice" DECIMAL(18,2) NOT NULL,
    "installed" BOOLEAN NOT NULL DEFAULT false,
    "installedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProjectItem_pkey" PRIMARY KEY ("id")
);

-- ============================================================================
-- ALTER EXISTING TABLES
-- ============================================================================

-- AlterTable: Payment - add financingApplicationId
ALTER TABLE "Payment" ADD COLUMN "financingApplicationId" TEXT;

-- ============================================================================
-- UNIQUE CONSTRAINTS
-- ============================================================================

-- CreateIndex: Product.sku unique
CREATE UNIQUE INDEX "Product_sku_key" ON "Product"("sku");

-- ============================================================================
-- INDEXES
-- ============================================================================

-- SpatialScan indexes
CREATE INDEX "SpatialScan_projectId_idx" ON "SpatialScan"("projectId");
CREATE INDEX "SpatialScan_scanType_idx" ON "SpatialScan"("scanType");

-- SpatialVerification indexes
CREATE INDEX "SpatialVerification_milestoneId_idx" ON "SpatialVerification"("milestoneId");
CREATE INDEX "SpatialVerification_scanId_idx" ON "SpatialVerification"("scanId");
CREATE INDEX "SpatialVerification_status_idx" ON "SpatialVerification"("status");

-- FinancingApplication indexes
CREATE INDEX "FinancingApplication_projectId_idx" ON "FinancingApplication"("projectId");
CREATE INDEX "FinancingApplication_applicantId_idx" ON "FinancingApplication"("applicantId");
CREATE INDEX "FinancingApplication_status_idx" ON "FinancingApplication"("status");

-- MilestoneApproval indexes
CREATE INDEX "MilestoneApproval_milestoneId_idx" ON "MilestoneApproval"("milestoneId");
CREATE INDEX "MilestoneApproval_approverId_idx" ON "MilestoneApproval"("approverId");
CREATE INDEX "MilestoneApproval_approverType_status_idx" ON "MilestoneApproval"("approverType", "status");

-- Product indexes
CREATE INDEX "Product_category_idx" ON "Product"("category");
CREATE INDEX "Product_sku_idx" ON "Product"("sku");

-- ProjectItem indexes
CREATE INDEX "ProjectItem_projectId_idx" ON "ProjectItem"("projectId");
CREATE INDEX "ProjectItem_productId_idx" ON "ProjectItem"("productId");

-- Payment index for new column
CREATE INDEX "Payment_financingApplicationId_idx" ON "Payment"("financingApplicationId");

-- ============================================================================
-- FOREIGN KEYS
-- ============================================================================

-- SpatialScan -> Project
ALTER TABLE "SpatialScan" ADD CONSTRAINT "SpatialScan_projectId_fkey"
    FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- SpatialVerification -> Milestone
ALTER TABLE "SpatialVerification" ADD CONSTRAINT "SpatialVerification_milestoneId_fkey"
    FOREIGN KEY ("milestoneId") REFERENCES "Milestone"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- SpatialVerification -> SpatialScan
ALTER TABLE "SpatialVerification" ADD CONSTRAINT "SpatialVerification_scanId_fkey"
    FOREIGN KEY ("scanId") REFERENCES "SpatialScan"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- SpatialVerification -> User (verifier)
ALTER TABLE "SpatialVerification" ADD CONSTRAINT "SpatialVerification_verifiedById_fkey"
    FOREIGN KEY ("verifiedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- FinancingApplication -> Project
ALTER TABLE "FinancingApplication" ADD CONSTRAINT "FinancingApplication_projectId_fkey"
    FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- FinancingApplication -> User (applicant)
ALTER TABLE "FinancingApplication" ADD CONSTRAINT "FinancingApplication_applicantId_fkey"
    FOREIGN KEY ("applicantId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- MilestoneApproval -> Milestone
ALTER TABLE "MilestoneApproval" ADD CONSTRAINT "MilestoneApproval_milestoneId_fkey"
    FOREIGN KEY ("milestoneId") REFERENCES "Milestone"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- MilestoneApproval -> User (approver)
ALTER TABLE "MilestoneApproval" ADD CONSTRAINT "MilestoneApproval_approverId_fkey"
    FOREIGN KEY ("approverId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Product -> ProjectItem (implicit via ProjectItem.productId)
-- ProjectItem -> Project
ALTER TABLE "ProjectItem" ADD CONSTRAINT "ProjectItem_projectId_fkey"
    FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- ProjectItem -> Product
ALTER TABLE "ProjectItem" ADD CONSTRAINT "ProjectItem_productId_fkey"
    FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Payment -> FinancingApplication (disbursements)
ALTER TABLE "Payment" ADD CONSTRAINT "Payment_financingApplicationId_fkey"
    FOREIGN KEY ("financingApplicationId") REFERENCES "FinancingApplication"("id") ON DELETE SET NULL ON UPDATE CASCADE;
