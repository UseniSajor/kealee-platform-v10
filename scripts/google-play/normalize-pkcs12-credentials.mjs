import { readFile, writeFile } from 'node:fs/promises'
import path from 'node:path'

for (const appDir of process.argv.slice(2)) {
  const file = path.resolve(appDir, 'android/play-signing.local.json')
  const credentials = JSON.parse(await readFile(file, 'utf8'))
  credentials.keyPassword = credentials.keyStorePassword
  await writeFile(file, `${JSON.stringify(credentials, null, 2)}\n`, { mode: 0o600 })
}
