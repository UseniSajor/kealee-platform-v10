/**
 * Registers every engine output folder under `output/site-plans/` in the
 * knowledge registry: each `*.yield.json` / `*.proposal.json` /
 * `*.plat-record.json` becomes a generation run whose PGAtlas parcels are the
 * sources, with the PDFs, DXF, LandXML and manifest as the artifact's files.
 *
 *   DATABASE_URL=<direct url> pnpm tsx scripts/register-output-folders.ts [../../output/site-plans]
 *
 * Idempotent: the registry keys artifacts on (sourceSystem, sourceRecordId)
 * and a re-run with unchanged JSON returns the existing artifact; changed
 * JSON becomes a new version.
 */
import { createHash } from 'node:crypto'
import { readdirSync, readFileSync, statSync, existsSync } from 'node:fs'
import path from 'node:path'
import { prisma } from '@kealee/database'
import { createKnowledge, recordOutputFolder, type OutputFolderFacts } from '../src'

const root = path.resolve(process.argv[2] ?? path.join(__dirname, '..', '..', '..', 'output', 'site-plans'))
const sha = (p: string) => createHash('sha256').update(readFileSync(p)).digest('hex')
const MIME: Record<string, string> = { '.dxf': 'image/vnd.dxf', '.xml': 'application/xml', '.json': 'application/json', '.pdf': 'application/pdf', '.md': 'text/markdown' }

async function main() {
  const k = createKnowledge(prisma, { log: (m) => console.log(m) })
  const entries = readdirSync(root).filter(d => statSync(path.join(root, d)).isDirectory())
  let runs = 0
  for (const slug of entries) {
    const folder = path.join(root, slug)
    const files = readdirSync(folder)
    const recordFile = files.find(f => f.endsWith('.yield.json')) ?? files.find(f => f.endsWith('.plat-record.json')) ?? files.find(f => f.endsWith('.proposal.json'))
    if (!recordFile) {
      // A package folder without an engine record (a dossier, a review package): its PDFs are
      // documents of the record with the README as their summary — no generation run is
      // invented for a producer the folder does not name.
      const pdfs = files.filter(f => f.endsWith('.pdf'))
      const readme = existsSync(path.join(folder, 'README.md')) ? readFileSync(path.join(folder, 'README.md'), 'utf8') : null
      for (const f of pdfs) {
        const { artifact, created, versioned } = await k.registry.ingestArtifact({
          artifactType: /site-plan|siteplan/i.test(f) ? 'SITE_PLAN' : 'DOCUMENT', artifactSubtype: 'package', discipline: 'civil', sourceKey: 'site-plan-engine',
          sourceSystem: 'output/site-plans', sourceRecordId: `${slug}/${f}`, checksum: sha(path.join(folder, f)), fileSize: statSync(path.join(folder, f)).size,
          filename: f, mimeType: 'application/pdf', storageUri: `output/site-plans/${slug}/${f}`, title: `${slug}: ${f}`, summary: readme?.slice(0, 2000) ?? null,
          confidentiality: 'INTERNAL', jurisdiction: 'prince_georges_md', metadata: { folder: slug, siblings: files.filter(x => x !== f) }, actor: { type: 'system', id: 'register-output-folders' },
        })
        console.log(`  ✔ ${slug}/${f}: document ${artifact.id} v${artifact.version}${created ? '' : versioned ? ' (new version)' : ' (unchanged)'}`)
      }
      if (!pdfs.length) console.log(`  – ${slug}: no record JSON and no PDF, skipped`)
      continue
    }
    const kind: OutputFolderFacts['kind'] = recordFile.endsWith('.yield.json') ? 'yield_study' : recordFile.endsWith('.plat-record.json') ? 'subdivision' : 'site_plan'
    const record = JSON.parse(readFileSync(path.join(folder, recordFile), 'utf8')) as Record<string, unknown>
    const pdfs = files.filter(f => f.endsWith('.pdf')).map(f => ({ filename: f, sizeBytes: statSync(path.join(folder, f)).size, sha256: sha(path.join(folder, f)) }))
    const exports = files.filter(f => /\.(dxf|xml|keepout\.json)$/.test(f) && f !== recordFile).map(f => ({ filename: f, sizeBytes: statSync(path.join(folder, f)).size, sha256: sha(path.join(folder, f)), mimeType: MIME[path.extname(f)] ?? 'application/octet-stream' }))
    const manifestFile = files.find(f => f.endsWith('.manifest.json'))
    const manifest = manifestFile ? JSON.parse(readFileSync(path.join(folder, manifestFile), 'utf8')) as Record<string, unknown> : null
    const readme = existsSync(path.join(folder, 'README.md')) ? readFileSync(path.join(folder, 'README.md'), 'utf8') : null
    const { run, primary } = await recordOutputFolder(k, { slug, folder: path.relative(path.join(root, '..', '..'), folder).replace(/\\/g, '/'), record, recordFile, pdfs, exports, manifest, readme, kind })
    runs++
    console.log(`  ✔ ${slug}: ${kind} → artifact ${primary.id} v${primary.version} (run ${run.id}); ${pdfs.length} pdf, ${exports.length} export(s)`)
  }
  // Loose files at the root (single-lot sets written beside the folders)
  for (const f of readdirSync(root).filter(f => statSync(path.join(root, f)).isFile() && /\.(pdf|dxf|xml|json)$/.test(f))) {
    const isRecord = f.endsWith('.plat.json') || f.endsWith('.plat-record.json')
    const { artifact, created, versioned } = await k.registry.ingestArtifact({
      artifactType: f.endsWith('.pdf') ? 'SITE_PLAN' : isRecord ? 'DOCUMENT' : 'SITE_PLAN', artifactSubtype: isRecord ? 'plat-record' : f.endsWith('.pdf') ? 'permit-set' : 'export', discipline: 'civil', sourceKey: 'site-plan-engine',
      sourceSystem: 'output/site-plans', sourceRecordId: f, checksum: sha(path.join(root, f)), fileSize: statSync(path.join(root, f)).size, filename: f, mimeType: MIME[path.extname(f)] ?? 'application/octet-stream',
      storageUri: `output/site-plans/${f}`, title: f, approvalStatus: isRecord ? 'UNREVIEWED' : 'AI_GENERATED', generatedByAgent: isRecord ? undefined : 'generate-subdivision', confidentiality: 'INTERNAL', jurisdiction: 'prince_georges_md', actor: { type: 'system', id: 'register-output-folders' },
    })
    console.log(`  ✔ ${f}: ${artifact.artifactType} ${artifact.id} v${artifact.version}${created ? '' : versioned ? ' (new version)' : ' (unchanged)'}`)
  }
  const stats = await k.registry.stats()
  console.log(`\n${runs} folder(s) registered. Corpus: ${stats.artifacts} artifacts, ${stats.generationRuns} generation runs, ${stats.learningEvents} learning events; training candidates ${stats.trainingCandidates}, approved ${stats.trainingApproved}.`)
  console.log(`By type: ${JSON.stringify(stats.byType)}\nBy approval: ${JSON.stringify(stats.byApproval)}`)
}

main().catch(e => { console.error(e); process.exit(1) }).finally(() => prisma.$disconnect())
