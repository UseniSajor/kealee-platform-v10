import { createHash } from 'node:crypto'
import { readFile, writeFile } from 'node:fs/promises'
import { spawnSync } from 'node:child_process'
import path from 'node:path'
import process from 'node:process'

const appDir = process.argv[2]
if (!appDir) throw new Error('Usage: node scripts/google-play/build-release.mjs apps/<app>')
const androidDir = path.resolve(appDir, 'android')
const credentials = JSON.parse(await readFile(path.join(androidDir, 'play-signing.local.json'), 'utf8'))
const manifest = await readFile(path.join(androidDir, 'twa-manifest.json'))
await writeFile(
  path.join(androidDir, 'manifest-checksum.txt'),
  createHash('sha1').update(manifest).digest('hex'),
)
const result = spawnSync('bubblewrap', ['build'], {
  cwd: androidDir,
  env: {
    ...process.env,
    BUBBLEWRAP_KEYSTORE_PASSWORD: credentials.keyStorePassword,
    BUBBLEWRAP_KEY_PASSWORD: credentials.keyPassword,
  },
  stdio: 'inherit',
})
process.exit(result.status ?? 1)
