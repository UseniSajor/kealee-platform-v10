-- CreateTable MeasurementSession
CREATE TABLE "MeasurementSession" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT,
    "projectId" TEXT,
    "intakeId" TEXT,
    "deviceModel" TEXT NOT NULL,
    "capabilities" JSONB NOT NULL,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "endedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL
);

-- CreateIndex MeasurementSession
CREATE INDEX "MeasurementSession_userId_idx" ON "MeasurementSession"("userId");
CREATE INDEX "MeasurementSession_projectId_idx" ON "MeasurementSession"("projectId");
CREATE INDEX "MeasurementSession_intakeId_idx" ON "MeasurementSession"("intakeId");

-- CreateTable Measurement
CREATE TABLE "Measurement" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "sessionId" TEXT NOT NULL,
    "distance" DOUBLE PRECISION NOT NULL,
    "unit" TEXT NOT NULL,
    "method" TEXT NOT NULL,
    "accuracy" TEXT NOT NULL,
    "confidence" INTEGER NOT NULL,
    "projectId" TEXT,
    "intakeId" TEXT,
    "userId" TEXT,
    "metadata" JSONB,
    "recordedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Measurement_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "MeasurementSession" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex Measurement
CREATE INDEX "Measurement_sessionId_idx" ON "Measurement"("sessionId");
CREATE INDEX "Measurement_projectId_idx" ON "Measurement"("projectId");
CREATE INDEX "Measurement_intakeId_idx" ON "Measurement"("intakeId");
CREATE INDEX "Measurement_userId_idx" ON "Measurement"("userId");
CREATE INDEX "Measurement_method_idx" ON "Measurement"("method");
CREATE INDEX "Measurement_confidence_idx" ON "Measurement"("confidence");

-- CreateTable CalibrationObject
CREATE TABLE "CalibrationObject" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "sessionId" TEXT NOT NULL,
    "objectType" TEXT NOT NULL,
    "knownDimension" DOUBLE PRECISION NOT NULL,
    "pixelSize" DOUBLE PRECISION NOT NULL,
    "calibrationScore" DOUBLE PRECISION NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "CalibrationObject_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "MeasurementSession" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex CalibrationObject
CREATE INDEX "CalibrationObject_sessionId_idx" ON "CalibrationObject"("sessionId");
