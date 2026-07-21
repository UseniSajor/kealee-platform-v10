"use client";

import { useState } from "react";

// ── Types mirroring concept-engine output ──────────────────────────────────

interface FloorPlanRoom {
  id:      string;
  label:   string;
  widthFt: number;
  depthFt: number;
  areaFt2: number;
  notes?:  string;
  issues?: string[];
}

interface ConceptFloorplan {
  id:           string;
  totalAreaFt2: number;
  roomCount:    number;
  rooms:        FloorPlanRoom[];
  layoutIssues: string[];
  svgUrl?:      string;
  svgInline?:   string;
}

interface ConceptPackage {
  id:     string;
  status: string;
  narrative?: {
    projectSummary:    string;
    designIntent:      string;
    materialDirection: string;
    styleNarrative:    string;
    nextSteps:         string;
  };
  scope?: {
    totalEstimatedMin: number;
    totalEstimatedMax: number;
    budgetFitNote:     string;
    topRequiredTrades: string[];
  };
  permit?: {
    requiresPermit:     boolean;
    likelyPermits:      string[];
    estimatedTimeline:  string;
    keyConsiderations:  string[];
    disclaimer:         string;
  };
  visuals?: {
    midjourneyPrompts: string[];
    descriptions:      string[];
    styleKeywords:     string[];
  };
}

interface ArchitectHandoffReadiness {
  conceptPackageId?:    string;
  reviewTaskId?:        string;
  reviewStatus?:        string;
  flaggedUncertainties: string[];
  recommendedService?:  string;
  upsellNotes?:         string;
}

export interface ConceptEnginePanelProps {
  intakeId:    string;
  projectPath: string;
  // Loaded data (null = not yet generated)
  floorplan?:          ConceptFloorplan | null;
  conceptPackage?:     ConceptPackage | null;
  handoffReadiness?:   ArchitectHandoffReadiness | null;
  // Action callbacks
  onGenerateFloorplan?:       () => Promise<void>;
  onGenerateConceptPackage?:  () => Promise<void>;
  onRouteToArchitectReview?:  () => Promise<void>;
  onRequestMoreCapture?:      () => void;
  onApproveForDelivery?:      () => Promise<void>;
}

// ── Helpers ────────────────────────────────────────────────────────────────

function fmt(n: number) {
  return n.toLocaleString();
}

function fmtK(n: number) {
  return n >= 1000 ? `$${(n / 1000).toFixed(0)}K` : `$${n}`;
}

