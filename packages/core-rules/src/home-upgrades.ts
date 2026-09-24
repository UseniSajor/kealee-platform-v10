/**
 * Canonical catalogue for Kealee Home Upgrades.
 *
 * These are configurable construction outcomes, not fixed-price SKUs and not
 * service tiers. The public range is narrowed by intake; a construction price
 * is only issued after existing conditions and required measurements are
 * verified.
 */

export type HomeUpgradeCollectionId =
  | 'exterior-transformation'
  | 'outdoor-living'
  | 'basement-bonus-rooms'
  | 'bathroom-wellness'
  | 'smart-climate-comfort'
  | 'storage-organization'
  | 'specialty-rooms'
  | 'landscaping'
  | 'homecare'

export type PermitLikelihood = 'unlikely' | 'possible' | 'likely'
export type DisruptionLevel = 'low' | 'moderate' | 'high'

export const HOME_UPGRADES_CATALOG_VERSION = '2026-09-23'

export interface HomeUpgradeScopeBand {
  id: 'focused' | 'transformative' | 'major'
  label: string
  description: string
  multiplier: number
}

export interface HomeUpgradeOption {
  id: string
  label: string
  description: string
  minCents: number
  maxCents: number
  scheduleWeeks: number
  permitImpact?: 'none' | 'review' | 'likely'
}

export interface HomeUpgradeProduct {
  slug: string
  collectionId: HomeUpgradeCollectionId
  name: string
  shortName: string
  promise: string
  description: string
  image: string
  beforeImage?: string
  video?: string
  featured?: boolean
  conceptIntakePath: string
  planningRange: { minCents: number; maxCents: number }
  typicalWeeks: { min: number; max: number }
  permitLikelihood: PermitLikelihood
  disruption: DisruptionLevel
  permitNote: string
  included: readonly string[]
  exclusions: readonly string[]
  trades: readonly string[]
  scopeBands: readonly HomeUpgradeScopeBand[]
  options: readonly HomeUpgradeOption[]
}

const STANDARD_SCOPE_BANDS: readonly HomeUpgradeScopeBand[] = [
  { id: 'focused', label: 'Focused scope', description: 'Improve the highest-impact elements while retaining most existing conditions.', multiplier: 0.72 },
  { id: 'transformative', label: 'Full transformation', description: 'Coordinate the principal finishes, systems, and construction work as one project.', multiplier: 1 },
  { id: 'major', label: 'Major reconstruction', description: 'Broader structural, envelope, utility, or premium-finish work with more field coordination.', multiplier: 1.55 },
]

const HOMECARE_SCOPE_BANDS: readonly HomeUpgradeScopeBand[] = [
  { id: 'focused', label: 'Seasonal check-in', description: 'A focused property walkthrough and prioritized seasonal maintenance list.', multiplier: 0.72 },
  { id: 'transformative', label: 'Annual care plan', description: 'Recurring observations, maintenance coordination, and an annual improvement plan.', multiplier: 1 },
  { id: 'major', label: 'Priority care plan', description: 'Broader coordination for a property with more systems, deferred maintenance, or active improvements.', multiplier: 1.55 },
]

