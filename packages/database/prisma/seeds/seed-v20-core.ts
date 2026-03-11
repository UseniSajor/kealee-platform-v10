// ============================================================
// Kealee Platform v20 - Core Seed Data
// Comprehensive seed for roles, lifecycle phases, permit types,
// project types, cost library, payment milestones, twin KPI
// defaults, and module registrations.
//
// Idempotent: safe to run multiple times via upsert / SystemConfig.
// ============================================================

import { PrismaClient } from "@prisma/client";

// ────────────────────────────────────────────────────────────
// 1. ROLES
// ────────────────────────────────────────────────────────────

const V20_ROLES = [
  {
    key: "homeowner",
    name: "Homeowner",
    description:
      "Property owner initiating residential projects. Can create projects, approve milestones, release payments, and manage contracts.",
    permissions: [
      "project.create",
      "project.read",
      "project.update",
      "milestone.approve",
      "milestone.release_payment",
      "contract.create",
      "contract.sign",
      "contract.view",
      "billing.view",
      "billing.manage",
      "payments.read",
    ],
  },
  {
    key: "contractor",
    name: "Contractor",
    description:
      "Licensed general or specialty contractor. Can bid on projects, manage milestones, sign contracts, and submit progress updates.",
    permissions: [
      "project.read",
      "milestone.create",
      "contract.view",
      "contract.sign",
      "bids.create",
      "bids.read",
      "bids.update",
      "tasks.read",
      "tasks.update",
      "payments.read",
    ],
  },
  {
    key: "developer",
    name: "Developer",
    description:
      "Real-estate developer managing multiple projects or multi-unit developments. Full project and financial visibility.",
    permissions: [
      "project.create",
      "project.read",
      "project.update",
      "milestone.approve",
      "milestone.release_payment",
      "contract.create",
      "contract.sign",
      "contract.view",
      "billing.view",
      "billing.manage",
      "payments.create",
      "payments.read",
      "pm.view_queue",
      "pm.generate_report",
    ],
  },
  {
    key: "architect",
    name: "Architect",
    description:
      "Licensed architect providing design services. Can create and manage design projects, upload drawings, and review submittals.",
    permissions: [
      "project.read",
      "designs.create",
      "designs.read",
      "designs.update",
      "designs.delete",
      "designs.*",
      "contract.view",
      "contract.sign",
    ],
  },
  {
    key: "engineer",
    name: "Engineer",
    description:
      "Licensed structural, civil, or MEP engineer providing engineering services and stamped calculations.",
    permissions: [
      "project.read",
      "designs.read",
      "designs.update",
      "contract.view",
      "contract.sign",
      "tasks.read",
      "tasks.update",
    ],
  },
  {
    key: "kealee_pm",
    name: "Kealee Project Manager",
    description:
      "Internal Kealee PM overseeing client projects. Full project management, task assignment, reporting, and permit coordination.",
    permissions: [
      "project.read",
      "project.update",
      "milestone.create",
      "milestone.approve",
      "pm.assign_task",
      "pm.view_queue",
      "pm.generate_report",
      "contract.view",
      "permit.submit",
      "permit.review",
      "tasks.*",
      "payments.read",
    ],
  },
  {
    key: "admin",
    name: "Administrator",
    description:
      "Full platform access and administration. Can manage all entities, users, billing, and system configuration.",
    permissions: ["admin.*"],
  },
] as const;

// ────────────────────────────────────────────────────────────
// 2. LIFECYCLE PHASES
// ────────────────────────────────────────────────────────────

