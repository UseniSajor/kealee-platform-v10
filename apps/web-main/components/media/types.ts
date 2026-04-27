export interface MediaImage {
  src: string
  alt: string
  width: number
  height: number
  blurDataUrl?: string
  category?: 'before' | 'after' | 'detail' | 'material'
}

export interface MediaVideo {
  src?: string
  youtubeId?: string
  posterUrl?: string
  duration?: number
  label?: string
}

export interface BeforeAfterPair {
  beforeImage: MediaImage
  afterImage: MediaImage
  label?: string
}

export interface ServiceMedia {
  heroVideo?: MediaVideo
  galleryImages: MediaImage[]
  beforeAfterPairs?: BeforeAfterPair[]
}
