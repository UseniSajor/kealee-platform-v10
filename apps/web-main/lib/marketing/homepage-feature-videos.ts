export const HOME_HERO_VIDEO = {
  src: '/media/service-videos/home-hero-one-person-working.mp4',
  poster: '/media/service-photos/home-design.jpg',
  prompt:
    'Photorealistic residential construction documentary in a modern kitchen renovation, one person only, a single skilled worker actively installing and leveling cabinet hardware at the workbench, stationary camera with a subtle slow push-in, no walking around an island, no extra people, no logos, no on-screen text, natural daylight, believable tools and materials, professional home improvement footage, 16:9.',
}

export const HOME_DESIGN_CARD_VIDEO = {
  src: '/media/service-videos/home-design-concept-video.mp4',
  prompt:
    'Photorealistic Kealee AI concept package review for a DMV residential renovation, one designer reviewing property photos, floor plan sketches, zoning notes, and material samples on a table with a tablet showing concept boards, calm slow camera pan, design planning not construction labor, no logos, no on-screen text, natural daylight, professional architectural workspace, 1:1.',
}

export function homeServiceVideoAssetId(id: string): string {
  return id === 'design' ? 'design-concept-video' : `${id}-video`
}
