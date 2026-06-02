/**
 * Render an SVG concept floor plan from a FloorPlanLayout.
 * Outputs an XML string.
 *
 * DetailLevel controls drawing quality:
 *   'schematic'   — Tier 1: coloured room boxes, concept only
 *   'permit'      — Tier 2: architectural walls, door swings, overall dimensions, north arrow, title block
 *   'permit-full' — Tier 3: all of permit + window symbols, interior dims, plumbing symbols, area schedule
 */

import type { FloorPlanLayout, RoomNode, RoomType } from './types';

export type DetailLevel = 'schematic' | 'permit' | 'permit-full';

// ── Layout constants ──────────────────────────────────────────────────────────

const MARGIN     = 68;  // px margins around plan for dimension annotation
const TITLE_H    = 88;  // px height of title block strip
const WALL_PX    = 3.5; // wall stroke-width in pixels
const DIM_OFFSET = 26;  // px distance from plan edge to dimension line
const DIM_TICK   = 5;   // px tick mark half-length
const DOOR_FT    = 3;   // door leaf width in feet

// ── Colour palettes ───────────────────────────────────────────────────────────

const SCHEMATIC_FILL: Record<RoomType | 'default', string> = {
  kitchen:           '#FFF3E0',
  dining:            '#F3E5F5',
  living:            '#E8F5E9',
  pantry:            '#FFF8E1',
  primary_bedroom:   '#E3F2FD',
  secondary_bedroom: '#E8EAF6',
  primary_bathroom:  '#E0F7FA',
  secondary_bathroom:'#E0F7FA',
  powder_room:       '#F8BBD0',
  laundry:           '#EFEBE9',
  hallway:           '#F5F5F5',
  garage:            '#ECEFF1',
  mudroom:           '#EFEBE9',
  office:            '#E8F5E9',
  flex_room:         '#EDE7F6',
  addition_room:     '#FCE4EC',
  connecting_hall:   '#F5F5F5',
  front_yard:        '#DCEDC8',
  rear_yard:         '#C8E6C9',
  side_yard:         '#DCEDC8',
  driveway:          '#CFD8DC',
  porch:             '#FFF9C4',
  deck:              '#FFF9C4',
  covered_patio:     '#FFFDE7',
  utility:           '#ECEFF1',
  default:           '#FAFAFA',
};

const PERMIT_FILL: Record<RoomType | 'default', string> = {
  kitchen:           '#FFFBF5',
  dining:            '#FAF8FF',
  living:            '#F5FDF6',
  pantry:            '#FFFDF5',
  primary_bedroom:   '#F5F8FF',
  secondary_bedroom: '#F5F8FF',
  primary_bathroom:  '#F0FBFF',
  secondary_bathroom:'#F0FBFF',
  powder_room:       '#FFF5FA',
  laundry:           '#F8F8F8',
  hallway:           '#FAFAFA',
  garage:            '#F2F2F2',
  mudroom:           '#F5F5F2',
  office:            '#F5FDF8',
  flex_room:         '#F8F5FF',
  addition_room:     '#FFF5F8',
  connecting_hall:   '#FAFAFA',
  front_yard:        '#F0F7E8',
  rear_yard:         '#EDF7ED',
  side_yard:         '#F0F7E8',
  driveway:          '#F0F0F0',
  porch:             '#FFFFF0',
  deck:              '#FFFFF0',
  covered_patio:     '#FDFFF0',
  utility:           '#F2F2F2',
  default:           '#FAFAFA',
};

const WALL_COL  = '#1A1A1A';
const TEXT_COL  = '#1A1A1A';
const DIM_COL   = '#333333';
const GRAY_COL  = '#777777';
const STROKE_SC = '#546E7A'; // schematic stroke

// ── Main entry ────────────────────────────────────────────────────────────────

export function renderSvgFloorplan(
  layout: FloorPlanLayout,
  detailLevel: DetailLevel = 'schematic',
): string {
  if (detailLevel === 'schematic') return renderSchematic(layout);
  return renderPermit(layout, detailLevel);
}

// ── Schematic renderer (concept-only) ────────────────────────────────────────

