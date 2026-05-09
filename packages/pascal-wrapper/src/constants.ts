/**
 * @kealee/pascal-wrapper — Constants & Catalog
 *
 * Element catalog, material library, design styles, and construction
 * mappings used across the Pascal Editor integration.
 */

import type { FurnitureCategory, ProjectType, RoomType, DesignStyle } from './types'

// ---------------------------------------------------------------------------
// Furniture catalog (canonical elements)
// ---------------------------------------------------------------------------

export interface CatalogItem {
  id: string
  label: string
  category: FurnitureCategory
  width: number   // feet
  depth: number   // feet
  height: number  // feet
  symbol: string  // SVG path or emoji for 2D plan
}

export const FURNITURE_CATALOG: CatalogItem[] = [
  // Seating
  { id: 'sofa_3seat',    label: '3-Seat Sofa',          category: 'seating',           width: 8,    depth: 3,    height: 3,    symbol: '🛋' },
  { id: 'sofa_loveseat', label: 'Loveseat',              category: 'seating',           width: 5.5,  depth: 3,    height: 3,    symbol: '🛋' },
  { id: 'armchair',      label: 'Armchair',              category: 'seating',           width: 3,    depth: 3,    height: 3,    symbol: '🪑' },
  // Tables
  { id: 'dining_6',      label: 'Dining Table (6-seat)', category: 'table',             width: 6,    depth: 3,    height: 2.5,  symbol: '⬜' },
  { id: 'dining_4',      label: 'Dining Table (4-seat)', category: 'table',             width: 4,    depth: 3,    height: 2.5,  symbol: '⬜' },
  { id: 'coffee_table',  label: 'Coffee Table',          category: 'table',             width: 4,    depth: 2,    height: 1.5,  symbol: '⬜' },
  { id: 'desk',          label: 'Desk',                  category: 'table',             width: 5,    depth: 2.5,  height: 2.5,  symbol: '⬜' },
  // Kitchen appliances
  { id: 'fridge',        label: 'Refrigerator',          category: 'kitchen_appliance', width: 3,    depth: 2.5,  height: 6,    symbol: '🧊' },
  { id: 'range',         label: 'Range / Oven',          category: 'kitchen_appliance', width: 2.5,  depth: 2.5,  height: 3,    symbol: '🍳' },
  { id: 'dishwasher',    label: 'Dishwasher',            category: 'kitchen_appliance', width: 2,    depth: 2,    height: 3,    symbol: '⬜' },
  { id: 'microwave',     label: 'Microwave',             category: 'kitchen_appliance', width: 2,    depth: 1.5,  height: 1.5,  symbol: '⬜' },
  // Kitchen
  { id: 'island_4x3',   label: 'Kitchen Island (4×3)',   category: 'island',            width: 4,    depth: 3,    height: 3,    symbol: '⬜' },
  { id: 'island_6x3',   label: 'Kitchen Island (6×3)',   category: 'island',            width: 6,    depth: 3,    height: 3,    symbol: '⬜' },
  { id: 'upper_cab_3',  label: 'Upper Cabinet (3ft)',    category: 'kitchen_cabinet',   width: 3,    depth: 1,    height: 2.5,  symbol: '⬛' },
  { id: 'base_cab_3',   label: 'Base Cabinet (3ft)',     category: 'kitchen_cabinet',   width: 3,    depth: 2,    height: 3,    symbol: '⬛' },
  { id: 'pantry_cab',   label: 'Pantry Cabinet',         category: 'kitchen_cabinet',   width: 2,    depth: 2,    height: 7,    symbol: '⬛' },
  // Bath fixtures
  { id: 'tub_std',      label: 'Standard Tub',           category: 'bath_fixture',      width: 5,    depth: 2.5,  height: 2,    symbol: '🛁' },
  { id: 'tub_free',     label: 'Freestanding Tub',       category: 'bath_fixture',      width: 6,    depth: 3,    height: 2.5,  symbol: '🛁' },
  { id: 'shower_36',    label: 'Shower (36×36)',          category: 'bath_fixture',      width: 3,    depth: 3,    height: 7.5,  symbol: '🚿' },
  { id: 'shower_48',    label: 'Shower (48×36)',          category: 'bath_fixture',      width: 4,    depth: 3,    height: 7.5,  symbol: '🚿' },
  { id: 'toilet',       label: 'Toilet',                 category: 'bath_fixture',      width: 1.5,  depth: 2.5,  height: 2.5,  symbol: '🚽' },
  { id: 'sink_vanity',  label: 'Vanity Sink (24)',        category: 'bath_fixture',      width: 2,    depth: 1.5,  height: 2.5,  symbol: '⬜' },
  { id: 'sink_double',  label: 'Double Vanity (60)',      category: 'bath_fixture',      width: 5,    depth: 1.75, height: 2.5,  symbol: '⬜' },
  // Beds
  { id: 'bed_king',     label: 'King Bed',               category: 'bed',               width: 6.5,  depth: 6.75, height: 2.5,  symbol: '🛏' },
  { id: 'bed_queen',    label: 'Queen Bed',              category: 'bed',               width: 5,    depth: 6.75, height: 2.5,  symbol: '🛏' },
  { id: 'bed_full',     label: 'Full Bed',               category: 'bed',               width: 4.5,  depth: 6.25, height: 2.5,  symbol: '🛏' },
  { id: 'bed_twin',     label: 'Twin Bed',               category: 'bed',               width: 3.25, depth: 6.25, height: 2.5,  symbol: '🛏' },
  // Storage
  { id: 'wardrobe',     label: 'Wardrobe',               category: 'storage',           width: 5,    depth: 2,    height: 7,    symbol: '⬛' },
  { id: 'dresser',      label: 'Dresser',                category: 'storage',           width: 4,    depth: 1.5,  height: 3.5,  symbol: '⬛' },
  { id: 'bookshelf',    label: 'Bookshelf',              category: 'storage',           width: 3,    depth: 1,    height: 7,    symbol: '⬛' },
  // Other
  { id: 'washer',       label: 'Washer',                 category: 'other',             width: 2.25, depth: 2.25, height: 3.5,  symbol: '⬜' },
  { id: 'dryer',        label: 'Dryer',                  category: 'other',             width: 2.25, depth: 2.25, height: 3.5,  symbol: '⬜' },
  { id: 'hvac_unit',    label: 'HVAC Unit',              category: 'hvac',              width: 3,    depth: 1.5,  height: 1.5,  symbol: '⬜' },
]

