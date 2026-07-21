/**
 * Subdivision Layout Engine
 *
 * Generates lot-based site plans for townhome and single-family subdivisions.
 * Produces street network, lot placement, phase assignment, and SVG site plan.
 */

import type {
  SubdivisionLayout,
  SubdivisionLot,
  SubdivisionStreet,
  SubdivisionPhase,
  SubdivisionLotType,
} from './types';

// ── Lot + street defaults ─────────────────────────────────────────────────────

const SPECS = {
  townhome: {
    lotWidthFt:    22,
    lotDepthFt:    52,
    setbackFront:   5,
    setbackRear:   10,
    setbackSide:    0,   // zero-lot-line (attached)
    rowFt:         50,
    pavedFt:       26,
    avgStoreys:     2,   // multiplier for house area
  },
  single_family_subdivision: {
    lotWidthFt:    60,
    lotDepthFt:   100,
    setbackFront:  20,
    setbackRear:   25,
    setbackSide:    5,
    rowFt:         60,
    pavedFt:       28,
    avgStoreys:     1,
  },
} as const;

const NUM_PHASES = 3;
const SITE_ASPECT_RATIO = 1.3;  // width:depth
const OPEN_SPACE_PCT    = 0.05; // 5% for common areas
const PARK_PCT          = 0.03; // 3% for park
const SITE_EDGE_PAD_FT  = 10;

// ── Phase colours (hex) ───────────────────────────────────────────────────────
const PHASE_FILL: Record<number, string> = {
  1: '#DBEAFE',
  2: '#D1FAE5',
  3: '#FEF3C7',
};

// ── Main entry point ─────────────────────────────────────────────────────────

