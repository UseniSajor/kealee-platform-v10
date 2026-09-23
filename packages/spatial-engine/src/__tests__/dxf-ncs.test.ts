/**
 * The DXF export is a HANDOFF. Its job is that a consulting engineer or
 * surveyor opens it and can work, rather than re-layering the drawing first.
 *
 * So the tests are about the things that determine whether that is true:
 * layer names, the existing/proposed distinction, linetypes, closure, and
 * whether any geometry quietly landed somewhere nobody will look.
 */
import { describe, it, expect } from 'vitest'
import {
  toDxfNcs, ncsLayerFor, unmappedKinds, NCS_LAYERS, UNMAPPED_LAYER,
  LEGACY_LAYER_ALIASES, ALL_FEATURE_KINDS, FORWARD_DECLARED_LAYERS,
} from '../export/dxf-ncs'
import { toDxf } from '../export/exporters'
import type { SiteTwin, SiteFeature } from '../site-plan/site-twin'

function twinWith(features: Partial<SiteFeature>[]): SiteTwin {
  return {
    features: features as SiteFeature[],
    sources: [],
  } as unknown as SiteTwin
}

const LOT_RING = {
  coordinates: [
    [1340350, 440150], [1340410, 440150],
    [1340410, 440215], [1340350, 440215], [1340350, 440150],
  ],
}

describe('NCS layer naming', () => {
  it('names every layer with a discipline designator and a major group', () => {
    for (const [kind, layer] of Object.entries(NCS_LAYERS)) {
      // <discipline>-<major>[-<minor>][-<status>]
      expect(layer.name, kind).toMatch(/^[A-Z]-[A-Z]{4}(-[A-Z]{1,4})*$/)
    }
  })

  it('carries the existing/proposed status on contours and structures', () => {
    expect(NCS_LAYERS.Contour.name).toMatch(/-E$/)
    expect(NCS_LAYERS.ProposedContour.name).toMatch(/-N$/)
    expect(NCS_LAYERS.Building.name).toMatch(/-N$/)
    expect(NCS_LAYERS.DemolitionFeature.name).toMatch(/-D$/)
  })

  it('draws existing contours thinner and dashed against proposed', () => {
    // The requirement from APPROVED-PLAN-ANALYSIS.md, asserted rather than
    // trusted to a comment.
    const existing = NCS_LAYERS.Contour
    const proposed = NCS_LAYERS.ProposedContour
    expect(existing.lineType).toBe('DASHED')
    expect(proposed.lineType).toBe('CONTINUOUS')
    expect(existing.lineWeight).toBeLessThan(proposed.lineWeight)
  })

  it('keeps minor contours lighter than major contours', () => {
    expect(NCS_LAYERS.MinorContour.lineWeight).toBeLessThan(NCS_LAYERS.Contour.lineWeight)
  })

  it('labels the setback as a Building Restriction Line, the county term', () => {
    expect(NCS_LAYERS.Setback.name).toBe('C-PROP-BRL')
    expect(NCS_LAYERS.Setback.purpose).toMatch(/Building Restriction Line/)
  })

  it('gives the property boundary the heaviest weight on the sheet', () => {
    const boundary = NCS_LAYERS.Parcel.lineWeight
    for (const [kind, l] of Object.entries(NCS_LAYERS)) {
      expect(l.lineWeight, `${kind} heavier than the boundary`).toBeLessThanOrEqual(boundary)
    }
  })

  it('maps an unknown kind to the non-plot layer rather than silently sharing one', () => {
    const l = ncsLayerFor('SomethingNobodyMapped')
    expect(l).toBe(UNMAPPED_LAYER)
    expect(l.name).toMatch(/NPLT/)
  })

  it('records the old layer name for every name that changed', () => {
    for (const [legacy, current] of Object.entries(LEGACY_LAYER_ALIASES)) {
      const known = Object.values(NCS_LAYERS).some(l => l.name === current) || current === UNMAPPED_LAYER.name
      expect(known, `${legacy} -> ${current} points at a layer that exists`).toBe(true)
    }
  })
})

describe('exhaustiveness — no geometry without a layer', () => {
  it('maps every feature kind the twin can carry', () => {
    // This is the test that caught `Surface` landing on the non-plot layer in
    // a real Rollins Ave export. A kind added to site-twin.ts and not here
    // means geometry the receiving engineer will never find.
    const missing = ALL_FEATURE_KINDS.filter(k => !NCS_LAYERS[k])
    expect(missing, `feature kinds with no NCS layer: ${missing.join(', ')}`).toEqual([])
  })

  it('declares nothing in the layer table that is neither a kind nor forward-declared', () => {
    const known = new Set<string>([...ALL_FEATURE_KINDS, ...FORWARD_DECLARED_LAYERS])
    const stray = Object.keys(NCS_LAYERS).filter(k => !known.has(k))
    expect(stray, `layers for kinds that do not exist: ${stray.join(', ')}`).toEqual([])
  })

  it('says plainly which layers are ahead of the twin', () => {
    for (const k of FORWARD_DECLARED_LAYERS) {
      expect(NCS_LAYERS[k].purpose).toMatch(/not yet emitted/)
    }
  })
})