function ReadinessChip({ status }: { status: string }) {
  const map: Record<string, { label: string; cls: string }> = {
    pending:           { label: 'Pending',           cls: 'bg-slate-100 text-slate-600' },
    in_review:         { label: 'In Review',         cls: 'bg-blue-100 text-blue-700' },
    changes_requested: { label: 'Changes Requested', cls: 'bg-amber-100 text-amber-700' },
    approved:          { label: 'Approved',          cls: 'bg-green-100 text-green-700' },
    generated:         { label: 'Generated',         cls: 'bg-indigo-100 text-indigo-700' },
    delivered:         { label: 'Delivered',         cls: 'bg-green-100 text-green-700' },
  };
  const { label, cls } = map[status] ?? { label: status, cls: 'bg-gray-100 text-gray-600' };
  return (
    <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${cls}`}>{label}</span>
  );
}

// ── Main Component ─────────────────────────────────────────────────────────

export function ConceptEnginePanel({
  intakeId,
  projectPath,
  floorplan,
  conceptPackage,
  handoffReadiness,
  onGenerateFloorplan,
  onGenerateConceptPackage,
  onRouteToArchitectReview,
  onRequestMoreCapture,
  onApproveForDelivery,
}: ConceptEnginePanelProps) {
  const [loadingAction, setLoadingAction] = useState<string | null>(null);
  const [expandedSection, setExpandedSection] = useState<string | null>('floorplan');

  async function run(key: string, fn?: () => Promise<void>) {
    if (!fn) return;
    setLoadingAction(key);
    try { await fn(); } finally { setLoadingAction(null); }
  }

  const toggle = (key: string) =>
    setExpandedSection(prev => (prev === key ? null : key));

  return (
    <div className="space-y-4">

      {/* ── Section: Floor Plan ─────────────────────────────────────────── */}
      <section className="rounded-2xl border bg-white shadow-sm overflow-hidden">
        <button
          onClick={() => toggle('floorplan')}
          className="flex w-full items-center justify-between px-5 py-4 text-left"
        >
          <div className="flex items-center gap-3">
            <span className="text-lg font-semibold">Concept Floor Plan</span>
            {floorplan
              ? <ReadinessChip status="generated" />
              : <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-500">Not generated</span>}
          </div>
          <span className="text-slate-400">{expandedSection === 'floorplan' ? '▲' : '▼'}</span>
        </button>

        {expandedSection === 'floorplan' && (
          <div className="border-t px-5 pb-5 pt-4 space-y-4">
            {floorplan ? (
              <>
                {/* SVG preview */}
                {(floorplan.svgInline || floorplan.svgUrl) && (
                  <div className="rounded-xl border bg-slate-50 p-2 overflow-auto">
                    {floorplan.svgInline
                      ? <div
                          className="max-w-full"
                          // eslint-disable-next-line react/no-danger
                          dangerouslySetInnerHTML={{ __html: floorplan.svgInline }}
                        />
                      : <img src={floorplan.svgUrl} alt="Concept floor plan" className="max-w-full" />
                    }
                  </div>
                )}

                {/* Summary */}
                <div className="grid grid-cols-2 gap-3 text-sm sm:grid-cols-3">
                  <div className="rounded-xl bg-slate-50 p-3">
                    <div className="text-xs text-slate-500 mb-1">Total Area</div>
                    <div className="font-semibold">{fmt(floorplan.totalAreaFt2)} sq ft</div>
                  </div>
                  <div className="rounded-xl bg-slate-50 p-3">
                    <div className="text-xs text-slate-500 mb-1">Rooms</div>
                    <div className="font-semibold">{floorplan.roomCount}</div>
                  </div>
                  <div className="rounded-xl bg-slate-50 p-3">
                    <div className="text-xs text-slate-500 mb-1">Layout Issues</div>
                    <div className={`font-semibold ${floorplan.layoutIssues.length > 0 ? 'text-amber-600' : 'text-green-600'}`}>
                      {floorplan.layoutIssues.length === 0 ? 'None' : floorplan.layoutIssues.length}
                    </div>
                  </div>
                </div>

                {/* Room list */}
                <div>
                  <h4 className="mb-2 text-sm font-medium text-slate-700">Room Inventory</h4>
                  <div className="divide-y rounded-xl border text-sm overflow-hidden">
                    {floorplan.rooms.map(r => (
                      <div key={r.id} className="flex items-center justify-between px-4 py-2">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{r.label}</span>
                          {(r.issues?.length ?? 0) > 0 && (
                            <span className="rounded-full bg-red-100 px-1.5 py-0.5 text-xs text-red-700">!</span>
                          )}
                        </div>
                        <span className="text-slate-500">
                          {r.widthFt}' × {r.depthFt}' · {fmt(r.areaFt2)} sq ft
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Layout issues */}
                {floorplan.layoutIssues.length > 0 && (
                  <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
                    <h4 className="mb-2 text-sm font-medium text-amber-700">Layout Notes</h4>
                    <ul className="space-y-1 text-sm text-amber-800">
                      {floorplan.layoutIssues.map((n, i) => (
                        <li key={i} className="flex gap-2"><span>•</span>{n}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </>
            ) : (
              <div className="py-6 text-center text-sm text-slate-500">
                No floor plan generated yet. Use the action below to generate one.
              </div>
            )}
          </div>
        )}
      </section>

      {/* ── Section: Concept Narrative & Scope ──────────────────────────── */}
      <section className="rounded-2xl border bg-white shadow-sm overflow-hidden">
        <button
          onClick={() => toggle('narrative')}
          className="flex w-full items-center justify-between px-5 py-4 text-left"
        >
          <div className="flex items-center gap-3">
            <span className="text-lg font-semibold">Concept Narrative & Scope</span>
            {conceptPackage
              ? <ReadinessChip status={conceptPackage.status} />
              : <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-500">Not generated</span>}
          </div>
          <span className="text-slate-400">{expandedSection === 'narrative' ? '▲' : '▼'}</span>
        </button>

        {expandedSection === 'narrative' && (
          <div className="border-t px-5 pb-5 pt-4 space-y-4">
            {conceptPackage?.narrative ? (
              <>
                <div className="space-y-3 text-sm text-slate-700">
                  <div>
                    <span className="font-medium">Project Summary: </span>
                    {conceptPackage.narrative.projectSummary}
                  </div>
                  <div>
                    <span className="font-medium">Design Intent: </span>
                    {conceptPackage.narrative.designIntent}
                  </div>
                  <div>
                    <span className="font-medium">Material Direction: </span>
                    {conceptPackage.narrative.materialDirection}
                  </div>
                  <div>
                    <span className="font-medium">Style Direction: </span>
                    {conceptPackage.narrative.styleNarrative}
                  </div>
                  <div className="rounded-xl bg-blue-50 border border-blue-100 p-3">
                    <span className="font-medium text-blue-800">Architect Next Steps: </span>
                    <span className="text-blue-700">{conceptPackage.narrative.nextSteps}</span>
                  </div>
                </div>

                {conceptPackage.scope && (
                  <div className="rounded-xl border bg-slate-50 p-4">
                    <h4 className="mb-2 text-sm font-medium text-slate-700">Rough Scope Direction</h4>
                    <div className="mb-2 text-sm">
                      <span className="font-medium">Estimated range: </span>
                      {fmtK(conceptPackage.scope.totalEstimatedMin)} – {fmtK(conceptPackage.scope.totalEstimatedMax)}
                    </div>
                    <p className="mb-3 text-sm text-amber-700 bg-amber-50 rounded-lg p-2">
                      {conceptPackage.scope.budgetFitNote}
                    </p>
                    <ul className="space-y-1 text-sm text-slate-600">
                      {conceptPackage.scope.topRequiredTrades.map((t, i) => (
                        <li key={i} className="flex gap-2"><span className="text-slate-400">→</span>{t}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </>
            ) : (
              <div className="py-6 text-center text-sm text-slate-500">
                Generate a concept package to see narrative and scope direction.
              </div>
            )}
          </div>
        )}
      </section>

      {/* ── Section: Visual Prompt Bundle ───────────────────────────────── */}
      <section className="rounded-2xl border bg-white shadow-sm overflow-hidden">
        <button
          onClick={() => toggle('visuals')}
          className="flex w-full items-center justify-between px-5 py-4 text-left"
        >
          <span className="text-lg font-semibold">Visual Prompt Bundle</span>
          <span className="text-slate-400">{expandedSection === 'visuals' ? '▲' : '▼'}</span>
        </button>

        {expandedSection === 'visuals' && (
          <div className="border-t px-5 pb-5 pt-4 space-y-4">
            {conceptPackage?.visuals ? (
              <>
                <div className="flex flex-wrap gap-2 mb-2">
                  {conceptPackage.visuals.styleKeywords.map(k => (
                    <span key={k} className="rounded-full bg-indigo-50 border border-indigo-100 px-2 py-0.5 text-xs text-indigo-700">
                      {k}
                    </span>
                  ))}
                </div>
                <div className="space-y-3">
                  {conceptPackage.visuals.midjourneyPrompts.slice(0, 3).map((p, i) => (
                    <div key={i} className="rounded-xl bg-slate-50 border p-3">
                      <div className="mb-1 text-xs text-slate-500 font-medium">
                        Midjourney · {conceptPackage.visuals?.descriptions[i] ?? `Prompt ${i + 1}`}
                      </div>
                      <div className="text-xs font-mono text-slate-700 leading-relaxed break-all">
                        {p.length > 200 ? p.slice(0, 200) + '…' : p}
                      </div>
                      <button
                        onClick={() => navigator.clipboard.writeText(p)}
                        className="mt-2 text-xs text-blue-600 hover:underline"
                      >
                        Copy prompt
                      </button>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div className="py-6 text-center text-sm text-slate-500">
                Visual prompts will appear after concept package generation.
              </div>
            )}
          </div>
        )}
      </section>

      {/* ── Section: Architect Handoff Readiness ────────────────────────── */}
      <section className="rounded-2xl border bg-white shadow-sm overflow-hidden">
        <button
          onClick={() => toggle('handoff')}
          className="flex w-full items-center justify-between px-5 py-4 text-left"
        >
          <div className="flex items-center gap-3">
            <span className="text-lg font-semibold">Architect Handoff</span>
            {handoffReadiness?.reviewStatus
              ? <ReadinessChip status={handoffReadiness.reviewStatus} />
              : <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-500">Not routed</span>}
          </div>
          <span className="text-slate-400">{expandedSection === 'handoff' ? '▲' : '▼'}</span>
        </button>

        {expandedSection === 'handoff' && (
          <div className="border-t px-5 pb-5 pt-4 space-y-4">
            {handoffReadiness ? (
              <>
                {handoffReadiness.recommendedService && (
                  <div className="rounded-xl bg-blue-50 border border-blue-100 p-4 text-sm">
                    <div className="font-medium text-blue-800 mb-1">Recommended Service</div>
                    <div className="text-blue-700">
                      {handoffReadiness.recommendedService.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}
                    </div>
                    {handoffReadiness.upsellNotes && (
                      <p className="mt-2 text-xs text-blue-600">{handoffReadiness.upsellNotes}</p>
                    )}
                  </div>
                )}

                {handoffReadiness.flaggedUncertainties.length > 0 && (
                  <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
                    <h4 className="mb-2 text-sm font-medium text-amber-700">Flagged Uncertainties</h4>
                    <ul className="space-y-1.5 text-sm text-amber-800">
                      {handoffReadiness.flaggedUncertainties.map((u, i) => (
                        <li key={i} className="flex gap-2"><span>⚠</span>{u}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {handoffReadiness.reviewTaskId && (
                  <div className="text-xs text-slate-500">
                    Review Task #{handoffReadiness.reviewTaskId} · Status: {handoffReadiness.reviewStatus}
                  </div>
                )}
              </>
            ) : (
              <div className="py-6 text-center text-sm text-slate-500">
                Route to architect review after generating a concept package.
              </div>
            )}
          </div>
        )}
      </section>

      {/* ── Actions ─────────────────────────────────────────────────────── */}
      <section className="rounded-2xl border bg-white p-5 shadow-sm">
        <h3 className="mb-4 text-base font-semibold">Concept Engine Actions</h3>
        <div className="grid gap-2">
          <button
            onClick={() => run('floorplan', onGenerateFloorplan)}
            disabled={!!loadingAction}
            className="rounded-xl bg-black px-4 py-2 text-sm font-medium text-white
                       hover:bg-slate-800 transition-colors disabled:opacity-50"
          >
            {loadingAction === 'floorplan' ? 'Generating…' : 'Generate Floor Plan'}
          </button>

          <button
            onClick={() => run('package', onGenerateConceptPackage)}
            disabled={!floorplan || !!loadingAction}
            className="rounded-xl border px-4 py-2 text-sm hover:bg-slate-50
                       transition-colors disabled:opacity-40"
          >
            {loadingAction === 'package' ? 'Generating…' : 'Generate Concept Package'}
          </button>

          <button
            onClick={() => run('review', onRouteToArchitectReview)}
            disabled={!conceptPackage || !!loadingAction}
            className="rounded-xl border border-blue-200 px-4 py-2 text-sm text-blue-700
                       hover:bg-blue-50 transition-colors disabled:opacity-40"
          >
            {loadingAction === 'review' ? 'Routing…' : 'Route to Architect Review'}
          </button>

          <button
            onClick={onRequestMoreCapture}
            disabled={!!loadingAction}
            className="rounded-xl border px-4 py-2 text-sm hover:bg-slate-50 transition-colors"
          >
            Request More Capture
          </button>

          <button
            onClick={() => run('deliver', onApproveForDelivery)}
            disabled={!conceptPackage || !!loadingAction}
            className="rounded-xl border border-green-200 px-4 py-2 text-sm text-green-700
                       hover:bg-green-50 transition-colors disabled:opacity-40"
          >
            {loadingAction === 'deliver' ? 'Approving…' : 'Approve for Delivery'}
          </button>
        </div>
      </section>

    </div>
  );
}
