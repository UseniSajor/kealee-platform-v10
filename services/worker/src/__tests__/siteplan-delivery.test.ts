import { describe, it, expect, vi } from 'vitest'

vi.mock('@kealee/database', () => ({ prisma: {} }))

import {
  buildSitePlanDeliverable,
  bridgeSitePlanDelivery,
  bridgeSitePlanReviewOutcome,
  buildSitePlanReviewRecord,
  sitePlanDeliveryFormDataPatch,
  sitePlanReviewFormDataPatch,
  sitePlanPortalPath,
  isSitePlanProduct,
  productIncludesProfessionalReview,
  type DeliveryPorts,
  type PriorOutputs,
} from '../siteplan/delivery'

const NOW = new Date('2026-09-15T12:00:00.000Z')

/** The shape a completed first-release chain leaves in stage outputs. */
function completedChain(): PriorOutputs {
  return {
    'siteplan.resolve_property': {
      matchedAddress: '1005 ROLLINS AVE',
      locatorScore: 100,
      zoneCode: 'RSF-65',
      parcelAreaSqFt: 2506,
      parcelId: '1234567',
      hasStreetFrontage: true,
      municipality: {
        determined: true, incorporated: false, name: null,
        nearestName: 'CAPITOL HEIGHTS', nearestWithin: '0.25mi',
        mailingCity: 'Capitol Heights', zipCode: '20743',
        internalStaffReviewRequired: false,
      },
    },
    'siteplan.evaluate_rules': { zoneCode: 'RSF-65', packVersion: 'pg-2022.1' },
    'siteplan.build_existing_conditions': {
      contourCount: 14, intervalFt: 2, verticalDatum: 'NAVD88', reliabilityLevel: 1,
    },
    'siteplan.render_exports': {
      documentId: 'doc_1', filename: 'site-plan-wf_1.pdf', pageCount: 2, byteLength: 40000,
      frameFailures: [],
    },
    'siteplan.run_draft_qc': {
      deliverable: true, issuable: false,
      blocking: [],
      pendingSeal: [
        { code: 'seal.pe', message: 'PE seal and signature required (Sec. 32-130(a)(3)).' },
        { code: 'survey.boundary', message: 'Certified boundary survey required.' },
      ],
      summary: '0 blocking, 2 pending seal.',
    },
    'siteplan.deliver_preliminary': {
      deliveryState: 'PRELIMINARY_READY', documentId: 'doc_1', pageCount: 2, pendingSealCount: 2,
    },
  }
}

describe('buildSitePlanDeliverable', () => {
  it('projects the stage outputs onto the customer record', () => {
    const rec = buildSitePlanDeliverable({ workflowId: 'wf_1', outputs: completedChain(), now: NOW })
    expect(rec).not.toBeNull()
    expect(rec!.document).toEqual({ id: 'doc_1', filename: 'site-plan-wf_1.pdf', pageCount: 2 })
    expect(rec!.property.zoneCode).toBe('RSF-65')
    expect(rec!.property.parcelAreaSqFt).toBe(2506)
    expect(rec!.property.incorporated).toBe(false)
    expect(rec!.property.internalStaffReviewRequired).toBe(false)
    expect(rec!.terrain).toEqual({ contourCount: 14, intervalFt: 2, verticalDatum: 'NAVD88' })
    expect(rec!.qc.pendingSeal).toHaveLength(2)
    expect(rec!.qc.blocking).toEqual([])
    expect(rec!.deliveredAt).toBe(NOW.toISOString())
    expect(rec!.disclaimer).toMatch(/not for construction/i)
  })

  it('returns null when nothing was rendered — there is nothing to deliver', () => {
    const outputs = completedChain()
    delete outputs['siteplan.render_exports']
    delete outputs['siteplan.deliver_preliminary']
    expect(buildSitePlanDeliverable({ workflowId: 'wf_1', outputs })).toBeNull()
  })

  it('records absent sources as absent rather than failing', () => {
    const outputs = completedChain()
    delete outputs['siteplan.build_existing_conditions']
    delete outputs['siteplan.evaluate_rules']
    const rec = buildSitePlanDeliverable({ workflowId: 'wf_1', outputs })!
    expect(rec.terrain).toEqual({ contourCount: 0, intervalFt: null, verticalDatum: null })
    expect(rec.rulePackVersion).toBeNull()
  })

  it('does not claim a municipality answer the boundary layer did not give', () => {
    const outputs = completedChain()
    ;(outputs['siteplan.resolve_property'] as { municipality: { determined: boolean } })
      .municipality.determined = false
    const rec = buildSitePlanDeliverable({ workflowId: 'wf_1', outputs })!
    expect(rec.property.incorporated).toBeNull()
  })
})

