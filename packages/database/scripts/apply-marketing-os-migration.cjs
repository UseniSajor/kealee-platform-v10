const fs = require('node:fs')
const path = require('node:path')
const { Client } = require('pg')
const dotenv = require('dotenv')

const envArgument = process.argv.find((argument) => argument.startsWith('--env='))
const envPath = envArgument
  ? path.resolve(process.cwd(), envArgument.slice('--env='.length))
  : path.resolve(__dirname, '..', '.env')
dotenv.config({ path: envPath, quiet: true })

const migrationPath = path.resolve(
  __dirname,
  '..',
  'supabase',
  'migrations',
  '20260609_marketing_os.sql',
)
const expectedTables = 30
const expectedAgents = 8
const expectedWorkflows = 5
const apply = process.argv.includes('--apply')

function createClient() {
  if (!process.env.DATABASE_URL) {
    throw new Error(`DATABASE_URL is not configured in ${envPath}`)
  }
  return new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false },
    connectionTimeoutMillis: 20_000,
    query_timeout: 120_000,
    application_name: 'kealee-marketing-os-migration',
  })
}

async function inspect(client) {
  const result = await client.query(`
    SELECT
      current_database() AS database_name,
      current_user AS database_user,
      current_setting('server_version_num')::integer AS server_version,
      (
        SELECT count(*)::integer
        FROM pg_tables
        WHERE schemaname = 'public'
          AND tablename LIKE 'marketing_os_%'
      ) AS table_count,
      to_regclass('public.marketing_os_states') IS NOT NULL AS migrated
  `)
  return result.rows[0]
}

async function verify(client) {
  const [tables, rls, policies, channels, agents, workflows] = await Promise.all([
    client.query(`
      SELECT count(*)::integer AS count
      FROM pg_tables
      WHERE schemaname = 'public'
        AND tablename LIKE 'marketing_os_%'
    `),
    client.query(`
      SELECT count(*)::integer AS count
      FROM pg_class c
      JOIN pg_namespace n ON n.oid = c.relnamespace
      WHERE n.nspname = 'public'
        AND c.relname LIKE 'marketing_os_%'
        AND c.relkind = 'r'
        AND c.relrowsecurity
    `),
    client.query(`
      SELECT count(*)::integer AS count
      FROM pg_policies
      WHERE schemaname = 'public'
        AND tablename LIKE 'marketing_os_%'
    `),
    client.query(`
      SELECT array_agg(e.enumlabel ORDER BY e.enumsortorder) AS values
      FROM pg_type t
      JOIN pg_enum e ON e.enumtypid = t.oid
      WHERE t.typname = 'marketing_os_channel'
    `),
    client.query('SELECT count(*)::integer AS count FROM marketing_os_agents'),
    client.query('SELECT count(*)::integer AS count FROM marketing_os_workflows'),
  ])

  const result = {
    tables: tables.rows[0].count,
    rlsTables: rls.rows[0].count,
    policies: policies.rows[0].count,
    channels: channels.rows[0].values,
    agents: agents.rows[0].count,
    workflows: workflows.rows[0].count,
  }
  const failures = []
  if (result.tables !== expectedTables) failures.push(`expected ${expectedTables} tables, found ${result.tables}`)
  if (result.rlsTables !== expectedTables) failures.push(`expected RLS on ${expectedTables} tables, found ${result.rlsTables}`)
  if (result.agents !== expectedAgents) failures.push(`expected ${expectedAgents} agents, found ${result.agents}`)
  if (result.workflows !== expectedWorkflows) failures.push(`expected ${expectedWorkflows} workflows, found ${result.workflows}`)
  for (const channel of ['direct', 'organic', 'paid_search', 'referral']) {
    if (!result.channels?.includes(channel)) failures.push(`missing channel enum value ${channel}`)
  }
  if (failures.length) throw new Error(`Migration verification failed: ${failures.join('; ')}`)
  return result
}

async function main() {
  const client = createClient()
  await client.connect()
  try {
    await client.query(`SELECT pg_advisory_lock(hashtext('kealee:marketing-os:migration'))`)
    const before = await inspect(client)
    console.log(JSON.stringify({ phase: 'preflight', envPath, ...before }))

    if (before.server_version < 150000) {
      throw new Error(`PostgreSQL 15+ is required; server version is ${before.server_version}`)
    }
    if (!before.migrated && before.table_count > 0) {
      throw new Error(`Refusing partial schema: found ${before.table_count} Marketing OS tables`)
    }
    if (!before.migrated) {
      if (!apply) {
        console.log(JSON.stringify({ phase: 'ready', migrationPath }))
        return
      }
      const sql = fs.readFileSync(migrationPath, 'utf8')
      await client.query(sql)
      console.log(JSON.stringify({ phase: 'applied', migrationPath }))
    } else {
      console.log(JSON.stringify({ phase: 'already_applied' }))
    }

    const verified = await verify(client)
    console.log(JSON.stringify({ phase: 'verified', ...verified }))
  } finally {
    await client.query(`SELECT pg_advisory_unlock(hashtext('kealee:marketing-os:migration'))`).catch(() => {})
    await client.end()
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error))
  process.exit(1)
})
