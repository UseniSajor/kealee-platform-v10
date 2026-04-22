-- Enhance ProjectOutput for deliverable persistence
-- Add fields to track service type, intake lead, delivery status, and file metadata

ALTER TABLE "project_outputs"
ADD COLUMN IF NOT EXISTS "serviceType" TEXT DEFAULT 'concept',
ADD COLUMN IF NOT EXISTS "conceptServiceLeadId" TEXT,
ADD COLUMN IF NOT EXISTS "estimationServiceLeadId" TEXT,
ADD COLUMN IF NOT EXISTS "permitServiceLeadId" TEXT,
ADD COLUMN IF NOT EXISTS "deliveryStatus" TEXT DEFAULT 'pending',
ADD COLUMN IF NOT EXISTS "fileMetadata" JSONB DEFAULT '{}',
ADD COLUMN IF NOT EXISTS "conceptImageUrls" TEXT[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS "estimationPdfUrl" TEXT,
ADD COLUMN IF NOT EXISTS "permitFileUrls" TEXT[] DEFAULT '{}';

-- Create indexes for new fields
CREATE INDEX IF NOT EXISTS "project_outputs_serviceType_idx" ON "project_outputs"("serviceType");
CREATE INDEX IF NOT EXISTS "project_outputs_deliveryStatus_idx" ON "project_outputs"("deliveryStatus");
CREATE INDEX IF NOT EXISTS "project_outputs_conceptServiceLeadId_idx" ON "project_outputs"("conceptServiceLeadId");
CREATE INDEX IF NOT EXISTS "project_outputs_estimationServiceLeadId_idx" ON "project_outputs"("estimationServiceLeadId");
CREATE INDEX IF NOT EXISTS "project_outputs_permitServiceLeadId_idx" ON "project_outputs"("permitServiceLeadId");
