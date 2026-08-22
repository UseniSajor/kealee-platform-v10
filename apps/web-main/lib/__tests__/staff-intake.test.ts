/**
 * Staff intake — phone orders and in-house jobs.
 *
 * The behaviour that matters is what happens to a question the caller could not
 * answer. It must be recorded as never-asked, not silently defaulted, because a
 * guessed corner-lot answer produces the wrong front setback and nothing
 * downstream would catch it.
 */

import {
  validateStaffIntake, buildStaffIntakeFormData, buildStaffIntakeRecord,
  buildInHouseAutomationFormData, STAFF_INTAKE_PATHS, type StaffIntakeInput,
} from '../staff-intake'

const ASSISTED: StaffIntakeInput = {
  mode: 'assisted',
  projectPath: 'preliminary_site_plan',
  clientName: 'J. Whitfield',
  contactEmail: 'j@example.com',
  contactPhone: '301-555-0100',
  projectAddress: '4500 Rhode Island Ave, Brentwood, MD 20722',
  takenBy: 'ops:tim',
  formData: { zone: 'RSF-65', cornerLot: false },
}

const IN_HOUSE: StaffIntakeInput = {
  mode: 'in_house',
  projectPath: 'permit_site_plan',
  projectAddress: '3210 Webster St, Mount Rainier, MD',
  takenBy: 'ops:tim',
  formData: { zone: 'RSF-65' },
  notAsked: ['cornerLot', 'lotWidthFt'],
}

describe('what a staff member may open an order for', () => {
  it('covers site plan, design, estimation and permits', () => {
    expect(STAFF_INTAKE_PATHS).toEqual(expect.arrayContaining([
      'preliminary_site_plan', 'verified_site_feasibility', 'permit_site_plan',
      'design_concept', 'cost_estimate', 'permit_path_only',
    ]))
  })
})

describe('validation blocks only what genuinely cannot proceed', () => {
  it('accepts a complete assisted order', () => {
    expect(validateStaffIntake(ASSISTED).ok).toBe(true)
  })

  it('requires an address, because jurisdiction depends on it', () => {
    const v = validateStaffIntake({ ...ASSISTED, projectAddress: '' })
    expect(v.ok).toBe(false)
    expect(v.errors.join(' ')).toMatch(/no jurisdiction can be resolved/i)
  })

  it('requires a way to reach a paying customer', () => {
    const v = validateStaffIntake({ ...ASSISTED, contactEmail: '', contactPhone: '' })
    expect(v.ok).toBe(false)
    expect(v.errors.join(' ')).toMatch(/email or a phone/i)
  })

  it('rejects an email that would silently fail to deliver', () => {
    const v = validateStaffIntake({ ...ASSISTED, contactEmail: 'not-an-email' })
    expect(v.ok).toBe(false)
    expect(v.errors.join(' ')).toMatch(/not valid/i)
  })

  it('does NOT block an order just because the caller lacked details', () => {
    // The whole point: a phone order proceeds without lot width or corner status.
    const v = validateStaffIntake({ ...ASSISTED, formData: {} })
    expect(v.ok).toBe(true)
    expect(v.warnings.join(' ')).toMatch(/Corner-lot status not captured/i)
    expect(v.warnings.join(' ')).toMatch(/route the setback to a human rather than guess/i)
  })

  it('an in-house job needs no customer identity', () => {
    expect(validateStaffIntake(IN_HOUSE).ok).toBe(true)
  })

  it('flags an in-house job that looks like it was mis-moded', () => {
    const v = validateStaffIntake({ ...IN_HOUSE, contactEmail: 'someone@example.com' })
    expect(v.warnings.join(' ')).toMatch(/check the mode is right/i)
  })
})

