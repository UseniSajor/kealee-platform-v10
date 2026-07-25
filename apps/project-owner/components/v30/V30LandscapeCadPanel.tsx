'use client'

import Image from 'next/image'
import Link from 'next/link'
import { Download, Leaf, MapPin } from 'lucide-react'
import {
  isGardenLandscapePath,
  v30CadDownloadUrl,
  type V30FloorplanDeliverables,
  type V30LandscapePackage,
} from '@/lib/concept-output'

export function V30LandscapeCadPanel({
  intakeId,
  projectPath,
  tier,
  landscape,
  floorplan,
  lotContext,
}: {
  intakeId: string
  projectPath: string
  tier: number
  landscape: V30LandscapePackage | null
  floorplan: V30FloorplanDeliverables | null
  lotContext?: { satelliteImageUrl?: string; googleEarthHint?: string } | null
}) {
  const siteUrl =
    floorplan?.sitePlanImageUrl ??
    landscape?.sitePlanImageUrl ??
    (lotContext?.satelliteImageUrl as string | undefined)
  const hasCad = Boolean(floorplan?.cadExport?.dxf)
  const showLandscape = tier >= 3 && landscape && (landscape.plants?.length || landscape.trees?.length)

  if (!siteUrl && !showLandscape && !hasCad && !floorplan?.rooms?.length) {
    return null
  }

  return (
    <section
      className="rounded-2xl bg-white overflow-hidden"
      style={{ boxShadow: '0 1px 3px 0 rgb(0 0 0 / 0.06)' }}
    >
      <div className="px-6 py-4 border-b border-gray-100 flex items-center gap-2">
        <Leaf className="h-4 w-4 text-emerald-600" />
        <h2 className="text-base font-bold" style={{ color: '#1A2B4A' }}>
          Site plan, landscape &amp; CAD
        </h2>
        {floorplan?.floorplanScope && (
          <span className="ml-auto text-xs font-semibold uppercase tracking-wide text-violet-600">
            {String(floorplan.floorplanScope).replace(/_/g, ' ')}
          </span>
        )}
      </div>

      <div className="p-6 space-y-6">
        {lotContext?.satelliteImageUrl && (
          <div>
            <p className="text-xs font-bold text-gray-500 uppercase mb-2 flex items-center gap-1">
              <MapPin className="h-3.5 w-3.5" /> Lot context (satellite)
            </p>
            <div className="relative aspect-video max-h-64 w-full overflow-hidden rounded-xl border bg-gray-50">
              <Image
                src={lotContext.satelliteImageUrl}
                alt="Satellite lot view"
                fill
                className="object-cover"
                unoptimized
              />
            </div>
            {lotContext.googleEarthHint && (
              <p className="text-xs text-gray-500 mt-1">{lotContext.googleEarthHint}</p>
            )}
          </div>
        )}

        {siteUrl && (
          <div>
            <p className="text-xs font-bold text-gray-500 uppercase mb-2">Site / layout sheet</p>
            <div className="relative w-full min-h-[200px] max-h-[28rem] overflow-hidden rounded-xl border bg-white">
              <Image
                src={siteUrl}
                alt="Site plan"
                width={1200}
                height={800}
                className="w-full h-auto object-contain"
                unoptimized
              />
            </div>
          </div>
        )}

        {floorplan?.rooms && floorplan.rooms.length > 0 && (
          <div className="rounded-xl border border-slate-200 bg-slate-50/80 p-4">
            <p className="text-sm font-bold text-slate-900 mb-2">Room layout</p>
            <ul className="text-xs space-y-1 text-slate-700">
              {floorplan.rooms.slice(0, 14).map((r, i) => (
                <li key={i}>
                  {r.name}
                  {r.widthFt && r.lengthFt ? ` — ${r.widthFt}′ × ${r.lengthFt}′` : ''}
                  {r.areaSqft ? ` (${r.areaSqft} sq ft)` : ''}
                </li>
              ))}
            </ul>
          </div>
        )}

        {showLandscape && (
          <div className="space-y-3 rounded-xl border border-emerald-200 bg-emerald-50/50 p-4">
            <p className="text-sm font-bold text-emerald-900">Premium+ landscape package</p>
            {landscape!.estimatedCost && (
              <p className="text-lg font-bold text-slate-900">
                ${landscape!.estimatedCost.low.toLocaleString()} – $
                {landscape!.estimatedCost.high.toLocaleString()}
                <span className="text-sm font-normal text-slate-600">
                  {' '}
                  (mid ${landscape!.estimatedCost.mid.toLocaleString()})
                </span>
              </p>
            )}
            {landscape!.plants && landscape!.plants.length > 0 && (
              <div>
                <p className="text-xs font-bold text-slate-600 uppercase mb-1">Plants</p>
                <ul className="text-xs space-y-1 text-slate-700">
                  {landscape!.plants.slice(0, 12).map((p, i) => (
                    <li key={i}>
                      {p.species} × {p.quantity} {p.unit}
                      {p.lineTotal != null ? ` — $${p.lineTotal.toLocaleString()}` : ''}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {landscape!.trees && landscape!.trees.length > 0 && (
              <div>
                <p className="text-xs font-bold text-slate-600 uppercase mb-1">Trees</p>
                <ul className="text-xs space-y-1 text-slate-700">
                  {landscape!.trees.map((t, i) => (
                    <li key={i}>
                      {t.species} × {t.quantity}
                      {t.lineTotal != null ? ` — $${t.lineTotal.toLocaleString()}` : ''}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {landscape!.materials && landscape!.materials.length > 0 && (
              <div>
                <p className="text-xs font-bold text-slate-600 uppercase mb-1">Materials</p>
                <ul className="text-xs space-y-1 text-slate-700">
                  {landscape!.materials.slice(0, 10).map((m, i) => (
                    <li key={i}>
                      {m.material} — {m.quantity} {m.unit}
                      {m.lineTotal != null ? ` — $${m.lineTotal.toLocaleString()}` : ''}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}

        {hasCad && (
          <div className="flex flex-wrap items-center gap-3 rounded-xl border border-violet-200 bg-violet-50 px-4 py-3">
            <Download className="h-5 w-5 text-violet-600 shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-violet-900">CAD export (DXF)</p>
              <p className="text-xs text-violet-700">
                {floorplan?.cadExport?.dxfFilename ?? 'kealee-layout.dxf'} — AutoCAD / SketchUp
              </p>
            </div>
            <Link
              href={v30CadDownloadUrl(intakeId)}
              className="inline-flex items-center gap-1.5 rounded-lg bg-violet-600 px-3 py-2 text-xs font-semibold text-white hover:bg-violet-700"
            >
              Download DXF
            </Link>
          </div>
        )}

        {!showLandscape && tier >= 3 && isGardenLandscapePath(projectPath) && (
          <p className="text-sm text-gray-500">
            Landscape schedules will appear here when Premium+ garden generation completes.
          </p>
        )}
      </div>
    </section>
  )
}