// ---------------------------------------------------------------------------
// Project type config
// ---------------------------------------------------------------------------

export const PROJECT_TYPE_CONFIG: Record<ProjectType, {
  label: string
  icon: string
  defaultRooms: RoomType[]
  defaultStyle: DesignStyle
  budgetRange: string
  timelineWeeks: string
}> = {
  addition: {
    label: 'Home Addition',
    icon: '🏗',
    defaultRooms: ['bedroom', 'bathroom', 'living'],
    defaultStyle: 'transitional',
    budgetRange: '$80K – $400K',
    timelineWeeks: '16–28 wks',
  },
  kitchen_remodel: {
    label: 'Kitchen Remodel',
    icon: '🍳',
    defaultRooms: ['kitchen', 'dining'],
    defaultStyle: 'modern',
    budgetRange: '$25K – $120K',
    timelineWeeks: '12–16 wks',
  },
  bath_remodel: {
    label: 'Bath Remodel',
    icon: '🛁',
    defaultRooms: ['bathroom'],
    defaultStyle: 'contemporary',
    budgetRange: '$10K – $60K',
    timelineWeeks: '6–10 wks',
  },
  whole_house: {
    label: 'Whole House Renovation',
    icon: '🏠',
    defaultRooms: ['living', 'dining', 'kitchen', 'bedroom', 'bathroom'],
    defaultStyle: 'transitional',
    budgetRange: '$150K – $800K',
    timelineWeeks: '24–48 wks',
  },
  basement: {
    label: 'Basement Finish',
    icon: '⬇',
    defaultRooms: ['game_room', 'bathroom', 'utility'],
    defaultStyle: 'modern',
    budgetRange: '$20K – $100K',
    timelineWeeks: '8–14 wks',
  },
  adu: {
    label: 'ADU / In-law Suite',
    icon: '🏡',
    defaultRooms: ['living', 'bedroom', 'bathroom', 'kitchen'],
    defaultStyle: 'modern',
    budgetRange: '$100K – $350K',
    timelineWeeks: '16–28 wks',
  },
  garage: {
    label: 'Garage Build / Convert',
    icon: '🚗',
    defaultRooms: ['garage'],
    defaultStyle: 'contemporary',
    budgetRange: '$20K – $80K',
    timelineWeeks: '6–12 wks',
  },
  deck: {
    label: 'Deck / Patio',
    icon: '🌿',
    defaultRooms: ['deck', 'patio'],
    defaultStyle: 'modern',
    budgetRange: '$12K – $60K',
    timelineWeeks: '4–8 wks',
  },
  new_construction: {
    label: 'New Construction',
    icon: '🏢',
    defaultRooms: ['living', 'dining', 'kitchen', 'bedroom', 'bathroom', 'garage'],
    defaultStyle: 'contemporary',
    budgetRange: '$500K – $5M+',
    timelineWeeks: '6–24+ mo',
  },
  commercial: {
    label: 'Commercial Renovation',
    icon: '🏪',
    defaultRooms: ['other'],
    defaultStyle: 'modern',
    budgetRange: 'Custom',
    timelineWeeks: 'Varies',
  },
  exterior: {
    label: 'Exterior / Facade',
    icon: '🏘',
    defaultRooms: ['other'],
    defaultStyle: 'contemporary',
    budgetRange: '$15K – $80K',
    timelineWeeks: '6–12 wks',
  },
  interior_reno: {
    label: 'Interior Renovation',
    icon: '🪟',
    defaultRooms: ['living', 'bedroom'],
    defaultStyle: 'modern',
    budgetRange: '$20K – $150K',
    timelineWeeks: '8–16 wks',
  },
}