export const HOME_UPGRADE_PRODUCTS: readonly HomeUpgradeProduct[] = [
  {
    slug: 'exterior-facade-transformation', collectionId: 'exterior-transformation', name: 'Exterior Façade Transformation', shortName: 'Exterior Transformation', featured: true,
    promise: 'Make the property look more valuable before construction begins.',
    description: 'Coordinate siding, entry features, windows, trim, architectural lighting, paint, and front-yard improvements around one visual direction.',
    image: '/media/service-photos/product-facade.jpg', beforeImage: '/media/service-photos/product-facade-before.jpg', video: '/media/service-videos/facade.mp4', conceptIntakePath: 'exterior_concept',
    planningRange: { minCents: 1500000, maxCents: 12500000 }, typicalWeeks: { min: 4, max: 18 }, permitLikelihood: 'possible', disruption: 'moderate',
    permitNote: 'Finish-only work may not require a building permit. Window changes, porches, canopies, structural alterations, and electrical work usually require review.',
    included: ['Three visual directions and six project-specific views', 'Material and finish direction', 'Basic planning estimate', 'Zoning code and permit-path review', 'Scope assumptions, exclusions, and verification checklist'],
    exclusions: ['Boundary survey', 'Construction documents or engineering', 'Hidden-condition remediation', 'Permit and construction fees'], trades: ['General Contractor', 'Siding', 'Windows & Doors', 'Electrician', 'Landscaping'], scopeBands: STANDARD_SCOPE_BANDS,
    options: [
      { id: 'architectural-lighting', label: 'Architectural lighting', description: 'Entry, façade, path, and landscape lighting concept.', minCents: 250000, maxCents: 900000, scheduleWeeks: 1, permitImpact: 'review' },
      { id: 'entry-composition', label: 'New entry composition', description: 'Door, canopy or porch elements, trim, and approach.', minCents: 800000, maxCents: 3500000, scheduleWeeks: 3, permitImpact: 'likely' },
      { id: 'window-package', label: 'Window package', description: 'Coordinated replacement windows and exterior trim.', minCents: 1200000, maxCents: 4500000, scheduleWeeks: 3, permitImpact: 'review' },
    ],
  },
  {
    slug: 'outdoor-living', collectionId: 'outdoor-living', name: 'Outdoor Living', shortName: 'Outdoor Living', featured: true,
    promise: 'Turn the backyard into a place for everyday living and entertaining.',
    description: 'Plan a deck or patio with optional pergola, kitchen, fire feature, power, lighting, planting, and drainage coordination.',
    image: '/media/service-photos/product-deck.jpg', beforeImage: '/media/service-photos/product-garden-before.jpg', video: '/media/service-videos/garden.mp4', conceptIntakePath: 'garden_concept',
    planningRange: { minCents: 1800000, maxCents: 16000000 }, typicalWeeks: { min: 4, max: 20 }, permitLikelihood: 'likely', disruption: 'moderate',
    permitNote: 'Decks, roofed structures, utilities, retaining walls, pools, and some patios require zoning, building, trade, or stormwater review.',
    included: ['Outdoor layout and circulation concept', 'Three visual directions and six views', 'Basic planning estimate', 'Zoning, setback, coverage, and permit review', 'Preliminary drainage and utility considerations'],
    exclusions: ['Survey or utility locating', 'Engineered structural plans', 'Pool engineering', 'Permit and construction fees'], trades: ['General Contractor', 'Deck Builder', 'Masonry', 'Electrician', 'Landscaping'], scopeBands: STANDARD_SCOPE_BANDS,
    options: [
      { id: 'pergola', label: 'Pergola or covered structure', description: 'Shade structure coordinated with the main living area.', minCents: 1200000, maxCents: 4500000, scheduleWeeks: 3, permitImpact: 'likely' },
      { id: 'outdoor-kitchen', label: 'Outdoor kitchen', description: 'Cabinetry, counters, appliance zones, power, gas, and water planning.', minCents: 1500000, maxCents: 6000000, scheduleWeeks: 4, permitImpact: 'likely' },
      { id: 'fire-lighting', label: 'Fire feature and lighting', description: 'Fire pit or fireplace plus landscape and task lighting.', minCents: 600000, maxCents: 2500000, scheduleWeeks: 2, permitImpact: 'review' },
    ],
  },
  {
    slug: 'basement-lifestyle-conversion', collectionId: 'basement-bonus-rooms', name: 'Basement Lifestyle Conversion', shortName: 'Basement Conversion', featured: true,
    promise: 'Convert underused space into a room the household chooses to use.',
    description: 'Create a theater, gym, bar, office, playroom, guest suite, or coordinated multi-use lower level.',
    image: '/media/service-photos/product-whole-house.jpg', beforeImage: '/media/service-photos/product-whole-house-before.jpg', video: '/media/service-videos/whole-house.mp4', conceptIntakePath: 'whole_home_concept',
    planningRange: { minCents: 3000000, maxCents: 18000000 }, typicalWeeks: { min: 8, max: 24 }, permitLikelihood: 'likely', disruption: 'moderate',
    permitNote: 'New bedrooms, bathrooms, kitchens, structural changes, electrical, plumbing, HVAC, and egress commonly require permits.',
    included: ['Space plan and lifestyle program', 'Three visual directions and six views', 'Basic planning estimate', 'Code, egress, zoning, and permit-path review', 'MEP and moisture-risk assumptions'],
    exclusions: ['Destructive testing', 'Structural or MEP engineering', 'Environmental remediation', 'Permit and construction fees'], trades: ['General Contractor', 'Electrician', 'Plumber', 'HVAC', 'Carpentry'], scopeBands: STANDARD_SCOPE_BANDS,
    options: [
      { id: 'bathroom', label: 'Add a bathroom', description: 'Bathroom layout with plumbing and ventilation planning.', minCents: 1800000, maxCents: 5000000, scheduleWeeks: 4, permitImpact: 'likely' },
      { id: 'theater', label: 'Theater and built-in audio', description: 'Screen wall, lighting, acoustics, seating, and equipment zones.', minCents: 1000000, maxCents: 4500000, scheduleWeeks: 2, permitImpact: 'review' },
      { id: 'guest-suite', label: 'Guest-suite planning', description: 'Sleeping, storage, bath access, and compliant egress strategy.', minCents: 1200000, maxCents: 5500000, scheduleWeeks: 4, permitImpact: 'likely' },
    ],
  },
  {
    slug: 'bathroom-comfort-upgrade', collectionId: 'bathroom-wellness', name: 'Bathroom Comfort Upgrade', shortName: 'Bathroom Comfort', featured: true,
    promise: 'Create a quieter, safer, more comfortable daily retreat.',
    description: 'Combine a walk-in shower, soaking tub, heated floor, premium fixtures, lighting, ventilation, storage, and wellness features.',
    image: '/media/service-photos/product-bathroom.jpg', beforeImage: '/media/service-photos/product-bathroom-before.jpg', video: '/media/service-videos/bathroom.mp4', conceptIntakePath: 'bathroom_remodel',
    planningRange: { minCents: 1200000, maxCents: 7500000 }, typicalWeeks: { min: 4, max: 12 }, permitLikelihood: 'likely', disruption: 'high',
    permitNote: 'Plumbing, electrical, ventilation, wall changes, waterproofing, and fixture relocation commonly require trade or building permits.',
    included: ['Layout and fixture strategy', 'Three visual directions and six views', 'Basic planning estimate', 'Permit-path and ventilation review', 'Material, lighting, and plumbing palette'],
    exclusions: ['Structural or MEP engineering', 'Mold or hazardous-material remediation', 'Fixture purchases', 'Permit and construction fees'], trades: ['General Contractor', 'Plumber', 'Electrician', 'Tile Installer'], scopeBands: STANDARD_SCOPE_BANDS,
    options: [
      { id: 'heated-floor', label: 'Heated floor', description: 'Electric or hydronic comfort-floor allowance and controls.', minCents: 180000, maxCents: 650000, scheduleWeeks: 1, permitImpact: 'review' },
      { id: 'steam-shower', label: 'Steam shower', description: 'Steam enclosure, generator, controls, waterproofing, and ventilation scope.', minCents: 700000, maxCents: 2200000, scheduleWeeks: 2, permitImpact: 'likely' },
      { id: 'sauna', label: 'Sauna or recovery zone', description: 'Compact sauna, cold-plunge, or recovery-area planning.', minCents: 700000, maxCents: 3000000, scheduleWeeks: 3, permitImpact: 'review' },
    ],
  },
  {
    slug: 'smart-climate-comfort', collectionId: 'smart-climate-comfort', name: 'Smart Home & Climate Comfort', shortName: 'Smart Climate Comfort', featured: true,
    promise: 'Make every room easier to control, secure, and comfortable.',
    description: 'Coordinate HVAC zoning or mini-splits with smart thermostats, lighting, shades, locks, cameras, doorbells, and whole-home controls.',
    image: '/media/service-photos/product-interior.jpg', beforeImage: '/media/service-photos/product-interior-before.jpg', video: '/media/service-videos/interior.mp4', conceptIntakePath: 'interior_reno_concept',
    planningRange: { minCents: 600000, maxCents: 6000000 }, typicalWeeks: { min: 1, max: 8 }, permitLikelihood: 'possible', disruption: 'low',
    permitNote: 'Low-voltage devices may not require permits. New HVAC equipment, electrical circuits, service upgrades, and gas work usually require trade permits.',
    included: ['Room-by-room comfort goals', 'Controls and equipment concept', 'Basic planning estimate', 'Electrical, HVAC, zoning, and permit-path review', 'Installation sequence and verification checklist'],
    exclusions: ['Load calculations or engineered design', 'Utility upgrades', 'Equipment purchases', 'Permit and construction fees'], trades: ['HVAC', 'Electrician', 'Low Voltage', 'Security'], scopeBands: STANDARD_SCOPE_BANDS,
    options: [
      { id: 'mini-splits', label: 'Mini-split zones', description: 'Targeted heating and cooling for difficult rooms or additions.', minCents: 450000, maxCents: 1800000, scheduleWeeks: 2, permitImpact: 'likely' },
      { id: 'automation', label: 'Lighting and shade automation', description: 'Scenes, dimming, automated shades, and central control.', minCents: 350000, maxCents: 2500000, scheduleWeeks: 2, permitImpact: 'review' },
      { id: 'security', label: 'Smart security', description: 'Locks, cameras, doorbells, sensors, and owner access controls.', minCents: 150000, maxCents: 900000, scheduleWeeks: 1, permitImpact: 'none' },
    ],
  },
  {
    slug: 'custom-storage-organization', collectionId: 'storage-organization', name: 'Custom Storage & Organization', shortName: 'Storage & Organization',
    promise: 'Give daily items a deliberate place without adding square footage.', description: 'Coordinate closets, pantry systems, mudrooms, laundry storage, garage cabinets, and storage walls.',
    image: '/media/service-photos/product-kitchen.jpg', beforeImage: '/media/service-photos/product-kitchen-before.jpg', conceptIntakePath: 'interior_reno_concept', planningRange: { minCents: 400000, maxCents: 3500000 }, typicalWeeks: { min: 2, max: 8 }, permitLikelihood: 'unlikely', disruption: 'low',
    permitNote: 'Cabinetry-only work is commonly permit-exempt; new walls, plumbing, electrical, or structural changes require review.', included: ['Storage-use inventory', 'Layout and elevation concepts', 'Basic planning estimate', 'Material and hardware direction', 'Permit-path screening'], exclusions: ['Structural engineering', 'Specialty equipment', 'Permit and construction fees'], trades: ['Cabinetry', 'Carpentry', 'Electrician'], scopeBands: STANDARD_SCOPE_BANDS,
    options: [{ id: 'lighting', label: 'Integrated lighting', description: 'Shelf, cabinet, task, and occupancy lighting.', minCents: 100000, maxCents: 500000, scheduleWeeks: 1, permitImpact: 'review' }],
  },
  {
    slug: 'specialty-room', collectionId: 'specialty-rooms', name: 'Specialty Room', shortName: 'Specialty Rooms',
    promise: 'Design a room around the activity that matters most.', description: 'Create a home office, gym, hobby room, bar, wine room, pet-washing station, media room, or upgraded laundry.',
    image: '/media/service-photos/product-interior.jpg', beforeImage: '/media/service-photos/product-interior-before.jpg', conceptIntakePath: 'interior_reno_concept', planningRange: { minCents: 800000, maxCents: 8000000 }, typicalWeeks: { min: 3, max: 12 }, permitLikelihood: 'possible', disruption: 'moderate',
    permitNote: 'Finish-only work may be exempt. Plumbing, new circuits, HVAC, wall changes, and occupancy changes require review.', included: ['Activity and equipment program', 'Three visual directions and six views', 'Basic planning estimate', 'Systems and permit-path review', 'Materials and built-in direction'], exclusions: ['Specialty equipment purchases', 'Engineering', 'Permit and construction fees'], trades: ['General Contractor', 'Carpentry', 'Electrician', 'Plumber'], scopeBands: STANDARD_SCOPE_BANDS,
    options: [{ id: 'built-ins', label: 'Custom built-ins', description: 'Storage, display, work surface, and equipment integration.', minCents: 400000, maxCents: 2200000, scheduleWeeks: 2, permitImpact: 'none' }],
  },
  {
    slug: 'landscape-transformation', collectionId: 'landscaping', name: 'Landscape Transformation', shortName: 'Landscaping',
    promise: 'Make the outdoor setting feel intentional in every season.', description: 'Coordinate decorative planting, irrigation, water features, drainage, lighting, and retaining-wall beautification.',
    image: '/media/service-photos/product-garden.jpg', beforeImage: '/media/service-photos/product-garden-before.jpg', video: '/media/service-videos/garden.mp4', conceptIntakePath: 'garden_concept', planningRange: { minCents: 800000, maxCents: 10000000 }, typicalWeeks: { min: 2, max: 14 }, permitLikelihood: 'possible', disruption: 'moderate',
    permitNote: 'Large grading, retaining walls, tree removal, drainage connections, structures, and work in protected areas require review.', included: ['Landscape and circulation concept', 'Plant and material direction', 'Basic planning estimate', 'Zoning, environmental, drainage, and permit screening', 'Seasonal and maintenance considerations'], exclusions: ['Boundary/topographic survey', 'Civil engineering', 'Arborist report', 'Permit and construction fees'], trades: ['Landscaping', 'Masonry', 'Irrigation', 'Electrician'], scopeBands: STANDARD_SCOPE_BANDS,
    options: [{ id: 'irrigation', label: 'Smart irrigation', description: 'Zoning, controller, drip, and seasonal programming concept.', minCents: 350000, maxCents: 1500000, scheduleWeeks: 2, permitImpact: 'review' }],
  },
  {
    slug: 'homecare', collectionId: 'homecare', name: 'Kealee HomeCare', shortName: 'HomeCare',
    promise: 'Prevent small maintenance issues from becoming expensive projects.', description: 'A recurring property-care relationship covering seasonal observations, maintenance coordination, and an annual improvement plan.',
    image: '/media/service-photos/home-build.jpg', conceptIntakePath: 'interior_reno_concept', planningRange: { minCents: 60000, maxCents: 360000 }, typicalWeeks: { min: 1, max: 2 }, permitLikelihood: 'unlikely', disruption: 'low',
    permitNote: 'Inspections and routine maintenance are generally permit-exempt. Repairs discovered during service are reviewed separately.', included: ['Seasonal property checklist', 'HVAC filter and equipment reminders', 'Plumbing, electrical, and exterior observations', 'Annual condition summary', 'Priority improvement recommendations'], exclusions: ['Emergency response', 'Repair labor and materials', 'Code inspection or engineering'], trades: ['Handyman', 'HVAC', 'Plumber', 'Electrician'], scopeBands: HOMECARE_SCOPE_BANDS,
    options: [{ id: 'priority', label: 'Priority coordination', description: 'Priority scheduling and annual improvement planning session.', minCents: 60000, maxCents: 120000, scheduleWeeks: 0, permitImpact: 'none' }],
  },
] as const

