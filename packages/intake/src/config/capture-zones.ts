export type CaptureZone =
  | "front_exterior" | "rear_exterior" | "left_side_exterior" | "right_side_exterior"
  | "roof_visible" | "driveway" | "front_yard" | "rear_yard" | "porch" | "deck"
  | "garage_exterior" | "facade_detail" | "window_detail" | "door_entry"
  | "problem_area_exterior" | "hvac_exterior_unit" | "electrical_service_exterior" | "drainage_grading"
  | "entry" | "foyer" | "living_room" | "family_room" | "dining_room" | "kitchen" | "pantry"
  | "primary_bedroom" | "bedroom_2" | "bedroom_3" | "bedroom_4"
  | "primary_bath" | "bathroom_2" | "bathroom_3" | "hallway" | "stairs" | "laundry" | "mudroom"
  | "basement_finished" | "basement_unfinished" | "attic" | "crawlspace"
  | "garage_interior" | "utility_room" | "mechanical_room"
  | "hvac_air_handler" | "hvac_furnace" | "hvac_thermostat" | "water_heater"
  | "electrical_panel" | "plumbing_fixture_area" | "structural_concern_area" | "problem_area_interior"
  | "scan_room" | "scan_full_property";

export type CaptureAreaType = "interior" | "exterior" | "document" | "system";

export type SystemCategory =
  | "architecture" | "structure" | "roofing" | "envelope" | "hvac" | "plumbing"
  | "electrical" | "interiors" | "landscape" | "sitework" | "drainage" | "life_safety" | "accessibility";

export interface CaptureZoneMeta {
  zone: CaptureZone;
  displayName: string;
  areaType: CaptureAreaType;
  systemCategory?: SystemCategory;
  prompt: string;
  hvacPrompt?: string;
}