describe('sitePlanDeliveryFormDataPatch', () => {
  const record = buildSitePlanDeliverable({ workflowId: 'wf_1', outputs: completedChain(), now: NOW })!

  it('delivers the preliminary product outright', () => {
    const patch = sitePlanDeliveryFormDataPatch({ productId: 'preliminary_site_plan', record })
    expect(patch.orderStatus).toBe('delivered')
    expect(patch.fulfillmentStatus).toBe('delivered')
    expect(patch.requiresHumanFulfillment).toBe(false)
    expect(patch.fulfillmentFallbackReason).toBeNull()
    expect(patch.sitePlanDeliverable).toBe(record)
  })

  it('sends the higher tiers to professional review with the plan still visible', () => {
    for (const productId of ['verified_site_feasibility', 'permit_site_plan']) {
      const patch = sitePlanDeliveryFormDataPatch({ productId, record })
      expect(patch.orderStatus).toBe('needs_professional_review')
      expect(patch.requiresHumanFulfillment).toBe(true)
      expect(patch.sitePlanDeliverable).toBe(record)
      expect(String(patch.orderStatusReason)).toContain('2 items')
    }
  })

  it('treats an unknown product as needing review rather than delivered', () => {
    const patch = sitePlanDeliveryFormDataPatch({ productId: 'something_else', record })
    expect(patch.orderStatus).toBe('needs_professional_review')
  })
})

describe('bridgeSitePlanDelivery', () => {
  function ports(overrides: Partial<DeliveryPorts> = {}) {
    const patches: Record<string, unknown>[] = []
    const emails: Parameters<DeliveryPorts['sendReadyEmail']>[0][] = []
    const p: DeliveryPorts = {
      loadOutputs: async () => completedChain(),
      loadOrder: async () => ({
        contactEmail: 'owner@example.com', clientName: 'Pat Owner', alreadyDelivered: false, reviewState: null,
      }),
      patchOrder: async (_id, patch) => { patches.push(patch) },
      sendReadyEmail: async (input) => { emails.push(input); return { sent: true } },
      now: () => NOW,
      ...overrides,
    }
    return { p, patches, emails }
  }

  it('patches the order and emails the customer', async () => {
    const { p, patches, emails } = ports()
    const out = await bridgeSitePlanDelivery(
      { workflowId: 'wf_1', orderId: 'intake_1', productId: 'preliminary_site_plan' }, p)
    expect(out).toMatchObject({ bridged: true, emailed: true, orderStatus: 'delivered' })
    expect(patches).toHaveLength(1)
    expect(emails).toHaveLength(1)
    expect(emails[0]).toMatchObject({
      to: 'owner@example.com', firstName: 'Pat', service: 'preliminary_site_plan', intakeId: 'intake_1',
    })
    expect(emails[0].headline).toMatch(/ready/i)
  })

  it('is idempotent on the order — a replayed stage does not email twice', async () => {
    const { p, patches, emails } = ports({
      loadOrder: async () => ({ contactEmail: 'owner@example.com', clientName: null, alreadyDelivered: true, reviewState: null }),
    })
    const out = await bridgeSitePlanDelivery(
      { workflowId: 'wf_1', orderId: 'intake_1', productId: 'preliminary_site_plan' }, p)
    expect(out.bridged).toBe(false)
    expect(patches).toHaveLength(0)
    expect(emails).toHaveLength(0)
  })

  it('still bridges when there is no customer email, and says so', async () => {
    const { p, patches, emails } = ports({
      loadOrder: async () => ({ contactEmail: null, clientName: null, alreadyDelivered: false, reviewState: null }),
    })
    const out = await bridgeSitePlanDelivery(
      { workflowId: 'wf_1', orderId: 'intake_1', productId: 'permit_site_plan' }, p)
    expect(out).toMatchObject({ bridged: true, emailed: false, orderStatus: 'needs_professional_review' })
    expect(patches).toHaveLength(1)
    expect(emails).toHaveLength(0)
    expect(out.summary).toMatch(/no customer email/)
  })

  it('reports an email failure without undoing the bridge', async () => {
    const { p, patches } = ports({ sendReadyEmail: async () => ({ sent: false, error: 'HTTP 503' }) })
    const out = await bridgeSitePlanDelivery(
      { workflowId: 'wf_1', orderId: 'intake_1', productId: 'preliminary_site_plan' }, p)
    expect(out).toMatchObject({ bridged: true, emailed: false })
    expect(out.summary).toContain('HTTP 503')
    expect(patches).toHaveLength(1)
  })

  it('never throws — a port failure becomes a summary', async () => {
    const { p } = ports({ patchOrder: async () => { throw new Error('db down') } })
    const out = await bridgeSitePlanDelivery(
      { workflowId: 'wf_1', orderId: 'intake_1', productId: 'preliminary_site_plan' }, p)
    expect(out.bridged).toBe(false)
    expect(out.summary).toContain('db down')
  })

  it('does nothing for an order that does not exist', async () => {
    const { p, patches } = ports({ loadOrder: async () => null })
    const out = await bridgeSitePlanDelivery(
      { workflowId: 'wf_1', orderId: 'ghost', productId: 'preliminary_site_plan' }, p)
    expect(out.bridged).toBe(false)
    expect(patches).toHaveLength(0)
  })
})