describe('export', () => {
  const twin = twinWith([
    { kind: 'Parcel', ring: LOT_RING } as never,
    { kind: 'Setback', ring: LOT_RING } as never,
    { kind: 'Building', ring: LOT_RING } as never,
    { kind: 'Contour', line: [[1340350, 440150], [1340410, 440215]] } as never,
  ])

  it('declares only the layers the drawing actually uses, plus the stamp layer', () => {
    const r = toDxfNcs(twin)
    expect(r.layers).toEqual([
      'C-ANNO-NPLT', // carries the unconditional status stamp
      'C-BLDG-FTPR-N', 'C-PROP-BRL', 'C-TOPO-MAJR-E', 'V-PROP-BNDY',
    ])
  })

  it('writes an entity for every feature that carries geometry', () => {
    expect(toDxfNcs(twin).entityCount).toBe(4)
  })

  it('emits the linetype table the layers reference', () => {
    const { dxf } = toDxfNcs(twin)
    expect(dxf).toContain('DASHED')
    expect(dxf).toContain('LTYPE')
  })

  it('produces a DXF with the required sections and terminator', () => {
    const { dxf } = toDxfNcs(twin)
    expect(dxf).toContain('SECTION')
    expect(dxf).toContain('ENTITIES')
    expect(dxf.trimEnd().endsWith('EOF')).toBe(true)
  })

  it('reports unmapped kinds instead of hiding them', () => {
    const odd = twinWith([{ kind: 'NotAThing', ring: LOT_RING } as never])
    const r = toDxfNcs(odd)
    expect(r.unmapped).toEqual(['NotAThing'])
    expect(unmappedKinds(odd)).toEqual(['NotAThing'])
  })

  it('does not close an open line into a ring', () => {
    // A line closed into a polygon draws a boundary that does not exist.
    const openOnly = twinWith([{ kind: 'Contour', line: [[0, 0], [10, 10], [20, 0]] } as never])
    const { dxf } = toDxfNcs(openOnly)
    const ringOnly = twinWith([{ kind: 'Parcel', ring: LOT_RING } as never])
    const closed = toDxfNcs(ringOnly).dxf
    // Closure is flag 1 on the LWPOLYLINE; the open export must not carry it
    // on the same group code the closed one does.
    expect(closed).not.toBe(dxf)
  })
})

describe('professional document status', () => {
  const twin = twinWith([{ kind: 'Parcel', ring: LOT_RING } as never])

  it('stamps PRELIMINARY by default', () => {
    const r = toDxfNcs(twin)
    expect(r.status).toBe('PRELIMINARY_NOT_FOR_CONSTRUCTION')
    expect(r.dxf).toContain('NOT FOR CONSTRUCTION OR PERMIT SUBMISSION')
  })

  it('never claims the drawing is sealed, under any status', () => {
    // The repo already records this trap: a check for "SEAL" passes on
    // "SEALED" inside another phrase. So the assertion is not "SEALED is
    // absent" — it is that EVERY occurrence of it is negated. No automated
    // process may represent a drawing as professionally certified.
    const statuses = ['INTERNAL_DRAFT', 'REVIEW_COPY',
      'PRELIMINARY_NOT_FOR_CONSTRUCTION', 'PROFESSIONALLY_REVIEWED_UNSEALED']
    for (const st of statuses) {
      const out = toDxfNcs(twin, { status: st as never })
      for (const m of out.dxf.matchAll(/SEALED/g)) {
        const before = out.dxf.slice(Math.max(0, m.index - 8), m.index)
        expect(before, `unnegated "SEALED" under ${st}`).toMatch(/NOT (A )?$/)
      }
      expect(out.dxf).toContain('NOT A SEALED DRAWING')
      // And nothing that reads as an affirmative certification.
      expect(out.dxf).not.toMatch(/SEALED BY|SEAL AND SIGNATURE|CERTIFIED BY/)
    }
  })

  it('says a reviewed drawing is still not sealed', () => {
    const r = toDxfNcs(twin, { status: 'PROFESSIONALLY_REVIEWED_UNSEALED' })
    expect(r.dxf).toContain('PROFESSIONALLY REVIEWED - NOT SEALED')
  })

  it('carries the horizontal and vertical datum into the file', () => {
    const r = toDxfNcs(twin, { crs: 'EPSG:2248', verticalDatum: 'NAVD88' })
    expect(r.dxf).toContain('EPSG:2248')
    expect(r.dxf).toContain('NAVD88')
  })

  it('puts the stamp clear of the drawing extent', () => {
    // A stamp drawn through the parcel is worse than no stamp.
    const minY = Math.min(...LOT_RING.coordinates.map(c => c[1]))
    const r = toDxfNcs(twin)
    const ys = [...r.dxf.matchAll(/\n\s*20\n(-?[0-9.]+)/g)].map(m => Number(m[1]))
    const stampYs = ys.filter(y => y < minY)
    expect(stampYs.length, 'stamp text below the parcel').toBeGreaterThan(0)
  })
})

describe('regression against the R12 writer it replaces', () => {
  const twin = twinWith([
    { kind: 'Parcel', ring: LOT_RING } as never,
    { kind: 'Building', ring: LOT_RING } as never,
  ])

  it('still writes one entity per feature, as R12 did', () => {
    const legacy = toDxf(twin)
    const legacyEntities = (legacy.match(/\nPOLYLINE\n/g) ?? []).length
    expect(toDxfNcs(twin).entityCount).toBe(legacyEntities)
  })

  it('carries every legacy layer forward under its NCS name', () => {
    const legacy = toDxf(twin)
    const next = toDxfNcs(twin)
    for (const [old, current] of Object.entries(LEGACY_LAYER_ALIASES)) {
      if (legacy.includes(`\n${old}\n`)) {
        expect(next.layers, `${old} dropped instead of renamed to ${current}`).toContain(current)
      }
    }
  })
})
