// ============================================================
// Kealee Platform – Construction Task Catalog (CTC) Seed Script
// DMV Region · 2026 Pricing (base ×1.13 inflation adjustment)
// ============================================================
//
// Creates a CostDatabase record for the CTC and bulk-inserts
// CTC tasks as Assembly records. Works with pre-parsed CTC data
// (from the ctc-parser service) or sample tasks for dev/testing.
//
// Usage:
//   npx tsx packages/estimating/src/seed-ctc.ts
// ============================================================

export interface CTCSeedTask {
  taskNumber: string;
  csiDivision: string;
  csiCode?: string;
  description: string;
  longDescription?: string;
  unit: string;
  unitPrice: number;
  laborCost: number;
  materialCost: number;
  equipmentCost: number;
  laborHours?: number;
  isModifier: boolean;
  modifierOf?: string;
  modifierType?: 'ADD' | 'DEDUCT' | 'REPLACE' | 'PERCENTAGE';
  modifierValue?: number;
  category?: string;
}

const CSI_TO_CATEGORY: Record<string, string> = {
  '01': 'GENERAL_CONDITIONS_ASSEMBLY',
  '02': 'DEMOLITION_ASSEMBLY',
  '03': 'CONCRETE_FLATWORK',
  '04': 'OTHER_ASSEMBLY',
  '05': 'OTHER_ASSEMBLY',
  '06': 'FRAMING',
  '07': 'ROOFING_ASSEMBLY',
  '08': 'DOORS_HARDWARE',
  '09': 'INTERIOR_FINISHES',
  '10': 'OTHER_ASSEMBLY',
  '11': 'OTHER_ASSEMBLY',
  '12': 'OTHER_ASSEMBLY',
  '13': 'OTHER_ASSEMBLY',
  '14': 'OTHER_ASSEMBLY',
  '21': 'OTHER_ASSEMBLY',
  '22': 'PLUMBING_ROUGH',
  '23': 'HVAC_ROUGH',
  '26': 'ELECTRICAL_ROUGH',
  '27': 'OTHER_ASSEMBLY',
  '28': 'OTHER_ASSEMBLY',
  '31': 'SITEWORK',
  '32': 'EXTERIOR_FINISHES',
  '33': 'OTHER_ASSEMBLY',
};

