-- Add missing User fields
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "firstName" TEXT;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "lastName" TEXT;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "role" TEXT DEFAULT 'USER';
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "status" TEXT DEFAULT 'ACTIVE';
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "stripeCustomerId" TEXT;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "password" TEXT;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "address" TEXT;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "city" TEXT;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "state" TEXT;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "zipCode" TEXT;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "ssn" TEXT;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "ein" TEXT;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "twoFactorEnabled" BOOLEAN DEFAULT false;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "createdAt" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "metadata" JSONB;

-- Add escrowAgreementId column to EscrowTransaction (aliasing escrowId)
-- We'll keep both for backward compatibility
ALTER TABLE "EscrowTransaction" ADD COLUMN IF NOT EXISTS "escrowAgreementId" TEXT;
UPDATE "EscrowTransaction" SET "escrowAgreementId" = "escrowId" WHERE "escrowAgreementId" IS NULL;

-- Add escrowAgreementId column to EscrowHold (aliasing escrowId)
ALTER TABLE "EscrowHold" ADD COLUMN IF NOT EXISTS "escrowAgreementId" TEXT;
UPDATE "EscrowHold" SET "escrowAgreementId" = "escrowId" WHERE "escrowAgreementId" IS NULL;

-- Add missing fields to EscrowTransaction
ALTER TABLE "EscrowTransaction" ADD COLUMN IF NOT EXISTS "description" TEXT;

-- Add missing fields to TwoFactorSecret
ALTER TABLE "TwoFactorSecret" ADD COLUMN IF NOT EXISTS "isVerified" BOOLEAN DEFAULT false;
ALTER TABLE "TwoFactorSecret" ADD COLUMN IF NOT EXISTS "lastUsedAt" TIMESTAMP(3);

-- Add missing fields to UserSession
ALTER TABLE "UserSession" ADD COLUMN IF NOT EXISTS "isRevoked" BOOLEAN DEFAULT false;
ALTER TABLE "UserSession" ADD COLUMN IF NOT EXISTS "lastActivityAt" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP;

-- Add missing fields to SecurityEvent
ALTER TABLE "SecurityEvent" ADD COLUMN IF NOT EXISTS "type" TEXT;
ALTER TABLE "SecurityEvent" ADD COLUMN IF NOT EXISTS "severity" TEXT DEFAULT 'INFO';
ALTER TABLE "SecurityEvent" ADD COLUMN IF NOT EXISTS "timestamp" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP;

-- Add missing fields to ApiKey
ALTER TABLE "ApiKey" ADD COLUMN IF NOT EXISTS "keyPrefix" TEXT;
ALTER TABLE "ApiKey" ADD COLUMN IF NOT EXISTS "isRevoked" BOOLEAN DEFAULT false;

-- Add missing fields to Statement
ALTER TABLE "Statement" ADD COLUMN IF NOT EXISTS "recipientRole" TEXT;
ALTER TABLE "Statement" ADD COLUMN IF NOT EXISTS "openingBalance" DECIMAL(18,2) DEFAULT 0;
ALTER TABLE "Statement" ADD COLUMN IF NOT EXISTS "closingBalance" DECIMAL(18,2) DEFAULT 0;
ALTER TABLE "Statement" ADD COLUMN IF NOT EXISTS "totalDeposits" DECIMAL(18,2) DEFAULT 0;
ALTER TABLE "Statement" ADD COLUMN IF NOT EXISTS "totalReleases" DECIMAL(18,2) DEFAULT 0;

-- Add missing fields to TaxForm
ALTER TABLE "TaxForm" ADD COLUMN IF NOT EXISTS "recipientId" TEXT;
ALTER TABLE "TaxForm" ADD COLUMN IF NOT EXISTS "sentAt" TIMESTAMP(3);

-- Add missing fields to DepositRequest
ALTER TABLE "DepositRequest" ADD COLUMN IF NOT EXISTS "escrowAgreementId" TEXT;
UPDATE "DepositRequest" SET "escrowAgreementId" = "escrowId" WHERE "escrowAgreementId" IS NULL;

-- Create indexes for new columns
CREATE INDEX IF NOT EXISTS "User_role_idx" ON "User"("role");
CREATE INDEX IF NOT EXISTS "User_status_idx" ON "User"("status");
CREATE INDEX IF NOT EXISTS "EscrowTransaction_escrowAgreementId_idx" ON "EscrowTransaction"("escrowAgreementId");
CREATE INDEX IF NOT EXISTS "EscrowHold_escrowAgreementId_idx" ON "EscrowHold"("escrowAgreementId");
