/**
 * The v30 bots, computed without a language model.
 *
 * Each engine turns the order's structured intake (the nine answers, the
 * features bought, the lot context, the jurisdiction determined at intake)
 * into the same JSON shape the model-backed bot returns. Every number comes
 * from platform data: construction cost from the assembly library
 * (`costs.ts`), product price and complexity from the v30 pricing formula,
 * permit applicability from the scope rules.
 *
 * What a model would have to INVENT is not produced here: no contractor names,
 * no permit fees or review times, no agency names beyond the jurisdiction
 * determined from geometry. Where a bot's deliverable cannot be computed, the
 * engine returns `staff` with the reason, and the caller records the bot as
 * needing a person — never as complete.
 */

import { analyzeV30Intake } from '../intake-analyzer'
import { requiresPermitsForScope, isGardenLandscapeScope } from '../scope-rules'
import type { V30BotType, V30IntakeFormAnswers } from '../types'
import { priceRecipe, recipeFor, type CostTier, type PricedEstimate } from './costs'

export type EngineResult =
  | { kind: 'complete'; output: Record<string, unknown> }
  | { kind: 'staff'; reason: string; partial?: Record<string, unknown> }

export interface EngineInput {
  answers: V30IntakeFormAnswers
  projectPath?: string
  features: string[]
  lotContext: Record<string, unknown> | null
  jurisdiction: { code: string | null; name: string | null; municipality: string | null } | null
  raw: Record<string, unknown>
}

const TIERS: CostTier[] = ['BUDGET', 'BALANCED', 'PREMIUM']
const money = (n: number) => `$${Math.round(n).toLocaleString('en-US')}`
const scopeText = (i: EngineInput) => `${i.answers.primaryScope} ${i.projectPath ?? ''}`

/** Reads the intake answers from whatever shape the order carries; missing answers stay empty, never invented. */
export function engineInputFrom(inputData: Record<string, unknown>): EngineInput {
  const intake = (inputData.intake && typeof inputData.intake === 'object' ? inputData.intake : inputData) as Record<string, unknown>
  const s = (k: string) => (typeof intake[k] === 'string' ? (intake[k] as string) : '')
  const util = (intake.utilities && typeof intake.utilities === 'object' ? intake.utilities : {}) as V30IntakeFormAnswers['utilities']
  const answers: V30IntakeFormAnswers = {
    propertyType: s('propertyType'), primaryScope: s('primaryScope') || String(inputData.projectPath ?? ''),
    budgetRange: s('budgetRange'), timeline: s('timeline'), location: s('location') || s('address') || String(inputData.address ?? ''),
    squareFeet: Number(intake.squareFeet ?? 0) || 0, yearBuilt: s('yearBuilt'), utilities: util,
    codeConsiderations: Array.isArray(intake.codeConsiderations) ? (intake.codeConsiderations as string[]) : [],
  }
  const det = (inputData.jurisdiction ?? (intake as Record<string, unknown>).jurisdiction) as Record<string, unknown> | undefined
  const jurisdiction = det && typeof det === 'object'
    ? {
      code: typeof det.code === 'string' ? det.code : null,
      name: typeof det.name === 'string' ? det.name : null,
      municipality: det.municipality && typeof det.municipality === 'object' ? String((det.municipality as Record<string, unknown>).name ?? '') || null : null,
    }
    : null
  return {
    answers,
    projectPath: typeof inputData.projectPath === 'string' ? inputData.projectPath : undefined,
    features: Array.isArray(inputData.features) ? (inputData.features as string[]) : [],
    lotContext: inputData.lotContext && typeof inputData.lotContext === 'object' ? (inputData.lotContext as Record<string, unknown>) : null,
    jurisdiction, raw: inputData,
  }
}

function priceAllTiers(i: EngineInput): Record<CostTier, PricedEstimate> | null {
  const recipe = recipeFor(scopeText(i))
  if (!recipe) return null
  return Object.fromEntries(TIERS.map(t => [t, priceRecipe(recipe, t, i.answers.squareFeet, i.answers.location)])) as Record<CostTier, PricedEstimate>
}

const NO_RECIPE = (i: EngineInput) =>
  `No cost recipe covers "${i.answers.primaryScope || i.projectPath || 'this scope'}"; the assembly library prices kitchens, baths, basements, additions, decks, landscape, flooring and interior painting. Staff prepare this estimate.`

