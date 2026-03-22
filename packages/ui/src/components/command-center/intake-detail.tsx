"use client";

import { useState } from "react";
import { StatusBadge } from "./status-badge";
import { ConceptEnginePanel } from "./concept-engine-panel";
import type { ConceptEnginePanelProps } from "./concept-engine-panel";

interface IntakeDetailData {
  status: string;
  clientName?: string;
  contactEmail?: string;
  projectAddress?: string;
  projectType?: string;
  budgetRange?: string;
  jurisdiction?: string;
  uploadedPhotos?: string[];
  designBrief?: { summary?: string };
  permitPathSummary?: { notes?: string[] };
  // Concept engine fields
  intakeId?: string;
  projectPath?: string;
  conceptFloorplan?: ConceptEnginePanelProps['floorplan'];
  conceptPackage?:   ConceptEnginePanelProps['conceptPackage'];
  handoffReadiness?: ConceptEnginePanelProps['handoffReadiness'];
}

interface IntakeDetailProps {
  data: IntakeDetailData;
  onApprove?: () => void;
  onRequestInfo?: () => void;
  onRegenerateVisuals?: () => void;
  onEscalate?: () => void;
  onRoutePermit?: () => void;
  // Concept engine actions
  onGenerateFloorplan?:      () => Promise<void>;
  onGenerateConceptPackage?: () => Promise<void>;
  onRouteToArchitectReview?: () => Promise<void>;
  onRequestMoreCapture?:     () => void;
  onApproveForDelivery?:     () => Promise<void>;
}

export function IntakeDetail({
  data,
  onApprove,
  onRequestInfo,
  onRegenerateVisuals,
  onEscalate,
  onRoutePermit,
  onGenerateFloorplan,
  onGenerateConceptPackage,
  onRouteToArchitectReview,
  onRequestMoreCapture,
  onApproveForDelivery,
}: IntakeDetailProps) {
  const [actionNote, setActionNote] = useState("");

  return (
    <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
      {/* Left column */}
      <div className="space-y-6">
        <section className="rounded-2xl border bg-white p-5 shadow-sm">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="text-lg font-semibold">Project Snapshot</h3>
            <StatusBadge status={data.status} />
          </div>
          <div className="grid gap-3 text-sm sm:grid-cols-2">
            <div><span className="font-medium">Client:</span> {data.clientName}</div>
            <div><span className="font-medium">Email:</span> {data.contactEmail}</div>
            <div className="sm:col-span-2"><span className="font-medium">Address:</span> {data.projectAddress}</div>
            <div><span className="font-medium">Project Type:</span> {data.projectType}</div>
            <div><span className="font-medium">Budget:</span> {data.budgetRange}</div>
            <div><span className="font-medium">Jurisdiction:</span> {data.jurisdiction}</div>
          </div>
        </section>

        <section className="rounded-2xl border bg-white p-5 shadow-sm">
          <h3 className="mb-3 text-lg font-semibold">Uploaded Assets</h3>
          {(data.uploadedPhotos ?? []).length === 0 ? (
            <p className="text-sm text-slate-500">No photos uploaded.</p>
          ) : (
            <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
              {(data.uploadedPhotos ?? []).map((src) => (
                <img key={src} src={src} alt="Property" className="h-32 w-full rounded-xl object-cover bg-slate-100" />
              ))}
            </div>
          )}
        </section>
      </div>

      {/* Right column */}
      <div className="space-y-6">
        <section className="rounded-2xl border bg-white p-5 shadow-sm">
          <h3 className="mb-3 text-lg font-semibold">AI Summary</h3>
          <p className="text-sm text-slate-700">{data.designBrief?.summary ?? "No brief generated yet."}</p>
        </section>

        <section className="rounded-2xl border bg-white p-5 shadow-sm">
          <h3 className="mb-3 text-lg font-semibold">Permit Path</h3>
          {(data.permitPathSummary?.notes ?? []).length === 0 ? (
            <p className="text-sm text-slate-500">No permit path generated yet.</p>
          ) : (
            <ul className="space-y-2 text-sm text-slate-700">
              {(data.permitPathSummary?.notes ?? []).map((note) => (
                <li key={note} className="flex gap-2"><span className="text-slate-400">•</span>{note}</li>
              ))}
            </ul>
          )}
        </section>

        {/* Concept Engine Panel */}
        {data.intakeId && (
          <ConceptEnginePanel
            intakeId={data.intakeId}
            projectPath={data.projectPath ?? data.projectType ?? 'interior_renovation'}
            floorplan={data.conceptFloorplan}
            conceptPackage={data.conceptPackage}
            handoffReadiness={data.handoffReadiness}
            onGenerateFloorplan={onGenerateFloorplan}
            onGenerateConceptPackage={onGenerateConceptPackage}
            onRouteToArchitectReview={onRouteToArchitectReview}
            onRequestMoreCapture={onRequestMoreCapture}
            onApproveForDelivery={onApproveForDelivery}
          />
        )}

        <section className="rounded-2xl border bg-white p-5 shadow-sm">
          <h3 className="mb-3 text-lg font-semibold">Actions</h3>
          <textarea
            className="mb-3 w-full rounded-xl border px-3 py-2 text-sm"
            rows={2}
            placeholder="Optional note..."
            value={actionNote}
            onChange={(e) => setActionNote(e.target.value)}
          />
          <div className="grid gap-2">
            <button
              onClick={onApprove}
              className="rounded-xl bg-black px-4 py-2 text-white text-sm font-medium hover:bg-slate-800 transition-colors"
            >
              Approve package
            </button>
            <button
              onClick={onRequestInfo}
              className="rounded-xl border px-4 py-2 text-sm hover:bg-slate-50 transition-colors"
            >
              Request more info
            </button>
            <button
              onClick={onRegenerateVisuals}
              className="rounded-xl border px-4 py-2 text-sm hover:bg-slate-50 transition-colors"
            >
              Regenerate visuals
            </button>
            <button
              onClick={onEscalate}
              className="rounded-xl border border-red-200 px-4 py-2 text-sm text-red-700 hover:bg-red-50 transition-colors"
            >
              Escalate manual
            </button>
            <button
              onClick={onRoutePermit}
              className="rounded-xl border border-blue-200 px-4 py-2 text-sm text-blue-700 hover:bg-blue-50 transition-colors"
            >
              Route to permit service
            </button>
          </div>
        </section>
      </div>
    </div>
  );
}
