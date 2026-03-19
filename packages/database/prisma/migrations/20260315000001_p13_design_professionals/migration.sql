-- P13: Design Professionals Additive Migration

CREATE TYPE "DesignProfessionalRole" AS ENUM (
  'ARCHITECT', 'STRUCTURAL_ENGINEER', 'MEP_ENGINEER',
  'CIVIL_ENGINEER', 'LANDSCAPE_ARCHITECT', 'INTERIOR_DESIGNER'
);

CREATE TYPE "DPStatus" AS ENUM (
  'PENDING_REVIEW', 'VERIFIED', 'SUSPENDED', 'REJECTED'
);

CREATE TYPE "DPAssignmentStatus" AS ENUM (
  'INVITED', 'ACTIVE', 'PAUSED', 'COMPLETED', 'DECLINED'
);

CREATE TABLE "design_professionals" (
  "id"              TEXT NOT NULL DEFAULT gen_random_uuid()::text,
  "userId"          TEXT NOT NULL,
  "role"            "DesignProfessionalRole" NOT NULL,
  "status"          "DPStatus" NOT NULL DEFAULT 'PENDING_REVIEW',
  "firmName"        TEXT,
  "licenseNumber"   TEXT,
  "licenseState"    CHAR(2),
  "licenseExpiry"   TIMESTAMP(3),
  "portfolioUrl"    TEXT,
  "specialties"     TEXT[] NOT NULL DEFAULT '{}',
  "bio"             TEXT,
  "yearsExperience" INTEGER,
  "jurisdictions"   TEXT[] NOT NULL DEFAULT '{}',
  "verifiedAt"      TIMESTAMP(3),
  "createdAt"       TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"       TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "design_professionals_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "design_professionals_userId_key" UNIQUE ("userId")
);

CREATE TABLE "design_professional_assignments" (
  "id"             TEXT NOT NULL DEFAULT gen_random_uuid()::text,
  "professionalId" TEXT NOT NULL,
  "projectId"      TEXT NOT NULL,
  "role"           TEXT NOT NULL,
  "status"         "DPAssignmentStatus" NOT NULL DEFAULT 'INVITED',
  "invitedAt"      TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "acceptedAt"     TIMESTAMP(3),
  "completedAt"    TIMESTAMP(3),
  "notes"          TEXT,

  CONSTRAINT "design_professional_assignments_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "dp_role_status" ON "design_professionals"("role", "status");
CREATE INDEX "dp_status" ON "design_professionals"("status");
CREATE INDEX "dpa_professional_status" ON "design_professional_assignments"("professionalId", "status");
CREATE INDEX "dpa_project_status" ON "design_professional_assignments"("projectId", "status");

ALTER TABLE "design_professionals"
  ADD CONSTRAINT "dp_user_fk" FOREIGN KEY ("userId")
  REFERENCES "User"("id") ON DELETE CASCADE;

ALTER TABLE "design_professional_assignments"
  ADD CONSTRAINT "dpa_professional_fk" FOREIGN KEY ("professionalId")
  REFERENCES "design_professionals"("id") ON DELETE CASCADE;
