/**
 * Shot lists and prompts for AI installation / construction process videos.
 * Card loops = single condensed clip (Kling). Deliverables = multi-segment (Premium+ Sora).
 */

export type VideoNarrativeId =
  | 'kitchen-install'
  | 'bath-install'
  | 'remodel-install'
  | 'full-build'
  | 'landscape-install'
  | 'exterior-install'
  | 'design-reveal'
  | 'permits-static'
  | 'permits-active'
  | 'estimate-motion'

export type ProcessSegment = {
  id: string
  label: string
  prompt: string
  /** Card loop uses one combined prompt derived from all segments */
}

export type CardNarrativeConfig = {
  narrativeId: VideoNarrativeId
  /** Primary still = after / finished state */
  imageType: 'hero' | 'after' | 'before' | 'detail' | 'trend'
  beforeDescription?: string
  afterDescription: string
  mediaType: 'video' | 'photo'
  videoMotion?: 'reveal' | 'slow_pan' | 'walkthrough'
  /** Single-clip card prompt (condensed process) */
  cardProcessPrompt: string
}

const BASE_REALISM =
  'Photorealistic construction documentary, DMV suburban home, natural daylight, no on-screen text, no logos, workers in PPE with faces away from camera, believable tools and materials, 24fps cinematic timelapse feel'

export const PROCESS_SCRIPTS: Record<VideoNarrativeId, ProcessSegment[]> = {
  'kitchen-install': [
    { id: 'demo', label: 'Demo', prompt: `${BASE_REALISM}, kitchen demolition, removing old cabinets and countertops, dust protection, debris in bins` },
    { id: 'rough', label: 'Rough-in', prompt: `${BASE_REALISM}, plumber and electrician rough-in under kitchen sink, new conduit and supply lines` },
    { id: 'cabinets', label: 'Cabinet set', prompt: `${BASE_REALISM}, installers leveling and fastening new shaker kitchen cabinets, laser level visible` },
    { id: 'tops', label: 'Counters & tile', prompt: `${BASE_REALISM}, quartz countertop installation, backsplash tile setting, thin-set and spacers` },
    { id: 'finish', label: 'Finished kitchen', prompt: `${BASE_REALISM}, completed modern kitchen, under-cabinet lighting on, appliances installed, spotless finishes` },
  ],
  'bath-install': [
    { id: 'demo', label: 'Demo', prompt: `${BASE_REALISM}, bathroom demo, removing vanity toilet and tub surround, floor protection` },
    { id: 'rough', label: 'Rough-in', prompt: `${BASE_REALISM}, bathroom plumbing rough-in, new drain lines, waterproof board on walls` },
    { id: 'tile', label: 'Tile & vanity', prompt: `${BASE_REALISM}, large format wall tile installation, floating vanity set, grout work` },
    { id: 'fixtures', label: 'Fixtures', prompt: `${BASE_REALISM}, installing glass shower, chrome fixtures, mirror and lighting` },
    { id: 'finish', label: 'Finished bath', prompt: `${BASE_REALISM}, spa-like finished bathroom, walk-in shower, bright and clean` },
  ],
  'remodel-install': [
    { id: 'prep', label: 'Prep', prompt: `${BASE_REALISM}, interior renovation prep, floor protection, temporary dust walls` },
    { id: 'framing', label: 'Framing', prompt: `${BASE_REALISM}, framing new interior walls, lumber delivery, nail gun work` },
    { id: 'mep', label: 'MEP', prompt: `${BASE_REALISM}, electrical and HVAC rough-in in renovated rooms, inspectors clipboards in background` },
    { id: 'finish', label: 'Finishes', prompt: `${BASE_REALISM}, installing flooring, trim, paint touch-ups, staging furniture` },
    { id: 'reveal', label: 'Reveal', prompt: `${BASE_REALISM}, slow dolly through completed renovated living spaces, warm light` },
  ],
  'full-build': [
    { id: 'site', label: 'Site work', prompt: `${BASE_REALISM}, residential lot excavation and foundation forms, concrete pour, suburban Maryland context` },
    { id: 'frame', label: 'Framing', prompt: `${BASE_REALISM}, wood frame erection, roof trusses, house skeleton on suburban street` },
    { id: 'envelope', label: 'Envelope', prompt: `${BASE_REALISM}, house wrap, window install, siding and roof shingles going on` },
    { id: 'rough', label: 'Rough-in', prompt: `${BASE_REALISM}, interior MEP rough-in visible through windows, ladders and scaffolding` },
    { id: 'drywall', label: 'Drywall', prompt: `${BASE_REALISM}, drywall hang and mud, interior taking shape` },
    { id: 'complete', label: 'Completion', prompt: `${BASE_REALISM}, finished new home exterior golden hour, landscaping started, move-in ready` },
  ],
  'landscape-install': [
    { id: 'grade', label: 'Grading', prompt: `${BASE_REALISM}, yard grading with mini excavator, soil delivery, level lawn preparation` },
    { id: 'hardscape', label: 'Hardscape', prompt: `${BASE_REALISM}, paver patio installation, edging, compacted base layers` },
    { id: 'plant', label: 'Planting', prompt: `${BASE_REALISM}, planting shrubs and perennials, mulch spreading, irrigation trenches` },
    { id: 'finish', label: 'Finished garden', prompt: `${BASE_REALISM}, completed backyard landscape, stone path, lighting at dusk` },
  ],
  'exterior-install': [
    { id: 'prep', label: 'Prep', prompt: `${BASE_REALISM}, exterior scaffold, siding removal, window protection` },
    { id: 'install', label: 'Install', prompt: `${BASE_REALISM}, new fiber cement siding and trim install, coordinated crew` },
    { id: 'finish', label: 'Curb appeal', prompt: `${BASE_REALISM}, completed facade refresh, clean landscaping, inviting front entry` },
  ],
  'design-reveal': [
    { id: 'reveal', label: 'Concept reveal', prompt: `${BASE_REALISM}, slow cinematic reveal of renovated interior, design boards on tablet, photoreal staging` },
  ],
  'permits-static': [],
  'permits-active': [],
  'estimate-motion': [
    { id: 'desk', label: 'Estimating', prompt: `${BASE_REALISM}, estimator reviewing plans on laptop, cost spreadsheet, measuring tools on desk` },
  ],
}