const PE = { displayName: 'A. Engineer', licenceNumber: 'MD-12345', licenceState: 'MD', discipline: 'professional_engineer' }

function reviewed(state: 'APPROVED' | 'CHANGES_REQUESTED' | 'IN_REVIEW'): PriorOutputs {
  return {
    ...completedChain(),
    'siteplan.route_review': {
      reviewState: state, documentId: 'doc_1', reviewer: PE,
      approvals: [
        { subject: 'ZONING_COMPLIANCE', decision: 'APPROVED', comment: null, decidedByName: PE.displayName, decidedAt: '2026-09-16T10:00:00Z' },
        { subject: 'SITE_LAYOUT', decision: state === 'CHANGES_REQUESTED' ? 'CHANGES_REQUESTED' : 'APPROVED',
          comment: state === 'CHANGES_REQUESTED' ? 'Front BRL scales at 24 ft.' : null,
          decidedByName: PE.displayName, decidedAt: '2026-09-16T10:00:00Z' },
      ],
      outstanding: [],
      redlines: state === 'CHANGES_REQUESTED'
        ? [{ subject: 'SITE_LAYOUT', decision: 'CHANGES_REQUESTED', comment: 'Front BRL scales at 24 ft.', decidedByName: PE.displayName, decidedAt: '2026-09-16T10:00:00Z' }]
        : [],
      reviewCompletedAt: state === 'APPROVED' ? '2026-09-16T11:00:00Z' : null,
      note: '',
    },
  }
}

describe('buildSitePlanReviewRecord', () => {
  it('projects an approved review with the reviewer identity', () => {
    const rec = buildSitePlanReviewRecord({ workflowId: 'wf_1', outputs: reviewed('APPROVED'), now: NOW })!
    expect(rec.state).toBe('APPROVED')
    expect(rec.reviewer).toMatchObject({ displayName: 'A. Engineer', licenceNumber: 'MD-12345' })
    expect(rec.reviewCompletedAt).toBe('2026-09-16T11:00:00Z')
    expect(rec.redlines).toEqual([])
    expect(rec.note).toMatch(/Sealing remains a separate act/)
  })

  it('is null while the review is undecided — nothing to tell the customer yet', () => {
    expect(buildSitePlanReviewRecord({ workflowId: 'wf_1', outputs: reviewed('IN_REVIEW') })).toBeNull()
    expect(buildSitePlanReviewRecord({ workflowId: 'wf_1', outputs: completedChain() })).toBeNull()
  })
})

describe('sitePlanReviewFormDataPatch', () => {
  const approved = buildSitePlanReviewRecord({ workflowId: 'wf_1', outputs: reviewed('APPROVED'), now: NOW })!
  const changes = buildSitePlanReviewRecord({ workflowId: 'wf_1', outputs: reviewed('CHANGES_REQUESTED'), now: NOW })!

  it('delivers verified_site_feasibility on approval — sign-off is its last line item', () => {
    const patch = sitePlanReviewFormDataPatch({ productId: 'verified_site_feasibility', record: approved })
    expect(patch.orderStatus).toBe('delivered')
    expect(patch.requiresHumanFulfillment).toBe(false)
    expect(String(patch.orderStatusReason)).toContain('A. Engineer (MD MD-12345)')
  })

  it('keeps permit_site_plan with a human after approval — issuance and submission are not connected', () => {
    const patch = sitePlanReviewFormDataPatch({ productId: 'permit_site_plan', record: approved })
    expect(patch.orderStatus).toBe('in_review')
    expect(patch.requiresHumanFulfillment).toBe(true)
    expect(String(patch.orderStatusReason)).toMatch(/Issuance QC/)
  })

  it('routes changes requested to a drafter regardless of product', () => {
    for (const productId of ['verified_site_feasibility', 'permit_site_plan']) {
      const patch = sitePlanReviewFormDataPatch({ productId, record: changes })
      expect(patch.orderStatus).toBe('revision_requested')
      expect(patch.fulfillmentStatus).toBe('awaiting_drafter')
      expect(String(patch.orderStatusReason)).toContain('1 subject')
    }
  })
})

