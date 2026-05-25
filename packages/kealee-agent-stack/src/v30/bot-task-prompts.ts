import type { V30BotType } from './types'

/** User-turn instructions per bot (system prompt loaded separately from prompts/). */
export function buildV30BotUserPrompt(botType: V30BotType, inputData: Record<string, unknown>): string {
  const ctx = JSON.stringify(inputData, null, 2)
  const jsonOnly = 'Respond with a single valid JSON object only — no markdown outside JSON.'

  const tasks: Record<V30BotType, string> = {
    intake: `Analyze the intake answers and return IntakeBot JSON (scopeComplexity, riskLevel, estimatedCost, estimatedDays, suggestedFeatures, analysisJson). ${jsonOnly}\n\n${ctx}`,
    design: `Produce DesignBot output: exactly 3 concepts (BUDGET, BALANCED, PREMIUM) with narratives, costs, imagePrompts. ${jsonOnly}\n\n${ctx}`,
    estimate: `Produce EstimateBot output for this project (PRELIMINARY or DETAILED per scope). Include byTrade, costLow, costHigh. ${jsonOnly}\n\n${ctx}`,
    zoning: `Produce ZoningBot output: jurisdiction, requiredPermits, documentsChecklist, fees, timelines for DMV location. ${jsonOnly}\n\n${ctx}`,
    floorplan: `Produce FloorplanBot output: rooms[], walls[], dimensions, coordinate data for 2D layout. Scope: kitchen (work triangle, cabinets), bath (fixtures, wet zone), addition (existing + proposed footprint on lotContext), whole_house (multi-room), garden/landscape (plantSchedule[], treeSchedule[], materialTakeoff[]). Use lotContext when provided. ${jsonOnly}\n\n${ctx}`,
    permit: `Produce PermitBot output: permit-ready spec sections, submission checklist, PE requirements. ${jsonOnly}\n\n${ctx}`,
    video: `Produce VideoBot output: prompts for architectural walkthrough video (Sora/Veo/Kling), shot list, durations. ${jsonOnly}\n\n${ctx}`,
    contractor: `Produce ContractorBot output: ranked contractor recommendations with match scores and rationale. ${jsonOnly}\n\n${ctx}`,
    sales: `Produce SalesBot output: common objections[], responses[], upsell opportunities[] for this customer profile. ${jsonOnly}\n\n${ctx}`,
    marketing: `Produce MarketingBot output: platform growth plan — executiveSummary, funnelFocus, playbook[], leadCaptureIdeas[], suggestedCTAs[], conversionPaths[] (concept→estimate→permit→build), scoringHints[], channelPlan, opsHandoff. NOT homeowner share-kit copy. ${jsonOnly}\n\n${ctx}`,
    support: `Produce SupportBot output: faq[], nextSteps[], escalationTriggers[] for this customer. ${jsonOnly}\n\n${ctx}`,
    project: `Produce ProjectBot output: currentStageRecommendation, nextActions[], blockers[], workspace stage updates. ${jsonOnly}\n\n${ctx}`,
  }

  return tasks[botType]
}
