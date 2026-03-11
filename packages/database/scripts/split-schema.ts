#!/usr/bin/env node
/**
 * Schema Splitter — Parses the monolithic schema.prisma and splits into domain-organized files.
 *
 * Usage: npx tsx scripts/split-schema.ts
 *
 * This reads schema.prisma, classifies every model and enum into a domain,
 * and writes them to schema-src/<domain>/<name>.prisma files.
 */

import * as fs from 'fs'
import * as path from 'path'

const SCHEMA_PATH = path.join(__dirname, '..', 'prisma', 'schema.prisma')
const SCHEMA_SRC = path.join(__dirname, '..', 'schema-src')

// Domain classification map — every model name → domain
const MODEL_DOMAIN: Record<string, string> = {
  // === IDENTITY ===
  User: 'identity',
  Org: 'identity',
  OrgMember: 'identity',
  Session: 'identity',
  Role: 'identity',
  Permission: 'identity',
  RolePermission: 'identity',
  BackupCode: 'identity',
  TwoFactorSecret: 'identity',
  PasswordHistory: 'identity',
  PasswordResetToken: 'identity',
  UserSession: 'identity',
  ApiKey: 'identity',
  ApiKeyUsage: 'identity',
  ApiUsage: 'identity',
  ModuleEntitlement: 'identity',

  // === FOUNDATION ===
  PerformanceBenchmark: 'foundation',
  BackupRecord: 'foundation',
  DisasterRecoveryPlan: 'foundation',
  AppHealthMetric: 'foundation',
  DeadLetterLog: 'foundation',
  Alert: 'foundation',
  SystemConfig: 'foundation',
  DashboardWidget: 'foundation',
  JobQueue: 'foundation',
  JobSchedule: 'foundation',
  DataRetentionPolicy: 'foundation',
  SecurityAlert: 'foundation',
  SecurityAuditLog: 'foundation',
  SecurityEvent: 'foundation',
  AccessLog: 'foundation',
  PushSubscription: 'foundation',
  Notification: 'foundation',
  NotificationPreference: 'foundation',
  Message: 'foundation',
  MessageTemplate: 'foundation',
  CommunicationLog: 'foundation',
  CommunicationTemplate: 'foundation',
  Conversation: 'foundation',
  ConversationParticipant: 'foundation',
  ChatMessage: 'foundation',
  ChatMessageAttachment: 'foundation',
  ChatMessageRead: 'foundation',
  Faq: 'foundation',
  PlatformKnowledge: 'foundation',

  // === DDTS ===
  DigitalTwin: 'ddts',
  TwinSnapshot: 'ddts',
  TwinEvent: 'ddts',
  TwinModule: 'ddts',
  TwinKPI: 'ddts',

  // === LAND ===
  Parcel: 'land',
  ParcelZoning: 'land',
  SiteAssessment: 'land',
  ParcelComparable: 'land',
  ParcelDocument: 'land',
  ParcelNote: 'land',
  LandOffer: 'land',
  ZoningProfile: 'land',
  ZoningComplianceReport: 'land',
  Property: 'land',

  // === FEASIBILITY ===
  FeasibilityStudy: 'feasibility',
  FeasibilityScenario: 'feasibility',
  FeasibilityCostAssumption: 'feasibility',
  FeasibilityRevenueAssumption: 'feasibility',
  FeasibilityComparison: 'feasibility',
  HUDEligibilityCheck: 'feasibility',

  // === DEVELOPMENT ===
  CapitalStack: 'development',
  CapitalSource: 'development',
  DrawSchedule: 'development',
  InvestorReport: 'development',
  Entitlement: 'development',
  DevelopmentLead: 'development',
  DevelopmentLeadNote: 'development',
  DevelopmentLeadActivity: 'development',
  DevelopmentPackage: 'development',
  FinancingApplication: 'development',
  PatternBookDesign: 'development',
  PatternBookSelection: 'development',
  HousingPipelineEntry: 'development',
  HousingDashboardSnapshot: 'development',

  // === PM (Project Management) ===
  Project: 'pm',
  ProjectPhase: 'pm',
  PhaseMilestone: 'pm',
  ProjectPhaseHistory: 'pm',
  ProjectMembership: 'pm',
  ProjectManager: 'pm',
  ScheduleItem: 'pm',
  Task: 'pm',
  TaskComment: 'pm',
  RFI: 'pm',
  RFIResponse: 'pm',
  Submittal: 'pm',
  SubmittalReview: 'pm',
  ChangeOrder: 'pm',
  ChangeOrderApproval: 'pm',
  ChangeOrderLineItem: 'pm',
  Inspection: 'pm',
  InspectionFinding: 'pm',
  InspectionPreparationItem: 'pm',
  DailyLog: 'pm',
  Photo: 'pm',
  WeatherLog: 'pm',
  Meeting: 'pm',
  MeetingAttendee: 'pm',
  MeetingActionItem: 'pm',
  Selection: 'pm',
  SelectionOption: 'pm',
  DrawingSet: 'pm',
  DrawingSheet: 'pm',
  BudgetLine: 'pm',
  BudgetEntry: 'pm',
  BudgetAlert: 'pm',
  BudgetSnapshot: 'pm',
  BudgetItem: 'pm',
  BudgetTransaction: 'pm',
  CloseoutItem: 'pm',
  CostCode: 'pm',
  PurchaseOrder: 'pm',
  Bill: 'pm',
  RFQ: 'pm',
  Delivery: 'pm',
  LookaheadItem: 'pm',
  SafetyIncident: 'pm',
  ToolboxTalk: 'pm',
  ToolboxTalkAttendee: 'pm',
  TimeEntry: 'pm',
  SiteCheckIn: 'pm',
  SiteVisit: 'pm',
  FieldConflict: 'pm',
  MobilizationChecklist: 'pm',
  MultifamilyUnit: 'pm',
  MultifamilyAreaPhase: 'pm',
  DrawRequest: 'pm',
  BIMModel: 'pm',
  SensorDevice: 'pm',
  SensorReading: 'pm',
  CrewCheckIn: 'pm',
  QualityIssue: 'pm',
  QAInspectionResult: 'pm',
  Issue: 'pm',
  Warranty: 'pm',
  WarrantyClaim: 'pm',
  PreConProject: 'pm',
  SpatialScan: 'pm',
  SpatialVerification: 'pm',
  BeforeAfterPair: 'pm',
  VisitChecklist: 'pm',
  WeeklyReport: 'pm',
  Report: 'pm',
  ReportTemplate: 'pm',

  // === PM — Permits ===
  Permit: 'pm',
  PermitSubmission: 'pm',
  PermitCorrection: 'pm',
  PermitEvent: 'pm',
  PermitRouting: 'pm',
  PermitNotification: 'pm',
  PermitTemplate: 'pm',
  PermitActivity: 'pm',
  ReviewAssignment: 'pm',
  InspectionAssignment: 'pm',
  RemoteInspection: 'pm',
  ExpeditedPermitService: 'pm',
  Jurisdiction: 'pm',
  JurisdictionStaff: 'pm',
  JurisdictionUsageMetrics: 'pm',
  JurisdictionFormTemplate: 'pm',
  JurisdictionIntegrationLog: 'pm',
  JurisdictionAnalytics: 'pm',
  RoutingRule: 'pm',
  AIReviewResult: 'pm',

  // === PM — Architect / Design ===
  ArchitectOnboarding: 'pm',
  DesignTemplate: 'pm',
  DesignTemplateInstance: 'pm',
  StandardDetail: 'pm',
  StandardDetailInstance: 'pm',
  DesignProject: 'pm',
  DesignTeamMember: 'pm',
  DesignPhase: 'pm',
  DesignFile: 'pm',
  DesignRevision: 'pm',
  DesignConcept: 'pm',
  DesignHandoff: 'pm',
  DesignPermitPackage: 'pm',
  DesignQCChecklist: 'pm',
  DesignQueueAssignment: 'pm',
  DesignProfessionalProfile: 'pm',
  AutoDesignSession: 'pm',
  AutoDesignOption: 'pm',
  AutoDesignRevisionRequest: 'pm',
  ReviewRequest: 'pm',
  VersionBranch: 'pm',

  // === PM — Estimation ===
  Estimate: 'pm',
  EstimateLineItem: 'pm',
  EstimateSection: 'pm',
  EstimateComparison: 'pm',
  EstimateHistory: 'pm',
  EstimationOrder: 'pm',
  QuickEstimate: 'pm',
  Assembly: 'pm',
  AssemblyItem: 'pm',
  CostDatabase: 'pm',
  CostDataReview: 'pm',
  CostBookCustomization: 'pm',
  CostCodeImportJob: 'pm',
  LaborRate: 'pm',
  MaterialCost: 'pm',
  EquipmentRate: 'pm',
  Takeoff: 'pm',
  TakeoffJob: 'pm',
  TakeoffMeasurement: 'pm',
  SubcontractorQuote: 'pm',
  RegionalCostIndex: 'pm',
  HistoricalProjectCost: 'pm',
  AIEstimationSession: 'pm',

  // === PM — Pre-Construction ===
  PreConPhaseHistory: 'pm',
  RiskAssessment: 'pm',

  // === PM — SOPs ===
  SOPTemplate: 'pm',
  SOPPhase: 'pm',
  SOPStep: 'pm',
  SOPExecution: 'pm',
  SOPStepExecution: 'pm',

  // === PM — Bids (project-level) ===
  Bid: 'pm',
  BidRequest: 'pm',
  BidSubmission: 'pm',
  BidEvaluation: 'pm',
  OpportunityBid: 'pm',
  OpportunityBidDocument: 'pm',
  OpportunityBidChecklist: 'pm',
  OpportunityBidActivity: 'pm',
  BidOpportunity: 'pm',
  BidChecklistItem: 'pm',
  BidDocument: 'pm',
  BidActivity: 'pm',
  BidSubRequest: 'pm',
  BidEmbedding: 'pm',
  BidSimilarity: 'pm',
  BidScanLog: 'pm',
  BidInvitation: 'pm',

  // === PAYMENTS ===
  Payment: 'payments',
  PaymentMethod: 'payments',
  PaymentScheduleTemplate: 'payments',
  Milestone: 'payments',
  MilestoneApproval: 'payments',
  ContractAgreement: 'payments',
  Evidence: 'payments',
  EscrowAgreement: 'payments',
  EscrowTransaction: 'payments',
  EscrowHold: 'payments',
  EscrowReconciliation: 'payments',
  Account: 'payments',
  AccountBalance: 'payments',
  JournalEntry: 'payments',
  JournalEntryLine: 'payments',
  ConnectedAccount: 'payments',
  Payout: 'payments',
  Dispute: 'payments',
  DisputeEvidence: 'payments',
  DisputeMessage: 'payments',
  DisputeResolution: 'payments',
  LienWaiver: 'payments',
  LienWaiverSignature: 'payments',
  Statement: 'payments',
  StatementSchedule: 'payments',
  Invoice: 'payments',
  Receipt: 'payments',
  ScheduledPayment: 'payments',
  PlatformFee: 'payments',
  PlatformFeeConfig: 'payments',
  DepositRequest: 'payments',
  TaxForm: 'payments',
  FinancialAuditEntry: 'payments',
  StripeProduct: 'payments',
  ConceptPackageOrder: 'payments',
  Product: 'payments',
  ProjectItem: 'payments',

  // === OPERATIONS ===
  TurnoverChecklist: 'operations',
  TurnoverItem: 'operations',
  MaintenanceSchedule: 'operations',
  MaintenanceWorkOrder: 'operations',

  // === MARKETPLACE ===
  MarketplaceProfile: 'marketplace',
  Portfolio: 'marketplace',
  PortfolioItem: 'marketplace',
  Lead: 'marketplace',
  Quote: 'marketplace',
  Contractor: 'marketplace',
  ContractorProfile: 'marketplace',
  ContractorCredential: 'marketplace',
  ContractorReview: 'marketplace',
  ContractorScore: 'marketplace',
  ContractorVerification: 'marketplace',
  ContractorProject: 'marketplace',
  ContractorBid: 'marketplace',
  ContractorLicenseRegistry: 'marketplace',
  OpportunityListing: 'marketplace',
  OpportunityCategory: 'marketplace',
  OpportunityApplication: 'marketplace',
  MarketplaceFeeConfig: 'marketplace',
  AssignmentRequest: 'marketplace',
  ServicePlan: 'marketplace',
  PMServiceSubscription: 'marketplace',
  PermitServiceSubscription: 'marketplace',
  ALaCarteService: 'marketplace',
  GCOpsLead: 'marketplace',
  GCOpsLeadNote: 'marketplace',
  GCOpsLeadActivity: 'marketplace',
  PermitServiceLead: 'marketplace',
  PermitServiceLeadNote: 'marketplace',
  PermitServiceLeadActivity: 'marketplace',
  CaseStudy: 'marketplace',
  InterestListSignup: 'marketplace',

  // === DOCUMENTS ===
  Document: 'documents',
  DocumentDistribution: 'documents',
  DocumentTemplate: 'documents',
  GeneratedDocument: 'documents',
  File: 'documents',
  FileUpload: 'documents',
  UserAction: 'documents',

  // === WORKFLOW ===
  ApprovalRequest: 'workflow',
  ApprovalRule: 'workflow',
  ApprovalStep: 'workflow',
  ApprovalComment: 'workflow',
  ApprovalAttachment: 'workflow',
  ComplianceRule: 'workflow',
  ComplianceCheck: 'workflow',
  ComplianceAlert: 'workflow',
  ComplianceReport: 'workflow',
  LicenseTracking: 'workflow',
  InsuranceCertificate: 'workflow',
  BondTracking: 'workflow',
  AutomationEvent: 'workflow',
  AutomationTask: 'workflow',
  AutonomousActionLog: 'workflow',
  DecisionLog: 'workflow',
  DecisionQueue: 'workflow',
  AuditLog: 'workflow',
  AuditReport: 'workflow',

  // === INTEGRATIONS ===
  IntegrationCredential: 'integrations',
  APIIntegration: 'integrations',
  APICall: 'integrations',
  WebhookEvent: 'integrations',
  Webhook: 'integrations',
  WebhookDelivery: 'integrations',
  WebhookLog: 'integrations',
  WebhookRetry: 'integrations',
  GhlSyncStatus: 'integrations',
  GhlWebhookLog: 'integrations',

  // === ANALYTICS ===
  AnalyticsSnapshot: 'analytics',
  AnalyticsAlert: 'analytics',
  KPI: 'analytics',
  FraudScore: 'analytics',
  ChurnPrediction: 'analytics',
  CustomReport: 'analytics',
  Prediction: 'analytics',
  AIConversation: 'analytics',
  AIEstimationSession: 'analytics',
  ApprenticeshipProgram: 'analytics',
  GovernmentContract: 'analytics',
  OFACCache: 'analytics',
  OFACScreening: 'analytics',
  SoftwareSubscription: 'analytics',
  MarketingCampaign: 'analytics',
  MarketingLead: 'analytics',
  FunnelSession: 'analytics',
  ActivityLog: 'analytics',
  Client: 'analytics',
}

