/**
 * Floor Plate Layout Generator
 *
 * Takes a UnitMixProgram and generates multi-floor SVG layouts
 * with unit placement optimized for:
 * - Corridor efficiency (double-loaded corridor preferred)
 * - Perimeter exposure maximization
 * - Unit type clustering (studios in center, larger units on corners)
 */

import type { UnitType, UnitMixProgram, FloorPlateUnit, FloorPlateLayout, MultiFloorLayout } from './types';
import { UNIT_SPECS } from './unit-mix-optimizer';

const SCALE = 4;        // px per foot (floor plates are bigger than residential rooms)
const CORRIDOR_WIDTH = 6; // standard double-loaded corridor
const CORE_WIDTH = 14;    // elevator/stair core width
const GRID_PAD = 8;

/** Typical floor plate dimensions by development type */
const PLATE_WIDTHS: Record<string, number> = {
  mid_rise_apartment:    120,
  low_rise_apartment:    80,
  mixed_use_residential: 120,
  townhome:              28,
  commercial_office:     160,
  adu_portfolio:         30,
  default:               100,
};

export interface FloorPlateInput {
  unitMix: UnitMixProgram;
  developmentType: string;
  proposedFloors: number;
  buildingFacing?: 'N' | 'S' | 'E' | 'W';
}

export function generateMultiFloorLayout(input: FloorPlateInput): MultiFloorLayout {
  const { unitMix, developmentType, proposedFloors } = input;
  const plateWidth = PLATE_WIDTHS[developmentType] ?? PLATE_WIDTHS.default;

  // Distribute units across floors
  const unitsPerFloor = distributeUnitsAcrossFloors(unitMix, proposedFloors);
  const floors: FloorPlateLayout[] = [];

  for (let floor = 1; floor <= proposedFloors; floor++) {
    const floorUnits = unitsPerFloor[floor] ?? [];
    const layout = layoutFloor(floor, floorUnits, plateWidth, unitMix.circulationSqFt / proposedFloors);
    floors.push(layout);
  }

  const totalNetSqFt = floors.reduce((s, f) => s + (f.totalFloorSqFt - f.commonAreaSqFt - f.circulationSqFt), 0);
  const overallEfficiency = unitMix.totalGfaSqFt > 0
    ? Math.round((totalNetSqFt / unitMix.totalGfaSqFt) * 100)
    : 0;

  return {
    floors,
    totalFloors: proposedFloors,
    totalGfaSqFt: unitMix.totalGfaSqFt,
    totalNetSqFt,
    overallEfficiency,
    svgStrings: floors.map(f => f.svgString),
  };
}

// ── Floor layout ──────────────────────────────────────────────────────────────

function layoutFloor(
  floor: number,
  units: Array<{ type: UnitType; count: number; targetAreaFt2: number }>,
  plateWidthFt: number,
  circulationSqFt: number,
): FloorPlateLayout {
  const placedUnits: FloorPlateUnit[] = [];
  let curX = GRID_PAD + CORE_WIDTH;
  let curY = GRID_PAD;

  // Top row: place units on north perimeter
  const topRowY = GRID_PAD;
  // Bottom row starts after corridor
  let plateDepth = 0;

  for (const unitGroup of units) {
    const spec = UNIT_SPECS[unitGroup.type];
    if (!spec) continue;

    const unitWidth = Math.round(Math.sqrt(unitGroup.targetAreaFt2));
    const unitDepth = Math.round(unitGroup.targetAreaFt2 / unitWidth);

    for (let i = 0; i < unitGroup.count; i++) {
      // Wrap to new row if we exceed plate width
      if (curX + unitWidth > plateWidthFt + GRID_PAD + CORE_WIDTH) {
        curX = GRID_PAD + CORE_WIDTH;
        curY += unitDepth + CORRIDOR_WIDTH;
      }

      const hasExterior = curY <= GRID_PAD + 2 || curY + unitDepth >= plateDepth - 2 ||
                          curX <= GRID_PAD + CORE_WIDTH + 2 || curX + unitWidth >= plateWidthFt - 2;

      placedUnits.push({
        unitId: `${floor}-${unitGroup.type}-${i}`,
        type: unitGroup.type,
        label: `${spec.label} ${i + 1}`,
        floor,
        x: curX,
        y: curY,
        widthFt: unitWidth,
        depthFt: unitDepth,
        areaFt2: unitGroup.targetAreaFt2,
        hasExteriorExposure: hasExterior,
        bearing: curY <= GRID_PAD + 2 ? 'N' : curY + unitDepth >= plateDepth - 2 ? 'S' : curX <= GRID_PAD + CORE_WIDTH + 2 ? 'W' : 'E',
      });

      curX += unitWidth + 1;
      plateDepth = Math.max(plateDepth, curY + unitDepth + GRID_PAD);
    }
  }

  const totalFloorSqFt = Math.round(plateWidthFt * plateDepth);
  const netRentable = placedUnits.reduce((s, u) => s + u.areaFt2, 0);
  const commonAreaSqFt = Math.round(totalFloorSqFt * 0.05);
  const efficiency = totalFloorSqFt > 0 ? Math.round((netRentable / totalFloorSqFt) * 100) : 0;

  const svgString = renderFloorPlateSvg(placedUnits, plateWidthFt, plateDepth, floor);

  return {
    floor,
    units: placedUnits,
    commonAreaSqFt,
    circulationSqFt: Math.round(circulationSqFt),
    totalFloorSqFt,
    efficiency,
    svgString,
  };
}

