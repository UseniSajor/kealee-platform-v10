/**
 * An in-memory KnowledgeDb for tests: enough Prisma semantics (create, update,
 * findUnique/First/Many with equality filters and orderBy, count) for the
 * registry to run without a database.
 */
import { randomUUID } from 'node:crypto'
import type { Delegate, KnowledgeDb } from '../db'

function matches(row: Record<string, unknown>, where: Record<string, unknown> | undefined): boolean {
  if (!where) return true
  return Object.entries(where).every(([k, v]) => {
    if (v && typeof v === 'object' && !Array.isArray(v) && !(v instanceof Date)) {
      const cond = v as Record<string, unknown>
      if ('in' in cond) return (cond.in as unknown[]).includes(row[k])
      if ('not' in cond) return row[k] !== cond.not
      if ('startsWith' in cond) return String(row[k] ?? '').startsWith(String(cond.startsWith))
      return false
    }
    return row[k] === v
  })
}

class Table implements Delegate {
  rows: Record<string, unknown>[] = []
  constructor(private readonly name: string, private readonly uniques: string[][] = []) {}
  async create({ data }: { data: any }) {
    const row = { id: randomUUID(), createdAt: new Date(), updatedAt: new Date(), occurredAt: new Date(), ...data }
    for (const u of this.uniques) {
      if (this.rows.some(r => u.every(f => r[f] === row[f]) && u.some(f => row[f] != null))) throw new Error(`Unique constraint failed on ${this.name}(${u.join(',')})`)
    }
    this.rows.push(row); return { ...row }
  }
  async update({ where, data }: { where: any; data: any }) {
    const row = this.rows.find(r => matches(r, where)); if (!row) throw new Error(`${this.name}: not found`)
    for (const [k, v] of Object.entries(data)) {
      if (v && typeof v === 'object' && 'increment' in (v as object)) row[k] = Number(row[k] ?? 0) + Number((v as { increment: number }).increment)
      else row[k] = v
    }
    row.updatedAt = new Date(); return { ...row }
  }
  async findUnique({ where }: { where: any }) { const r = this.rows.find(x => matches(x, where)); return r ? { ...r } : null }
  async findFirst({ where, orderBy }: { where: any; orderBy?: any }) { const all = await this.findMany({ where, orderBy }); return all[0] ?? null }
  async findMany({ where, orderBy, take }: { where?: any; orderBy?: any; take?: number } = {}) {
    let out = this.rows.filter(r => matches(r, where)).map(r => ({ ...r }))
    if (orderBy) { const [[k, dir]] = Object.entries(orderBy) as [string, string][]; out.sort((a, b) => (a[k] as any) < (b[k] as any) ? -1 : (a[k] as any) > (b[k] as any) ? 1 : 0); if (dir === 'desc') out.reverse() }
    if (take) out = out.slice(0, take)
    return out
  }
  async count({ where }: { where?: any } = {}) { return this.rows.filter(r => matches(r, where)).length }
}

export function memoryDb(): KnowledgeDb & { tables: Record<string, Table> } {
  const tables = {
    knowledgeSource: new Table('knowledge_sources', [['key']]),
    knowledgeArtifact: new Table('knowledge_artifacts', [['sourceSystem', 'sourceRecordId', 'version']]),
    knowledgeArtifactVersion: new Table('knowledge_artifact_versions', [['artifactId', 'version']]),
    knowledgeArtifactFile: new Table('knowledge_artifact_files'),
    knowledgeProjectLink: new Table('knowledge_project_links'),
    knowledgeLineageEdge: new Table('knowledge_lineage_edges', [['subjectId', 'objectId', 'relation']]),
    generationRun: new Table('generation_runs'),
    generationInput: new Table('generation_inputs'),
    generationOutput: new Table('generation_outputs', [['runId', 'artifactId', 'role']]),
    learningEvent: new Table('learning_events'),
  }
  return { ...tables, tables }
}
