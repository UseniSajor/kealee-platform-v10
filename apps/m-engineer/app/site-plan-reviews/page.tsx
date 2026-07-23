"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { getSitePlanReviews, submitSitePlanReviewDecision, type SitePlanProfessionalReview } from "../../lib/api";

function label(value: string) { return value.replaceAll("_", " ").toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase()); }

export default function SitePlanReviewsPage() {
  const [reviews, setReviews] = useState<SitePlanProfessionalReview[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<SitePlanProfessionalReview | null>(null);
  const [declaration, setDeclaration] = useState("");
  const [redlines, setRedlines] = useState("");
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    setLoading(true); setError(null);
    const result = await getSitePlanReviews();
    if (!result.success) setError(result.error ?? "Unable to load review assignments");
    else setReviews(result.data?.reviews ?? []);
    setLoading(false);
  }, []);
  useEffect(() => { void load(); }, [load]);

  async function decide(decision: "REJECTED" | "REVISION_REQUESTED") {
    if (!selected || declaration.trim().length < 10) return setError("Enter a professional declaration of at least 10 characters.");
    setBusy(true); setError(null);
    const result = await submitSitePlanReviewDecision(selected.id, {
      decision, declaration: declaration.trim(), licenseNumber: selected.licenseNumber,
      redlines: redlines.split("\n").map((line) => line.trim()).filter(Boolean),
    });
    if (!result.success) setError(result.error ?? "Decision could not be recorded");
    else { setSelected(null); setDeclaration(""); setRedlines(""); await load(); }
    setBusy(false);
  }

  return <main className="min-h-screen bg-slate-50 px-4 py-8 text-slate-900 sm:px-8">
    <div className="mx-auto max-w-6xl">
      <header className="mb-8 flex items-center justify-between gap-4">
        <div><p className="text-sm font-semibold text-teal-700">Kealee Professional Portal</p><h1 className="text-3xl font-bold">Site-plan reviews</h1><p className="mt-2 text-slate-600">Regulated deliverables remain locked until all compliance and professional controls pass.</p></div>
        <Link href="/projects" className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium">Engineering projects</Link>
      </header>
      {error && <div role="alert" className="mb-5 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800">{error}</div>}
      {loading ? <p aria-live="polite">Loading review assignments…</p> : reviews.length === 0 ?
        <div className="rounded-xl border bg-white p-8 text-center text-slate-600">No site-plan reviews are assigned to your professional profile.</div> :
        <div className="grid gap-4 lg:grid-cols-2">{reviews.map((review) => <article key={review.id} className="rounded-xl border bg-white p-5 shadow-sm">
          <div className="flex justify-between gap-3"><div><h2 className="font-semibold">Project {review.workflow?.projectId ?? "Unavailable"}</h2><p className="text-sm text-slate-500">{review.jurisdictionCode} · {label(review.discipline)}</p></div><span className="h-fit rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold">{label(review.decision)}</span></div>
          <dl className="mt-4 grid grid-cols-2 gap-3 text-sm"><div><dt className="text-slate-500">Stage</dt><dd>{label(review.workflow?.currentStage ?? "unknown")}</dd></div><div><dt className="text-slate-500">License</dt><dd>{review.licenseNumber}{review.licenseVerifiedAt ? " · verified" : " · unverified"}</dd></div><div><dt className="text-slate-500">Blocking findings</dt><dd className={review.blockingComplianceCount ? "font-semibold text-red-700" : "text-emerald-700"}>{review.blockingComplianceCount}</dd></div><div><dt className="text-slate-500">Updated</dt><dd>{new Date(review.updatedAt).toLocaleDateString()}</dd></div></dl>
          <button type="button" onClick={() => { setSelected(review); setError(null); }} className="mt-5 rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white">Review and decide</button>
        </article>)}</div>}
      {selected && <div role="dialog" aria-modal="true" aria-labelledby="review-title" className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"><section className="w-full max-w-xl rounded-xl bg-white p-6 shadow-xl">
        <h2 id="review-title" className="text-xl font-bold">Record professional decision</h2><p className="mt-1 text-sm text-slate-600">Approval requires immutable source/sealed document evidence and is completed through the controlled signing workflow. This form records rejection or redlines.</p>
        <label className="mt-5 block text-sm font-medium">Professional declaration<textarea value={declaration} onChange={(e) => setDeclaration(e.target.value)} rows={4} className="mt-1 w-full rounded-lg border p-3" /></label>
        <label className="mt-4 block text-sm font-medium">Redlines (one per line)<textarea value={redlines} onChange={(e) => setRedlines(e.target.value)} rows={5} className="mt-1 w-full rounded-lg border p-3" /></label>
        <div className="mt-6 flex flex-wrap justify-end gap-2"><button type="button" onClick={() => setSelected(null)} disabled={busy} className="rounded-lg border px-4 py-2">Cancel</button><button type="button" onClick={() => void decide("REJECTED")} disabled={busy} className="rounded-lg bg-red-700 px-4 py-2 text-white">Reject</button><button type="button" onClick={() => void decide("REVISION_REQUESTED")} disabled={busy || !redlines.trim()} className="rounded-lg bg-amber-600 px-4 py-2 text-white">Request revisions</button></div>
      </section></div>}
    </div>
  </main>;
}
