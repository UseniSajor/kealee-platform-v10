#!/usr/bin/env node
/**
 * Merge v30 env vars into apps/web-main, services/api, portal-admin .env.local
 * Keys source (first match): .env.v30.keys → apps/web-main/.env.v30.keys → process.env
 *
 * Usage: node scripts/apply-v30-env.mjs [--resolve-user-id]
 */
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')

const TARGETS = [
  'apps/web-main/.env.local',
  'services/api/.env.local',
  'apps/portal-admin/.env.local',
]

const V30_KEYS = [
  'KEALEE_V30_ENABLED',
  'NEXT_PUBLIC_KEALEE_V30_ENABLED',
  'KEALEE_V30_PUBLIC_USER_ID',
  'KEALEE_V30_LLM_ENABLED',
  'ANTHROPIC_API_KEY',
  'REPLICATE_API_TOKEN',
  'INTERNAL_API_URL',
  'NEXT_PUBLIC_API_URL',
  'PORTAL_ADMIN_PASSWORD',
  'PORTAL_ADMIN_SECRET',
]

function loadDotenv(filePath) {
  if (!fs.existsSync(filePath)) return {}
  const out = {}
  for (const line of fs.readFileSync(filePath, 'utf8').split('\n')) {
    const t = line.trim()
    if (!t || t.startsWith('#')) continue
    const i = t.indexOf('=')
    if (i === -1) continue
    const k = t.slice(0, i).trim()
    let v = t.slice(i + 1).trim()
    if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) {
      v = v.slice(1, -1)
    }
    out[k] = v
  }
  return out
}

function mergeEnvFile(targetPath, values) {
  const existing = fs.existsSync(targetPath) ? fs.readFileSync(targetPath, 'utf8') : ''
  const lines = existing.split('\n')
  const map = loadDotenv(targetPath)
  for (const [k, v] of Object.entries(values)) {
    if (v !== undefined && v !== '') map[k] = v
  }

  const stripKeys = new Set([
    ...V30_KEYS,
    'CLAUDE_ENABLED',
    'INTERNAL_LLM_ENABLED',
  ])
  const kept = lines.filter(line => {
    const t = line.trim()
    if (!t || t.startsWith('#')) return true
    const key = t.split('=')[0]?.trim()
    if (key?.startsWith('KEALEE_V30_') || key === 'NEXT_PUBLIC_KEALEE_V30_ENABLED') return false
    if (stripKeys.has(key ?? '')) return false
    return true
  })

  const block = [
    '',
    '# --- Kealee v30 (applied by scripts/apply-v30-env.mjs) ---',
    `KEALEE_V30_ENABLED=${map.KEALEE_V30_ENABLED ?? 'true'}`,
    `NEXT_PUBLIC_KEALEE_V30_ENABLED=${map.NEXT_PUBLIC_KEALEE_V30_ENABLED ?? 'true'}`,
    `KEALEE_V30_LLM_ENABLED=${map.KEALEE_V30_LLM_ENABLED ?? 'true'}`,
  ]
  if (map.KEALEE_V30_PUBLIC_USER_ID) block.push(`KEALEE_V30_PUBLIC_USER_ID=${map.KEALEE_V30_PUBLIC_USER_ID}`)
  if (map.ANTHROPIC_API_KEY) block.push(`ANTHROPIC_API_KEY=${map.ANTHROPIC_API_KEY}`)
  if (map.REPLICATE_API_TOKEN) block.push(`REPLICATE_API_TOKEN=${map.REPLICATE_API_TOKEN}`)
  if (map.INTERNAL_API_URL) block.push(`INTERNAL_API_URL=${map.INTERNAL_API_URL}`)
  if (targetPath.includes('portal-admin')) {
    block.push(`NEXT_PUBLIC_API_URL=${map.NEXT_PUBLIC_API_URL ?? map.INTERNAL_API_URL ?? 'http://127.0.0.1:3001'}`)
    if (map.PORTAL_ADMIN_PASSWORD) block.push(`PORTAL_ADMIN_PASSWORD=${map.PORTAL_ADMIN_PASSWORD}`)
    if (map.PORTAL_ADMIN_SECRET) block.push(`PORTAL_ADMIN_SECRET=${map.PORTAL_ADMIN_SECRET}`)
  }
  if (targetPath.includes('web-main') && map.NEXT_PUBLIC_API_URL) {
    block.push(`NEXT_PUBLIC_API_URL=${map.NEXT_PUBLIC_API_URL}`)
  }
  if (targetPath.includes('services/api') || targetPath.includes('services\\api')) {
    block.push('CLAUDE_ENABLED=true')
    block.push('INTERNAL_LLM_ENABLED=true')
  }

  fs.mkdirSync(path.dirname(targetPath), { recursive: true })
  fs.writeFileSync(targetPath, [...kept.filter(l => l.trim().length > 0), ...block, ''].join('\n'))
  console.log('Updated', targetPath)
}

