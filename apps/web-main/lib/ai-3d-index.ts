/**
 * Claude 3D Design Service — Public API
 *
 * Exports: 3D model generation, status polling, tier gating, quality selection.
 * For internal use by v30 bot orchestration and design output handlers.
 */

export { generate3DModel, get3DModelStatus, qualityForTier, is3DAvailable, pick3DProvider } from './ai-3d'
export type {
  ThreeDProvider,
  ThreeDQuality,
  Generate3DInput,
  Generate3DResult,
  ThreeDStatusResult,
} from './ai-3d'
