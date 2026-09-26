/**
 * The only way RECORD data enters the model.
 *
 * Design commands cannot create surveyed, platted or GIS objects — an edit is
 * not a measurement. Record data arrives here, with the document it came from,
 * and each import is its own revision. Survey classes (boundary, topographic,
 * ALTA, field observation) need an importer holding IMPORT_SURVEY — a
 * surveyor — and a document reference; GIS classes need IMPORT_SOURCE_DATA.
 *
 * An import never overwrites a boundary of record silently: when a survey or
 * plat boundary arrives and a GIS boundary exists, the GIS one is marked
 * SUPERSEDED and kept, and a discrepancy is reported (the plat supersedes; the
 * difference is evidence, not noise).
 */

import { type StudioModel, type StudioObject, type SourceKind, SURVEYED_SOURCES, RECORD_SOURCES } from './model'
import type { ObjectChange } from './commands'
import type { RevisionRecord } from './proposals'
import { STUDIO_ENGINE_VERSION } from './model'
import { centroid, polygonArea } from './geometry'

export interface ImportRequest {
  objects: StudioObject[]
  importedBy: string
  capabilities: { importSurvey: boolean; importSourceData: boolean }
  documentRef: string | null
  revisionId: string
  now: string
}

export type ImportResult =
  | { ok: true; model: StudioModel; revision: RevisionRecord; discrepancies: string[] }
  | { ok: false; reason: string }

export function importRecords(model: StudioModel, req: ImportRequest): ImportResult {
  for (const o of req.objects) {
    if (!RECORD_SOURCES.has(o.source) && o.source !== 'ENGINE_CALCULATED' && o.source !== 'PROPOSED_DESIGN' && o.source !== 'USER_SUPPLIED') return { ok: false, reason: `Import accepts record, computed or supplied data; ${o.source} is not importable.` }
    if (SURVEYED_SOURCES.has(o.source) && !req.capabilities.importSurvey) return { ok: false, reason: `${o.source.replace(/_/g, ' ').toLowerCase()} can only be imported by a surveyor role.` }
    if (SURVEYED_SOURCES.has(o.source) && !req.documentRef) return { ok: false, reason: 'A survey or plat import must reference its source document.' }
    if (RECORD_SOURCES.has(o.source) && !SURVEYED_SOURCES.has(o.source) && !req.capabilities.importSourceData) return { ok: false, reason: 'Importing source data needs IMPORT_SOURCE_DATA.' }
  }
  const objects = new Map(model.objects.map(o => [o.id, o]))
  const changes: ObjectChange[] = []
  const discrepancies: string[] = []
  for (const incoming of req.objects) {
    const o: StudioObject = { ...incoming, organizationId: model.organizationId, workspaceId: model.workspaceId, projectId: model.projectId, revisionId: req.revisionId, attributes: { ...incoming.attributes, importDocument: req.documentRef } }
    if (o.type === 'ParcelBoundary' && SURVEYED_SOURCES.has(o.source)) {
      for (const old of [...objects.values()].filter(x => x.type === 'ParcelBoundary' && x.status !== 'SUPERSEDED' && !SURVEYED_SOURCES.has(x.source))) {
        const a = centroid(old.geometry), b = centroid(o.geometry)
        const shift = Math.hypot(a[0] - b[0], a[1] - b[1]), dA = polygonArea(o.geometry) - polygonArea(old.geometry)
        discrepancies.push(`${o.source.replace(/_/g, ' ').toLowerCase()} boundary supersedes the ${old.source.replace(/_/g, ' ').toLowerCase()} boundary: centroid moved ${shift.toFixed(2)} ft, area differs by ${dA.toFixed(0)} sf.`)
        const sup = { ...old, status: 'SUPERSEDED' as const, modifiedBy: req.importedBy, modifiedAt: req.now, revisionId: req.revisionId, attributes: { ...old.attributes, supersededBy: o.id } }
        changes.push({ before: old, after: sup }); objects.set(old.id, sup)
        // The engineered edge classification belongs to the lot, not the source.
        if (old.attributes.edgeYards && !o.attributes.edgeYards) o.attributes.edgeYards = old.attributes.edgeYards
      }
    }
    changes.push({ before: objects.get(o.id) ?? null, after: o })
    objects.set(o.id, o)
  }
  const revision = model.revision + 1
  return {
    ok: true, discrepancies,
    model: { ...model, objects: [...objects.values()], revision, revisionId: req.revisionId },
    revision: {
      revision, revisionId: req.revisionId, parentRevision: model.revision, proposalId: null, commands: [], changes,
      summary: `IMPORT ${req.objects.length} object(s) from ${req.documentRef ?? 'source data'}` + (discrepancies.length ? ` — ${discrepancies.length} discrepancy(ies)` : ''),
      createdBy: req.importedBy, createdAt: req.now, engineVersion: STUDIO_ENGINE_VERSION,
    },
  }
}

export type { SourceKind }
