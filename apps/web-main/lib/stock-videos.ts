import type { MediaVideo } from '@/components/media/types'

// TODO: Replace empty src strings with real Pexels/Vimeo URLs when available.
// Example: src: 'https://player.vimeo.com/external/...' or a direct .mp4 URL
// Videos are intentionally left blank — VideoPlayer renders a placeholder card.

export const STOCK_VIDEOS: Record<string, MediaVideo> = {
  kitchen_remodel: {
    src: '',
    label: 'Kitchen Remodel Walkthrough',
    duration: 120,
    // TODO: posterUrl: 'https://images.unsplash.com/photo-...'
  },
  bathroom_remodel: {
    src: '',
    label: 'Bathroom Renovation Tour',
    duration: 90,
  },
  addition_expansion: {
    src: '',
    label: 'Home Addition Process',
    duration: 180,
  },
  whole_home_remodel: {
    src: '',
    label: 'Whole-Home Renovation',
    duration: 240,
  },
  garden_concept: {
    src: '',
    label: 'Garden Concept Reveal',
    duration: 60,
  },
  interior_renovation: {
    src: '',
    label: 'Interior Renovation Walkthrough',
    duration: 120,
  },
  exterior_concept: {
    src: '',
    label: 'Exterior Transformation',
    duration: 90,
  },
  interior_reno_concept: {
    src: '',
    label: 'Interior Design Concept',
    duration: 90,
  },
  design_build: {
    src: '',
    label: 'Design + Build Journey',
    duration: 300,
  },
}