export function generateSubdivisionLayout(params: {
  developmentType: 'townhome' | 'single_family_subdivision';
  totalSiteSqFt: number;
  targetLotCount?: number;
  targetLotWidthFt?: number;
}): SubdivisionLayout {
  const { developmentType, totalSiteSqFt } = params;
  const spec = SPECS[developmentType];
  const lotWidthFt  = params.targetLotWidthFt ?? spec.lotWidthFt;
  const lotDepthFt  = spec.lotDepthFt;
  const rowFt       = spec.rowFt;
  const pavedFt     = spec.pavedFt;

  // Derive site rectangle from area + aspect ratio
  const siteDepthFt = Math.round(Math.sqrt(totalSiteSqFt / SITE_ASPECT_RATIO));
  const siteWidthFt = Math.round(siteDepthFt * SITE_ASPECT_RATIO);

  // One block = two rows of back-to-back lots + one interior street
  // blockDepth = lotDepth * 2 + rowFt (lots back-to-back sharing a rear yard strip)
  const blockDepth = lotDepthFt * 2 + rowFt;
  const usableDepth = siteDepthFt - rowFt - SITE_EDGE_PAD_FT * 2;
  const numBlocks   = Math.max(1, Math.floor(usableDepth / blockDepth));
  const numLotCols  = Math.max(1, Math.floor((siteWidthFt - rowFt * 2) / lotWidthFt));

  // ── Build streets ─────────────────────────────────────────────────────────

  const streets: SubdivisionStreet[] = [];

  // Entry / perimeter street (north)
  streets.push(makeStreet('street-entry', 'Entry Drive', rowFt, pavedFt,
    0, SITE_EDGE_PAD_FT, siteWidthFt, SITE_EDGE_PAD_FT));

  // Internal east-west streets (one per block boundary)
  for (let b = 0; b < numBlocks - 1; b++) {
    const sy = SITE_EDGE_PAD_FT + rowFt + (b + 1) * (lotDepthFt * 2) + b * rowFt;
    if (sy + rowFt < siteDepthFt - SITE_EDGE_PAD_FT) {
      streets.push(makeStreet(
        `street-int-${b}`, `Street ${b + 2}`, rowFt, pavedFt,
        0, sy, siteWidthFt, sy,
      ));
    }
  }

  // N-S collector (west side)
  streets.push(makeStreet('street-collector', 'Collector', rowFt, pavedFt,
    SITE_EDGE_PAD_FT, 0, SITE_EDGE_PAD_FT, siteDepthFt));

  // ── Place lots ────────────────────────────────────────────────────────────

  const lots: SubdivisionLot[] = [];
  let lotNum = 1;

  for (let b = 0; b < numBlocks; b++) {
    // Row A (top of block) faces the street above; Row B (bottom) faces the street below
    const blockTopY = SITE_EDGE_PAD_FT + rowFt + b * blockDepth;
    const rowYs     = [blockTopY, blockTopY + lotDepthFt];

    for (let row = 0; row < rowYs.length; row++) {
      const lotY = rowYs[row];
      if (lotY + lotDepthFt > siteDepthFt - SITE_EDGE_PAD_FT) continue;

      for (let col = 0; col < numLotCols; col++) {
        const lotX = rowFt + col * lotWidthFt;
        if (lotX + lotWidthFt > siteWidthFt - SITE_EDGE_PAD_FT) break;

        const isCorner  = col === 0 || col === numLotCols - 1;
        const lotType: SubdivisionLotType = isCorner ? 'corner' : 'standard';

        const bW = developmentType === 'townhome'
          ? lotWidthFt
          : lotWidthFt - spec.setbackSide * 2;
        const bD = lotDepthFt - spec.setbackFront - spec.setbackRear;
        const buildableFootprintSqFt = Math.max(0, bW * bD);
        const houseAreaFt2 = Math.round(
          developmentType === 'townhome'
            ? buildableFootprintSqFt * spec.avgStoreys
            : buildableFootprintSqFt * 0.55,
        );

        lots.push({
          lotId:   `lot-${lotNum}`,
          lotType,
          lotNumber: lotNum,
          phase: 1, // assigned below
          x: lotX,
          y: lotY,
          widthFt: lotWidthFt,
          depthFt: lotDepthFt,
          totalSqFt: lotWidthFt * lotDepthFt,
          buildableFootprintSqFt,
          proposedHouseAreaFt2: houseAreaFt2,
          streetFrontage: row === 0 ? 'N' : 'S',
          estimatedSalesPrice: 0, // set by analysis layer
          isCornerLot: isCorner,
        });
        lotNum++;
      }
    }
  }

  // Assign phases sequentially
  const lotsPerPhase = Math.ceil(lots.length / NUM_PHASES);
  lots.forEach((lot, i) => { lot.phase = Math.floor(i / lotsPerPhase) + 1; });

  // Build phase objects (revenue/cost set by analysis layer)
  const phases: SubdivisionPhase[] = Array.from({ length: NUM_PHASES }, (_, i) => {
    const phaseLots = lots.filter(l => l.phase === i + 1);
    return {
      phaseNumber: i + 1,
      label: `Phase ${i + 1}`,
      lots: phaseLots.map(l => l.lotId),
      estimatedStartMonth:     i * 14,
      estimatedDurationMonths: 18,
      phaseRevenue: 0,
      phaseCost:    0,
      phaseProfit:  0,
    };
  });

  // ── Site area breakdown ───────────────────────────────────────────────────

  const grossLotAreaSqFt     = lots.reduce((s, l) => s + l.totalSqFt, 0);
  const streetROWSqFt        = Math.min(
    streets.reduce((s, st) => s + st.rowFt * st.lengthFt, 0),
    totalSiteSqFt,
  );
  const commonAreaSqFt       = Math.round(totalSiteSqFt * OPEN_SPACE_PCT);
  const parkAreaSqFt         = Math.round(totalSiteSqFt * PARK_PCT);
  const openSpaceRatio       = parseFloat(((commonAreaSqFt + parkAreaSqFt) / totalSiteSqFt * 100).toFixed(1));
  const lotCoverageRatio     = parseFloat((grossLotAreaSqFt / totalSiteSqFt * 100).toFixed(1));
  const totalAcres           = totalSiteSqFt / 43_560;
  const densityLotsPerAcre   = parseFloat((lots.length / Math.max(0.1, totalAcres)).toFixed(1));

  const svgString = renderSvg(lots, streets, siteWidthFt, siteDepthFt);

  return {
    developmentType,
    totalSiteSqFt,
    totalLots:    lots.length,
    lots,
    streets,
    phases,
    grossLotAreaSqFt,
    streetRightOfWaySqFt: streetROWSqFt,
    commonAreaSqFt,
    parkAreaSqFt,
    openSpaceRatio,
    lotCoverageRatio,
    densityLotsPerAcre,
    svgString,
  };
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function makeStreet(
  id: string, label: string,
  rowFt: number, pavedFt: number,
  x1: number, y1: number, x2: number, y2: number,
): SubdivisionStreet {
  const lengthFt = Math.round(Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2));
  return { streetId: id, label, rowFt, pavedFt, x1, y1, x2, y2, lengthFt };
}