// Representative CTC tasks for dev/testing — 2026 DMV pricing (base ×1.13 inflation)
// Full catalog comes from structured import
export const CTC_SAMPLE_TASKS: CTCSeedTask[] = [
  // Division 01 - General Requirements
  { taskNumber: '01-001', csiDivision: '01', csiCode: '01 10 00', description: 'Mobilization and Demobilization', unit: 'EA', unitPrice: 2825.00, laborCost: 2118.75, materialCost: 423.75, equipmentCost: 282.50, laborHours: 24, isModifier: false, category: 'General Requirements' },
  { taskNumber: '01-002', csiDivision: '01', csiCode: '01 10 00', description: 'Project Management and Coordination', unit: 'HR', unitPrice: 96.05, laborCost: 96.05, materialCost: 0, equipmentCost: 0, laborHours: 1, isModifier: false, category: 'General Requirements' },
  { taskNumber: '01-003', csiDivision: '01', csiCode: '01 50 00', description: 'Temporary Facilities and Controls', unit: 'MO', unitPrice: 1356.00, laborCost: 452.00, materialCost: 678.00, equipmentCost: 226.00, laborHours: 8, isModifier: false, category: 'General Requirements' },
  { taskNumber: '01-010', csiDivision: '01', csiCode: '01 74 00', description: 'Construction Waste Disposal - Standard', unit: 'CY', unitPrice: 50.85, laborCost: 16.95, materialCost: 0, equipmentCost: 33.90, laborHours: 0.25, isModifier: false, category: 'Waste Management' },
  { taskNumber: '01-010.01', csiDivision: '01', csiCode: '01 74 00', description: 'Add for hazardous material disposal', unit: 'CY', unitPrice: 96.05, laborCost: 28.25, materialCost: 0, equipmentCost: 67.80, isModifier: true, modifierOf: '01-010', modifierType: 'ADD', modifierValue: 96.05, category: 'Waste Management' },

  // Division 02 - Existing Conditions
  { taskNumber: '02-001', csiDivision: '02', csiCode: '02 41 00', description: 'Selective Demolition - Interior Non-Bearing Wall', unit: 'LF', unitPrice: 14.13, laborCost: 11.30, materialCost: 0.57, equipmentCost: 2.26, laborHours: 0.25, isModifier: false, category: 'Demolition' },
  { taskNumber: '02-002', csiDivision: '02', csiCode: '02 41 00', description: 'Selective Demolition - Interior Bearing Wall', unit: 'LF', unitPrice: 31.64, laborCost: 22.60, materialCost: 2.26, equipmentCost: 6.78, laborHours: 0.5, isModifier: false, category: 'Demolition' },
  { taskNumber: '02-010', csiDivision: '02', csiCode: '02 41 00', description: 'Remove Existing Flooring - Carpet', unit: 'SF', unitPrice: 1.41, laborCost: 1.13, materialCost: 0, equipmentCost: 0.28, laborHours: 0.02, isModifier: false, category: 'Flooring Demolition' },
  { taskNumber: '02-011', csiDivision: '02', csiCode: '02 41 00', description: 'Remove Existing Flooring - Ceramic Tile', unit: 'SF', unitPrice: 4.24, laborCost: 3.39, materialCost: 0, equipmentCost: 0.85, laborHours: 0.06, isModifier: false, category: 'Flooring Demolition' },
  { taskNumber: '02-020', csiDivision: '02', csiCode: '02 41 00', description: 'Remove Existing Ceiling - Suspended ACT', unit: 'SF', unitPrice: 1.70, laborCost: 1.41, materialCost: 0, equipmentCost: 0.28, laborHours: 0.025, isModifier: false, category: 'Ceiling Demolition' },

  // Division 03 - Concrete
  { taskNumber: '03-001', csiDivision: '03', csiCode: '03 30 00', description: 'Cast-in-Place Concrete - Sidewalk, 4" thick', unit: 'SF', unitPrice: 14.13, laborCost: 5.65, materialCost: 6.22, equipmentCost: 2.26, laborHours: 0.12, isModifier: false, category: 'Concrete Flatwork' },
  { taskNumber: '03-001.01', csiDivision: '03', csiCode: '03 30 00', description: 'Add for 6" thick concrete', unit: 'SF', unitPrice: 3.96, laborCost: 1.13, materialCost: 2.54, equipmentCost: 0.28, isModifier: true, modifierOf: '03-001', modifierType: 'ADD', modifierValue: 3.96, category: 'Concrete Flatwork' },
  { taskNumber: '03-002', csiDivision: '03', csiCode: '03 30 00', description: 'Cast-in-Place Concrete - Curb and Gutter', unit: 'LF', unitPrice: 36.16, laborCost: 15.82, materialCost: 14.69, equipmentCost: 5.65, laborHours: 0.3, isModifier: false, category: 'Concrete Flatwork' },
  { taskNumber: '03-010', csiDivision: '03', csiCode: '03 11 00', description: 'Concrete Forming - Wall, to 8 ft height', unit: 'SF', unitPrice: 9.89, laborCost: 7.35, materialCost: 1.98, equipmentCost: 0.57, laborHours: 0.15, isModifier: false, category: 'Concrete Forms' },
  { taskNumber: '03-020', csiDivision: '03', csiCode: '03 21 00', description: 'Reinforcing Steel - #4 Rebar', unit: 'LB', unitPrice: 2.09, laborCost: 1.07, materialCost: 0.90, equipmentCost: 0.11, laborHours: 0.015, isModifier: false, category: 'Reinforcing' },

  // Division 06 - Wood, Plastics, and Composites
  { taskNumber: '06-001', csiDivision: '06', csiCode: '06 10 00', description: 'Wood Framing - Interior Wall, 2x4, 16" OC', unit: 'LF', unitPrice: 15.82, laborCost: 9.61, materialCost: 5.09, equipmentCost: 1.13, laborHours: 0.2, isModifier: false, category: 'Rough Carpentry' },
  { taskNumber: '06-001.01', csiDivision: '06', csiCode: '06 10 00', description: 'Add for 2x6 framing', unit: 'LF', unitPrice: 3.67, laborCost: 1.70, materialCost: 1.70, equipmentCost: 0.28, isModifier: true, modifierOf: '06-001', modifierType: 'ADD', modifierValue: 3.67, category: 'Rough Carpentry' },
  { taskNumber: '06-010', csiDivision: '06', csiCode: '06 20 00', description: 'Finish Carpentry - Base Trim, Paint Grade', unit: 'LF', unitPrice: 7.35, laborCost: 4.52, materialCost: 2.26, equipmentCost: 0.57, laborHours: 0.1, isModifier: false, category: 'Finish Carpentry' },
  { taskNumber: '06-011', csiDivision: '06', csiCode: '06 20 00', description: 'Finish Carpentry - Crown Molding, Paint Grade', unit: 'LF', unitPrice: 11.02, laborCost: 7.35, materialCost: 2.83, equipmentCost: 0.85, laborHours: 0.15, isModifier: false, category: 'Finish Carpentry' },

  // Division 07 - Thermal and Moisture Protection
  { taskNumber: '07-001', csiDivision: '07', csiCode: '07 21 00', description: 'Batt Insulation - R-13, 2x4 Wall', unit: 'SF', unitPrice: 1.41, laborCost: 0.51, materialCost: 0.79, equipmentCost: 0.11, laborHours: 0.008, isModifier: false, category: 'Insulation' },
  { taskNumber: '07-010', csiDivision: '07', csiCode: '07 31 00', description: 'Asphalt Shingle Roofing - Architectural Grade', unit: 'SQ', unitPrice: 508.50, laborCost: 226.00, materialCost: 226.00, equipmentCost: 56.50, laborHours: 4.0, isModifier: false, category: 'Roofing' },

  // Division 08 - Openings
  { taskNumber: '08-001', csiDivision: '08', csiCode: '08 11 00', description: 'Interior Door - Hollow Core, Pre-Hung, 3-0 x 6-8', unit: 'EA', unitPrice: 435.05, laborCost: 197.75, materialCost: 209.05, equipmentCost: 28.25, laborHours: 2.5, isModifier: false, category: 'Doors' },
  { taskNumber: '08-001.01', csiDivision: '08', csiCode: '08 11 00', description: 'Add for solid core door', unit: 'EA', unitPrice: 141.25, laborCost: 28.25, materialCost: 107.35, equipmentCost: 5.65, isModifier: true, modifierOf: '08-001', modifierType: 'ADD', modifierValue: 141.25, category: 'Doors' },
  { taskNumber: '08-010', csiDivision: '08', csiCode: '08 51 00', description: 'Vinyl Window - Double-Hung, Standard Size', unit: 'EA', unitPrice: 593.25, laborCost: 226.00, materialCost: 310.75, equipmentCost: 56.50, laborHours: 3.0, isModifier: false, category: 'Windows' },

  // Division 09 - Finishes
  { taskNumber: '09-001', csiDivision: '09', csiCode: '09 29 00', description: 'Drywall - 5/8" Type X, Walls', unit: 'SF', unitPrice: 3.67, laborCost: 1.98, materialCost: 1.41, equipmentCost: 0.28, laborHours: 0.03, isModifier: false, category: 'Gypsum Board' },
  { taskNumber: '09-010', csiDivision: '09', csiCode: '09 91 00', description: 'Interior Painting - Walls, 2 Coats', unit: 'SF', unitPrice: 2.37, laborCost: 1.70, materialCost: 0.51, equipmentCost: 0.17, laborHours: 0.025, isModifier: false, category: 'Painting' },
  { taskNumber: '09-020', csiDivision: '09', csiCode: '09 30 00', description: 'Ceramic Floor Tile - Standard Grade', unit: 'SF', unitPrice: 13.56, laborCost: 7.91, materialCost: 5.09, equipmentCost: 0.57, laborHours: 0.15, isModifier: false, category: 'Tile' },
  { taskNumber: '09-030', csiDivision: '09', csiCode: '09 51 00', description: 'Suspended Acoustical Ceiling - 2x4 Grid', unit: 'SF', unitPrice: 6.22, laborCost: 3.39, materialCost: 2.26, equipmentCost: 0.57, laborHours: 0.05, isModifier: false, category: 'Acoustical Ceilings' },

  // Division 22 - Plumbing
  { taskNumber: '22-001', csiDivision: '22', csiCode: '22 11 00', description: 'Copper Water Pipe - 3/4", Type L', unit: 'LF', unitPrice: 20.91, laborCost: 11.30, materialCost: 7.91, equipmentCost: 1.70, laborHours: 0.2, isModifier: false, category: 'Plumbing Piping' },
  { taskNumber: '22-010', csiDivision: '22', csiCode: '22 41 00', description: 'Lavatory - Wall-Hung, Vitreous China', unit: 'EA', unitPrice: 734.50, laborCost: 310.75, materialCost: 367.25, equipmentCost: 56.50, laborHours: 4.0, isModifier: false, category: 'Plumbing Fixtures' },
  { taskNumber: '22-011', csiDivision: '22', csiCode: '22 42 00', description: 'Water Closet - Floor-Mount, Standard', unit: 'EA', unitPrice: 847.50, laborCost: 339.00, materialCost: 423.75, equipmentCost: 84.75, laborHours: 4.5, isModifier: false, category: 'Plumbing Fixtures' },

  // Division 23 - HVAC
  { taskNumber: '23-001', csiDivision: '23', csiCode: '23 31 00', description: 'HVAC Ductwork - Galvanized Steel, Rectangular', unit: 'LB', unitPrice: 9.61, laborCost: 5.65, materialCost: 3.11, equipmentCost: 0.85, laborHours: 0.08, isModifier: false, category: 'HVAC Ductwork' },
  { taskNumber: '23-010', csiDivision: '23', csiCode: '23 74 00', description: 'Split System AC - 3 Ton, 14 SEER', unit: 'EA', unitPrice: 7345.00, laborCost: 2825.00, materialCost: 3955.00, equipmentCost: 565.00, laborHours: 24, isModifier: false, category: 'HVAC Equipment' },

  // Division 26 - Electrical
  { taskNumber: '26-001', csiDivision: '26', csiCode: '26 05 00', description: 'Electrical Conduit - 3/4" EMT', unit: 'LF', unitPrice: 10.74, laborCost: 6.78, materialCost: 3.11, equipmentCost: 0.85, laborHours: 0.12, isModifier: false, category: 'Raceways' },
  { taskNumber: '26-010', csiDivision: '26', csiCode: '26 27 00', description: 'Duplex Receptacle - 20A, Spec Grade', unit: 'EA', unitPrice: 141.25, laborCost: 84.75, materialCost: 47.46, equipmentCost: 9.04, laborHours: 1.0, isModifier: false, category: 'Wiring Devices' },
  { taskNumber: '26-020', csiDivision: '26', csiCode: '26 51 00', description: 'LED Light Fixture - 2x4 Troffer', unit: 'EA', unitPrice: 322.05, laborCost: 124.30, materialCost: 180.80, equipmentCost: 16.95, laborHours: 1.5, isModifier: false, category: 'Lighting' },
  { taskNumber: '26-030', csiDivision: '26', csiCode: '26 24 00', description: 'Panel Board - 200A, 42 Circuit', unit: 'EA', unitPrice: 3616.00, laborCost: 1356.00, materialCost: 1977.50, equipmentCost: 282.50, laborHours: 16, isModifier: false, category: 'Switchboards & Panels' },

  // Division 31 - Earthwork
  { taskNumber: '31-001', csiDivision: '31', csiCode: '31 23 00', description: 'Excavation - Common Earth, Machine', unit: 'CY', unitPrice: 9.61, laborCost: 2.83, materialCost: 0, equipmentCost: 6.78, laborHours: 0.05, isModifier: false, category: 'Earthwork' },
  { taskNumber: '31-002', csiDivision: '31', csiCode: '31 23 00', description: 'Backfill - Compacted, On-Site Material', unit: 'CY', unitPrice: 13.56, laborCost: 3.96, materialCost: 0, equipmentCost: 9.61, laborHours: 0.07, isModifier: false, category: 'Earthwork' },

  // Division 32 - Exterior Improvements
  { taskNumber: '32-001', csiDivision: '32', csiCode: '32 12 00', description: 'Asphalt Paving - 2" Surface Course', unit: 'SF', unitPrice: 4.80, laborCost: 1.41, materialCost: 2.54, equipmentCost: 0.85, laborHours: 0.015, isModifier: false, category: 'Paving' },
  { taskNumber: '32-010', csiDivision: '32', csiCode: '32 92 00', description: 'Sodding - Bermuda Grass', unit: 'SF', unitPrice: 0.96, laborCost: 0.40, materialCost: 0.45, equipmentCost: 0.11, laborHours: 0.005, isModifier: false, category: 'Turf and Grasses' },
];

