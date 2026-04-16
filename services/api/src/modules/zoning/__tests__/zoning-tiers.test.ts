/**
 * Zoning Intelligence Tiers Tests
 * Tests snapshot, summary, and full report functions
 */

import { describe, it, expect } from 'vitest'
import { zoningService } from '../zoning.service'

describe('Zoning Intelligence Tiers', () => {
  const testAddress = '123 Main St, Washington, DC 20024'
  const testInput = { address: testAddress }

  describe('Snapshot - Basic Tier', () => {
    it('should return basic zoning information', async () => {
      const snapshot = await zoningService.getZoningSnapshot(testInput)

      expect(snapshot).toHaveProperty('jurisdiction')
      expect(snapshot).toHaveProperty('zoningDistrict')
      expect(snapshot).toHaveProperty('basicUseAllowed')
      expect(snapshot).toHaveProperty('highLevelConstraints')
      expect(snapshot).toHaveProperty('riskFlags')
      expect(snapshot).toHaveProperty('feasibilityRating')
      expect(snapshot).toHaveProperty('confidenceLevel')
    })

    it('should have limited confidence for snapshot', async () => {
      const snapshot = await zoningService.getZoningSnapshot(testInput)
      expect(snapshot.confidenceLevel).toBeLessThanOrEqual(75)
      expect(snapshot.feasibilityRating).toBe('PRELIMINARY')
    })
  })

  describe('Summary - Advanced Tier', () => {
    it('should return comprehensive zoning information', async () => {
      const summary = await zoningService.getZoningSummary(testInput)

      // Should include snapshot fields
      expect(summary).toHaveProperty('jurisdiction')
      expect(summary).toHaveProperty('zoningDistrict')
      expect(summary).toHaveProperty('basicUseAllowed')

      // Plus additional summary fields
      expect(summary).toHaveProperty('overlays')
      expect(summary).toHaveProperty('setbacks')
      expect(summary).toHaveProperty('heightLimits')
      expect(summary).toHaveProperty('lotCoverage')
      expect(summary).toHaveProperty('parkingIndicators')
      expect(summary).toHaveProperty('entitlementPath')
      expect(summary).toHaveProperty('buildabilitySummary')
      expect(summary).toHaveProperty('zoningRequirements')
    })

    it('should have higher confidence for summary', async () => {
      const summary = await zoningService.getZoningSummary(testInput)
      expect(summary.confidenceLevel).toBeLessThanOrEqual(85)
      expect(summary.feasibilityRating).toBe('MODERATE')
    })

    it('should include dimensional standards', async () => {
      const summary = await zoningService.getZoningSummary(testInput)
      expect(summary.heightLimits).toBeDefined()
      expect(summary.setbacks).toBeDefined()
      expect(summary.lotCoverage).toBeDefined()
    })
  })

  describe('Full Report - Premium Tier', () => {
    it('should return exhaustive zoning information', async () => {
      const report = await zoningService.getZoningFullReport(testInput)

      // Should include summary fields
      expect(report).toHaveProperty('jurisdiction')
      expect(report).toHaveProperty('overlays')
      expect(report).toHaveProperty('setbacks')
      expect(report).toHaveProperty('buildabilitySummary')

      // Plus full report fields
      expect(report).toHaveProperty('developmentStandards')
      expect(report).toHaveProperty('environmentalConstraints')
      expect(report).toHaveProperty('historicConstraints')
      expect(report).toHaveProperty('detailedRiskAnalysis')
      expect(report).toHaveProperty('buildabilitySummaryExpanded')
      expect(report).toHaveProperty('requiresArchitect')
      expect(report).toHaveProperty('requiresEngineer')
      expect(report).toHaveProperty('nepaAssessment')
      expect(report).toHaveProperty('permitsRequired')
      expect(report).toHaveProperty('totalPermitFees')
      expect(report).toHaveProperty('totalPermitTimeline')
    })

    it('should have highest confidence for full report', async () => {
      const report = await zoningService.getZoningFullReport(testInput)
      expect(report.confidenceLevel).toBeLessThanOrEqual(95)
      expect(report.feasibilityRating).toBe('VERIFIED')
    })

    it('should include permit checklist', async () => {
      const report = await zoningService.getZoningFullReport(testInput)
      expect(Array.isArray(report.permitsRequired)).toBe(true)
      expect(report.totalPermitFees).toBeGreaterThan(0)
      expect(report.totalPermitTimeline).toBeTruthy()
    })

    it('should assess architect/engineer requirements', async () => {
      const report = await zoningService.getZoningFullReport(testInput)
      expect(typeof report.requiresArchitect).toBe('boolean')
      expect(typeof report.requiresEngineer).toBe('boolean')
    })

    it('should include NEPA assessment', async () => {
      const report = await zoningService.getZoningFullReport(testInput)
      expect(report.nepaAssessment).toBeDefined()
      expect(report.nepaAssessment).toHaveProperty('exemptionType')
      expect(report.nepaAssessment).toHaveProperty('isExempt')
      expect(report.nepaAssessment).toHaveProperty('recommendation')
    })
  })

  describe('Tier Progression', () => {
    it('should provide increasing detail from snapshot to summary to full report', async () => {
      const snapshot = await zoningService.getZoningSnapshot(testInput)
      const summary = await zoningService.getZoningSummary(testInput)
      const report = await zoningService.getZoningFullReport(testInput)

      // Snapshot has minimal fields
      const snapshotFields = Object.keys(snapshot).length
      const summaryFields = Object.keys(summary).length
      const reportFields = Object.keys(report).length

      expect(summaryFields).toBeGreaterThan(snapshotFields)
      expect(reportFields).toBeGreaterThan(summaryFields)
    })

    it('should increase confidence level with tier', async () => {
      const snapshot = await zoningService.getZoningSnapshot(testInput)
      const summary = await zoningService.getZoningSummary(testInput)
      const report = await zoningService.getZoningFullReport(testInput)

      expect(snapshot.confidenceLevel).toBeLessThan(summary.confidenceLevel)
      expect(summary.confidenceLevel).toBeLessThan(report.confidenceLevel)
    })
  })

  describe('Data Consistency', () => {
    it('should maintain consistent jurisdiction/district across tiers', async () => {
      const snapshot = await zoningService.getZoningSnapshot(testInput)
      const summary = await zoningService.getZoningSummary(testInput)
      const report = await zoningService.getZoningFullReport(testInput)

      expect(snapshot.jurisdiction).toBe(summary.jurisdiction)
      expect(summary.jurisdiction).toBe(report.jurisdiction)
      expect(snapshot.zoningDistrict).toBe(summary.zoningDistrict)
      expect(summary.zoningDistrict).toBe(report.zoningDistrict)
    })

    it('should include constraints in all tiers', async () => {
      const snapshot = await zoningService.getZoningSnapshot(testInput)
      const summary = await zoningService.getZoningSummary(testInput)
      const report = await zoningService.getZoningFullReport(testInput)

      expect(Array.isArray(snapshot.highLevelConstraints)).toBe(true)
      expect(Array.isArray(summary.highLevelConstraints)).toBe(true)
      expect(Array.isArray(report.highLevelConstraints)).toBe(true)
    })
  })
})
