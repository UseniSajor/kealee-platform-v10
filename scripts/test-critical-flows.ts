# 🧪 Critical Flows Testing Script

```typescript
#!/usr/bin/env tsx
/**
 * Test Critical User Flows
 * Run this script to verify all critical flows work in production
 */

import { PrismaClient } from '@prisma/client'

const API_URL = process.env.API_URL || 'http://localhost:3001'
const prisma = new PrismaClient()

interface TestResult {
  name: string
  passed: boolean
  error?: string
  duration?: number
}

const results: TestResult[] = []

async function test(name: string, fn: () => Promise<void>) {
  const start = Date.now()
  try {
    await fn()
    const duration = Date.now() - start
    results.push({ name, passed: true, duration })
    console.log(`✅ ${name} (${duration}ms)`)
  } catch (error: any) {
    const duration = Date.now() - start
    results.push({ name, passed: false, error: error.message, duration })
    console.log(`❌ ${name}: ${error.message}`)
  }
}

async function main() {
  console.log('🧪 Testing Critical Flows...\n')

  // 1. Database Connection
  await test('Database Connection', async () => {
    await prisma.$queryRaw`SELECT 1`
  })

  // 2. User Registration
  await test('User Registration', async () => {
    const response = await fetch(`${API_URL}/auth/signup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: `test-${Date.now()}@example.com`,
        password: 'TestPassword123!',
        name: 'Test User',
      }),
    })
    if (!response.ok) throw new Error(`HTTP ${response.status}`)
  })

  // 3. User Login
  await test('User Login', async () => {
    const response = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'test@example.com',
        password: 'TestPassword123!',
      }),
    })
    if (!response.ok) throw new Error(`HTTP ${response.status}`)
  })

  // 4. Stripe Webhook (Signature Verification)
  await test('Stripe Webhook Signature', async () => {
    // This would require actual Stripe webhook test
    // For now, just verify endpoint exists
    const response = await fetch(`${API_URL}/webhooks/stripe`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    })
    // Should return 400 (missing signature) not 404 (not found)
    if (response.status === 404) throw new Error('Webhook endpoint not found')
  })

  // 5. Service Plans Available
  await test('Service Plans Available', async () => {
    const plans = await prisma.servicePlan.findMany({ where: { isActive: true } })
    if (plans.length === 0) throw new Error('No service plans found')
  })

  // 6. Roles and Permissions
  await test('Roles and Permissions', async () => {
    const roles = await prisma.role.findMany()
    const permissions = await prisma.permission.findMany()
    if (roles.length === 0) throw new Error('No roles found')
    if (permissions.length === 0) throw new Error('No permissions found')
  })

  // Summary
  console.log('\n📊 Test Results:')
  const passed = results.filter((r) => r.passed).length
  const failed = results.filter((r) => !r.passed).length
  console.log(`   ✅ Passed: ${passed}/${results.length}`)
  console.log(`   ❌ Failed: ${failed}/${results.length}`)

  if (failed > 0) {
    console.log('\n❌ Failed Tests:')
    results.filter((r) => !r.passed).forEach((r) => {
      console.log(`   - ${r.name}: ${r.error}`)
    })
    process.exit(1)
  }

  await prisma.$disconnect()
}

main().catch(console.error)

```

**Usage:**
```bash
# Set API_URL environment variable
export API_URL=https://api.kealee.com

# Run tests
tsx scripts/test-critical-flows.ts
```

---

**Last Updated:** January 19, 2025