function renderSchematic(layout: FloorPlanLayout): string {
  const { scale, totalWidthFt, totalDepthFt } = layout;
  const W  = totalWidthFt * scale;
  const H  = totalDepthFt * scale;
  const BH = 60;

  const roomSvg = layout.rooms
    .filter(r => r.placed && r.x !== undefined && r.y !== undefined)
    .map(r => renderSchematicRoom(r, scale))
    .join('\n');

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg"
     viewBox="0 0 ${W} ${H + BH}"
     width="${W}" height="${H + BH}"
     font-family="Arial, Helvetica, sans-serif">

  <!-- Background -->
  <rect width="${W}" height="${H + BH}" fill="#F8FAFC"/>

  <!-- Rooms -->
  <g id="rooms">
${roomSvg}
  </g>

  <!-- Scale bar -->
  <g id="scalebar" transform="translate(16,${H + 12})">
    ${schematicScaleBar(scale)}
  </g>

  <!-- Footer label -->
  <text x="${W / 2}" y="${H + BH - 10}"
        text-anchor="middle" font-size="9" fill="${STROKE_SC}" opacity="0.55"
        font-style="italic">
    Concept floor plan — approximate dimensions — not for construction
  </text>
</svg>`;
}

function renderSchematicRoom(room: RoomNode, scale: number): string {
  const x = (room.x ?? 0) * scale;
  const y = (room.y ?? 0) * scale;
  const w = room.dimensions.widthFt * scale;
  const h = room.dimensions.depthFt * scale;
  const fill = SCHEMATIC_FILL[room.type as RoomType] ?? SCHEMATIC_FILL.default;

  const cx = x + w / 2;
  const cy = y + h / 2;
  const labelSize = Math.min(12, Math.max(7, Math.floor(Math.min(w, h) / 7)));
  const dimSize   = Math.max(6, labelSize - 2);
  const showDim   = w > 56 && h > 32;
  const hasIssue  = (room.issues?.length ?? 0) > 0;

  return `    <!-- ${room.label} -->
    <g id="${room.id}">
      <rect x="${x}" y="${y}" width="${w}" height="${h}"
            fill="${fill}" stroke="${STROKE_SC}" stroke-width="1.5" rx="2"/>
      <text x="${cx}" y="${cy - (showDim ? dimSize / 2 + 2 : 0)}"
            text-anchor="middle" dominant-baseline="middle"
            font-size="${labelSize}" font-weight="600" fill="${STROKE_SC}">${room.label}</text>
      ${showDim
        ? `<text x="${cx}" y="${cy + labelSize / 2 + 4}"
                text-anchor="middle" dominant-baseline="middle"
                font-size="${dimSize}" fill="${STROKE_SC}" opacity="0.65"
                >${room.dimensions.widthFt}' × ${room.dimensions.depthFt}'</text>`
        : ''}
      ${hasIssue
        ? `<circle cx="${x + w - 9}" cy="${y + 9}" r="5.5" fill="#EF5350" opacity="0.85"/>
           <text x="${x + w - 9}" y="${y + 9}"
                 text-anchor="middle" dominant-baseline="middle"
                 font-size="7" fill="white" font-weight="bold">!</text>`
        : ''}
    </g>`;
}

function schematicScaleBar(scale: number): string {
  const barPx = 10 * scale;
  return `<line x1="0" y1="8" x2="${barPx}" y2="8" stroke="${STROKE_SC}" stroke-width="2"/>
    <line x1="0" y1="4" x2="0" y2="12" stroke="${STROKE_SC}" stroke-width="1.5"/>
    <line x1="${barPx}" y1="4" x2="${barPx}" y2="12" stroke="${STROKE_SC}" stroke-width="1.5"/>
    <text x="${barPx / 2}" y="22" text-anchor="middle" font-size="9" fill="${STROKE_SC}">10 ft</text>`;
}

// ── Permit renderer (architectural quality) ───────────────────────────────────

interface SharedEdge {
  roomA: RoomNode;
  roomB: RoomNode;
  edgeType: 'vertical' | 'horizontal';
  /** fixed coordinate in feet (x for vertical wall, y for horizontal wall) */
  wallPos: number;
  /** start along the wall in feet */
  start: number;
  /** end along the wall in feet */
  end: number;
  length: number;
}

const OUTDOOR_TYPES = new Set<string>([
  'front_yard', 'rear_yard', 'side_yard', 'driveway',
  'porch', 'deck', 'covered_patio',
]);

function computeSharedEdges(rooms: RoomNode[]): SharedEdge[] {
  const placed = rooms.filter(r => r.placed && r.x !== undefined && r.y !== undefined);
  const edges: SharedEdge[] = [];
  const SNAP = 1.2; // ft tolerance (catches 1ft annealing residuals when ROOM_GAP=0)

  for (let i = 0; i < placed.length; i++) {
    for (let j = i + 1; j < placed.length; j++) {
      const a = placed[i], b = placed[j];
      const ax = a.x!, ay = a.y!, aw = a.dimensions.widthFt, ah = a.dimensions.depthFt;
      const bx = b.x!, by = b.y!, bw = b.dimensions.widthFt, bh = b.dimensions.depthFt;

      // A right ≈ B left (vertical wall)
      if (Math.abs((ax + aw) - bx) < SNAP) {
        const s = Math.max(ay, by), e = Math.min(ay + ah, by + bh);
        if (e - s >= 1) edges.push({ roomA: a, roomB: b, edgeType: 'vertical', wallPos: ax + aw, start: s, end: e, length: e - s });
      }
      // B right ≈ A left (vertical wall)
      else if (Math.abs((bx + bw) - ax) < SNAP) {
        const s = Math.max(ay, by), e = Math.min(ay + ah, by + bh);
        if (e - s >= 1) edges.push({ roomA: b, roomB: a, edgeType: 'vertical', wallPos: bx + bw, start: s, end: e, length: e - s });
      }

      // A bottom ≈ B top (horizontal wall)
      if (Math.abs((ay + ah) - by) < SNAP) {
        const s = Math.max(ax, bx), e = Math.min(ax + aw, bx + bw);
        if (e - s >= 1) edges.push({ roomA: a, roomB: b, edgeType: 'horizontal', wallPos: ay + ah, start: s, end: e, length: e - s });
      }
      // B bottom ≈ A top (horizontal wall)
      else if (Math.abs((by + bh) - ay) < SNAP) {
        const s = Math.max(ax, bx), e = Math.min(ax + aw, bx + bw);
        if (e - s >= 1) edges.push({ roomA: b, roomB: a, edgeType: 'horizontal', wallPos: by + bh, start: s, end: e, length: e - s });
      }
    }
  }

  return edges;
}

function renderPermit(layout: FloorPlanLayout, level: DetailLevel): string {
  const { scale: s, totalWidthFt, totalDepthFt } = layout;

  const planW = totalWidthFt * s;
  const planH = totalDepthFt * s;
  const svgW  = planW + 2 * MARGIN;
  const svgH  = planH + 2 * MARGIN + TITLE_H;

  const MX = MARGIN;
  const MY = MARGIN;

  const placed = layout.rooms.filter(r => r.placed && r.x !== undefined && r.y !== undefined);
  const sharedEdges = computeSharedEdges(placed);

  // Build interior-edge map (which sides of each room share a wall with another room)
  const interiorSides = buildInteriorSideMap(placed, sharedEdges);

  // Room fills
  const fills = placed.map(r => {
    const rx = fmt(MX + r.x! * s), ry = fmt(MY + r.y! * s);
    const rw = fmt(r.dimensions.widthFt * s), rh = fmt(r.dimensions.depthFt * s);
    const fill = PERMIT_FILL[r.type as RoomType] ?? PERMIT_FILL.default;
    return `<rect x="${rx}" y="${ry}" width="${rw}" height="${rh}" fill="${fill}"/>`;
  }).join('\n    ');

  // Outer building boundary (perimeter polygon over connected room rows)
  const outerBoundary = buildOuterBoundaryPolygon(placed, s, MX, MY);

  // Room wall outlines
  const walls = placed.map(r => {
    const rx = fmt(MX + r.x! * s), ry = fmt(MY + r.y! * s);
    const rw = fmt(r.dimensions.widthFt * s), rh = fmt(r.dimensions.depthFt * s);
    return `<rect x="${rx}" y="${ry}" width="${rw}" height="${rh}" fill="none" stroke="${WALL_COL}" stroke-width="${WALL_PX}" stroke-linejoin="miter"/>`;
  }).join('\n    ');

  // Door symbols on shared walls
  const doors = renderDoorSymbols(sharedEdges, s, MX, MY);

  // Window symbols (permit-full only)
  const windows = level === 'permit-full'
    ? renderWindowSymbols(placed, interiorSides, s, MX, MY, totalWidthFt, totalDepthFt)
    : '';

  // Room labels (name + area)
  const labels = renderPermitRoomLabels(placed, s, MX, MY);

  // Overall dimension lines
  const dimLines = renderOverallDimensions(totalWidthFt, totalDepthFt, s, MX, MY);

  // Interior dimensions (permit-full)
  const interiorDims = level === 'permit-full'
    ? renderInteriorDimensions(placed, s, MX, MY)
    : '';

  // Plumbing fixture symbols (permit-full)
  const plumbing = level === 'permit-full'
    ? renderPlumbingSymbols(placed, s, MX, MY)
    : '';

  // North arrow — top-right corner, just inside SVG
  const northArrow = buildNorthArrow(svgW - 36, 36);

  // Scale bar — left side of bottom margin
  const scaleBar = buildScaleBar(s, MX, planH + MY + DIM_OFFSET + 14);

  // Title block — full-width strip at bottom
  const titleBlock = buildTitleBlock(0, planH + 2 * MY, svgW, TITLE_H, level);

  // Room area schedule (permit-full) — in title block right column
  const scheduleRows = level === 'permit-full'
    ? buildScheduleRows(placed, svgW * 0.67, planH + 2 * MY, svgW * 0.33, TITLE_H)
    : '';

  const issueMarkers = placed
    .filter(r => (r.issues?.length ?? 0) > 0)
    .map(r => {
      const rx = MX + r.x! * s, ry = MY + r.y! * s;
      const rw = r.dimensions.widthFt * s;
      return `<circle cx="${fmt(rx + rw - 8)}" cy="${fmt(ry + 8)}" r="5" fill="#EF5350"/>
    <text x="${fmt(rx + rw - 8)}" y="${fmt(ry + 8)}" text-anchor="middle" dominant-baseline="middle" font-size="7" font-weight="700" fill="white">!</text>`;
    }).join('\n    ');

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg"
     viewBox="0 0 ${svgW} ${svgH}"
     width="${svgW}" height="${svgH}"
     font-family="'Courier New', Courier, monospace">

  <!-- Background -->
  <rect width="${svgW}" height="${svgH}" fill="#FFFFFF"/>

  <!-- Room fills -->
  <g id="fills">
    ${fills}
  </g>

  <!-- Outer building boundary -->
  <g id="boundary">
    ${outerBoundary}
  </g>

  <!-- Door symbols -->
  <g id="doors" fill="none">
    ${doors}
  </g>

${windows ? `  <!-- Window symbols -->
  <g id="windows">
    ${windows}
  </g>

` : ''}  <!-- Walls -->
  <g id="walls">
    ${walls}
  </g>

  <!-- Dimensions -->
  <g id="dims" fill="${DIM_COL}" stroke="${DIM_COL}">
    ${dimLines}
    ${interiorDims}
  </g>

  <!-- Room labels -->
  <g id="labels">
    ${labels}
  </g>

${plumbing ? `  <!-- Plumbing symbols -->
  <g id="plumbing" fill="none" stroke="${GRAY_COL}" stroke-width="0.9">
    ${plumbing}
  </g>

` : ''}${issueMarkers ? `  <!-- Issue markers -->
  <g id="issues">
    ${issueMarkers}
  </g>

` : ''}  <!-- North arrow -->
  ${northArrow}

  <!-- Scale bar -->
  ${scaleBar}

  <!-- Title block -->
  ${titleBlock}
  ${scheduleRows}

</svg>`;
}

