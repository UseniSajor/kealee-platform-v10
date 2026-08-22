import { readdir, readFile, mkdir, writeFile } from 'node:fs/promises'
import path from 'node:path'

const roots = ['apps', 'packages', 'services', 'bots']
const productionNames = new Set([
  'web-main', 'portal-owner', 'portal-contractor', 'portal-developer',
  'os-admin', 'm-marketplace', '@kealee/api', '@kealee/command-center',
  '@kealee/database', '@kealee/auth', '@kealee/core-ai-gateway',
  '@kealee/observability', '@kealee/queue', '@kealee/automation',
])

function lifecycle(file, manifest) {
  const name = manifest.name ?? path.basename(path.dirname(file))
  if (productionNames.has(name)) return 'production'
  if (file.startsWith('bots/')) return 'duplicate'
  if (/^(apps|services)\/(api|api-service|worker|os-|keabots|orgbots)/.test(file)) return 'duplicate'
  if (file.startsWith('packages/')) return 'supporting'
  return 'experimental'
}

const records = []
for (const root of roots) {
  for (const entry of await readdir(root, { withFileTypes: true })) {
    if (!entry.isDirectory()) continue
    const file = path.join(root, entry.name, 'package.json')
    try {
      const manifest = JSON.parse(await readFile(file, 'utf8'))
      records.push({
        path: path.dirname(file),
        name: manifest.name ?? entry.name,
        lifecycle: lifecycle(file, manifest),
        private: manifest.private === true,
        build: manifest.scripts?.build ?? null,
        start: manifest.scripts?.start ?? null,
      })
    } catch (error) {
      if (error?.code !== 'ENOENT') throw error
    }
  }
}

records.sort((a, b) => a.path.localeCompare(b.path))
const counts = records.reduce((result, record) => {
  result[record.lifecycle] = (result[record.lifecycle] ?? 0) + 1
  return result
}, {})

await mkdir('reports/platform', { recursive: true })
await writeFile(
  'reports/platform/workspace-inventory.json',
  `${JSON.stringify({ generatedAt: new Date().toISOString(), counts, records }, null, 2)}\n`,
)
console.log(`Inventoried ${records.length} workspaces`, counts)
