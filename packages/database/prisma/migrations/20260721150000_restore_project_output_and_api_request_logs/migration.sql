-- Restores the ProjectOutput model (deleted from schema.prisma in the 2026-06-22
-- v30 regeneration, commit a3f969d2, but never removed from the code that still
-- writes to it on live Stripe checkout / worker paths) and adds the ApiRequestLog
-- model (referenced by services/api's request logger + monitoring dashboard since
-- inception, gracefully degrading to stdout, but never actually migrated).
--
-- The live `project_outputs` table already existed (created out-of-band, snake_case
-- columns, 0 rows) — confirmed empty before writing this, so the column rename is
-- data-loss-free. Manually filtered from `prisma migrate diff` output: excluded
-- ~154 unrelated DropTable/DropForeignKey statements (see the prior reconciliation
-- migration's header for why) and several AddForeignKey/CreateIndex duplicates of
-- constraints already applied in 20260721120000_supabase_schema_reconciliation.

-- AlterTable
ALTER TABLE "project_outputs" DROP COLUMN "completed_at",
DROP COLUMN "download_url",
DROP COLUMN "generated_at",
DROP COLUMN "intake_id",
DROP COLUMN "order_id",
DROP COLUMN "pdf_url",
DROP COLUMN "project_id",
DROP COLUMN "result_json",
ADD COLUMN     "completedAt" TIMESTAMP(3),
ADD COLUMN     "conceptImageUrls" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "conceptServiceLeadId" TEXT,
ADD COLUMN     "deliveryStatus" TEXT DEFAULT 'pending',
ADD COLUMN     "downloadUrl" TEXT,
ADD COLUMN     "estimationPdfUrl" TEXT,
ADD COLUMN     "estimationServiceLeadId" TEXT,
ADD COLUMN     "fileMetadata" JSONB DEFAULT '{}',
ADD COLUMN     "generatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "intakeId" TEXT,
ADD COLUMN     "orderId" TEXT,
ADD COLUMN     "pdfUrl" TEXT,
ADD COLUMN     "permitFileUrls" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "permitServiceLeadId" TEXT,
ADD COLUMN     "projectId" TEXT,
ADD COLUMN     "resultJson" JSONB,
ADD COLUMN     "serviceType" TEXT DEFAULT 'concept';

-- CreateTable
CREATE TABLE "api_request_logs" (
    "id" TEXT NOT NULL,
    "method" TEXT NOT NULL,
    "path" TEXT NOT NULL,
    "status_code" INTEGER NOT NULL,
    "duration_ms" INTEGER NOT NULL,
    "user_id" TEXT,
    "ip_address" TEXT,
    "user_agent" TEXT,
    "query_params" JSONB,
    "body_size" INTEGER,
    "response_size" INTEGER,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "api_request_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "api_request_logs_path_idx" ON "api_request_logs"("path");

-- CreateIndex
CREATE INDEX "api_request_logs_status_code_idx" ON "api_request_logs"("status_code");

-- CreateIndex
CREATE INDEX "api_request_logs_created_at_idx" ON "api_request_logs"("created_at");

-- CreateIndex
CREATE INDEX "api_request_logs_user_id_idx" ON "api_request_logs"("user_id");

-- CreateIndex
CREATE INDEX "project_outputs_intakeId_idx" ON "project_outputs"("intakeId");

-- CreateIndex
CREATE INDEX "project_outputs_orderId_idx" ON "project_outputs"("orderId");

-- CreateIndex
CREATE INDEX "project_outputs_generatedAt_idx" ON "project_outputs"("generatedAt");

-- CreateIndex
CREATE INDEX "project_outputs_serviceType_idx" ON "project_outputs"("serviceType");

-- CreateIndex
CREATE INDEX "project_outputs_deliveryStatus_idx" ON "project_outputs"("deliveryStatus");

-- CreateIndex
CREATE INDEX "project_outputs_conceptServiceLeadId_idx" ON "project_outputs"("conceptServiceLeadId");

-- CreateIndex
CREATE INDEX "project_outputs_estimationServiceLeadId_idx" ON "project_outputs"("estimationServiceLeadId");

-- CreateIndex
CREATE INDEX "project_outputs_permitServiceLeadId_idx" ON "project_outputs"("permitServiceLeadId");
