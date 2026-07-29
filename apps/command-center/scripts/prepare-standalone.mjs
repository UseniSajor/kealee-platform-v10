import { cp, mkdir, writeFile } from 'node:fs/promises'
import path from 'node:path'

const appRoot = process.cwd()
const standaloneRoot = path.join(appRoot, '.next', 'standalone')
const standaloneApp = path.join(standaloneRoot, 'apps', 'command-center')

await mkdir(standaloneRoot, { recursive: true })
await mkdir(path.join(standaloneApp, '.next'), { recursive: true })

await writeFile(
  path.join(standaloneRoot, 'server.js'),
  "require('./apps/command-center/server.js')\n",
)

await cp(
  path.join(appRoot, '.next', 'static'),
  path.join(standaloneApp, '.next', 'static'),
  { recursive: true },
)

await cp(
  path.join(appRoot, 'public'),
  path.join(standaloneApp, 'public'),
  { recursive: true },
)
