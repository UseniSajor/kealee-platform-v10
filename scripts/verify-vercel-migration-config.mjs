import { readFile } from 'node:fs/promises'

const catalog = JSON.parse(await readFile('config/vercel-projects.json', 'utf8'))
if (catalog.migrationState !== 'planned') {
  throw new Error('Vercel must remain planned until the Railway-to-Vercel cutover is authorized')
}

const apps = new Set()
const domains = new Set()
for (const project of catalog.projects) {
  if (apps.has(project.app)) throw new Error(`Duplicate Vercel app: ${project.app}`)
  if (domains.has(project.domain)) throw new Error(`Duplicate Vercel domain: ${project.domain}`)
  apps.add(project.app)
  domains.add(project.domain)
  if (!project.projectId && !project.action) {
    throw new Error(`Missing project ID/action for ${project.app}`)
  }
}
console.log(`Validated ${catalog.projects.length} planned Vercel projects; Railway remains active`)
