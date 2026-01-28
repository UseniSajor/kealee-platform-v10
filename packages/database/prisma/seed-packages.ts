/**
 * Seed Script for Package Restructure
 *
 * Seeds the database with:
 * - 50 Platform Tasks
 * - 7 Agent Configurations
 * - 4 Package Configurations
 *
 * Run with: npx ts-node prisma/seed-packages.ts
 * Or: pnpm db:seed:packages
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Agent type enum values
const AgentType = {
  ESTIMATING_AGENT: 'ESTIMATING_AGENT',
  PROJECT_MANAGEMENT_AGENT: 'PROJECT_MANAGEMENT_AGENT',
  FINANCIAL_AGENT: 'FINANCIAL_AGENT',
  SUBCONTRACTOR_AGENT: 'SUBCONTRACTOR_AGENT',
  PERMITS_AGENT: 'PERMITS_AGENT',
  CLIENT_AGENT: 'CLIENT_AGENT',
  TECHNOLOGY_AGENT: 'TECHNOLOGY_AGENT',
} as const;

// Task category enum values
const TaskCategory = {
  ESTIMATING: 'ESTIMATING',
  PROJECT_MANAGEMENT: 'PROJECT_MANAGEMENT',
  FINANCIAL: 'FINANCIAL',
  SUBCONTRACTOR: 'SUBCONTRACTOR',
  PERMITS: 'PERMITS',
  CLIENT: 'CLIENT',
  TECHNOLOGY: 'TECHNOLOGY',
} as const;

// Package tier enum values
const PackageTier = {
  STARTER: 'STARTER',
  PROFESSIONAL: 'PROFESSIONAL',
  ENTERPRISE: 'ENTERPRISE',
  PLATFORM: 'PLATFORM',
} as const;

// Agent configurations
const agentConfigs = [
  {
    agentType: AgentType.ESTIMATING_AGENT,
    name: 'Estimating Agent',
    description: 'Handles takeoffs, pricing, bid management, and cost analysis',
    assignedTasks: [1, 21, 22, 23, 24, 41, 42, 43],
    maxConcurrent: 10,
    priority: 8,
  },
  {
    agentType: AgentType.PROJECT_MANAGEMENT_AGENT,
    name: 'Project Management Agent',
    description: 'Manages schedules, documentation, quality, and field operations',
    assignedTasks: [2, 3, 7, 9, 10, 17, 25, 26, 27, 28, 40],
    maxConcurrent: 15,
    priority: 9,
  },
  {
    agentType: AgentType.FINANCIAL_AGENT,
    name: 'Financial Agent',
    description: 'Handles billing, retention, cash flow, and financial tracking',
    assignedTasks: [11, 12, 13, 14, 29, 30, 31, 32, 44, 45],
    maxConcurrent: 10,
    priority: 8,
  },
  {
    agentType: AgentType.SUBCONTRACTOR_AGENT,
    name: 'Subcontractor Agent',
    description: 'Manages sub prequalification, contracts, and performance',
    assignedTasks: [15, 16, 18, 33, 34, 35, 46],
    maxConcurrent: 8,
    priority: 7,
  },
  {
    agentType: AgentType.PERMITS_AGENT,
    name: 'Permits & Compliance Agent',
    description: 'Handles permits, inspections, safety, and compliance',
    assignedTasks: [19, 20, 36, 37, 47, 48],
    maxConcurrent: 8,
    priority: 7,
  },
  {
    agentType: AgentType.CLIENT_AGENT,
    name: 'Client Communication Agent',
    description: 'Manages owner portal, communications, and selections',
    assignedTasks: [4, 5, 8, 38, 39, 49],
    maxConcurrent: 12,
    priority: 8,
  },
  {
    agentType: AgentType.TECHNOLOGY_AGENT,
    name: 'Technology & Integration Agent',
    description: 'Handles mobile access, document control, and API integrations',
    assignedTasks: [6, 40, 50],
    maxConcurrent: 5,
    priority: 6,
  },
];

// Package configurations
const packageConfigs = [
  {
    tier: PackageTier.STARTER,
    name: 'Package A: Starter',
    minPrice: 4900,
    maxPrice: 19900,
    minJobs: 1,
    maxJobs: 5,
    featureCount: 6,
    includedTasks: [1, 2, 3, 4, 5, 6],
    staffingRatio: 10.0,
  },
  {
    tier: PackageTier.PROFESSIONAL,
    name: 'Package B: Professional',
    minPrice: 175000,
    maxPrice: 450000,
    minJobs: 5,
    maxJobs: 25,
    featureCount: 20,
    includedTasks: Array.from({ length: 20 }, (_, i) => i + 1),
    staffingRatio: 8.0,
  },
  {
    tier: PackageTier.ENTERPRISE,
    name: 'Package C: Enterprise',
    minPrice: 850000,
    maxPrice: 1650000,
    minJobs: 25,
    maxJobs: 100,
    featureCount: 40,
    includedTasks: Array.from({ length: 40 }, (_, i) => i + 1),
    staffingRatio: 6.0,
  },
  {
    tier: PackageTier.PLATFORM,
    name: 'Package D: Platform',
    minPrice: 2500000,
    maxPrice: 5000000,
    minJobs: 100,
    maxJobs: -1,
    featureCount: 50,
    includedTasks: Array.from({ length: 50 }, (_, i) => i + 1),
    staffingRatio: 5.0,
  },
];

// Platform tasks (all 50)
const platformTasks = [
  // Package A: Starter (Tasks 1-6)
  { taskNumber: 1, name: 'Bid deadline management', description: 'Track and manage bid submission deadlines', category: TaskCategory.ESTIMATING, packageTier: PackageTier.STARTER, agentType: AgentType.ESTIMATING_AGENT, appModule: 'os-pm', featureName: 'bid-deadlines', hoursPerJob: 0.5, automationLevel: 0.8 },
  { taskNumber: 2, name: 'Daily progress documentation', description: 'Document daily progress with photos and notes', category: TaskCategory.PROJECT_MANAGEMENT, packageTier: PackageTier.STARTER, agentType: AgentType.PROJECT_MANAGEMENT_AGENT, appModule: 'os-pm', featureName: 'daily-logs', hoursPerJob: 0.5, automationLevel: 0.6 },
  { taskNumber: 3, name: 'Punch list management', description: 'Create and track punch list items', category: TaskCategory.PROJECT_MANAGEMENT, packageTier: PackageTier.STARTER, agentType: AgentType.PROJECT_MANAGEMENT_AGENT, appModule: 'os-pm', featureName: 'punch-lists', hoursPerJob: 1.0, automationLevel: 0.5 },
  { taskNumber: 4, name: 'Owner dashboard portal', description: 'Client-facing project dashboard', category: TaskCategory.CLIENT, packageTier: PackageTier.STARTER, agentType: AgentType.CLIENT_AGENT, appModule: 'm-project-owner', featureName: 'owner-dashboard', hoursPerJob: 0.25, automationLevel: 0.9 },
  { taskNumber: 5, name: 'Automated progress reporting', description: 'Generate and send progress reports', category: TaskCategory.CLIENT, packageTier: PackageTier.STARTER, agentType: AgentType.CLIENT_AGENT, appModule: 'os-pm', featureName: 'progress-reports', hoursPerJob: 0.5, automationLevel: 0.85 },
  { taskNumber: 6, name: 'Mobile field access', description: 'Mobile app for field data entry', category: TaskCategory.TECHNOLOGY, packageTier: PackageTier.STARTER, agentType: AgentType.TECHNOLOGY_AGENT, appModule: 'os-pm', featureName: 'mobile-access', hoursPerJob: 0.25, automationLevel: 0.9 },

  // Package B: Professional (Tasks 7-20)
  { taskNumber: 7, name: 'Schedule coordination with Gantt', description: 'Interactive Gantt chart scheduling', category: TaskCategory.PROJECT_MANAGEMENT, packageTier: PackageTier.PROFESSIONAL, agentType: AgentType.PROJECT_MANAGEMENT_AGENT, appModule: 'os-pm', featureName: 'gantt-scheduler', hoursPerJob: 2.0, automationLevel: 0.6 },
  { taskNumber: 8, name: 'RFI management portal', description: 'Request for Information tracking', category: TaskCategory.CLIENT, packageTier: PackageTier.PROFESSIONAL, agentType: AgentType.CLIENT_AGENT, appModule: 'os-pm', featureName: 'rfi-management', hoursPerJob: 1.0, automationLevel: 0.7 },
  { taskNumber: 9, name: 'Submittal processing workflow', description: 'Track and process submittals', category: TaskCategory.PROJECT_MANAGEMENT, packageTier: PackageTier.PROFESSIONAL, agentType: AgentType.PROJECT_MANAGEMENT_AGENT, appModule: 'os-pm', featureName: 'submittals', hoursPerJob: 1.5, automationLevel: 0.65 },
  { taskNumber: 10, name: 'Change order tracking', description: 'Track change orders through approval', category: TaskCategory.PROJECT_MANAGEMENT, packageTier: PackageTier.PROFESSIONAL, agentType: AgentType.PROJECT_MANAGEMENT_AGENT, appModule: 'os-pm', featureName: 'change-orders', hoursPerJob: 1.0, automationLevel: 0.7 },
  { taskNumber: 11, name: 'AIA pay application generation', description: 'Generate AIA G702/G703 forms', category: TaskCategory.FINANCIAL, packageTier: PackageTier.PROFESSIONAL, agentType: AgentType.FINANCIAL_AGENT, appModule: 'os-pm', featureName: 'pay-applications', hoursPerJob: 2.0, automationLevel: 0.85 },
  { taskNumber: 12, name: 'Retention tracking', description: 'Track and manage retention amounts', category: TaskCategory.FINANCIAL, packageTier: PackageTier.PROFESSIONAL, agentType: AgentType.FINANCIAL_AGENT, appModule: 'os-pm', featureName: 'retention-tracking', hoursPerJob: 0.5, automationLevel: 0.9 },
  { taskNumber: 13, name: 'Lien waiver automation', description: 'Automate lien waiver requests', category: TaskCategory.FINANCIAL, packageTier: PackageTier.PROFESSIONAL, agentType: AgentType.FINANCIAL_AGENT, appModule: 'os-pm', featureName: 'lien-waivers', hoursPerJob: 0.5, automationLevel: 0.85 },
  { taskNumber: 14, name: 'Budget vs actual reporting', description: 'Compare budget to actual costs', category: TaskCategory.FINANCIAL, packageTier: PackageTier.PROFESSIONAL, agentType: AgentType.FINANCIAL_AGENT, appModule: 'os-pm', featureName: 'budget-reporting', hoursPerJob: 1.0, automationLevel: 0.8 },
  { taskNumber: 15, name: 'Subcontractor prequalification', description: 'Prequalify subcontractors', category: TaskCategory.SUBCONTRACTOR, packageTier: PackageTier.PROFESSIONAL, agentType: AgentType.SUBCONTRACTOR_AGENT, appModule: 'os-pm', featureName: 'sub-prequal', hoursPerJob: 2.0, automationLevel: 0.7 },
  { taskNumber: 16, name: 'Scope of work matrix', description: 'Create and manage scope matrices', category: TaskCategory.SUBCONTRACTOR, packageTier: PackageTier.PROFESSIONAL, agentType: AgentType.SUBCONTRACTOR_AGENT, appModule: 'os-pm', featureName: 'scope-matrix', hoursPerJob: 1.5, automationLevel: 0.6 },
  { taskNumber: 17, name: 'Schedule compliance tracking', description: 'Track schedule compliance', category: TaskCategory.PROJECT_MANAGEMENT, packageTier: PackageTier.PROFESSIONAL, agentType: AgentType.PROJECT_MANAGEMENT_AGENT, appModule: 'os-pm', featureName: 'schedule-compliance', hoursPerJob: 0.5, automationLevel: 0.8 },
  { taskNumber: 18, name: 'Digital contract execution', description: 'E-signature for contracts', category: TaskCategory.SUBCONTRACTOR, packageTier: PackageTier.PROFESSIONAL, agentType: AgentType.SUBCONTRACTOR_AGENT, appModule: 'os-pm', featureName: 'digital-contracts', hoursPerJob: 1.0, automationLevel: 0.9 },
  { taskNumber: 19, name: 'Permit application wizard', description: 'Guided permit application', category: TaskCategory.PERMITS, packageTier: PackageTier.PROFESSIONAL, agentType: AgentType.PERMITS_AGENT, appModule: 'm-permits-inspections', featureName: 'permit-wizard', hoursPerJob: 2.0, automationLevel: 0.75 },
  { taskNumber: 20, name: 'Inspection scheduling', description: 'Schedule and track inspections', category: TaskCategory.PERMITS, packageTier: PackageTier.PROFESSIONAL, agentType: AgentType.PERMITS_AGENT, appModule: 'm-permits-inspections', featureName: 'inspection-scheduling', hoursPerJob: 1.0, automationLevel: 0.8 },

  // Package C: Enterprise (Tasks 21-40)
  { taskNumber: 21, name: 'AI-powered quantity takeoffs', description: 'AI extraction from plans', category: TaskCategory.ESTIMATING, packageTier: PackageTier.ENTERPRISE, agentType: AgentType.ESTIMATING_AGENT, appModule: 'os-pm', featureName: 'ai-takeoffs', hoursPerJob: 4.0, automationLevel: 0.85 },
  { taskNumber: 22, name: 'Material price tracking', description: 'Track material prices in real-time', category: TaskCategory.ESTIMATING, packageTier: PackageTier.ENTERPRISE, agentType: AgentType.ESTIMATING_AGENT, appModule: 'os-pm', featureName: 'material-pricing', hoursPerJob: 0.5, automationLevel: 0.9 },
  { taskNumber: 23, name: 'Labor rate analytics', description: 'Analyze labor rates and productivity', category: TaskCategory.ESTIMATING, packageTier: PackageTier.ENTERPRISE, agentType: AgentType.ESTIMATING_AGENT, appModule: 'os-pm', featureName: 'labor-analytics', hoursPerJob: 1.0, automationLevel: 0.8 },
  { taskNumber: 24, name: 'Bid broadcast to subs', description: 'Broadcast bids to subcontractors', category: TaskCategory.ESTIMATING, packageTier: PackageTier.ENTERPRISE, agentType: AgentType.ESTIMATING_AGENT, appModule: 'os-pm', featureName: 'bid-broadcast', hoursPerJob: 1.0, automationLevel: 0.85 },
  { taskNumber: 25, name: 'AI meeting transcription', description: 'Transcribe and summarize meetings', category: TaskCategory.PROJECT_MANAGEMENT, packageTier: PackageTier.ENTERPRISE, agentType: AgentType.PROJECT_MANAGEMENT_AGENT, appModule: 'os-pm', featureName: 'meeting-transcription', hoursPerJob: 0.5, automationLevel: 0.95 },
  { taskNumber: 26, name: 'Weather delay tracking', description: 'Track weather delays automatically', category: TaskCategory.PROJECT_MANAGEMENT, packageTier: PackageTier.ENTERPRISE, agentType: AgentType.PROJECT_MANAGEMENT_AGENT, appModule: 'os-pm', featureName: 'weather-delays', hoursPerJob: 0.25, automationLevel: 0.9 },
  { taskNumber: 27, name: 'QC inspection checklists', description: 'Quality control checklists', category: TaskCategory.PROJECT_MANAGEMENT, packageTier: PackageTier.ENTERPRISE, agentType: AgentType.PROJECT_MANAGEMENT_AGENT, appModule: 'os-pm', featureName: 'qc-checklists', hoursPerJob: 1.0, automationLevel: 0.7 },
  { taskNumber: 28, name: 'As-built documentation', description: 'As-built document management', category: TaskCategory.PROJECT_MANAGEMENT, packageTier: PackageTier.ENTERPRISE, agentType: AgentType.PROJECT_MANAGEMENT_AGENT, appModule: 'os-pm', featureName: 'as-builts', hoursPerJob: 2.0, automationLevel: 0.6 },
  { taskNumber: 29, name: 'Cash flow forecasting', description: 'Forecast project cash flow', category: TaskCategory.FINANCIAL, packageTier: PackageTier.ENTERPRISE, agentType: AgentType.FINANCIAL_AGENT, appModule: 'os-pm', featureName: 'cash-flow', hoursPerJob: 1.5, automationLevel: 0.8 },
  { taskNumber: 30, name: 'Job costing dashboard', description: 'Real-time job costing analytics', category: TaskCategory.FINANCIAL, packageTier: PackageTier.ENTERPRISE, agentType: AgentType.FINANCIAL_AGENT, appModule: 'os-pm', featureName: 'job-costing', hoursPerJob: 1.0, automationLevel: 0.85 },
  { taskNumber: 31, name: 'AP optimization', description: 'Optimize accounts payable', category: TaskCategory.FINANCIAL, packageTier: PackageTier.ENTERPRISE, agentType: AgentType.FINANCIAL_AGENT, appModule: 'os-pm', featureName: 'ap-optimization', hoursPerJob: 1.0, automationLevel: 0.75 },
  { taskNumber: 32, name: 'COI tracking', description: 'Certificate of Insurance tracking', category: TaskCategory.FINANCIAL, packageTier: PackageTier.ENTERPRISE, agentType: AgentType.FINANCIAL_AGENT, appModule: 'os-pm', featureName: 'coi-tracking', hoursPerJob: 0.5, automationLevel: 0.85 },
  { taskNumber: 33, name: 'Back-charge management', description: 'Manage back-charges to subs', category: TaskCategory.SUBCONTRACTOR, packageTier: PackageTier.ENTERPRISE, agentType: AgentType.SUBCONTRACTOR_AGENT, appModule: 'os-pm', featureName: 'back-charges', hoursPerJob: 1.0, automationLevel: 0.7 },
  { taskNumber: 34, name: 'Sub performance ratings', description: 'Rate subcontractor performance', category: TaskCategory.SUBCONTRACTOR, packageTier: PackageTier.ENTERPRISE, agentType: AgentType.SUBCONTRACTOR_AGENT, appModule: 'os-pm', featureName: 'sub-ratings', hoursPerJob: 0.5, automationLevel: 0.8 },
  { taskNumber: 35, name: 'Sub pay app review', description: 'Review subcontractor pay apps', category: TaskCategory.SUBCONTRACTOR, packageTier: PackageTier.ENTERPRISE, agentType: AgentType.SUBCONTRACTOR_AGENT, appModule: 'os-pm', featureName: 'sub-pay-review', hoursPerJob: 1.5, automationLevel: 0.7 },
  { taskNumber: 36, name: 'Code compliance monitoring', description: 'Monitor code compliance', category: TaskCategory.PERMITS, packageTier: PackageTier.ENTERPRISE, agentType: AgentType.PERMITS_AGENT, appModule: 'm-permits-inspections', featureName: 'code-compliance', hoursPerJob: 1.0, automationLevel: 0.75 },
  { taskNumber: 37, name: 'OSHA safety manager', description: 'OSHA compliance and safety', category: TaskCategory.PERMITS, packageTier: PackageTier.ENTERPRISE, agentType: AgentType.PERMITS_AGENT, appModule: 'os-pm', featureName: 'safety-manager', hoursPerJob: 1.5, automationLevel: 0.7 },
  { taskNumber: 38, name: 'Selection coordination', description: 'Coordinate owner selections', category: TaskCategory.CLIENT, packageTier: PackageTier.ENTERPRISE, agentType: AgentType.CLIENT_AGENT, appModule: 'm-project-owner', featureName: 'selections', hoursPerJob: 2.0, automationLevel: 0.6 },
  { taskNumber: 39, name: 'Warranty portal', description: 'Warranty management portal', category: TaskCategory.CLIENT, packageTier: PackageTier.ENTERPRISE, agentType: AgentType.CLIENT_AGENT, appModule: 'm-project-owner', featureName: 'warranty-portal', hoursPerJob: 1.0, automationLevel: 0.8 },
  { taskNumber: 40, name: 'Document version control', description: 'Version control for documents', category: TaskCategory.PROJECT_MANAGEMENT, packageTier: PackageTier.ENTERPRISE, agentType: AgentType.PROJECT_MANAGEMENT_AGENT, appModule: 'os-pm', featureName: 'doc-versioning', hoursPerJob: 0.5, automationLevel: 0.9 },

  // Package D: Platform (Tasks 41-50)
  { taskNumber: 41, name: 'AI scope gap analysis', description: 'AI analysis of scope gaps', category: TaskCategory.ESTIMATING, packageTier: PackageTier.PLATFORM, agentType: AgentType.ESTIMATING_AGENT, appModule: 'os-pm', featureName: 'scope-gap-analysis', hoursPerJob: 2.0, automationLevel: 0.9 },
  { taskNumber: 42, name: 'Competitive bid analytics', description: 'Analyze competitive bids', category: TaskCategory.ESTIMATING, packageTier: PackageTier.PLATFORM, agentType: AgentType.ESTIMATING_AGENT, appModule: 'os-pm', featureName: 'bid-analytics', hoursPerJob: 1.5, automationLevel: 0.85 },
  { taskNumber: 43, name: 'Historical cost intelligence', description: 'AI-powered historical cost data', category: TaskCategory.ESTIMATING, packageTier: PackageTier.PLATFORM, agentType: AgentType.ESTIMATING_AGENT, appModule: 'os-pm', featureName: 'cost-intelligence', hoursPerJob: 1.0, automationLevel: 0.9 },
  { taskNumber: 44, name: 'Bonding capacity dashboard', description: 'Track bonding capacity', category: TaskCategory.FINANCIAL, packageTier: PackageTier.PLATFORM, agentType: AgentType.FINANCIAL_AGENT, appModule: 'os-pm', featureName: 'bonding-capacity', hoursPerJob: 0.5, automationLevel: 0.8 },
  { taskNumber: 45, name: 'Tax document automation', description: 'Automate tax document generation', category: TaskCategory.FINANCIAL, packageTier: PackageTier.PLATFORM, agentType: AgentType.FINANCIAL_AGENT, appModule: 'os-pm', featureName: 'tax-automation', hoursPerJob: 2.0, automationLevel: 0.85 },
  { taskNumber: 46, name: 'Workforce capacity tracking', description: 'Track workforce capacity', category: TaskCategory.SUBCONTRACTOR, packageTier: PackageTier.PLATFORM, agentType: AgentType.SUBCONTRACTOR_AGENT, appModule: 'os-pm', featureName: 'workforce-capacity', hoursPerJob: 1.0, automationLevel: 0.8 },
  { taskNumber: 47, name: 'Environmental compliance', description: 'Environmental compliance tracking', category: TaskCategory.PERMITS, packageTier: PackageTier.PLATFORM, agentType: AgentType.PERMITS_AGENT, appModule: 'm-permits-inspections', featureName: 'environmental', hoursPerJob: 1.5, automationLevel: 0.75 },
  { taskNumber: 48, name: 'License renewal management', description: 'Track license renewals', category: TaskCategory.PERMITS, packageTier: PackageTier.PLATFORM, agentType: AgentType.PERMITS_AGENT, appModule: 'os-pm', featureName: 'license-renewals', hoursPerJob: 0.5, automationLevel: 0.85 },
  { taskNumber: 49, name: 'Dispute resolution workflow', description: 'Manage dispute resolution', category: TaskCategory.CLIENT, packageTier: PackageTier.PLATFORM, agentType: AgentType.CLIENT_AGENT, appModule: 'os-pm', featureName: 'dispute-resolution', hoursPerJob: 3.0, automationLevel: 0.5 },
  { taskNumber: 50, name: 'Full API access & integrations', description: 'Complete API access', category: TaskCategory.TECHNOLOGY, packageTier: PackageTier.PLATFORM, agentType: AgentType.TECHNOLOGY_AGENT, appModule: 'api', featureName: 'full-api', hoursPerJob: 0.25, automationLevel: 1.0 },
];

async function main() {
  console.log('Starting package restructure seed...\n');

  // Seed Platform Tasks
  console.log('Seeding Platform Tasks (50 tasks)...');
  for (const task of platformTasks) {
    await prisma.platformTask.upsert({
      where: { taskNumber: task.taskNumber },
      update: task,
      create: task,
    });
    process.stdout.write(`  Task ${task.taskNumber}: ${task.name}\n`);
  }
  console.log('  Done!\n');

  // Seed Agent Configurations
  console.log('Seeding Agent Configurations (7 agents)...');
  for (const agent of agentConfigs) {
    await prisma.agentConfig.upsert({
      where: { agentType: agent.agentType },
      update: agent,
      create: agent,
    });
    console.log(`  ${agent.name} (${agent.assignedTasks.length} tasks)`);
  }
  console.log('  Done!\n');

  // Seed Package Configurations
  console.log('Seeding Package Configurations (4 packages)...');
  for (const pkg of packageConfigs) {
    await prisma.packageConfig.upsert({
      where: { tier: pkg.tier },
      update: pkg,
      create: pkg,
    });
    console.log(`  ${pkg.name} (${pkg.featureCount} features, $${pkg.minPrice / 100}-$${pkg.maxPrice / 100}/mo)`);
  }
  console.log('  Done!\n');

  // Print summary
  console.log('========================================');
  console.log('Seed Summary');
  console.log('========================================');
  console.log(`Platform Tasks: ${platformTasks.length}`);
  console.log(`Agent Configs: ${agentConfigs.length}`);
  console.log(`Package Configs: ${packageConfigs.length}`);
  console.log('\nPackage restructure seed completed!');
}

main()
  .catch((e) => {
    console.error('Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
