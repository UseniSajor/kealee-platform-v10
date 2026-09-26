/**
 * Runs a paid Site Plan order against the jurisdiction rule engine.
 *
 * This is the seam between an order and `@kealee/pascal-agents/engine`. Two
 * constraints shape everything here.
 *
 * FIRST: this runs inside the Stripe webhook, on an order that has ALREADY been
 * paid for. Throwing leaves Stripe retrying a completed payment with no
 * actionable work item — the exact failure `manual-fulfillment.ts` exists to
 * prevent. So nothing in this file throws. Every failure path returns a report
 * that says "a human does this one", which is a worse outcome than automation
 * and a far better one than a lost order.
 *
 * SECOND: the engine is imported from `/engine`, never from the package root.
 * The root re-exports the Pascal editor, which reaches `@react-three/drei` and
 * therefore React — harmless in a browser bundle, fatal in an API route.
 */

import { SitePlanOrders, Rules, Jurisdiction } from '@kealee/pascal-agents/engine'

/** The three saleable Site Plan products. */
export const SITE_PLAN_PROJECT_PATHS = [
  'preliminary_site_plan',
  'verified_site_feasibility',
  'permit_site_plan',
] as const

export type SitePlanProjectPath = (typeof SITE_PLAN_PROJECT_PATHS)[number]

export function isSitePlanOrder(projectPath: string | undefined | null): projectPath is SitePlanProjectPath {
  return SITE_PLAN_PROJECT_PATHS.includes(projectPath as SitePlanProjectPath)
}

/**
 * The jurisdiction of an order — READ, never inferred.
 *
 * It was determined from the address's geometry when the order was created
 * (`lib/jurisdiction-intake.ts`) and stored as `form_data.jurisdiction`. This
 * used to regex the intake text against twenty Prince George's town names,
 * which KEALEE.md recorded as the one place a text box was trusted over the
 * county; that is gone. An order with no determination returns null, the rule
 * report says the jurisdiction is being confirmed, and the site-plan engine
 * determines it from geometry when it runs.
 */
export function resolveJurisdiction(formData: Record<string, unknown>): string | null {
  const det = Jurisdiction.determinationFrom(formData.jurisdiction)
  if (det?.code) return det.code
  const explicit = typeof formData.jurisdictionCode === 'string' ? formData.jurisdictionCode.trim() : ''
  return explicit || null
}

export interface SitePlanRuleOutcome {
  ran: boolean
  jurisdiction: string | null
  coverage: 'automated' | 'data-assisted' | 'manual-review'
  /** Requirements determined without human review. */
  determinedRequirements: { ruleKey: string; codeSection: string; value: string; basis: string }[]
  /** Rules a specialist must confirm, routed to a discipline. */
  reviewItems: { subject: string; discipline: string; note: string }[]
  /** Intake questions that were never answered and forced a review. */
  unknownFields: string[]
  regulatorilyResolved: boolean
  permitReadyBlocked: string[]
  customerSummary: string
  opsSummary: string
  /** Present when the engine could not run at all. */
  error?: string
}

const MANUAL_REVIEW: Omit<SitePlanRuleOutcome, 'jurisdiction' | 'opsSummary'> = {
  ran: false,
  coverage: 'manual-review',
  determinedRequirements: [],
  reviewItems: [],
  unknownFields: [],
  regulatorilyResolved: false,
  permitReadyBlocked: ['Zoning analysis is produced by hand for this site.'],
  customerSummary:
    'Your zoning analysis is prepared from your jurisdiction\'s published ordinance and checked by the ' +
    'professional who reviews your package.',
}

/**
 * Evaluates one order.
 *
 * Until the rule-certification tables are migrated and a reviewer has certified
 * the Prince George's pack, every applicable rule comes back as a review item.
 * That is the correct pre-certification state, not a failure: the report still
 * tells ops exactly which requirements apply, which section governs each one,
 * and which intake questions went unanswered — work that was previously done
 * from scratch on every order.
 */
export function evaluateSitePlanOrder(input: {
  intakeId: string
  projectPath: string
  formData: Record<string, unknown>
}): SitePlanRuleOutcome {
  try {
    const jurisdiction = resolveJurisdiction(input.formData)
    if (!jurisdiction) {
      return {
        ...MANUAL_REVIEW,
        jurisdiction: null,
        opsSummary:
          'The order carries no jurisdiction determination (it predates determination at intake, or the ' +
          'geocoder could not place the address). The site-plan engine determines it from geometry when ' +
          'it runs; nothing is assumed here.',
      }
    }

    // Loaded from code today. Once the migration is applied these come from
    // `certifiable_rules` with their certifications attached, and the certified
    // ones stop producing review items — same call site, no change here.
    const rules = Rules.buildPgCertifiableRules()
    const pack = Rules.buildRulePack({
      jurisdiction,
      packVersion: Rules.PG_PACK_VERSION,
      effectiveDate: '2022-04-01',
      rules,
      coreRuleKeys: Rules.PG_CORE_RULE_KEYS,
      sources: [],
      lastRefreshedAt: new Date().toISOString(),
    })

    const report = SitePlanOrders.evaluateOrder({
      orderId: input.intakeId,
      formData: input.formData as SitePlanOrders.OrderFormData,
      jurisdictionCode: jurisdiction,
      rules,
      pack,
      // No source refresh has been persisted yet, so currency is unproven and
      // every certification would be treated as stale. That is the honest
      // default until the maintenance cycle runs against a database.
      currentSourceHashes: {},
    })

    return {
      ran: true,
      jurisdiction,
      coverage: report.coverage,
      determinedRequirements: report.determinedRequirements,
      reviewItems: report.reviewItems.map(i => ({
        subject: i.subject,
        discipline: i.discipline,
        note: i.platformNote ?? '',
      })),
      unknownFields: report.unknownFields,
      regulatorilyResolved: report.regulatorilyResolved,
      permitReadyBlocked: report.permitReadyBlocked,
      customerSummary: report.customerSummary,
      opsSummary: report.opsSummary,
    }
  } catch (err) {
    // A paid order must never be lost to an exception in analysis. Degrade to
    // the human queue and record why.
    const message = err instanceof Error ? err.message : String(err)
    return {
      ...MANUAL_REVIEW,
      jurisdiction: null,
      error: message,
      opsSummary:
        `The rule engine failed for this order (${message}). The order is NOT lost — it routes to ` +
        'manual zoning analysis. Investigate the failure separately.',
    }
  }
}

/** Shapes the outcome for `form_data`, so the order page and ops queue can read it. */
export function sitePlanRuleFormData(outcome: SitePlanRuleOutcome): Record<string, unknown> {
  return {
    sitePlanRuleReport: {
      ran: outcome.ran,
      jurisdiction: outcome.jurisdiction,
      coverage: outcome.coverage,
      determinedRequirements: outcome.determinedRequirements,
      reviewItemCount: outcome.reviewItems.length,
      reviewItems: outcome.reviewItems,
      unknownFields: outcome.unknownFields,
      regulatorilyResolved: outcome.regulatorilyResolved,
      permitReadyBlocked: outcome.permitReadyBlocked,
      customerSummary: outcome.customerSummary,
      opsSummary: outcome.opsSummary,
      error: outcome.error ?? null,
      evaluatedAt: new Date().toISOString(),
    },
  }
}
