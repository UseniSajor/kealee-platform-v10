/**
 * Kealee Platform - Agent Task Assignments
 *
 * This file defines the mapping of 50 critical construction operations tasks
 * to the 7 specialized AI agents and 4 package tiers.
 */

// Agent type enum (matches Prisma schema)
export type AgentType =
  | 'ESTIMATING_AGENT'
  | 'PROJECT_MANAGEMENT_AGENT'
  | 'FINANCIAL_AGENT'
  | 'SUBCONTRACTOR_AGENT'
  | 'PERMITS_AGENT'
  | 'CLIENT_AGENT'
  | 'TECHNOLOGY_AGENT';

// Package tier enum (matches Prisma schema)
export type PackageTier = 'STARTER' | 'PROFESSIONAL' | 'ENTERPRISE' | 'PLATFORM';

// Task category enum (matches Prisma schema)
export type TaskCategory =
  | 'ESTIMATING'
  | 'PROJECT_MANAGEMENT'
  | 'FINANCIAL'
  | 'SUBCONTRACTOR'
  | 'PERMITS'
  | 'CLIENT'
  | 'TECHNOLOGY';

// Agent capability definition
export interface AgentCapability {
  id: string;
  name: string;
  description: string;
}

// Agent definition
export interface AgentDefinition {
  name: string;
  tasks: number[];
  description: string;
  capabilities: AgentCapability[];
  appModules: string[];
}

// Task definition
export interface TaskDefinition {
  taskNumber: number;
  name: string;
  description: string;
  category: TaskCategory;
  packageTier: PackageTier;
  agentType: AgentType;
  appModule: string;
  featureName: string;
  hoursPerJob: number;
  automationLevel: number; // 0-1 scale
}

/**
 * Agent Task Assignments
 * Maps each agent to their assigned tasks and capabilities
 */