export const LIFECYCLE_PHASES = [
  {
    key: "IDEA",
    name: "Idea",
    description:
      "Initial project conception. The owner explores what they want to build, sets high-level goals, and begins to define scope.",
    order: 1,
    requiredModules: ["marketplace"],
  },
  {
    key: "LAND",
    name: "Land Acquisition & Analysis",
    description:
      "Site identification, parcel analysis, zoning verification, environmental due diligence, and land purchase or lease.",
    order: 2,
    requiredModules: ["os-land"],
  },
  {
    key: "FEASIBILITY",
    name: "Feasibility Study",
    description:
      "Financial pro-forma, market analysis, code feasibility, site constraints evaluation, and go/no-go decision.",
    order: 3,
    requiredModules: ["os-feas"],
  },
  {
    key: "DESIGN",
    name: "Design & Architecture",
    description:
      "Schematic design, design development, construction documents, engineering, and design review cycles.",
    order: 4,
    requiredModules: ["os-dev"],
  },
  {
    key: "PERMITS",
    name: "Permitting & Entitlements",
    description:
      "Permit applications, plan review, zoning approvals, HOA approvals, and jurisdiction coordination.",
    order: 5,
    requiredModules: ["os-dev", "os-pm"],
  },
  {
    key: "PRECONSTRUCTION",
    name: "Pre-Construction",
    description:
      "Bidding, contractor selection, contract execution, escrow funding, scheduling, and notice to proceed.",
    order: 6,
    requiredModules: ["os-pm", "marketplace"],
  },
  {
    key: "CONSTRUCTION",
    name: "Construction",
    description:
      "Active construction phase with milestone tracking, daily logs, progress photos, RFIs, submittals, and change orders.",
    order: 7,
    requiredModules: ["os-pm"],
  },
  {
    key: "INSPECTIONS",
    name: "Inspections & QA",
    description:
      "Code inspections, quality assurance walkthroughs, punch list generation, and correction tracking.",
    order: 8,
    requiredModules: ["os-pm"],
  },
  {
    key: "PAYMENTS",
    name: "Payments & Finance",
    description:
      "Milestone payment processing, escrow releases, draw requests, retainage management, and lien waiver collection.",
    order: 9,
    requiredModules: ["os-pay"],
  },
  {
    key: "CLOSEOUT",
    name: "Closeout",
    description:
      "Final inspections, certificate of occupancy, warranty handover, as-built documentation, and retainage release.",
    order: 10,
    requiredModules: ["os-pm", "os-pay"],
  },
  {
    key: "OPERATIONS",
    name: "Operations & Maintenance",
    description:
      "Post-construction warranty tracking, maintenance scheduling, facility management, and ongoing service requests.",
    order: 11,
    requiredModules: ["os-ops"],
  },
  {
    key: "ARCHIVE",
    name: "Archive",
    description:
      "Project complete. All data archived for reference, warranty claims, and historical analytics. Twin set to read-only.",
    order: 12,
    requiredModules: [],
  },
] as const;

// ────────────────────────────────────────────────────────────
// 3. PERMIT TYPES
// ────────────────────────────────────────────────────────────

export const PERMIT_TYPES = [
  {
    key: "BUILDING",
    name: "Building Permit",
    description:
      "General building permit for new construction, additions, alterations, or structural modifications. Required for most construction work.",
    typicalDays: 21,
    requiredDocuments: [
      "Site Plan",
      "Floor Plans",
      "Elevations",
      "Structural Calculations",
      "Energy Compliance (Title 24 / IECC)",
      "Proof of Ownership or Authorization",
    ],
  },
  {
    key: "ELECTRICAL",
    name: "Electrical Permit",
    description:
      "Permit for electrical installations, upgrades, panel changes, or new circuits. Required when modifying electrical systems.",
    typicalDays: 10,
    requiredDocuments: [
      "Electrical Plans",
      "Load Calculations",
      "Panel Schedule",
      "Single-Line Diagram",
    ],
  },
  {
    key: "PLUMBING",
    name: "Plumbing Permit",
    description:
      "Permit for plumbing installations, re-piping, water heater replacement, or fixture additions. Required for supply and DWV work.",
    typicalDays: 10,
    requiredDocuments: [
      "Plumbing Plans",
      "Fixture Count / Fixture Unit Calculations",
      "Water Supply Sizing",
      "Isometric Diagram",
    ],
  },
  {
    key: "MECHANICAL",
    name: "Mechanical Permit",
    description:
      "Permit for HVAC installations, ductwork modifications, equipment replacement, or ventilation changes.",
    typicalDays: 14,
    requiredDocuments: [
      "Mechanical Plans",
      "HVAC Load Calculations (Manual J / Manual D)",
      "Equipment Specifications",
      "Duct Layout",
    ],
  },
  {
    key: "ZONING",
    name: "Zoning Permit / Variance",
    description:
      "Zoning review or variance application for setback encroachments, use changes, density exceptions, or height variances.",
    typicalDays: 45,
    requiredDocuments: [
      "Site Plan with Setbacks",
      "Zoning Analysis Letter",
      "Survey / Plat",
      "Variance Application (if applicable)",
      "Neighbor Notification Records",
    ],
  },
  {
    key: "DEMOLITION",
    name: "Demolition Permit",
    description:
      "Permit for partial or full demolition of structures. May require asbestos/lead surveys and utility disconnections.",
    typicalDays: 14,
    requiredDocuments: [
      "Demolition Plan",
      "Asbestos / Lead Survey Report",
      "Utility Disconnection Confirmation",
      "Erosion Control Plan",
      "Debris Disposal Plan",
    ],
  },
] as const;