// ── Intake ──────────────────────────────────────────────────────────────────
function intake(i: EngineInput): EngineResult {
  return { kind: 'complete', output: analyzeV30Intake(i.answers, undefined, i.projectPath) as unknown as Record<string, unknown> }
}

// ── Estimate ────────────────────────────────────────────────────────────────
function estimate(i: EngineInput): EngineResult {
  const p = priceAllTiers(i)
  if (!p) return { kind: 'staff', reason: NO_RECIPE(i) }
  const mid = p.BALANCED
  const byTrade: Record<string, string> = {}
  for (const trade of Object.keys(mid.byTrade)) {
    byTrade[trade] = `${money(p.BUDGET.byTrade[trade] ?? 0)}–${money(p.PREMIUM.byTrade[trade] ?? 0)}`
  }
  return {
    kind: 'complete',
    output: {
      mode: 'PRELIMINARY',
      projectType: mid.label,
      scope: `${mid.sqft.toLocaleString()} sq ft ${mid.label.toLowerCase()}${i.answers.location ? `, ${i.answers.location}` : ''}`,
      costRange: { lowEstimate: p.BUDGET.total, highEstimate: p.PREMIUM.total, midpointEstimate: mid.total },
      costLow: p.BUDGET.total, costHigh: p.PREMIUM.total,
      byTrade,
      lineItems: mid.lines.map(l => ({ category: l.trade, code: l.code, description: l.name, quantity: l.quantity, unit: l.unit, unitCost: l.unitCost, total: l.total })),
      contingency: `${mid.contingencyPct}% (${money(mid.subtotal * mid.contingencyPct / 100)})`,
      tiers: Object.fromEntries(TIERS.map(t => [t, { total: p[t].total, subtotal: p[t].subtotal }])),
      includes: ['materials and labor per the assembly library', 'residential permit allowance', `${mid.contingencyPct}% contingency`],
      excludes: ['structural changes not in the scope', 'hazardous material abatement', 'design fees', 'furnishings'],
      assumptions: [
        i.answers.squareFeet ? `${i.answers.squareFeet} sq ft from the intake` : `${mid.sqft} sq ft assumed — the intake gave none`,
        `Regional multiplier ${mid.region.key} ×${mid.region.multiplier}`,
      ],
      costPerSqFt: { low: p.BUDGET.costPerSqFt, mid: mid.costPerSqFt, high: p.PREMIUM.costPerSqFt },
      ...(mid.caution ? { caution: mid.caution, staffReviewRecommended: true } : {}),
      source: mid.source,
      engine: 'model-free',
    },
  }
}

// ── Design ──────────────────────────────────────────────────────────────────
const TIER_POSITION: Record<CostTier, { name: string; intent: string }> = {
  BUDGET: { name: 'Budget', intent: 'keeps the layout and upgrades the surfaces and fixtures that carry the room' },
  BALANCED: { name: 'Balanced', intent: 'reworks finishes and fixtures to a durable mid-market standard' },
  PREMIUM: { name: 'Premium', intent: 'specifies custom and stone-grade materials throughout' },
}

function design(i: EngineInput): EngineResult {
  const p = priceAllTiers(i)
  if (!p) return { kind: 'staff', reason: NO_RECIPE(i) }
  const place = i.answers.location || 'the property'
  const prop = i.answers.propertyType || 'home'
  const concepts = TIERS.map(t => {
    const e = p[t]
    const keyFeatures = [...new Set(e.lines.filter(l => !/General|Permit|Demolition|Paint/.test(l.trade)).map(l => l.name))].slice(0, 6)
    return {
      tier: t,
      positioning: TIER_POSITION[t].name,
      title: `${TIER_POSITION[t].name} ${e.label}`,
      narrative:
        `A ${e.sqft.toLocaleString()} sq ft ${e.label.toLowerCase()} for a ${prop} in ${place} that ${TIER_POSITION[t].intent}: ` +
        `${keyFeatures.slice(0, 4).join(', ').toLowerCase()}. Priced from the Kealee assembly library at ${money(e.total)} including ${e.contingencyPct}% contingency.`,
      estimatedCostMin: Math.round(e.total * 0.9),
      estimatedCostMax: Math.round(e.total * 1.1),
      keyFeatures,
      timeline: e.sqft > 600 ? '10-16 weeks' : '6-10 weeks',
      imagePrompts: [
        `Photorealistic interior of a completed ${e.label.toLowerCase()} in a ${prop} in ${place}, ${e.sqft} sq ft, ` +
        `${keyFeatures.slice(0, 3).join(', ').toLowerCase()}, natural daylight, professional architectural photography, no people.`,
      ],
    }
  })
  return {
    kind: 'complete',
    output: {
      summary: `Three priced directions for a ${p.BALANCED.label.toLowerCase()} in ${place}: ${concepts.map(c => `${c.positioning} ${money(p[c.tier as CostTier].total)}`).join(', ')}.`,
      concepts,
      engine: 'model-free',
      costSource: p.BALANCED.source,
      ...(p.BALANCED.caution ? { caution: p.BALANCED.caution } : {}),
    },
  }
}