export const HOME_UPGRADE_BY_SLUG: Readonly<Record<string, HomeUpgradeProduct>> = Object.fromEntries(
  HOME_UPGRADE_PRODUCTS.map(product => [product.slug, product]),
)

export function calculateUpgradePlanningRange(
  product: HomeUpgradeProduct,
  scopeBandId: HomeUpgradeScopeBand['id'],
  optionIds: readonly string[],
): { minCents: number; maxCents: number; weeks: { min: number; max: number }; permitLikelihood: PermitLikelihood } {
  const band = product.scopeBands.find(item => item.id === scopeBandId) ?? product.scopeBands[1]
  const options = product.options.filter(option => optionIds.includes(option.id))
  const minCents = Math.round(product.planningRange.minCents * band.multiplier) + options.reduce((sum, option) => sum + option.minCents, 0)
  const maxCents = Math.round(product.planningRange.maxCents * band.multiplier) + options.reduce((sum, option) => sum + option.maxCents, 0)
  const addedWeeks = options.reduce((sum, option) => sum + option.scheduleWeeks, 0)
  const permitLikelihood = options.some(option => option.permitImpact === 'likely')
    ? 'likely'
    : options.some(option => option.permitImpact === 'review') && product.permitLikelihood === 'unlikely'
      ? 'possible'
      : product.permitLikelihood
  return { minCents, maxCents, weeks: { min: product.typicalWeeks.min, max: product.typicalWeeks.max + addedWeeks }, permitLikelihood }
}

export function formatUpgradeRange(range: { minCents: number; maxCents: number }): string {
  const money = (cents: number) => `$${Math.round(cents / 100).toLocaleString('en-US')}`
  return `${money(range.minCents)}–${money(range.maxCents)}`
}
