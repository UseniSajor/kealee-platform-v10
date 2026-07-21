export function GCTestimonials() {
  return (
    <section>
      <h3 className="text-2xl font-black tracking-tight">GC Testimonials</h3>
      <p className="mt-2 max-w-3xl text-sm text-zinc-700">
        What general contractors say after offloading permits, coordination, and
        reporting.
      </p>

      <div className="mt-6 grid gap-4 md:grid-cols-3">
        {[
          {
            quote:
              "We stopped losing Fridays to paperwork. Permits and inspection follow-ups just… happen now.",
            name: "Owner, Residential GC",
            result: "Saved ~20 hrs/week",
          },
          {
            quote:
              "Weekly reports used to be a scramble. Now clients get a clean update every week with action items.",
            name: "Project Manager, Design/Build GC",
            result: "Fewer client escalations",
          },
          {
            quote:
              "We used to eat margin on delays. The proactive tracking and vendor follow-ups made our schedules tighter.",
            name: "Ops Lead, Multi-project GC",
            result: "Faster cycle times",
          },
        ].map((t) => (
          <figure
            key={t.quote}
            className="rounded-2xl border border-black/10 bg-white p-5 shadow-sm"
          >
            <blockquote className="text-sm leading-relaxed text-zinc-800">
              “{t.quote}”
            </blockquote>
            <figcaption className="mt-4 flex items-center justify-between gap-3">
              <div className="text-xs font-bold text-zinc-700">{t.name}</div>
              <div className="rounded-full bg-sky-50 px-2.5 py-1 text-[11px] font-black text-sky-700">
                {t.result}
              </div>
            </figcaption>
          </figure>
        ))}
      </div>
    </section>
  );
}

