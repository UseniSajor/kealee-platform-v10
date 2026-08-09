#!/usr/bin/env node
/**
 * Create marketing cron services on Railway, set root directories, sync env, deploy.
 *
 * Prereq: valid RAILWAY_TOKEN (account or project token)
 *   railway login
 *   # or save token to env-templates/railway-cli.env
 *
 * Usage:
 *   node scripts/railway-setup-marketing-crons.mjs
 *   node scripts/railway-setup-marketing-crons.mjs --dry-run
 *   node scripts/railway-setup-marketing-crons.mjs --skip-deploy
 */

import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const repoRoot = path.resolve(__dirname, '..')

const dryRun = process.argv.includes('--dry-run')
const skipDeploy = process.argv.includes('--skip-deploy')

const PROJECT_ID = '8187fcf6-9916-49aa-bc75-77407f83d319'
const ENV_ID = 'ff19d499-942b-4668-9a26-a21ecb20e349'
const GITHUB_REPO = 'UseniSajor/kealee-platform-v10'

/** @type {Record<string, { root: string, schedule: string }>} */
const CRON_SERVICES = {
  'marketing-cron-lead-scoring': { root: 'services/marketing-cron-lead-scoring', schedule: '0 11 * * *' },
  'marketing-cron-sequences': { root: 'services/marketing-cron-sequences', schedule: '0 10 * * *' },
  'marketing-cron-requalify-cold': { root: 'services/marketing-cron-requalify-cold', schedule: '0 9 * * *' },
  'marketing-cron-parcel-enrichment': { root: 'services/marketing-cron-parcel-enrichment', schedule: '0 12 * * *' },
  'marketing-cron-parcel-outreach': { root: 'services/marketing-cron-parcel-outreach', schedule: '0 13 * * *' },
  'marketing-cron-marketing-drip': { root: 'services/marketing-cron-marketing-drip', schedule: '0 14 * * *' },
}

const WEB_MAIN_SERVICE = 'web-main'
const API_SERVICE = 'kealee-platform-v10'