// ── Interior side map ─────────────────────────────────────────────────────────

type SideSet = Set<'top' | 'bottom' | 'left' | 'right'>;

function buildInteriorSideMap(rooms: RoomNode[], edges: SharedEdge[]): Map<string, SideSet> {
  const map = new Map<string, SideSet>();
  const get = (id: string): SideSet => {
    if (!map.has(id)) map.set(id, new Set());
    return map.get(id)!;
  };
  for (const edge of edges) {
    const a = edge.roomA, b = edge.roomB;
    if (edge.edgeType === 'vertical') {
      // wallPos is at a.right = b.left
      get(a.id).add('right');
      get(b.id).add('left');
    } else {
      // wallPos is at a.bottom = b.top
      get(a.id).add('bottom');
      get(b.id).add('top');
    }
  }
  return map;
}

// ── Door symbols ──────────────────────────────────────────────────────────────

function renderDoorSymbols(edges: SharedEdge[], s: number, MX: number, MY: number): string {
  const parts: string[] = [];

  for (const edge of edges) {
    if (edge.length < DOOR_FT + 0.5) continue;
    if (OUTDOOR_TYPES.has(edge.roomA.type) || OUTDOOR_TYPES.has(edge.roomB.type)) continue;

    // Cap door width so it never overflows a narrow corridor or short shared edge
    const doorFt = Math.min(DOOR_FT, edge.length - 0.25);
    const doorPx = doorFt * s;

    // Centre the door in the overlap
    const mid  = edge.start + edge.length / 2;
    const dStart = Math.max(edge.start + 0.3, mid - doorFt / 2);

    if (edge.edgeType === 'vertical') {
      const wx = MX + edge.wallPos * s;
      const dy = MY + dStart * s;
      // Opening lines (jambs — white gap in wall)
      parts.push(
        `<line x1="${fmt(wx - 2)}" y1="${fmt(dy)}" x2="${fmt(wx + 2)}" y2="${fmt(dy)}" stroke="white" stroke-width="${WALL_PX + 1}"/>`,
        `<line x1="${fmt(wx - 2)}" y1="${fmt(dy + doorPx)}" x2="${fmt(wx + 2)}" y2="${fmt(dy + doorPx)}" stroke="white" stroke-width="${WALL_PX + 1}"/>`,
        // Door leaf (line perpendicular into room B — to the right)
        `<line x1="${fmt(wx)}" y1="${fmt(dy)}" x2="${fmt(wx + doorPx)}" y2="${fmt(dy)}" stroke="${WALL_COL}" stroke-width="1.2"/>`,
        // Swing arc
        `<path d="M ${fmt(wx + doorPx)} ${fmt(dy)} A ${fmt(doorPx)} ${fmt(doorPx)} 0 0 1 ${fmt(wx)} ${fmt(dy + doorPx)}" stroke="${GRAY_COL}" stroke-width="0.75" stroke-dasharray="3,2"/>`,
      );
    } else {
      const wy = MY + edge.wallPos * s;
      const dx = MX + dStart * s;
      parts.push(
        `<line x1="${fmt(dx)}" y1="${fmt(wy - 2)}" x2="${fmt(dx)}" y2="${fmt(wy + 2)}" stroke="white" stroke-width="${WALL_PX + 1}"/>`,
        `<line x1="${fmt(dx + doorPx)}" y1="${fmt(wy - 2)}" x2="${fmt(dx + doorPx)}" y2="${fmt(wy + 2)}" stroke="white" stroke-width="${WALL_PX + 1}"/>`,
        `<line x1="${fmt(dx)}" y1="${fmt(wy)}" x2="${fmt(dx)}" y2="${fmt(wy + doorPx)}" stroke="${WALL_COL}" stroke-width="1.2"/>`,
        `<path d="M ${fmt(dx)} ${fmt(wy + doorPx)} A ${fmt(doorPx)} ${fmt(doorPx)} 0 0 0 ${fmt(dx + doorPx)} ${fmt(wy)}" stroke="${GRAY_COL}" stroke-width="0.75" stroke-dasharray="3,2"/>`,
      );
    }
  }

  return parts.join('\n    ');
}