// ────────────────────────────────────────────────────────────
// 4. PROJECT TYPES
// ────────────────────────────────────────────────────────────

export const PROJECT_TYPES = [
  {
    key: "ADDITION",
    name: "Home Addition",
    description:
      "Expanding an existing structure with new square footage including bump-outs, second stories, garage conversions, and ADUs.",
    typicalTwinTier: "L2" as const,
    defaultModules: ["os-dev", "os-pm", "os-pay", "marketplace"],
  },
  {
    key: "RENOVATION",
    name: "Renovation / Remodel",
    description:
      "Interior or exterior renovation of an existing structure including kitchens, bathrooms, whole-home remodels, and finish upgrades.",
    typicalTwinTier: "L1" as const,
    defaultModules: ["os-pm", "os-pay", "marketplace"],
  },
  {
    key: "NEW_HOME",
    name: "New Home Construction",
    description:
      "Ground-up construction of a single-family residence from site preparation through certificate of occupancy.",
    typicalTwinTier: "L2" as const,
    defaultModules: [
      "os-land",
      "os-feas",
      "os-dev",
      "os-pm",
      "os-pay",
      "os-ops",
      "marketplace",
    ],
  },
  {
    key: "MULTIFAMILY",
    name: "Multifamily Development",
    description:
      "Construction or renovation of multi-unit residential buildings including duplexes, townhomes, condos, and apartment complexes.",
    typicalTwinTier: "L3" as const,
    defaultModules: [
      "os-land",
      "os-feas",
      "os-dev",
      "os-pm",
      "os-pay",
      "os-ops",
      "marketplace",
    ],
  },
  {
    key: "COMMERCIAL",
    name: "Commercial Build-Out",
    description:
      "Commercial tenant improvements, office build-outs, restaurant construction, retail fit-ups, and light industrial projects.",
    typicalTwinTier: "L2" as const,
    defaultModules: ["os-feas", "os-dev", "os-pm", "os-pay", "marketplace"],
  },
  {
    key: "MIXED_USE",
    name: "Mixed-Use Development",
    description:
      "Developments combining residential, commercial, and/or office uses in a single project, typically with ground-floor retail.",
    typicalTwinTier: "L3" as const,
    defaultModules: [
      "os-land",
      "os-feas",
      "os-dev",
      "os-pm",
      "os-pay",
      "os-ops",
      "marketplace",
    ],
  },
] as const;

// ────────────────────────────────────────────────────────────
// 5. COST LIBRARY CATEGORIES (CSI MasterFormat Divisions)
// ────────────────────────────────────────────────────────────

