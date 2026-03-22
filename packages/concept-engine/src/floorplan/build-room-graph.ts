/**
 * Build a room graph from intake input.
 * Maps project path → default room set → augment with capture zones.
 */

import type {
  ProjectPath,
  RoomType,
  RoomNode,
  RoomEdge,
  RoomGraph,
  ConceptIntakeInput,
} from './types';
import { inferRoomDimensions } from './infer-room-dimensions';

// Default room sets per project path
const PROJECT_PATH_ROOMS: Record<ProjectPath, RoomType[]> = {
  kitchen_remodel:    ['kitchen', 'dining', 'pantry'],
  bathroom_remodel:   ['primary_bathroom', 'secondary_bathroom', 'powder_room'],
  interior_renovation:['living', 'dining', 'kitchen', 'primary_bedroom',
                       'secondary_bedroom', 'primary_bathroom', 'secondary_bathroom', 'hallway'],
  whole_home_remodel: ['living', 'dining', 'kitchen', 'pantry', 'primary_bedroom',
                       'secondary_bedroom', 'primary_bathroom', 'secondary_bathroom',
                       'laundry', 'mudroom', 'hallway', 'garage'],
  addition_expansion: ['addition_room', 'connecting_hall', 'flex_room'],
  exterior_concept:   ['front_yard', 'rear_yard', 'porch', 'deck', 'driveway'],
};

export const ROOM_LABELS: Record<RoomType, string> = {
  kitchen:           'Kitchen',
  dining:            'Dining Room',
  living:            'Living Room',
  pantry:            'Pantry',
  primary_bedroom:   'Primary Bedroom',
  secondary_bedroom: 'Bedroom',
  primary_bathroom:  'Primary Bath',
  secondary_bathroom:'Bathroom',
  powder_room:       'Powder Room',
  laundry:           'Laundry',
  hallway:           'Hallway',
  garage:            'Garage',
  mudroom:           'Mudroom',
  office:            'Office',
  flex_room:         'Flex Room',
  addition_room:     'Addition',
  connecting_hall:   'Hall',
  front_yard:        'Front Yard',
  rear_yard:         'Rear Yard',
  side_yard:         'Side Yard',
  driveway:          'Driveway',
  porch:             'Porch',
  deck:              'Deck',
  covered_patio:     'Covered Patio',
  utility:           'Utility',
};

// Maps capture zone labels (from scan_room tagging) to room types
function captureZoneToRoomType(zone: string): RoomType | null {
  const normalized = zone.toLowerCase().replace(/[\s-]/g, '_');
  const mapping: Record<string, RoomType> = {
    kitchen:            'kitchen',
    dining:             'dining',
    dining_room:        'dining',
    living:             'living',
    living_room:        'living',
    pantry:             'pantry',
    primary_bedroom:    'primary_bedroom',
    master_bedroom:     'primary_bedroom',
    bedroom:            'secondary_bedroom',
    secondary_bedroom:  'secondary_bedroom',
    primary_bathroom:   'primary_bathroom',
    master_bath:        'primary_bathroom',
    bathroom:           'secondary_bathroom',
    bath:               'secondary_bathroom',
    powder_room:        'powder_room',
    half_bath:          'powder_room',
    laundry:            'laundry',
    hallway:            'hallway',
    hall:               'hallway',
    garage:             'garage',
    mudroom:            'mudroom',
    office:             'office',
    flex:               'flex_room',
    flex_room:          'flex_room',
    front_yard:         'front_yard',
    rear_yard:          'rear_yard',
    back_yard:          'rear_yard',
    side_yard:          'side_yard',
    driveway:           'driveway',
    porch:              'porch',
    deck:               'deck',
    patio:              'covered_patio',
    covered_patio:      'covered_patio',
    utility:            'utility',
  };
  return mapping[normalized] ?? null;
}

export function buildRoomGraph(input: ConceptIntakeInput): RoomGraph {
  const defaultTypes = PROJECT_PATH_ROOMS[input.projectPath];
  const roomTypeSet = new Set<RoomType>(defaultTypes);

  // Augment from completed capture zones
  if (input.captureZones) {
    for (const zone of input.captureZones) {
      const rt = captureZoneToRoomType(zone);
      if (rt) roomTypeSet.add(rt);
    }
  }

  const rooms: RoomNode[] = Array.from(roomTypeSet).map((type, idx) => {
    const dimensions = inferRoomDimensions(type, input);

    // Find matching capture asset for this room
    const asset = input.captureAssets?.find(a => captureZoneToRoomType(a.zone) === type);

    return {
      id: `room_${idx}_${type}`,
      type,
      label: ROOM_LABELS[type],
      dimensions,
      captureZone:    asset?.zone,
      aiLabel:        asset?.aiLabel,
      aiDescription:  asset?.aiDescription,
      notes:          asset?.aiDescription,
      issues:         [],
      placed:         false,
    };
  });

  const edges = buildDefaultEdges(rooms);
  return { rooms, edges, projectPath: input.projectPath };
}

// Adjacency rules: [from, to, type, weight]
type AdjRule = [RoomType, RoomType, 'direct' | 'nearby' | 'through_hall', number];

const ADJACENCY_RULES: AdjRule[] = [
  ['kitchen',           'dining',            'direct',      1.0],
  ['kitchen',           'pantry',            'direct',      0.9],
  ['dining',            'living',            'direct',      0.8],
  ['kitchen',           'mudroom',           'nearby',      0.7],
  ['primary_bedroom',   'primary_bathroom',  'direct',      1.0],
  ['secondary_bedroom', 'secondary_bathroom','nearby',      0.7],
  ['hallway',           'primary_bedroom',   'direct',      0.9],
  ['hallway',           'secondary_bedroom', 'direct',      0.9],
  ['hallway',           'primary_bathroom',  'direct',      0.8],
  ['laundry',           'mudroom',           'nearby',      0.6],
  ['garage',            'mudroom',           'direct',      0.8],
  ['porch',             'front_yard',        'direct',      0.9],
  ['deck',              'rear_yard',         'direct',      0.9],
  ['addition_room',     'connecting_hall',   'direct',      1.0],
  ['connecting_hall',   'flex_room',         'direct',      0.8],
  ['kitchen',           'living',            'through_hall',0.5],
];

function buildDefaultEdges(rooms: RoomNode[]): RoomEdge[] {
  const typeToId = new Map(rooms.map(r => [r.type, r.id]));
  const edges: RoomEdge[] = [];

  for (const [fromType, toType, adjType, weight] of ADJACENCY_RULES) {
    const fromId = typeToId.get(fromType);
    const toId   = typeToId.get(toType);
    if (fromId && toId) {
      edges.push({ fromId, toId, adjacencyType: adjType, weight });
    }
  }
  return edges;
}