// ── Window symbols ────────────────────────────────────────────────────────────

const WINDOW_ROOM_TYPES = new Set<string>([
  'kitchen', 'dining', 'living', 'primary_bedroom', 'secondary_bedroom',
  'office', 'flex_room', 'addition_room',
]);

function renderWindowSymbols(
  rooms: RoomNode[],
  interiorSides: Map<string, SideSet>,
  s: number, MX: number, MY: number,
  totalW: number, totalH: number,
): string {
  const parts: string[] = [];

  for (const room of rooms) {
    if (!WINDOW_ROOM_TYPES.has(room.type)) continue;

    const rx = room.x!, ry = room.y!;
    const rw = room.dimensions.widthFt, rh = room.dimensions.depthFt;
    const interior = interiorSides.get(room.id) ?? new Set<string>();

    // Prefer perimeter edges for windows
    const candidates: Array<{ side: 'top' | 'bottom' | 'left' | 'right'; len: number; onPerimeter: boolean }> = [];
    if (!interior.has('top'))    candidates.push({ side: 'top',    len: rw, onPerimeter: ry < 0.5 });
    if (!interior.has('bottom')) candidates.push({ side: 'bottom', len: rw, onPerimeter: (ry + rh) > totalH - 0.5 });
    if (!interior.has('left'))   candidates.push({ side: 'left',   len: rh, onPerimeter: rx < 0.5 });
    if (!interior.has('right'))  candidates.push({ side: 'right',  len: rh, onPerimeter: (rx + rw) > totalW - 0.5 });

    if (candidates.length === 0) continue;

    // Prefer perimeter, then longest edge
    candidates.sort((a, b) => (b.onPerimeter ? 1 : 0) - (a.onPerimeter ? 1 : 0) || b.len - a.len);
    const best = candidates[0];

    const winFt = Math.min(4, best.len * 0.5);
    const winPx = winFt * s;
    const GAP = 3; // px spacing between the three lines

    if (best.side === 'top') {
      const wx = MX + (rx + rw / 2 - winFt / 2) * s;
      const wy = MY + ry * s;
      parts.push(
        `<line x1="${fmt(wx)}" y1="${fmt(wy - GAP)}" x2="${fmt(wx + winPx)}" y2="${fmt(wy - GAP)}" stroke="${WALL_COL}" stroke-width="0.8"/>`,
        `<line x1="${fmt(wx)}" y1="${fmt(wy)}"       x2="${fmt(wx + winPx)}" y2="${fmt(wy)}"       stroke="${WALL_COL}" stroke-width="2.5"/>`,
        `<line x1="${fmt(wx)}" y1="${fmt(wy + GAP)}" x2="${fmt(wx + winPx)}" y2="${fmt(wy + GAP)}" stroke="${WALL_COL}" stroke-width="0.8"/>`,
      );
    } else if (best.side === 'bottom') {
      const wx = MX + (rx + rw / 2 - winFt / 2) * s;
      const wy = MY + (ry + rh) * s;
      parts.push(
        `<line x1="${fmt(wx)}" y1="${fmt(wy - GAP)}" x2="${fmt(wx + winPx)}" y2="${fmt(wy - GAP)}" stroke="${WALL_COL}" stroke-width="0.8"/>`,
        `<line x1="${fmt(wx)}" y1="${fmt(wy)}"       x2="${fmt(wx + winPx)}" y2="${fmt(wy)}"       stroke="${WALL_COL}" stroke-width="2.5"/>`,
        `<line x1="${fmt(wx)}" y1="${fmt(wy + GAP)}" x2="${fmt(wx + winPx)}" y2="${fmt(wy + GAP)}" stroke="${WALL_COL}" stroke-width="0.8"/>`,
      );
    } else if (best.side === 'left') {
      const wx = MX + rx * s;
      const wy_c = MY + (ry + rh / 2 - winFt / 2) * s;
      parts.push(
        `<line x1="${fmt(wx - GAP)}" y1="${fmt(wy_c)}" x2="${fmt(wx - GAP)}" y2="${fmt(wy_c + winPx)}" stroke="${WALL_COL}" stroke-width="0.8"/>`,
        `<line x1="${fmt(wx)}"       y1="${fmt(wy_c)}" x2="${fmt(wx)}"       y2="${fmt(wy_c + winPx)}" stroke="${WALL_COL}" stroke-width="2.5"/>`,
        `<line x1="${fmt(wx + GAP)}" y1="${fmt(wy_c)}" x2="${fmt(wx + GAP)}" y2="${fmt(wy_c + winPx)}" stroke="${WALL_COL}" stroke-width="0.8"/>`,
      );
    } else {
      const wx = MX + (rx + rw) * s;
      const wy_c = MY + (ry + rh / 2 - winFt / 2) * s;
      parts.push(
        `<line x1="${fmt(wx - GAP)}" y1="${fmt(wy_c)}" x2="${fmt(wx - GAP)}" y2="${fmt(wy_c + winPx)}" stroke="${WALL_COL}" stroke-width="0.8"/>`,
        `<line x1="${fmt(wx)}"       y1="${fmt(wy_c)}" x2="${fmt(wx)}"       y2="${fmt(wy_c + winPx)}" stroke="${WALL_COL}" stroke-width="2.5"/>`,
        `<line x1="${fmt(wx + GAP)}" y1="${fmt(wy_c)}" x2="${fmt(wx + GAP)}" y2="${fmt(wy_c + winPx)}" stroke="${WALL_COL}" stroke-width="0.8"/>`,
      );
    }
  }

  return parts.join('\n    ');
}

