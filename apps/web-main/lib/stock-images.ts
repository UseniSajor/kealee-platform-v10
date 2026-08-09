import type { MediaImage } from '@/components/media/types'

// Tiny 4×3 blur placeholder (same for all — imperceptible at display size)
const BLUR =
  'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAgGBgcGBQgHBwcJCQgKDBQNDAsLDBkSEw8UHRofHh0aHBwgJC4nICIsIxwcKDcpLDAxNDQ0Hyc5PTgyPC4zNDL/2wBDAQkJCQwLDBgNDRgyIRwhMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjL/wAARCAADAAQDASIAAhEBAxEB/8QAFgABAQEAAAAAAAAAAAAAAAAABgUEA//EAB4QAAICAQUAAAAAAAAAAAAAAAABAgMEERIhMf/EABQBAQAAAAAAAAAAAAAAAAAAAAD/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwCqaLY0kqx6ePTxT2rF3aKiuW3LWJ9EAAD/2Q=='

/**
 * BEFORE/AFTER INTEGRITY (audit 2026-07-10):
 * - Every before/after pair below is a TRUE pair: the "before" is generated
 *   from the "after" render via img2img (same room/house, pre-renovation
 *   condition), stored locally under /media/service-photos/.
 * - Unsplash is used only for detail/material shots, each ID verified live
 *   (12 of the previous 29 IDs were 404s) and used on exactly ONE card.
 */

function img(
  id: string,
  alt: string,
  category: MediaImage['category'] = 'detail'
): MediaImage {
  return {
    src: `https://images.unsplash.com/photo-${id}?w=800&q=80&auto=format&fit=crop`,
    alt,
    width: 800,
    height: 600,
    blurDataUrl: BLUR,
    category,
  }
}

function local(
  file: string,
  alt: string,
  category: MediaImage['category']
): MediaImage {
  return {
    src: `/media/service-photos/${file}`,
    alt,
    width: 800,
    height: 600,
    blurDataUrl: BLUR,
    category,
  }
}

export const STOCK_IMAGES: Record<string, MediaImage[]> = {
  kitchen_remodel: [
    local('product-kitchen.jpg', 'Renovated kitchen with white shaker cabinets and new appliances', 'after'),
    local('product-kitchen-before.jpg', 'Before: the same kitchen with dated, damaged cabinets', 'before'),
    img('1484154218962-a197022b5858', 'Modern kitchen with dark tile backsplash', 'detail'),
    img('1541123437800-1bb1317badc2', 'White kitchen with pendant lighting', 'detail'),
    img('1556909114-f6e7ad7d3136', 'Family kitchen in daily use', 'detail'),
  ],
  bathroom_remodel: [
    local('product-bathroom.jpg', 'Renovated bathroom with walk-in glass shower', 'after'),
    local('product-bathroom-before.jpg', 'Before: the same bathroom with dated fixtures', 'before'),
  ],
  addition_expansion: [
    local('product-addition.jpg', 'Completed home addition', 'after'),
    local('product-addition-before.jpg', 'Before: the original house prior to the addition', 'before'),
    img('1504307651254-35680f356dfd', 'Structural work on an active build site', 'detail'),
  ],
  whole_home_remodel: [
    local('product-whole-house.jpg', 'Whole-home renovation — main living space', 'after'),
    local('product-whole-house-before.jpg', 'Before: the same space prior to renovation', 'before'),
    img('1560185007-c5ca9d2c014d', 'Open living area with updated finishes', 'detail'),
    img('1556228453-efd6c1ff04f6', 'Refreshed living room styling', 'detail'),
  ],
  garden_concept: [
    local('product-garden.jpg', 'Completed landscape design with paths and planting', 'after'),
    local('product-garden-before.jpg', 'Before: the same yard prior to landscaping', 'before'),
    img('1585320806297-9794b3e4eeae', 'Established garden path in bloom', 'detail'),
    img('1416879595882-3373a0480b5b', 'Soil and planting preparation', 'material'),
  ],
  interior_renovation: [
    local('product-interior.jpg', 'Renovated interior living space', 'after'),
    local('product-interior-before.jpg', 'Before: the same space prior to renovation', 'before'),
    img('1584622781564-1d987f7333c1', 'Living room with fireplace after refresh', 'detail'),
  ],
  exterior_concept: [
    local('product-facade.jpg', 'Renovated home exterior with new facade', 'after'),
    local('product-facade-before.jpg', 'Before: the same home with tired curb appeal', 'before'),
    img('1570129477492-45c003edd2be', 'Classic home exterior with fresh curb appeal', 'detail'),
  ],
  interior_reno_concept: [
    local('interior-reno-concept-after.jpg', 'Bedroom concept — renovated design', 'after'),
    local('interior-reno-concept-before.jpg', 'Before: the same bedroom prior to renovation', 'before'),
  ],
  design_build: [
    local('design-build-after.jpg', 'Completed custom design-build home', 'after'),
    local('design-build-before.jpg', 'The same home during construction — framing stage', 'before'),
    img('1503387762-592deb58ef4e', 'Design review at the drafting table', 'detail'),
  ],
}
