import { mkdir, readFile, writeFile } from 'fs/promises'
import { join } from 'path'
import type { AgentRunResult } from './types'

export interface ObsidianVaultWriterOptions {
  vaultPath: string
}

export class ObsidianVaultWriter {
  constructor(private readonly options: ObsidianVaultWriterOptions) {}

  async writeRun(result: AgentRunResult): Promise<AgentRunResult> {
    const dir = join(this.options.vaultPath, 'Kealee Agent Ops', 'Readiness')
    await mkdir(dir, { recursive: true })

    const basename = `${result.startedAt.slice(0, 10)}-${result.id}`
    const markdownPath = join(dir, `${basename}.md`)
    const jsonPath = join(dir, `${basename}.json`)

    await writeFile(markdownPath, renderMarkdown(result), 'utf8')
    await writeFile(jsonPath, JSON.stringify(result, null, 2), 'utf8')

    const latestPath = join(dir, 'latest.json')
    await writeFile(latestPath, JSON.stringify({ ...result, markdownPath, jsonPath }, null, 2), 'utf8')

    return { ...result, markdownPath, jsonPath }
  }

  async readLatest(): Promise<AgentRunResult | null> {
    try {
      const latestPath = join(this.options.vaultPath, 'Kealee Agent Ops', 'Readiness', 'latest.json')
      return JSON.parse(await readFile(latestPath, 'utf8')) as AgentRunResult
    } catch {
      return null
    }
  }
}

function renderMarkdown(result: AgentRunResult): string {
  const findings = result.findings.length
    ? result.findings.map(f => [
        `### [${f.severity.toUpperCase()}] ${f.title}`,
        `- Area: ${f.area}`,
        `- Owner: ${f.owner}`,
        `- Evidence: ${f.evidence}`,
        `- Recommendation: ${f.recommendation}`,
        `- Acceptance: ${f.acceptanceCriteria}`,
      ].join('\n')).join('\n\n')
    : 'No findings recorded.'

  const steps = result.steps
    .map(step => `- ${step.agent}: ${step.status} - ${step.summary}`)
    .join('\n')

  return [
    `# ${result.name}`,
    '',
    `- Run ID: ${result.id}`,
    `- Mode: ${result.mode}`,
    `- Status: ${result.status}`,
    `- Score: ${result.score}`,
    `- Started: ${result.startedAt}`,
    `- Completed: ${result.completedAt}`,
    '',
    '## Agent Steps',
    steps,
    '',
    '## Findings',
    findings,
  ].join('\n')
}
