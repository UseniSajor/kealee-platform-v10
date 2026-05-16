/**
 * OBSIDIAN: Contextual Knowledge Base Layer
 * Persistent memory for construction projects, pricing rules, approval workflows,
 * and permit blueprints. Acts as the source of truth for agent decision-making.
 *
 * Features:
 * - Concept store (AI Concept outputs + design history)
 * - Pricing rules (imported from packages/core-rules/src/pricing.ts)
 * - Approval workflows (gates between chain stages)
 * - Permit blueprints (DC DCRA + Maryland county templates)
 * - Audit trail (all agent decisions logged)
 */

// ============================================================================
// KNOWLEDGE BASE MODELS
// ============================================================================

export interface ConceptRecord {
  id: string;
  projectId: string;
  userId: string;
  concept: string;
  assumptions: string[];
  imagePrompts: string[];
  images: ImageRecord[];
  timeline: string;
  risks: string[];
  status: "DRAFT" | "APPROVED" | "ACTIVE" | "ARCHIVED";
  approvals: ApprovalRecord[];
  createdAt: Date;
  updatedAt: Date;
  expiresAt: Date; // 90-day retention
}

export interface ImageRecord {
  id: string;
  conceptId: string;
  prompt: string;
  url?: string;
  generatedAt?: Date;
  status: "PENDING" | "GENERATED" | "APPROVED";
}

export interface ApprovalRecord {
  id: string;
  recordId: string; // concept/estimate/permit ID
  recordType: "CONCEPT" | "ESTIMATE" | "PERMIT";
  requiredRole: "CLIENT" | "PE" | "FINANCE" | "COMPLIANCE";
  status: "PENDING" | "APPROVED" | "REJECTED";
  approvedBy?: string;
  approvedAt?: Date;
  rejectionReason?: string;
}

export interface PricingRulesRecord {
  id: string;
  year: number;
  region: string; // "DMV" | "BALTIMORE" | "METRO"
  baselineMultiplier: number; // 1.28 for +28%
  materialAdjustments: {
    lumber: number;
    steel: number;
    concrete: number;
    electrical: number;
  };
  hourlyRates: {
    [trade: string]: {
      base: number;
      regional: number;
      overhead: number;
    };
  };
  equipmentDailyRates: {
    [equipment: string]: {
      min: number;
      max: number;
    };
  };
  contingencyRate: number;
  builderRiskRate: number;
  updatedAt: Date;
}

export interface PermitBlueprintRecord {
  id: string;
  jurisdiction: string; // "DC_DCRA" | "MARYLAND_MONTGOMERY" | etc.
  type: "REST_API" | "PLAYWRIGHT_AUTOMATION";
  endpoint?: string;
  auth?: string;
  requirements: string[];
  formFields?: {
    name: string;
    selector?: string;
    type: string;
    required: boolean;
  }[];
  approvalGates: {
    stage: string;
    requiredApprovals: string[];
    autoApprove: boolean;
  }[];
  createdAt: Date;
  updatedAt: Date;
}

export interface ApprovalWorkflowRecord {
  id: string;
  stage: "CONCEPT" | "ESTIMATE" | "PERMIT";
  requiredApprovals: ApprovalGate[];
  autoApprove: boolean;
  escalationPath?: string[]; // [PROJECT_OWNER, PE, DIRECTOR]
  timeoutHours: number;
}

export interface ApprovalGate {
  role: string;
  priority: number;
  canDelegate: boolean;
  escalateTo?: string[];
}

export interface AuditEntry {
  id: string;
  timestamp: Date;
  contextId: string;
  agent: string;
  action: string;
  details: Record<string, any>;
  cacheMetrics?: {
    cacheHit: boolean;
    inputTokens: number;
    costSavingsPercent: number;
  };
}

// ============================================================================
// OBSIDIAN KNOWLEDGE BASE
// ============================================================================

export class ObsidianKnowledgeBase {
  private concepts: Map<string, ConceptRecord> = new Map();
  private pricingRulesCache: Map<string, PricingRulesRecord> = new Map();
  private permitBlueprints: Map<string, PermitBlueprintRecord> = new Map();
  private approvalWorkflows: Map<string, ApprovalWorkflowRecord> = new Map();
  private auditLog: AuditEntry[] = [];

  // ========================================================================
  // CONCEPT OPERATIONS
  // ========================================================================

