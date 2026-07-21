import { config } from 'dotenv'
import { resolve } from 'path'

// Load .env.local file ONLY in development (for local development)
if (process.env.NODE_ENV !== 'production') {
  // Load .env.local file (for API service) - only exists locally, gitignored
  config({ path: resolve(process.cwd(), '.env.local') })
  // Ensure local dev picks up the database package's connection string.
  config({ path: resolve(process.cwd(), '../../packages/database/.env'), override: true })
}
