import { execFile } from 'child_process'
import { promisify } from 'util'
import { writeFile, mkdir, readFile, unlink } from 'fs/promises'
import path from 'path'
import os from 'os'

const execFileAsync = promisify(execFile)

export async function ffmpegAvailable(): Promise<boolean> {
  try {
    await execFileAsync('ffmpeg', ['-version'], { timeout: 5_000 })
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
      'ffmpeg',
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
  }
}
