import { execFile } from 'node:child_process'
import { readFile, writeFile } from 'node:fs/promises'
import { promisify } from 'node:util'

const roots = ['apps', 'packages', 'services', 'bots']
const baselinePath = 'config/provider-boundary-baseline.json'
const sourcePattern = /\.(?:ts|tsx|js|mjs)$/
const directAi = /(?:(?:from\s+|import\()\s*['"](?:@anthropic-ai\/sdk|openai|replicate)['"]|require\(['"](?:@anthropic-ai\/sdk|openai|replicate)['"]\))/
const supabaseAuth = /(?:supabase\.auth\.|@supabase\/auth-helpers)/

const execFileAsync = promisify(execFile)
const { stdout } = await execFileAsync('git', [
  'ls-files', '--cached', '--others', '--exclude-standard', '--', ...roots,
], { maxBuffer: 10 * 1024 * 1024 })
const files = stdout.split('\n').filter((file) => sourcePattern.test(file))

const violations = { directAi: [], supabaseAuth: [] }
for (const file of files) {
  let source
  try {
    source = await readFile(file, 'utf8')
  } catch (error) {
    // `git ls-files --cached` includes tracked files deleted in the worktree.
    if (error?.code === 'ENOENT') continue
    throw error
  }
  if (directAi.test(source) && !file.startsWith('packages/core-llm/')) violations.directAi.push(file)
  if (supabaseAuth.test(source) && !file.startsWith('packages/auth/')) violations.supabaseAuth.push(file)
}
for (const values of Object.values(violations)) values.sort()

if (process.argv.includes('--write')) {
  await writeFile(baselinePath, `${JSON.stringify(violations, null, 2)}\n`)
  console.log('Wrote provider-boundary migration baseline', Object.fromEntries(Object.entries(violations).map(([key, value]) => [key, value.length])))
  process.exit(0)
}

const baseline = JSON.parse(await readFile(baselinePath, 'utf8'))
const additions = Object.fromEntries(Object.entries(violations).map(([key, values]) => {
  const allowed = new Set(baseline[key] ?? [])
  return [key, values.filter((file) => !allowed.has(file))]
}))
const newViolations = Object.values(additions).flat()
if (newViolations.length) {
  console.error('New provider-boundary violations:', additions)
  process.exit(1)
}
console.log('No new direct AI-provider or Supabase Auth dependencies')