// ── Room labels ───────────────────────────────────────────────────────────────

function renderPermitRoomLabels(rooms: RoomNode[], s: number, MX: number, MY: number): string {
  return rooms.map(r => {
    const cx = MX + (r.x! + r.dimensions.widthFt / 2) * s;
    const cy = MY + (r.y! + r.dimensions.depthFt / 2) * s;
    const rw = r.dimensions.widthFt * s;
    const rh = r.dimensions.depthFt * s;

    const sz  = Math.min(10, Math.max(6, Math.floor(Math.min(rw, rh) / 8)));
    const showArea = rw > 55 && rh > 34;
    const areaStr  = `${Math.round(r.dimensions.areaFt2)} SF`;
    const labelY   = showArea ? cy - sz * 0.6 : cy;

    return [
      `<text x="${fmt(cx)}" y="${fmt(labelY)}"
          text-anchor="middle" dominant-baseline="middle"
          font-size="${sz}" font-weight="600" fill="${TEXT_COL}"
          letter-spacing="0.4">${r.label.toUpperCase()}</text>`,
      showArea
        ? `<text x="${fmt(cx)}" y="${fmt(cy + sz * 0.9)}"
          text-anchor="middle" dominant-baseline="middle"
          font-size="${Math.max(6, sz - 1)}" fill="${GRAY_COL}">${areaStr}</text>`
        : '',
    ].filter(Boolean).join('\n    ');
  }).join('\n    ');
}

// ── Dimension lines ───────────────────────────────────────────────────────────

function feetInches(ft: number): string {
  const f = Math.floor(ft);
  const i = Math.round((ft - f) * 12);
  return i === 0 ? `${f}'-0"` : `${f}'-${i}"`;
}

function renderOverallDimensions(
  totalW: number, totalH: number,
  s: number, MX: number, MY: number,
): string {
  const planW = totalW * s, planH = totalH * s;
  const topY   = MY - DIM_OFFSET;
  const leftX  = MX - DIM_OFFSET;
  const parts: string[] = [];

  // Top: overall width
  parts.push(
    `<line x1="${fmt(MX)}" y1="${fmt(MY)}" x2="${fmt(MX)}" y2="${fmt(topY - DIM_TICK)}" stroke-width="0.75"/>`,
    `<line x1="${fmt(MX + planW)}" y1="${fmt(MY)}" x2="${fmt(MX + planW)}" y2="${fmt(topY - DIM_TICK)}" stroke-width="0.75"/>`,
    `<line x1="${fmt(MX)}" y1="${fmt(topY)}" x2="${fmt(MX + planW)}" y2="${fmt(topY)}" stroke-width="0.75"/>`,
    `<line x1="${fmt(MX)}" y1="${fmt(topY - DIM_TICK)}" x2="${fmt(MX)}" y2="${fmt(topY + DIM_TICK)}" stroke-width="1.5"/>`,
    `<line x1="${fmt(MX + planW)}" y1="${fmt(topY - DIM_TICK)}" x2="${fmt(MX + planW)}" y2="${fmt(topY + DIM_TICK)}" stroke-width="1.5"/>`,
    `<text x="${fmt(MX + planW / 2)}" y="${fmt(topY - DIM_TICK - 4)}"
           text-anchor="middle" font-size="9" fill="${DIM_COL}">${feetInches(totalW)}</text>`,
  );

  // Left: overall depth
  parts.push(
    `<line x1="${fmt(MX)}" y1="${fmt(MY)}" x2="${fmt(leftX - DIM_TICK)}" y2="${fmt(MY)}" stroke-width="0.75"/>`,
    `<line x1="${fmt(MX)}" y1="${fmt(MY + planH)}" x2="${fmt(leftX - DIM_TICK)}" y2="${fmt(MY + planH)}" stroke-width="0.75"/>`,
    `<line x1="${fmt(leftX)}" y1="${fmt(MY)}" x2="${fmt(leftX)}" y2="${fmt(MY + planH)}" stroke-width="0.75"/>`,
    `<line x1="${fmt(leftX - DIM_TICK)}" y1="${fmt(MY)}" x2="${fmt(leftX + DIM_TICK)}" y2="${fmt(MY)}" stroke-width="1.5"/>`,
    `<line x1="${fmt(leftX - DIM_TICK)}" y1="${fmt(MY + planH)}" x2="${fmt(leftX + DIM_TICK)}" y2="${fmt(MY + planH)}" stroke-width="1.5"/>`,
    `<text x="${fmt(leftX - DIM_TICK - 5)}" y="${fmt(MY + planH / 2)}"
           text-anchor="middle" font-size="9" fill="${DIM_COL}"
           transform="rotate(-90 ${fmt(leftX - DIM_TICK - 5)} ${fmt(MY + planH / 2)})">${feetInches(totalH)}</text>`,
  );

  return parts.join('\n    ');
}

