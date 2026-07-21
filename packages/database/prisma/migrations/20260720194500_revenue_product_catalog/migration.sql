CREATE TYPE "RevenueCreditSourceType" AS ENUM ('CAMPAIGN_BONUS', 'QUALITY_CREDIT');
CREATE TYPE "DeliverableCorrectionStatus" AS ENUM ('REQUESTED', 'IN_PROGRESS', 'DELIVERED', 'ESCALATED_TO_CREDIT');

CREATE TABLE "RevenueProduct" (
  "id" TEXT PRIMARY KEY,
  "productKey" TEXT NOT NULL UNIQUE,
  "name" TEXT NOT NULL,
  "customerType" TEXT NOT NULL,
  "priceCents" INTEGER NOT NULL CHECK ("priceCents" > 0),
  "active" BOOLEAN NOT NULL DEFAULT true,
  "intakeSchemaId" TEXT NOT NULL,
  "workflowTemplateId" TEXT NOT NULL,
  "responsibleAgent" TEXT NOT NULL,
  "propertyIntelDepth" TEXT NOT NULL CHECK ("propertyIntelDepth" IN ('basic','project','contractor','development')),
  "requiredApprovals" JSONB NOT NULL,
  "notificationRuleSetId" TEXT NOT NULL,
  "fulfillmentSlaHours" INTEGER NOT NULL,
  "slaAnchor" TEXT NOT NULL DEFAULT 'payment',
  "revisionLimit" INTEGER NOT NULL,
  "exclusions" JSONB NOT NULL,
  "upsellProductIds" TEXT[] NOT NULL DEFAULT '{}',
  "dailyCapacity" INTEGER,
  "aiCostLimitCents" INTEGER,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE "ProductCreditLedger" (
  "id" TEXT PRIMARY KEY, "intakeId" TEXT NOT NULL, "productId" TEXT,
  "sourceType" "RevenueCreditSourceType" NOT NULL, "amountCents" INTEGER NOT NULL,
  "reason" TEXT, "approvedByUserId" TEXT, "earnedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "expiresAt" TIMESTAMP(3) NOT NULL, "redeemedAt" TIMESTAMP(3), "redeemedOnIntakeId" TEXT,
  CONSTRAINT "ProductCreditLedger_productId_fkey" FOREIGN KEY ("productId") REFERENCES "RevenueProduct"("id") ON DELETE SET NULL
);
CREATE INDEX "ProductCreditLedger_intakeId_idx" ON "ProductCreditLedger"("intakeId");

CREATE TABLE "DeliverableCorrection" (
  "id" TEXT PRIMARY KEY, "intakeId" TEXT NOT NULL, "productId" TEXT,
  "requestedBy" TEXT NOT NULL, "reason" TEXT NOT NULL, "affectedSection" TEXT NOT NULL,
  "status" "DeliverableCorrectionStatus" NOT NULL DEFAULT 'REQUESTED', "assignedAgent" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "resolvedAt" TIMESTAMP(3),
  CONSTRAINT "DeliverableCorrection_productId_fkey" FOREIGN KEY ("productId") REFERENCES "RevenueProduct"("id") ON DELETE SET NULL
);
CREATE INDEX "DeliverableCorrection_intakeId_idx" ON "DeliverableCorrection"("intakeId");

CREATE TABLE "RevenueTransaction" (
  "id" TEXT PRIMARY KEY, "intakeId" TEXT NOT NULL, "productId" TEXT,
  "stripeCheckoutSessionId" TEXT UNIQUE, "stripePaymentIntentId" TEXT,
  "grossCents" INTEGER NOT NULL, "commissionCents" INTEGER NOT NULL DEFAULT 0,
  "fulfillmentCostCents" INTEGER NOT NULL DEFAULT 0, "netCents" INTEGER NOT NULL,
  "status" TEXT NOT NULL, "disputedAt" TIMESTAMP(3), "recognizedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX "RevenueTransaction_intakeId_idx" ON "RevenueTransaction"("intakeId");
CREATE INDEX "RevenueTransaction_status_idx" ON "RevenueTransaction"("status");

INSERT INTO "RevenueProduct" ("id","productKey","name","customerType","priceCents","intakeSchemaId","workflowTemplateId","responsibleAgent","propertyIntelDepth","requiredApprovals","notificationRuleSetId","fulfillmentSlaHours","slaAnchor","revisionLimit","exclusions","upsellProductIds","dailyCapacity","aiCostLimitCents") VALUES
('rev_home_readiness','home-project-readiness-review','Home Project Readiness Review','homeowner',29900,'revenue-home-readiness-v1','wf_home_readiness_v1','owner','basic','[]','revenue-standard',48,'intake_complete',1,'["stamped drawings","final permit approval","construction documents"]',ARRAY['project-launch-package'],NULL,2500),
('rev_project_launch','project-launch-package','Project Launch Package','homeowner',55000,'revenue-project-launch-v1','wf_project_launch_v1','owner','project','["out_of_scope"]','revenue-launch',72,'intake_complete',1,'["stamped drawings","permit submission","contractor guarantee"]','{}',20,5000),
('rev_contractor_package','contractor-estimate-permit-package','Contractor Estimate and Permit Package','contractor',79500,'revenue-contractor-estimate-permit-v1','wf_contractor_estimate_permit_v1','contractor','contractor','["custom_scope","professional_services"]','revenue-contractor',72,'intake_complete',1,'["sealed estimate","stamped drawings","permit approval guarantee","final trade pricing"]','{}',12,7000),
('rev_developer_express','developer-feasibility-express','Developer Feasibility Express','developer',109500,'revenue-developer-feasibility-v1','wf_developer_feasibility_v1','developer','development','["multiple_properties","zoning_relief","professional_services"]','revenue-developer',96,'intake_complete',1,'["survey","environmental report","legal opinion","entitlement approval","stamped drawings"]','{}',8,10000)
ON CONFLICT ("productKey") DO UPDATE SET "name"=EXCLUDED."name", "priceCents"=EXCLUDED."priceCents", "active"=true, "updatedAt"=CURRENT_TIMESTAMP;