// ── Permits & zoning ────────────────────────────────────────────────────────
function permitTypes(i: EngineInput): string[] {
  const s = scopeText(i).toLowerCase()
  if (!requiresPermitsForScope(i.answers, i.projectPath)) return []
  const out = ['Building permit']
  if (/kitchen|bath|basement|addition|adu|whole|electric/.test(s)) out.push('Electrical permit')
  if (/kitchen|bath|basement|addition|adu|whole|plumb/.test(s)) out.push('Plumbing permit')
  if (/addition|adu|whole|basement|hvac|mechanical/.test(s)) out.push('Mechanical permit')
  if (i.answers.utilities?.naturalGas && /kitchen|addition|whole/.test(s)) out.push('Gas permit')
  if (isGardenLandscapeScope(i.projectPath, i.answers)) out.splice(0, out.length, 'Irrigation / plumbing permit (backflow)')
  return out
}

function authorityOf(i: EngineInput): string {
  const j = i.jurisdiction
  if (j?.name) return `${j.name} permit office`
  return 'the local permit office (jurisdiction not yet determined)'
}

function zoning(i: EngineInput): EngineResult {
  const types = permitTypes(i)
  const agency = authorityOf(i)
  return {
    kind: 'complete',
    output: {
      jurisdiction: i.jurisdiction?.name ?? 'Not determined — confirmed from the parcel when the site is located',
      jurisdictionCode: i.jurisdiction?.code ?? null,
      zoneInfo: {
        zone: (i.lotContext?.zoneCode ?? i.lotContext?.zone ?? null) as string | null,
        permitRequired: types.length > 0,
        note: 'Dimensional standards (setbacks, coverage, height) come from the site-plan engine\'s reading of the zoning ordinance for the located parcel.',
      },
      requiredPermits: types,
      permitRequirements: types.map(t => ({
        permitType: t, agency,
        cost: null, processingTime: null,
        feeNote: `Set by the ${agency} fee schedule — confirm at submission.`,
      })),
      documentsChecklist: [
        'Completed permit application', 'Site plan or plat showing the work area', 'Floor plan(s) of the work area',
        ...(types.includes('Electrical permit') ? ['Electrical layout'] : []),
        ...(types.includes('Plumbing permit') ? ['Plumbing riser / fixture layout'] : []),
        ...(/addition|adu|structural/.test(scopeText(i).toLowerCase()) ? ['Structural drawings sealed by a Maryland/Virginia/DC PE as applicable'] : []),
        'Contractor license and insurance',
      ],
      engine: 'model-free',
    },
  }
}

function permit(i: EngineInput): EngineResult {
  const z = zoning(i)
  const zo = z.kind === 'complete' ? z.output : {}
  const s = scopeText(i).toLowerCase()
  const structural = /addition|adu|basement|structural|load/.test(s)
  return {
    kind: 'complete',
    output: {
      jurisdiction: zo.jurisdiction,
      projectType: i.answers.primaryScope || i.projectPath || 'Residential renovation',
      squareFeet: i.answers.squareFeet || null,
      specSections: [
        'Scope of work', 'Existing conditions', 'Demolition plan',
        ...(structural ? ['Structural framing plan and details'] : []),
        ...(((zo.requiredPermits as string[]) ?? []).some(p => /Electrical/.test(p)) ? ['Electrical plan and panel schedule'] : []),
        ...(((zo.requiredPermits as string[]) ?? []).some(p => /Plumbing/.test(p)) ? ['Plumbing plan'] : []),
        'Finish schedule', 'Code compliance notes',
      ],
      submissionChecklist: zo.documentsChecklist,
      peRequirements: structural
        ? 'Structural work: drawings sealed by a licensed professional engineer in the project\'s state.'
        : 'No PE seal expected for non-structural interior work; the permit office may require one on review.',
      requiredPermits: zo.requiredPermits,
      engine: 'model-free',
    },
  }
}