function renderInteriorDimensions(rooms: RoomNode[], s: number, MX: number, MY: number): string {
  return rooms.map(r => {
    const rx = MX + r.x! * s, ry = MY + r.y! * s;
    const rw = r.dimensions.widthFt * s, rh = r.dimensions.depthFt * s;

    // Only draw interior dims for rooms ≥ 13ft wide and 12ft deep — avoids crowding in small rooms
    if (rw < 78 || rh < 72) return '';

    const wText = feetInches(r.dimensions.widthFt);
    const hText = feetInches(r.dimensions.depthFt);

    return [
      // Width dim (dashed line along bottom interior)
      `<line x1="${fmt(rx + 5)}" y1="${fmt(ry + rh - 16)}" x2="${fmt(rx + rw - 5)}" y2="${fmt(ry + rh - 16)}" stroke-width="0.5" stroke-dasharray="2,2"/>`,
      `<text x="${fmt(rx + rw / 2)}" y="${fmt(ry + rh - 19)}" text-anchor="middle" font-size="7">${wText}</text>`,
      // Height dim (dashed line along right interior)
      `<line x1="${fmt(rx + rw - 16)}" y1="${fmt(ry + 5)}" x2="${fmt(rx + rw - 16)}" y2="${fmt(ry + rh - 5)}" stroke-width="0.5" stroke-dasharray="2,2"/>`,
      `<text x="${fmt(rx + rw - 19)}" y="${fmt(ry + rh / 2)}" text-anchor="middle" font-size="7"
             transform="rotate(-90 ${fmt(rx + rw - 19)} ${fmt(ry + rh / 2)})">${hText}</text>`,
    ].join('\n    ');
  }).join('\n    ');
}

// ── Plumbing symbols ──────────────────────────────────────────────────────────

function renderPlumbingSymbols(rooms: RoomNode[], s: number, MX: number, MY: number): string {
  const parts: string[] = [];

  for (const room of rooms) {
    const rx = MX + room.x! * s;
    const ry = MY + room.y! * s;
    const rw = room.dimensions.widthFt * s;
    const rh = room.dimensions.depthFt * s;

    // Skip rooms too small to draw symbols without overflowing walls
    if (rw < 42 || rh < 42) continue;

    if (room.type === 'primary_bathroom' || room.type === 'secondary_bathroom') {
      // Toilet: tank rect + bowl ellipse
      const tw = Math.min(rw * 0.28, 17), th = Math.min(rh * 0.38, 26);
      const tx = rx + rw - tw - 4, ty = ry + 4;
      parts.push(
        `<rect x="${fmt(tx)}" y="${fmt(ty)}" width="${fmt(tw * 0.65)}" height="${fmt(th * 0.32)}" rx="2"/>`,
        `<ellipse cx="${fmt(tx + tw * 0.32)}" cy="${fmt(ty + th * 0.6)}" rx="${fmt(tw * 0.38)}" ry="${fmt(th * 0.42)}"/>`,
        // Sink
        `<rect x="${fmt(rx + 4)}" y="${fmt(ry + rh - 18)}" width="15" height="13" rx="2"/>`,
        `<circle cx="${fmt(rx + 11)}" cy="${fmt(ry + rh - 11)}" r="2.5"/>`,
      );
    } else if (room.type === 'powder_room') {
      const tw = Math.min(rw * 0.45, 18), th = Math.min(rh * 0.5, 26);
      parts.push(
        `<rect x="${fmt(rx + 4)}" y="${fmt(ry + 4)}" width="${fmt(tw * 0.7)}" height="${fmt(th * 0.3)}" rx="2"/>`,
        `<ellipse cx="${fmt(rx + 4 + tw * 0.35)}" cy="${fmt(ry + 4 + th * 0.55)}" rx="${fmt(tw * 0.35)}" ry="${fmt(th * 0.38)}"/>`,
      );
    } else if (room.type === 'kitchen') {
      // Double-bowl sink
      const kx = MX + (room.x! + room.dimensions.widthFt / 2) * s - 18;
      const ky = ry + 6;
      parts.push(
        `<rect x="${fmt(kx)}" y="${fmt(ky)}" width="15" height="13" rx="1"/>`,
        `<rect x="${fmt(kx + 17)}" y="${fmt(ky)}" width="15" height="13" rx="1"/>`,
        `<circle cx="${fmt(kx + 7)}" cy="${fmt(ky + 6)}" r="2"/>`,
        `<circle cx="${fmt(kx + 24)}" cy="${fmt(ky + 6)}" r="2"/>`,
      );
    } else if (room.type === 'laundry') {
      // Washer symbol (circle in square)
      const cx = rx + rw / 2, cy = ry + rh / 2;
      const hw = Math.min(rw * 0.4, 20);
      parts.push(
        `<rect x="${fmt(cx - hw)}" y="${fmt(cy - hw)}" width="${fmt(hw * 2)}" height="${fmt(hw * 2)}" rx="2"/>`,
        `<circle cx="${fmt(cx)}" cy="${fmt(cy)}" r="${fmt(hw * 0.65)}"/>`,
        `<circle cx="${fmt(cx)}" cy="${fmt(cy)}" r="${fmt(hw * 0.2)}"/>`,
      );
    }
  }

  return parts.join('\n    ');
}

// ── North arrow ───────────────────────────────────────────────────────────────

function buildNorthArrow(cx: number, cy: number): string {
  const R = 15;
  return `<g id="north-arrow">
    <circle cx="${fmt(cx)}" cy="${fmt(cy)}" r="${R}" fill="none" stroke="${WALL_COL}" stroke-width="1"/>
    <polygon points="${fmt(cx)},${fmt(cy - R + 2)} ${fmt(cx + R * 0.38)},${fmt(cy + R * 0.52)} ${fmt(cx)},${fmt(cy + R * 0.28)}"
             fill="${WALL_COL}"/>
    <polygon points="${fmt(cx)},${fmt(cy - R + 2)} ${fmt(cx - R * 0.38)},${fmt(cy + R * 0.52)} ${fmt(cx)},${fmt(cy + R * 0.28)}"
             fill="none" stroke="${WALL_COL}" stroke-width="1"/>
    <text x="${fmt(cx)}" y="${fmt(cy - R - 5)}" text-anchor="middle"
          font-size="10" font-weight="700" fill="${WALL_COL}">N</text>
  </g>`;
}

