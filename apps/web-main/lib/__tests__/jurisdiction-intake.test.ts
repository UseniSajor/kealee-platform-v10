import { describe, it, expect, vi } from 'vitest'
import {
  addressKey, rememberDetermination, instantJurisdiction, attachJurisdiction,
} from '../jurisdiction-intake'

const det = (code: string) => ({
  determined: true, code, name: code, state: 'MD', countyFips: '24003', countyName: 'Anne Arundel County',
  countyCode: code, municipality: null, soilSurveyArea: 'MD003', matchedAddress: 'X', longitude: -76.5,
  latitude: 38.9, determinedBy: 'us-census-geocoder' as const, determinedAt: '2026-09-26T00:00:00Z', reason: null,
})

describe('instant intake jurisdiction', () => {
  it('reuses the determination made while the customer typed, however the address is spelled', () => {
    rememberDetermination('625 Irvin Ave, Deale, MD 20751', det('anne_arundel_md'))
    expect(instantJurisdiction('625 IRVIN AVE  DEALE MD 20751')?.code).toBe('anne_arundel_md')
    expect(addressKey('625 Irvin Ave.,  Deale')).toBe(addressKey('625 IRVIN AVE DEALE'))
  })

  it('never caches a miss — an undetermined answer is retried, not remembered', () => {
    rememberDetermination('1 Nowhere Rd', { ...det('x_md'), determined: false, code: null })
    expect(instantJurisdiction('1 Nowhere Rd')).toBeNull()
  })

  it('attaches a remembered answer to form_data with no network call, and writes the columns after save', () => {
    rememberDetermination('6419 Ryan Ave, Hanover, MD 21076', det('howard_md'))
    const fd: Record<string, unknown> = {}
    const { det: d, afterSave } = attachJurisdiction(fd, '6419 Ryan Ave, Hanover, MD 21076')
    expect(d?.code).toBe('howard_md')
    expect(fd.jurisdictionCode).toBe('howard_md')

    const eq = vi.fn(async () => ({ error: null }))
    const supabase = { from: vi.fn(() => ({ update: vi.fn(() => ({ eq })) })) }
    afterSave(supabase, 'intake-1')
    expect(supabase.from).toHaveBeenCalledWith('public_intake_leads')
  })

  it('attaches nothing on a miss and returns at once; the determination happens after the save', () => {
    const fd: Record<string, unknown> = {}
    const started = Date.now()
    const { det: d } = attachJurisdiction(fd, '9 Unseen Ct, Somewhere, MD 20600')
    expect(Date.now() - started).toBeLessThan(50)
    expect(d).toBeNull()
    expect(fd).toEqual({})
  })
})
