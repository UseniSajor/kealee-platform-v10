'use client'

import Link from 'next/link'

interface DesignConcept {
  id?: string
  name?: string
  positioning?: string
  narrative?: string
  estimatedCostMin?: number
  estimatedCostMax?: number
  timeline?: string
  keyFeatures?: string[]
  risks?: string[]
}

export function V30DesignPanel({ data }: { data: Record<string, unknown> }) {
  const concepts = (data.concepts as DesignConcept[] | undefined) ?? []
  if (!concepts.length) {
    return <p className="text-sm text-slate-500">No design concepts in output yet.</p>
  }

  return (
    <div className="grid gap-4 md:grid-cols-3">
      {concepts.map((c, i) => (
        <article key={c.id ?? i} className="rounded-xl border border-slate-200 p-4 bg-slate-50">
          <p className="text-xs font-bold uppercase tracking-wider text-violet-600">
            {c.positioning ?? `Concept ${i + 1}`}
          </p>
          <h3 className="font-bold text-slate-900 mt-1">{c.name ?? 'Concept'}</h3>
          {c.estimatedCostMin != null && (
            <p className="text-sm font-semibold text-slate-700 mt-2">
              ${c.estimatedCostMin.toLocaleString()}
              {c.estimatedCostMax != null && ` – $${c.estimatedCostMax.toLocaleString()}`}
            </p>
          )}
          {c.timeline && <p className="text-xs text-slate-500 mt-1">{c.timeline}</p>}
          <p className="text-sm text-slate-600 mt-3 line-clamp-6">{c.narrative}</p>
          {c.keyFeatures?.length ? (
            <ul className="mt-3 space-y-1 text-xs text-slate-600">
              {c.keyFeatures.slice(0, 4).map(f => (
                <li key={f}>• {f}</li>
              ))}
            </ul>
          ) : null}
        </article>
      ))}
      {data.summary && typeof data.summary === 'string' && (
        <p className="md:col-span-3 text-sm text-slate-600 border-t border-slate-100 pt-4">{data.summary}</p>
      )}
    </div>
  )
}

