import { describe, it, expect } from 'vitest'
import {
  MARYLAND_DISTRICTS, marylandDistrict, marylandSfdTables, marylandDistrictSummary,
} from '../jurisdictions/maryland-county-zoning'

/** Every zone code each county's own zoning layer returned on 2026-09-26. */
const ON_THE_MAP: Record<string, string[]> = {
  anne_arundel_md: ['C1', 'C2', 'C3', 'C4', 'CITY', 'MA1', 'MA1-B', 'MA2', 'MA3', 'MB', 'MC', 'MXD-G', 'MXD-N', 'MXD-S', 'MXD-U', 'OS',
    'OTC-C', 'OTC-E', 'OTC-FM', 'OTC-H', 'OTC-I', 'OTC-T', 'R1', 'R10', 'R15', 'R2', 'R22', 'R5', 'RA', 'RLD', 'SB', 'TC', 'W1', 'W2', 'W3'],
  frederick_md: ['A', 'GC', 'GI', 'Ie', 'LI', 'MM', 'MUN', 'MX', 'MXD', 'ORI', 'OSR', 'PUD', 'R1', 'R12', 'R16', 'R3', 'R5', 'R8', 'RC', 'VC', 'W'],
  calvert_md: ['EC', 'FFD', 'I-1', 'I-2', 'MC', 'RC', 'RCD', 'RD', 'RND', 'TC', 'WCD'],
  st_marys_md: ['CM', 'CMX', 'I', 'LCI', 'MXH', 'MXL', 'MXM', 'OBP', 'RCL', 'RH', 'RL', 'RL-T', 'RM', 'RMX', 'RNC', 'RPD', 'RSC', 'TMX', 'VMX'],
  charles_md: ['AUC', 'AC', 'ABP', 'BP', 'CB', 'CC', 'CER', 'CMR', 'CRR', 'IH', 'RH', 'HVC', 'HVE', 'HVG', 'HVR', 'IG', 'RL', 'RM', 'CN',
    'PEP', 'PMH', 'MX', 'PRD', 'PUD', 'RO', 'RC', 'RR', 'INDIAN HEAD', 'LA PLATA', 'TOD', 'CV', 'RV', 'WC', 'WPC', 'WCD'],
  howard_md: ['B -1-MXD-3', 'B -2-MXD-3', 'B-1', 'B-1-CR', 'B-1-TNC', 'B-2', 'B-2-TNC', 'BR', 'CAC-CLI', 'CAC-CLI-CR', 'CCT', 'CE-CLI', 'CE-CLI-CR',
    'CEF-M', 'CEF-R', 'HC', 'HO', 'M-1', 'M-1-MXD-3', 'M-2', 'NT', 'OT', 'PEC', 'PEC-MXD-3', 'PGCC-1', 'PGCC-2', 'POR', 'POR-MXD-6', 'PSC',
    'R-12', 'R-12-CR', 'R-20', 'R-20-MXD-3', 'R-A-15', 'R-A-15-TNC', 'R-APT', 'R-ED', 'R-ED-MXD-3', 'R-H-ED', 'R-MH', 'R-MH-CR', 'R-SA-8',
    'R-SA-8-I', 'R-SA-8-MXD-3', 'R-SC', 'R-SC-I', 'R-SC-MXD-3', 'R-VH', 'RC-DEO', 'RR', 'RR-DEO', 'RR-MXD-3', 'RSI', 'SC', 'SW', 'TOD'],
}

describe('every district on each county map has a record', () => {
  for (const [code, zones] of Object.entries(ON_THE_MAP)) {
    it(code, () => {
      const missing = zones.filter(z => !marylandDistrict(code, z))
      expect(missing, `no record for ${missing.join(', ')}`).toEqual([])
    })
  }
})

