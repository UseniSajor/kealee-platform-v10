-- CreateEnum
CREATE TYPE "LeadStage" AS ENUM ('INTAKE', 'QUALIFIED', 'SCOPED', 'QUOTED', 'WON', 'LOST');

-- CreateEnum
CREATE TYPE "LeadStatus" AS ENUM ('NEW', 'CONTACTED', 'QUALIFIED', 'QUOTED', 'WON', 'LOST');

-- CreateTable
CREATE TABLE "Lead" (
    "id" TEXT NOT NULL,
    "stage" "LeadStage" NOT NULL DEFAULT 'INTAKE',
    "status" "LeadStatus",
    "name" TEXT NOT NULL,
    "email" TEXT,
    "phone" TEXT,
    "address" TEXT,
    "city" TEXT,
    "state" TEXT,
    "zip" TEXT,
    "description" TEXT,
    "estimatedValue" DECIMAL(12,2),
    "projectType" TEXT,
    "assignedSalesRepId" TEXT,
    "awardedProfileId" TEXT,
    "projectId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "qualifiedAt" TIMESTAMP(3),
    "scopedAt" TIMESTAMP(3),
    "quotedAt" TIMESTAMP(3),
    "wonAt" TIMESTAMP(3),
    "lostAt" TIMESTAMP(3),
    "lostReason" TEXT,

    CONSTRAINT "Lead_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Quote" (
    "id" TEXT NOT NULL,
    "leadId" TEXT NOT NULL,
    "profileId" TEXT NOT NULL,
    "amount" DECIMAL(12,2) NOT NULL,
    "description" TEXT,
    "timeline" TEXT,
    "terms" TEXT,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "submittedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "acceptedAt" TIMESTAMP(3),
    "rejectedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Quote_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "_LeadDistribution" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL
);

-- CreateIndex
CREATE INDEX "Lead_stage_idx" ON "Lead"("stage");

-- CreateIndex
CREATE INDEX "Lead_status_idx" ON "Lead"("status");

-- CreateIndex
CREATE INDEX "Lead_assignedSalesRepId_idx" ON "Lead"("assignedSalesRepId");

-- CreateIndex
CREATE INDEX "Lead_awardedProfileId_idx" ON "Lead"("awardedProfileId");

-- CreateIndex
CREATE INDEX "Lead_projectId_idx" ON "Lead"("projectId");

-- CreateIndex
CREATE INDEX "Lead_createdAt_idx" ON "Lead"("createdAt");

-- CreateIndex
CREATE INDEX "Lead_email_idx" ON "Lead"("email");

-- CreateIndex
CREATE INDEX "Lead_phone_idx" ON "Lead"("phone");

-- CreateIndex
CREATE UNIQUE INDEX "Lead_projectId_key" ON "Lead"("projectId");

-- CreateIndex
CREATE INDEX "Quote_leadId_idx" ON "Quote"("leadId");

-- CreateIndex
CREATE INDEX "Quote_profileId_idx" ON "Quote"("profileId");

-- CreateIndex
CREATE INDEX "Quote_status_idx" ON "Quote"("status");

-- CreateIndex
CREATE INDEX "Quote_submittedAt_idx" ON "Quote"("submittedAt");

-- CreateIndex
CREATE UNIQUE INDEX "_LeadDistribution_AB_unique" ON "_LeadDistribution"("A", "B");

-- CreateIndex
CREATE INDEX "_LeadDistribution_B_index" ON "_LeadDistribution"("B");

-- AddForeignKey
ALTER TABLE "Lead" ADD CONSTRAINT "Lead_assignedSalesRepId_fkey" FOREIGN KEY ("assignedSalesRepId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Lead" ADD CONSTRAINT "Lead_awardedProfileId_fkey" FOREIGN KEY ("awardedProfileId") REFERENCES "MarketplaceProfile"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Lead" ADD CONSTRAINT "Lead_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Quote" ADD CONSTRAINT "Quote_leadId_fkey" FOREIGN KEY ("leadId") REFERENCES "Lead"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Quote" ADD CONSTRAINT "Quote_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES "MarketplaceProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_LeadDistribution" ADD CONSTRAINT "_LeadDistribution_A_fkey" FOREIGN KEY ("A") REFERENCES "Lead"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_LeadDistribution" ADD CONSTRAINT "_LeadDistribution_B_fkey" FOREIGN KEY ("B") REFERENCES "MarketplaceProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;