export const CAPTURE_ZONE_META: Record<CaptureZone, CaptureZoneMeta> = {
  front_exterior: { zone: "front_exterior", displayName: "Front Exterior", areaType: "exterior", prompt: "Stand at the street and capture the full front of the property. Include the roofline, facade, driveway approach, and any landscaping." },
  rear_exterior: { zone: "rear_exterior", displayName: "Rear Exterior", areaType: "exterior", prompt: "Capture the full rear of the property. Include the back yard, any decks, patios, or outbuildings." },
  left_side_exterior: { zone: "left_side_exterior", displayName: "Left Side Exterior", areaType: "exterior", prompt: "Capture the left side of the property from front to back." },
  right_side_exterior: { zone: "right_side_exterior", displayName: "Right Side Exterior", areaType: "exterior", prompt: "Capture the right side of the property from front to back." },
  roof_visible: { zone: "roof_visible", displayName: "Roof (Visible)", areaType: "exterior", systemCategory: "roofing", prompt: "Capture any visible roof surfaces, ridge, eaves, gutters, and any visible damage or wear." },
  driveway: { zone: "driveway", displayName: "Driveway", areaType: "exterior", systemCategory: "sitework", prompt: "Capture the full driveway surface, including any cracks, staining, or drainage issues." },
  front_yard: { zone: "front_yard", displayName: "Front Yard", areaType: "exterior", systemCategory: "landscape", prompt: "Capture the front yard, lawn, trees, shrubs, and any hardscape features." },
  rear_yard: { zone: "rear_yard", displayName: "Rear Yard", areaType: "exterior", systemCategory: "landscape", prompt: "Capture the rear yard, including lawn, gardens, fencing, and any drainage low points." },
  porch: { zone: "porch", displayName: "Porch", areaType: "exterior", prompt: "Capture the porch including floor surface, ceiling, columns, railing, and any visible issues." },
  deck: { zone: "deck", displayName: "Deck", areaType: "exterior", prompt: "Capture the full deck surface, railing, ledger connection, and any structural concerns." },
  garage_exterior: { zone: "garage_exterior", displayName: "Garage Exterior", areaType: "exterior", prompt: "Capture the garage door, exterior walls, roof connection, and any overhead utilities." },
  facade_detail: { zone: "facade_detail", displayName: "Facade Detail", areaType: "exterior", systemCategory: "envelope", prompt: "Close-up shots of siding material, brick, stucco, trim, and window casings. Look for cracks, peeling, rot, or moisture stains." },
  window_detail: { zone: "window_detail", displayName: "Window Detail", areaType: "exterior", systemCategory: "envelope", prompt: "Capture window frames, sills, and any visible glazing issues. Look for rot, failed seals, or damaged caulking." },
  door_entry: { zone: "door_entry", displayName: "Entry Door", areaType: "exterior", systemCategory: "envelope", prompt: "Capture the front door, threshold, storm door if present, and surrounding trim." },
  problem_area_exterior: { zone: "problem_area_exterior", displayName: "Problem Area (Exterior)", areaType: "exterior", prompt: "Capture any known exterior problem areas — water intrusion, foundation cracks, rotted wood. Describe in a voice note." },
  hvac_exterior_unit: { zone: "hvac_exterior_unit", displayName: "AC / Condenser Unit", areaType: "exterior", systemCategory: "hvac", prompt: "Find the outdoor AC condenser unit. Capture the full unit, refrigerant lines, disconnect box, and surrounding clearance.", hvacPrompt: "Capture the brand label / model number close-up. Note any rust, damaged fins, or refrigerant line insulation issues." },
  electrical_service_exterior: { zone: "electrical_service_exterior", displayName: "Electrical Service (Exterior)", areaType: "exterior", systemCategory: "electrical", prompt: "Capture the utility meter, service entrance, and weather head at the exterior." },
  drainage_grading: { zone: "drainage_grading", displayName: "Drainage / Grading", areaType: "exterior", systemCategory: "drainage", prompt: "Walk the perimeter and capture any areas where water pools, soil slopes toward the house, or drainage appears inadequate." },
  entry: { zone: "entry", displayName: "Entry / Foyer", areaType: "interior", systemCategory: "interiors", prompt: "Capture the entry from the front door looking in — floor, walls, ceiling, lighting, and any coat closet." },
  foyer: { zone: "foyer", displayName: "Foyer", areaType: "interior", systemCategory: "interiors", prompt: "Capture the foyer area including any formal entry features, staircase if visible, and natural light sources." },
  living_room: { zone: "living_room", displayName: "Living Room", areaType: "interior", systemCategory: "interiors", prompt: "Capture the living room from each corner. Include ceiling, floors, walls, windows, and any fireplace." },
  family_room: { zone: "family_room", displayName: "Family Room", areaType: "interior", systemCategory: "interiors", prompt: "Capture the family room from multiple angles. Note any built-ins, media wall, or connection to kitchen/outdoor." },
  dining_room: { zone: "dining_room", displayName: "Dining Room", areaType: "interior", systemCategory: "interiors", prompt: "Capture the dining room including any chandelier, built-in, or connection to kitchen." },
  kitchen: { zone: "kitchen", displayName: "Kitchen", areaType: "interior", systemCategory: "interiors", prompt: "Capture the full kitchen — cabinets, countertops, appliances, backsplash, sink, and any island. Wide and detail shots." },
  pantry: { zone: "pantry", displayName: "Pantry", areaType: "interior", systemCategory: "interiors", prompt: "Capture the pantry interior — shelving, organization, and any plumbing or utility connections." },
  primary_bedroom: { zone: "primary_bedroom", displayName: "Primary Bedroom", areaType: "interior", systemCategory: "interiors", prompt: "Capture the primary bedroom from multiple angles — ceiling, floors, windows, closet entry." },
  bedroom_2: { zone: "bedroom_2", displayName: "Bedroom 2", areaType: "interior", systemCategory: "interiors", prompt: "Capture bedroom 2 from multiple angles." },
  bedroom_3: { zone: "bedroom_3", displayName: "Bedroom 3", areaType: "interior", systemCategory: "interiors", prompt: "Capture bedroom 3 from multiple angles." },
  bedroom_4: { zone: "bedroom_4", displayName: "Bedroom 4", areaType: "interior", systemCategory: "interiors", prompt: "Capture bedroom 4 from multiple angles." },
  primary_bath: { zone: "primary_bath", displayName: "Primary Bath", areaType: "interior", systemCategory: "plumbing", prompt: "Capture the primary bathroom — vanity, tub, shower, toilet, tile work, ceiling, and any visible moisture issues." },
  bathroom_2: { zone: "bathroom_2", displayName: "Bathroom 2", areaType: "interior", systemCategory: "plumbing", prompt: "Capture bathroom 2 in full — all fixtures, tile, ceiling, and ventilation fan." },
  bathroom_3: { zone: "bathroom_3", displayName: "Bathroom 3", areaType: "interior", systemCategory: "plumbing", prompt: "Capture bathroom 3 in full." },
  hallway: { zone: "hallway", displayName: "Hallway", areaType: "interior", systemCategory: "interiors", prompt: "Capture the main hallway including doors, any built-ins, flooring, and lighting." },
  stairs: { zone: "stairs", displayName: "Staircase", areaType: "interior", systemCategory: "structure", prompt: "Capture the full staircase — handrail, balusters, treads, risers, and any structural concerns." },
  laundry: { zone: "laundry", displayName: "Laundry Room", areaType: "interior", systemCategory: "plumbing", prompt: "Capture the laundry room — washer/dryer connections, flooring, walls, and any moisture or drainage issues." },
  mudroom: { zone: "mudroom", displayName: "Mudroom", areaType: "interior", systemCategory: "interiors", prompt: "Capture the mudroom — floor, built-ins, hooks, and connection to garage or exterior." },
  basement_finished: { zone: "basement_finished", displayName: "Basement (Finished)", areaType: "interior", systemCategory: "interiors", prompt: "Capture the finished basement space from multiple angles — ceilings, walls, flooring, egress windows, and any moisture signs." },
  basement_unfinished: { zone: "basement_unfinished", displayName: "Basement (Unfinished)", areaType: "interior", systemCategory: "structure", prompt: "Capture foundation walls, floor slab, rim joist, beams, columns, and any cracks, efflorescence, or moisture." },
  attic: { zone: "attic", displayName: "Attic", areaType: "interior", systemCategory: "structure", prompt: "If accessible, capture the attic — insulation depth, ventilation, rafters or trusses, any moisture, pest damage, or daylight intrusion." },
  crawlspace: { zone: "crawlspace", displayName: "Crawlspace", areaType: "interior", systemCategory: "structure", prompt: "If accessible, capture the crawlspace — vapor barrier, insulation, floor joists, and any moisture, pests, or structural concerns." },
  garage_interior: { zone: "garage_interior", displayName: "Garage Interior", areaType: "interior", prompt: "Capture the garage interior — walls, floor, ceiling, door operator, and any storage or utility connections." },
  utility_room: { zone: "utility_room", displayName: "Utility Room", areaType: "interior", systemCategory: "hvac", prompt: "Capture the utility room overview — all major systems visible, piping, wiring, and any concerns." },
  mechanical_room: { zone: "mechanical_room", displayName: "Mechanical Room", areaType: "interior", systemCategory: "hvac", prompt: "Capture the mechanical room in full — HVAC equipment, water heater, electrical panel if present, and all piping/ductwork visible.", hvacPrompt: "Capture close-ups of equipment nameplates and any visible issues." },
  hvac_air_handler: { zone: "hvac_air_handler", displayName: "Air Handler / AHU", areaType: "interior", systemCategory: "hvac", prompt: "Locate the indoor air handler unit. Capture the full unit, supply plenum, return connection, and refrigerant lines.", hvacPrompt: "Capture the nameplate/label close-up. Note brand, model, SEER if visible, and any rust, condensate issues, or damaged insulation." },
  hvac_furnace: { zone: "hvac_furnace", displayName: "Furnace", areaType: "interior", systemCategory: "hvac", prompt: "Locate the furnace. Capture the full unit, flue connection, gas line, and filter compartment.", hvacPrompt: "Capture the nameplate. Note brand, age, BTU rating if visible, and condition of flue and burner chamber." },
  hvac_thermostat: { zone: "hvac_thermostat", displayName: "Thermostat", areaType: "interior", systemCategory: "hvac", prompt: "Capture the thermostat — brand, model, current settings, and any wiring visible at the base.", hvacPrompt: "Note if it's a smart thermostat (Nest, Ecobee, etc.) or a basic unit." },
  water_heater: { zone: "water_heater", displayName: "Water Heater", areaType: "interior", systemCategory: "plumbing", prompt: "Capture the water heater — full unit, flue or power vent, TPR valve, expansion tank if present, and age sticker.", hvacPrompt: "Capture the label showing age (serial number year code), capacity, and energy rating." },
  electrical_panel: { zone: "electrical_panel", displayName: "Electrical Panel", areaType: "interior", systemCategory: "electrical", prompt: "Capture the electrical panel — open the door if accessible and photograph breakers, bus bars, wiring, and label directory.", hvacPrompt: "Note brand (Federal Pacific / Zinsco are red flags), amperage rating, and any double-tapped breakers." },
  plumbing_fixture_area: { zone: "plumbing_fixture_area", displayName: "Plumbing Fixture Area", areaType: "interior", systemCategory: "plumbing", prompt: "Capture under-sink areas, visible supply and drain pipes, shutoff valves, and any signs of leaks or corrosion." },
  structural_concern_area: { zone: "structural_concern_area", displayName: "Structural Concern Area", areaType: "interior", systemCategory: "structure", prompt: "Capture any areas of structural concern — sagging floors, cracks in walls or ceilings, bowing walls, or unlevel framing." },
  problem_area_interior: { zone: "problem_area_interior", displayName: "Problem Area (Interior)", areaType: "interior", prompt: "Capture any known interior problem areas — water stains, mold, damaged flooring. Describe in a voice note." },
  scan_room: { zone: "scan_room", displayName: "3D Room Scan", areaType: "interior", prompt: "Move slowly around the room, holding your phone steady. Walk around all walls, then move to the center. LiDAR will capture room boundaries automatically. For video-based scan, move in a slow, continuous arc.", systemCategory: "architecture" },
  scan_full_property: { zone: "scan_full_property", displayName: "Full Property Scan", areaType: "exterior", prompt: "Walk the full perimeter of the property slowly with your phone held at chest height. Then capture the front, sides, and rear from a fixed position before walking inside for interior rooms.", systemCategory: "architecture" },
};

