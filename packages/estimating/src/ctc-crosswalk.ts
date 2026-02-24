// ============================================================
// CTC-to-Marketplace Crosswalk
// Maps CTC Gordian task numbers to Kealee marketplace assembly codes
// ============================================================
//
// The CTC uses task numbers like "09-010" (Interior Painting).
// Kealee's marketplace uses codes like "KIT-BS-SUBWAY" or "PAINT-INT-2CT".
// This crosswalk allows the estimating engine to work with either system.
//
// When a user selects CTC tasks, we can suggest the closest marketplace
// assembly (which has low/mid/high pricing tiers and regional multipliers).
// When a user picks marketplace assemblies, we can map back to CTC for
// JOC compliance.
// ============================================================

export interface CrosswalkEntry {
  ctcTaskNumber: string;
  ctcDescription: string;
  marketplaceCode: string | null;
  marketplaceName: string | null;
  matchConfidence: 'EXACT' | 'CLOSE' | 'PARTIAL' | 'NONE';
  notes?: string;
}

// ── Static crosswalk mappings ─────────────────────────────────
// These are hand-verified mappings between CTC tasks and marketplace assemblies.
// For tasks without a direct match, matchConfidence indicates the relationship.
const STATIC_CROSSWALK: CrosswalkEntry[] = [
  // Division 02 - Demolition
  { ctcTaskNumber: '02-010', ctcDescription: 'Remove Existing Flooring - Carpet', marketplaceCode: 'KIT-DEMO-FLOOR', marketplaceName: 'Kitchen Floor Demo', matchConfidence: 'CLOSE', notes: 'Marketplace is kitchen-specific; CTC is general' },
  { ctcTaskNumber: '02-011', ctcDescription: 'Remove Existing Flooring - Ceramic Tile', marketplaceCode: 'KIT-DEMO-FLOOR', marketplaceName: 'Kitchen Floor Demo', matchConfidence: 'CLOSE', notes: 'Tile removal is more labor-intensive than general floor demo' },
  { ctcTaskNumber: '02-001', ctcDescription: 'Selective Demolition - Interior Non-Bearing Wall', marketplaceCode: 'KIT-DEMO-PARTIAL', marketplaceName: 'Partial Kitchen Demo', matchConfidence: 'PARTIAL', notes: 'CTC is wall-specific; marketplace is room-level' },

  // Division 03 - Concrete
  { ctcTaskNumber: '03-001', ctcDescription: 'Cast-in-Place Concrete - Sidewalk, 4" thick', marketplaceCode: 'CONC-SIDEWALK-4', marketplaceName: 'Concrete Sidewalk 4"', matchConfidence: 'EXACT' },
  { ctcTaskNumber: '03-002', ctcDescription: 'Cast-in-Place Concrete - Curb and Gutter', marketplaceCode: 'CONC-CURB', marketplaceName: 'Concrete Curb', matchConfidence: 'EXACT' },

  // Division 06 - Wood Framing
  { ctcTaskNumber: '06-010', ctcDescription: 'Finish Carpentry - Base Trim, Paint Grade', marketplaceCode: 'TRIM-BASE-PAINT', marketplaceName: 'Base Trim - Paint Grade', matchConfidence: 'EXACT' },
  { ctcTaskNumber: '06-011', ctcDescription: 'Finish Carpentry - Crown Molding, Paint Grade', marketplaceCode: 'TRIM-CROWN-PAINT', marketplaceName: 'Crown Molding - Paint Grade', matchConfidence: 'EXACT' },

  // Division 08 - Openings
  { ctcTaskNumber: '08-001', ctcDescription: 'Interior Door - Hollow Core, Pre-Hung', marketplaceCode: 'DOOR-INT-HC', marketplaceName: 'Interior Door Hollow Core', matchConfidence: 'EXACT' },
  { ctcTaskNumber: '08-010', ctcDescription: 'Vinyl Window - Double-Hung, Standard Size', marketplaceCode: 'WIN-VINYL-DH', marketplaceName: 'Vinyl Double-Hung Window', matchConfidence: 'EXACT' },

  // Division 09 - Finishes
  { ctcTaskNumber: '09-001', ctcDescription: 'Drywall - 5/8" Type X, Walls', marketplaceCode: 'DW-WALL-5/8', marketplaceName: 'Drywall 5/8" Walls', matchConfidence: 'EXACT' },
  { ctcTaskNumber: '09-010', ctcDescription: 'Interior Painting - Walls, 2 Coats', marketplaceCode: 'PAINT-INT-2CT', marketplaceName: 'Interior Painting 2 Coat', matchConfidence: 'EXACT' },
  { ctcTaskNumber: '09-020', ctcDescription: 'Ceramic Floor Tile - Standard Grade', marketplaceCode: 'KIT-FLR-TILE', marketplaceName: 'Kitchen Floor Tile', matchConfidence: 'CLOSE', notes: 'Marketplace is kitchen-specific; CTC is general' },

  // Division 22 - Plumbing
  { ctcTaskNumber: '22-010', ctcDescription: 'Lavatory - Wall-Hung, Vitreous China', marketplaceCode: 'BATH-PLUMB-FINISH', marketplaceName: 'Bathroom Plumbing Finish', matchConfidence: 'PARTIAL', notes: 'CTC is fixture-specific; marketplace bundles plumbing finish' },
  { ctcTaskNumber: '22-011', ctcDescription: 'Water Closet - Floor-Mount, Standard', marketplaceCode: 'BATH-PLUMB-FINISH', marketplaceName: 'Bathroom Plumbing Finish', matchConfidence: 'PARTIAL', notes: 'CTC is fixture-specific; marketplace bundles plumbing finish' },

  // Division 26 - Electrical
  { ctcTaskNumber: '26-010', ctcDescription: 'Duplex Receptacle - 20A, Spec Grade', marketplaceCode: 'KIT-ELEC-FINISH', marketplaceName: 'Kitchen Electrical Finish', matchConfidence: 'PARTIAL', notes: 'CTC is device-level; marketplace bundles per room' },
  { ctcTaskNumber: '26-020', ctcDescription: 'LED Light Fixture - 2x4 Troffer', marketplaceCode: 'KIT-LT-RECESS', marketplaceName: 'Kitchen Recessed Lighting', matchConfidence: 'CLOSE', notes: 'Different fixture types but same trade' },
];

