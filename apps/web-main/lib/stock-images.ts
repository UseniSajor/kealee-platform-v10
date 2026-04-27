import type { MediaImage } from '@/components/media/types'

// Tiny 4×3 blur placeholder (same for all — imperceptible at display size)
const BLUR =
  'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAgGBgcGBQgHBwcJCQgKDBQNDAsLDBkSEw8UHRofHh0aHBwgJC4nICIsIxwcKDcpLDAxNDQ0Hyc5PTgyPC4zNDL/2wBDAQkJCQwLDBgNDRgyIRwhMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjL/wAARCAADAAQDASIAAhEBAxEB/8QAFgABAQEAAAAAAAAAAAAAAAAABgUEA//EAB4QAAICAQUAAAAAAAAAAAAAAAABAgMEERIhMf/EABQBAQAAAAAAAAAAAAAAAAAAAAD/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwCqaLY0kqx6ePTxT2rF3aKiuW3LWJ9EAAD/2Q=='

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

export const STOCK_IMAGES: Record<string, MediaImage[]> = {
  kitchen_remodel: [
    img('1556909114-f6e7ad7d3136', 'Modern kitchen with white cabinets and marble countertops', 'after'),
    img('1556909172-54557c7e8e4a', 'Kitchen island with pendant lights', 'detail'),
    img('1556909190-cd53c79e00c0', 'Open kitchen with stainless steel appliances', 'detail'),
    img('1484154218962-a197022b5858', 'Kitchen cabinet hardware detail', 'material'),
    img('1556909014-0284a50fc0c3', 'Before: dated kitchen with old cabinets', 'before'),
  ],
  bathroom_remodel: [
    img('1552321554-5fece8f469dc', 'Modern bathroom with freestanding tub', 'after'),
    img('1584622781564-1d987f7333c1', 'Walk-in shower with tile surround', 'detail'),
    img('1507003211169-0a1dd7228f2d', 'Double vanity with vessel sinks', 'detail'),
    img('1510627498534-cf7e69f7d128', 'Bathroom tile selection', 'material'),
    img('1552321555-a27c7f814c74', 'Before: outdated bathroom', 'before'),
  ],
  addition_expansion: [
    img('1503387762-592deb58ef4e', 'Home addition framing in progress', 'before'),
    img('1560184897-ae2d97f16f37', 'Completed home addition with large windows', 'after'),
    img('1541123437800-1bb1317badc2', 'Addition exterior view', 'detail'),
    img('1558618666-fcd25c85cd64', 'New addition interior space', 'detail'),
    img('1504307651254-35680f356dfd', 'Construction crew working on addition', 'before'),
  ],
  whole_home_remodel: [
    img('1560185007-c5ca9d2c014d', 'Open floor plan after whole-home renovation', 'after'),
    img('1560185008-b4a9d3f39f16', 'Living room with updated finishes', 'detail'),
    img('1556228453-efd6c1ff04f6', 'Dining area in renovated home', 'detail'),
    img('1560185009-dddecae14a8b', 'Before: original dated interior', 'before'),
    img('1555041469-149b832767c5', 'New flooring and trim throughout', 'material'),
  ],
  garden_concept: [
    img('1416879595882-3373a0480b5b', 'Lush garden landscape design', 'after'),
    img('1464822759023-fed622ff2c3b', 'Garden path and plant beds', 'detail'),
    img('1585320806297-9794b3e4eeae', 'Modern backyard with irrigation', 'detail'),
    img('1558618666-fcd25c85cd64', 'Plant material selections', 'material'),
    img('1416879595881-65fb3d6b7c09', 'Before: unlandscaped yard', 'before'),
  ],
  interior_renovation: [
    img('1616594039964-ae9021a400a0', 'Modern interior renovation with open plan', 'after'),
    img('1586023492125-27264a35f5db', 'Updated living space with new finishes', 'detail'),
    img('1560184897-ae2d97f16f37', 'Interior lighting and ceiling detail', 'detail'),
    img('1555041469-149b832767c5', 'Flooring material selection', 'material'),
    img('1484154218962-a197022b5858', 'Before: original interior', 'before'),
  ],
  exterior_concept: [
    img('1570129477492-45c003edd2be', 'Modern home exterior after renovation', 'after'),
    img('1558618666-fcd25c85cd64', 'Front facade with new siding', 'detail'),
    img('1564013799919-ab600027ffc6', 'Updated entry door and landscaping', 'detail'),
    img('1503387762-592deb58ef4e', 'Exterior material palette', 'material'),
    img('1487958449943-2429e8be8625', 'Before: original exterior facade', 'before'),
  ],
  interior_reno_concept: [
    img('1616594039964-ae9021a400a0', 'Interior concept render', 'after'),
    img('1586023492125-27264a35f5db', 'Living room concept', 'detail'),
    img('1555041469-149b832767c5', 'Bedroom concept design', 'detail'),
    img('1484154218962-a197022b5858', 'Material finishes', 'material'),
    img('1560184897-ae2d97f16f37', 'Before: current interior', 'before'),
  ],
  design_build: [
    img('1503387762-592deb58ef4e', 'Design-build project in progress', 'before'),
    img('1560185007-c5ca9d2c014d', 'Completed design-build project', 'after'),
    img('1541123437800-1bb1317badc2', 'Construction quality detail', 'detail'),
    img('1558618666-fcd25c85cd64', 'Building materials on site', 'material'),
    img('1570129477492-45c003edd2be', 'Final exterior result', 'after'),
  ],
}
