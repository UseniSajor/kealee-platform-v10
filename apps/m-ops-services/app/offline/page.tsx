import Link from "next/link";

export default function OfflinePage() {
  return (
    <section className="mx-auto max-w-2xl space-y-4 p-6">
      <h1 className="text-2xl font-black tracking-tight">You’re offline</h1>
      <p className="text-sm text-zinc-700">
        Connectivity on job sites can be spotty. You can still use offline-first
        tools (notes, checklists, draft logs). When you’re back online, refresh
        to sync.
      </p>
      <div className="flex flex-wrap gap-2">
        <Link
          href="/portal/site-tools"
          className="rounded-xl bg-[var(--primary)] px-4 py-2.5 text-sm font-black text-[var(--primary-foreground)] hover:opacity-95"
        >
          Open site tools
        </Link>
        <Link
          href="/portal"
          className="rounded-xl border border-black/10 bg-white px-4 py-2.5 text-sm font-black text-zinc-900 hover:bg-zinc-50"
        >
          Go to portal home
        </Link>
      </div>
      <div className="rounded-2xl border border-black/10 bg-zinc-50 p-4 text-sm text-zinc-700">
        Tip: Add Kealee to your home screen for a faster, app-like experience.
      </div>
    </section>
  );
}