  /**
   * Store AI Concept output (from DesignBot)
   */
  async storeConceptRecord(
    projectId: string,
    userId: string,
    conceptData: {
      concept: string;
      assumptions: string[];
      imagePrompts: string[];
      timeline: string;
      risks: string[];
    }
  ): Promise<ConceptRecord> {
    const id = `concept-${projectId}-${Date.now()}`;

    const record: ConceptRecord = {
      id,
      projectId,
      userId,
      concept: conceptData.concept,
      assumptions: conceptData.assumptions,
      imagePrompts: conceptData.imagePrompts,
      images: conceptData.imagePrompts.map((prompt, idx) => ({
        id: `img-${id}-${idx}`,
        conceptId: id,
        prompt,
        status: "PENDING",
      })),
      timeline: conceptData.timeline,
      risks: conceptData.risks,
      status: "DRAFT",
      approvals: [], // Will be populated after workflow check
      createdAt: new Date(),
      updatedAt: new Date(),
      expiresAt: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000), // 90-day TTL
    };

    this.concepts.set(id, record);

    // Log to audit trail
    this.logAudit(projectId, "DesignBot", "STORE_CONCEPT", {
      conceptId: id,
      assumptions: conceptData.assumptions.length,
      imagePrompts: conceptData.imagePrompts.length,
    });

