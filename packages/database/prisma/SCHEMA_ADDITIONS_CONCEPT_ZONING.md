/**
 * Prisma Schema Additions - Concept & Zoning Services
 * Add these models to packages/database/prisma/schema.prisma
 */

// ============================================================================
// CONCEPT INTAKE & DESIGN FLOW
// ============================================================================

enum ConceptStatus {
  INTAKE_SUBMITTED
  CONCEPTS_GENERATED
  CHECKOUT_INITIATED
  PAID
  IN_PROGRESS
  COMPLETED
  REJECTED
}

enum ConceptComplexity {
  SIMPLE
  MODERATE
  COMPLEX
}

model ConceptIntake {
  id String @id @default(uuid())

  // Contact info
  email String
  name String?
  phone String?
  
  // Project info
  projectType String
  description String
  address String?
  zipCode String?
  
  // Project details
  hasPhotos Boolean @default(false)
  photoCount Int @default(0)
  roughDimensions Json? // { sqft, length, width }
  budgetRange String?
  stylePreference String?
  hasExistingStructure Boolean @default(false)

  // Scoring
  leadScore Int
  complexity ConceptComplexity
  tier String // concept_basic, concept_advanced, concept_full
  readinessState String

  // Generated content
  generatedConcepts Json? // Array of concept objects
  scopeSummary Json?
  feasibilitySignals Json?

  // Funnel tracking
  funnelSessionId String?
  source String? // marketplace, advertorial, organic, etc.
  
  // Status
  status ConceptStatus @default(INTAKE_SUBMITTED)
  checkoutInitiatedAt DateTime?
  paidAt DateTime?

  // Relationships
  estimationIntakeId String? // Link to estimation if user proceeds
  projectId String? // Link to project if created
  
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@index([email])
  @@index([status])
  @@index([funnelSessionId])
  @@index([projectId])
}

// ============================================================================
// ZONING & FEASIBILITY ANALYSIS FLOW
// ============================================================================

enum ZoningStatus {
  INTAKE_SUBMITTED
  ANALYSIS_QUEUED
  ANALYSIS_IN_PROGRESS
  ANALYSIS_COMPLETE
  CHECKOUT_INITIATED
  PAID
  CONSULTATION_SCHEDULED
  REPORT_DELIVERED
  COMPLETED
}

enum BuildabilityRating {
  HIGHLY_FEASIBLE
  FEASIBLE_WITH_VARIANCE
  FEASIBLE_WITH_CUP
  CHALLENGING_COMPLEX_ENTITLEMENTS
  NOT_FEASIBLE
}

model ZoningIntake {
  id String @id @default(uuid())

  // Contact info
  email String
  name String?
  phone String?
  
  // Property info
  address String?
  zipCode String?
  jurisdiction String?
  zoningDistrict String?
  propertyType String? // residential, commercial, mixed_use, industrial
  currentUse String?
  
  // Lot info
  lotSize Int? // in square feet
  existingStructureInfo String?
  desiredBuild String?

  // Environmental factors
  environmentalConstraints String?
  hasWetlands Boolean @default(false)
  hasFloodPlain Boolean @default(false)
  inHistoricDistrict Boolean @default(false)

  // Project intent
  projectIntent String?

  // Documentation
  uploadedPhotos Boolean @default(false)
  uploadedDocuments Boolean @default(false)

  // Analysis results
  buildabilityScore Int?
  buildabilityRating BuildabilityRating?
  analysisSummary Json? // Jurisdiction data, overlays, uses, etc.
  
  // Flags
  requiresVariance Boolean @default(false)
  requiresCUP Boolean @default(false)
  requiresEngineer Boolean @default(false)
  requiresArchitect Boolean @default(false)
  
  // Tier
  recommendedTier String? // zoning_research, feasibility_assessment, entitlement_path, pre_submission_consulting
  readinessState String?

  // Funnel tracking
  funnelSessionId String?
  source String?
  
  // Consultation
  consultationScheduled Boolean @default(false)
  consultationDate DateTime?
  consultationNotes String?

  // Status & tracking
  status ZoningStatus @default(INTAKE_SUBMITTED)
  checkoutInitiatedAt DateTime?
  paidAt DateTime?

  // Relationships
  conceptIntakeId String? // Link to concept intake
  estimationIntakeId String? // Link to estimation if user proceeds
  projectId String? // Link to project if created
  
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@index([email])
  @@index([jurisdiction])
  @@index([status])
  @@index([funnelSessionId])
  @@index([projectId])
}

