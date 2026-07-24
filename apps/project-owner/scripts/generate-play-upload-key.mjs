import { randomBytes } from 'node:crypto'
import { chmod, stat, writeFile } from 'node:fs/promises'
import { spawnSync } from 'node:child_process'
import path from 'node:path'
import process from 'node:process'

const androidDir = path.resolve('android')
const keyStorePath = path.join(androidDir, 'android.keystore')
const credentialsPath = path.join(androidDir, 'play-signing.local.json')
const alias = 'kealee-upload'

try {
  await stat(keyStorePath)
  console.error(`Refusing to replace existing upload key: ${keyStorePath}`)
  process.exit(1)
} catch (error) {
  if (error?.code !== 'ENOENT') throw error
}

const keyStorePassword = randomBytes(30).toString('base64url')
const keyPassword = randomBytes(30).toString('base64url')
const distinguishedName = 'CN=Kealee Project Owner, OU=Platform, O=Kealee Services LLC, L=Fort Washington, ST=Maryland, C=US'

const generated = spawnSync('keytool', [
  '-genkeypair',
  '-v',
  '-keystore', keyStorePath,
  '-alias', alias,
  '-keyalg', 'RSA',
  '-keysize', '4096',
  '-validity', '10000',
  '-dname', distinguishedName,
  '-storepass', keyStorePassword,
  '-keypass', keyPassword,
], { encoding: 'utf8' })

if (generated.status !== 0) {
  console.error(generated.stderr || generated.stdout)
  process.exit(generated.status ?? 1)
}

await writeFile(credentialsPath, `${JSON.stringify({
  keyStorePath: './android.keystore',
  alias,
  keyStorePassword,
  keyPassword,
  createdAt: new Date().toISOString(),
}, null, 2)}\n`, { mode: 0o600 })
await chmod(keyStorePath, 0o600)

const certificate = spawnSync('keytool', [
  '-list',
  '-v',
  '-keystore', keyStorePath,
  '-alias', alias,
  '-storepass', keyStorePassword,
], { encoding: 'utf8' })

const fingerprint = certificate.stdout.match(/SHA256:\s*([0-9A-F:]+)/i)?.[1]
if (!fingerprint) {
  console.error('Upload key created, but its SHA-256 fingerprint could not be read.')
  process.exit(1)
}

console.log(`Upload key created: ${keyStorePath}`)
console.log(`Credentials created: ${credentialsPath}`)
console.log(`SHA-256 fingerprint: ${fingerprint.toUpperCase()}`)
console.log('Back up both ignored files in the Kealee encrypted credential vault now.')
