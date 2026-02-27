import { AIProvider } from '@kealee/ai'
import type { FunnelProjectType, FunnelTimeline, BudgetRange } from '@prisma/client'
import type { HeroData } from '../types'
import { getFallbackHero, PROJECT_TYPE_LABELS } from '../fallback/fallback-content'

const ai = new AIProvider()

export async function generateHeroContent(
  projectType: FunnelProjectType,
  city: string,
  state: string,
  budget: BudgetRange,
  timeline: FunnelTimeline
): Promise<HeroData> {
  try {
    const response = await ai.reason({
      task: 'Generate a personalized hero section for a construction project landing page. Return valid JSON only.',
      context: {
        projectType: PROJECT_TYPE_LABELS[projectType] || projectType,
        city,
        state,
        budget,
        timeline,
      },
      schema: {
        headline: 'string — compelling, personalized headline (max 80 chars)',
        subheadline: 'string — supporting text (max 160 chars)',
        ctaText: 'string — call-to-action button text (max 30 chars)',
      },
      systemPrompt:
        'You are a marketing copywriter for Kealee, a construction project management platform. Write compelling, specific headlines for homeowners planning construction projects. Return ONLY valid JSON, no markdown.',
    })

    const parsed = JSON.parse(response)

    return {
      headline: parsed.headline || getFallbackHero(projectType, city, state).headline,
      subheadline: parsed.subheadline || getFallbackHero(projectType, city, state).subheadline,
      ctaText: parsed.ctaText || 'Get Started Today',
      ctaHref: '/signup',
      projectTypeLabel: PROJECT_TYPE_LABELS[projectType] || projectType,
      locationLabel: `${city}, ${state}`,
    }
  } catch (err) {
    console.warn('[ContentGenerator] Falling back to default hero:', (err as Error).message)
    return getFallbackHero(projectType, city, state)
  }
}