// ── Scale bar ─────────────────────────────────────────────────────────────────

function buildScaleBar(s: number, x: number, y: number): string {
  const ft5 = 5 * s, ft10 = 10 * s;
  const bh = 5;
  return `<g id="scale-bar" font-family="'Courier New', Courier, monospace">
    <rect x="${fmt(x)}" y="${fmt(y)}" width="${fmt(ft5)}" height="${bh}" fill="${WALL_COL}"/>
    <rect x="${fmt(x + ft5)}" y="${fmt(y)}" width="${fmt(ft5)}" height="${bh}" fill="white" stroke="${WALL_COL}" stroke-width="0.75"/>
    <line x1="${fmt(x)}" y1="${fmt(y - 3)}" x2="${fmt(x)}" y2="${fmt(y + bh + 3)}" stroke="${WALL_COL}" stroke-width="1"/>
    <line x1="${fmt(x + ft5)}" y1="${fmt(y - 3)}" x2="${fmt(x + ft5)}" y2="${fmt(y + bh + 3)}" stroke="${WALL_COL}" stroke-width="1"/>
    <line x1="${fmt(x + ft10)}" y1="${fmt(y - 3)}" x2="${fmt(x + ft10)}" y2="${fmt(y + bh + 3)}" stroke="${WALL_COL}" stroke-width="1"/>
    <text x="${fmt(x)}" y="${fmt(y + bh + 12)}" text-anchor="middle" font-size="8" fill="${TEXT_COL}">0</text>
    <text x="${fmt(x + ft5)}" y="${fmt(y + bh + 12)}" text-anchor="middle" font-size="8" fill="${TEXT_COL}">5</text>
    <text x="${fmt(x + ft10)}" y="${fmt(y + bh + 12)}" text-anchor="middle" font-size="8" fill="${TEXT_COL}">10 ft</text>
    <text x="${fmt(x + ft5)}" y="${fmt(y + bh + 23)}" text-anchor="middle" font-size="7" fill="${GRAY_COL}">SCALE: 1/4"=1'-0"</text>
  </g>`;
}

// ── Title block ───────────────────────────────────────────────────────────────

function buildTitleBlock(x: number, y: number, w: number, h: number, level: DetailLevel): string {
  const tierLine = level === 'permit-full'
    ? 'PREMIUM+ — PERMIT REVIEW SET'
    : 'PREMIUM — CONCEPT DESIGN';
  const mo = new Date().toLocaleString('en-US', { month: 'short', year: 'numeric' });
  const col1 = w * 0.36, col2 = w * 0.66;
  const midY = y + h * 0.45;

  return `<g id="title-block" font-family="'Courier New', Courier, monospace">
    <rect x="${fmt(x)}" y="${fmt(y)}" width="${fmt(w)}" height="${fmt(h)}" fill="#F6F6F6" stroke="${WALL_COL}" stroke-width="1"/>
    <line x1="${fmt(x)}" y1="${fmt(midY)}" x2="${fmt(x + w)}" y2="${fmt(midY)}" stroke="${WALL_COL}" stroke-width="0.6"/>
    <line x1="${fmt(col1)}" y1="${fmt(y)}" x2="${fmt(col1)}" y2="${fmt(y + h)}" stroke="${WALL_COL}" stroke-width="0.5"/>
    <line x1="${fmt(col2)}" y1="${fmt(y)}" x2="${fmt(col2)}" y2="${fmt(y + h)}" stroke="${WALL_COL}" stroke-width="0.5"/>

    <!-- Left column: drawing title -->
    <text x="${fmt(x + 10)}" y="${fmt(y + 18)}" font-size="11" font-weight="700" fill="${TEXT_COL}" letter-spacing="1">CONCEPT FLOOR PLAN</text>
    <text x="${fmt(x + 10)}" y="${fmt(y + 31)}" font-size="8" fill="${GRAY_COL}">${tierLine}</text>
    <text x="${fmt(x + 10)}" y="${fmt(y + h - 10)}" font-size="9" font-weight="700" fill="${TEXT_COL}">KEALEE</text>
    <text x="${fmt(x + 55)}" y="${fmt(y + h - 10)}" font-size="8" fill="${GRAY_COL}">CONCEPT SERVICES</text>

    <!-- Middle column: scale + notes -->
    <text x="${fmt(col1 + 8)}" y="${fmt(y + 16)}" font-size="8" font-weight="600" fill="${TEXT_COL}">SCALE</text>
    <text x="${fmt(col1 + 8)}" y="${fmt(y + 28)}" font-size="9" fill="${TEXT_COL}">1/4" = 1'-0"</text>
    <text x="${fmt(col1 + 8)}" y="${fmt(midY + 14)}" font-size="7" fill="${GRAY_COL}">FOR REVIEW ONLY</text>
    <text x="${fmt(col1 + 8)}" y="${fmt(midY + 24)}" font-size="7" fill="${GRAY_COL}">NOT FOR CONSTRUCTION</text>

    <!-- Right column: date -->
    <text x="${fmt(col2 + 8)}" y="${fmt(y + 16)}" font-size="8" font-weight="600" fill="${TEXT_COL}">DATE</text>
    <text x="${fmt(col2 + 8)}" y="${fmt(y + 28)}" font-size="9" fill="${TEXT_COL}">${mo}</text>
    <text x="${fmt(col2 + 8)}" y="${fmt(midY + 14)}" font-size="7" fill="${GRAY_COL}">SCHEMATIC DESIGN</text>
    <text x="${fmt(col2 + 8)}" y="${fmt(midY + 24)}" font-size="7" fill="${GRAY_COL}">CONCEPT PHASE</text>
  </g>`;
}

// ── Room area schedule (permit-full) ──────────────────────────────────────────

