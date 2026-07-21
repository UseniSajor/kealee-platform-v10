-- CreateEnum
CREATE TYPE "ConstructionReadinessStatus" AS ENUM ('NOT_READY', 'DESIGN_READY', 'PERMITS_SUBMITTED', 'CONSTRUCTION_READY');

-- CreateEnum
CREATE TYPE "ProfessionalType" AS ENUM ('ARCHITECT', 'ENGINEER', 'CONTRACTOR', 'DESIGN_BUILD');

-- CreateEnum
CREATE TYPE "LeadSourceType" AS ENUM ('SPONSORED_AD', 'PLATFORM_SERVICE', 'OWNER_INVITED');

-- CreateEnum
CREATE TYPE "AssignmentStatus" AS ENUM ('PENDING', 'ACCEPTED', 'DECLINED', 'EXPIRED', 'FORFEITED');

-- CreateEnum
CREATE TYPE "QueueEligibilityStatus" AS ENUM ('ELIGIBLE', 'SUSPENDED', 'PENDING_VERIFICATION', 'INELIGIBLE');

-- AlterTable
ALTER TABLE "Lead" ADD COLUMN     "invitedProfileId" TEXT,
ADD COLUMN     "professionalType" "ProfessionalType",
ADD COLUMN     "sourceType" "LeadSourceType" NOT NULL DEFAULT 'PLATFORM_SERVICE';

-- AlterTable
ALTER TABLE "MarketplaceProfile" ADD COLUMN     "professionalType" "ProfessionalType";

-- AlterTable
ALTER TABLE "Project" ADD COLUMN     "constructionReadiness" "ConstructionReadinessStatus" NOT NULL DEFAULT 'NOT_READY',
ADD COLUMN     "constructionReadinessConfirmedBy" TEXT,
ADD COLUMN     "constructionReadinessUpdatedAt" TIMESTAMP(3);

-- CreateTable
CREATE TABLE "professional_assignments" (
    "id" TEXT NOT NULL,
    "leadId" TEXT NOT NULL,
    "profileId" TEXT NOT NULL,
    "professionalType" "ProfessionalType" NOT NULL,
    "sourceType" "LeadSourceType" NOT NULL,
    "status" "AssignmentStatus" NOT NULL DEFAULT 'PENDING',
    "rotationPosition" INTEGER,
    "assignedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "acceptDeadline" TIMESTAMP(3) NOT NULL,
    "respondedAt" TIMESTAMP(3),
    "forwardedAt" TIMESTAMP(3),
    "declineReason" TEXT,
    "adminOverride" BOOLEAN NOT NULL DEFAULT false,
    "adminNote" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "professional_assignments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "rotation_queue_entries" (
    "id" TEXT NOT NULL,
    "profileId" TEXT NOT NULL,
    "professionalType" "ProfessionalType" NOT NULL,
    "eligibility" "QueueEligibilityStatus" NOT NULL DEFAULT 'PENDING_VERIFICATION',
    "lastAssignedAt" TIMESTAMP(3),
    "lastForwardedAt" TIMESTAMP(3),
    "totalOffered" INTEGER NOT NULL DEFAULT 0,
    "totalAccepted" INTEGER NOT NULL DEFAULT 0,
    "totalDeclined" INTEGER NOT NULL DEFAULT 0,
    "totalForfeited" INTEGER NOT NULL DEFAULT 0,
    "licenseVerified" BOOLEAN NOT NULL DEFAULT false,
    "insuranceVerified" BOOLEAN NOT NULL DEFAULT false,
    "licenseVerifiedAt" TIMESTAMP(3),
    "insuranceVerifiedAt" TIMESTAMP(3),
    "softwareAccessOnly" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "rotation_queue_entries_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "professional_assignments_leadId_idx" ON "professional_assignments"("leadId");

-- CreateIndex
CREATE INDEX "professional_assignments_profileId_idx" ON "professional_assignments"("profileId");

-- CreateIndex
CREATE INDEX "professional_assignments_status_acceptDeadline_idx" ON "professional_assignments"("status", "acceptDeadline");

-- CreateIndex
CREATE INDEX "professional_assignments_leadId_status_idx" ON "professional_assignments"("leadId", "status");

-- CreateIndex
CREATE INDEX "rotation_queue_entries_professionalType_eligibility_lastAss_idx" ON "rotation_queue_entries"("professionalType", "eligibility", "lastAssignedAt");

-- CreateIndex
CREATE UNIQUE INDEX "rotation_queue_entries_profileId_professionalType_key" ON "rotation_queue_entries"("profileId", "professionalType");

-- CreateIndex
CREATE INDEX "Lead_sourceType_idx" ON "Lead"("sourceType");

-- CreateIndex
CREATE INDEX "Lead_professionalType_stage_idx" ON "Lead"("professionalType", "stage");

-- CreateIndex
CREATE INDEX "MarketplaceProfile_professionalType_idx" ON "MarketplaceProfile"("professionalType");

-- AddForeignKey
ALTER TABLE "professional_assignments" ADD CONSTRAINT "professional_assignments_leadId_fkey" FOREIGN KEY ("leadId") REFERENCES "Lead"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "professional_assignments" ADD CONSTRAINT "professional_assignments_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES "MarketplaceProfile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rotation_queue_entries" ADD CONSTRAINT "rotation_queue_entries_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES "MarketplaceProfile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

