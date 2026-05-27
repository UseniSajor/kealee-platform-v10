#!/usr/bin/env node
import * as fs from 'node:fs'
import * as path from 'node:path'
import { createClient } from '@supabase/supabase-js'

function loadEnvFile(filePath, override = false) {
  if (!fs.existsSync(filePath)) return
  for (const raw of fs.readFileSync(filePath, 'utf-8').split('\n')) {
    const line = raw.trim()
    if (!line || line.startsWith('#')) continue
    const eq = line.indexOf('=')
    if (eq < 0) continue
    const key = line.slice(0, eq).trim()
    let val = line.slice(eq + 1).trim()
    if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'")))
      val = val.slice(1, -1)
    if (override || !process.env[key]) process.env[key] = val
  }
}

const ROOT = process.cwd()
loadEnvFile(path.join(ROOT, 'apps', 'web-main', '.env.test-pull'), true)

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { persistSession: false } },
)

const { data, error } = await supabase
  .from('public_intake_leads')
  .select('id, status, contact_email, project_path, form_data, updated_at')
  .order('updated_at', { ascending: false })
  .limit(10)

if (error) {
  console.error(error.message)
  process.exit(1)
}

for (const r of data ?? []) {
  const co = r.form_data?.conceptOutput ?? r.form_data?.v30ConceptOutput
  console.log(
    r.id,
    '|',
    r.status,
    '|',
    r.project_path,
    '|',
    co ? 'HAS_CONCEPT' : 'no_concept',
    '|',
    r.contact_email,
  )
}