export const CSI_COST_CATEGORIES = [
  {
    division: "03",
    key: "CSI_03_CONCRETE",
    name: "Concrete",
    description:
      "Cast-in-place concrete, precast concrete, cementitious decks, and grouts. Includes formwork, reinforcement, and finishing.",
    typicalTrades: [
      "Concrete Finisher",
      "Ironworker (Rebar)",
      "General Labor",
      "Crane Operator",
    ],
  },
  {
    division: "04",
    key: "CSI_04_MASONRY",
    name: "Masonry",
    description:
      "Unit masonry (CMU, brick, stone), mortar, grout, reinforcement, and masonry accessories. Includes chimneys and fireplaces.",
    typicalTrades: ["Mason", "General Labor", "Ironworker (Rebar)"],
  },
  {
    division: "05",
    key: "CSI_05_METALS",
    name: "Metals",
    description:
      "Structural steel, steel joists, metal decking, cold-formed framing, metal fabrications, railings, and ornamental metals.",
    typicalTrades: [
      "Ironworker",
      "Welder",
      "Crane Operator",
      "Sheet Metal Worker",
    ],
  },
  {
    division: "06",
    key: "CSI_06_WOOD_PLASTICS",
    name: "Wood, Plastics & Composites",
    description:
      "Rough carpentry, finish carpentry, architectural woodwork, structural panels, plastic fabrications, and FRP.",
    typicalTrades: ["Carpenter", "Cabinet Maker", "General Labor"],
  },
  {
    division: "07",
    key: "CSI_07_THERMAL_MOISTURE",
    name: "Thermal & Moisture Protection",
    description:
      "Dampproofing, waterproofing, insulation, air barriers, roofing, flashing, sealants, and exterior wall assemblies.",
    typicalTrades: ["Roofer", "Insulator", "General Labor", "Sheet Metal Worker"],
  },
  {
    division: "08",
    key: "CSI_08_DOORS_WINDOWS",
    name: "Doors & Windows",
    description:
      "Doors, frames, hardware, windows, skylights, curtain walls, storefronts, and glazing. Includes automatic door operators.",
    typicalTrades: ["Carpenter", "Glazier", "General Labor"],
  },
  {
    division: "09",
    key: "CSI_09_FINISHES",
    name: "Finishes",
    description:
      "Plaster, gypsum board, tile, terrazzo, acoustical ceilings, flooring, wall coverings, and painting/coating.",
    typicalTrades: [
      "Drywall Finisher",
      "Tile Setter",
      "Painter",
      "Flooring Installer",
    ],
  },
  {
    division: "22",
    key: "CSI_22_PLUMBING",
    name: "Plumbing",
    description:
      "Plumbing piping, fixtures, equipment, and specialties. Includes domestic water, sanitary, storm, and gas piping systems.",
    typicalTrades: ["Plumber", "General Labor"],
  },
  {
    division: "23",
    key: "CSI_23_MECHANICAL",
    name: "Heating, Ventilating & Air Conditioning",
    description:
      "HVAC piping, ductwork, equipment, controls, and testing/balancing. Includes boilers, chillers, air handlers, and split systems.",
    typicalTrades: [
      "HVAC Technician",
      "Sheet Metal Worker",
      "Insulator",
      "General Labor",
    ],
  },
  {
    division: "26",
    key: "CSI_26_ELECTRICAL",
    name: "Electrical",
    description:
      "Power distribution, lighting, wiring devices, overcurrent protection, grounding, fire alarm, and low-voltage systems.",
    typicalTrades: ["Electrician", "General Labor"],
  },
] as const;

// ────────────────────────────────────────────────────────────
// 6. PAYMENT MILESTONE TEMPLATES
// ────────────────────────────────────────────────────────────

export const PAYMENT_MILESTONE_TEMPLATES = [
  {
    key: "DEPOSIT",
    name: "Deposit / Mobilization",
    percentage: 10,
    order: 1,
    description:
      "Initial deposit upon contract execution. Covers mobilization, material procurement, and project setup costs.",
    typicalInspection: "SITE",
  },
  {
    key: "FOUNDATION",
    name: "Foundation Complete",
    percentage: 15,
    order: 2,
    description:
      "Released upon completion and inspection of foundation work including footings, foundation walls, and waterproofing.",
    typicalInspection: "FOUNDATION",
  },
  {
    key: "FRAMING",
    name: "Framing Complete",
    percentage: 20,
    order: 3,
    description:
      "Released upon completion and inspection of structural framing including roof structure, sheathing, and windows/doors set.",
    typicalInspection: "ROUGH_FRAMING",
  },
  {
    key: "MEP_ROUGH",
    name: "MEP Rough-In Complete",
    percentage: 15,
    order: 4,
    description:
      "Released upon completion and inspection of rough electrical, plumbing, and HVAC installations before wall close-up.",
    typicalInspection: "ROUGH_MECHANICAL",
  },
  {
    key: "DRYWALL_INTERIOR",
    name: "Drywall & Interior",
    percentage: 15,
    order: 5,
    description:
      "Released upon completion of insulation, drywall hanging and finishing, priming, and initial interior trim installation.",
    typicalInspection: "INSULATION",
  },
  {
    key: "FINISH",
    name: "Finish Work",
    percentage: 15,
    order: 6,
    description:
      "Released upon completion of cabinets, countertops, flooring, painting, fixtures, appliances, and finish MEP trim.",
    typicalInspection: "FINAL_BUILDING",
  },
  {
    key: "COMPLETION",
    name: "Substantial Completion",
    percentage: 10,
    order: 7,
    description:
      "Final payment upon certificate of occupancy, punch list completion, and closeout documentation delivery.",
    typicalInspection: "CERTIFICATE_OF_OCCUPANCY",
  },
] as const;

// ────────────────────────────────────────────────────────────
// 7. TWIN KPI DEFAULTS (by tier)
// ────────────────────────────────────────────────────────────