// ── SVG renderer ─────────────────────────────────────────────────────────────

function renderSvg(
  lots: SubdivisionLot[],
  streets: SubdivisionStreet[],
  siteW: number,
  siteD: number,
): string {
  const SCALE = 1.4; // px per ft
  const W = Math.round(siteW * SCALE);
  const H = Math.round(siteD * SCALE);
  const PAD = 20;
  const LEGEND_H = 24;

  const parts: string[] = [
    `<svg xmlns="http://www.w3.org/2000/svg" width="${W + PAD * 2}" height="${H + PAD * 2 + LEGEND_H}" viewBox="0 0 ${W + PAD * 2} ${H + PAD * 2 + LEGEND_H}">`,
    `<rect width="${W + PAD * 2}" height="${H + PAD * 2 + LEGEND_H}" fill="#F9FAFB"/>`,
    // Site boundary
    `<rect x="${PAD}" y="${PAD}" width="${W}" height="${H}" fill="#E5E7EB" stroke="#6B7280" stroke-width="1.5"/>`,
  ];

  // Streets
  for (const st of streets) {
    const isHoriz = Math.abs(st.y2 - st.y1) < 1;
    const halfRow = (st.rowFt / 2) * SCALE;
    if (isHoriz) {
      const y = PAD + st.y1 * SCALE;
      parts.push(`<rect x="${PAD}" y="${y - halfRow}" width="${W}" height="${st.rowFt * SCALE}" fill="#D1D5DB"/>`);
      parts.push(`<line x1="${PAD}" y1="${y}" x2="${PAD + W}" y2="${y}" stroke="#9CA3AF" stroke-width="1" stroke-dasharray="6 3"/>`);
    } else {
      const x = PAD + st.x1 * SCALE;
      parts.push(`<rect x="${x - halfRow}" y="${PAD}" width="${st.rowFt * SCALE}" height="${H}" fill="#D1D5DB"/>`);
      parts.push(`<line x1="${x}" y1="${PAD}" x2="${x}" y2="${PAD + H}" stroke="#9CA3AF" stroke-width="1" stroke-dasharray="6 3"/>`);
    }
  }

  // Lots
  for (const lot of lots) {
    const x = PAD + lot.x * SCALE;
    const y = PAD + lot.y * SCALE;
    const w = lot.widthFt * SCALE;
    const h = lot.depthFt * SCALE;
    const fill = PHASE_FILL[lot.phase] ?? '#F3F4F6';
    const stroke = lot.isCornerLot ? '#2563EB' : '#6B7280';

    parts.push(`<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${fill}" stroke="${stroke}" stroke-width="0.6"/>`);

    if (w >= 12) {
      parts.push(`<text x="${x + w / 2}" y="${y + h / 2}" font-size="7" fill="#374151" text-anchor="middle" dominant-baseline="middle">${lot.lotNumber}</text>`);
    }
  }

  // Legend
  const ly = PAD + H + 8;
  for (let p = 1; p <= NUM_PHASES; p++) {
    const lx = PAD + (p - 1) * 90;
    parts.push(`<rect x="${lx}" y="${ly}" width="10" height="10" fill="${PHASE_FILL[p]}" stroke="#6B7280" stroke-width="0.5"/>`);
    parts.push(`<text x="${lx + 14}" y="${ly + 8}" font-size="8" fill="#374151">Phase ${p}</text>`);
  }

  parts.push('</svg>');
  return parts.join('\n');
}