    console.log(`[Obsidian] Stored concept ${id}`);
    return record;
  }

  /**
   * Retrieve concept by ID
   */
  async getConceptRecord(conceptId: string): Promise<ConceptRecord | null> {
    return this.concepts.get(conceptId) || null;
  }

  /**
   * List all concepts for a project
   */
  async listConceptsForProject(
    projectId: string
  ): Promise<ConceptRecord[]> {
    return Array.from(this.concepts.values()).filter(
      (c) => c.projectId === projectId
    );
  }

  /**
   * Approve concept (move from DRAFT to APPROVED)
   */
  async approveConceptRecord(
    conceptId: string,
    approvedBy: string
  ): Promise<ConceptRecord> {
    const concept = this.concepts.get(conceptId);
    if (!concept) throw new Error(`Concept ${conceptId} not found`);

    concept.status = "APPROVED";
    concept.approvals.push({
      id: `approval-${conceptId}`,
      recordId: conceptId,
      recordType: "CONCEPT",
      requiredRole: "CLIENT",
      status: "APPROVED",
      approvedBy,
      approvedAt: new Date(),
    });
    concept.updatedAt = new Date();

    this.concepts.set(conceptId, concept);

    this.logAudit(concept.projectId, "CLIENT", "APPROVE_CONCEPT", {
      conceptId,
      approvedBy,
    });

    console.log(`[Obsidian] Concept ${conceptId} approved by ${approvedBy}`);
    return concept;
  }

  /**
   * Update image status (PENDING → GENERATED → APPROVED)
   */
  async updateImageStatus(
    imageId: string,
    status: "PENDING" | "GENERATED" | "APPROVED",
    url?: string
  ): Promise<void> {
    for (const concept of this.concepts.values()) {
      const image = concept.images.find((img) => img.id === imageId);
      if (image) {
        image.status = status;
        if (url) {
          image.url = url;
          image.generatedAt = new Date();
        }
        concept.updatedAt = new Date();
        this.logAudit(concept.projectId, "SYSTEM", "UPDATE_IMAGE_STATUS", {
          imageId,
          status,
        });
        return;
      }
    }
    throw new Error(`Image ${imageId} not found`);
  }

  // ========================================================================
  // PRICING OPERATIONS
  // ========================================================================

  /**
   * Get current pricing rules for a region and year
   * Always fetches from packages/core-rules/src/pricing.ts (never hardcoded)
   */
  async getPricingRules(
    region: string = "DMV",
    year: number = 2026
  ): Promise<PricingRulesRecord> {
    const key = `${year}-${region}`;
    const cached = this.pricingRulesCache.get(key);

    if (cached && this.isRulesValid(cached)) {
      return cached;
    }

    // Import from packages/core-rules/src/pricing.ts
    const rules = this.loadPricingRulesFromCore(region, year);
    this.pricingRulesCache.set(key, rules);

    return rules;
  }

  /**
   * Validate pricing rules haven't expired (check for DMV inflation updates)
   */
  private isRulesValid(rules: PricingRulesRecord): boolean {
    const hoursOld =
      (Date.now() - rules.updatedAt.getTime()) / (1000 * 60 * 60);
    return hoursOld < 24; // Refresh if older than 24 hours
  }

  /**
   * Load pricing rules from core package (2026 DMV baseline)
   * This is where REAL pricing lives - never hardcode elsewhere
   */
  private loadPricingRulesFromCore(
    region: string,
    year: number
  ): PricingRulesRecord {
    // In production, this would import from:
    // import { pricingRules } from 'packages/core-rules/src/pricing.ts'

    const dmvRules: PricingRulesRecord = {
      id: `pricing-${year}-${region}`,
      year,
      region,
      baselineMultiplier: 1.28, // +28% DMV adjustment
      materialAdjustments: {
        lumber: 1.38,
        steel: 1.15,
        concrete: 1.08,
        electrical: 1.18,
      },
      hourlyRates: {
        HVAC: { base: 95, regional: 121.6, overhead: 1.35 },
        PLUMBING: { base: 110, regional: 140.8, overhead: 1.4 },
        ELECTRICAL: { base: 125, regional: 160, overhead: 1.45 },
        CARPENTRY: { base: 85, regional: 108.8, overhead: 1.3 },
        GENERAL_LABOR: { base: 65, regional: 83.2, overhead: 1.25 },
      },
      equipmentDailyRates: {
        CRANE: { min: 1200, max: 1800 },
        LIFT: { min: 400, max: 600 },
        COMPRESSOR: { min: 150, max: 250 },
      },
      contingencyRate: 0.15, // 15%
      builderRiskRate: 0.012, // 1.2% of hard costs
      updatedAt: new Date(),
    };

    console.log(`[Obsidian] Loaded pricing rules for ${region} ${year}`);
    return dmvRules;
  }

  // ========================================================================
  // PERMIT BLUEPRINT OPERATIONS
  // ========================================================================

  /**
   * Get permit blueprint for jurisdiction (DC or Maryland)
   */
  async getPermitBlueprint(
    jurisdiction: string
  ): Promise<PermitBlueprintRecord> {
    const cached = this.permitBlueprints.get(jurisdiction);
    if (cached) return cached;

    const blueprint = this.loadPermitBlueprintFromLibrary(jurisdiction);
    this.permitBlueprints.set(jurisdiction, blueprint);

    return blueprint;
  }

  /**
   * Load permit blueprint (DC DCRA or Maryland county)
   */
  private loadPermitBlueprintFromLibrary(
    jurisdiction: string
  ): PermitBlueprintRecord {
    const blueprints: Record<string, PermitBlueprintRecord> = {
      DC_DCRA: {
        id: "blueprint-dc-dcra",
        jurisdiction: "DC_DCRA",
        type: "REST_API",
        endpoint: "https://api.dcapps.dc.gov/permits/v2",
        auth: "OAuth2",
        requirements: [
          "Stamped site plans",
          "PE stamp and signature",
          "Bill of materials (BOM)",
          "Zoning letter from OZ",
          "Environmental assessment",
        ],
        approvalGates: [
          {
            stage: "DCRA_INTAKE",
            requiredApprovals: ["PE", "COMPLIANCE"],
            autoApprove: false,
          },
          {
            stage: "DCRA_REVIEW",
            requiredApprovals: ["DCRA_EXAMINER"],
            autoApprove: false,
          },
          {
            stage: "DCRA_APPROVAL",
            requiredApprovals: [],
            autoApprove: true,
          },
        ],
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      MARYLAND_MONTGOMERY: {
        id: "blueprint-md-montgomery",
        jurisdiction: "MARYLAND_MONTGOMERY",
        type: "PLAYWRIGHT_AUTOMATION",
        endpoint: "https://permits.montgomerycountymd.gov/permits",
        auth: "Form-based",
        requirements: [
          "Permit-ready plans",
          "Regional variance forms (if applicable)",
          "Soil report (if required)",
          "Homeowner authorization",
        ],
        formFields: [
          {
            name: "permit_type",
            selector: "#permitType",
            type: "select",
            required: true,
          },
          {
            name: "project_address",
            selector: "#address",
            type: "text",
            required: true,
          },
          {
            name: "scope_of_work",
            selector: "#scopeOfWork",
            type: "textarea",
            required: true,
          },
          {
            name: "estimated_cost",
            selector: "#cost",
            type: "number",
            required: true,
          },
        ],
        approvalGates: [
          {
            stage: "FORM_SUBMISSION",
            requiredApprovals: ["HOMEOWNER"],
            autoApprove: false,
          },
          {
            stage: "COUNTY_REVIEW",
            requiredApprovals: ["COUNTY_EXAMINER"],
            autoApprove: false,
          },
        ],
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    };

    return (
      blueprints[jurisdiction] || {
        id: `blueprint-${jurisdiction}`,
        jurisdiction,
        type: "REST_API",
        requirements: [],
        approvalGates: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      }
    );
  }

  // ========================================================================
  // APPROVAL WORKFLOW OPERATIONS
  // ========================================================================

  /**
   * Get approval workflow for a chain stage
   */
  async getApprovalWorkflow(
    stage: "CONCEPT" | "ESTIMATE" | "PERMIT"
  ): Promise<ApprovalWorkflowRecord> {
    const key = `workflow-${stage}`;
    const cached = this.approvalWorkflows.get(key);
    if (cached) return cached;

    const workflow = this.createApprovalWorkflow(stage);
    this.approvalWorkflows.set(key, workflow);

    return workflow;
  }

  /**
   * Create approval workflow with standard gates
   */
  private createApprovalWorkflow(
    stage: "CONCEPT" | "ESTIMATE" | "PERMIT"
  ): ApprovalWorkflowRecord {
    const workflows: Record<string, ApprovalWorkflowRecord> = {
      CONCEPT: {
        id: "workflow-concept",
        stage: "CONCEPT",
        requiredApprovals: [
          {
            role: "CLIENT",
            priority: 1,
            canDelegate: true,
            escalateTo: ["PROJECT_OWNER"],
          },
        ],
        autoApprove: false,
        timeoutHours: 48,
      },
      ESTIMATE: {
        id: "workflow-estimate",
        stage: "ESTIMATE",
        requiredApprovals: [
          {
            role: "CLIENT",
            priority: 1,
            canDelegate: true,
            escalateTo: ["PROJECT_OWNER"],
          },
          {
            role: "FINANCE",
            priority: 2,
            canDelegate: false,
            escalateTo: ["CFO"],
          },
        ],
        autoApprove: false,
        timeoutHours: 72,
      },
      PERMIT: {
        id: "workflow-permit",
        stage: "PERMIT",
        requiredApprovals: [
          {
            role: "PE",
            priority: 1,
            canDelegate: false,
            escalateTo: ["PRINCIPAL_PE"],
          },
          {
            role: "COMPLIANCE",
            priority: 2,
            canDelegate: true,
            escalateTo: ["COMPLIANCE_DIRECTOR"],
          },
        ],
        autoApprove: true, // Auto-proceed after approvals
        timeoutHours: 24,
      },
    };

    return workflows[stage] || workflows.CONCEPT;
  }

  // ========================================================================
  // AUDIT LOG
  // ========================================================================

  /**
   * Log all agent actions for compliance and debugging
   */
  private logAudit(
    contextId: string,
    agent: string,
    action: string,
    details: Record<string, any>
  ): void {
    const entry: AuditEntry = {
      id: `audit-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date(),
      contextId,
      agent,
      action,
      details,
    };

    this.auditLog.push(entry);
    console.log(
      `[Obsidian Audit] ${agent} ${action} on ${contextId}:`,
      details
    );
  }

  /**
   * Retrieve audit log for a project
   */
  async getAuditLog(
    contextId: string,
    limit: number = 100
  ): Promise<AuditEntry[]> {
    return this.auditLog
      .filter((e) => e.contextId === contextId)
      .slice(-limit);
  }

  // ========================================================================
  // HELPER: CHECK APPROVAL STATUS
  // ========================================================================

  /**
   * Check if record is ready to proceed (all approvals granted or auto-approved)
   */
  async canProceedToNextStage(
    recordId: string,
    recordType: "CONCEPT" | "ESTIMATE" | "PERMIT"
  ): Promise<boolean> {
    // Find the record in appropriate storage
    let approvals: ApprovalRecord[] = [];

    if (recordType === "CONCEPT") {
      const concept = Array.from(this.concepts.values()).find(
        (c) => c.id === recordId
      );
      approvals = concept?.approvals || [];
    }

    // For ESTIMATE and PERMIT, would check other stores

    // Require at least one approval and all must be APPROVED
    // (vacuous truth: empty array would pass every() — not acceptable)
    const allApproved = approvals.length > 0 && approvals.every((a) => a.status === "APPROVED");
    return allApproved;
  }
}

// ============================================================================
// SINGLETON INSTANCE
// ============================================================================

let obsidianInstance: ObsidianKnowledgeBase | null = null;

export function getObsidianKnowledgeBase(): ObsidianKnowledgeBase {
  if (!obsidianInstance) {
    obsidianInstance = new ObsidianKnowledgeBase();
  }
  return obsidianInstance;
}
