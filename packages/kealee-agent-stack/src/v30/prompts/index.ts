export { INTAKE_BOT_PROMPT } from './intake-bot'
export { DESIGN_BOT_PROMPT } from './design-bot'
export { ESTIMATE_BOT_PROMPT } from './estimate-bot'
export { ZONING_BOT_PROMPT } from './zoning-bot'
export { FLOORPLAN_BOT_PROMPT } from './floorplan-bot'
export { PERMIT_BOT_PROMPT } from './permit-bot'
export { VIDEO_BOT_PROMPT } from './video-bot'
export { CONTRACTOR_BOT_PROMPT } from './contractor-bot'
export { SALES_BOT_PROMPT } from './sales-bot'
export { SUPPORT_BOT_PROMPT } from './support-bot'
export { PROJECT_BOT_PROMPT } from './project-bot'

import type { V30BotType } from '../types'
import { INTAKE_BOT_PROMPT } from './intake-bot'
import { DESIGN_BOT_PROMPT } from './design-bot'
import { ESTIMATE_BOT_PROMPT } from './estimate-bot'
import { ZONING_BOT_PROMPT } from './zoning-bot'
import { FLOORPLAN_BOT_PROMPT } from './floorplan-bot'
import { PERMIT_BOT_PROMPT } from './permit-bot'
import { VIDEO_BOT_PROMPT } from './video-bot'
import { CONTRACTOR_BOT_PROMPT } from './contractor-bot'
import { SALES_BOT_PROMPT } from './sales-bot'
import { SUPPORT_BOT_PROMPT } from './support-bot'
import { PROJECT_BOT_PROMPT } from './project-bot'

const PROMPTS: Record<V30BotType, string> = {
  intake: INTAKE_BOT_PROMPT,
  design: DESIGN_BOT_PROMPT,
  estimate: ESTIMATE_BOT_PROMPT,
  zoning: ZONING_BOT_PROMPT,
  floorplan: FLOORPLAN_BOT_PROMPT,
  permit: PERMIT_BOT_PROMPT,
  video: VIDEO_BOT_PROMPT,
  contractor: CONTRACTOR_BOT_PROMPT,
  sales: SALES_BOT_PROMPT,
  support: SUPPORT_BOT_PROMPT,
  project: PROJECT_BOT_PROMPT,
}

export function getV30SystemPrompt(botType: V30BotType): string {
  return PROMPTS[botType]
}
