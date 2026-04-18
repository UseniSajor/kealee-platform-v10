-- CreateTable ProjectOutput
CREATE TABLE IF NOT EXISTS "project_outputs" (
  "id" TEXT NOT NULL,
  "projectId" TEXT,
  "intakeId" TEXT,
  "orderId" TEXT,
  "type" TEXT NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'pending',
  "resultJson" JSONB,
  "pdfUrl" TEXT,
  "downloadUrl" TEXT,
  "generatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "completedAt" TIMESTAMP(3),
  "metadata" JSONB,
  
  CONSTRAINT "project_outputs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "project_outputs_status_idx" ON "project_outputs"("status");

-- CreateIndex
CREATE INDEX "project_outputs_type_idx" ON "project_outputs"("type");

-- CreateIndex
CREATE INDEX "project_outputs_intakeId_idx" ON "project_outputs"("intakeId");

-- CreateIndex
CREATE INDEX "project_outputs_orderId_idx" ON "project_outputs"("orderId");

-- CreateIndex
CREATE INDEX "project_outputs_generatedAt_idx" ON "project_outputs"("generatedAt");