function loadToken() {
  if (process.env.RAILWAY_TOKEN) return process.env.RAILWAY_TOKEN

  const cliEnv = path.join(repoRoot, 'env-templates', 'railway-cli.env')
  if (fs.existsSync(cliEnv)) {
    for (const line of fs.readFileSync(cliEnv, 'utf8').split('\n')) {
      const m = line.match(/^\s*RAILWAY_TOKEN\s*=\s*(\S+)/)
      if (m) return m[1]
    }
  }

  const notes = path.join(repoRoot, 'Railway Feb 2026.txt')
  if (fs.existsSync(notes)) {
    const labeled = fs.readFileSync(notes, 'utf8').match(/railway token:\s*([a-f0-9-]{36})/i)
    if (labeled) return labeled[1]
  }

  return null
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

async function getProjectServices(token) {
  const data = await gql(
    token,
    `query($id: String!) {
      project(id: $id) {
        name
        services {
          edges {
            node {
              id
              name
              serviceInstances {
                edges {
                  node {
                    id
                    rootDirectory
                    cronSchedule
                    source {
                      repo
                    }
                  }
                }
              }
            }
          }
        }
      }
    }`,
    { id: PROJECT_ID },
  )

  const byName = {}
  for (const { node } of data.project.services.edges) {
    const instance = node.serviceInstances?.edges?.[0]?.node ?? null
    byName[node.name] = { id: node.id, instance }
  }
  return { projectName: data.project.name, byName }
}

async function createService(token, name) {
  console.log(`  create service: ${name}`)
  if (dryRun) return `dry-run-${name}`

  const data = await gql(
    token,
    `mutation($input: ServiceCreateInput!) {
      serviceCreate(input: $input) {
        id
        name
      }
    }`,
    {
      input: {
        projectId: PROJECT_ID,
        name,
        source: { repo: GITHUB_REPO },
      },
    },
  )
  return data.serviceCreate.id
}

async function connectRepo(token, serviceId) {
  console.log(`  connect repo: ${GITHUB_REPO}`)
  if (dryRun) return

  await gql(
    token,
    `mutation($id: String!, $input: ServiceConnectInput!) {
      serviceConnect(id: $id, input: $input)
    }`,
    {
      id: serviceId,
      input: { repo: GITHUB_REPO },
    },
  )
}

async function updateInstance(token, serviceId, input) {
  if (dryRun) {
    console.log(`  [dry-run] serviceInstanceUpdate`, input)
    return
  }

  await gql(
    token,
    `mutation($serviceId: String!, $environmentId: String!, $input: ServiceInstanceUpdateInput!) {
      serviceInstanceUpdate(
        serviceId: $serviceId
        environmentId: $environmentId
        input: $input
      )
    }`,
    { serviceId, environmentId: ENV_ID, input },
  )
}

async function upsertVar(token, serviceId, name, value) {
  const display = /SECRET|KEY|TOKEN|PASSWORD/i.test(name) ? '***' : value
  if (dryRun) {
    console.log(`    [dry-run] ${name}=${display}`)
    return
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
  console.log(`    set ${name}=${display}`)
}

async function getVars(token, serviceId) {
  const data = await gql(
    token,
    `query($projectId: String!, $environmentId: String!, $serviceId: String!) {
      variables(projectId: $projectId, environmentId: $environmentId, serviceId: $serviceId)
    }`,
    { projectId: PROJECT_ID, environmentId: ENV_ID, serviceId },
  )
  return data.variables || {}
}

async function deployService(token, serviceId) {
  console.log(`  deploy service ${serviceId}`)
  if (dryRun) return

  await gql(
    token,
    `mutation($serviceId: String!, $environmentId: String!) {
      serviceInstanceDeployV2(serviceId: $serviceId, environmentId: $environmentId)
    }`,
    { serviceId, environmentId: ENV_ID },
  )
}

function loadCronEnvFromWebMain() {
  const paste = path.join(repoRoot, 'railway-env-paste-web-main.txt')
  const map = {}
  if (!fs.existsSync(paste)) return map
  for (const line of fs.readFileSync(paste, 'utf8').split('\n')) {
    if (!line.includes('=')) continue
    const idx = line.indexOf('=')
    map[line.slice(0, idx).trim()] = line.slice(idx + 1).trim()
  }
  return map
}

async function syncCronEnv(token, serviceId, serviceName, webMainVars) {
  const existing = await getVars(token, serviceId)
  const needed = {
    NODE_ENV: 'production',
    APP_URL: webMainVars.APP_URL || 'https://kealee.com',
    CRON_SECRET: webMainVars.CRON_SECRET,
  }

  for (const [name, value] of Object.entries(needed)) {
    if (!value) {
      console.warn(`  ${serviceName}: skip ${name} — not set on web-main`)
      continue
    }
    if (existing[name] === value) continue
    await upsertVar(token, serviceId, name, value)
  }
}

async function ensureCronService(token, name, config, servicesByName) {
  console.log(`\n=== ${name} ===`)
  let serviceId = servicesByName[name]?.id
  const instance = servicesByName[name]?.instance

  if (!serviceId) {
    serviceId = await createService(token, name)
    await connectRepo(token, serviceId)
  } else if (!instance?.source?.repo) {
    await connectRepo(token, serviceId)
  }

  const needsRoot = !instance?.rootDirectory || instance.rootDirectory !== config.root
  const needsCron = !instance?.cronSchedule || instance.cronSchedule !== config.schedule

  if (needsRoot || needsCron) {
    const input = {}
    if (needsRoot) input.rootDirectory = config.root
    if (needsCron) input.cronSchedule = config.schedule
    console.log(`  update instance:`, input)
    await updateInstance(token, serviceId, input)
  } else {
    console.log(`  root + cron schedule OK (${config.root})`)
  }

  return serviceId
}

async function main() {
  const token = loadToken()
  if (!token) {
    console.error('No valid RAILWAY_TOKEN. Run: railway login')
    console.error('Then save token to env-templates/railway-cli.env')
    process.exit(1)
  }

  const me = await gql(token, '{ me { name email } }')
  console.log(`Authenticated: ${me.me?.email || me.me?.name || 'ok'}`)

  const { projectName, byName } = await getProjectServices(token)
  console.log(`Project: ${projectName} (${PROJECT_ID})`)
  console.log('Existing services:', Object.keys(byName).sort().join(', '))

  const webMainId = byName[WEB_MAIN_SERVICE]?.id
  if (!webMainId) {
    throw new Error(`Service not found: ${WEB_MAIN_SERVICE}`)
  }

  const webMainVars = await getVars(token, webMainId)
  if (!webMainVars.CRON_SECRET) {
    const paste = loadCronEnvFromWebMain()
    if (paste.CRON_SECRET) {
      console.log('\nSyncing CRON_SECRET from railway-env-paste-web-main.txt to web-main')
      await upsertVar(token, webMainId, 'CRON_SECRET', paste.CRON_SECRET)
      if (paste.KEALEE_OPS_SECRET) {
        await upsertVar(token, webMainId, 'KEALEE_OPS_SECRET', paste.KEALEE_OPS_SECRET)
      }
      webMainVars.CRON_SECRET = paste.CRON_SECRET
    }
  }

  if (!webMainVars.PARCEL_USE_LOCAL_ASSESSOR) {
    console.log('\nSetting PARCEL_USE_LOCAL_ASSESSOR=true on web-main')
    await upsertVar(token, webMainId, 'PARCEL_USE_LOCAL_ASSESSOR', 'true')
  }

  const serviceIds = {}
  for (const [name, config] of Object.entries(CRON_SERVICES)) {
    serviceIds[name] = await ensureCronService(token, name, config, byName)
    await syncCronEnv(token, serviceIds[name], name, webMainVars)
  }

  if (!skipDeploy) {
    console.log('\n=== Deploy cron services ===')
    for (const name of Object.keys(CRON_SERVICES)) {
      await deployService(token, serviceIds[name])
      console.log(`  deployed ${name}`)
    }

    console.log('\n=== Redeploy web-main ===')
    await deployService(token, webMainId)
  }

  console.log('\nDone.')
  console.log('Verify: cd apps/web-main && CRON_SECRET=... pnpm run test:marketing-e2e')
}

main().catch((e) => {
  console.error(e.message || e)
  process.exit(1)
})
