import { existsSync, readFileSync } from 'fs'
import { mkdir, writeFile } from 'fs/promises'
import path from 'path'
import { fileURLToPath } from 'url'
import {
  HOME_DESIGN_CARD_VIDEO,
  HOME_HERO_VIDEO,
} from '../lib/marketing/homepage-feature-videos'

type VideoSpec = {
  id: 'hero' | 'design-card'
  label: string
  publicPath: string
  prompt: string
  aspectRatio: '16:9' | '1:1'
}

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const webMainRoot = path.resolve(__dirname, '..')
const args = new Set(process.argv.slice(2))

type GeneratedVideoProvider = import('../lib/ai-video').GenerateVideoResult['provider']

const videos: VideoSpec[] = [
  {
    id: 'hero',
    label: 'homepage hero one-person-working clip',
    publicPath: HOME_HERO_VIDEO.src,
    prompt: HOME_HERO_VIDEO.prompt,
    aspectRatio: '16:9',
  },
  {
    id: 'design-card',
    label: 'AI Design Concepts card clip',
    publicPath: HOME_DESIGN_CARD_VIDEO.src,
    prompt: HOME_DESIGN_CARD_VIDEO.prompt,
    aspectRatio: '1:1',
  },
].filter((video) => {
  if (args.has('--hero-only')) return video.id === 'hero'
  if (args.has('--design-only')) return video.id === 'design-card'
  return true
})

function loadEnvFile(fileName: string) {
  const filePath = path.join(webMainRoot, fileName)
  if (!existsSync(filePath)) return

  for (const line of readFileSync(filePath, 'utf8').split(/\r?\n/)) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#')) continue
    const eq = trimmed.indexOf('=')
    if (eq < 1) continue
    const key = trimmed.slice(0, eq).trim()
    let value = trimmed.slice(eq + 1).trim()
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1)
    }
    if (!process.env[key]) process.env[key] = value
  }
}

for (const fileName of [
  '.env.local',
  '.env.vercel.production',
  '.env.vercel.pull',
  '.env',
  '.env.current',
  '.env.verify',
]) {
  loadEnvFile(fileName)
}

function outputPath(publicPath: string): string {
  return path.join(webMainRoot, 'public', publicPath.replace(/^\//, ''))
}

async function download(url: string): Promise<Buffer> {
  const response = await fetch(url)
  if (!response.ok) {
    throw new Error(`Failed to download generated video (${response.status})`)
  }
  return Buffer.from(await response.arrayBuffer())
}

async function waitForVideo(
  getVideoStatus: typeof import('../lib/ai-video').getVideoStatus,
  provider: GeneratedVideoProvider,
  jobId: string,
  label: string,
): Promise<string> {
  const deadline = Date.now() + 15 * 60_000
  while (Date.now() < deadline) {
    const status = await getVideoStatus(provider, jobId)
    console.log(`[homepage-videos] ${label}: ${status.status}`)

    if (status.status === 'completed' && status.outputUrl) return status.outputUrl
    if (status.status === 'failed') {
      throw new Error(status.error ?? `${label} generation failed`)
    }

    await new Promise((resolve) => setTimeout(resolve, 5000))
  }

  throw new Error(`${label} generation timed out`)
}

async function main() {
  if (args.has('--dry-run')) {
    console.log(JSON.stringify({ provider: 'kling-2.5', videos }, null, 2))
    return
  }

  if (!process.env.REPLICATE_API_TOKEN) {
    throw new Error('REPLICATE_API_TOKEN is required to generate homepage feature videos with Replicate/Kling.')
  }

  const { generateVideo, getVideoStatus } = await import('../lib/ai-video')

  for (const video of videos) {
    console.log(`[homepage-videos] Submitting ${video.label}`)
    const job = await generateVideo({
      provider: 'kling-2.5',
      prompt: video.prompt,
      durationSec: 10,
      aspectRatio: video.aspectRatio,
    })

    const remoteUrl = await waitForVideo(getVideoStatus, job.provider, job.jobId, video.label)
    const bytes = await download(remoteUrl)
    const localPath = outputPath(video.publicPath)

    await mkdir(path.dirname(localPath), { recursive: true })
    await writeFile(localPath, bytes)
    console.log(`[homepage-videos] Wrote ${path.relative(webMainRoot, localPath)}`)
  }
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
