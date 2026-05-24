import { SERVICES, type Service } from '@/lib/services-config'

export type HomeServiceId = 'design' | 'permits' | 'estimate' | 'build'
export type CardMediaScope = 'home' | 'product'

export interface CardMediaSpec {
  key: string
  scope: CardMediaScope
  id: string
  title: string
  imageType: 'hero' | 'after' | 'trend' | 'detail'
  style: 'modern' | 'contemporary' | 'traditional' | 'transitional' | 'luxury'
  roomType?: string
  /** Passed to DesignBot / generate_product_image */
  imageDescription: string
  /** Concept-engine video (img2video) */
  videoMotion?: 'reveal' | 'slow_pan' | 'walkthrough'
  videoExtra?: string
  mediaType: 'video' | 'photo'
  fallbackPhoto: string
  photoAlt: string
}

const HOME_SPECS: Record<HomeServiceId, Omit<CardMediaSpec, 'key' | 'scope' | 'id'>> = {
  design: {
    title: 'AI Design Concepts',
    imageType: 'hero',
    style: 'modern',
    roomType: 'kitchen',
    imageDescription:
      'Stunning modern kitchen with quartz waterfall island, three AI concept style boards visible on a tablet, photorealistic renovation showcase',
    videoMotion: 'reveal',
    videoExtra: 'AI design concepts morphing between modern, traditional, and contemporary palettes',
    mediaType: 'video',
    fallbackPhoto:
      'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=900&q=80&auto=format&fit=crop',
    photoAlt: 'AI-generated kitchen design concepts',
  },
  permits: {
    title: 'Permit Analysis',
    imageType: 'detail',
    style: 'contemporary',
    roomType: 'office',
    imageDescription:
      'Official building permit application with approved stamps, DC zoning checklist, blueprint roll, professional compliance desk flat lay',
    mediaType: 'photo',
    fallbackPhoto:
      'https://images.unsplash.com/photo-1450101499163-c8848c66ca85?w=900&q=80&auto=format&fit=crop',
    photoAlt: 'Building permits and compliance documentation',
  },
  estimate: {
    title: 'Cost Estimation',
    imageType: 'trend',
    style: 'modern',
    roomType: 'office',
    imageDescription:
      'Construction cost spreadsheet on laptop with line-item materials and labor totals, calculator, professional estimating workspace',
    videoMotion: 'slow_pan',
    videoExtra: 'cost line items populating with checkmarks and running total',
    mediaType: 'video',
    fallbackPhoto:
      'https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=900&q=80&auto=format&fit=crop',
    photoAlt: 'Construction cost estimation breakdown',
  },
  build: {
    title: 'Build & Manage',
    imageType: 'after',
    style: 'transitional',
    roomType: 'kitchen',
    imageDescription:
      'Professional construction crew collaborating on active kitchen renovation, timeline board, vetted contractor teamwork',
    videoMotion: 'walkthrough',
    videoExtra: 'construction timelapse from demo to finished kitchen',
    mediaType: 'video',
    fallbackPhoto:
      'https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=900&q=80&auto=format&fit=crop',
    photoAlt: 'Construction team managing a renovation project',
  },
}

function productSpecFromService(s: Service): CardMediaSpec {
  const room =
    s.category === 'landscape'
      ? 'garden'
      : s.slug.includes('bath')
        ? 'bathroom'
        : s.slug.includes('kitchen')
          ? 'kitchen'
          : s.category === 'addition'
            ? 'living'
            : 'interior'

  return {
    key: cardKey('product', s.slug),
    scope: 'product',
    id: s.slug,
    title: s.label,
    imageType: 'hero',
    style: 'modern',
    roomType: room,
    imageDescription: `${s.description.slice(0, 200)}. Magazine-quality ${room} renovation hero, Kealee AI concept aesthetic`,
    videoMotion: 'reveal',
    videoExtra: s.shortLabel,
    mediaType: 'video',
    fallbackPhoto: s.heroImage,
    photoAlt: `${s.label} — Kealee AI concept`,
  }
}

export function cardKey(scope: CardMediaScope, id: string): string {
  return `${scope}:${id}`
}

export function getAllCardMediaSpecs(): CardMediaSpec[] {
  const home: CardMediaSpec[] = (Object.keys(HOME_SPECS) as HomeServiceId[]).map((id) => ({
    ...HOME_SPECS[id],
    key: cardKey('home', id),
    scope: 'home' as const,
    id,
  }))
  const products = SERVICES.filter((s) => s.phase === 'precon').map(productSpecFromService)
  return [...home, ...products]
}

export function getHomeCardSpecs(): CardMediaSpec[] {
  return getAllCardMediaSpecs().filter((s) => s.scope === 'home')
}

export function getProductCardSpecs(): CardMediaSpec[] {
  return getAllCardMediaSpecs().filter((s) => s.scope === 'product')
}
