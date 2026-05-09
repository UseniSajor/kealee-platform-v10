export function AskAnythingBarSkeleton() {
  return (
    <div className="mx-auto max-w-4xl animate-pulse rounded-3xl border border-slate-200 bg-white p-6 shadow-inner">
      <div className="h-12 rounded-2xl bg-slate-100" />
      <div className="mt-4 flex justify-between gap-4">
        <div className="h-4 w-24 rounded bg-slate-100" />
        <div className="h-10 w-28 rounded-xl bg-slate-200" />
      </div>
    </div>
  )
}