export const TWIN_KPI_DEFAULTS = {
  L1: {
    tier: "L1",
    description:
      "Light twin -- basic tracking with budget, schedule, and completion metrics.",
    kpis: [
      {
        key: "budget_variance",
        name: "Budget Variance",
        unit: "percent",
        thresholdWarning: 5,
        thresholdCritical: 10,
        description:
          "Percentage deviation of actual cost from approved budget. Positive = over budget.",
      },
      {
        key: "schedule_spi",
        name: "Schedule Performance Index (SPI)",
        unit: "ratio",
        thresholdWarning: 0.9,
        thresholdCritical: 0.8,
        description:
          "Earned Value SPI (EV / PV). Below 1.0 means behind schedule; below 0.8 is critical.",
      },
      {
        key: "completion_pct",
        name: "Completion Percentage",
        unit: "percent",
        thresholdWarning: null,
        thresholdCritical: null,
        description:
          "Overall project completion based on weighted milestone and task progress.",
      },
    ],
  },
  L2: {
    tier: "L2",
    description:
      "Standard twin -- full scheduling, cost tracking, document management, and risk monitoring.",
    kpis: [
      {
        key: "budget_variance",
        name: "Budget Variance",
        unit: "percent",
        thresholdWarning: 5,
        thresholdCritical: 10,
        description:
          "Percentage deviation of actual cost from approved budget.",
      },
      {
        key: "schedule_spi",
        name: "Schedule Performance Index (SPI)",
        unit: "ratio",
        thresholdWarning: 0.9,
        thresholdCritical: 0.8,
        description: "Earned Value SPI (EV / PV).",
      },
      {
        key: "completion_pct",
        name: "Completion Percentage",
        unit: "percent",
        thresholdWarning: null,
        thresholdCritical: null,
        description:
          "Overall project completion based on weighted milestone and task progress.",
      },
      {
        key: "risk_score",
        name: "Risk Score",
        unit: "score_0_100",
        thresholdWarning: 60,
        thresholdCritical: 80,
        description:
          "Composite risk score (0-100) based on schedule risk, budget risk, weather, and open issues.",
      },
      {
        key: "quality_score",
        name: "Quality Score",
        unit: "score_0_100",
        thresholdWarning: 70,
        thresholdCritical: 50,
        description:
          "Aggregate quality rating from inspection pass rates, rework frequency, and punch list density.",
      },
      {
        key: "open_issues",
        name: "Open Issues Count",
        unit: "count",
        thresholdWarning: 10,
        thresholdCritical: 25,
        description:
          "Total number of unresolved RFIs, punch items, inspection corrections, and open change orders.",
      },
    ],
  },
  L3: {
    tier: "L3",
    description:
      "Premium twin -- AI-powered predictions, real-time IoT, advanced analytics, and proactive alerting.",
    kpis: [
      {
        key: "budget_variance",
        name: "Budget Variance",
        unit: "percent",
        thresholdWarning: 5,
        thresholdCritical: 10,
        description:
          "Percentage deviation of actual cost from approved budget.",
      },
      {
        key: "schedule_spi",
        name: "Schedule Performance Index (SPI)",
        unit: "ratio",
        thresholdWarning: 0.9,
        thresholdCritical: 0.8,
        description: "Earned Value SPI (EV / PV).",
      },
      {
        key: "completion_pct",
        name: "Completion Percentage",
        unit: "percent",
        thresholdWarning: null,
        thresholdCritical: null,
        description:
          "Overall project completion based on weighted milestone and task progress.",
      },
      {
        key: "risk_score",
        name: "Risk Score",
        unit: "score_0_100",
        thresholdWarning: 60,
        thresholdCritical: 80,
        description:
          "Composite risk score (0-100) factoring schedule, budget, weather, labor, and supply chain data.",
      },
      {
        key: "quality_score",
        name: "Quality Score",
        unit: "score_0_100",
        thresholdWarning: 70,
        thresholdCritical: 50,
        description:
          "Aggregate quality rating from inspections, AI photo analysis, and rework tracking.",
      },
      {
        key: "open_issues",
        name: "Open Issues Count",
        unit: "count",
        thresholdWarning: 10,
        thresholdCritical: 25,
        description:
          "Total unresolved RFIs, punch items, corrections, and change orders.",
      },
      {
        key: "safety_score",
        name: "Safety Score",
        unit: "score_0_100",
        thresholdWarning: 80,
        thresholdCritical: 60,
        description:
          "Safety rating based on incident reports, near-misses, toolbox talk compliance, and OSHA metrics.",
      },
      {
        key: "cost_performance_index",
        name: "Cost Performance Index (CPI)",
        unit: "ratio",
        thresholdWarning: 0.9,
        thresholdCritical: 0.8,
        description:
          "Earned Value CPI (EV / AC). Below 1.0 means over budget per unit of work completed.",
      },
      {
        key: "rfi_response_time",
        name: "RFI Response Time",
        unit: "days",
        thresholdWarning: 5,
        thresholdCritical: 10,
        description:
          "Average number of days to respond to RFIs. Longer response times correlate with schedule delays.",
      },
      {
        key: "change_order_rate",
        name: "Change Order Rate",
        unit: "percent",
        thresholdWarning: 5,
        thresholdCritical: 10,
        description:
          "Total approved change order value as a percentage of original contract amount.",
      },
    ],
  },
} as const;