describe('bridgeSitePlanReviewOutcome', () => {
  function ports(state: 'APPROVED' | 'CHANGES_REQUESTED' | 'IN_REVIEW', overrides: Partial<DeliveryPorts> = {}) {
    const patches: Record<string, unknown>[] = []
    const emails: Parameters<DeliveryPorts['sendReadyEmail']>[0][] = []
    const p: DeliveryPorts = {
      loadOutputs: async () => reviewed(state),
      loadOrder: async () => ({ contactEmail: 'owner@example.com', clientName: 'Pat Owner', alreadyDelivered: true, reviewState: null }),
      patchOrder: async (_id, patch) => { patches.push(patch) },
      sendReadyEmail: async (input) => { emails.push(input); return { sent: true } },
      now: () => NOW,
      ...overrides,
    }
    return { p, patches, emails }
  }

  it('emails the customer when the plan is approved', async () => {
    const { p, patches, emails } = ports('APPROVED')
    const out = await bridgeSitePlanReviewOutcome(
      { workflowId: 'wf_1', orderId: 'intake_1', productId: 'verified_site_feasibility' }, p)
    expect(out).toMatchObject({ bridged: true, emailed: true, orderStatus: 'delivered' })
    expect(patches).toHaveLength(1)
    expect(emails[0].headline).toMatch(/professionally reviewed/)
  })

  it('does not email on changes requested — that is Kealee work, not the customer\'s', async () => {
    const { p, patches, emails } = ports('CHANGES_REQUESTED')
    const out = await bridgeSitePlanReviewOutcome(
      { workflowId: 'wf_1', orderId: 'intake_1', productId: 'permit_site_plan' }, p)
    expect(out).toMatchObject({ bridged: true, emailed: false, orderStatus: 'revision_requested' })
    expect(patches).toHaveLength(1)
    expect(emails).toHaveLength(0)
  })

  it('is idempotent on the review state', async () => {
    const { p, patches, emails } = ports('APPROVED', {
      loadOrder: async () => ({ contactEmail: 'owner@example.com', clientName: null, alreadyDelivered: true, reviewState: 'APPROVED' }),
    })
    const out = await bridgeSitePlanReviewOutcome(
      { workflowId: 'wf_1', orderId: 'intake_1', productId: 'verified_site_feasibility' }, p)
    expect(out.bridged).toBe(false)
    expect(patches).toHaveLength(0)
    expect(emails).toHaveLength(0)
  })

  it('does nothing while the review is undecided', async () => {
    const { p, patches } = ports('IN_REVIEW')
    const out = await bridgeSitePlanReviewOutcome(
      { workflowId: 'wf_1', orderId: 'intake_1', productId: 'verified_site_feasibility' }, p)
    expect(out.bridged).toBe(false)
    expect(patches).toHaveLength(0)
  })
})

describe('helpers', () => {
  it('knows the three site-plan SKUs', () => {
    expect(isSitePlanProduct('preliminary_site_plan')).toBe(true)
    expect(isSitePlanProduct('verified_site_feasibility')).toBe(true)
    expect(isSitePlanProduct('permit_site_plan')).toBe(true)
    expect(isSitePlanProduct('kitchen_remodel')).toBe(false)
    expect(isSitePlanProduct(null)).toBe(false)
  })

  it('knows which products paid for professional review', () => {
    expect(productIncludesProfessionalReview('preliminary_site_plan')).toBe(false)
    expect(productIncludesProfessionalReview('verified_site_feasibility')).toBe(true)
    expect(productIncludesProfessionalReview('permit_site_plan')).toBe(true)
    expect(productIncludesProfessionalReview(null)).toBe(false)
  })

  it('points the claim link at the portal site-plan page', () => {
    expect(sitePlanPortalPath('abc/1')).toBe('/deliverables/abc%2F1/site-plan')
  })
})
