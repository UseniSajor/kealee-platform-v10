import type { PageBuildRequest, PageBuildResult, SectionData } from './types'
import { aggregateConceptPackages, aggregateCaseStudies } from './agents/data-aggregator'
import { generateHeroContent } from './agents/content-generator'
import { generateBudgetAndTimeline } from './agents/asset-generator'
import { getLayout } from './agents/layout-designer'
import { getCachedPage, setCachedPage } from './cache/page-cache'
import { setProgress } from './progress/progress-tracker'

export async function buildPage(request: PageBuildRequest): Promise<PageBuildResult> {
  const { sessionId, userType, projectType, city, state, budget, timeline } = request

  // Check cache first
  const cached = await getCachedPage(sessionId)
  if (cached) return cached

  await setProgress(sessionId, 5)

  // Step 1: Data aggregation (pure DB queries, fast)
  await setProgress(sessionId, 10)
  const [conceptData, caseStudyData] = await Promise.all([
    aggregateConceptPackages(),
    aggregateCaseStudies(projectType, state),
  ])
  await setProgress(sessionId, 30)

  // Step 2: AI content + asset generation in parallel (2 Claude calls)
  const [heroData, { budgetBreakdown, timeline: timelineData, pricing }] = await Promise.all([
    generateHeroContent(projectType, city, state, budget, timeline),
    generateBudgetAndTimeline(projectType, budget, timeline, city, state),
  ])
  await setProgress(sessionId, 80)

  // Step 3: Layout design (static lookup, no AI)
  const layout = getLayout(userType)

  // Build section data map
  const sectionDataMap: Record<string, SectionData['data']> = {
    hero: heroData,
    concept_packages: conceptData,
    budget_breakdown: budgetBreakdown,
    timeline: timelineData,
    pricing_grid: pricing,
    case_studies: caseStudyData,
  }

  const sections: SectionData[] = layout.map((type) => ({
    type,
    data: sectionDataMap[type],
  }))

  const result: PageBuildResult = {
    sessionId,
    sections,
    layout,
    generatedAt: new Date().toISOString(),
  }

  // Cache result
  await setCachedPage(sessionId, result)
  await setProgress(sessionId, 100)

  return result
}
