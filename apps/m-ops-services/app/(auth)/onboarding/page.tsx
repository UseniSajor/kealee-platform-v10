import Link from "next/link";

import { GCOnboarding } from "@/components/gc-auth/GCOnboarding";

export default function OnboardingPage() {
  return (
    <section className="space-y-6">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black tracking-tight">Onboarding</h1>
          <p className="mt-2 max-w-3xl text-sm text-zinc-700">
            Tell us how your GC operates so Kealee PMs can set up your workflows,
            templates, and reporting.
          </p>
        </div>
        <Link
          href="/portal"
          className="rounded-xl border border-black/10 bg-white px-4 py-2 text-sm font-black text-zinc-900 hover:bg-zinc-50"
        >
          Skip to portal
        </Link>
      </header>

      <GCOnboarding />
    </section>
  );
}

