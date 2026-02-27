import { AIProvider } from '@kealee/ai'
import type { FunnelProjectType, BudgetRange, FunnelTimeline } from '@prisma/client'
import type { BudgetBreakdownData, TimelineData, PricingGridData } from '../types'
import {
  getFallbackBudgetBreakdown,
  getFallbackTimeline,
  getFallbackPricing,
  PROJECT_TYPE_LABELS,
  BUDGET_RANGES,
} from '../fallback/fallback-content'

const ai = new AIProvider()

export async function generateBudgetAndTimeline(
  projectType: FunnelProjectType,
  budget: BudgetRange,
  timeline: FunnelTimeline,
  city: string,
  state: string
): Promise<{
  budgetBreakdown: BudgetBreakdownData
  timeline: TimelineData
  pricing: PricingGridData
}> {
  try {
    const range = BUDGET_RANGES[budget] || BUDGET_RANGES.RANGE_50K_100K

    const response = await ai.reason({
      task: `Generate a budget breakdown, project timeline, and pricing tiers for a ${PROJECT_TYPE_LABELS[projectType] || projectType} project in ${city}, ${state}. Budget range: $${range.low.toLocaleString()} - $${range.high.toLocaleString()}. Timeline preference: ${timeline}. Return valid JSON only.`,
      context: {
        projectType: PROJECT_TYPE_LABELS[projectType] || projectType,
        city,
        state,
        budgetLow: range.low,
        budgetMid: range.mid,
        budgetHigh: range.high,
        timeline,
      },
      schema: {
        budgetLineItems: [
          { category: 'string', percentage: 'number (0-100)' },
        ],
        phases: [
          { name: 'string', durationWeeks: 'number', description: 'string' },
        ],
        notes: 'string — budget notes',
      },
      systemPrompt:
        'You are a construction cost estimator for the Kealee platform. Provide realistic budget breakdowns and timelines based on DC/MD/VA market rates. Return ONLY valid JSON, no markdown.',
    })

    const parsed = JSON.parse(response)

    // Build budget breakdown from AI response
    const lineItems = (parsed.budgetLineItems || []).map(
      (item: { category: string; percentage: number }) => ({
        category: item.category,
        lowEstimate: range.low * (item.percentage / 100),
        midEstimate: range.mid * (item.percentage / 100),
        highEstimate: range.high * (item.percentage / 100),
        percentage: item.percentage,
      })
    )

    const budgetBreakdown: BudgetBreakdownData = {
      title: `${PROJECT_TYPE_LABELS[projectType] || 'Project'} Budget Breakdown`,
      totalLow: range.low,
      totalMid: range.mid,
      totalHigh: range.high,
      lineItems: lineItems.length > 0 ? lineItems : getFallbackBudgetBreakdown(projectType, budget).lineItems,
      notes: parsed.notes || 'Estimates based on local market rates.',
    }

    // Build timeline from AI response
    const phases = (parsed.phases || []).map(
      (phase: { name: string; durationWeeks: number; description: string }, idx: number) => ({
        name: phase.name,
        durationWeeks: phase.durationWeeks,
        description: phase.description,
        order: idx + 1,
      })
    )

    const timelineData: TimelineData = {
      title: 'Estimated Project Timeline',
      totalWeeks: phases.reduce((s: number, p: { durationWeeks: number }) => s + p.durationWeeks, 0) || 9,
      phases: phases.length > 0 ? phases : getFallbackTimeline(projectType).phases,
    }

    return {
      budgetBreakdown,
      timeline: timelineData,
      pricing: getFallbackPricing(budget),
    }
  } catch (err) {
    console.warn('[AssetGenerator] Falling back to defaults:', (err as Error).message)
    return {
      budgetBreakdown: getFallbackBudgetBreakdown(projectType, budget),
      timeline: getFallbackTimeline(projectType),
      pricing: getFallbackPricing(budget),
    }
  }
}
