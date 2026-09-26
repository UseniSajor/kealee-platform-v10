/**
 * Regenerated drawings — from the canonical model, through the engine's
 * existing renderers, validated before anything claims an export exists.
 *
 * DWG is reported UNSUPPORTED: the engine has no DWG writer, and a DWG
 * produced by renaming a DXF is not a DWG. DXF (NCS layers) opens in AutoCAD
 * and Civil 3D; converting it is a user step with Autodesk/ODA tooling.
 */

import { buildSheetContext, renderSheetSvg } from '../sheets/render-svg'
import { renderSheetSetPdf } from '../sheets/render-pdf'
import { auditSheetFrame, applicableSheets, type SheetId } from '../sheets/sheet-template'
import { toDxfNcs } from '../export/dxf-ncs'
import { toLandXml, toGeoJson } from '../export/exporters'
import type { StudioModel } from './model'
import { IMPERVIOUS_TYPES } from './model'
import { studioToTwin } from './twin-bridge'
import { polygonArea } from './geometry'
import type { SheetAudit } from './qa'

export interface StudioRenderMeta { siteId: string; projectName: string; address: string; horizontalDatum?: string | null; disclosure?: string | null }

export interface ExportValidation { format: 'PDF' | 'SVG' | 'DXF' | 'LANDXML' | 'GEOJSON' | 'DWG'; valid: boolean; detail: string }

export interface StudioRenderResult {
  sheets: SheetId[]
  pdf: { buffer: Buffer; pageCount: number } | null
  svgs: { sheet: SheetId; svg: string }[]
  dxf: string | null
  landxml: string | null
  geojson: string | null
  audit: SheetAudit
  validation: ExportValidation[]
}

/** Which sheets the plan needs, from what the model contains. */
export function sheetsFor(m: StudioModel): SheetId[] {
  const live = m.objects.filter(o => o.status !== 'SUPERSEDED')
  const newImpervious = live.filter(o => IMPERVIOUS_TYPES.has(o.type) && o.status === 'PROPOSED').reduce((s, o) => s + polygonArea(o.geometry), 0)
  return applicableSheets({
    requiresSedimentAndStormwater: newImpervious >= 5000 || live.some(o => ['StormwaterFacility', 'BMP', 'Pipe', 'Swale'].includes(o.type) && o.status === 'PROPOSED'),
    hasDemolition: live.some(o => o.status === 'TO_BE_REMOVED'),
    hasRoadWork: live.some(o => (o.type === 'Road' || o.type === 'Curb') && o.status === 'PROPOSED'),
    hasLandscapeRequirement: live.some(o => o.type === 'Tree' && o.status === 'PROPOSED'),
    hasWoodlandOrNri: live.some(o => o.type === 'CriticalArea'),
  })
}

export async function renderStudioSet(m: StudioModel, meta: StudioRenderMeta, opts: { geojsonTransformer?: Parameters<typeof toGeoJson>[1] | null } = {}): Promise<StudioRenderResult> {
  const twin = studioToTwin(m, { siteId: meta.siteId, address: meta.address, horizontalDatum: meta.horizontalDatum })
  const sheets = sheetsFor(m)
  const validation: ExportValidation[] = []
  const contexts = sheets.map((sheet, i) => buildSheetContext({ sheet, twin, projectName: meta.projectName, sheetIndex: i + 1, sheetCount: sheets.length, status: 'PRELIMINARY', disclosure: meta.disclosure ?? null }))

  const svgs = contexts.map(c => ({ sheet: c.sheet, svg: renderSheetSvg(c).svg }))
  const svgOk = svgs.every(s => s.svg.startsWith('<svg') || s.svg.includes('<svg'))
  validation.push({ format: 'SVG', valid: svgOk, detail: `${svgs.length} sheet(s)` })

  let pdf: StudioRenderResult['pdf'] = null
  try {
    const r = await renderSheetSetPdf({ sheets: contexts, sourceNotes: twin.sources.map(s => `${s.dataset} — ${s.authority} — level ${s.reliabilityLevel}`) })
    const ok = r.buffer.subarray(0, 5).toString() === '%PDF-' && r.pageCount === sheets.length
    pdf = { buffer: r.buffer, pageCount: r.pageCount }
    validation.push({ format: 'PDF', valid: ok, detail: ok ? `${r.pageCount} page(s)` : `expected ${sheets.length} pages, got ${r.pageCount}` })
  } catch (e) { validation.push({ format: 'PDF', valid: false, detail: e instanceof Error ? e.message : String(e) }) }

  let dxf: string | null = null
  try {
    const d = toDxfNcs(twin, { crs: m.crs, verticalDatum: m.verticalDatum, provenance: `Kealee Studio revision ${m.revision}` })
    dxf = d.dxf
    const ok = /\bSECTION\b/.test(d.dxf) && /\bEOF\s*$/.test(d.dxf.trim()) && d.entityCount > 0
    validation.push({ format: 'DXF', valid: ok, detail: `${d.entityCount} entities on ${d.layers.length} layers${d.unmapped.length ? `; unmapped: ${d.unmapped.join(', ')}` : ''}` })
  } catch (e) { validation.push({ format: 'DXF', valid: false, detail: e instanceof Error ? e.message : String(e) }) }

  let landxml: string | null = null
  try {
    landxml = toLandXml(twin)
    const ok = /<LandXML[\s>]/.test(landxml) && /<\/LandXML>\s*$/.test(landxml.trim())
    validation.push({ format: 'LANDXML', valid: ok, detail: ok ? 'well-formed root' : 'malformed' })
  } catch (e) { validation.push({ format: 'LANDXML', valid: false, detail: e instanceof Error ? e.message : String(e) }) }

  let geojson: string | null = null
  if (opts.geojsonTransformer) {
    try {
      geojson = await toGeoJson(twin, opts.geojsonTransformer)
      const parsed = JSON.parse(geojson)
      validation.push({ format: 'GEOJSON', valid: parsed.type === 'FeatureCollection' && Array.isArray(parsed.features), detail: `${parsed.features?.length ?? 0} features, WGS84` })
    } catch (e) { validation.push({ format: 'GEOJSON', valid: false, detail: e instanceof Error ? e.message : String(e) }) }
  } else validation.push({ format: 'GEOJSON', valid: false, detail: 'not produced — needs a coordinate transformer (the workflow supplies the county geometry service)' })

  validation.push({ format: 'DWG', valid: false, detail: 'UNSUPPORTED — the engine writes DXF (NCS layers); DWG needs Autodesk/ODA conversion and is not produced.' })

  const audit: SheetAudit = {
    sheets: contexts.map(c => {
      const f = auditSheetFrame(c)
      const has = (e: string) => f.present.includes(e as never)
      return { id: c.sheet, title: c.sheet, hasTitleBlock: has('titleBlock'), hasNorthArrow: has('northArrow'), hasScale: has('scaleAndGraphicScale'), hasLegend: has('legendAndAbbreviations'), hasNotes: has('sourceDataNotes'), hasRevisionBlock: has('revisionTable'), scaleLabel: c.scale ?? null, references: [] }
    }),
    overprints: 0, droppedLabels: 0,
  }
  return { sheets, pdf, svgs, dxf, landxml, geojson, audit, validation }
}