// ────────────────────────────────────────────────────────────
// 8. MODULE REGISTRATIONS
// ────────────────────────────────────────────────────────────

export const OS_MODULES = [
  {
    key: "os-land",
    name: "OS Land",
    description:
      "Land acquisition and parcel analysis module. Site search, zoning lookup, environmental screening, and comparable analysis.",
    defaultPhases: ["LAND"],
  },
  {
    key: "os-feas",
    name: "OS Feasibility",
    description:
      "Feasibility study module. Financial pro-forma, construction cost estimation, market analysis, and go/no-go dashboard.",
    defaultPhases: ["FEASIBILITY"],
  },
  {
    key: "os-dev",
    name: "OS Development",
    description:
      "Design and development module. Architect coordination, drawing management, AI concept generation, and permit document preparation.",
    defaultPhases: ["DESIGN", "PERMITS"],
  },
  {
    key: "os-pm",
    name: "OS Project Management",
    description:
      "Core project management module. Scheduling, milestone tracking, daily logs, RFIs, submittals, change orders, inspections, and closeout.",
    defaultPhases: [
      "PRECONSTRUCTION",
      "CONSTRUCTION",
      "INSPECTIONS",
      "CLOSEOUT",
    ],
  },
  {
    key: "os-pay",
    name: "OS Payments",
    description:
      "Financial and payments module. Escrow management, milestone payments, draw requests, retainage, lien waivers, and budget tracking.",
    defaultPhases: ["PAYMENTS", "CLOSEOUT"],
  },
  {
    key: "os-ops",
    name: "OS Operations",
    description:
      "Post-construction operations module. Warranty tracking, maintenance scheduling, facility management, and service requests.",
    defaultPhases: ["OPERATIONS"],
  },
  {
    key: "marketplace",
    name: "Marketplace",
    description:
      "Contractor marketplace module. Bidding, contractor matching, lead distribution, ratings, and portfolio management.",
    defaultPhases: ["IDEA", "PRECONSTRUCTION"],
  },
] as const;

// ────────────────────────────────────────────────────────────
// SEED FUNCTION
// ────────────────────────────────────────────────────────────

