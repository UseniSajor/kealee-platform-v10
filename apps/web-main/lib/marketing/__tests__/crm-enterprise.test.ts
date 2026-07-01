import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { isEnterpriseCrmEnabled, isNativeDripMode } from '../crm-enterprise'

describe('crm-enterprise', () => {
  const env = process.env

  beforeEach(() => {
    process.env = { ...env }
    delete process.env.KEALEE_ENTERPRISE_CRM_ENABLED
    delete process.env.GHL_API_KEY
    delete process.env.GHL_LOCATION_ID
    delete process.env.HUBSPOT_API_KEY
    delete process.env.HUBSPOT_ACCESS_TOKEN
  })

  afterEach(() => {
    process.env = env
  })

  it('defaults to native drip when enterprise flag is off', () => {
    process.env.GHL_API_KEY = 'test'
    process.env.GHL_LOCATION_ID = 'loc'
    expect(isEnterpriseCrmEnabled()).toBe(false)
    expect(isNativeDripMode()).toBe(true)
  })

  it('enables enterprise CRM only with flag and credentials', () => {
    process.env.KEALEE_ENTERPRISE_CRM_ENABLED = 'true'
    process.env.HUBSPOT_ACCESS_TOKEN = 'hs-token'
    expect(isEnterpriseCrmEnabled()).toBe(true)
    expect(isNativeDripMode()).toBe(false)
  })
})
