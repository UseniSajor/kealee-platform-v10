// ============================================================
// Kealee Platform – CTC (Construction Task Catalog) Seed Script
// Maryland DGS · Gordian JOC · 2023 Pricing
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

// Representative CTC tasks for dev/testing (full catalog comes from PDF import)
export const CTC_SAMPLE_TASKS: CTCSeedTask[] = [
  // Division 01 - General Requirements
  { taskNumber: '01-001', csiDivision: '01', csiCode: '01 10 00', description: 'Mobilization and Demobilization', unit: 'EA', unitPrice: 2500.00, laborCost: 1875.00, materialCost: 375.00, equipmentCost: 250.00, laborHours: 24, isModifier: false, category: 'General Requirements' },
  { taskNumber: '01-002', csiDivision: '01', csiCode: '01 10 00', description: 'Project Management and Coordination', unit: 'HR', unitPrice: 85.00, laborCost: 85.00, materialCost: 0, equipmentCost: 0, laborHours: 1, isModifier: false, category: 'General Requirements' },
  { taskNumber: '01-003', csiDivision: '01', csiCode: '01 50 00', description: 'Temporary Facilities and Controls', unit: 'MO', unitPrice: 1200.00, laborCost: 400.00, materialCost: 600.00, equipmentCost: 200.00, laborHours: 8, isModifier: false, category: 'General Requirements' },
  { taskNumber: '01-010', csiDivision: '01', csiCode: '01 74 00', description: 'Construction Waste Disposal - Standard', unit: 'CY', unitPrice: 45.00, laborCost: 15.00, materialCost: 0, equipmentCost: 30.00, laborHours: 0.25, isModifier: false, category: 'Waste Management' },
  { taskNumber: '01-010.01', csiDivision: '01', csiCode: '01 74 00', description: 'Add for hazardous material disposal', unit: 'CY', unitPrice: 85.00, laborCost: 25.00, materialCost: 0, equipmentCost: 60.00, isModifier: true, modifierOf: '01-010', modifierType: 'ADD', modifierValue: 85.00, category: 'Waste Management' },

  // Division 02 - Existing Conditions
  { taskNumber: '02-001', csiDivision: '02', csiCode: '02 41 00', description: 'Selective Demolition - Interior Non-Bearing Wall', unit: 'LF', unitPrice: 12.50, laborCost: 10.00, materialCost: 0.50, equipmentCost: 2.00, laborHours: 0.25, isModifier: false, category: 'Demolition' },
  { taskNumber: '02-002', csiDivision: '02', csiCode: '02 41 00', description: 'Selective Demolition - Interior Bearing Wall', unit: 'LF', unitPrice: 28.00, laborCost: 20.00, materialCost: 2.00, equipmentCost: 6.00, laborHours: 0.5, isModifier: false, category: 'Demolition' },
  { taskNumber: '02-010', csiDivision: '02', csiCode: '02 41 00', description: 'Remove Existing Flooring - Carpet', unit: 'SF', unitPrice: 1.25, laborCost: 1.00, materialCost: 0, equipmentCost: 0.25, laborHours: 0.02, isModifier: false, category: 'Flooring Demolition' },
  { taskNumber: '02-011', csiDivision: '02', csiCode: '02 41 00', description: 'Remove Existing Flooring - Ceramic Tile', unit: 'SF', unitPrice: 3.75, laborCost: 3.00, materialCost: 0, equipmentCost: 0.75, laborHours: 0.06, isModifier: false, category: 'Flooring Demolition' },
  { taskNumber: '02-020', csiDivision: '02', csiCode: '02 41 00', description: 'Remove Existing Ceiling - Suspended ACT', unit: 'SF', unitPrice: 1.50, laborCost: 1.25, materialCost: 0, equipmentCost: 0.25, laborHours: 0.025, isModifier: false, category: 'Ceiling Demolition' },

  // Division 03 - Concrete
  { taskNumber: '03-001', csiDivision: '03', csiCode: '03 30 00', description: 'Cast-in-Place Concrete - Sidewalk, 4" thick', unit: 'SF', unitPrice: 12.50, laborCost: 5.00, materialCost: 5.50, equipmentCost: 2.00, laborHours: 0.12, isModifier: false, category: 'Concrete Flatwork' },
  { taskNumber: '03-001.01', csiDivision: '03', csiCode: '03 30 00', description: 'Add for 6" thick concrete', unit: 'SF', unitPrice: 3.50, laborCost: 1.00, materialCost: 2.25, equipmentCost: 0.25, isModifier: true, modifierOf: '03-001', modifierType: 'ADD', modifierValue: 3.50, category: 'Concrete Flatwork' },
  { taskNumber: '03-002', csiDivision: '03', csiCode: '03 30 00', description: 'Cast-in-Place Concrete - Curb and Gutter', unit: 'LF', unitPrice: 32.00, laborCost: 14.00, materialCost: 13.00, equipmentCost: 5.00, laborHours: 0.3, isModifier: false, category: 'Concrete Flatwork' },
  { taskNumber: '03-010', csiDivision: '03', csiCode: '03 11 00', description: 'Concrete Forming - Wall, to 8 ft height', unit: 'SF', unitPrice: 8.75, laborCost: 6.50, materialCost: 1.75, equipmentCost: 0.50, laborHours: 0.15, isModifier: false, category: 'Concrete Forms' },
  { taskNumber: '03-020', csiDivision: '03', csiCode: '03 21 00', description: 'Reinforcing Steel - #4 Rebar', unit: 'LB', unitPrice: 1.85, laborCost: 0.95, materialCost: 0.80, equipmentCost: 0.10, laborHours: 0.015, isModifier: false, category: 'Reinforcing' },

  // Division 06 - Wood, Plastics, and Composites
  { taskNumber: '06-001', csiDivision: '06', csiCode: '06 10 00', description: 'Wood Framing - Interior Wall, 2x4, 16" OC', unit: 'LF', unitPrice: 14.00, laborCost: 8.50, materialCost: 4.50, equipmentCost: 1.00, laborHours: 0.2, isModifier: false, category: 'Rough Carpentry' },
  { taskNumber: '06-001.01', csiDivision: '06', csiCode: '06 10 00', description: 'Add for 2x6 framing', unit: 'LF', unitPrice: 3.25, laborCost: 1.50, materialCost: 1.50, equipmentCost: 0.25, isModifier: true, modifierOf: '06-001', modifierType: 'ADD', modifierValue: 3.25, category: 'Rough Carpentry' },
  { taskNumber: '06-010', csiDivision: '06', csiCode: '06 20 00', description: 'Finish Carpentry - Base Trim, Paint Grade', unit: 'LF', unitPrice: 6.50, laborCost: 4.00, materialCost: 2.00, equipmentCost: 0.50, laborHours: 0.1, isModifier: false, category: 'Finish Carpentry' },
  { taskNumber: '06-011', csiDivision: '06', csiCode: '06 20 00', description: 'Finish Carpentry - Crown Molding, Paint Grade', unit: 'LF', unitPrice: 9.75, laborCost: 6.50, materialCost: 2.50, equipmentCost: 0.75, laborHours: 0.15, isModifier: false, category: 'Finish Carpentry' },

  // Division 07 - Thermal and Moisture Protection
  { taskNumber: '07-001', csiDivision: '07', csiCode: '07 21 00', description: 'Batt Insulation - R-13, 2x4 Wall', unit: 'SF', unitPrice: 1.25, laborCost: 0.45, materialCost: 0.70, equipmentCost: 0.10, laborHours: 0.008, isModifier: false, category: 'Insulation' },
  { taskNumber: '07-010', csiDivision: '07', csiCode: '07 31 00', description: 'Asphalt Shingle Roofing - Architectural Grade', unit: 'SQ', unitPrice: 450.00, laborCost: 200.00, materialCost: 200.00, equipmentCost: 50.00, laborHours: 4.0, isModifier: false, category: 'Roofing' },

  // Division 08 - Openings
  { taskNumber: '08-001', csiDivision: '08', csiCode: '08 11 00', description: 'Interior Door - Hollow Core, Pre-Hung, 3-0 x 6-8', unit: 'EA', unitPrice: 385.00, laborCost: 175.00, materialCost: 185.00, equipmentCost: 25.00, laborHours: 2.5, isModifier: false, category: 'Doors' },
  { taskNumber: '08-001.01', csiDivision: '08', csiCode: '08 11 00', description: 'Add for solid core door', unit: 'EA', unitPrice: 125.00, laborCost: 25.00, materialCost: 95.00, equipmentCost: 5.00, isModifier: true, modifierOf: '08-001', modifierType: 'ADD', modifierValue: 125.00, category: 'Doors' },
  { taskNumber: '08-010', csiDivision: '08', csiCode: '08 51 00', description: 'Vinyl Window - Double-Hung, Standard Size', unit: 'EA', unitPrice: 525.00, laborCost: 200.00, materialCost: 275.00, equipmentCost: 50.00, laborHours: 3.0, isModifier: false, category: 'Windows' },

  // Division 09 - Finishes
  { taskNumber: '09-001', csiDivision: '09', csiCode: '09 29 00', description: 'Drywall - 5/8" Type X, Walls', unit: 'SF', unitPrice: 3.25, laborCost: 1.75, materialCost: 1.25, equipmentCost: 0.25, laborHours: 0.03, isModifier: false, category: 'Gypsum Board' },
  { taskNumber: '09-010', csiDivision: '09', csiCode: '09 91 00', description: 'Interior Painting - Walls, 2 Coats', unit: 'SF', unitPrice: 2.10, laborCost: 1.50, materialCost: 0.45, equipmentCost: 0.15, laborHours: 0.025, isModifier: false, category: 'Painting' },
  { taskNumber: '09-020', csiDivision: '09', csiCode: '09 30 00', description: 'Ceramic Floor Tile - Standard Grade', unit: 'SF', unitPrice: 12.00, laborCost: 7.00, materialCost: 4.50, equipmentCost: 0.50, laborHours: 0.15, isModifier: false, category: 'Tile' },
  { taskNumber: '09-030', csiDivision: '09', csiCode: '09 51 00', description: 'Suspended Acoustical Ceiling - 2x4 Grid', unit: 'SF', unitPrice: 5.50, laborCost: 3.00, materialCost: 2.00, equipmentCost: 0.50, laborHours: 0.05, isModifier: false, category: 'Acoustical Ceilings' },

  // Division 22 - Plumbing
  { taskNumber: '22-001', csiDivision: '22', csiCode: '22 11 00', description: 'Copper Water Pipe - 3/4", Type L', unit: 'LF', unitPrice: 18.50, laborCost: 10.00, materialCost: 7.00, equipmentCost: 1.50, laborHours: 0.2, isModifier: false, category: 'Plumbing Piping' },
  { taskNumber: '22-010', csiDivision: '22', csiCode: '22 41 00', description: 'Lavatory - Wall-Hung, Vitreous China', unit: 'EA', unitPrice: 650.00, laborCost: 275.00, materialCost: 325.00, equipmentCost: 50.00, laborHours: 4.0, isModifier: false, category: 'Plumbing Fixtures' },
  { taskNumber: '22-011', csiDivision: '22', csiCode: '22 42 00', description: 'Water Closet - Floor-Mount, Standard', unit: 'EA', unitPrice: 750.00, laborCost: 300.00, materialCost: 375.00, equipmentCost: 75.00, laborHours: 4.5, isModifier: false, category: 'Plumbing Fixtures' },

  // Division 23 - HVAC
  { taskNumber: '23-001', csiDivision: '23', csiCode: '23 31 00', description: 'HVAC Ductwork - Galvanized Steel, Rectangular', unit: 'LB', unitPrice: 8.50, laborCost: 5.00, materialCost: 2.75, equipmentCost: 0.75, laborHours: 0.08, isModifier: false, category: 'HVAC Ductwork' },
  { taskNumber: '23-010', csiDivision: '23', csiCode: '23 74 00', description: 'Split System AC - 3 Ton, 14 SEER', unit: 'EA', unitPrice: 6500.00, laborCost: 2500.00, materialCost: 3500.00, equipmentCost: 500.00, laborHours: 24, isModifier: false, category: 'HVAC Equipment' },

  // Division 26 - Electrical
  { taskNumber: '26-001', csiDivision: '26', csiCode: '26 05 00', description: 'Electrical Conduit - 3/4" EMT', unit: 'LF', unitPrice: 9.50, laborCost: 6.00, materialCost: 2.75, equipmentCost: 0.75, laborHours: 0.12, isModifier: false, category: 'Raceways' },
  { taskNumber: '26-010', csiDivision: '26', csiCode: '26 27 00', description: 'Duplex Receptacle - 20A, Spec Grade', unit: 'EA', unitPrice: 125.00, laborCost: 75.00, materialCost: 42.00, equipmentCost: 8.00, laborHours: 1.0, isModifier: false, category: 'Wiring Devices' },
  { taskNumber: '26-020', csiDivision: '26', csiCode: '26 51 00', description: 'LED Light Fixture - 2x4 Troffer', unit: 'EA', unitPrice: 285.00, laborCost: 110.00, materialCost: 160.00, equipmentCost: 15.00, laborHours: 1.5, isModifier: false, category: 'Lighting' },
  { taskNumber: '26-030', csiDivision: '26', csiCode: '26 24 00', description: 'Panel Board - 200A, 42 Circuit', unit: 'EA', unitPrice: 3200.00, laborCost: 1200.00, materialCost: 1750.00, equipmentCost: 250.00, laborHours: 16, isModifier: false, category: 'Switchboards & Panels' },

  // Division 31 - Earthwork
  { taskNumber: '31-001', csiDivision: '31', csiCode: '31 23 00', description: 'Excavation - Common Earth, Machine', unit: 'CY', unitPrice: 8.50, laborCost: 2.50, materialCost: 0, equipmentCost: 6.00, laborHours: 0.05, isModifier: false, category: 'Earthwork' },
  { taskNumber: '31-002', csiDivision: '31', csiCode: '31 23 00', description: 'Backfill - Compacted, On-Site Material', unit: 'CY', unitPrice: 12.00, laborCost: 3.50, materialCost: 0, equipmentCost: 8.50, laborHours: 0.07, isModifier: false, category: 'Earthwork' },

  // Division 32 - Exterior Improvements
  { taskNumber: '32-001', csiDivision: '32', csiCode: '32 12 00', description: 'Asphalt Paving - 2" Surface Course', unit: 'SF', unitPrice: 4.25, laborCost: 1.25, materialCost: 2.25, equipmentCost: 0.75, laborHours: 0.015, isModifier: false, category: 'Paving' },
  { taskNumber: '32-010', csiDivision: '32', csiCode: '32 92 00', description: 'Sodding - Bermuda Grass', unit: 'SF', unitPrice: 0.85, laborCost: 0.35, materialCost: 0.40, equipmentCost: 0.10, laborHours: 0.005, isModifier: false, category: 'Turf and Grasses' },
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
    where: { source: 'CTC-Gordian-MD-DGS-2023' },
  });

  if (!ctcDatabase) {
    ctcDatabase = await prisma.costDatabase.create({
      data: {
        name: 'Construction Task Catalog (CTC) - MD DGS',
        description: 'Gordian Construction Task Catalog for Maryland Department of General Services Job Order Contracting.',
        region: 'MD-DC-VA',
        type: 'IMPORTED',
        tier: 'STANDARD',
        version: '2023.1',
        source: 'CTC-Gordian-MD-DGS-2023',
        isActive: true,
        isStandard: true,
        isDefault: false,
        tradeCategory: 'multi-trade',
        projectType: 'government-joc',
        methodology: 'gordian-ctc',
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
            source: 'CTC-Gordian-MD-DGS-2023',
            taskNumber: task.taskNumber,
            isModifier: task.isModifier,
            modifierOf: task.modifierOf || null,
            modifierType: task.modifierType || null,
            modifierValue: task.modifierValue || null,
          },
          ctcTaskNumber: task.taskNumber,
          ctcModifierOf: task.isModifier ? (task.modifierOf || null) : null,
          sourceDatabase: 'CTC-Gordian-MD-DGS-2023',
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