async function resolvePublicUserId() {
  const dbEnv = loadDotenv(path.join(root, 'services/api/.env.local'))
  const dbUrl = dbEnv.DATABASE_URL || process.env.DATABASE_URL
  if (!dbUrl) return null
  try {
    const { PrismaClient } = await import('@prisma/client')
    const prisma = new PrismaClient({ datasources: { db: { url: dbUrl } } })
    const user = await prisma.user.findFirst({
      where: { email: { not: undefined } },
      orderBy: { createdAt: 'asc' },
      select: { id: true, email: true },
    })
    await prisma.$disconnect()
    if (user) {
      console.log('Resolved KEALEE_V30_PUBLIC_USER_ID from User:', user.email)
      return user.id
    }
  } catch (e) {
    console.warn('Could not resolve User.id:', e.message)
  }
  return null
}

async function main() {
  const keyFiles = [
    path.join(root, '.env.v30.keys'),
    path.join(root, 'apps/web-main/.env.v30.keys'),
  ]
  const anthropicTxt = path.join(root, 'Kealee Platform Agents/Anthropic.txt')
  let source = {}
  for (const f of keyFiles) {
    if (fs.existsSync(f)) {
      source = { ...source, ...loadDotenv(f) }
      console.log('Loaded keys from', f)
      break
    }
  }
  const inheritFrom = [
    path.join(root, 'services/api/.env.local'),
    path.join(root, 'apps/web-main/.env.local'),
    path.join(root, '.env.local'),
  ]
  for (const f of inheritFrom) {
    if (!fs.existsSync(f)) continue
    const inherited = loadDotenv(f)
    for (const k of ['ANTHROPIC_API_KEY', 'REPLICATE_API_TOKEN', 'DATABASE_URL']) {
      if (!source[k] && inherited[k]) source[k] = inherited[k]
    }
  }
  if (!source.ANTHROPIC_API_KEY && fs.existsSync(anthropicTxt)) {
    const key = fs.readFileSync(anthropicTxt, 'utf8').trim()
    if (key.startsWith('sk-ant-')) {
      source.ANTHROPIC_API_KEY = key
      console.log('Loaded ANTHROPIC_API_KEY from Kealee Platform Agents/Anthropic.txt')
    }
  }
  for (const k of V30_KEYS) {
    if (process.env[k]) source[k] = process.env[k]
  }

  source.KEALEE_V30_ENABLED = source.KEALEE_V30_ENABLED || 'true'
  source.NEXT_PUBLIC_KEALEE_V30_ENABLED = source.NEXT_PUBLIC_KEALEE_V30_ENABLED || 'true'
  source.KEALEE_V30_LLM_ENABLED = source.KEALEE_V30_LLM_ENABLED || 'true'
  source.INTERNAL_API_URL = source.INTERNAL_API_URL || 'http://127.0.0.1:3001'
  source.NEXT_PUBLIC_API_URL = source.NEXT_PUBLIC_API_URL || source.INTERNAL_API_URL
  source.PORTAL_ADMIN_PASSWORD = source.PORTAL_ADMIN_PASSWORD || 'kealee-admin-dev'
  source.PORTAL_ADMIN_SECRET = source.PORTAL_ADMIN_SECRET || source.PORTAL_ADMIN_PASSWORD

  if (process.argv.includes('--resolve-user-id') || !source.KEALEE_V30_PUBLIC_USER_ID) {
    const uid = await resolvePublicUserId()
    if (uid) source.KEALEE_V30_PUBLIC_USER_ID = uid
  }

  if (!source.ANTHROPIC_API_KEY) {
    console.warn('ANTHROPIC_API_KEY missing — add to .env.v30.keys (see .env.v30.keys.example)')
  }
  if (!source.REPLICATE_API_TOKEN) {
    console.warn('REPLICATE_API_TOKEN missing — add to .env.v30.keys for renders')
  }

  for (const rel of TARGETS) {
    mergeEnvFile(path.join(root, rel), source)
  }

  console.log('\nDone. Restart API (3001), web-main (3000), portal-admin (3020).')
}

main().catch(err => {
  console.error(err)
  process.exit(1)
})
