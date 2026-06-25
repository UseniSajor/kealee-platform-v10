#!/usr/bin/env node
/**
 * Set missing marketing env vars on Railway via GraphQL.
 * Requires: RAILWAY_TOKEN (account or project token)
 *
 * Usage:
 *   RAILWAY_TOKEN=... node scripts/railway-set-marketing-env.mjs
 *   node scripts/railway-set-marketing-env.mjs --dry-run
 */

import fs from 'node:fs'
import crypto from 'node:crypto'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const repoRoot = path.resolve(__dirname, '..')
const dryRun = process.argv.includes('--dry-run')

const PROJECT_ID = '8187fcf6-9916-49aa-bc75-77407f83d319'
const ENV_ID = 'ff19d499-942b-4668-9a26-a21ecb20e349'

const SERVICE_NAMES = {
  webMain: 'web-main',
  api: 'kealee-platform-v10',
  crons: [
    'marketing-cron-lead-scoring',
    'marketing-cron-sequences',
    'marketing-cron-requalify-cold',
    'marketing-cron-parcel-enrichment',
    'marketing-cron-parcel-outreach',
    'marketing-cron-marketing-drip',
  ],
}

const API_KEYS = new Set([
  'NODE_ENV', 'DATABASE_URL', 'SUPABASE_URL', 'SUPABASE_ANON_KEY', 'SUPABASE_SERVICE_ROLE_KEY',
  'STRIPE_SECRET_KEY', 'STRIPE_WEBHOOK_SECRET', 'RESEND_API_KEY', 'ANTHROPIC_API_KEY',
  'CRON_SECRET', 'KEALEE_OPS_SECRET', 'REPLICATE_API_TOKEN', 'OPENAI_API_KEY',
])

const CRON_KEYS = new Set(['CRON_SECRET', 'APP_URL', 'NODE_ENV'])

function loadToken() {
  if (process.env.RAILWAY_TOKEN) return process.env.RAILWAY_TOKEN

  const cliEnv = path.join(repoRoot, 'env-templates', 'railway-cli.env')
  if (fs.existsSync(cliEnv)) {
    for (const line of fs.readFileSync(cliEnv, 'utf8').split('\n')) {
      const m = line.match(/^\s*RAILWAY_TOKEN\s*=\s*(\S+)/)
      if (m) return m[1]
    }
  }

  const deployBat = path.join(repoRoot, 'deploy.bat')
  if (fs.existsSync(deployBat)) {
    const m = fs.readFileSync(deployBat, 'utf8').match(/RAILWAY_TOKEN=([a-f0-9-]{36})/i)
    if (m) return m[1]
  }

  const notes = path.join(repoRoot, 'Railway Feb 2026.txt')
  if (fs.existsSync(notes)) {
    const raw = fs.readFileSync(notes, 'utf8')
    const labeled = raw.match(/railway token:\s*([a-f0-9-]{36})/i)
    if (labeled) return labeled[1]
  }

  return null
}

function parseEnvFile(filePath) {
  const map = {}
  if (!fs.existsSync(filePath)) return map
  for (const line of fs.readFileSync(filePath, 'utf8').split('\n')) {
    if (!line || line.trim().startsWith('#') || !line.includes('=')) continue
    const idx = line.indexOf('=')
    const k = line.slice(0, idx).trim()
    const v = line.slice(idx + 1).trim().replace(/^"|"$/g, '')
    if (v && !/^(your_|sk-ant-api03-your|re_your|price_xxx|\.\.\.)/.test(v)) map[k] = v
  }
  return map
}

function parseSetEnvPs1(filePath) {
  const map = {}
  if (!fs.existsSync(filePath)) return map
  const content = fs.readFileSync(filePath, 'utf8')
  for (const m of content.matchAll(/"([A-Z0-9_]+)"\s*=\s*"([^"]*)"/g)) {
    map[m[1]] = m[2]
  }
  return map
}

