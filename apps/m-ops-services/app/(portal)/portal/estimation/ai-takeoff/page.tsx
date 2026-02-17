"use client";

import { useCallback, useState } from "react";
import Link from "next/link";
import { api } from "@/lib/api";

function formatMoney(n: number) {
  return n.toLocaleString(undefined, {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 2,
  });
}

const DISCIPLINES = [
  { value: "general", label: "General / All Trades" },
  { value: "structural", label: "Structural" },
  { value: "architectural", label: "Architectural" },
  { value: "mechanical", label: "Mechanical (HVAC)" },
  { value: "electrical", label: "Electrical" },
  { value: "plumbing", label: "Plumbing" },
  { value: "civil", label: "Civil / Site Work" },
  { value: "landscape", label: "Landscape" },
  { value: "fire_protection", label: "Fire Protection" },
];

type TakeoffStatus = "idle" | "uploading" | "processing" | "complete" | "error";

export default function AiTakeoffPage() {
  const [status, setStatus] = useState<TakeoffStatus>("idle");
  const [error, setError] = useState<string | null>(null);

  // File upload
  const [file, setFile] = useState<File | null>(null);
  const [isDragActive, setIsDragActive] = useState(false);

  // Config
  const [discipline, setDiscipline] = useState("general");

  // Results
  const [uploadResult, setUploadResult] = useState<any>(null);
  const [takeoffResult, setTakeoffResult] = useState<any>(null);

  // Existing takeoffs
  const [existingTakeoffs, setExistingTakeoffs] = useState<any[]>([]);
  const [showExisting, setShowExisting] = useState(false);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDragEnter = useCallback(() => {
    setIsDragActive(true);
  }, []);

  const handleDragLeave = useCallback(() => {
    setIsDragActive(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(false);

    const droppedFiles = Array.from(e.dataTransfer.files);
    if (droppedFiles.length > 0) {
      const f = droppedFiles[0];
      if (validateFile(f)) {
        setFile(f);
        setError(null);
      }
    }
  }, []);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(e.target.files || []);
    if (selectedFiles.length > 0) {
      const f = selectedFiles[0];
      if (validateFile(f)) {
        setFile(f);
        setError(null);
      }
    }
  }, []);

  function validateFile(f: File): boolean {
    const maxSize = 100 * 1024 * 1024; // 100MB
    if (f.size > maxSize) {
      setError("File exceeds 100MB limit.");
      return false;
    }
    const allowed = [
      "application/pdf",
      "image/png",
      "image/jpeg",
      "image/tiff",
      "application/dxf",
      "image/vnd.dwg",
    ];
    // Also allow by extension
    const ext = f.name.split(".").pop()?.toLowerCase();
    const allowedExts = ["pdf", "png", "jpg", "jpeg", "tiff", "tif", "dxf", "dwg"];
    if (!allowed.includes(f.type) && !allowedExts.includes(ext || "")) {
      setError("File type not supported. Upload PDF, PNG, JPG, TIFF, DXF, or DWG files.");
      return false;
    }
    return true;
  }

  function formatFileSize(bytes: number) {
    if (bytes === 0) return "0 B";
    const k = 1024;
    const sizes = ["B", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  }

  async function handleUploadAndProcess() {
    if (!file) {
      setError("Please select a file first.");
      return;
    }

    setError(null);
    setStatus("uploading");
    setUploadResult(null);
    setTakeoffResult(null);

    try {
      // Step 1: Upload the plan
      const formData = new FormData();
      formData.append("file", file);
      formData.append("discipline", discipline);

      const upload = await api.uploadTakeoffPlan(formData);
      setUploadResult(upload.takeoff);
      setStatus("processing");

      // Step 2: Run AI takeoff
      const result = await api.runAiTakeoff({
        takeoffId: upload.takeoff?.id,
        discipline,
      });

      setTakeoffResult(result.result);
      setStatus("complete");
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Takeoff failed");
      setStatus("error");
    }
  }

  async function loadExistingTakeoffs() {
    try {
      const result = await api.listTakeoffs();
      setExistingTakeoffs(result.takeoffs || []);
      setShowExisting(true);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to load takeoffs");
    }
  }

  function reset() {
    setFile(null);
    setStatus("idle");
    setError(null);
    setUploadResult(null);
    setTakeoffResult(null);
  }

  return (
    <section className="space-y-6">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black tracking-tight">AI Takeoff</h1>
          <p className="mt-2 text-sm text-zinc-700">
            Upload project plans and let AI extract quantities, measurements, and cost items
            automatically.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={loadExistingTakeoffs}
            className="rounded-xl border border-black/10 bg-white px-4 py-2 text-sm font-black text-zinc-900 hover:bg-zinc-50"
          >
            Previous Takeoffs
          </button>
          <Link
            href="/portal/estimation"
            className="rounded-xl border border-black/10 bg-white px-4 py-2 text-sm font-black text-zinc-900 hover:bg-zinc-50"
          >
            Back to Estimates
          </Link>
        </div>
      </header>

      {error && (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-900">
          {error}
          <button
            type="button"
            onClick={() => setError(null)}
            className="ml-3 text-xs font-black underline"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Existing takeoffs panel */}
      {showExisting && (
        <div className="rounded-2xl border border-black/10 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-lg font-black tracking-tight">Previous takeoffs</h2>
            <button
              type="button"
              onClick={() => setShowExisting(false)}
              className="text-sm font-extrabold text-[color:var(--primary)] hover:underline"
            >
              Hide
            </button>
          </div>
          {existingTakeoffs.length === 0 ? (
            <div className="mt-3 text-sm text-zinc-700">No previous takeoffs found.</div>
          ) : (
            <div className="mt-3 grid gap-2">
              {existingTakeoffs.map((t: any) => (
                <div
                  key={t.id}
                  className="rounded-xl border border-black/10 bg-zinc-50 p-3 text-sm"
                >
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <div className="font-black text-zinc-900">
                        {t.fileName || t.name || "Takeoff"}
                      </div>
                      <div className="text-xs text-zinc-600">
                        {t.discipline || "General"} &middot;{" "}
                        {t.createdAt
                          ? new Date(t.createdAt).toLocaleDateString()
                          : "Unknown date"}
                      </div>
                    </div>
                    <span
                      className={[
                        "inline-flex items-center rounded-full border px-2.5 py-1 text-[11px] font-black capitalize",
                        t.status === "complete"
                          ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                          : t.status === "processing"
                            ? "border-sky-200 bg-sky-50 text-sky-700"
                            : "border-zinc-200 bg-zinc-50 text-zinc-700",
                      ].join(" ")}
                    >
                      {t.status || "unknown"}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-[1.2fr_1fr]">
        {/* Left column: Upload + Config */}
        <div className="space-y-6">
          {/* File upload zone */}
          <div className="rounded-2xl border border-black/10 bg-white p-5 shadow-sm">
            <h2 className="text-lg font-black tracking-tight">Upload plan</h2>
            <p className="mt-1 text-sm text-zinc-700">
              Upload PDF, PNG, JPG, TIFF, DXF, or DWG files of your project plans.
            </p>

            <div
              onDragOver={handleDragOver}
              onDragEnter={handleDragEnter}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              className={[
                "mt-4 rounded-2xl border-2 border-dashed p-8 text-center transition",
                isDragActive
                  ? "border-[var(--primary)] bg-sky-50"
                  : "border-black/10 hover:border-[var(--primary)]/50 hover:bg-zinc-50",
              ].join(" ")}
            >
              <input
                type="file"
                onChange={handleFileSelect}
                className="hidden"
                id="takeoff-file-input"
                accept=".pdf,.png,.jpg,.jpeg,.tiff,.tif,.dxf,.dwg"
              />
              <label htmlFor="takeoff-file-input" className="cursor-pointer">
                <div className="text-3xl">&#128196;</div>
                <p className="mt-2 text-sm font-black text-zinc-900">
                  {isDragActive ? "Drop file here" : "Drag & drop a plan file"}
                </p>
                <p className="mt-1 text-xs text-zinc-600">or click to browse files</p>
              </label>
            </div>

            {file && (
              <div className="mt-4 flex items-center justify-between gap-3 rounded-xl border border-black/10 bg-zinc-50 p-3">
                <div>
                  <div className="text-sm font-black text-zinc-900">{file.name}</div>
                  <div className="text-xs text-zinc-600">{formatFileSize(file.size)}</div>
                </div>
                <button
                  type="button"
                  onClick={() => setFile(null)}
                  className="text-xs font-black text-red-600 hover:underline"
                >
                  Remove
                </button>
              </div>
            )}
          </div>

          {/* Discipline selection */}
          <div className="rounded-2xl border border-black/10 bg-white p-5 shadow-sm">
            <h2 className="text-lg font-black tracking-tight">Configuration</h2>
            <div className="mt-4">
              <label className="block text-sm font-extrabold text-zinc-900">Discipline</label>
              <select
                value={discipline}
                onChange={(e) => setDiscipline(e.target.value)}
                className="mt-1.5 h-10 w-full rounded-xl border border-black/10 bg-white px-3 text-sm outline-none focus:ring-2 focus:ring-[var(--primary)]/25"
              >
                {DISCIPLINES.map((d) => (
                  <option key={d.value} value={d.value}>
                    {d.label}
                  </option>
                ))}
              </select>
              <p className="mt-1.5 text-xs text-zinc-600">
                Select the discipline to focus the AI extraction on specific trade items.
              </p>
            </div>
          </div>

          {/* Action button */}
          <div className="flex gap-3">
            {status === "complete" || status === "error" ? (
              <button
                type="button"
                onClick={reset}
                className="rounded-xl border border-black/10 bg-white px-6 py-2.5 text-sm font-black text-zinc-900 hover:bg-zinc-50"
              >
                Start New Takeoff
              </button>
            ) : null}
            <button
              type="button"
              onClick={handleUploadAndProcess}
              disabled={!file || status === "uploading" || status === "processing"}
              className="inline-flex items-center justify-center rounded-xl bg-[var(--primary)] px-6 py-2.5 text-sm font-black text-[var(--primary-foreground)] shadow-sm hover:opacity-95 disabled:opacity-60"
            >
              {status === "uploading"
                ? "Uploading plan..."
                : status === "processing"
                  ? "AI is processing..."
                  : "Upload & Run AI Takeoff"}
            </button>
          </div>
        </div>

        {/* Right column: Status + Results */}
        <div className="space-y-6">
          {/* Progress */}
          <div className="rounded-2xl border border-black/10 bg-white p-5 shadow-sm">
            <h3 className="text-lg font-black tracking-tight">Status</h3>
            <div className="mt-4 space-y-3">
              <Step
                label="Upload plan file"
                done={status === "processing" || status === "complete"}
                active={status === "uploading"}
              />
              <Step
                label="AI extraction & analysis"
                done={status === "complete"}
                active={status === "processing"}
              />
              <Step label="Results ready" done={status === "complete"} active={false} />
            </div>
          </div>

          {/* Upload info */}
          {uploadResult && (
            <div className="rounded-2xl border border-black/10 bg-white p-5 shadow-sm">
              <h3 className="text-lg font-black tracking-tight">Upload details</h3>
              <div className="mt-3 grid gap-2 text-sm">
                {uploadResult.fileName && (
                  <div className="flex items-center justify-between gap-3">
                    <span className="font-extrabold text-zinc-900">File</span>
                    <span className="text-zinc-600">{uploadResult.fileName}</span>
                  </div>
                )}
                {uploadResult.id && (
                  <div className="flex items-center justify-between gap-3">
                    <span className="font-extrabold text-zinc-900">Takeoff ID</span>
                    <span className="font-mono text-xs text-zinc-600">{uploadResult.id}</span>
                  </div>
                )}
                {uploadResult.pageCount && (
                  <div className="flex items-center justify-between gap-3">
                    <span className="font-extrabold text-zinc-900">Pages</span>
                    <span className="text-zinc-600">{uploadResult.pageCount}</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Takeoff results */}
          {takeoffResult && (
            <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-5 shadow-sm">
              <h3 className="text-lg font-black tracking-tight text-emerald-900">
                Takeoff Results
              </h3>

              {takeoffResult.summary && (
                <p className="mt-2 text-sm text-emerald-800 whitespace-pre-wrap">
                  {takeoffResult.summary}
                </p>
              )}

              {takeoffResult.items && takeoffResult.items.length > 0 && (
                <div className="mt-4 overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-emerald-200">
                        <th className="pb-2 text-left text-xs font-extrabold text-emerald-800">
                          Item
                        </th>
                        <th className="pb-2 text-right text-xs font-extrabold text-emerald-800">
                          Qty
                        </th>
                        <th className="pb-2 text-right text-xs font-extrabold text-emerald-800">
                          Unit Cost
                        </th>
                        <th className="pb-2 text-right text-xs font-extrabold text-emerald-800">
                          Total
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {takeoffResult.items.map((item: any, idx: number) => (
                        <tr key={idx} className="border-b border-emerald-100">
                          <td className="py-2 pr-3 font-black text-emerald-900">
                            {item.name || item.description || `Item ${idx + 1}`}
                          </td>
                          <td className="py-2 pr-3 text-right text-emerald-800">
                            {item.quantity ?? "-"} {item.unit || ""}
                          </td>
                          <td className="py-2 pr-3 text-right text-emerald-800">
                            {item.unitCost != null ? formatMoney(item.unitCost) : "-"}
                          </td>
                          <td className="py-2 text-right font-black text-emerald-900">
                            {item.totalCost != null ? formatMoney(item.totalCost) : "-"}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {takeoffResult.totalEstimatedCost != null && (
                <div className="mt-4 rounded-xl bg-white/60 p-3">
                  <div className="text-xs font-semibold text-emerald-700">
                    Total estimated cost
                  </div>
                  <div className="text-xl font-black text-emerald-900">
                    {formatMoney(takeoffResult.totalEstimatedCost)}
                  </div>
                </div>
              )}

              {/* Raw JSON fallback */}
              {!takeoffResult.items && !takeoffResult.summary && (
                <pre className="mt-3 overflow-x-auto whitespace-pre-wrap rounded-xl bg-white/60 p-3 text-xs text-emerald-900">
                  {JSON.stringify(takeoffResult, null, 2)}
                </pre>
              )}
            </div>
          )}

          {/* Info card */}
          <div className="rounded-2xl border border-black/10 bg-zinc-50 p-5 shadow-sm">
            <div className="text-sm font-black text-zinc-900">How AI Takeoff works</div>
            <ul className="mt-2 space-y-1 text-sm text-zinc-700">
              <li className="flex gap-2">
                <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--primary)]" />
                Upload architectural, structural, or MEP plan sheets
              </li>
              <li className="flex gap-2">
                <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--primary)]" />
                AI identifies and measures elements on each sheet
              </li>
              <li className="flex gap-2">
                <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--primary)]" />
                Quantities are matched to cost database items
              </li>
              <li className="flex gap-2">
                <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--primary)]" />
                Results can be imported into your estimate
              </li>
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}

function Step({
  label,
  done,
  active,
}: {
  label: string;
  done: boolean;
  active: boolean;
}) {
  return (
    <div className="flex items-center gap-3">
      <div
        className={[
          "flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-black",
          done
            ? "bg-emerald-100 text-emerald-700"
            : active
              ? "bg-sky-100 text-sky-700 animate-pulse"
              : "bg-zinc-100 text-zinc-500",
        ].join(" ")}
      >
        {done ? "\u2713" : active ? "\u2026" : "\u2022"}
      </div>
      <span
        className={[
          "text-sm font-black",
          done ? "text-emerald-700" : active ? "text-sky-700" : "text-zinc-500",
        ].join(" ")}
      >
        {label}
      </span>
    </div>
  );
}