export const AGENT_TASK_ASSIGNMENTS: Record<AgentType, AgentDefinition> = {
  ESTIMATING_AGENT: {
    name: 'Estimating Agent',
    tasks: [1, 21, 22, 23, 24, 41, 42, 43], // 8 tasks
    description: 'Handles takeoffs, pricing, bid management, and cost analysis',
    capabilities: [
      { id: 'quantity_takeoff', name: 'Quantity Takeoff', description: 'AI-powered quantity takeoffs from plans' },
      { id: 'material_pricing', name: 'Material Pricing', description: 'Real-time material price tracking' },
      { id: 'labor_estimation', name: 'Labor Estimation', description: 'Labor rate analytics and estimation' },
      { id: 'bid_tracking', name: 'Bid Tracking', description: 'Bid deadline management and tracking' },
      { id: 'cost_intelligence', name: 'Cost Intelligence', description: 'Historical cost intelligence and analytics' },
      { id: 'scope_analysis', name: 'Scope Analysis', description: 'AI scope gap analysis for bids' },
    ],
    appModules: ['os-pm', 'm-project-owner'],
  },

  PROJECT_MANAGEMENT_AGENT: {
    name: 'Project Management Agent',
    tasks: [2, 3, 7, 9, 10, 17, 25, 26, 27, 28, 40], // 11 tasks
    description: 'Manages schedules, documentation, quality, and field operations',
    capabilities: [
      { id: 'schedule_management', name: 'Schedule Management', description: 'Gantt chart scheduling and coordination' },
      { id: 'daily_reporting', name: 'Daily Reporting', description: 'Daily progress documentation' },
      { id: 'punch_list', name: 'Punch List', description: 'Punch list management and tracking' },
      { id: 'change_orders', name: 'Change Orders', description: 'Change order tracking and processing' },
      { id: 'qc_inspections', name: 'QC Inspections', description: 'Quality control inspection checklists' },
      { id: 'document_control', name: 'Document Control', description: 'Document version control and management' },
    ],
    appModules: ['os-pm', 'm-project-owner'],
  },

  FINANCIAL_AGENT: {
    name: 'Financial Agent',
    tasks: [11, 12, 13, 14, 29, 30, 31, 32, 44, 45], // 10 tasks
    description: 'Handles billing, retention, cash flow, and financial tracking',
    capabilities: [
      { id: 'pay_applications', name: 'Pay Applications', description: 'AIA pay application generation' },
      { id: 'retention_tracking', name: 'Retention Tracking', description: 'Retention tracking and management' },
      { id: 'lien_waivers', name: 'Lien Waivers', description: 'Lien waiver automation' },
      { id: 'budget_reporting', name: 'Budget Reporting', description: 'Budget vs actual reporting' },
      { id: 'cash_flow', name: 'Cash Flow', description: 'Cash flow forecasting' },
      { id: 'job_costing', name: 'Job Costing', description: 'Job costing dashboard and analytics' },
      { id: 'tax_documents', name: 'Tax Documents', description: 'Tax document automation' },
    ],
    appModules: ['os-pm', 'm-ops-services'],
  },

  SUBCONTRACTOR_AGENT: {
    name: 'Subcontractor Agent',
    tasks: [15, 16, 18, 33, 34, 35, 46], // 7 tasks
    description: 'Manages sub prequalification, contracts, and performance',
    capabilities: [
      { id: 'prequalification', name: 'Prequalification', description: 'Subcontractor prequalification process' },
      { id: 'scope_matrix', name: 'Scope Matrix', description: 'Scope of work matrix management' },
      { id: 'contract_management', name: 'Contract Management', description: 'Digital contract execution' },
      { id: 'back_charges', name: 'Back Charges', description: 'Back-charge management' },
      { id: 'performance_ratings', name: 'Performance Ratings', description: 'Sub performance ratings and analytics' },
      { id: 'capacity_tracking', name: 'Capacity Tracking', description: 'Workforce capacity tracking' },
    ],
    appModules: ['os-pm', 'm-ops-services'],
  },

  PERMITS_AGENT: {
    name: 'Permits & Compliance Agent',
    tasks: [19, 20, 36, 37, 47, 48], // 6 tasks
    description: 'Handles permits, inspections, safety, and compliance',
    capabilities: [
      { id: 'permit_applications', name: 'Permit Applications', description: 'Permit application wizard' },
      { id: 'inspection_scheduling', name: 'Inspection Scheduling', description: 'Inspection scheduling and coordination' },
      { id: 'code_compliance', name: 'Code Compliance', description: 'Code compliance monitoring' },
      { id: 'safety_management', name: 'Safety Management', description: 'OSHA safety manager' },
      { id: 'environmental', name: 'Environmental', description: 'Environmental compliance tracking' },
      { id: 'license_tracking', name: 'License Tracking', description: 'License renewal management' },
    ],
    appModules: ['m-permits-inspections', 'os-pm'],
  },

  CLIENT_AGENT: {
    name: 'Client Communication Agent',
    tasks: [4, 5, 8, 38, 39, 49], // 6 tasks
    description: 'Manages owner portal, communications, and selections',
    capabilities: [
      { id: 'owner_dashboard', name: 'Owner Dashboard', description: 'Owner dashboard portal' },
      { id: 'progress_reports', name: 'Progress Reports', description: 'Automated progress reporting' },
      { id: 'rfi_management', name: 'RFI Management', description: 'RFI management portal' },
      { id: 'selection_tracking', name: 'Selection Tracking', description: 'Selection coordination' },
      { id: 'warranty_claims', name: 'Warranty Claims', description: 'Warranty portal and claims' },
      { id: 'dispute_resolution', name: 'Dispute Resolution', description: 'Dispute resolution workflow' },
    ],
    appModules: ['m-project-owner', 'os-pm'],
  },

  TECHNOLOGY_AGENT: {
    name: 'Technology & Integration Agent',
    tasks: [6, 40, 50], // 3 tasks
    description: 'Handles mobile access, document control, and API integrations',
    capabilities: [
      { id: 'mobile_sync', name: 'Mobile Sync', description: 'Mobile field access and sync' },
      { id: 'version_control', name: 'Version Control', description: 'Document version control' },
      { id: 'api_integrations', name: 'API Integrations', description: 'Full API access and integrations' },
      { id: 'data_sync', name: 'Data Sync', description: 'Cross-platform data synchronization' },
    ],
    appModules: ['os-pm', 'api'],
  },
};

/**
 * Package Task Mapping
 * Defines which tasks are included in each package tier
 */