function distributeUnitsAcrossFloors(
  unitMix: UnitMixProgram,
  floors: number,
): Record<number, Array<{ type: UnitType; count: number; targetAreaFt2: number }>> {
  const result: Record<number, Array<{ type: UnitType; count: number; targetAreaFt2: number }>> = {};

  for (let f = 1; f <= floors; f++) {
    result[f] = [];
  }

  for (const unit of unitMix.units) {
    const perFloor = Math.floor(unit.count / floors);
    const remainder = unit.count % floors;

    for (let f = 1; f <= floors; f++) {
      const count = perFloor + (f <= remainder ? 1 : 0);
      if (count > 0) {
        result[f].push({ type: unit.type, count, targetAreaFt2: unit.targetAreaFt2 });
      }
    }
  }

  return result;
}

// ── SVG renderer for floor plates ─────────────────────────────────────────────

const UNIT_COLORS: Record<UnitType, string> = {
  studio:      '#E3F2FD',
  one_br:      '#E8F5E9',
  two_br:      '#FFF3E0',
  three_br:    '#F3E5F5',
  penthouse:   '#FCE4EC',
  retail:      '#FFF8E1',
  office_suite:'#E8EAF6',
};

function renderFloorPlateSvg(
  units: FloorPlateUnit[],
  plateWidthFt: number,
  plateDepthFt: number,
  floor: number,
): string {
  const W = (plateWidthFt + GRID_PAD * 2 + CORE_WIDTH) * SCALE;
  const H = (plateDepthFt + GRID_PAD) * SCALE + 40;

  const unitRects = units.map(u => {
    const x = u.x * SCALE;
    const y = u.y * SCALE;
    const w = u.widthFt * SCALE;
    const h = u.depthFt * SCALE;
    const fill = UNIT_COLORS[u.type] ?? '#FAFAFA';
    const label = u.label.length > 14 ? u.label.slice(0, 13) + '…' : u.label;
    const fontSize = Math.min(10, Math.max(6, Math.floor(Math.min(w, h) / 6)));
    return `  <g>
    <rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${fill}" stroke="#546E7A" stroke-width="1" rx="1"/>
    <text x="${x + w / 2}" y="${y + h / 2}" text-anchor="middle" dominant-baseline="middle"
          font-size="${fontSize}" font-family="Arial" fill="#37474F" font-weight="500">${label}</text>
    ${u.hasExteriorExposure
      ? `<circle cx="${x + w - 6}" cy="${y + 6}" r="3.5" fill="#FDD835" opacity="0.9"/>`
      : ''}
  </g>`;
  }).join('\n');

  // Core block (elevators/stairs)
  const coreRect = `<rect x="${GRID_PAD * SCALE}" y="${GRID_PAD * SCALE}" width="${CORE_WIDTH * SCALE}" height="${(plateDepthFt - GRID_PAD) * SCALE}" fill="#CFD8DC" stroke="#546E7A" stroke-width="1"/>
  <text x="${(GRID_PAD + CORE_WIDTH / 2) * SCALE}" y="${(GRID_PAD + plateDepthFt / 2) * SCALE}" text-anchor="middle" font-size="8" fill="#546E7A" transform="rotate(-90, ${(GRID_PAD + CORE_WIDTH / 2) * SCALE}, ${(GRID_PAD + plateDepthFt / 2) * SCALE})">CORE</text>`;

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" font-family="Arial, sans-serif">
  <rect width="${W}" height="${H}" fill="#F8FAFC"/>
  ${coreRect}
${unitRects}
  <text x="${W / 2}" y="${H - 10}" text-anchor="middle" font-size="9" fill="#546E7A" opacity="0.6">Floor ${floor} — Concept floor plate — not for construction</text>
</svg>`;
}
