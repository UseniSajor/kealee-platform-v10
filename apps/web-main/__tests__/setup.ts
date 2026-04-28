/**
 * Jest test setup for web-main
 * Configures global mocks, environment variables, and test utilities
 */

// ── Environment variables for tests ──────────────────────────────────────────

process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co'
process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-service-role-key'
process.env.ANTHROPIC_API_KEY = 'test-anthropic-key'
process.env.ALLOW_TEST_INTAKE = 'true'

// ── Silence console.log/warn during tests ────────────────────────────────────
// Remove these if you want to see logs during test debugging

const originalConsoleLog = console.log
const originalConsoleWarn = console.warn

beforeAll(() => {
  console.log = jest.fn()
  console.warn = jest.fn()
})

afterAll(() => {
  console.log = originalConsoleLog
  console.warn = originalConsoleWarn
})

// ── Global fetch mock fallback ────────────────────────────────────────────────
if (!global.fetch) {
  global.fetch = jest.fn()
}