// ============================================================================
// PERMIT AUTHORIZATION (For Managed Submissions)
// ============================================================================

enum AuthorizationType {
  OWNER_CONSENT
  CONTRACTOR_AUTHORIZATION
  BOTH
}

enum SubmissionMethod {
  SELF
  ASSISTED
  KEALEE_MANAGED
}

model PermitAuthorization {
  id String @id @default(uuid())

  // Authorization details
  projectId String?
  permitId String?
  
  // Owner info
  ownerName String
  ownerEmail String?
  ownerPhone String?
  
  // Contractor info
  contractorName String?
  contractorCompany String?
  contractorEmail String?
  contractorPhone String?
  
  // Signature
  ownerSignature String? // Base64 or S3 URL
  contractorSignature String?
  ownerSignedAt DateTime?
  contractorSignedAt DateTime?
  
  // Authorization type
  authorizationType AuthorizationType
  submissionMethod SubmissionMethod @default(ASSISTED)
  
  // Jurisdiction
  jurisdiction String
  projectScope String
  
  // Consent details
  consentGiven Boolean @default(false)
  consentDate DateTime?
  consentExpiry DateTime?
  
  // Revocation
  revokedAt DateTime?
  revocationReason String?

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@index([projectId])
  @@index([permitId])
  @@index([submissionMethod])
  @@index([consentGiven])
}

// ============================================================================
// SERVICE CHAIN GATING (Orchestration)
// ============================================================================

enum ReadinessState {
  NOT_READY
  NEEDS_MORE_INFO
  READY_FOR_CONCEPT
  READY_FOR_ZONING_REVIEW
  READY_FOR_ESTIMATE
  READY_FOR_PERMIT_REVIEW
  READY_FOR_CHECKOUT
  REQUIRES_CONSULTATION
  BLOCKED
}

model ServiceChainGate {
  id String @id @default(uuid())

  // Project tracking
  projectId String?
  userId String?
  
  // Service stages
  conceptCompleted Boolean @default(false)
  conceptIntakeId String?
  
  zoningCompleted Boolean @default(false)
  zoningIntakeId String?
  
  estimationCompleted Boolean @default(false)
  estimationIntakeId String?
  
  permitReadyForCheckout Boolean @default(false)
  permitIntakeId String?
  
  // Overall readiness
  currentReadinessState ReadinessState @default(NOT_READY)
  nextRequiredService String? // concept, zoning, estimation, permit
  blockedReason String?
  
  // Chain execution
  lastServiceCompleted String?
  chain Json? // Array of executed services with timestamps
  
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@index([projectId])
  @@index([userId])
  @@index([currentReadinessState])
}

// ============================================================================
// ANALYTICS & CONVERSION TRACKING
// ============================================================================

enum ConversionEvent {
  CONCEPT_STARTED
  CONCEPT_COMPLETED
  CONCEPT_IMAGES_UPLOADED
  CONCEPT_CHECKOUT_INITIATED
  CONCEPT_PAID
  ZONING_STARTED
  ZONING_COMPLETED
  ZONING_CHECKOUT_INITIATED
  ZONING_PAID
  ESTIMATION_STARTED
  ESTIMATION_COMPLETED
  ESTIMATION_CHECKOUT_INITIATED
  ESTIMATION_PAID
  PERMIT_STARTED
  PERMIT_COMPLETED
  PERMIT_MANAGED_SELECTED
  PERMIT_AUTHORIZATION_PROVIDED
  PERMIT_CHECKOUT_INITIATED
  PERMIT_PAID
  ROUTED_TO_ARCHITECT
  ROUTED_TO_ENGINEER
  CHAIN_COMPLETED
}

model ConversionFunnel {
  id String @id @default(uuid())

  // Funnel session
  funnelSessionId String @unique
  userId String?

  // Source tracking
  source String? // marketplace, advertorial, organic, referral
  campaign String?
  medium String?
  
  // Conversion events
  events ConversionEvent[]
  eventTimestamps Json? // { event: timestamp }
  
  // Stage completion
  conceptCompleted Boolean @default(false)
  zoningCompleted Boolean @default(false)
  estimationCompleted Boolean @default(false)
  permitCompleted Boolean @default(false)
  fullChainCompleted Boolean @default(false)
  
  // Revenue tracking
  totalRevenue Int @default(0) // in cents
  
  // Time tracking
  firstEventAt DateTime?
  lastEventAt DateTime?
  completionTime Int? // seconds from start to completion
  
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@index([funnelSessionId])
  @@index([userId])
  @@index([source])
  @@index([fullChainCompleted])
}
