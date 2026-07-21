/**
 * Design Output + Tier Integration Handler
 *
 * Determines which tier the customer paid for, checks if 3D is available,
 * and integrates 3D generation into the design output workflow.
 */

import type { V30DesignBotOutput } from '@kealee/kealee-agent-stack'
import { integrateDesignWith3D } from '@kealee/kealee-agent-stack/v30/design-3d-integration'

/**
 * Tier information extracted from Stripe checkout session or product selection.
 */
export interface TierInfo {
  tier: number // 1 = Basic, 2 = Premium, 3 = Premium+
  productId: string
  packageName: string // "home-readiness", "launch-full", etc.
  stripeCheckoutSessionId?: string
}

/**
 * Get tier from Stripe checkout session ID.
 * Maps Stripe Price ID → tier level.
 */
export async function getTierFromCheckoutSession(
  checkoutSessionId: string,
): Promise<TierInfo | null> {
  try {
    // TODO: Fetch from Stripe or from intake database
    // Example:
    // const session = await stripe.checkout.sessions.retrieve(checkoutSessionId)
    // const priceId = session.line_items[0].price_id
    // return mapPriceIdToTier(priceId)

    console.warn('[DesignTierHandler] getTierFromCheckoutSession not yet implemented')
    return null
  } catch (err) {
    console.error('[DesignTierHandler] Failed to get tier from checkout:', err)
    return null
  }
}

/**
 * Get tier from intake form data.
 * The intake contains the selected product/package which determines tier.
 */
export function getTierFromIntake(intakeData: Record<string, any>): TierInfo | null {
  try {
    // Extract tier from intake form data
    // Structure: intakeData.selectedProduct = { tier: 2, productId: "design-estimate-permit", ... }

    const selectedProduct = intakeData.selectedProduct
    if (!selectedProduct || typeof selectedProduct.tier !== 'number') {
      return null
    }

    return {
      tier: selectedProduct.tier,
      productId: selectedProduct.productId || 'unknown',
      packageName: selectedProduct.packageName || mapTierToPackageName(selectedProduct.tier),
      stripeCheckoutSessionId: intakeData.stripeCheckoutSessionId,
    }
  } catch (err) {
    console.error('[DesignTierHandler] Failed to extract tier from intake:', err)
    return null
  }
}

/**
 * Map tier number to user-friendly package name.
 */
function mapTierToPackageName(tier: number): string {
  switch (tier) {
    case 1:
      return 'Basic Package'
    case 2:
      return 'Premium Package'
    case 3:
      return 'Premium+ Package'
    default:
      return `Tier ${tier}`
  }
}

/**
 * Process design output after DesignBot completes.
 * Integrates 3D generation if tier supports it.
 *
 * Called in the design output handler (e.g., concept/generate route or v30-trigger).
 */
export async function processDesignOutputWithTier(
  designOutput: V30DesignBotOutput,
  projectId: string,
  tier: number,
  projectType: string,
  intakeData?: Record<string, any>,
): Promise<V30DesignBotOutput> {
  // If tier doesn't support 3D, return as-is
  if (tier < 2) {
    console.log(`[DesignTierHandler] Tier ${tier} does not include 3D models`)
    return designOutput
  }

  // Tier 2+ supports 3D — integrate it
  console.log(
    `[DesignTierHandler] Processing design for tier ${tier} with 3D integration (project: ${projectId})`,
  )

  try {
    const result = await integrateDesignWith3D({
      projectId,
      tier,
      projectType,
      designOutput,
      propertyContext: extractPropertyContext(intakeData),
      intake: intakeData,
    })

    console.log(
      `[DesignTierHandler] 3D integration complete: ${result.threeD?.jobCount || 0} models submitted`,
    )

    return result.designOutput
  } catch (err) {
    console.error('[DesignTierHandler] 3D integration failed, returning design without 3D:', err)
    // Non-fatal: return design without 3D
    return designOutput
  }
}

/**
 * Extract relevant property context for 3D generation.
 */
function extractPropertyContext(intakeData?: Record<string, any>): Record<string, any> {
  if (!intakeData) return {}

  return {
    propertyType: intakeData.propertyType || 'residential',
    yearBuilt: intakeData.yearBuilt || 'unknown',
    squareFeet: intakeData.squareFeet,
    location: intakeData.location,
    address: intakeData.address,
    roomCount: intakeData.roomCount,
    stylePreference: intakeData.stylePreference,
  }
}

/**
 * Check if design has 3D models ready for display.
 */
export function isDesign3DReady(designOutput: V30DesignBotOutput): boolean {
  if (!Array.isArray(designOutput.concepts)) return false

  return designOutput.concepts.every(concept => {
    const models = (concept as any).threeDModels
    return models?.status === 'completed' && models?.modelUrl
  })
}

/**
 * Get 3D status for a design (for polling in UI).
 */
export function getDesign3DStatus(designOutput: V30DesignBotOutput): {
  ready: boolean
  pending: number
  completed: number
  failed: number
} {
  if (!Array.isArray(designOutput.concepts)) {
    return { ready: false, pending: 0, completed: 0, failed: 0 }
  }

  let pending = 0,
    completed = 0,
    failed = 0

  for (const concept of designOutput.concepts) {
    const models = (concept as any).threeDModels
    if (!models) continue

    switch (models.status) {
      case 'queued':
      case 'processing':
        pending++
        break
      case 'completed':
        completed++
        break
      case 'failed':
        failed++
        break
    }
  }

  return {
    ready: pending === 0 && completed > 0 && failed === 0,
    pending,
    completed,
    failed,
  }
}