// Enum classification — map each enum to its domain
const ENUM_DOMAIN: Record<string, string> = {
  // identity
  // (no standalone identity enums — roles/permissions are models)

  // foundation
  ConversationType: 'foundation',
  ParticipantRole: 'foundation',
  ChatMessageType: 'foundation',
  PlatformKnowledgeCategory: 'foundation',
  KnowledgeStatus: 'foundation',
  KnowledgePriority: 'foundation',
  WidgetType: 'foundation',
  JobStatus: 'foundation',
  SecurityEventType: 'foundation',
  SecuritySeverity: 'foundation',
  SensitivityLevel: 'foundation',

  // ddts
  TwinTier: 'ddts',
  TwinStatus: 'ddts',
  TwinHealthStatus: 'ddts',

  // land
  ParcelStatus: 'land',
  AssessmentType: 'land',
  AssessmentStatus: 'land',
  ZoningDistrictType: 'land',
  HousingType: 'land',

  // feasibility
  FeasibilityStatus: 'feasibility',
  NEPAExemptionType: 'feasibility',

  // development
  CapitalSourceType: 'development',
  DrawStatus: 'development',
  EntitlementType: 'development',
  EntitlementStatus: 'development',
  DevelopmentLeadStatus: 'development',
  DevelopmentLeadSource: 'development',
  DevelopmentLeadPriority: 'development',
  DevelopmentProjectStage: 'development',
  DevelopmentAssetType: 'development',
  DevelopmentPackageStatus: 'development',
  PatternBookStatus: 'development',

  // pm
  ProjectPhaseType: 'pm',
  ProjectPhaseStatus: 'pm',
  PermitType: 'pm',
  PermitStatus: 'pm',
  ApplicantType: 'pm',
  ReviewDiscipline: 'pm',
  InspectionType: 'pm',
  InspectionResult: 'pm',
  AIReviewSource: 'pm',
  DocumentType: 'pm',
  RoutingStatus: 'pm',
  EscalationReason: 'pm',
  JurisdictionStatus: 'pm',
  SubscriptionTier: 'pm',
  StaffRole: 'pm',
  OnboardingStepStatus: 'pm',
  TemplateCategory: 'pm',
  TemplateStatus: 'pm',
  TaskStatus: 'pm',
  RFIStatus: 'pm',
  RFIPriority: 'pm',
  SubmittalStatus: 'pm',
  SubmittalType: 'pm',
  BallInCourt: 'pm',
  ConflictStatus: 'pm',
  ChecklistStatus: 'pm',
  MeetingType: 'pm',
  MeetingStatus: 'pm',
  SelectionStatus: 'pm',
  WarrantyStatus: 'pm',
  ClaimStatus: 'pm',
  TimeEntryType: 'pm',
  IncidentSeverity: 'pm',
  IncidentStatus: 'pm',
  DrawingDiscipline: 'pm',
  DrawingStatus: 'pm',
  FileCategory: 'pm',
  UploadedByRole: 'pm',
  AutoDesignStatus: 'pm',
  AutoDesignStyle: 'pm',
  RoomType: 'pm',
  DesignQueueStatus: 'pm',
  ArchitectAvailability: 'pm',
  HandoffStatus: 'pm',
  DesignProjectStatus: 'pm',
  DesignProjectType: 'pm',
  DesignPhaseType: 'pm',
  DesignPhaseStatus: 'pm',
  SheetStatus: 'pm',
  BIMModelFormat: 'pm',
  UnitConstructionStatus: 'pm',
  DrawRequestStatus: 'pm',
  AreaPhaseStatus: 'pm',
  BidSource: 'pm',
  BidStatus: 'pm',
  BidPipelineStatus: 'pm',
  BidPriority: 'pm',
  BidChecklistStatus: 'pm',
  BidDocumentType: 'pm',
  BidSubRequestStatus: 'pm',
  SOPStatus: 'pm',
  SOPStepStatus: 'pm',
  SOPExecutionStatus: 'pm',
  PurchaseOrderStatus: 'pm',
  BillStatus: 'pm',
  RFQStatus: 'pm',
  DeliveryStatus: 'pm',
  CloseoutItemStatus: 'pm',
  CloseoutItemType: 'pm',
  TakeoffJobStatus: 'pm',
  ScanType: 'pm',
  VerificationStatus: 'pm',
  EstimateStatus: 'pm',
  EstimateType: 'pm',
  EstimateAction: 'pm',
  TakeoffType: 'pm',
  TakeoffStatus: 'pm',
  MeasurementType: 'pm',
  EstimationOrderStatus: 'pm',
  OrderPriority: 'pm',
  QualityLevel: 'pm',
  AISessionType: 'pm',
  AIEstSessionStatus: 'pm',
  CostDataReviewAction: 'pm',
  CostDataReviewStatus: 'pm',
  PreConPhase: 'pm',
  EstimationServiceType: 'pm',
  TakeoffSource: 'pm',
  ImportJobStatus: 'pm',
  CostDatabaseType: 'pm',
  CostDatabaseTier: 'pm',
  CostDataVisibility: 'pm',
  AssemblyCategory: 'pm',
  AssemblyComplexity: 'pm',
  AssemblyItemType: 'pm',
  LaborTrade: 'pm',
  MaterialCategory: 'pm',
  EquipmentCategory: 'pm',
  LineItemType: 'pm',
  DesignPackageTier: 'pm',
  ProductCategory: 'pm',

  // payments
  ContractStatus: 'payments',
  MilestoneStatus: 'payments',
  EscrowStatus: 'payments',
  EscrowTransactionType: 'payments',
  EscrowTransactionStatus: 'payments',
  EscrowHoldReason: 'payments',
  EscrowHoldStatus: 'payments',
  DisputeStatus: 'payments',
  DisputeType: 'payments',
  DisputeEvidenceType: 'payments',
  DisputeResolutionType: 'payments',
  DisputeAppealStatus: 'payments',
  LienWaiverType: 'payments',
  LienWaiverScope: 'payments',
  LienWaiverStatus: 'payments',
  LienWaiverSignerRole: 'payments',
  AccountType: 'payments',
  AccountSubType: 'payments',
  JournalEntryStatus: 'payments',
  ConnectedAccountType: 'payments',
  ConnectedAccountStatus: 'payments',
  PayoutStatus: 'payments',
  PayoutMethod: 'payments',
  StatementType: 'payments',
  StatementStatus: 'payments',
  RecipientRole: 'payments',
  DeliveryMethod: 'payments',
  PlatformFeeType: 'payments',
  PlatformFeeStatus: 'payments',
  FinancingStatus: 'payments',
  ApproverType: 'payments',
  ApprovalStatus: 'payments',

  // operations
  TurnoverItemStatus: 'operations',
  WorkOrderPriority: 'operations',
  WorkOrderStatus: 'operations',

  // marketplace
  LeadStatus: 'marketplace',
  GCOpsLeadStatus: 'marketplace',
  PermitServiceLeadStatus: 'marketplace',
  PMPackageTier: 'marketplace',
  PermitPackageTier: 'marketplace',
  SubscriptionStatus: 'marketplace',
  FunnelUserType: 'marketplace',
  FunnelProjectType: 'marketplace',
  BudgetRange: 'marketplace',
  FunnelTimeline: 'marketplace',
  FunnelSessionStatus: 'marketplace',

  // documents
  // (DocumentType is used by permits, stays in pm)

  // workflow
  ApprovalPriority: 'workflow',
  ApprovalRequestStatus: 'workflow',
  ApprovalRequestType: 'workflow',
  ApprovalStepStatus: 'workflow',
  RuleType: 'workflow',
  ComplianceSeverity: 'workflow',
  CheckStatus: 'workflow',
  LicenseStatus: 'workflow',
  InsuranceStatus: 'workflow',
  RemediationStatus: 'workflow',
  ComplianceReportType: 'workflow',
  ComplianceReportStatus: 'workflow',
  AuditEntityType: 'workflow',
  AuditAction: 'workflow',
  AuditCategory: 'workflow',
  AuditSeverity: 'workflow',
  AuditFindingType: 'workflow',
  AutonomousDecision: 'workflow',

  // integrations
  IntegrationService: 'integrations',
  IntegrationStatus: 'integrations',
  WebhookDeliveryStatus: 'integrations',
  AccessAction: 'integrations',

  // analytics
  SnapshotType: 'analytics',
  KPIType: 'analytics',
  TrendDirection: 'analytics',
  CalculationFrequency: 'analytics',
  RiskLevel: 'analytics',
  AlertSeverity: 'analytics',
  SoftwareTier: 'analytics',
  SoftwareSubscriptionStatus: 'analytics',
  ComparisonType: 'analytics',
  BudgetCategory: 'analytics',
}