// ---------------------------------------------------------------------------
// Room display colors
// ---------------------------------------------------------------------------

export const ROOM_COLORS: Record<RoomType, string> = {
  living:       '#E3F2FD',
  dining:       '#FFF8E1',
  kitchen:      '#E8F5E9',
  bedroom:      '#F3E5F5',
  bathroom:     '#E0F7FA',
  half_bath:    '#B2EBF2',
  office:       '#FBE9E7',
  garage:       '#ECEFF1',
  basement:     '#E0E0E0',
  utility:      '#EFEBE9',
  hallway:      '#F5F5F5',
  closet:       '#FAFAFA',
  mud_room:     '#F1F8E9',
  foyer:        '#FFF3E0',
  sunroom:      '#FFFDE7',
  game_room:    '#EDE7F6',
  gym:          '#FCE4EC',
  studio:       '#E8EAF6',
  deck:         '#E8F5E9',
  patio:        '#F1F8E9',
  other:        '#EEEEEE',
}

// ---------------------------------------------------------------------------
// Material display names
// ---------------------------------------------------------------------------

export const MATERIAL_LABELS: Record<string, string> = {
  hardwood:      'Hardwood',
  tile:          'Ceramic Tile',
  carpet:        'Carpet',
  concrete:      'Concrete',
  marble:        'Marble',
  laminate:      'Laminate',
  vinyl:         'Luxury Vinyl',
  white_shaker:  'White Shaker',
  dark_shaker:   'Dark Shaker',
  glass:         'Glass',
  brick:         'Brick',
  stone:         'Stone',
  drywall:       'Drywall',
  wood_panel:    'Wood Panel',
}

