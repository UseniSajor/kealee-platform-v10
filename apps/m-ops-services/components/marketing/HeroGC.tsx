import Image from "next/image";

export function HeroGC() {
  return (
    <section className="rounded-2xl border border-black/10 bg-[linear-gradient(135deg,rgba(14,165,233,0.10),rgba(255,255,255,0))] p-6 shadow-sm">
      <div className="grid items-center gap-6 lg:grid-cols-[1.2fr_1fr]">
        <div>
          <div className="text-xs font-bold uppercase tracking-wide text-zinc-700">
            Built for General Contractors
          </div>
          <h1 className="mt-2 text-3xl font-black tracking-tight text-zinc-950 md:text-4xl">
            Get Back to Building. We Handle the Operations.
          </h1>
          <p className="mt-3 max-w-2xl text-base leading-relaxed text-zinc-800">
            <span className="font-extrabold">
              Professional operations for GCs who want to scale.
            </span>{" "}
            We become your operations department—permits, inspections, vendor
            coordination, documentation, and weekly reporting.
          </p>

          <div className="mt-5 flex flex-wrap gap-3">
            <div className="rounded-xl bg-white px-4 py-3 shadow-sm">
              <div className="text-lg font-black text-zinc-950">
                Average GC saves 22 hours/week
              </div>
              <div className="mt-1 text-xs font-semibold text-zinc-600">
                less admin, more building
              </div>
            </div>
            <div className="rounded-xl bg-white px-4 py-3 shadow-sm">
              <div className="text-lg font-black text-zinc-950">
                Used by 150+ GCs
              </div>
              <div className="mt-1 text-xs font-semibold text-zinc-600">
                trusted nationwide
              </div>
            </div>
          </div>
        </div>

        <div className="grid gap-3">
          <div className="overflow-hidden rounded-2xl border border-black/10 bg-white shadow-sm">
            <div className="px-4 py-2 text-xs font-semibold text-zinc-600">
              Before: paperwork pile-up
            </div>
            <div className="relative h-28">
              <Image
                src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='800' height='400'%3E%3Crect width='100%25' height='100%25' fill='%23f3f4f6'/%3E%3Ctext x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' fill='%236b7280' font-family='Arial' font-size='24'%3EFrustrated%20GC%20at%20desk%3C/text%3E%3C/svg%3E"
                alt="Frustrated GC at desk"
                fill
                className="object-cover"
              />
            </div>
          </div>

          <div className="overflow-hidden rounded-2xl border border-black/10 bg-white shadow-sm">
            <div className="px-4 py-2 text-xs font-semibold text-zinc-600">
              After: GC building on site
            </div>
            <div className="relative h-28">
              <Image
                src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='800' height='400'%3E%3Crect width='100%25' height='100%25' fill='%23ecfeff'/%3E%3Ctext x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' fill='%230ea5e9' font-family='Arial' font-size='24'%3EHappy%20GC%20on%20site%3C/text%3E%3C/svg%3E"
                alt="Happy GC on site"
                fill
                className="object-cover"
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

