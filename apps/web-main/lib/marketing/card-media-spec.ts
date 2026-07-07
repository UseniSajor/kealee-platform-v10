import { SERVICES, type Service } from '@/lib/services-config'
import {
  defaultBeforeAfterDescriptions,
  getCardProcessPrompt,
  narrativeForHomeId,
  narrativeForServiceSlug,
  type VideoNarrativeId,
} from './installation-video-scripts'

export type HomeServiceId = 'design' | 'permits' | 'estimate' | 'build'
export type CardMediaScope = 'home' | 'product'

export interface CardMediaSpec {
  key: string
  scope: CardMediaScope
  id: string
  title: string
  imageType: 'hero' | 'after' | 'before' | 'trend' | 'detail'
  style: 'modern' | 'contemporary' | 'traditional' | 'transitional' | 'luxury'
  roomType?: string
  narrativeId: VideoNarrativeId
  /** Generate before still (kitchen / bath / garden). */
  generatesBefore?: boolean
  beforeImageDescription?: string
  /** Passed to DesignBot / generate_product_image — typically the "after" hero */
  imageDescription: string
  /** Condensed installation timelapse for card video (Kling). */
  cardProcessPrompt: string
  videoMotion?: 'reveal' | 'slow_pan' | 'walkthrough'
  mediaType: 'video' | 'photo'
  fallbackPhoto: string
  photoAlt: string
}

const HOME_SPECS: Record<HomeServiceId, Omit<CardMediaSpec, 'key' | 'scope' | 'id' | 'narrativeId' | 'cardProcessPrompt'>> = {
  design: {
    title: 'design concepts',
    imageType: 'hero',
    style: 'modern',
    roomType: 'design examples',
    imageDescription:
      'A collection of modern design concept boards showcasing custom kitchen layouts, spa-like bathrooms, home additions, and landscaping plans',
    videoMotion: 'reveal',
    mediaType: 'video',
    fallbackPhoto:
      'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=900&q=80&auto=format&fit=crop',
    photoAlt: 'Diverse generated using AI tools design concepts including kitchen, bath, addition, and garden',
  },
  permits: {
    title: 'Permit Filing',
    imageType: 'detail',
    style: 'contemporary',
    roomType: 'site',
    imageDescription:
      'Architect reviewing blueprints at active residential job site, permit documents in hand, construction crew in background',
    videoMotion: 'slow_pan',
    mediaType: 'video',
    fallbackPhoto:
      '/media/service-photos/home-permits.jpg',
    photoAlt: 'Architect reviewing blueprints at active job site',
  },
  estimate: {
    title: 'Cost Estimation',
    imageType: 'trend',
    style: 'modern',
    roomType: 'office',
    imageDescription:
      'Construction cost spreadsheet on laptop with line-item materials and labor totals, calculator, professional estimating workspace',
    videoMotion: 'slow_pan',
    mediaType: 'video',
    fallbackPhoto:
      'https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=900&q=80&auto=format&fit=crop',
    photoAlt: 'Construction cost estimation breakdown',
  },
  build: {
    title: 'Build & Manage',
    imageType: 'after',
    style: 'transitional',
    roomType: 'new construction home',
    imageDescription:
      'Completed modern house exterior after new construction, lush landscaping, golden hour sunset',
    videoMotion: 'walkthrough',
    mediaType: 'video',
    fallbackPhoto:
      'https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=900&q=80&auto=format&fit=crop',
    photoAlt: 'Completed modern new construction home exterior',
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

  const narrativeId = narrativeForServiceSlug(s.slug, s.category)
  const { before, after } = defaultBeforeAfterDescriptions(narrativeId, s.label, 'modern')
  const generatesBefore =
    narrativeId === 'kitchen-install' ||
    narrativeId === 'bath-install' ||
    narrativeId === 'landscape-install'

  return {
    key: cardKey('product', s.slug),
    scope: 'product',
    id: s.slug,
    title: s.label,
    imageType: 'after',
    style: 'modern',
    roomType: room,
    narrativeId,
    generatesBefore,
    beforeImageDescription: generatesBefore ? before : undefined,
    imageDescription: `${after}. Magazine-quality ${room} renovation hero, Kealee design concept aesthetic`,
    cardProcessPrompt: getCardProcessPrompt(narrativeId),
    mediaType: 'video',
    fallbackPhoto: s.heroImage,
    photoAlt: `${s.label} — Kealee design concept`,
  }
}

export function cardKey(scope: CardMediaScope, id: string): string {
  return `${scope}:${id}`
}

export function getAllCardMediaSpecs(): CardMediaSpec[] {
  const home: CardMediaSpec[] = (Object.keys(HOME_SPECS) as HomeServiceId[]).map((id) => {
    const narrativeId = narrativeForHomeId(id)
    return {
      ...HOME_SPECS[id],
      key: cardKey('home', id),
      scope: 'home' as const,
      id,
      narrativeId,
      cardProcessPrompt: getCardProcessPrompt(narrativeId),
    }
  })
  const products = SERVICES.filter((s) => s.phase === 'precon').map(productSpecFromService)
  return [...home, ...products]
}

export function getHomeCardSpecs(): CardMediaSpec[] {
  return getAllCardMediaSpecs().filter((s) => s.scope === 'home')
}

export function getProductCardSpecs(): CardMediaSpec[] {
  return getAllCardMediaSpecs().filter((s) => s.scope === 'product')
}