export const PACKAGE_TASK_MAPPING: Record<PackageTier, number[]> = {
  STARTER: [1, 2, 3, 4, 5, 6], // 6 tasks
  PROFESSIONAL: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20], // 20 tasks
  ENTERPRISE: Array.from({ length: 40 }, (_, i) => i + 1), // 40 tasks
  PLATFORM: Array.from({ length: 50 }, (_, i) => i + 1), // 50 tasks (all)
};

/**
 * Package Configuration
 * Detailed configuration for each package tier
 */
export const PACKAGE_CONFIG: Record<PackageTier, {
  name: string;
  minPrice: number;
  maxPrice: number;
  minJobs: number;
  maxJobs: number;
  featureCount: number;
  staffingRatio: number;
}> = {
  STARTER: {
    name: 'Package A: Starter',
    minPrice: 4900, // $49
    maxPrice: 19900, // $199
    minJobs: 1,
    maxJobs: 5,
    featureCount: 6,
    staffingRatio: 10, // 10 jobs per FTE
  },
  PROFESSIONAL: {
    name: 'Package B: Professional',
    minPrice: 175000, // $1,750
    maxPrice: 450000, // $4,500
    minJobs: 5,
    maxJobs: 25,
    featureCount: 20,
    staffingRatio: 8, // 8 jobs per FTE
  },
  ENTERPRISE: {
    name: 'Package C: Enterprise',
    minPrice: 850000, // $8,500
    maxPrice: 1650000, // $16,500
    minJobs: 25,
    maxJobs: 100,
    featureCount: 40,
    staffingRatio: 6, // 6 jobs per FTE
  },
  PLATFORM: {
    name: 'Package D: Platform',
    minPrice: 2500000, // $25,000
    maxPrice: 5000000, // $50,000
    minJobs: 100,
    maxJobs: -1, // Unlimited
    featureCount: 50,
    staffingRatio: 5, // 5 jobs per FTE
  },
};

/**
 * Complete list of 50 critical construction operations tasks
 */