function buildScheduleRows(
  rooms: RoomNode[],
  x: number, y: number, _w: number, h: number,
): string {
  if (rooms.length === 0) return '';

  const ROW_H  = 11;
  const tblW   = 130;
  const hdrH   = 18;
  const tblH   = hdrH + rooms.length * ROW_H + ROW_H + 4; // +1 for total row

  // Only render if it fits inside the title block
  if (tblH > h - 6) return '';

  const total = rooms.reduce((s, r) => s + r.dimensions.areaFt2, 0);
  const ty    = y + Math.floor((h - tblH) / 2);
  const divX  = x + tblW - 36;

  const rows = rooms.map((r, i) => {
    const rowY = ty + hdrH + i * ROW_H;
    const bg   = i % 2 === 0 ? '#F2F2F2' : '#FAFAFA';
    return `<rect x="${fmt(x)}" y="${fmt(rowY)}" width="${tblW}" height="${ROW_H}" fill="${bg}"/>
    <text x="${fmt(x + 3)}" y="${fmt(rowY + ROW_H - 3)}" font-size="6.5" fill="${TEXT_COL}">${r.label.toUpperCase()}</text>
    <text x="${fmt(divX + 33)}" y="${fmt(rowY + ROW_H - 3)}" text-anchor="end" font-size="6.5" fill="${TEXT_COL}">${Math.round(r.dimensions.areaFt2)}</text>`;
  }).join('\n    ');

  const totalRowY = ty + hdrH + rooms.length * ROW_H + 2;

  return `<g id="area-schedule" font-family="'Courier New', Courier, monospace">
    <rect x="${fmt(x)}" y="${fmt(ty)}" width="${tblW}" height="${tblH}" fill="white" stroke="${WALL_COL}" stroke-width="0.75"/>
    <rect x="${fmt(x)}" y="${fmt(ty)}" width="${tblW}" height="${hdrH}" fill="${WALL_COL}"/>
    <text x="${fmt(x + 4)}" y="${fmt(ty + 12)}" font-size="8" font-weight="700" fill="white" letter-spacing="0.5">ROOM SCHEDULE</text>
    <text x="${fmt(divX + 33)}" y="${fmt(ty + 12)}" text-anchor="end" font-size="7" font-weight="700" fill="white">SF</text>
    <line x1="${fmt(divX)}" y1="${fmt(ty)}" x2="${fmt(divX)}" y2="${fmt(ty + tblH)}" stroke="${WALL_COL}" stroke-width="0.5"/>
    ${rows}
    <line x1="${fmt(x)}" y1="${fmt(totalRowY - 1)}" x2="${fmt(x + tblW)}" y2="${fmt(totalRowY - 1)}" stroke="${WALL_COL}" stroke-width="0.75"/>
    <text x="${fmt(x + 3)}" y="${fmt(totalRowY + ROW_H - 3)}" font-size="7" font-weight="700" fill="${TEXT_COL}">TOTAL</text>
    <text x="${fmt(divX + 33)}" y="${fmt(totalRowY + ROW_H - 3)}" text-anchor="end" font-size="7" font-weight="700" fill="${TEXT_COL}">${Math.round(total)}</text>
  </g>`;
}

// ── Outer building boundary polygon ───────────────────────────────────────────
//
// After compactifyLayout, rooms are packed into zone rows with no gaps.
// We group rooms by their y-start to find row extents, then trace a staircase
// polygon around the full building footprint.

interface RowSpan {
  y: number;   // row top (ft)
  x1: number;  // row left edge (ft)
  x2: number;  // row right edge (ft)
  y2: number;  // row bottom (ft)
}

function computeRowSpans(rooms: RoomNode[]): RowSpan[] {
  const rowMap = new Map<number, RoomNode[]>();
  for (const r of rooms) {
    // Round to nearest foot to bucket rooms into rows despite floating-point drift
    const rowY = Math.round(r.y! * 2) / 2;
    if (!rowMap.has(rowY)) rowMap.set(rowY, []);
    rowMap.get(rowY)!.push(r);
  }
  return [...rowMap.entries()]
    .sort((a, b) => a[0] - b[0])
    .map(([rowY, rms]) => ({
      y:  rowY,
      x1: Math.min(...rms.map(r => r.x!)),
      x2: Math.max(...rms.map(r => r.x! + r.dimensions.widthFt)),
      y2: rowY + Math.max(...rms.map(r => r.dimensions.depthFt)),
    }));
}

function buildOuterBoundaryPolygon(
  rooms: RoomNode[], s: number, MX: number, MY: number,
): string {
  const rows = computeRowSpans(rooms);
  if (rows.length === 0) return '';

  // Trace polygon clockwise:
  //  top-left → top-right → descend right (with steps) → bottom-left → ascend left (with steps)
  const pts: [number, number][] = [];

  pts.push([rows[0].x1, rows[0].y]);       // top-left
  pts.push([rows[0].x2, rows[0].y]);       // top-right

  // Right side descending
  for (let i = 0; i < rows.length; i++) {
    pts.push([rows[i].x2, rows[i].y2]);    // bottom-right of row i
    if (i + 1 < rows.length && rows[i + 1].x2 !== rows[i].x2) {
      pts.push([rows[i + 1].x2, rows[i].y2]); // horizontal step to next row's right edge
    }
  }

  // Bottom edge of last row (already at y2 of last row)
  pts.push([rows[rows.length - 1].x1, rows[rows.length - 1].y2]);

  // Left side ascending
  for (let i = rows.length - 1; i >= 0; i--) {
    pts.push([rows[i].x1, rows[i].y]);    // top-left of row i
    if (i - 1 >= 0 && rows[i - 1].x1 !== rows[i].x1) {
      pts.push([rows[i - 1].x1, rows[i].y]); // horizontal step to prev row's left edge
    }
  }

  // Convert feet → SVG px and build polygon attribute
  const svgPts = pts
    .map(([x, y]) => `${fmt(MX + x * s)},${fmt(MY + y * s)}`)
    .join(' ');

  return `<polygon points="${svgPts}"
      fill="none" stroke="${WALL_COL}" stroke-width="4" stroke-linejoin="miter"
      stroke-linecap="square"/>`;
}

// ── Utility ───────────────────────────────────────────────────────────────────

/** Round to 2 decimal places to keep SVG tidy. */
function fmt(n: number): string {
  return (Math.round(n * 100) / 100).toString();
}
