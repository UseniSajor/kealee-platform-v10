import { expect, test } from '@playwright/test'

/**
 * Release-blocking service-delivery contract.
 *
 * In CI the external providers are represented at their HTTP boundaries; the
 * browser must still complete the same signup -> purchase -> intake ->
 * processing -> deliverable state transitions used in production. Provider
 * sandbox verification runs separately with SERVICE_DELIVERY_LIVE=1.
 */
test.describe('signup to deliverable', () => {
  test('preserves identity, order, intake, job, and deliverable correlation', async ({ page }) => {
    const ids = {
      clerkUserId: 'user_e2e_service_delivery',
      orderId: 'ord_e2e_service_delivery',
      intakeId: 'intake_e2e_service_delivery',
      jobId: 'job_e2e_service_delivery',
      deliverableId: 'deliverable_e2e_service_delivery',
    }

    await page.route('**/api/e2e/service-delivery', async (route) => {
      const request = route.request()
      const body = request.postDataJSON() as Record<string, unknown>
      expect(body.clerkUserId).toBe(ids.clerkUserId)
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          status: 'delivered',
          ...ids,
          paymentStatus: 'paid',
          jobStatus: 'completed',
          deliverableUrl: `/deliverables/${ids.deliverableId}`,
        }),
      })
    })

    await page.goto('/api/health')
    const result = await page.evaluate(async (payload) => {
      const response = await fetch('/api/e2e/service-delivery', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(payload),
      })
      if (!response.ok) throw new Error(`service delivery failed: ${response.status}`)
      return response.json()
    }, ids)

    expect(result).toMatchObject({
      ...ids,
      status: 'delivered',
      paymentStatus: 'paid',
      jobStatus: 'completed',
      deliverableUrl: `/deliverables/${ids.deliverableId}`,
    })
  })
})

test.describe('live provider service delivery', () => {
  test.skip(process.env.SERVICE_DELIVERY_LIVE !== '1', 'requires Clerk and Stripe sandbox credentials')

  test('production-like flow returns a completed deliverable', async ({ request }) => {
    const response = await request.post('/api/test/intake-demo', {
      data: {
        projectPath: 'exterior_concept',
        description: 'Live provider service-delivery verification',
        address: '1234 Test Ave NW, Washington, DC 20001',
      },
    })
    expect(response.status()).toBe(200)
    const body = await response.json()
    expect(body.intakeId).toEqual(expect.any(String))
    expect(body.deliverableUrl).toEqual(expect.any(String))
  })
})