describe('values read against the source text', () => {
  const s = (code: string, zone: string) => marylandDistrict(code, zone)!.sfd!
  it('Anne Arundel R2 is the codified 15,000 SF / 30% / 35 ft — not the guide page', () => {
    expect(s('anne_arundel_md', 'R2')).toMatchObject({ lotAreaSqFt: 15000, lotWidthFt: 80, frontFt: 30, sideFt: 7, rearFt: 25, coveragePct: 30, heightFt: 35 })
    expect(s('anne_arundel_md', 'R1')).toMatchObject({ lotWidthFt: 125, sideSumFt: 40, heightFt: 45 })
    // A detached house in R10 / R15 takes R5's bulk (§18-4-801(b)).
    expect(s('anne_arundel_md', 'R10')).toMatchObject({ frontFt: 25, sideFt: 7, rearFt: 20 })
  })
  it('Frederick single-family rows', () => {
    expect(s('frederick_md', 'R3')).toMatchObject({ lotAreaSqFt: 12000, lotWidthFt: 80, frontFt: 30, sideFt: 10, rearFt: 30, heightFt: 30 })
    expect(s('frederick_md', 'R16')).toMatchObject({ lotWidthFt: 60, frontFt: 25, sideFt: 8 })
  })
  it('Charles, Supp. 15 (2025): the four the earlier table had, and the rest', () => {
    expect(s('charles_md', 'RM')).toMatchObject({ lotAreaSqFt: 12000, frontFt: 25, sideFt: 8, sideSumFt: 20, rearFt: 25, coveragePct: 35, heightFt: 36 })
    expect(s('charles_md', 'RL')).toMatchObject({ lotAreaSqFt: 18000, frontFt: 30, sideFt: 15, sideSumFt: 35, rearFt: 30 })
    expect(s('charles_md', 'CRR')).toMatchObject({ lotAreaSqFt: 5000, frontFt: 10, heightFt: 40 })
  })
  it('Howard height follows the district', () => {
    expect(s('howard_md', 'R-A-15').heightFt).toBe(55)
    expect(s('howard_md', 'R-APT').heightFt).toBe(65)
    expect(s('howard_md', 'R-20').frontFt).toBe(50)
  })
  it('Calvert draws the restrictive "all other roads" front and the 40 ft cap', () => {
    expect(s('calvert_md', 'RD')).toMatchObject({ lotAreaSqFt: 10000, frontFt: 60, sideFt: 10, rearFt: 35, heightFt: 40 })
  })
  it('St. Mary\'s is flagged as the 2012 schedule', () => {
    const rl = marylandDistrict('st_marys_md', 'RL')!
    expect(rl.status).toBe('dated')
    expect(rl.sfd!.notes.join(' ')).toMatch(/2012 schedule/)
  })
})

describe('nothing is drawn that the source does not fix', () => {
  it('draws no envelope for plan-governed, unread or municipal districts', () => {
    for (const list of Object.values(MARYLAND_DISTRICTS)) {
      for (const x of list) {
        if (x.status === 'plan_governed' || x.status === 'not_read' || x.status === 'municipal') {
          expect(x.sfd, `${x.code} ${x.zone}`).toBeNull()
        }
      }
    }
  })
  it('reads Howard\'s base district through its overlays, and treats an MXD suffix as the plan', () => {
    expect(marylandDistrict('howard_md', 'R-12-CR')).toMatchObject({ zone: 'R-12', overlays: ['CR'] })
    expect(marylandDistrict('howard_md', 'CAC-CLI-CR')).toMatchObject({ zone: 'CAC', overlays: ['CLI', 'CR'] })
    expect(marylandDistrict('howard_md', 'R-20-MXD-3')).toMatchObject({ zone: 'MXD', status: 'plan_governed' })
  })
  it('keys the drawable tables by the spellings the map uses', () => {
    const t = marylandSfdTables()
    expect(t.howard_md['RC-DEO']?.frontFt).toBe(50)
    expect(t.charles_md['RH']?.lotAreaSqFt).toBe(8000)
    expect(t.charles_md['PUD']).toBeUndefined()
  })
  it('summarises a non-residential district for the reviewer', () => {
    expect(marylandDistrictSummary('anne_arundel_md', 'C3')).toMatch(/FAR: 2\.0/)
    expect(marylandDistrictSummary('st_marys_md', 'MXL')).toMatch(/prepared by staff/)
  })
})
