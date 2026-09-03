/**
 * Every connected stage processor.
 *
 * `FIRST_RELEASE_PROCESSORS` stays exactly what its name says — the vertical
 * slice that a paid order runs today — and the design group is merged on top
 * here. A stage having a processor is NOT the same as a stage being enqueued:
 * the runner still derives what to run next from `inFirstRelease`, so a design
 * stage runs when it is enqueued deliberately and not before. Connecting and
 * releasing are two decisions, and this is the file that keeps them apart.
 */

import type { SitePlanJobName } from '../definition'
import type { StageProcessor } from '../context'
import { FIRST_RELEASE_PROCESSORS } from './first-release'
import { DESIGN_PROCESSORS } from './design-stages'

export const SITE_PLAN_PROCESSORS: Record<SitePlanJobName, StageProcessor | undefined> = {
  ...FIRST_RELEASE_PROCESSORS,
  ...DESIGN_PROCESSORS,
}

/** Stages declared in the definition that nothing implements yet. */
export function unconnectedStages(): SitePlanJobName[] {
  return (Object.keys(SITE_PLAN_PROCESSORS) as SitePlanJobName[])
    .filter(j => SITE_PLAN_PROCESSORS[j] === undefined)
}
