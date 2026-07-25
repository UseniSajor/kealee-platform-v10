import { randomBytes } from 'node:crypto'
import { chmod, readFile, stat, writeFile } from 'node:fs/promises'
import { spawnSync } from 'node:child_process'
import path from 'node:path'
import process from 'node:process'

const appDir = process.argv[2]
if (!appDir) throw new Error('Usage: node scripts/google-play/generate-upload-key.mjs apps/<app>')

const androidDir = path.resolve(appDir, 'android')
const keyStorePath = path.join(androidDir, 'android.keystore')
const credentialsPath = path.join(androidDir, 'play-signing.local.json')
const manifest = JSON.parse(await readFile(path.join(androidDir, 'twa-manifest.json'), 'utf8'))
const alias = 'kealee-upload'

try {
  await stat(keyStorePath)
  console.error(`Refusing to replace existing upload key: ${keyStorePath}`)
  process.exit(1)
} catch (error) {
  if (error?.code !== 'ENOENT') throw error
}

const keyStorePassword = randomBytes(30).toString('base64url')
// PKCS12 uses one password for the store and private key.
const keyPassword = keyStorePassword
const generated = spawnSync('keytool', [
  '-genkeypair', '-v', '-keystore', keyStorePath, '-alias', alias,
  '-keyalg', 'RSA', '-keysize', '4096', '-validity', '10000',
  '-dname', `CN=${manifest.name}, OU=Platform, O=Kealee Services LLC, L=Fort Washington, ST=Maryland, C=US`,
  '-storepass', keyStorePassword, '-keypass', keyPassword,
], { encoding: 'utf8' })
if (generated.status !== 0) throw new Error(generated.stderr || generated.stdout)

await writeFile(credentialsPath, `${JSON.stringify({
  keyStorePath: './android.keystore', alias, keyStorePassword, keyPassword,
  createdAt: new Date().toISOString(),
}, null, 2)}\n`, { mode: 0o600 })
await chmod(keyStorePath, 0o600)

const certificate = spawnSync('keytool', [
  '-list', '-v', '-keystore', keyStorePath, '-alias', alias, '-storepass', keyStorePassword,
], { encoding: 'utf8' })
const fingerprint = certificate.stdout.match(/SHA256:\s*([0-9A-F:]+)/i)?.[1]
if (!fingerprint) throw new Error('Upload key created, but its SHA-256 fingerprint could not be read.')
console.log(`${appDir}\t${manifest.packageId}\t${fingerprint.toUpperCase()}`)
