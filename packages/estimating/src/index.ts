/**
 * @kealee/estimating
 *
 * Marketplace estimating engine — assembly library, quick pricing, bid validation.
 */

export { EstimatingService } from './estimating.service'
export type { SuggestedPriceResult, BidValidationResult, AssemblyLibraryQuery } from './estimating.service'

export { PROJECT_TYPE_ASSEMBLIES, getProjectTypes, getAssembliesForProjectType } from './project-type-mappings'
export type { AssemblyMapping, ProjectTypeConfig } from './project-type-mappings'

export { MARKETPLACE_ASSEMBLIES, seedAssemblyLibrary } from './seed-assemblies'

export { CTC_SAMPLE_TASKS, seedCTCLibrary } from './seed-ctc'
export type { CTCSeedTask } from './seed-ctc'

export {
  ctcToMarketplace,
  marketplaceToCTC,
  getAllCrosswalkEntries,
  getCrosswalkByConfidence,
  findClosestMarketplaceAssembly,
  buildFullCrosswalk,
} from './ctc-crosswalk'
export type { CrosswalkEntry } from './ctc-crosswalk'

export { ScopeAnalyzer } from './scope-analyzer'
export type {
  ScopeAnalysisInput,
  ScopeAnalysisResult,
  ScopeLineItem,
  ScopeAssumption,
  ClarifyingQuestion,
  RefinementInput,
} from './scope-analyzer'