export async function seedV20Core(prisma?: PrismaClient): Promise<void> {
  const db = prisma ?? new PrismaClient();
  const isStandalone = !prisma;

  try {
    console.log("====================================================");
    console.log("  Kealee v20 Core Seed");
    console.log("====================================================\n");

    // ── 1. ROLES ──────────────────────────────────────────────
    console.log("[1/8] Seeding roles...");
    for (const role of V20_ROLES) {
      await db.role.upsert({
        where: { key: role.key },
        update: {
          name: role.name,
          description: role.description,
        },
        create: {
          key: role.key,
          name: role.name,
          description: role.description,
        },
      });
    }
    console.log(`  -> ${V20_ROLES.length} roles upserted`);

    // ── 1b. ROLE PERMISSION ASSIGNMENTS ────────────────────────
    console.log("       Assigning permissions to roles...");
    let permAssignments = 0;
    for (const role of V20_ROLES) {
      for (const permKey of role.permissions) {
        // Ensure the permission exists (it may have been seeded by seed.ts)
        await db.permission.upsert({
          where: { key: permKey },
          update: {},
          create: {
            key: permKey,
            name: permKey,
            description: `Auto-created for role ${role.key}`,
          },
        });

        await db.rolePermission.upsert({
          where: {
            roleKey_permissionKey: {
              roleKey: role.key,
              permissionKey: permKey,
            },
          },
          update: {},
          create: {
            roleKey: role.key,
            permissionKey: permKey,
          },
        });
        permAssignments++;
      }
    }
    console.log(`  -> ${permAssignments} role-permission assignments upserted`);

    // ── 2. LIFECYCLE PHASES ────────────────────────────────────
    console.log("[2/8] Seeding lifecycle phases...");
    for (const phase of LIFECYCLE_PHASES) {
      await db.systemConfig.upsert({
        where: { key: `lifecycle.phase.${phase.key}` },
        update: {
          value: {
            key: phase.key,
            name: phase.name,
            description: phase.description,
            order: phase.order,
            requiredModules: phase.requiredModules,
          },
          description: `Lifecycle phase: ${phase.name}`,
          category: "lifecycle_phases",
          dataType: "json",
          isPublic: true,
        },
        create: {
          key: `lifecycle.phase.${phase.key}`,
          value: {
            key: phase.key,
            name: phase.name,
            description: phase.description,
            order: phase.order,
            requiredModules: phase.requiredModules,
          },
          description: `Lifecycle phase: ${phase.name}`,
          category: "lifecycle_phases",
          dataType: "json",
          isPublic: true,
        },
      });
    }
    console.log(`  -> ${LIFECYCLE_PHASES.length} lifecycle phases upserted`);

    // ── 3. PERMIT TYPES ────────────────────────────────────────
    console.log("[3/8] Seeding permit types...");
    for (const pt of PERMIT_TYPES) {
      await db.systemConfig.upsert({
        where: { key: `permit.type.${pt.key}` },
        update: {
          value: {
            key: pt.key,
            name: pt.name,
            description: pt.description,
            typicalDays: pt.typicalDays,
            requiredDocuments: pt.requiredDocuments,
          },
          description: `Permit type: ${pt.name}`,
          category: "permit_types",
          dataType: "json",
          isPublic: true,
        },
        create: {
          key: `permit.type.${pt.key}`,
          value: {
            key: pt.key,
            name: pt.name,
            description: pt.description,
            typicalDays: pt.typicalDays,
            requiredDocuments: pt.requiredDocuments,
          },
          description: `Permit type: ${pt.name}`,
          category: "permit_types",
          dataType: "json",
          isPublic: true,
        },
      });
    }
    console.log(`  -> ${PERMIT_TYPES.length} permit types upserted`);

    // ── 4. PROJECT TYPES ───────────────────────────────────────
    console.log("[4/8] Seeding project types...");
    for (const projType of PROJECT_TYPES) {
      await db.systemConfig.upsert({
        where: { key: `project.type.${projType.key}` },
        update: {
          value: {
            key: projType.key,
            name: projType.name,
            description: projType.description,
            typicalTwinTier: projType.typicalTwinTier,
            defaultModules: projType.defaultModules,
          },
          description: `Project type: ${projType.name}`,
          category: "project_types",
          dataType: "json",
          isPublic: true,
        },
        create: {
          key: `project.type.${projType.key}`,
          value: {
            key: projType.key,
            name: projType.name,
            description: projType.description,
            typicalTwinTier: projType.typicalTwinTier,
            defaultModules: projType.defaultModules,
          },
          description: `Project type: ${projType.name}`,
          category: "project_types",
          dataType: "json",
          isPublic: true,
        },
      });
    }
    console.log(`  -> ${PROJECT_TYPES.length} project types upserted`);

    // ── 5. CSI COST LIBRARY CATEGORIES ─────────────────────────
    console.log("[5/8] Seeding CSI cost library categories...");
    for (const cat of CSI_COST_CATEGORIES) {
      await db.systemConfig.upsert({
        where: { key: `cost.csi.${cat.key}` },
        update: {
          value: {
            division: cat.division,
            key: cat.key,
            name: cat.name,
            description: cat.description,
            typicalTrades: cat.typicalTrades,
          },
          description: `CSI Division ${cat.division}: ${cat.name}`,
          category: "cost_library",
          dataType: "json",
          isPublic: true,
        },
        create: {
          key: `cost.csi.${cat.key}`,
          value: {
            division: cat.division,
            key: cat.key,
            name: cat.name,
            description: cat.description,
            typicalTrades: cat.typicalTrades,
          },
          description: `CSI Division ${cat.division}: ${cat.name}`,
          category: "cost_library",
          dataType: "json",
          isPublic: true,
        },
      });
    }
    console.log(`  -> ${CSI_COST_CATEGORIES.length} CSI categories upserted`);

    // ── 6. PAYMENT MILESTONE TEMPLATES ─────────────────────────
    console.log("[6/8] Seeding payment milestone templates...");
    for (const ms of PAYMENT_MILESTONE_TEMPLATES) {
      await db.systemConfig.upsert({
        where: { key: `payment.milestone.${ms.key}` },
        update: {
          value: {
            key: ms.key,
            name: ms.name,
            percentage: ms.percentage,
            order: ms.order,
            description: ms.description,
            typicalInspection: ms.typicalInspection,
          },
          description: `Payment milestone: ${ms.name} (${ms.percentage}%)`,
          category: "payment_milestones",
          dataType: "json",
          isPublic: true,
        },
        create: {
          key: `payment.milestone.${ms.key}`,
          value: {
            key: ms.key,
            name: ms.name,
            percentage: ms.percentage,
            order: ms.order,
            description: ms.description,
            typicalInspection: ms.typicalInspection,
          },
          description: `Payment milestone: ${ms.name} (${ms.percentage}%)`,
          category: "payment_milestones",
          dataType: "json",
          isPublic: true,
        },
      });
    }
    console.log(
      `  -> ${PAYMENT_MILESTONE_TEMPLATES.length} milestone templates upserted`
    );

    // ── 7. TWIN KPI DEFAULTS ───────────────────────────────────
    console.log("[7/8] Seeding Digital Twin KPI defaults...");
    let kpiCount = 0;
    for (const [tier, tierData] of Object.entries(TWIN_KPI_DEFAULTS)) {
      await db.systemConfig.upsert({
        where: { key: `twin.kpi.${tier}` },
        update: {
          value: tierData,
          description: `Twin ${tier} KPI defaults: ${tierData.kpis.length} KPIs`,
          category: "twin_kpi",
          dataType: "json",
          isPublic: false,
        },
        create: {
          key: `twin.kpi.${tier}`,
          value: tierData,
          description: `Twin ${tier} KPI defaults: ${tierData.kpis.length} KPIs`,
          category: "twin_kpi",
          dataType: "json",
          isPublic: false,
        },
      });
      kpiCount += tierData.kpis.length;
    }
    console.log(
      `  -> 3 twin tiers with ${kpiCount} total KPI definitions upserted`
    );

    // ── 8. MODULE REGISTRATIONS ────────────────────────────────
    console.log("[8/8] Seeding OS module registrations...");
    for (const mod of OS_MODULES) {
      await db.systemConfig.upsert({
        where: { key: `module.${mod.key}` },
        update: {
          value: {
            key: mod.key,
            name: mod.name,
            description: mod.description,
            defaultPhases: mod.defaultPhases,
          },
          description: `OS Module: ${mod.name}`,
          category: "modules",
          dataType: "json",
          isPublic: true,
        },
        create: {
          key: `module.${mod.key}`,
          value: {
            key: mod.key,
            name: mod.name,
            description: mod.description,
            defaultPhases: mod.defaultPhases,
          },
          description: `OS Module: ${mod.name}`,
          category: "modules",
          dataType: "json",
          isPublic: true,
        },
      });
    }
    console.log(`  -> ${OS_MODULES.length} module registrations upserted`);

    // ── SUMMARY ────────────────────────────────────────────────
    console.log("\n====================================================");
    console.log("  v20 Core Seed Complete");
    console.log("====================================================");
    console.log(`  Roles:              ${V20_ROLES.length}`);
    console.log(`  Role-Permissions:   ${permAssignments}`);
    console.log(`  Lifecycle Phases:   ${LIFECYCLE_PHASES.length}`);
    console.log(`  Permit Types:       ${PERMIT_TYPES.length}`);
    console.log(`  Project Types:      ${PROJECT_TYPES.length}`);
    console.log(`  CSI Categories:     ${CSI_COST_CATEGORIES.length}`);
    console.log(`  Payment Milestones: ${PAYMENT_MILESTONE_TEMPLATES.length}`);
    console.log(`  Twin KPI Tiers:     3 (${kpiCount} KPIs total)`);
    console.log(`  OS Modules:         ${OS_MODULES.length}`);
    console.log("====================================================\n");
  } finally {
    if (isStandalone) {
      await db.$disconnect();
    }
  }
}

// ── Standalone execution ─────────────────────────────────────
// Run directly: npx ts-node packages/database/prisma/seeds/seed-v20-core.ts

if (require.main === module) {
  seedV20Core()
    .then(() => {
      console.log("Done.");
      process.exit(0);
    })
    .catch((err) => {
      console.error("Seed failed:", err);
      process.exit(1);
    });
}