export const PLATFORM_TASKS: TaskDefinition[] = [
  // Package A: Starter (Tasks 1-6)
  { taskNumber: 1, name: 'Bid deadline management', description: 'Track and manage bid submission deadlines', category: 'ESTIMATING', packageTier: 'STARTER', agentType: 'ESTIMATING_AGENT', appModule: 'os-pm', featureName: 'bid-deadlines', hoursPerJob: 0.5, automationLevel: 0.8 },
  { taskNumber: 2, name: 'Daily progress documentation', description: 'Document daily progress with photos and notes', category: 'PROJECT_MANAGEMENT', packageTier: 'STARTER', agentType: 'PROJECT_MANAGEMENT_AGENT', appModule: 'os-pm', featureName: 'daily-logs', hoursPerJob: 0.5, automationLevel: 0.6 },
  { taskNumber: 3, name: 'Punch list management', description: 'Create and track punch list items', category: 'PROJECT_MANAGEMENT', packageTier: 'STARTER', agentType: 'PROJECT_MANAGEMENT_AGENT', appModule: 'os-pm', featureName: 'punch-lists', hoursPerJob: 1.0, automationLevel: 0.5 },
  { taskNumber: 4, name: 'Owner dashboard portal', description: 'Client-facing project dashboard', category: 'CLIENT', packageTier: 'STARTER', agentType: 'CLIENT_AGENT', appModule: 'm-project-owner', featureName: 'owner-dashboard', hoursPerJob: 0.25, automationLevel: 0.9 },
  { taskNumber: 5, name: 'Automated progress reporting', description: 'Generate and send progress reports', category: 'CLIENT', packageTier: 'STARTER', agentType: 'CLIENT_AGENT', appModule: 'os-pm', featureName: 'progress-reports', hoursPerJob: 0.5, automationLevel: 0.85 },
  { taskNumber: 6, name: 'Mobile field access', description: 'Mobile app for field data entry', category: 'TECHNOLOGY', packageTier: 'STARTER', agentType: 'TECHNOLOGY_AGENT', appModule: 'os-pm', featureName: 'mobile-access', hoursPerJob: 0.25, automationLevel: 0.9 },

  // Package B: Professional (Tasks 7-20)
  { taskNumber: 7, name: 'Schedule coordination with Gantt', description: 'Interactive Gantt chart scheduling', category: 'PROJECT_MANAGEMENT', packageTier: 'PROFESSIONAL', agentType: 'PROJECT_MANAGEMENT_AGENT', appModule: 'os-pm', featureName: 'gantt-scheduler', hoursPerJob: 2.0, automationLevel: 0.6 },
  { taskNumber: 8, name: 'RFI management portal', description: 'Request for Information tracking', category: 'CLIENT', packageTier: 'PROFESSIONAL', agentType: 'CLIENT_AGENT', appModule: 'os-pm', featureName: 'rfi-management', hoursPerJob: 1.0, automationLevel: 0.7 },
  { taskNumber: 9, name: 'Submittal processing workflow', description: 'Track and process submittals', category: 'PROJECT_MANAGEMENT', packageTier: 'PROFESSIONAL', agentType: 'PROJECT_MANAGEMENT_AGENT', appModule: 'os-pm', featureName: 'submittals', hoursPerJob: 1.5, automationLevel: 0.65 },
  { taskNumber: 10, name: 'Change order tracking', description: 'Track change orders through approval', category: 'PROJECT_MANAGEMENT', packageTier: 'PROFESSIONAL', agentType: 'PROJECT_MANAGEMENT_AGENT', appModule: 'os-pm', featureName: 'change-orders', hoursPerJob: 1.0, automationLevel: 0.7 },
  { taskNumber: 11, name: 'AIA pay application generation', description: 'Generate AIA G702/G703 forms', category: 'FINANCIAL', packageTier: 'PROFESSIONAL', agentType: 'FINANCIAL_AGENT', appModule: 'os-pm', featureName: 'pay-applications', hoursPerJob: 2.0, automationLevel: 0.85 },
  { taskNumber: 12, name: 'Retention tracking', description: 'Track and manage retention amounts', category: 'FINANCIAL', packageTier: 'PROFESSIONAL', agentType: 'FINANCIAL_AGENT', appModule: 'os-pm', featureName: 'retention-tracking', hoursPerJob: 0.5, automationLevel: 0.9 },
  { taskNumber: 13, name: 'Lien waiver automation', description: 'Automate lien waiver requests', category: 'FINANCIAL', packageTier: 'PROFESSIONAL', agentType: 'FINANCIAL_AGENT', appModule: 'os-pm', featureName: 'lien-waivers', hoursPerJob: 0.5, automationLevel: 0.85 },
  { taskNumber: 14, name: 'Budget vs actual reporting', description: 'Compare budget to actual costs', category: 'FINANCIAL', packageTier: 'PROFESSIONAL', agentType: 'FINANCIAL_AGENT', appModule: 'os-pm', featureName: 'budget-reporting', hoursPerJob: 1.0, automationLevel: 0.8 },
  { taskNumber: 15, name: 'Subcontractor prequalification', description: 'Prequalify subcontractors', category: 'SUBCONTRACTOR', packageTier: 'PROFESSIONAL', agentType: 'SUBCONTRACTOR_AGENT', appModule: 'os-pm', featureName: 'sub-prequal', hoursPerJob: 2.0, automationLevel: 0.7 },
  { taskNumber: 16, name: 'Scope of work matrix', description: 'Create and manage scope matrices', category: 'SUBCONTRACTOR', packageTier: 'PROFESSIONAL', agentType: 'SUBCONTRACTOR_AGENT', appModule: 'os-pm', featureName: 'scope-matrix', hoursPerJob: 1.5, automationLevel: 0.6 },
  { taskNumber: 17, name: 'Schedule compliance tracking', description: 'Track schedule compliance', category: 'PROJECT_MANAGEMENT', packageTier: 'PROFESSIONAL', agentType: 'PROJECT_MANAGEMENT_AGENT', appModule: 'os-pm', featureName: 'schedule-compliance', hoursPerJob: 0.5, automationLevel: 0.8 },
  { taskNumber: 18, name: 'Digital contract execution', description: 'E-signature for contracts', category: 'SUBCONTRACTOR', packageTier: 'PROFESSIONAL', agentType: 'SUBCONTRACTOR_AGENT', appModule: 'os-pm', featureName: 'digital-contracts', hoursPerJob: 1.0, automationLevel: 0.9 },
  { taskNumber: 19, name: 'Permit application wizard', description: 'Guided permit application', category: 'PERMITS', packageTier: 'PROFESSIONAL', agentType: 'PERMITS_AGENT', appModule: 'm-permits-inspections', featureName: 'permit-wizard', hoursPerJob: 2.0, automationLevel: 0.75 },
  { taskNumber: 20, name: 'Inspection scheduling', description: 'Schedule and track inspections', category: 'PERMITS', packageTier: 'PROFESSIONAL', agentType: 'PERMITS_AGENT', appModule: 'm-permits-inspections', featureName: 'inspection-scheduling', hoursPerJob: 1.0, automationLevel: 0.8 },

  // Package C: Enterprise (Tasks 21-40)
  { taskNumber: 21, name: 'AI-powered quantity takeoffs', description: 'AI extraction from plans', category: 'ESTIMATING', packageTier: 'ENTERPRISE', agentType: 'ESTIMATING_AGENT', appModule: 'os-pm', featureName: 'ai-takeoffs', hoursPerJob: 4.0, automationLevel: 0.85 },
  { taskNumber: 22, name: 'Material price tracking', description: 'Track material prices in real-time', category: 'ESTIMATING', packageTier: 'ENTERPRISE', agentType: 'ESTIMATING_AGENT', appModule: 'os-pm', featureName: 'material-pricing', hoursPerJob: 0.5, automationLevel: 0.9 },
  { taskNumber: 23, name: 'Labor rate analytics', description: 'Analyze labor rates and productivity', category: 'ESTIMATING', packageTier: 'ENTERPRISE', agentType: 'ESTIMATING_AGENT', appModule: 'os-pm', featureName: 'labor-analytics', hoursPerJob: 1.0, automationLevel: 0.8 },
  { taskNumber: 24, name: 'Bid broadcast to subs', description: 'Broadcast bids to subcontractors', category: 'ESTIMATING', packageTier: 'ENTERPRISE', agentType: 'ESTIMATING_AGENT', appModule: 'os-pm', featureName: 'bid-broadcast', hoursPerJob: 1.0, automationLevel: 0.85 },
  { taskNumber: 25, name: 'AI meeting transcription', description: 'Transcribe and summarize meetings', category: 'PROJECT_MANAGEMENT', packageTier: 'ENTERPRISE', agentType: 'PROJECT_MANAGEMENT_AGENT', appModule: 'os-pm', featureName: 'meeting-transcription', hoursPerJob: 0.5, automationLevel: 0.95 },
  { taskNumber: 26, name: 'Weather delay tracking', description: 'Track weather delays automatically', category: 'PROJECT_MANAGEMENT', packageTier: 'ENTERPRISE', agentType: 'PROJECT_MANAGEMENT_AGENT', appModule: 'os-pm', featureName: 'weather-delays', hoursPerJob: 0.25, automationLevel: 0.9 },
  { taskNumber: 27, name: 'QC inspection checklists', description: 'Quality control checklists', category: 'PROJECT_MANAGEMENT', packageTier: 'ENTERPRISE', agentType: 'PROJECT_MANAGEMENT_AGENT', appModule: 'os-pm', featureName: 'qc-checklists', hoursPerJob: 1.0, automationLevel: 0.7 },
  { taskNumber: 28, name: 'As-built documentation', description: 'As-built document management', category: 'PROJECT_MANAGEMENT', packageTier: 'ENTERPRISE', agentType: 'PROJECT_MANAGEMENT_AGENT', appModule: 'os-pm', featureName: 'as-builts', hoursPerJob: 2.0, automationLevel: 0.6 },
  { taskNumber: 29, name: 'Cash flow forecasting', description: 'Forecast project cash flow', category: 'FINANCIAL', packageTier: 'ENTERPRISE', agentType: 'FINANCIAL_AGENT', appModule: 'os-pm', featureName: 'cash-flow', hoursPerJob: 1.5, automationLevel: 0.8 },
  { taskNumber: 30, name: 'Job costing dashboard', description: 'Real-time job costing analytics', category: 'FINANCIAL', packageTier: 'ENTERPRISE', agentType: 'FINANCIAL_AGENT', appModule: 'os-pm', featureName: 'job-costing', hoursPerJob: 1.0, automationLevel: 0.85 },
  { taskNumber: 31, name: 'AP optimization', description: 'Optimize accounts payable', category: 'FINANCIAL', packageTier: 'ENTERPRISE', agentType: 'FINANCIAL_AGENT', appModule: 'os-pm', featureName: 'ap-optimization', hoursPerJob: 1.0, automationLevel: 0.75 },
  { taskNumber: 32, name: 'COI tracking', description: 'Certificate of Insurance tracking', category: 'FINANCIAL', packageTier: 'ENTERPRISE', agentType: 'FINANCIAL_AGENT', appModule: 'os-pm', featureName: 'coi-tracking', hoursPerJob: 0.5, automationLevel: 0.85 },
  { taskNumber: 33, name: 'Back-charge management', description: 'Manage back-charges to subs', category: 'SUBCONTRACTOR', packageTier: 'ENTERPRISE', agentType: 'SUBCONTRACTOR_AGENT', appModule: 'os-pm', featureName: 'back-charges', hoursPerJob: 1.0, automationLevel: 0.7 },
  { taskNumber: 34, name: 'Sub performance ratings', description: 'Rate subcontractor performance', category: 'SUBCONTRACTOR', packageTier: 'ENTERPRISE', agentType: 'SUBCONTRACTOR_AGENT', appModule: 'os-pm', featureName: 'sub-ratings', hoursPerJob: 0.5, automationLevel: 0.8 },
  { taskNumber: 35, name: 'Sub pay app review', description: 'Review subcontractor pay apps', category: 'SUBCONTRACTOR', packageTier: 'ENTERPRISE', agentType: 'SUBCONTRACTOR_AGENT', appModule: 'os-pm', featureName: 'sub-pay-review', hoursPerJob: 1.5, automationLevel: 0.7 },
  { taskNumber: 36, name: 'Code compliance monitoring', description: 'Monitor code compliance', category: 'PERMITS', packageTier: 'ENTERPRISE', agentType: 'PERMITS_AGENT', appModule: 'm-permits-inspections', featureName: 'code-compliance', hoursPerJob: 1.0, automationLevel: 0.75 },
  { taskNumber: 37, name: 'OSHA safety manager', description: 'OSHA compliance and safety', category: 'PERMITS', packageTier: 'ENTERPRISE', agentType: 'PERMITS_AGENT', appModule: 'os-pm', featureName: 'safety-manager', hoursPerJob: 1.5, automationLevel: 0.7 },
  { taskNumber: 38, name: 'Selection coordination', description: 'Coordinate owner selections', category: 'CLIENT', packageTier: 'ENTERPRISE', agentType: 'CLIENT_AGENT', appModule: 'm-project-owner', featureName: 'selections', hoursPerJob: 2.0, automationLevel: 0.6 },
  { taskNumber: 39, name: 'Warranty portal', description: 'Warranty management portal', category: 'CLIENT', packageTier: 'ENTERPRISE', agentType: 'CLIENT_AGENT', appModule: 'm-project-owner', featureName: 'warranty-portal', hoursPerJob: 1.0, automationLevel: 0.8 },
  { taskNumber: 40, name: 'Document version control', description: 'Version control for documents', category: 'PROJECT_MANAGEMENT', packageTier: 'ENTERPRISE', agentType: 'PROJECT_MANAGEMENT_AGENT', appModule: 'os-pm', featureName: 'doc-versioning', hoursPerJob: 0.5, automationLevel: 0.9 },

  // Package D: Platform (Tasks 41-50)
  { taskNumber: 41, name: 'AI scope gap analysis', description: 'AI analysis of scope gaps', category: 'ESTIMATING', packageTier: 'PLATFORM', agentType: 'ESTIMATING_AGENT', appModule: 'os-pm', featureName: 'scope-gap-analysis', hoursPerJob: 2.0, automationLevel: 0.9 },
  { taskNumber: 42, name: 'Competitive bid analytics', description: 'Analyze competitive bids', category: 'ESTIMATING', packageTier: 'PLATFORM', agentType: 'ESTIMATING_AGENT', appModule: 'os-pm', featureName: 'bid-analytics', hoursPerJob: 1.5, automationLevel: 0.85 },
  { taskNumber: 43, name: 'Historical cost intelligence', description: 'AI-powered historical cost data', category: 'ESTIMATING', packageTier: 'PLATFORM', agentType: 'ESTIMATING_AGENT', appModule: 'os-pm', featureName: 'cost-intelligence', hoursPerJob: 1.0, automationLevel: 0.9 },
  { taskNumber: 44, name: 'Bonding capacity dashboard', description: 'Track bonding capacity', category: 'FINANCIAL', packageTier: 'PLATFORM', agentType: 'FINANCIAL_AGENT', appModule: 'os-pm', featureName: 'bonding-capacity', hoursPerJob: 0.5, automationLevel: 0.8 },
  { taskNumber: 45, name: 'Tax document automation', description: 'Automate tax document generation', category: 'FINANCIAL', packageTier: 'PLATFORM', agentType: 'FINANCIAL_AGENT', appModule: 'os-pm', featureName: 'tax-automation', hoursPerJob: 2.0, automationLevel: 0.85 },
  { taskNumber: 46, name: 'Workforce capacity tracking', description: 'Track workforce capacity', category: 'SUBCONTRACTOR', packageTier: 'PLATFORM', agentType: 'SUBCONTRACTOR_AGENT', appModule: 'os-pm', featureName: 'workforce-capacity', hoursPerJob: 1.0, automationLevel: 0.8 },
  { taskNumber: 47, name: 'Environmental compliance', description: 'Environmental compliance tracking', category: 'PERMITS', packageTier: 'PLATFORM', agentType: 'PERMITS_AGENT', appModule: 'm-permits-inspections', featureName: 'environmental', hoursPerJob: 1.5, automationLevel: 0.75 },
  { taskNumber: 48, name: 'License renewal management', description: 'Track license renewals', category: 'PERMITS', packageTier: 'PLATFORM', agentType: 'PERMITS_AGENT', appModule: 'os-pm', featureName: 'license-renewals', hoursPerJob: 0.5, automationLevel: 0.85 },
  { taskNumber: 49, name: 'Dispute resolution workflow', description: 'Manage dispute resolution', category: 'CLIENT', packageTier: 'PLATFORM', agentType: 'CLIENT_AGENT', appModule: 'os-pm', featureName: 'dispute-resolution', hoursPerJob: 3.0, automationLevel: 0.5 },
  { taskNumber: 50, name: 'Full API access & integrations', description: 'Complete API access', category: 'TECHNOLOGY', packageTier: 'PLATFORM', agentType: 'TECHNOLOGY_AGENT', appModule: 'api', featureName: 'full-api', hoursPerJob: 0.25, automationLevel: 1.0 },
];