// ---------------------------------------------------------------------------
// Kealee construction reels by project type
// ---------------------------------------------------------------------------

export const CONSTRUCTION_REELS: Record<ProjectType, { title: string; tags: string[] }[]> = {
  kitchen_remodel: [
    { title: 'Demolition & Framing',     tags: ['demo', 'framing'] },
    { title: 'Cabinet Installation',      tags: ['cabinets', 'millwork'] },
    { title: 'Countertop Installation',   tags: ['countertops', 'stone'] },
    { title: 'Backsplash & Tile',         tags: ['tile', 'backsplash'] },
    { title: 'Appliance Install',         tags: ['appliances', 'plumbing'] },
    { title: 'Final Reveal',              tags: ['reveal', 'finished'] },
  ],
  bath_remodel: [
    { title: 'Demo & Rough-In',           tags: ['demo', 'plumbing'] },
    { title: 'Tile & Waterproofing',      tags: ['tile', 'waterproof'] },
    { title: 'Vanity & Fixtures',         tags: ['vanity', 'fixtures'] },
    { title: 'Shower Glass Install',      tags: ['glass', 'shower'] },
    { title: 'Final Reveal',              tags: ['reveal', 'finished'] },
  ],
  addition: [
    { title: 'Excavation & Foundation',   tags: ['excavation', 'foundation'] },
    { title: 'Framing',                   tags: ['framing', 'structure'] },
    { title: 'Roofing',                   tags: ['roofing', 'waterproof'] },
    { title: 'MEP Rough-In',              tags: ['electrical', 'plumbing', 'hvac'] },
    { title: 'Insulation & Drywall',      tags: ['insulation', 'drywall'] },
    { title: 'Finishes',                  tags: ['finishes', 'paint'] },
    { title: 'Final Reveal',              tags: ['reveal', 'finished'] },
  ],
  whole_house: [
    { title: 'Full Demo',                 tags: ['demo', 'gut-rehab'] },
    { title: 'Structural Work',           tags: ['structural', 'framing'] },
    { title: 'MEP Systems',              tags: ['electrical', 'plumbing', 'hvac'] },
    { title: 'Finishes & Millwork',       tags: ['finishes', 'millwork'] },
    { title: 'Final Reveal',              tags: ['reveal', 'finished'] },
  ],
  basement: [
    { title: 'Waterproofing',             tags: ['waterproofing', 'foundation'] },
    { title: 'Framing & Egress',          tags: ['framing', 'egress'] },
    { title: 'Electrical & HVAC',         tags: ['electrical', 'hvac'] },
    { title: 'Flooring & Finishes',       tags: ['flooring', 'finishes'] },
  ],
  adu:           [{ title: 'ADU Build Timelapse',     tags: ['adu', 'timelapse'] }],
  garage:        [{ title: 'Garage Build Timelapse',  tags: ['garage', 'timelapse'] }],
  deck:          [{ title: 'Deck Build Timelapse',    tags: ['deck', 'outdoor'] }],
  new_construction: [{ title: 'Ground-Up Build',     tags: ['new-construction', 'foundation'] }],
  commercial:    [{ title: 'Commercial Renovation',  tags: ['commercial', 'renovation'] }],
  exterior:      [{ title: 'Exterior Transformation', tags: ['exterior', 'facade'] }],
  interior_reno: [{ title: 'Interior Renovation',    tags: ['interior', 'finishes'] }],
}

// ---------------------------------------------------------------------------
// Consultation gate rules
// ---------------------------------------------------------------------------

export const CONSULTATION_GATE_PRODUCTS = [
  'design_package',
  'permit_package',
  'design_build_package',
  'professional_drawings',
] as const

export type ConsultationGateProduct = typeof CONSULTATION_GATE_PRODUCTS[number]