// Build lookup indexes
const _byCTC = new Map<string, CrosswalkEntry>();
const _byMarketplace = new Map<string, CrosswalkEntry[]>();

for (const entry of STATIC_CROSSWALK) {
  _byCTC.set(entry.ctcTaskNumber, entry);
  if (entry.marketplaceCode) {
    const existing = _byMarketplace.get(entry.marketplaceCode) || [];
    existing.push(entry);
    _byMarketplace.set(entry.marketplaceCode, existing);
  }
}

// ── Public API ────────────────────────────────────────────────

/** Look up the marketplace equivalent for a CTC task number */
export function ctcToMarketplace(ctcTaskNumber: string): CrosswalkEntry | null {
  return _byCTC.get(ctcTaskNumber) || null;
}

/** Look up all CTC tasks that map to a marketplace assembly code */
export function marketplaceToCTC(marketplaceCode: string): CrosswalkEntry[] {
  return _byMarketplace.get(marketplaceCode) || [];
}

/** Get all crosswalk entries */
export function getAllCrosswalkEntries(): CrosswalkEntry[] {
  return [...STATIC_CROSSWALK];
}

/** Get entries filtered by match confidence */
export function getCrosswalkByConfidence(
  confidence: 'EXACT' | 'CLOSE' | 'PARTIAL' | 'NONE',
): CrosswalkEntry[] {
  return STATIC_CROSSWALK.filter(e => e.matchConfidence === confidence);
}

/**
 * AI-assisted crosswalk lookup.
 * For CTC tasks not in the static map, queries the database for the
 * closest marketplace assembly by CSI code + description similarity.
 */
export async function findClosestMarketplaceAssembly(
  prisma: any,
  ctcTaskNumber: string,
  ctcDescription: string,
  csiCode?: string,
): Promise<CrosswalkEntry> {
  // Check static map first
  const staticMatch = _byCTC.get(ctcTaskNumber);
  if (staticMatch) return staticMatch;

  // Query database for assemblies with matching CSI code
  const candidates: any[] = [];

  if (csiCode) {
    const byCsi = await prisma.assembly.findMany({
      where: {
        csiCode: { startsWith: csiCode.substring(0, 5) },
        sourceDatabase: { not: 'CTC-Gordian-MD-DGS-2023' },
        isActive: true,
      },
      take: 10,
    });
    candidates.push(...byCsi);
  }

  // Also search by name similarity (simple keyword overlap)
  const keywords = ctcDescription.toLowerCase().split(/\s+/).filter(w => w.length > 3);
  if (keywords.length > 0) {
    for (const keyword of keywords.slice(0, 3)) {
      const byName = await prisma.assembly.findMany({
        where: {
          name: { contains: keyword, mode: 'insensitive' },
          sourceDatabase: { not: 'CTC-Gordian-MD-DGS-2023' },
          isActive: true,
        },
        take: 5,
      });
      candidates.push(...byName);
    }
  }

  if (candidates.length === 0) {
    return {
      ctcTaskNumber,
      ctcDescription,
      marketplaceCode: null,
      marketplaceName: null,
      matchConfidence: 'NONE',
    };
  }

  // Score candidates by keyword overlap
  const scored = candidates.map(c => {
    const name = (c.name || '').toLowerCase();
    const matchCount = keywords.filter(k => name.includes(k)).length;
    return { assembly: c, score: matchCount / Math.max(keywords.length, 1) };
  });

  scored.sort((a, b) => b.score - a.score);
  const best = scored[0];

  const confidence = best.score >= 0.8 ? 'CLOSE' as const
    : best.score >= 0.4 ? 'PARTIAL' as const
    : 'NONE' as const;

  return {
    ctcTaskNumber,
    ctcDescription,
    marketplaceCode: best.assembly.code || null,
    marketplaceName: best.assembly.name || null,
    matchConfidence: confidence,
    notes: `Auto-matched with score ${(best.score * 100).toFixed(0)}%`,
  };
}

/**
 * Build a full crosswalk for all CTC tasks in the database.
 * Combines static mappings with AI-assisted matching for unmapped tasks.
 */
export async function buildFullCrosswalk(
  prisma: any,
  costDatabaseId?: string,
): Promise<CrosswalkEntry[]> {
  const where: any = {
    sourceDatabase: 'CTC-Gordian-MD-DGS-2023',
    isActive: true,
  };
  if (costDatabaseId) where.costDatabaseId = costDatabaseId;

  const ctcTasks = await prisma.assembly.findMany({
    where,
    select: {
      ctcTaskNumber: true,
      name: true,
      csiCode: true,
    },
    orderBy: { ctcTaskNumber: 'asc' },
  });

  const results: CrosswalkEntry[] = [];

  for (const task of ctcTasks) {
    if (!task.ctcTaskNumber) continue;

    const staticMatch = _byCTC.get(task.ctcTaskNumber);
    if (staticMatch) {
      results.push(staticMatch);
    } else {
      const match = await findClosestMarketplaceAssembly(
        prisma,
        task.ctcTaskNumber,
        task.name,
        task.csiCode,
      );
      results.push(match);
    }
  }

  return results;
}
