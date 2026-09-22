import {
  createSitePlanSlaFormData,
  resolveSitePlanSlaHealth,
  sitePlanSlaLabel,
} from '../site-plan-sla'

describe('site-plan delivery commitments', () => {
  const paidAt = new Date('2026-09-22T14:00:00.000Z')

  it('records the preliminary summary and package deadlines', () => {
    const sla = createSitePlanSlaFormData('preliminary_site_plan', paidAt)
    expect(sla.sitePlanSummaryDueAt).toBe('2026-09-22T15:00:00.000Z')
    expect(sla.sitePlanDeliveryDueAt).toBe('2026-09-27T14:00:00.000Z')
    expect(resolveSitePlanSlaHealth(sla, paidAt)).toBe('on_track')
  })

  it('tracks the verified package on the seven-day promise', () => {
    const sla = createSitePlanSlaFormData('verified_site_feasibility', paidAt)
    expect(sla.sitePlanDeliveryDueAt).toBe('2026-09-29T14:00:00.000Z')
  })

  it('does not invent a permit drawing date before survey review', () => {
    const sla = createSitePlanSlaFormData('permit_site_plan', paidAt)
    expect(sla.sitePlanDeliveryDueAt).toBeNull()
    expect(resolveSitePlanSlaHealth(sla, paidAt)).toBe('awaiting_scope')
  })

  it('flags late work and distinguishes on-time delivery', () => {
    const sla = createSitePlanSlaFormData('preliminary_site_plan', paidAt)
    expect(resolveSitePlanSlaHealth(sla, new Date('2026-09-22T16:00:00.000Z'))).toBe('summary_overdue')
    expect(resolveSitePlanSlaHealth({
      ...sla,
      sitePlanSummaryCompletedAt: '2026-09-22T14:10:00.000Z',
    }, new Date('2026-09-28T14:00:00.000Z'))).toBe('overdue')
    expect(resolveSitePlanSlaHealth({
      ...sla,
      sitePlanSummaryCompletedAt: '2026-09-22T14:10:00.000Z',
      sitePlanSlaDeliveredAt: '2026-09-25T14:00:00.000Z',
    }, new Date('2026-10-01T00:00:00.000Z'))).toBe('delivered_on_time')
    expect(sitePlanSlaLabel('delivered_on_time')).toBe('Delivered on time')
  })

  it('ignores non-site-plan services', () => {
    expect(createSitePlanSlaFormData('cost_estimate', paidAt)).toEqual({})
    expect(resolveSitePlanSlaHealth({}, paidAt)).toBe('not_applicable')
  })
})
