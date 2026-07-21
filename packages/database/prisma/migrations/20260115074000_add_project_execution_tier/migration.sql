-- CreateEnum: ExecutionTier
CREATE TYPE "ExecutionTier" AS ENUM ('LOW', 'STANDARD', 'HIGH');

-- AlterTable: Add executionTier to Project
ALTER TABLE "Project" ADD COLUMN "executionTier" "ExecutionTier" NOT NULL DEFAULT 'STANDARD';