function condensedCardPrompt(narrativeId: VideoNarrativeId): string {
  const segments = PROCESS_SCRIPTS[narrativeId]
  if (segments.length === 0) {
    return `${BASE_REALISM}, professional construction services b-roll, smooth camera motion`
  }
  const phases = segments.map((s) => s.label).join(' → ')
  const detail = segments.map((s) => s.prompt.split(',').slice(1).join(',').trim()).join('; ')
  return `${BASE_REALISM}, seamless timelapse showing full project process: ${phases}. ${detail}. Smooth transitions, no text overlays.`
}

export function narrativeForServiceSlug(slug: string, category: string): VideoNarrativeId {
  if (slug.includes('kitchen')) return 'kitchen-install'
  if (slug.includes('bath')) return 'bath-install'
  if (slug === 'garden' || category === 'landscape') return 'landscape-install'
  if (slug === 'addition' || slug === 'deck' || category === 'addition') return 'full-build'
  if (slug === 'new-construction' || category === 'construction') return 'full-build'
  if (slug === 'facade' || slug.includes('exterior')) return 'exterior-install'
  if (slug === 'design-services' || category === 'design') return 'design-reveal'
  if (slug.includes('whole') || slug === 'interior') return 'remodel-install'
  return 'remodel-install'
}

export function narrativeForHomeId(id: string): VideoNarrativeId {
  if (id === 'design') return 'design-reveal'
  if (id === 'build') return 'full-build'
  if (id === 'estimate') return 'estimate-motion'
  if (id === 'permits') return 'permits-active'
  return 'design-reveal'
}

export function narrativeForProjectPath(projectPath: string): VideoNarrativeId {
  const p = projectPath.toLowerCase()
  if (p.includes('kitchen')) return 'kitchen-install'
  if (p.includes('bath')) return 'bath-install'
  if (p.includes('garden') || p.includes('landscape')) return 'landscape-install'
  if (p.includes('addition') || p.includes('adu')) return 'full-build'
  if (p.includes('whole_home') || p.includes('whole-home')) return 'full-build'
  if (p.includes('design_build') || p.includes('new')) return 'full-build'
  if (p.includes('exterior') || p.includes('facade')) return 'exterior-install'
  if (p.includes('interior')) return 'remodel-install'
  return 'remodel-install'
}

export function deliverableSegmentCount(tier: 1 | 2 | 3, narrativeId: VideoNarrativeId): number {
  if (tier < 2) return 0
  const all = PROCESS_SCRIPTS[narrativeId].length
  if (tier === 2) return Math.min(3, Math.max(1, all))
  return Math.min(6, all)
}

export function getProcessSegments(
  narrativeId: VideoNarrativeId,
  maxSegments: number,
): ProcessSegment[] {
  return PROCESS_SCRIPTS[narrativeId].slice(0, maxSegments)
}

export function getCardProcessPrompt(narrativeId: VideoNarrativeId): string {
  return condensedCardPrompt(narrativeId)
}

export function defaultBeforeAfterDescriptions(
  narrativeId: VideoNarrativeId,
  title: string,
  style: string,
): { before: string; after: string } {
  switch (narrativeId) {
    case 'kitchen-install':
      return {
        before: `Outdated ${style} kitchen with worn cabinets, laminate counters, poor lighting, same camera angle as hero shot`,
        after: `Renovated ${style} kitchen with new cabinets, quartz counters, backsplash, under-cabinet lighting, identical camera angle`,
      }
    case 'bath-install':
      return {
        before: `Dated ${style} bathroom, old vanity and tub surround, same angle`,
        after: `Renovated ${style} spa bathroom, walk-in shower, floating vanity, same angle`,
      }
    case 'landscape-install':
      return {
        before: `Plain suburban backyard, patchy grass, no hardscape, same viewpoint`,
        after: `Designed ${style} garden with patio, planting beds, path, same viewpoint`,
      }
  }
  return {
    before: `Older ${style} ${title} before renovation, worn finishes, same camera angle`,
    after: `Completed ${style} ${title} after professional renovation, magazine quality, same camera angle`,
  }
}
