/**
 * Project Type → Assembly Mappings
 *
 * Maps marketplace project types to their default assembly codes and quantities.
 * Used by the estimating engine to auto-generate quick estimates from project type + sqft.
 */

export interface AssemblyMapping {
  code: string
  quantityPer: 'sqft' | 'fixed'
  multiplier?: number // used when quantityPer = 'sqft'
  quantity?: number   // used when quantityPer = 'fixed'
}

export interface ProjectTypeConfig {
  name: string
  defaultSqft: number
  assemblies: AssemblyMapping[]
}

export const PROJECT_TYPE_ASSEMBLIES: Record<string, ProjectTypeConfig> = {
  kitchen_renovation: {
    name: 'Kitchen Renovation',
    defaultSqft: 150,
    assemblies: [
      { code: 'KIT-DEMO-STD', quantityPer: 'sqft', multiplier: 1.0 },
      { code: 'KIT-CAB-STD', quantityPer: 'fixed', quantity: 25 },
      { code: 'KIT-CAB-UPPER', quantityPer: 'fixed', quantity: 20 },
      { code: 'KIT-COUNT-GRAN', quantityPer: 'fixed', quantity: 40 },
      { code: 'KIT-PLUMB-ROUGH', quantityPer: 'fixed', quantity: 1 },
      { code: 'KIT-PLUMB-FINISH', quantityPer: 'fixed', quantity: 1 },
      { code: 'KIT-ELEC-ROUGH', quantityPer: 'fixed', quantity: 1 },
      { code: 'KIT-ELEC-FINISH', quantityPer: 'fixed', quantity: 1 },
      { code: 'KIT-TILE-BACK', quantityPer: 'fixed', quantity: 30 },
      { code: 'KIT-FLOOR-STD', quantityPer: 'sqft', multiplier: 1.0 },
      { code: 'KIT-PAINT-INT', quantityPer: 'sqft', multiplier: 3.5 },
      { code: 'KIT-APPL-STD', quantityPer: 'fixed', quantity: 1 },
      { code: 'KIT-LIGHT-STD', quantityPer: 'fixed', quantity: 6 },
      { code: 'GEN-DUMPSTER', quantityPer: 'fixed', quantity: 1 },
      { code: 'GEN-CLEANUP', quantityPer: 'sqft', multiplier: 1.0 },
    ],
  },

  bathroom_remodel: {
    name: 'Bathroom Remodel',
    defaultSqft: 75,
    assemblies: [
      { code: 'BATH-DEMO-STD', quantityPer: 'sqft', multiplier: 1.0 },
      { code: 'BATH-TILE-FLR', quantityPer: 'sqft', multiplier: 1.0 },
      { code: 'BATH-TILE-WALL', quantityPer: 'sqft', multiplier: 2.5 },
      { code: 'BATH-VANITY-STD', quantityPer: 'fixed', quantity: 1 },
      { code: 'BATH-TOILET-STD', quantityPer: 'fixed', quantity: 1 },
      { code: 'BATH-TUB-STD', quantityPer: 'fixed', quantity: 1 },
      { code: 'BATH-PLUMB-ROUGH', quantityPer: 'fixed', quantity: 1 },
      { code: 'BATH-PLUMB-FINISH', quantityPer: 'fixed', quantity: 1 },
      { code: 'BATH-ELEC-ROUGH', quantityPer: 'fixed', quantity: 1 },
      { code: 'BATH-ELEC-FINISH', quantityPer: 'fixed', quantity: 1 },
      { code: 'BATH-VENT-FAN', quantityPer: 'fixed', quantity: 1 },
      { code: 'BATH-MIRROR-STD', quantityPer: 'fixed', quantity: 1 },
      { code: 'BATH-PAINT-INT', quantityPer: 'sqft', multiplier: 3.0 },
      { code: 'BATH-ACCESS-STD', quantityPer: 'fixed', quantity: 1 },
      { code: 'GEN-DUMPSTER', quantityPer: 'fixed', quantity: 1 },
    ],
  },

  roof_replacement: {
    name: 'Roof Replacement',
    defaultSqft: 2000,
    assemblies: [
      { code: 'ROOF-TEAR-OFF', quantityPer: 'sqft', multiplier: 0.01 },
      { code: 'ROOF-SHEATH-RPR', quantityPer: 'sqft', multiplier: 0.1 },
      { code: 'ROOF-FELT-UNDER', quantityPer: 'sqft', multiplier: 0.01 },
      { code: 'ROOF-SHINGLE-ARCH', quantityPer: 'sqft', multiplier: 0.01 },
      { code: 'ROOF-RIDGE-VENT', quantityPer: 'fixed', quantity: 40 },
      { code: 'ROOF-DRIP-EDGE', quantityPer: 'sqft', multiplier: 0.15 },
      { code: 'ROOF-FLASH-STD', quantityPer: 'fixed', quantity: 6 },
      { code: 'ROOF-BOOT-PIPE', quantityPer: 'fixed', quantity: 4 },
      { code: 'ROOF-GUTTER-STD', quantityPer: 'sqft', multiplier: 0.1 },
      { code: 'GEN-DUMPSTER', quantityPer: 'fixed', quantity: 2 },
      { code: 'GEN-CLEANUP', quantityPer: 'sqft', multiplier: 1.0 },
    ],
  },

  deck_construction: {
    name: 'Deck Construction',
    defaultSqft: 300,
    assemblies: [
      { code: 'DECK-FRAME-STD', quantityPer: 'sqft', multiplier: 1.0 },
      { code: 'DECK-DECK-COMP', quantityPer: 'sqft', multiplier: 1.0 },
      { code: 'DECK-RAIL-STD', quantityPer: 'fixed', quantity: 40 },
      { code: 'DECK-STAIRS-STD', quantityPer: 'fixed', quantity: 1 },
      { code: 'DECK-POST-STD', quantityPer: 'fixed', quantity: 8 },
      { code: 'DECK-FOOTER-STD', quantityPer: 'fixed', quantity: 8 },
      { code: 'DECK-LEDGER-STD', quantityPer: 'fixed', quantity: 16 },
      { code: 'DECK-FLASH-STD', quantityPer: 'fixed', quantity: 16 },
      { code: 'DECK-PERMIT', quantityPer: 'fixed', quantity: 1 },
    ],
  },

  basement_finishing: {
    name: 'Basement Finishing',
    defaultSqft: 800,
    assemblies: [
      { code: 'BASE-FRAME-STD', quantityPer: 'sqft', multiplier: 1.0 },
      { code: 'BASE-INSUL-STD', quantityPer: 'sqft', multiplier: 1.0 },
      { code: 'BASE-DRYWALL-STD', quantityPer: 'sqft', multiplier: 3.0 },
      { code: 'BASE-ELEC-ROUGH', quantityPer: 'sqft', multiplier: 1.0 },
      { code: 'BASE-ELEC-FINISH', quantityPer: 'sqft', multiplier: 1.0 },
      { code: 'BASE-PLUMB-ROUGH', quantityPer: 'fixed', quantity: 1 },
      { code: 'BASE-FLOOR-STD', quantityPer: 'sqft', multiplier: 1.0 },
      { code: 'BASE-CEIL-STD', quantityPer: 'sqft', multiplier: 1.0 },
      { code: 'BASE-PAINT-INT', quantityPer: 'sqft', multiplier: 3.5 },
      { code: 'BASE-DOOR-INT', quantityPer: 'fixed', quantity: 3 },
      { code: 'BASE-TRIM-STD', quantityPer: 'sqft', multiplier: 0.5 },
      { code: 'BASE-HVAC-EXT', quantityPer: 'fixed', quantity: 1 },
      { code: 'GEN-DUMPSTER', quantityPer: 'fixed', quantity: 1 },
      { code: 'GEN-PERMIT', quantityPer: 'fixed', quantity: 1 },
    ],
  },

  room_addition: {
    name: 'Room Addition',
    defaultSqft: 250,
    assemblies: [
      { code: 'ADD-FOUND-STD', quantityPer: 'sqft', multiplier: 1.0 },
      { code: 'ADD-FRAME-WALL', quantityPer: 'sqft', multiplier: 3.0 },
      { code: 'ADD-FRAME-ROOF', quantityPer: 'sqft', multiplier: 1.2 },
      { code: 'ADD-ROOF-STD', quantityPer: 'sqft', multiplier: 1.2 },
      { code: 'ADD-WINDOW-STD', quantityPer: 'fixed', quantity: 3 },
      { code: 'ADD-DOOR-EXT', quantityPer: 'fixed', quantity: 1 },
      { code: 'ADD-SIDING-STD', quantityPer: 'sqft', multiplier: 3.0 },
      { code: 'ADD-INSUL-STD', quantityPer: 'sqft', multiplier: 3.5 },
      { code: 'ADD-DRYWALL-STD', quantityPer: 'sqft', multiplier: 3.5 },
      { code: 'ADD-ELEC-STD', quantityPer: 'sqft', multiplier: 1.0 },
      { code: 'ADD-HVAC-EXT', quantityPer: 'fixed', quantity: 1 },
      { code: 'ADD-PLUMB-STD', quantityPer: 'fixed', quantity: 1 },
      { code: 'ADD-FLOOR-STD', quantityPer: 'sqft', multiplier: 1.0 },
      { code: 'ADD-PAINT-STD', quantityPer: 'sqft', multiplier: 3.5 },
      { code: 'ADD-TRIM-STD', quantityPer: 'sqft', multiplier: 0.5 },
      { code: 'GEN-DUMPSTER', quantityPer: 'fixed', quantity: 2 },
      { code: 'GEN-PERMIT', quantityPer: 'fixed', quantity: 1 },
    ],
  },

  painting_interior: {
    name: 'Interior Painting',
    defaultSqft: 1500,
    assemblies: [
      { code: 'PAINT-PREP-INT', quantityPer: 'sqft', multiplier: 3.5 },
      { code: 'PAINT-WALL-INT', quantityPer: 'sqft', multiplier: 3.5 },
      { code: 'PAINT-CEIL-INT', quantityPer: 'sqft', multiplier: 1.0 },
      { code: 'PAINT-TRIM-INT', quantityPer: 'sqft', multiplier: 0.5 },
      { code: 'PAINT-DOOR-INT', quantityPer: 'fixed', quantity: 8 },
      { code: 'GEN-PROTECT-FLR', quantityPer: 'sqft', multiplier: 1.0 },
    ],
  },

  painting_exterior: {
    name: 'Exterior Painting',
    defaultSqft: 2000,
    assemblies: [
      { code: 'PAINT-PREP-EXT', quantityPer: 'sqft', multiplier: 1.0 },
      { code: 'PAINT-BODY-EXT', quantityPer: 'sqft', multiplier: 1.0 },
      { code: 'PAINT-TRIM-EXT', quantityPer: 'sqft', multiplier: 0.15 },
      { code: 'PAINT-DOOR-EXT', quantityPer: 'fixed', quantity: 2 },
      { code: 'PAINT-SHUTT-EXT', quantityPer: 'fixed', quantity: 10 },
      { code: 'GEN-SCAFFOLD-EXT', quantityPer: 'fixed', quantity: 1 },
    ],
  },

  flooring_install: {
    name: 'Flooring Installation',
    defaultSqft: 500,
    assemblies: [
      { code: 'FLR-DEMO-STD', quantityPer: 'sqft', multiplier: 1.0 },
      { code: 'FLR-SUBFLOOR-RPR', quantityPer: 'sqft', multiplier: 0.1 },
      { code: 'FLR-LVP-STD', quantityPer: 'sqft', multiplier: 1.0 },
      { code: 'FLR-TRANS-STD', quantityPer: 'fixed', quantity: 5 },
      { code: 'FLR-BASE-STD', quantityPer: 'sqft', multiplier: 0.3 },
      { code: 'GEN-PROTECT-FLR', quantityPer: 'sqft', multiplier: 0.5 },
    ],
  },

  hvac_replacement: {
    name: 'HVAC System Replacement',
    defaultSqft: 2000,
    assemblies: [
      { code: 'HVAC-FURNACE-STD', quantityPer: 'fixed', quantity: 1 },
      { code: 'HVAC-AC-STD', quantityPer: 'fixed', quantity: 1 },
      { code: 'HVAC-DUCT-STD', quantityPer: 'sqft', multiplier: 1.0 },
      { code: 'HVAC-THERM-STD', quantityPer: 'fixed', quantity: 1 },
      { code: 'HVAC-VENT-STD', quantityPer: 'fixed', quantity: 8 },
      { code: 'HVAC-LINE-REF', quantityPer: 'fixed', quantity: 25 },
      { code: 'HVAC-PAD-STD', quantityPer: 'fixed', quantity: 1 },
      { code: 'HVAC-ELEC-CONN', quantityPer: 'fixed', quantity: 1 },
      { code: 'GEN-PERMIT', quantityPer: 'fixed', quantity: 1 },
    ],
  },

  window_replacement: {
    name: 'Window Replacement',
    defaultSqft: 2000,
    assemblies: [
      { code: 'WIN-REMOVE-STD', quantityPer: 'fixed', quantity: 10 },
      { code: 'WIN-VINYL-DH', quantityPer: 'fixed', quantity: 10 },
      { code: 'WIN-TRIM-INT', quantityPer: 'fixed', quantity: 10 },
      { code: 'WIN-TRIM-EXT', quantityPer: 'fixed', quantity: 10 },
      { code: 'WIN-FLASH-STD', quantityPer: 'fixed', quantity: 10 },
      { code: 'WIN-INSUL-STD', quantityPer: 'fixed', quantity: 10 },
      { code: 'WIN-CAULK-STD', quantityPer: 'fixed', quantity: 10 },
    ],
  },

  siding_replacement: {
    name: 'Siding Replacement',
    defaultSqft: 1500,
    assemblies: [
      { code: 'SID-REMOVE-STD', quantityPer: 'sqft', multiplier: 1.0 },
      { code: 'SID-VINYL-STD', quantityPer: 'sqft', multiplier: 1.0 },
      { code: 'SID-WRAP-STD', quantityPer: 'sqft', multiplier: 1.0 },
      { code: 'SID-TRIM-STD', quantityPer: 'sqft', multiplier: 0.15 },
      { code: 'SID-CORNER-STD', quantityPer: 'fixed', quantity: 8 },
      { code: 'SID-JCHAN-STD', quantityPer: 'fixed', quantity: 60 },
      { code: 'GEN-SCAFFOLD-EXT', quantityPer: 'fixed', quantity: 1 },
      { code: 'GEN-DUMPSTER', quantityPer: 'fixed', quantity: 2 },
    ],
  },

  concrete_driveway: {
    name: 'Concrete Driveway',
    defaultSqft: 500,
    assemblies: [
      { code: 'CONC-DEMO-STD', quantityPer: 'sqft', multiplier: 1.0 },
      { code: 'CONC-GRADE-STD', quantityPer: 'sqft', multiplier: 1.0 },
      { code: 'CONC-FORM-STD', quantityPer: 'sqft', multiplier: 0.3 },
      { code: 'CONC-REBAR-STD', quantityPer: 'sqft', multiplier: 1.0 },
      { code: 'CONC-POUR-4IN', quantityPer: 'sqft', multiplier: 1.0 },
      { code: 'CONC-FINISH-STD', quantityPer: 'sqft', multiplier: 1.0 },
      { code: 'CONC-CURE-STD', quantityPer: 'sqft', multiplier: 1.0 },
      { code: 'GEN-DUMPSTER', quantityPer: 'fixed', quantity: 1 },
    ],
  },

  electrical_upgrade: {
    name: 'Electrical Panel Upgrade',
    defaultSqft: 2000,
    assemblies: [
      { code: 'ELEC-PANEL-200A', quantityPer: 'fixed', quantity: 1 },
      { code: 'ELEC-METER-STD', quantityPer: 'fixed', quantity: 1 },
      { code: 'ELEC-WIRE-MAIN', quantityPer: 'fixed', quantity: 1 },
      { code: 'ELEC-GROUND-STD', quantityPer: 'fixed', quantity: 1 },
      { code: 'ELEC-CIRCUIT-STD', quantityPer: 'fixed', quantity: 20 },
      { code: 'ELEC-RECEP-STD', quantityPer: 'fixed', quantity: 10 },
      { code: 'ELEC-GFCI-STD', quantityPer: 'fixed', quantity: 4 },
      { code: 'GEN-PERMIT', quantityPer: 'fixed', quantity: 1 },
    ],
  },

  plumbing_repipe: {
    name: 'Whole House Re-pipe',
    defaultSqft: 2000,
    assemblies: [
      { code: 'PLUMB-REPIPE-STD', quantityPer: 'sqft', multiplier: 1.0 },
      { code: 'PLUMB-SHUTOFF-STD', quantityPer: 'fixed', quantity: 12 },
      { code: 'PLUMB-PATCH-DRY', quantityPer: 'fixed', quantity: 15 },
      { code: 'PLUMB-FIXTURE-CONN', quantityPer: 'fixed', quantity: 8 },
      { code: 'PLUMB-WATER-HTR', quantityPer: 'fixed', quantity: 1 },
      { code: 'GEN-PERMIT', quantityPer: 'fixed', quantity: 1 },
    ],
  },

  landscaping: {
    name: 'Landscaping',
    defaultSqft: 3000,
    assemblies: [
      { code: 'LAND-GRADE-STD', quantityPer: 'sqft', multiplier: 1.0 },
      { code: 'LAND-SOD-STD', quantityPer: 'sqft', multiplier: 0.6 },
      { code: 'LAND-MULCH-STD', quantityPer: 'sqft', multiplier: 0.2 },
      { code: 'LAND-PLANT-SML', quantityPer: 'fixed', quantity: 15 },
      { code: 'LAND-PLANT-MED', quantityPer: 'fixed', quantity: 8 },
      { code: 'LAND-TREE-STD', quantityPer: 'fixed', quantity: 3 },
      { code: 'LAND-EDGE-STD', quantityPer: 'fixed', quantity: 100 },
      { code: 'LAND-IRRIG-STD', quantityPer: 'sqft', multiplier: 0.5 },
    ],
  },

  fence_install: {
    name: 'Fence Installation',
    defaultSqft: 200, // linear feet
    assemblies: [
      { code: 'FENCE-POST-WOOD', quantityPer: 'fixed', quantity: 25 },
      { code: 'FENCE-PANEL-WOOD', quantityPer: 'sqft', multiplier: 1.0 },
      { code: 'FENCE-GATE-STD', quantityPer: 'fixed', quantity: 1 },
      { code: 'FENCE-CONCRETE-POST', quantityPer: 'fixed', quantity: 25 },
      { code: 'FENCE-HARDWARE-STD', quantityPer: 'fixed', quantity: 1 },
    ],
  },
}

/**
 * Get all supported project types.
 */
export function getProjectTypes(): Array<{ key: string; name: string; defaultSqft: number }> {
  return Object.entries(PROJECT_TYPE_ASSEMBLIES).map(([key, config]) => ({
    key,
    name: config.name,
    defaultSqft: config.defaultSqft,
  }))
}

/**
 * Get assembly mappings for a project type.
 */
export function getAssembliesForProjectType(projectType: string): AssemblyMapping[] | null {
  return PROJECT_TYPE_ASSEMBLIES[projectType]?.assemblies ?? null
}