function buildVarMap() {
  const vars = {
    NODE_ENV: 'production',
    NEXT_PUBLIC_APP_ENV: 'production',
    NEXT_PUBLIC_APP_URL: 'https://kealee.com',
    NEXT_PUBLIC_API_URL: 'https://api.kealee.com',
    INTERNAL_API_URL: 'https://api.kealee.com',
    NEXT_PUBLIC_OWNER_PORTAL_URL: 'https://owner.kealee.com',
    NEXT_PUBLIC_SITE_URL: 'https://kealee.com',
    APP_URL: 'https://kealee.com',
    KEALEE_V30_ENABLED: 'true',
    NEXT_PUBLIC_KEALEE_V30_ENABLED: 'true',
    NEXT_PUBLIC_KEALEE_PHONE_DISPLAY: '(301) 575-8777',
    NEXT_PUBLIC_KEALEE_PHONE_E164: '+13015758777',
    SUPABASE_AUTH_REDIRECT_URL: 'https://kealee.com/auth/callback',
    ALLOW_ANONYMOUS_EDITOR: 'true',
  }

  const sources = [
    path.join(repoRoot, 'set-env-vars.ps1'),
    path.join(repoRoot, 'apps', 'web-main', 'railway.env.example'),
    path.join(repoRoot, 'apps', 'web-main', '.env.local'),
    path.join(repoRoot, 'apps', 'web-main', '.env.verify'),
    path.join(repoRoot, 'services', 'api', '.env'),
    path.join(repoRoot, 'services', 'api', '.env.local'),
    path.join(repoRoot, 'railway-env-paste-web-main.txt'),
  ]

  for (const src of sources) {
    const parsed = src.endsWith('.ps1') ? parseSetEnvPs1(src) : parseEnvFile(src)
    Object.assign(vars, parsed)
  }

  if (!vars.NEXT_PUBLIC_SUPABASE_URL && vars.SUPABASE_URL) {
    vars.NEXT_PUBLIC_SUPABASE_URL = vars.SUPABASE_URL
  }
  if (!vars.NEXT_PUBLIC_SUPABASE_ANON_KEY && vars.SUPABASE_ANON_KEY) {
    vars.NEXT_PUBLIC_SUPABASE_ANON_KEY = vars.SUPABASE_ANON_KEY
  }
  if (!vars.CRON_SECRET) {
    vars.CRON_SECRET = crypto.randomBytes(32).toString('hex')
    console.log('Generated CRON_SECRET')
  }
  if (!vars.KEALEE_OPS_SECRET) vars.KEALEE_OPS_SECRET = vars.CRON_SECRET

  return vars
}

async function gql(token, query, variables = {}) {
  const res = await fetch('https://backboard.railway.com/graphql/v2', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ query, variables }),
  })
  const json = await res.json()
  if (json.errors?.length) {
    throw new Error(json.errors.map((e) => e.message).join('; '))
  }
  return json.data
}

async function main() {
  const token = loadToken()
  if (!token) {
    console.error('No RAILWAY_TOKEN. Save token to env-templates/railway-cli.env')
    process.exit(1)
  }

  const me = await gql(token, '{ me { name email } }')
  console.log(`Authenticated as ${me.me?.name || me.me?.email || 'ok'}`)

  const project = await gql(
    token,
    `query($id: String!) {
      project(id: $id) {
        name
        services { edges { node { id name } } }
      }
    }`,
    { id: PROJECT_ID },
  )

  const services = Object.fromEntries(
    project.project.services.edges.map(({ node }) => [node.name, node.id]),
  )
  console.log(`Project: ${project.project.name}`)
  console.log('Services:', Object.keys(services).sort().join(', '))

  const vars = buildVarMap()

  async function getExisting(serviceId) {
    const data = await gql(
      token,
      `query($projectId: String!, $environmentId: String!, $serviceId: String!) {
        variables(projectId: $projectId, environmentId: $environmentId, serviceId: $serviceId)
      }`,
      { projectId: PROJECT_ID, environmentId: ENV_ID, serviceId },
    )
    return data.variables || {}
  }

  async function upsertMissing(serviceName, onlyKeys) {
    const serviceId = services[serviceName]
    if (!serviceId) {
      console.warn(`SKIP ${serviceName} — service not found in Railway project`)
      return
    }

    const existing = await getExisting(serviceId)
    const toSet = {}
    for (const [k, v] of Object.entries(vars)) {
      if (onlyKeys && !onlyKeys.has(k)) continue
      if (!v || existing[k]) continue
      toSet[k] = v
    }

    if (!Object.keys(toSet).length) {
      console.log(`${serviceName}: nothing to add`)
      return
    }

    console.log(`${serviceName}: setting ${Object.keys(toSet).length} vars`)
    for (const [name, value] of Object.entries(toSet)) {
      const display = /SECRET|KEY|TOKEN|PASSWORD/i.test(name) ? '***' : value
      if (dryRun) {
        console.log(`  [dry-run] ${name}=${display}`)
        continue
      }
      await gql(
        token,
        `mutation($input: VariableUpsertInput!) {
          variableUpsert(input: $input, skipDeploys: true)
        }`,
        {
          input: {
            projectId: PROJECT_ID,
            environmentId: ENV_ID,
            serviceId,
            name,
            value,
          },
        },
      )
      console.log(`  set ${name}=${display}`)
    }
  }

  await upsertMissing(SERVICE_NAMES.webMain, null)
  await upsertMissing(SERVICE_NAMES.api, API_KEYS)
  for (const cron of SERVICE_NAMES.crons) {
    await upsertMissing(cron, CRON_KEYS)
  }

  console.log('\nDone. Redeploy web-main for NEXT_PUBLIC_* build-time vars.')
}

main().catch((e) => {
  console.error(e.message || e)
  process.exit(1)
})