describe('unanswered questions are recorded, never defaulted', () => {
  it('keeps notAsked distinct from an answered value', () => {
    const fd = buildStaffIntakeFormData(IN_HOUSE)
    const staff = fd.staffIntake as { notAsked: string[] }
    expect(staff.notAsked).toEqual(['cornerLot', 'lotWidthFt'])
    // Critically, no default was invented for either.
    expect(fd.cornerLot).toBeUndefined()
    expect(fd.lotWidthFt).toBeUndefined()
  })

  it('records who took the order and when', () => {
    const staff = buildStaffIntakeFormData(ASSISTED).staffIntake as Record<string, unknown>
    expect(staff.takenBy).toBe('ops:tim')
    expect(typeof staff.takenAt).toBe('string')
    expect(staff.channel).toBe('phone_or_assisted')
  })

  it('preserves whatever the caller could answer', () => {
    const fd = buildStaffIntakeFormData(ASSISTED)
    expect(fd.zone).toBe('RSF-65')
    expect(fd.cornerLot).toBe(false)
  })
})

describe('the row that gets inserted', () => {
  it('leaves an assisted order unpaid so the existing webhook drives fulfilment', () => {
    const r = buildStaffIntakeRecord(ASSISTED)
    expect(r.status).toBe('new')
    expect(r.requires_payment).toBe(true)
    expect(r.source).toBe('admin-assisted')
  })

  it('creates an in-house job already paid, since no Stripe session is coming', () => {
    const r = buildStaffIntakeRecord(IN_HOUSE)
    // Leaving it "new" would strand it outside every fulfilment path.
    expect(r.status).toBe('paid')
    expect(r.requires_payment).toBe(false)
    expect(r.source).toBe('admin-in-house')
    expect(r.form_data.inHouseJob).toBe(true)
  })

  it('gives an in-house job a usable label without inventing a customer', () => {
    const r = buildStaffIntakeRecord(IN_HOUSE)
    expect(r.client_name).toMatch(/^In-house —/)
    expect(r.contact_email).toBeNull()
  })

  it('records the operator in metadata for the audit trail', () => {
    const r = buildStaffIntakeRecord(ASSISTED)
    expect(r.metadata.enteredBy).toBe('ops:tim')
    expect(r.metadata.intakeMode).toBe('assisted')
  })

  it('is JSON-serialisable for the JSONB column', () => {
    expect(() => JSON.parse(JSON.stringify(buildStaffIntakeRecord(IN_HOUSE)))).not.toThrow()
  })
})

describe('an in-house job is still v30 automated', () => {
  it('flags v30 so the bots recognise it', () => {
    const r = buildStaffIntakeRecord(IN_HOUSE)
    // Without this the job sits paid and idle: nothing downstream would treat
    // it as automated, because v30 is what marks an AI-automated order.
    expect(r.form_data.v30).toBe(true)
    expect(r.form_data.v30Source).toBe('admin-in-house')
  })

  it('attaches the same automation route the webhook would have', () => {
    const r = buildStaffIntakeRecord(IN_HOUSE)
    expect(r.form_data.workflowTemplateId).toBe('wf_permit_site_plan_v1')
    expect(r.form_data.fulfillmentBotTypes).toEqual(expect.arrayContaining(['zoning', 'permit']))
    expect(r.form_data.fulfillmentStatus).toBe('queued')
    expect(typeof r.form_data.fulfillmentQueuedAt).toBe('string')
  })

  it('routes every staff-selectable product, or says plainly that it cannot', () => {
    for (const path of STAFF_INTAKE_PATHS) {
      const fd = buildInHouseAutomationFormData(path)
      if (fd.fulfillmentStatus === 'unroutable') {
        expect(fd.fulfillmentNote).toMatch(/route it by hand/i)
      } else {
        expect(fd.fulfillmentStatus).toBe('queued')
        expect(typeof fd.workflowTemplateId).toBe('string')
      }
    }
  })

  it('does NOT flag an assisted order as v30 — the webhook decides that', () => {
    const r = buildStaffIntakeRecord(ASSISTED)
    expect(r.form_data.v30).toBeUndefined()
    // It stays unpaid, so the Stripe webhook drives automation exactly as it
    // does for a web order. Setting v30 here would double-drive it.
    expect(r.status).toBe('new')
    expect(r.form_data.fulfillmentStatus).toBeUndefined()
  })
})
