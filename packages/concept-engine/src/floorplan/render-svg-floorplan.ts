/**
 * Render an SVG concept floor plan from a FloorPlanLayout.
 * Outputs an XML string. Not for construction — concept-level only.
 */

import type { FloorPlanLayout, RoomNode, RoomType } from './types';

const ROOM_FILL: Record<RoomType | 'default', string> = {
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

const STROKE   = '#546E7A';
const TEXT_COL = '#37474F';
const ISSUE_COL= '#EF5350';

export function renderSvgFloorplan(layout: FloorPlanLayout): string {
  const { scale, totalWidthFt, totalDepthFt } = layout;
  const W  = totalWidthFt * scale;
  const H  = totalDepthFt * scale;
  const BH = 60; // bottom bar height for scale + label

  const roomSvg = layout.rooms
    .filter(r => r.placed && r.x !== undefined && r.y !== undefined)
    .map(r => renderRoom(r, scale))
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
    ${renderScaleBar(scale)}
  </g>

  <!-- Footer label -->
  <text x="${W / 2}" y="${H + BH - 10}"
        text-anchor="middle" font-size="9" fill="${TEXT_COL}" opacity="0.55"
        font-style="italic">
    Concept floor plan — approximate dimensions — not for construction
  </text>
</svg>`;
}

function renderRoom(room: RoomNode, scale: number): string {
  const x = (room.x ?? 0) * scale;
  const y = (room.y ?? 0) * scale;
  const w = room.dimensions.widthFt * scale;
  const h = room.dimensions.depthFt * scale;
  const fill = ROOM_FILL[room.type as RoomType] ?? ROOM_FILL.default;

  const cx = x + w / 2;
  const cy = y + h / 2;

  const labelSize = Math.min(12, Math.max(7, Math.floor(Math.min(w, h) / 7)));
  const dimSize   = Math.max(6, labelSize - 2);
  const showDim   = w > 56 && h > 32;
  const hasIssue  = (room.issues?.length ?? 0) > 0;

  return `    <!-- ${room.label} -->
    <g id="${room.id}">
      <rect x="${x}" y="${y}" width="${w}" height="${h}"
            fill="${fill}" stroke="${STROKE}" stroke-width="1.5" rx="2"/>
      <text x="${cx}" y="${cy - (showDim ? dimSize / 2 + 2 : 0)}"
            text-anchor="middle" dominant-baseline="middle"
            font-size="${labelSize}" font-weight="600" fill="${TEXT_COL}">${room.label}</text>
      ${showDim
        ? `<text x="${cx}" y="${cy + labelSize / 2 + 4}"
                text-anchor="middle" dominant-baseline="middle"
                font-size="${dimSize}" fill="${TEXT_COL}" opacity="0.65"
                >${room.dimensions.widthFt}' × ${room.dimensions.depthFt}'</text>`
        : ''}
      ${hasIssue
        ? `<circle cx="${x + w - 9}" cy="${y + 9}" r="5.5"
                  fill="${ISSUE_COL}" opacity="0.85"/>
           <text x="${x + w - 9}" y="${y + 9}"
                 text-anchor="middle" dominant-baseline="middle"
                 font-size="7" fill="white" font-weight="bold">!</text>`
        : ''}
    </g>`;
}

function renderScaleBar(scale: number): string {
  const barFt = 10;
  const barPx = barFt * scale;
  return `<line x1="0" y1="8" x2="${barPx}" y2="8"
        stroke="${STROKE}" stroke-width="2"/>
    <line x1="0" y1="4" x2="0" y2="12" stroke="${STROKE}" stroke-width="1.5"/>
    <line x1="${barPx}" y1="4" x2="${barPx}" y2="12" stroke="${STROKE}" stroke-width="1.5"/>
    <text x="${barPx / 2}" y="22"
          text-anchor="middle" font-size="9" fill="${TEXT_COL}">${barFt} ft</text>`;
}
