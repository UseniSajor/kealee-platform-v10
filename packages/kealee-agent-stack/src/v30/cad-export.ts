/**
 * Concept-level CAD interchange (not permit-stamped).
 * DXF R12 POLYLINE export for walls/site edges — opens in AutoCAD, SketchUp, Vectorworks, BricsCAD.
 */

export interface V30CadWallSegment {
  id?: string
  start?: { x: number; y: number }
  end?: { x: number; y: number }
  length?: number
}

export interface V30CadExportInput {
  floorplan?: {
    id?: string
    name?: string
    viewBox?: string
    walls?: V30CadWallSegment[]
    rooms?: Array<{ id?: string; label?: string; x?: number; y?: number; width?: number; height?: number }>
    siteFeatures?: Array<{ type?: string; label?: string; polygon?: Array<{ x: number; y: number }> }>
  }
  projectPath?: string
  lotContext?: { lat?: number; lng?: number; address?: string }
}

function wallToSegments(walls: V30CadWallSegment[]): Array<{ x1: number; y1: number; x2: number; y2: number }> {
  const segs: Array<{ x1: number; y1: number; x2: number; y2: number }> = []
  for (const w of walls) {
    if (w.start && w.end) {
      segs.push({ x1: w.start.x, y1: w.start.y, x2: w.end.x, y2: w.end.y })
    }
  }
  return segs
}

/** Minimal ASCII DXF (R12) with LAYER and LINE entities. */
export function floorplanToDxf(input: V30CadExportInput): string {
  const fp = input.floorplan ?? {}
  const walls = wallToSegments(fp.walls ?? [])
  const lines: string[] = [
    '0', 'SECTION', '2', 'HEADER', '0', 'ENDSEC',
    '0', 'SECTION', '2', 'TABLES',
    '0', 'TABLE', '2', 'LAYER', '70', '1',
    '0', 'LAYER', '2', 'KEALEE_LAYOUT', '70', '0', '62', '7', '6', 'CONTINUOUS',
    '0', 'ENDTAB', '0', 'ENDSEC',
    '0', 'SECTION', '2', 'ENTITIES',
  ]

  for (const s of walls) {
    lines.push(
      '0', 'LINE', '8', 'KEALEE_LAYOUT',
      '10', String(s.x1), '20', String(s.y1), '30', '0',
      '11', String(s.x2), '21', String(s.y2), '31', '0',
    )
  }

  for (const site of fp.siteFeatures ?? []) {
    const poly = site.polygon ?? []
    for (let i = 0; i < poly.length - 1; i++) {
      const a = poly[i]
      const b = poly[i + 1]
      lines.push(
        '0', 'LINE', '8', 'KEALEE_SITE',
        '10', String(a.x), '20', String(a.y), '30', '0',
        '11', String(b.x), '21', String(b.y), '31', '0',
      )
    }
  }

  lines.push('0', 'ENDSEC', '0', 'EOF')
  return lines.join('\n')
}

/** JSON bundle for SketchUp / GIS plugins (lat/lng + geometry). */
export function floorplanToCadBundle(input: V30CadExportInput): Record<string, unknown> {
  const dxf = floorplanToDxf(input)
  return {
    formatVersion: '1.0',
    source: 'kealee_v30_floorplan',
    disclaimer:
      'Concept layout only — not survey-grade or permit-stamped. Import into professional CAD for refinement.',
    compatibleApps: ['AutoCAD', 'SketchUp', 'Vectorworks', 'BricsCAD', 'LibreCAD'],
    projectPath: input.projectPath,
    lotContext: input.lotContext,
    floorplan: input.floorplan,
    dxf,
    dxfFilename: `${(input.floorplan?.id ?? 'layout').replace(/\s+/g, '-')}.dxf`,
    geoJson: input.lotContext?.lat
      ? {
          type: 'Feature',
          geometry: { type: 'Point', coordinates: [input.lotContext.lng, input.lotContext.lat] },
          properties: { address: input.lotContext.address },
        }
      : undefined,
  }
}
