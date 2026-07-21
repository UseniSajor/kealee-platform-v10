/**
 * Estimation Tool
 * Complete estimation and takeoff management system
 */

// Cost Database
export * from './cost-database/index.js';

// Assemblies - export with aliases for conflicting types
export {
  assemblyBuilder,
  Assembly,
  CreateAssemblyInput,
  UpdateAssemblyInput,
  AssemblyComponent,
  CreateComponentInput,
} from './assemblies/assembly-builder.js';
export {
  assemblyCalculator,
  AssemblyCalculation,
  CostBreakdown as AssemblyCostBreakdown,
  Adjustment,
  CalculationOptions as AssemblyCalculationOptions,
  AssemblyCalculator,
} from './assemblies/assembly-calculator.js';
export {
  ASSEMBLY_TEMPLATES,
  getTemplateByCode,
  templateToInput,
  AssemblyTemplate,
} from './assemblies/assembly-library.js';
export {
  assemblyImporter,
  ImportResult as AssemblyImportResult,
  CSVAssemblyRow,
  RSMeansAssembly as AssemblyRSMeansFormat,
  ImportOptions as AssemblyImportOptions,
  AssemblyImporter,
} from './assemblies/assembly-importer.js';

// Takeoff
export * from './takeoff/index.js';

// Estimates - export with aliases for conflicting types
export {
  estimateBuilder,
  Estimate,
  EstimateTotals,
  EstimateSettings,
  CreateEstimateInput,
  EstimateBuilder,
} from './estimates/estimate-builder.js';
export {
  estimateCalculator,
  CalculationOptions as EstimateCalculationOptions,
  CalculationResult,
  CostBreakdown as EstimateCostBreakdown,
  AdjustmentDetail,
  EstimateCalculator,
} from './estimates/estimate-calculator.js';
export * from './estimates/section-manager.js';
export * from './estimates/line-item-manager.js';
export * from './estimates/revision-manager.js';
export * from './estimates/export-generator.js';

// AI Features
export * from './ai/index.js';

// Orders
export * from './orders/index.js';

// Integrations - export with aliases for conflicting types
export * from './integrations/bid-engine-sync.js';
export * from './integrations/budget-tracker-sync.js';
export {
  rsMeansImporter,
  RSMeansItem,
  RSMeansAssembly,
  ImportOptions as RSMeansImportOptions,
  ImportResult as RSMeansImportResult,
  RSMeansImporter,
} from './integrations/rsmeans-importer.js';

// Worker
export {
  estimationQueue,
  createWorker,
  addJob,
  scheduleRecurringJobs,
  getQueueStats,
  cleanupWorker,
  type JobType,
  type JobData,
  type JobResult,
} from './worker.js';

// API Routes
export { registerRoutes } from './api/routes.js';