/**
 * Helper function to get tasks for a specific agent
 */
export function getTasksForAgent(agentType: AgentType): TaskDefinition[] {
  const agentDef = AGENT_TASK_ASSIGNMENTS[agentType];
  return PLATFORM_TASKS.filter(task => agentDef.tasks.includes(task.taskNumber));
}

/**
 * Helper function to get tasks for a specific package tier
 */
export function getTasksForPackage(tier: PackageTier): TaskDefinition[] {
  const taskNumbers = PACKAGE_TASK_MAPPING[tier];
  return PLATFORM_TASKS.filter(task => taskNumbers.includes(task.taskNumber));
}

/**
 * Helper function to check if a task is available for a package tier
 */
export function isTaskAvailable(taskNumber: number, tier: PackageTier): boolean {
  return PACKAGE_TASK_MAPPING[tier].includes(taskNumber);
}

/**
 * Helper function to get the agent responsible for a task
 */
export function getAgentForTask(taskNumber: number): AgentType | undefined {
  const task = PLATFORM_TASKS.find(t => t.taskNumber === taskNumber);
  return task?.agentType;
}

// Export all for easy importing
export default {
  AGENT_TASK_ASSIGNMENTS,
  PACKAGE_TASK_MAPPING,
  PACKAGE_CONFIG,
  PLATFORM_TASKS,
  getTasksForAgent,
  getTasksForPackage,
  isTaskAvailable,
  getAgentForTask,
};
