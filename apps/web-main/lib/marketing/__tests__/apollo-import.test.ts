import { describe, expect, it } from 'vitest'
import { buildApolloSearchInput, loadApolloImportConfig, mapApolloPerson, runApolloImport } from '../apollo-import'

const enabledEnv = {
  APOLLO_IMPORT_ENABLED: 'true',
  APOLLO_API_KEY: 'test-key',
  APOLLO_ORGANIZATION_ID: '11111111-1111-1111-1111-111111111111',
  APOLLO_CAMPAIGN_ID: '22222222-2222-2222-2222-222222222222',
  APOLLO_AUDIENCE_JSON: JSON.stringify({
    personTitles: ['Owner', 'President'],
    organizationLocations: ['Washington, DC'],
    requireVerifiedEmail: true,
  }),
}

describe('Apollo import configuration', () => {
  it('fails closed without approved title and location rules', () => {
    expect(() => loadApolloImportConfig({
      ...enabledEnv,
      APOLLO_AUDIENCE_JSON: '{}',
    })).toThrow('requires at least one person title and organization location')
  })

  it('clamps run and daily caps', () => {
    const config = loadApolloImportConfig({
      ...enabledEnv,
      APOLLO_IMPORT_PER_RUN_CAP: '9999',
      APOLLO_IMPORT_DAILY_CAP: '9999',
    })
    expect(config.perRunCap).toBe(100)
    expect(config.dailyCap).toBe(500)
    expect(config.minIntervalMinutes).toBe(360)
  })

  it('maps only verified contacts and never authorizes outreach', () => {
    const config = loadApolloImportConfig(enabledEnv)
    const mapped = mapApolloPerson({
      id: 'apollo-person-1', name: 'Avery Builder', email: 'AVERY@EXAMPLE.COM',
      email_status: 'verified', title: 'Owner', city: 'Washington', state: 'DC',
      organization: { name: 'Builder Co', primary_domain: 'builder.example', industry: 'construction' },
    }, config)
    expect(mapped).toMatchObject({
      email: 'avery@example.com', sourceRecordId: 'apollo-person-1', requiresPayment: false,
      metadata: { importedForReview: true, outreachAuthorized: false },
    })
    expect(mapApolloPerson({ id: '2', name: 'No Verify', email: 'x@example.com', email_status: 'guessed' }, config)).toBeNull()
  })

  it('translates approved rules to an Apollo search request', () => {
    const config = loadApolloImportConfig(enabledEnv)
    expect(buildApolloSearchInput(config.audience)).toMatchObject({
      person_titles: ['Owner', 'President'],
      organization_locations: ['Washington, DC'],
      contact_email_status: ['verified'],
    })
  })

  it('performs no external work while disabled', async () => {
    await expect(runApolloImport({ env: { APOLLO_IMPORT_ENABLED: 'false' } })).resolves.toMatchObject({
      status: 'disabled', processed: 0, imported: 0,
    })
  })
})