export const REQUIRED_CAPTURE_ZONES_BY_PROJECT_PATH: Record<string, CaptureZone[]> = {
  exterior_concept: ["front_exterior", "rear_exterior", "left_side_exterior", "right_side_exterior", "facade_detail", "front_yard", "hvac_exterior_unit"],
  interior_renovation: ["entry", "living_room", "kitchen", "primary_bath", "hallway", "problem_area_interior", "hvac_thermostat"],
  kitchen_remodel: ["kitchen", "dining_room", "entry", "problem_area_interior"],
  bathroom_remodel: ["primary_bath", "bathroom_2", "problem_area_interior"],
  whole_home_remodel: ["front_exterior", "rear_exterior", "entry", "living_room", "kitchen", "primary_bedroom", "primary_bath", "bathroom_2", "stairs", "basement_unfinished", "mechanical_room", "hvac_exterior_unit", "hvac_furnace", "water_heater", "electrical_panel", "problem_area_interior"],
  addition_expansion: ["front_exterior", "rear_exterior", "left_side_exterior", "right_side_exterior", "problem_area_exterior", "drainage_grading"],
  design_build: ["front_exterior", "rear_exterior", "left_side_exterior", "right_side_exterior", "roof_visible", "problem_area_exterior"],
  permit_path_only: ["problem_area_exterior"],
  capture_site_concept: ["front_exterior", "rear_exterior", "entry", "kitchen", "living_room", "problem_area_interior"],
};

// Paths that require a capture step before payment/review
export const CAPTURE_REQUIRED_PROJECT_PATHS = new Set([
  "kitchen_remodel",
  "bathroom_remodel",
  "whole_home_remodel",
  "addition_expansion",
  "capture_site_concept",
  "interior_renovation",
]);

export const HVAC_CAPTURE_ZONES: CaptureZone[] = [
  "hvac_exterior_unit", "hvac_air_handler", "hvac_furnace", "hvac_thermostat",
  "water_heater", "electrical_panel", "mechanical_room", "utility_room",
];

export function getRequiredZones(projectPath: string): CaptureZone[] {
  return REQUIRED_CAPTURE_ZONES_BY_PROJECT_PATH[projectPath] ?? ["front_exterior"];
}

export function isCaptureRequired(projectPath: string): boolean {
  return projectPath !== "permit_path_only" || REQUIRED_CAPTURE_ZONES_BY_PROJECT_PATH[projectPath]?.length > 0;
}

export function getZoneMeta(zone: CaptureZone): CaptureZoneMeta {
  return CAPTURE_ZONE_META[zone];
}
