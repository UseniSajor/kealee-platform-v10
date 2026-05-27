import { execFile } from 'child_process'
import { promisify } from 'util'
import { writeFile, mkdir, readFile, unlink, rm } from 'fs/promises'
import path from 'path'
import os from 'os'

const execFileAsync = promisify(execFile)

// Use bundled static binary when available (works on Vercel Lambda), fall back
// to system ffmpeg for local dev environments that have it installed.
function getFfmpegBin(): string {
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const staticPath: string | null = require('ffmpeg-static') as string | null
    if (staticPath) return staticPath
  } catch {
    // ffmpeg-static not installed — use system binary
  }
  return 'ffmpeg'
}

export async function ffmpegAvailable(): Promise<boolean> {
  try {
    await execFileAsync(getFfmpegBin(), ['-version'], { timeout: 5_000 })
    return true
  } catch {
    return false
  }
}

/**
 * Concatenate MP4 segments in order. Returns null if ffmpeg is unavailable or stitch fails.
 */
export async function stitchMp4Segments(segmentBuffers: Buffer[]): Promise<Buffer | null> {
  if (segmentBuffers.length === 0) return null
  if (segmentBuffers.length === 1) return segmentBuffers[0]
  const bin = getFfmpegBin()
  if (!(await ffmpegAvailable())) return null

  const workDir = path.join(os.tmpdir(), `kealee-stitch-${Date.now()}`)
  await mkdir(workDir, { recursive: true })

  const partPaths: string[] = []
  const listPath = path.join(workDir, 'concat.txt')
  const outPath = path.join(workDir, 'output.mp4')

  try {
    for (let i = 0; i < segmentBuffers.length; i++) {
      const part = path.join(workDir, `part-${i}.mp4`)
      await writeFile(part, segmentBuffers[i])
      partPaths.push(part)
    }

    const listContent = partPaths.map((p) => `file '${p.replace(/'/g, "'\\''")}'`).join('\n')
    await writeFile(listPath, listContent, 'utf8')

    await execFileAsync(
      bin,
      ['-y', '-f', 'concat', '-safe', '0', '-i', listPath, '-c', 'copy', outPath],
      { timeout: 120_000 },
    )

    return await readFile(outPath)
  } catch (err) {
    console.warn('[video-stitch] ffmpeg concat failed:', err)
    return null
  } finally {
    for (const p of [...partPaths, listPath, outPath]) {
      await unlink(p).catch(() => {})
    }
    await rm(workDir, { recursive: true, force: true }).catch(() => {})
  }
}

/**
 * Trim an MP4 buffer to `seconds` duration using stream-copy (no re-encode).
 * Returns null if ffmpeg is unavailable or trimming fails — callers should
 * fall back to the master URL in that case.
 */
export async function trimMp4ToSeconds(inputBuffer: Buffer, seconds: number): Promise<Buffer | null> {
  const bin = getFfmpegBin()
  if (!(await ffmpegAvailable())) return null

  const workDir = path.join(os.tmpdir(), `kealee-trim-${Date.now()}-${seconds}s`)
  await mkdir(workDir, { recursive: true })

  const inputPath = path.join(workDir, 'input.mp4')
  const outPath   = path.join(workDir, 'output.mp4')

  try {
    await writeFile(inputPath, inputBuffer)
    await execFileAsync(
      bin,
      ['-y', '-i', inputPath, '-t', String(seconds), '-c', 'copy', outPath],
      { timeout: 60_000 },
    )
    return await readFile(outPath)
  } catch (err) {
    console.warn(`[video-stitch] ffmpeg trim to ${seconds}s failed:`, err)
    return null
  } finally {
    await rm(workDir, { recursive: true, force: true }).catch(() => {})
  }
}