// ── Floor plan (concept layout) ─────────────────────────────────────────────
function floorplan(i: EngineInput): EngineResult {
  const recipe = recipeFor(scopeText(i))
  const sqft = i.answers.squareFeet || recipe?.defaultSqft || 0
  if (!recipe || !['kitchen', 'bath', 'basement', 'addition'].includes(recipe.family) || !sqft) {
    return { kind: 'staff', reason: 'A concept layout is generated only for a single room or addition with a known size; staff draw this one.' }
  }
  // A rectangle of the stated area, 1.3 : 1, walls in feet.
  const w = Math.round(Math.sqrt(sqft * 1.3) * 10) / 10
  const d = Math.round((sqft / w) * 10) / 10
  const walls = [
    { id: 'wall-n', type: 'exterior', x1: 0, y1: 0, x2: w, y2: 0, length: w },
    { id: 'wall-e', type: 'interior', x1: w, y1: 0, x2: w, y2: d, length: d },
    { id: 'wall-s', type: 'interior', x1: w, y1: d, x2: 0, y2: d, length: w },
    { id: 'wall-w', type: 'interior', x1: 0, y1: d, x2: 0, y2: 0, length: d },
  ]
  const fixtures = recipe.family === 'kitchen'
    ? ['base cabinets along north and east walls', 'sink under the north window', 'range on the east wall', 'refrigerator at the run end']
    : recipe.family === 'bath' ? ['vanity on the north wall', 'toilet on the east wall', 'shower / tub along the south wall'] : []
  return {
    kind: 'complete',
    output: {
      conceptName: `${recipe.label} — concept layout`,
      squareFeet: sqft,
      floorplan: {
        unit: 'feet', width: w, depth: d, walls,
        doorways: [{ wall: 'wall-s', offset: Math.round(w / 2), width: 3 }],
        fixtures,
        disclaimer: 'CONCEPT VISUALIZATION ONLY — a rectangle of the stated area; not to scale of the existing room, not for construction or permitting.',
      },
      rooms: [{ name: recipe.label, width: w, depth: d, areaSqFt: Math.round(w * d) }],
      engine: 'model-free',
    },
  }
}

// ── Video (prompts only; rendering is the video provider's job) ─────────────
function video(i: EngineInput): EngineResult {
  const d = design(i)
  if (d.kind !== 'complete') return d
  const c = (d.output.concepts as Array<Record<string, unknown>>)[1]
  return {
    kind: 'complete',
    output: {
      videos: [{
        videoId: 'walkthrough-01', title: `${c.title} walkthrough`, duration: '10 seconds',
        prompt: `${(c.imagePrompts as string[])[0]} Slow camera walk from the doorway across the space.`,
        camera_movement: 'Slow forward dolly from the entry', lighting: 'Natural daylight',
      }],
      engine: 'model-free',
    },
  }
}

// ── Project / support / sales / marketing (grounded templates) ──────────────
function nextActions(i: EngineInput): string[] {
  return [
    ...(i.features.includes('Design') ? ['Review the three priced concepts and pick one'] : []),
    ...(i.features.includes('Estimate') ? ['Confirm the preliminary estimate against the chosen concept'] : []),
    ...(i.features.includes('Permits') ? ['Assemble the permit submission checklist'] : []),
    'Schedule a site visit to verify existing conditions',
  ]
}
function project(i: EngineInput): EngineResult {
  return { kind: 'complete', output: { currentStageRecommendation: 'Post-payment deliverables', nextActions: nextActions(i), blockers: [], engine: 'model-free' } }
}
const support = (i: EngineInput): EngineResult => ({
  kind: 'complete',
  output: {
    faq: [
      { q: 'When will my deliverables be ready?', a: 'Each deliverable shows its own status in your workspace.' },
      { q: 'Are the costs a bid?', a: 'No — they are planning estimates from Kealee\'s cost library; contractor bids follow.' },
    ],
    nextSteps: nextActions(i),
    escalationTriggers: ['Deliverable marked "needs staff"', 'Permit office requests changes'],
    engine: 'model-free',
  },
})

/** The engines; a bot without one here is handed to staff. */
export const MODEL_FREE_ENGINES: Partial<Record<V30BotType, (i: EngineInput) => EngineResult>> = {
  intake, estimate, design, zoning, permit, floorplan, video, project, support,
  // contractor: ranking real firms needs the marketplace database — never invented here.
  // sales / marketing: ops-facing copy; left to staff without a model.
}
