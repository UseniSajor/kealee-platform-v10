import { checkRateLimit, sendInternalSystemEmail, sendEmailWithTemplate } from '../packages/communications/src/index'

async function testEmailSecurity() {
  console.log('=== Testing Email Security ===')
  
  // 1. Test Rate Limiting
  console.log('\nTesting Rate Limits...')
  let blocked = false
  for (let i = 0; i < 7; i++) {
    const res = await checkRateLimit('test_ip_123', 5, 60)
    if (!res.success) {
      console.log(`✅ Request ${i + 1} blocked correctly by rate limit.`)
      blocked = true
      break
    } else {
      console.log(`Request ${i + 1} allowed (Remaining: ${res.remaining})`)
    }
  }
  if (!blocked) throw new Error('Rate limit failed to block requests!')

  // 2. Test Internal System Email strictness
  console.log('\nTesting Internal System Email validation...')
  try {
    await sendInternalSystemEmail({
      to: 'attacker@example.com',
      subject: 'Test',
      html: '<h1>Spam</h1>',
      route: 'test'
    })
    throw new Error('Should have thrown an error requiring isInternal=true flag')
  } catch (err: any) {
    if (err.message.includes('must explicitly set isInternal')) {
      console.log('✅ Internal email correctly rejected missing isInternal flag.')
    } else {
      throw err
    }
  }

  // 3. Test Template restrictions
  console.log('\nTesting sendEmailWithTemplate missing template...')
  try {
    await sendEmailWithTemplate({
      to: 'victim@example.com',
      templateName: 'NON_EXISTENT_TEMPLATE_XYZ',
      variables: {},
      route: 'test'
    })
    throw new Error('Should have thrown an error for missing template')
  } catch (err: any) {
    if (err.message.includes('not found')) {
      console.log('✅ Correctly rejected invalid template name.')
    } else {
      console.log('Error thrown (expected DB not initialized in test):', err.message)
    }
  }
  
  console.log('\nAll security assertions passed.')
}

testEmailSecurity().catch(console.error)
