/**
 * Existing contours from USGS 3DEP lidar, where a jurisdiction publishes none.
 *
 * Fairfax publishes its contours only as vector TILES — drawable, not
 * queryable — and one of its two sets is labelled NGVD29. Arlington publishes
 * none this engine could query. Both are covered by 3DEP's 1-metre lidar DEM,
 * served by USGS as an ImageServer, and the DEM is what a contour set is made
 * from in the first place.
 *
 * WHAT IS READ, NOT ASSUMED
 *
 *   · The DEM tile is exported in EPSG:2248 directly (the server reprojects).
 *   · The lidar PROJECT, its ACQUISITION DATE, its RESOLUTION and its VERTICAL
 *     DATUM are read from the source raster's own attributes (getSamples) and
 *     carried into the caveats. A tile whose datum is not NAVD88 is refused —
 *     a silent datum error puts every proposed grade out by about a foot.
 *   · Elevations are metres; they are converted to US survey feet
 *     (1 m = 3937/1200 ft), the unit of every other elevation on the sheet.
 *
 * Contouring is the engine's own marching squares (`extractContours`), over a
 * grid sampled from the DEM by bilinear interpolation.
 *
 * These are Level 1 — lidar-derived, not field-run — and say so, exactly as
 * PG's county lidar contours do.
 */

import { fromArrayBuffer } from 'geotiff'
import { extractContours } from '../site-plan/proposed-grade'
import type { Position } from '../site-plan/site-twin'
import type { JurisdictionContourResult, JurisdictionContour } from './arcgis-jurisdiction'

export const USGS_3DEP_IMAGESERVER =
  'https://elevation.nationalmap.gov/arcgis/rest/services/3DEPElevation/ImageServer'

const M_TO_USFT = 3937 / 1200

export interface DemSourceInfo {
  project: string | null
  acquired: string | null
  resolutionM: number | null
  verticalDatum: string | null
}

async function getJson(url: string, doFetch: typeof fetch, tries = 3): Promise<any> {
  let last: unknown
  for (let i = 0; i < tries; i++) {
    try {
      const res = await doFetch(url, { headers: { accept: 'application/json' } })
      // The national service answers 504 under load; a retry usually succeeds.
      if (res.status === 502 || res.status === 503 || res.status === 504) { last = new Error(`HTTP ${res.status}`); continue }
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const body: any = await res.json()
      if (body?.error) throw new Error(`service error ${body.error.code}: ${body.error.message}`)
      return body
    } catch (e) { last = e }
  }
  throw last instanceof Error ? last : new Error(String(last))
}

/** The source raster under a point: project, date, resolution, datum. */
export async function demSourceAt(
  e: number, n: number, opts: { fetchImpl?: typeof fetch } = {},
): Promise<DemSourceInfo | null> {
  const doFetch = opts.fetchImpl ?? fetch
  const geometry = JSON.stringify({ x: e, y: n, spatialReference: { wkid: 2248 } })
  const p = new URLSearchParams({
    geometry, geometryType: 'esriGeometryPoint', returnFirstValueOnly: 'false', outFields: '*', f: 'json',
  })
  const body = await getJson(`${USGS_3DEP_IMAGESERVER}/getSamples?${p}`, doFetch).catch(() => null)
  const s = body?.samples?.[0]
  if (!s) return null
  const a = s.attributes ?? {}
  return {
    project: a.Name != null ? String(a.Name) : null,
    acquired: Number.isFinite(Number(a.AcquisitionDate)) && a.AcquisitionDate
      ? new Date(Number(a.AcquisitionDate)).toISOString().slice(0, 10) : null,
    resolutionM: Number.isFinite(Number(s.resolution)) ? Number(s.resolution) : null,
    verticalDatum: a.VerticalDatum != null ? String(a.VerticalDatum) : null,
  }
}

/**
 * 2-ft contours around a point from the 3DEP DEM. Null when the service does
 * not answer or the source datum is not NAVD88 — never a fabricated surface.
 */
