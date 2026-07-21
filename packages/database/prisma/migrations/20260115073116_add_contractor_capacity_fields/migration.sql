-- AlterTable
ALTER TABLE "MarketplaceProfile" ADD COLUMN     "maxConcurrentProjects" INTEGER NOT NULL DEFAULT 3,
ADD COLUMN     "maxPipelineValue" DECIMAL(12,2) NOT NULL DEFAULT 500000,
ADD COLUMN     "acceptingLeads" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "subscriptionTier" TEXT;

-- CreateIndex
CREATE INDEX "MarketplaceProfile_acceptingLeads_idx" ON "MarketplaceProfile"("acceptingLeads");

-- CreateIndex
CREATE INDEX "MarketplaceProfile_subscriptionTier_idx" ON "MarketplaceProfile"("subscriptionTier");
