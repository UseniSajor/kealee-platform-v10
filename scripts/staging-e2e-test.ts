#!/usr/bin/env npx ts-node

/**
 * End-to-End Staging Test Suite
 * Tests complete flow: concept intake → pricing → checkout
 */

import axios, { AxiosInstance } from 'axios'

// ============================================================================
// CONFIGURATION
// ============================================================================

const API_BASE_URL = process.env.API_URL || 'http://localhost:3001'
const TEST_EMAIL = 'staging-test@kealee.com'
const TEST_SESSION_ID = `test-${Date.now()}`

// ============================================================================
// TEST CLIENT
// ============================================================================

class StagingTestClient {
  private client: AxiosInstance
  private testResults: TestResult[] = []

  constructor() {
    this.client = axios.create({
      baseURL: API_BASE_URL,
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json',
        'X-Test-Session': TEST_SESSION_ID,
      },
    })
  }

  async runAllTests(): Promise<void> {
    console.log('🚀 Starting End-to-End Staging Tests')
    console.log(`📍 API Base URL: ${API_BASE_URL}`)
    console.log(`🧪 Test Session: ${TEST_SESSION_ID}\n`)

    try {
      await this.testConceptIntake()
      await this.testPricingCalculation()
      await this.testLandingPrices()
      await this.testChainGating()
      await this.testAnalyticsTracking()

      this.printSummary()
    } catch (error) {
      console.error('\n❌ Test Suite Failed:', error)
      process.exit(1)
    }
  }

  // ── TEST 1: Concept Intake ──
  private async testConceptIntake(): Promise<void> {
    console.log('📝 TEST 1: Concept Intake Flow')

    try {
      const response = await this.client.post('/concept/intake', {
        projectType: 'kitchen',
        scope: 'Complete kitchen renovation with island, new appliances, and custom cabinetry',
        budget: 75000,
        location: '20024',
        homeownerEmail: TEST_EMAIL,
      })

      const intakeId = response.data.id || response.data.intakeId

      this.logTest('Concept intake submission', response.status === 201 || response.status === 200)
      console.log(`   ✅ Intake ID: ${intakeId}\n`)

      return intakeId
    } catch (error: any) {
      this.logTest('Concept intake submission', false, error.message)
    }
  }

  // ── TEST 2: Pricing Calculation ──
  private async testPricingCalculation(): Promise<void> {
    console.log('💰 TEST 2: Pricing Calculation')

    try {
      // Test basic concept pricing
      const basicPricing = await this.client.post('/api/v1/checkout/calculate', {
        serviceType: 'concept',
        tier: 'concept_basic',
        jurisdiction: 'Washington, DC',
        complexityScore: 65,
        zoningRisk: 'LOW',
      })

      this.logTest('Basic concept pricing', basicPricing.status === 200)
      console.log(`   💵 Basic Price: $${basicPricing.data.data.finalPrice.toFixed(2)}`)

      // Test with CTC deliverables
      const advancedPricing = await this.client.post('/api/v1/checkout/calculate', {
        serviceType: 'concept',
        tier: 'concept_advanced',
        jurisdiction: 'Washington, DC',
        complexityScore: 75,
        conceptDeliverables: {
          mepSystem: {
            electrical: 'Full circuit layout with load calculation',
            plumbing: 'Water and waste line routing with fixture schedule',
            hvac: 'HVAC zone design with duct layout',
          },
          billOfMaterials: [
            { item: 'Custom Cabinetry', quantity: 1, unit: 'ls', estimatedCost: 15000 },
            { item: 'Countertops', quantity: 40, unit: 'sf', estimatedCost: 4000 },
            { item: 'Appliances', quantity: 5, unit: 'ea', estimatedCost: 8000 },
          ],
          estimatedCost: 75000,
          description: 'Full kitchen renovation with island, MEP upgrades, and high-end finishes',
        },
      })

      this.logTest('Advanced concept with CTC deliverables', advancedPricing.status === 200)
      console.log(`   💵 Advanced Price: $${advancedPricing.data.data.finalPrice.toFixed(2)}`)
      console.log(`   📊 Adjustments: ${advancedPricing.data.data.adjustments.length}`)

      // Test permits pricing
      const permitsPricing = await this.client.post('/api/v1/checkout/calculate', {
        serviceType: 'permits',
        tier: 'tracking',
        jurisdiction: 'Washington, DC',
        complexityScore: 60,
        submissionMethod: 'KEALEE_MANAGED',
        estimatedValuation: 75000,
      })

      this.logTest('Permits pricing with managed submission', permitsPricing.status === 200)
      console.log(`   💵 Permits Price: $${permitsPricing.data.data.finalPrice.toFixed(2)}\n`)
    } catch (error: any) {
      this.logTest('Pricing calculation', false, error.message)
    }
  }

  // ── TEST 3: Landing Page Pricing ──
  private async testLandingPrices(): Promise<void> {
    console.log('🏪 TEST 3: Landing Page Pricing')

    try {
      const conceptPrices = await this.client.get('/api/v1/pricing/landing/concept')
      this.logTest('Concept landing prices', conceptPrices.status === 200)
      console.log(`   Starting at: $${conceptPrices.data.data.startingPrice.toFixed(2)}`)

      const estimationPrices = await this.client.get('/api/v1/pricing/landing/estimation')
      this.logTest('Estimation landing prices', estimationPrices.status === 200)
      console.log(`   Starting at: $${estimationPrices.data.data.startingPrice.toFixed(2)}`)

      const permitsPrices = await this.client.get('/api/v1/pricing/landing/permits')
      this.logTest('Permits landing prices', permitsPrices.status === 200)
      console.log(`   Starting at: $${permitsPrices.data.data.startingPrice.toFixed(2)}\n`)
    } catch (error: any) {
      this.logTest('Landing page pricing', false, error.message)
    }
  }

  // ── TEST 4: Chain Gating ──
  private async testChainGating(): Promise<void> {
    console.log('🔗 TEST 4: Chain Gating & Orchestration')

    try {
      // Test that gating prevents concept→estimation without scope
      const missingScope = await this.client.post(
        '/api/v1/gating/evaluate/concept-to-estimation',
        { conceptIntakeId: 'invalid-id' }
      ).catch(err => ({
        status: err.response?.status,
        data: err.response?.data,
      }))

      this.logTest('Gating blocks invalid concept', missingScope.status === 400 || missingScope.status === 404)

      console.log(`   ✅ Gating rules enforced\n`)
    } catch (error: any) {
      this.logTest('Chain gating', false, error.message)
    }
  }

  // ── TEST 5: Analytics Tracking ──
  private async testAnalyticsTracking(): Promise<void> {
    console.log('📊 TEST 5: Analytics Tracking')

    try {
      // Test event tracking (should not fail even if backend doesn't persist)
      const trackEvent = await this.client.post('/api/v1/analytics/track', {
        eventType: 'CONCEPT_PAGE_VIEWED',
        sessionId: TEST_SESSION_ID,
        email: TEST_EMAIL,
        serviceType: 'concept',
      })

      this.logTest('Analytics event tracking', trackEvent.status === 200 || trackEvent.status === 201)

      // Test funnel summary (optional, may not exist)
      try {
        const funnelSummary = await this.client.get('/api/v1/analytics/funnel/concept')
        if (funnelSummary.status === 200) {
          console.log(`   ✅ Funnel metrics available`)
        }
      } catch {
        console.log(`   ℹ️  Funnel metrics endpoint not yet available`)
      }

      console.log('')
    } catch (error: any) {
      this.logTest('Analytics tracking', false, error.message)
    }
  }

  // ── UTILITIES ──
  private logTest(testName: string, passed: boolean, error?: string): void {
    const status = passed ? '✅' : '❌'
    console.log(`   ${status} ${testName}`)
    if (error) {
      console.log(`      Error: ${error}`)
    }
    this.testResults.push({ testName, passed, error })
  }

  private printSummary(): void {
    const passed = this.testResults.filter(r => r.passed).length
    const total = this.testResults.length
    const percentage = ((passed / total) * 100).toFixed(0)

    console.log('\n' + '='.repeat(60))
    console.log(`📈 TEST SUMMARY: ${passed}/${total} passed (${percentage}%)`)
    console.log('='.repeat(60))

    if (passed === total) {
      console.log('\n✅ ALL TESTS PASSED - Ready for production deployment\n')
      process.exit(0)
    } else {
      console.log('\n⚠️  Some tests failed - Review logs above\n')
      process.exit(1)
    }
  }
}

// ============================================================================
// RUN TESTS
// ============================================================================

interface TestResult {
  testName: string
  passed: boolean
  error?: string
}

const client = new StagingTestClient()
client.runAllTests()