export async function fetch3depContours(
  e: number, n: number,
  opts: { radiusFt?: number; intervalFt?: number; fetchImpl?: typeof fetch; authorityNote?: string } = {},
): Promise<JurisdictionContourResult | null> {
  const doFetch = opts.fetchImpl ?? fetch
  const r = opts.radiusFt ?? 150
  const interval = opts.intervalFt ?? 2
  const px = Math.min(400, Math.max(60, Math.round((2 * r) / 3.28))) // ~1 m pixels

  const source = await demSourceAt(e, n, opts)
  if (!source || !/NAVD ?88|North American Vertical Datum of 1988/i.test(source.verticalDatum ?? '')) return null

  const bbox = [e - r, n - r, e + r, n + r]
  const p = new URLSearchParams({
    bbox: bbox.join(','), bboxSR: '2248', imageSR: '2248', size: `${px},${px}`,
    format: 'tiff', pixelType: 'F32', noDataInterpretation: 'esriNoDataMatchAny',
    interpolation: 'RSP_BilinearInterpolation', f: 'json',
  })
  const meta = await getJson(`${USGS_3DEP_IMAGESERVER}/exportImage?${p}`, doFetch).catch(() => null)
  if (!meta?.href) return null
  const tifRes = await doFetch(meta.href).catch(() => null)
  if (!tifRes?.ok) return null
  const tiff = await fromArrayBuffer(await tifRes.arrayBuffer())
  const image = await tiff.getImage()
  const w = image.getWidth(), h = image.getHeight()
  const raster = (await image.readRasters({ interleave: true })) as unknown as Float32Array
  const ext = meta.extent ?? { xmin: bbox[0], ymin: bbox[1], xmax: bbox[2], ymax: bbox[3] }
  const cw = (ext.xmax - ext.xmin) / w, ch = (ext.ymax - ext.ymin) / h
  const nodata = Number(image.getGDALNoData() ?? NaN)

  const at = (col: number, row: number): number | null => {
    if (col < 0 || row < 0 || col >= w || row >= h) return null
    const v = raster[row * w + col]
    return !Number.isFinite(v) || v === nodata || v < -1000 ? null : v * M_TO_USFT
  }
  // Pixel centres; row 0 is the north edge.
  const elevationAt = (pt: Position): number | null => {
    const fx = (pt[0] - ext.xmin) / cw - 0.5
    const fy = (ext.ymax - pt[1]) / ch - 0.5
    const c0 = Math.floor(fx), r0 = Math.floor(fy)
    const tx = fx - c0, ty = fy - r0
    const z00 = at(c0, r0), z10 = at(c0 + 1, r0), z01 = at(c0, r0 + 1), z11 = at(c0 + 1, r0 + 1)
    if (z00 == null || z10 == null || z01 == null || z11 == null) return null
    return z00 * (1 - tx) * (1 - ty) + z10 * tx * (1 - ty) + z01 * (1 - tx) * ty + z11 * tx * ty
  }

  const inset = Math.max(cw, ch)
  const clip: Position[] = [
    [ext.xmin + inset, ext.ymin + inset], [ext.xmax - inset, ext.ymin + inset],
    [ext.xmax - inset, ext.ymax - inset], [ext.xmin + inset, ext.ymax - inset],
  ]
  const lines = extractContours(elevationAt, clip, { intervalFt: interval, cellFt: 3 })
  const contours: JurisdictionContour[] = lines.map(l => {
    const index = Math.abs(l.elevationFt / (interval * 5) - Math.round(l.elevationFt / (interval * 5))) < 1e-6
    return {
      elevationFt: l.elevationFt, featureCode: 0,
      label: index ? 'Index contour' : 'Intermediate contour',
      weight: index ? 'index' : 'intermediate',
      depression: false, hidden: false,
      path: l.path.map(q => [q[0], q[1]] as [number, number]),
    }
  })

  const project = [source.project, source.acquired ? `acquired ${source.acquired}` : null, source.resolutionM ? `${source.resolutionM} m DEM` : null]
    .filter(Boolean).join(', ')
  return {
    contours,
    elevationsFt: [...new Set(contours.map(c => c.elevationFt))].sort((a, b) => a - b),
    intervalFt: interval,
    verticalDatum: 'NAVD88 (feet)',
    truncated: false,
    caveats: [
      `Contours generated from the USGS 3DEP lidar DEM (${project}); vertical datum ` +
      `${source.verticalDatum}, converted from metres to US survey feet.` +
      (opts.authorityNote ? ` ${opts.authorityNote}` : ''),
      'Lidar-derived contours establish existing grade for design and review. They are not a ' +
      'field-run topographic survey; spot and finished-floor elevations still require one.',
    ],
    source: {
      authority: 'U.S. Geological Survey — 3D Elevation Program',
      endpoint: USGS_3DEP_IMAGESERVER,
      retrievedAt: new Date().toISOString(),
      layer: `3DEP bare-earth DEM${source.project ? ` — ${source.project}` : ''}`,
    },
  }
}
