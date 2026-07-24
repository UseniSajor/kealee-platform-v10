import { cp, mkdir, readFile, readdir, rm, writeFile } from 'node:fs/promises'
import path from 'node:path'

const root = process.cwd()
const template = path.join(root, 'apps/project-owner/android')
const apps = [
  {
    dir: 'apps/command-center',
    packageId: 'com.kealee.commandcenter',
    host: 'command.kealee.com',
    name: 'Kealee Command Center',
    launcher: 'Command Center',
    start: '/command-center',
  },
  {
    dir: 'apps/os-admin',
    packageId: 'com.kealee.admin',
    host: 'admin.kealee.com',
    name: 'Kealee Admin',
    launcher: 'Kealee Admin',
    start: '/',
  },
  {
    dir: 'apps/web-main',
    packageId: 'com.kealee.app',
    host: 'kealee.com',
    name: 'Kealee',
    launcher: 'Kealee',
    start: '/',
  },
]

async function textFiles(directory) {
  const result = []
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const item = path.join(directory, entry.name)
    if (entry.isDirectory()) result.push(...await textFiles(item))
    else if (!/\.(png|ico|jar|keystore|aab|apk)$/i.test(entry.name)) result.push(item)
  }
  return result
}

for (const app of apps) {
  const target = path.join(root, app.dir, 'android')
  await rm(target, { recursive: true, force: true })
  await mkdir(target, { recursive: true })
  await cp(template, target, {
    recursive: true,
    filter: (source) => !/(android\.keystore|play-signing\.local\.json|build\/|\.gradle\/)/.test(source),
  })

  const replacements = [
    ['com.kealee.projectowner', app.packageId],
    ['owner.kealee.com', app.host],
    ['Kealee Project Owner', app.name],
    ['Kealee Owner', app.launcher],
    ['/projects', app.start],
  ]
  for (const file of await textFiles(target)) {
    let value = await readFile(file, 'utf8')
    for (const [from, to] of replacements) value = value.replaceAll(from, to)
    await writeFile(file, value)
  }

  const manifestFile = path.join(target, 'twa-manifest.json')
  const manifest = JSON.parse(await readFile(manifestFile, 'utf8'))
  manifest.packageId = app.packageId
  manifest.host = app.host
  manifest.name = app.name
  manifest.launcherName = app.launcher
  manifest.startUrl = app.start
  manifest.iconUrl = `https://${app.host}/kealee-icon-512x512.png`
  manifest.webManifestUrl = `https://${app.host}/site.webmanifest`
  manifest.fullScopeUrl = `https://${app.host}/`
  await writeFile(manifestFile, `${JSON.stringify(manifest, null, 2)}\n`)
}

console.log(`Created ${apps.length} Android TWA projects from the verified Project Owner template.`)
