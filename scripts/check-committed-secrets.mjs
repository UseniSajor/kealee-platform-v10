import { execFile } from 'node:child_process'
import { readFileSync, statSync } from 'node:fs'
import { promisify } from 'node:util'

const execFileAsync = promisify(execFile)
const { stdout } = await execFileAsync('git', [
  'ls-files', '--cached', '--others', '--exclude-standard',
], { encoding: 'utf8', maxBuffer: 20 * 1024 * 1024 })
const files = stdout
  .split('\n')
  .filter(Boolean)

const rules = [
  ['JWT/API token', /eyJ[A-Za-z0-9_-]{20,}\.[A-Za-z0-9_-]{20,}\.[A-Za-z0-9_-]{20,}/g],
  ['Stripe live key', /(?:sk|rk)_live_[A-Za-z0-9]{12,}/g],
  ['Stripe webhook secret', /whsec_[A-Za-z0-9]{12,}/g],
  ['Anthropic key', /sk-ant-[A-Za-z0-9_-]{12,}/g],
  ['OpenAI key', /sk-proj-[A-Za-z0-9_-]{12,}/g],
  ['GitHub token', /gh[opusr]_[A-Za-z0-9]{20,}/g],
  ['AWS access key', /AKIA[0-9A-Z]{16}/g],
  ['SendGrid key', /SG\.[A-Za-z0-9_-]{12,}\.[A-Za-z0-9_-]{12,}/g],
  ['Railway token assignment', /RAILWAY_TOKEN\s*=\s*['"][0-9a-f]{8}-[0-9a-f-]{27,}['"]/gi],
  ['Vercel token assignment', /VERCEL_TOKEN\s*=\s*['"][A-Za-z0-9_-]{20,}['"]/gi],
  ['Credentialed Postgres URL', /postgres(?:ql)?:\/\/[^\s:'"]+:[^\s@'"]+@(?!(?:localhost|127\.0\.0\.1))[^\s'"]+/gi],
]

const findings = []
for (const file of files) {
  if (file === 'pnpm-lock.yaml') continue
  // Historical prose contains many intentionally redacted/example connection
  // strings. Executable sources, configs, workflows, and env templates remain
  // in scope.
  if (/\.(?:md|txt)$/i.test(file)) continue
  if (/\.(?:pdf|zip|docx|xlsx|png|jpe?g|gif|webp|ico|woff2?|ttf|mp4|mov|lnk)$/i.test(file)) continue
  let source
  try {
    if (statSync(file).size > 2 * 1024 * 1024) continue
    source = readFileSync(file, 'utf8')
  } catch {
    continue
  }
  if (source.includes('\0')) continue
  const lines = source.split(/\r?\n/)
  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index]
    if (/placeholder|your_[a-z_]*key|example|redacted|\$\{|host:port|postgres:postgres@|user:password|username:password|test:test@/i.test(line)) continue
    for (const [label, pattern] of rules) {
      pattern.lastIndex = 0
      if (pattern.test(line)) findings.push(`${file}:${index + 1} [${label}]`)
    }
  }
}

if (findings.length) {
  console.error('Potential committed credentials (values suppressed):')
  for (const finding of findings) console.error(`- ${finding}`)
  process.exit(1)
}

console.log('No committed credential patterns detected')
