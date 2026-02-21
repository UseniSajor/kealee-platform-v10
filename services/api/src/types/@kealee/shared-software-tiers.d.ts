declare module '@kealee/shared/software-tiers' {
  export type SoftwareTier = string
  export type PMServiceTier = string
  export type FeatureKey = string

  export const SOFTWARE_TIERS: Record<string, any>
  export const PM_SERVICE_TIERS: Record<string, any>
  export const ENTERPRISE_SUB_TIERS: Record<string, any>
  export const TIER_FEATURES: Record<string, any>

  export function isAtLimit(...args: any[]): boolean
  export function isApproachingLimit(...args: any[]): boolean
  export function isHardLocked(...args: any[]): boolean
  export function hasFeature(...args: any[]): boolean
  export function getMinimumTier(...args: any[]): any
}
