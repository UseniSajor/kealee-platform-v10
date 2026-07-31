import { describe, expect, it } from 'vitest'
import { buildImmediateIntakeDeliverables } from '@/lib/immediate-intake-deliverables'

describe('buildImmediateIntakeDeliverables', () => {
  it('publishes the automated first-hour summary and readiness checklist', () => {
    const result = buildImmediateIntakeDeliverables({
      projectPath: 'preliminary_site_plan',
      projectAddress: '100 Main Street',
      formData: {
        siteGoal: 'Test a detached ADU',
        propertyDetails: 'Parcel 123; existing house',
        stylePreferences: 'Possible setback constraint',
        sourceStatus: 'Parcel map or plat',
        uploadedFiles: ['plat.pdf'],
      },
      generatedAt: '2026-07-31T12:00:00.000Z',
    })

    expect(result.status).toBe('READY')
    expect(result.deliveryWindow).toBe('WITHIN_1_HOUR')
    expect(result.classification).toBe('PRELIMINARY')
    expect(result.projectSummary.goal).toBe('Test a detached ADU')
    expect(result.zoningRequirements.requirements.length).toBeGreaterThan(0)
    expect(result.permitRequirements.documentsNeeded.length).toBeGreaterThan(0)
    expect(result.readinessChecklist.find(item => item.key === 'professional-review')?.status)
      .toBe('REQUIRES_PROFESSIONAL_REVIEW')
  })

  it('marks an address-only intake source-limited without blocking delivery', () => {
    const result = buildImmediateIntakeDeliverables({
      projectPath: 'concept',
      projectAddress: '200 Main Street',
      formData: { siteGoal: 'Kitchen update' },
    })

    expect(result.status).toBe('SOURCE_LIMITED')
    expect(result.readinessChecklist.find(item => item.key === 'project-summary')?.status).toBe('READY')
    expect(result.readinessChecklist.find(item => item.key === 'source-status')?.status).toBe('PENDING_SOURCE')
  })
})
