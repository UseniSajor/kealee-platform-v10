/**
 * Maryland iMAP parcels.
 *
 * The failure this guards against is subtle and was live: a geocoded address
 * lands on the street centreline, the point-in-polygon test succeeds, and you
 * get the road right-of-way back as if it were the lot. It has a real parcel
 * record, so nothing looks wrong — the first live run returned 8,579 vertices
 * of street.
 */

import {
  fetchMdParcelAtPoint, MD_IMAP_LAYERS, MD_IMAP_ROOT, MD_PARCEL_CAVEAT, MD_IMAP_NO_CONTOURS,
} from '../jurisdictions/md-imap'

const E = 1326382.7, N = 464763.1

const square = (cx: number, cy: number, half = 30) => [[
  [cx - half, cy - half], [cx + half, cy - half], [cx + half, cy + half], [cx - half, cy + half], [cx - half, cy - half],
]]

const rowParcel = { attributes: { ACCTID: 'ROW', ACRES: 0 }, geometry: { rings: square(E, N, 400) } }
const lot = (acct: string, cx: number, cy: number) => ({
  attributes: {
    ACCTID: acct, ADDRESS: '4102 WEBSTER ST', ACRES: 0.046, LANDAREA: 2000,
    BLOCK: '20', DR1LIBER: '14271', DR1FOLIO: '0351', ZONING: 'NAC',
    LEGAL1: 'LOT 12', JURSCODE: 'PRIN',
  },
  geometry: { rings: square(cx, cy) },
})

/** Point query then envelope query, in call order. */
function stubSequence(responses: unknown[]) {
  let i = 0
  return (async () => {
    const body = responses[Math.min(i++, responses.length - 1)]
    return { ok: true, status: 200, json: async () => body }
  }) as unknown as typeof fetch
}

describe('the right-of-way trap', () => {
  it('rejects a road parcel and finds the nearest real lot', async () => {
    const r = await fetchMdParcelAtPoint(E, N, {
      fetchImpl: stubSequence([
        { features: [rowParcel] },                                   // point hits the road
        { features: [rowParcel, lot('17171904523', E + 90, N + 90), lot('999', E + 400, N + 400)] },
      ]),
    })
    expect(r.found).toBe(true)
    expect(r.attributes?.accountId).toBe('17171904523')
    // Nearest wins, not first-returned.
    expect(r.caveat).toMatch(/landed on a road right-of-way/i)
    expect(r.caveat).toMatch(/Confirm it is the right lot/i)
  })

  it('rejects water and rail parcels the same way', async () => {
    for (const acct of ['WATER', 'RAIL', 'RR', '']) {
      const r = await fetchMdParcelAtPoint(E, N, {
        fetchImpl: stubSequence([{ features: [{ attributes: { ACCTID: acct }, geometry: { rings: square(E, N) } }] }]),
      })
      expect(r.found).toBe(false)
    }
  })

  it('says so plainly when only a road is anywhere nearby', async () => {
    const r = await fetchMdParcelAtPoint(E, N, {
      fetchImpl: stubSequence([{ features: [rowParcel] }, { features: [rowParcel] }]),
    })
    expect(r.found).toBe(false)
    expect(r.caveat).toMatch(/only parcel at this location is a road right-of-way/i)
  })

  it('uses the point result directly when it is a real lot', async () => {
    const r = await fetchMdParcelAtPoint(E, N, {
      fetchImpl: stubSequence([{ features: [lot('123', E, N)] }]),
    })
    expect(r.found).toBe(true)
    // No right-of-way detour, so no "nearest buildable" caveat.
    expect(r.caveat).not.toMatch(/landed on a road/i)
  })
})

describe('what comes back', () => {
  it('maps the attributes a title block needs', async () => {
    const r = await fetchMdParcelAtPoint(E, N, {
      fetchImpl: stubSequence([{ features: [lot('17171904523', E, N)] }]),
    })
    const a = r.attributes!
    expect(a.accountId).toBe('17171904523')
    expect(a.block).toBe('20')
    expect(a.liber).toBe('14271')
    expect(a.folio).toBe('0351')
    expect(a.landAreaSqFt).toBe(2000)
    expect(a.legalDescription).toBe('LOT 12')
  })

  it('is Level 1 with no vertical datum, and says it is not a survey', async () => {
    const r = await fetchMdParcelAtPoint(E, N, {
      fetchImpl: stubSequence([{ features: [lot('1', E, N)] }]),
    })
    expect(r.source.reliabilityLevel).toBe(1)
    expect(r.source.accuracyClass).toBe('mapping_grade')
    expect(r.source.verticalDatum).toBeNull()
    expect(MD_PARCEL_CAVEAT).toMatch(/not a boundary survey/i)
    expect(MD_PARCEL_CAVEAT).toMatch(/4\.3 ft/)
  })

  it('flags ambiguity when several lots are candidates', async () => {
    const r = await fetchMdParcelAtPoint(E, N, {
      fetchImpl: stubSequence([
        { features: [rowParcel] },
        { features: [lot('a', E + 50, N), lot('b', E + 60, N)] },
      ]),
    })
    expect(r.candidateCount).toBe(2)
    expect(r.caveat).toMatch(/candidate parcels are nearby/i)
  })
})

describe('failures and gaps', () => {
  it('reports an HTTP failure rather than "no parcel"', async () => {
    const r = await fetchMdParcelAtPoint(E, N, {
      fetchImpl: (async () => ({ ok: false, status: 503, json: async () => ({}) })) as unknown as typeof fetch,
    })
    expect(r.found).toBe(false)
    expect(r.error).toBe('HTTP 503')
  })

  it('catches an ArcGIS error carried in a 200 body', async () => {
    const r = await fetchMdParcelAtPoint(E, N, {
      fetchImpl: stubSequence([{ error: { message: 'Invalid spatial reference' } }]),
    })
    expect(r.error).toBe('Invalid spatial reference')
  })

  it('points at the live host, not the one in maintenance', () => {
    // geodata.md.gov returns a maintenance page; pointing there fails in a way
    // that reads as "no parcel found" rather than "the server is down".
    expect(MD_IMAP_ROOT).toContain('mdgeodata.md.gov')
    expect(MD_IMAP_LAYERS.parcelBoundaries.service).toBe('PlanningCadastre/MD_ParcelBoundaries')
  })

  it('records that MD iMAP has no vector contours', () => {
    expect(MD_IMAP_NO_CONTOURS.detail).toMatch(/not vector contours and not a DEM/i)
    expect(MD_IMAP_NO_CONTOURS.detail).toMatch(/PDAL/)
  })
})