interface Block {
  type: 'model' | 'enum'
  name: string
  content: string
  lineStart: number
  lineEnd: number
  domain: string
}

function parseSchema(): Block[] {
  const raw = fs.readFileSync(SCHEMA_PATH, 'utf-8')
  const lines = raw.split('\n')
  const blocks: Block[] = []

  let i = 0
  while (i < lines.length) {
    const line = lines[i]
    const modelMatch = line.match(/^(model|enum)\s+(\w+)\s*\{/)
    if (modelMatch) {
      const [, type, name] = modelMatch
      const startLine = i
      let braceCount = 1
      let j = i + 1
      while (j < lines.length && braceCount > 0) {
        for (const ch of lines[j]) {
          if (ch === '{') braceCount++
          if (ch === '}') braceCount--
        }
        j++
      }
      // Capture preceding comments (up to 5 lines back)
      let commentStart = startLine
      for (let k = startLine - 1; k >= Math.max(0, startLine - 5); k--) {
        const commentLine = lines[k].trim()
        if (commentLine.startsWith('//') && !commentLine.startsWith('// ===')) {
          commentStart = k
        } else {
          break
        }
      }

      const domain = type === 'model'
        ? (MODEL_DOMAIN[name] || 'foundation')
        : (ENUM_DOMAIN[name] || 'foundation')

      const contentLines = lines.slice(commentStart, j)
      blocks.push({
        type: type as 'model' | 'enum',
        name,
        content: contentLines.join('\n'),
        lineStart: commentStart + 1,
        lineEnd: j,
        domain,
      })
      i = j
    } else {
      i++
    }
  }

  return blocks
}

function writeDomainFiles(blocks: Block[]) {
  // Group by domain
  const domains: Record<string, { enums: Block[]; models: Block[] }> = {}
  for (const block of blocks) {
    if (!domains[block.domain]) {
      domains[block.domain] = { enums: [], models: [] }
    }
    if (block.type === 'enum') {
      domains[block.domain].enums.push(block)
    } else {
      domains[block.domain].models.push(block)
    }
  }

  // Write each domain
  for (const [domain, { enums, models }] of Object.entries(domains)) {
    const domainDir = path.join(SCHEMA_SRC, domain)
    if (!fs.existsSync(domainDir)) {
      fs.mkdirSync(domainDir, { recursive: true })
    }

    // Write enums file if any
    if (enums.length > 0) {
      const enumContent = `// ${domain.toUpperCase()} — Enums\n// Auto-generated from schema splitter\n\n` +
        enums.map(e => e.content).join('\n\n')
      fs.writeFileSync(path.join(domainDir, 'enums.prisma'), enumContent + '\n')
    }

    // Write models file — group related models together
    if (models.length > 0) {
      const modelContent = `// ${domain.toUpperCase()} — Models\n// Auto-generated from schema splitter\n\n` +
        models.map(m => m.content).join('\n\n')
      fs.writeFileSync(path.join(domainDir, 'models.prisma'), modelContent + '\n')
    }

    console.log(`  ${domain}: ${enums.length} enums, ${models.length} models`)
  }

  return domains
}

function main() {
  console.log('Parsing schema...')
  const blocks = parseSchema()

  const modelCount = blocks.filter(b => b.type === 'model').length
  const enumCount = blocks.filter(b => b.type === 'enum').length
  console.log(`Found ${modelCount} models, ${enumCount} enums\n`)

  // Check for unclassified
  const unclassifiedModels = blocks.filter(b => b.type === 'model' && !MODEL_DOMAIN[b.name])
  const unclassifiedEnums = blocks.filter(b => b.type === 'enum' && !ENUM_DOMAIN[b.name])
  if (unclassifiedModels.length > 0) {
    console.log('UNCLASSIFIED MODELS (defaulting to foundation):')
    unclassifiedModels.forEach(m => console.log(`  - ${m.name} (line ${m.lineStart})`))
    console.log()
  }
  if (unclassifiedEnums.length > 0) {
    console.log('UNCLASSIFIED ENUMS (defaulting to foundation):')
    unclassifiedEnums.forEach(e => console.log(`  - ${e.name} (line ${e.lineStart})`))
    console.log()
  }

  console.log('Writing domain files...')
  writeDomainFiles(blocks)

  console.log(`\nDone! Schema split into ${new Set(blocks.map(b => b.domain)).size} domains.`)
  console.log(`Total: ${modelCount} models + ${enumCount} enums = ${blocks.length} blocks`)
}

main()
