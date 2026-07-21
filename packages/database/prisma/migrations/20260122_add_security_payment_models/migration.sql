-- CreateTable: UserSession
CREATE TABLE "UserSession" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "sessionToken" TEXT NOT NULL,
    "refreshToken" TEXT,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "lastActivity" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserSession_pkey" PRIMARY KEY ("id")
);

-- CreateTable: TwoFactorSecret
CREATE TABLE "TwoFactorSecret" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "secret" TEXT NOT NULL,
    "isEnabled" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TwoFactorSecret_pkey" PRIMARY KEY ("id")
);

-- CreateTable: BackupCode
CREATE TABLE "BackupCode" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "isUsed" BOOLEAN NOT NULL DEFAULT false,
    "usedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BackupCode_pkey" PRIMARY KEY ("id")
);

-- CreateTable: PasswordHistory
CREATE TABLE "PasswordHistory" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PasswordHistory_pkey" PRIMARY KEY ("id")
);

-- CreateTable: PasswordResetToken
CREATE TABLE "PasswordResetToken" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "usedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PasswordResetToken_pkey" PRIMARY KEY ("id")
);

-- CreateTable: SecurityEvent
CREATE TABLE "SecurityEvent" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "eventType" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SecurityEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable: PaymentMethod
CREATE TABLE "PaymentMethod" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "stripePaymentMethodId" TEXT NOT NULL,
    "last4" TEXT NOT NULL,
    "brand" TEXT,
    "bankName" TEXT,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "isVerified" BOOLEAN NOT NULL DEFAULT false,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "expiryMonth" INTEGER,
    "expiryYear" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PaymentMethod_pkey" PRIMARY KEY ("id")
);

-- CreateTable: DepositRequest
CREATE TABLE "DepositRequest" (
    "id" TEXT NOT NULL,
    "escrowId" TEXT NOT NULL,
    "paymentMethodId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "amount" DECIMAL(18,2) NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "requiresVerification" BOOLEAN NOT NULL DEFAULT false,
    "expectedClearanceDate" TIMESTAMP(3),
    "stripePaymentIntentId" TEXT,
    "stripeChargeId" TEXT,
    "failureReason" TEXT,
    "failureCode" TEXT,
    "retryCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "clearedAt" TIMESTAMP(3),
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DepositRequest_pkey" PRIMARY KEY ("id")
);

-- CreateTable: TaxForm
CREATE TABLE "TaxForm" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "taxYear" INTEGER NOT NULL,
    "formType" TEXT NOT NULL,
    "totalAmount" DECIMAL(18,2) NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'NOT_FILED',
    "filedAt" TIMESTAMP(3),
    "documentUrl" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TaxForm_pkey" PRIMARY KEY ("id")
);

-- AlterTable: Add currency field to EscrowAgreement
ALTER TABLE "EscrowAgreement" ADD COLUMN "currency" TEXT NOT NULL DEFAULT 'USD';

-- CreateIndex
CREATE UNIQUE INDEX "UserSession_sessionToken_key" ON "UserSession"("sessionToken");
CREATE UNIQUE INDEX "UserSession_refreshToken_key" ON "UserSession"("refreshToken");
CREATE INDEX "UserSession_userId_idx" ON "UserSession"("userId");
CREATE INDEX "UserSession_sessionToken_idx" ON "UserSession"("sessionToken");
CREATE INDEX "UserSession_expiresAt_idx" ON "UserSession"("expiresAt");

CREATE UNIQUE INDEX "TwoFactorSecret_userId_key" ON "TwoFactorSecret"("userId");
CREATE INDEX "TwoFactorSecret_userId_idx" ON "TwoFactorSecret"("userId");

CREATE UNIQUE INDEX "BackupCode_code_key" ON "BackupCode"("code");
CREATE INDEX "BackupCode_userId_idx" ON "BackupCode"("userId");
CREATE INDEX "BackupCode_code_idx" ON "BackupCode"("code");

CREATE INDEX "PasswordHistory_userId_idx" ON "PasswordHistory"("userId");
CREATE INDEX "PasswordHistory_createdAt_idx" ON "PasswordHistory"("createdAt");

CREATE UNIQUE INDEX "PasswordResetToken_token_key" ON "PasswordResetToken"("token");
CREATE INDEX "PasswordResetToken_userId_idx" ON "PasswordResetToken"("userId");
CREATE INDEX "PasswordResetToken_token_idx" ON "PasswordResetToken"("token");
CREATE INDEX "PasswordResetToken_expiresAt_idx" ON "PasswordResetToken"("expiresAt");

CREATE INDEX "SecurityEvent_userId_idx" ON "SecurityEvent"("userId");
CREATE INDEX "SecurityEvent_eventType_idx" ON "SecurityEvent"("eventType");
CREATE INDEX "SecurityEvent_createdAt_idx" ON "SecurityEvent"("createdAt");

CREATE UNIQUE INDEX "PaymentMethod_stripePaymentMethodId_key" ON "PaymentMethod"("stripePaymentMethodId");
CREATE INDEX "PaymentMethod_userId_idx" ON "PaymentMethod"("userId");
CREATE INDEX "PaymentMethod_stripePaymentMethodId_idx" ON "PaymentMethod"("stripePaymentMethodId");

CREATE UNIQUE INDEX "DepositRequest_stripePaymentIntentId_key" ON "DepositRequest"("stripePaymentIntentId");
CREATE INDEX "DepositRequest_escrowId_idx" ON "DepositRequest"("escrowId");
CREATE INDEX "DepositRequest_userId_idx" ON "DepositRequest"("userId");
CREATE INDEX "DepositRequest_status_idx" ON "DepositRequest"("status");
CREATE INDEX "DepositRequest_stripePaymentIntentId_idx" ON "DepositRequest"("stripePaymentIntentId");

CREATE INDEX "TaxForm_userId_idx" ON "TaxForm"("userId");
CREATE INDEX "TaxForm_taxYear_idx" ON "TaxForm"("taxYear");
CREATE INDEX "TaxForm_formType_idx" ON "TaxForm"("formType");
CREATE INDEX "TaxForm_status_idx" ON "TaxForm"("status");