export function V30EstimatePanel({ data }: { data: Record<string, unknown> }) {
  const trades = (data.byTrade ?? data.trades) as Array<Record<string, unknown>> | undefined
  const low = data.costLow ?? data.totalCostLow
  const high = data.costHigh ?? data.totalCostHigh

  return (
    <div className="space-y-4">
      {(low != null || high != null) && (
        <p className="text-2xl font-bold text-slate-900">
          ${Number(low ?? 0).toLocaleString()} – ${Number(high ?? 0).toLocaleString()}
        </p>
      )}
      {Array.isArray(trades) && trades.length > 0 ? (
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-slate-500 border-b">
              <th className="py-2">Trade</th>
              <th className="py-2 text-right">Low</th>
              <th className="py-2 text-right">High</th>
            </tr>
          </thead>
          <tbody>
            {trades.map((t, i) => (
              <tr key={i} className="border-b border-slate-100">
                <td className="py-2 font-medium">{String(t.trade ?? t.name ?? '—')}</td>
                <td className="py-2 text-right">${Number(t.low ?? t.costLow ?? 0).toLocaleString()}</td>
                <td className="py-2 text-right">${Number(t.high ?? t.costHigh ?? 0).toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : (
        <p className="text-sm text-slate-500">Estimate breakdown will appear when EstimateBot completes.</p>
      )}
    </div>
  )
}

export function V30PermitsPanel({ data }: { data: Record<string, unknown> }) {
  const permits = data.requiredPermits as string[] | undefined
  const checklist = data.documentsChecklist as string[] | undefined
  const jurisdiction = data.jurisdiction as string | undefined

  return (
    <div className="space-y-4">
      {jurisdiction && (
        <p className="text-sm">
          <span className="font-semibold text-slate-800">Jurisdiction:</span> {jurisdiction}
        </p>
      )}
      {permits?.length ? (
        <div>
          <h4 className="font-semibold text-slate-900 mb-2">Required permits</h4>
          <ul className="list-disc pl-5 text-sm text-slate-700 space-y-1">
            {permits.map(p => (
              <li key={p}>{p}</li>
            ))}
          </ul>
        </div>
      ) : null}
      {checklist?.length ? (
        <div>
          <h4 className="font-semibold text-slate-900 mb-2">Document checklist</h4>
          <ul className="list-disc pl-5 text-sm text-slate-700 space-y-1">
            {checklist.map(d => (
              <li key={d}>{d}</li>
            ))}
          </ul>
        </div>
      ) : null}
      {!permits?.length && !checklist?.length && (
        <p className="text-sm text-slate-500">Permit and zoning details will populate when bots complete.</p>
      )}
    </div>
  )
}

export function V30WorkspaceTabContent({
  tab,
  data,
  intakeId,
}: {
  tab: string
  data: Record<string, unknown> | null
  intakeId: string
}) {
  if (!data) return null

  switch (tab) {
    case 'design':
      return (
        <div className="space-y-4">
          <V30DesignPanel data={data} />
          <Link
            href={`/concept/access?next=${encodeURIComponent(`/concept/${intakeId}`)}`}
            className="text-sm text-violet-600 font-semibold underline"
          >
            Open concept portal for renders →
          </Link>
        </div>
      )
    case 'estimate':
      return <V30EstimatePanel data={data} />
    case 'permits':
      return <V30PermitsPanel data={data} />
    case 'floorplan': {
      const landscape = data.landscapePackage as {
        plants?: Array<{ species: string; quantity: number; unit: string; lineTotal?: number }>
        trees?: Array<{ species: string; quantity: number; lineTotal?: number }>
        materials?: Array<{ material: string; quantity: number; unit: string; lineTotal?: number }>
        estimatedCost?: { low: number; high: number; mid: number }
      } | undefined
      const siteUrl = (data.sitePlanImageUrl ?? landscape?.sitePlanImageUrl) as string | undefined
      const lot = data.lotContext as { satelliteImageUrl?: string; googleEarthHint?: string } | undefined
      const cad = data.cadExport as { dxfFilename?: string } | undefined
      return (
        <div className="space-y-4">
          {lot?.satelliteImageUrl && (
            <div>
              <p className="text-xs font-bold text-slate-500 uppercase">Lot context (satellite)</p>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={lot.satelliteImageUrl} alt="Satellite lot" className="mt-2 rounded-lg border max-h-64 w-full object-cover" />
              <p className="text-xs text-slate-500 mt-1">{lot.googleEarthHint}</p>
            </div>
          )}
          {siteUrl && (
            <div>
              <p className="text-xs font-bold text-slate-500 uppercase">Site / floor plan sheet (Recraft)</p>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={siteUrl} alt="Site plan" className="mt-2 rounded-lg border max-h-96 w-full object-contain bg-white" />
            </div>
          )}
          {landscape && (
            <div className="space-y-3 rounded-xl border border-emerald-200 bg-emerald-50/50 p-4">
              <p className="text-sm font-bold text-emerald-900">Premium+ landscape package</p>
              {landscape.estimatedCost && (
                <p className="text-lg font-bold text-slate-900">
                  ${landscape.estimatedCost.low.toLocaleString()} – ${landscape.estimatedCost.high.toLocaleString()}
                  <span className="text-sm font-normal text-slate-600"> (mid ${landscape.estimatedCost.mid.toLocaleString()})</span>
                </p>
              )}
              {landscape.plants && landscape.plants.length > 0 && (
                <div>
                  <p className="text-xs font-bold text-slate-600 uppercase mb-1">Plants</p>
                  <ul className="text-xs space-y-1">
                    {landscape.plants.slice(0, 12).map((p, i) => (
                      <li key={i}>{p.species} × {p.quantity} {p.unit}{p.lineTotal ? ` — $${p.lineTotal}` : ''}</li>
                    ))}
                  </ul>
                </div>
              )}
              {landscape.trees && landscape.trees.length > 0 && (
                <div>
                  <p className="text-xs font-bold text-slate-600 uppercase mb-1">Trees</p>
                  <ul className="text-xs space-y-1">
                    {landscape.trees.map((t, i) => (
                      <li key={i}>{t.species} × {t.quantity}{t.lineTotal ? ` — $${t.lineTotal}` : ''}</li>
                    ))}
                  </ul>
                </div>
              )}
              {landscape.materials && landscape.materials.length > 0 && (
                <div>
                  <p className="text-xs font-bold text-slate-600 uppercase mb-1">Materials</p>
                  <ul className="text-xs space-y-1">
                    {landscape.materials.slice(0, 10).map((m, i) => (
                      <li key={i}>{m.material} — {m.quantity} {m.unit}{m.lineTotal ? ` — $${m.lineTotal}` : ''}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
          {cad && (
            <p className="text-sm">
              <a
                href={`/api/v30/cad/${intakeId}`}
                className="text-violet-600 font-semibold underline"
              >
                Download DXF for AutoCAD / SketchUp →
              </a>
            </p>
          )}
          <details className="text-sm">
            <summary className="cursor-pointer font-semibold text-slate-700">Layout JSON</summary>
            <pre className="mt-2 text-xs overflow-auto max-h-96 whitespace-pre-wrap text-slate-600">
              {JSON.stringify(data, null, 2)}
            </pre>
          </details>
        </div>
      )
    }
    case 'video':
      return (
        <details className="text-sm">
          <summary className="cursor-pointer font-semibold text-slate-700">Raw deliverable JSON</summary>
          <pre className="mt-2 text-xs overflow-auto max-h-96 whitespace-pre-wrap text-slate-600">
            {JSON.stringify(data, null, 2)}
          </pre>
        </details>
      )
    default:
      return null
  }
}