// ── Seed Function ─────────────────────────────────────────────
export async function seedCTCLibrary(
  prisma: any,
  tasks?: CTCSeedTask[],
): Promise<{ costDatabaseId: string; seeded: number }> {
  const ctcTasks = tasks || CTC_SAMPLE_TASKS;

  console.log('\n=== Seeding CTC (Construction Task Catalog) ===');
  console.log(`  Tasks to seed: ${ctcTasks.length}`);

  // Step 1: Create or find the CTC cost database
  let ctcDatabase = await prisma.costDatabase.findFirst({
    where: { source: 'CTC-2026' },
  });

  if (!ctcDatabase) {
    ctcDatabase = await prisma.costDatabase.create({
      data: {
        name: 'Construction Task Catalog (CTC) — DMV 2026',
        description: 'Construction Task Catalog for DMV region Job Order Contracting. Unit prices reflect 2026 DMV market rates.',
        region: 'MD-DC-VA',
        type: 'IMPORTED',
        tier: 'STANDARD',
        version: '2026.1',
        source: 'CTC-2026',
        isActive: true,
        isStandard: true,
        isDefault: false,
        tradeCategory: 'multi-trade',
        projectType: 'joc',
        methodology: 'ctc-2026',
        visibility: 'ORG_ONLY',
        reviewStatus: 'APPROVED',
      },
    });
    console.log(`  Created CTC CostDatabase: ${ctcDatabase.id}`);
  } else {
    console.log(`  Using existing CTC CostDatabase: ${ctcDatabase.id}`);
  }

  const costDatabaseId = ctcDatabase.id;

  // Step 2: Bulk-insert CTC tasks as Assembly records
  let seeded = 0;
  const divisionCounts = new Map<string, number>();

  for (const task of ctcTasks) {
    const category = CSI_TO_CATEGORY[task.csiDivision] || 'OTHER_ASSEMBLY';
    const unitCost = task.unitPrice || (task.laborCost + task.materialCost + task.equipmentCost);

    try {
      await prisma.assembly.create({
        data: {
          costDatabaseId,
          csiCode: task.csiCode || null,
          name: task.description,
          description: task.longDescription || null,
          category,
          subcategory: task.category || null,
          unit: task.unit,
          unitCost: unitCost || 0,
          laborCost: task.laborCost || 0,
          materialCost: task.materialCost || 0,
          equipmentCost: task.equipmentCost || 0,
          laborHours: task.laborHours || 0,
          isActive: true,
          isTemplate: false,
          tags: ['ctc', `div-${task.csiDivision}`, ...(task.isModifier ? ['modifier'] : [])],
          notes: task.isModifier ? `Modifier of task ${task.modifierOf}` : null,
          metadata: {
            source: 'CTC-2026',
            taskNumber: task.taskNumber,
            isModifier: task.isModifier,
            modifierOf: task.modifierOf || null,
            modifierType: task.modifierType || null,
            modifierValue: task.modifierValue || null,
          },
          ctcTaskNumber: task.taskNumber,
          ctcModifierOf: task.isModifier ? (task.modifierOf || null) : null,
          sourceDatabase: 'CTC-2026',
        },
      });
      seeded++;
      const divKey = `Div ${task.csiDivision}`;
      divisionCounts.set(divKey, (divisionCounts.get(divKey) || 0) + 1);
    } catch (err: any) {
      console.warn(`  Skipped task ${task.taskNumber}: ${err.message}`);
    }
  }

  console.log('\n=== CTC Seed Summary ===');
  for (const [div, count] of [...divisionCounts.entries()].sort()) {
    console.log(`  ${div}: ${count} tasks`);
  }
  console.log(`  TOTAL: ${seeded} tasks seeded.`);
  console.log(`  CostDatabase ID: ${costDatabaseId}\n`);

  return { costDatabaseId, seeded };
}

// ── CLI Runner ────────────────────────────────────────────────
if (require.main === module) {
  (async () => {
    const { PrismaClient } = require('@prisma/client');
    const prisma = new PrismaClient();
    try {
      const result = await seedCTCLibrary(prisma);
      console.log(`Done! Seeded ${result.seeded} CTC tasks.`);
    } catch (err) {
      console.error('CTC seed failed:', err);
      process.exit(1);
    } finally {
      await prisma.$disconnect();
    }
  })();
}
