export function ReviewWorkbench({
  exteriorImages,
  landscapeImages,
}: {
  exteriorImages: string[];
  landscapeImages: string[];
}) {
  return (
    <div className="space-y-6">
      <section className="rounded-2xl border bg-white p-5 shadow-sm">
        <h3 className="mb-3 text-lg font-semibold">Exterior Concepts</h3>
        {exteriorImages.length === 0 ? (
          <p className="text-sm text-slate-500">No exterior concepts generated yet.</p>
        ) : (
          <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
            {exteriorImages.map((src, i) => (
              <div key={src} className="relative group">
                <img src={src} alt={`Exterior concept ${i + 1}`} className="h-48 w-full rounded-xl object-cover bg-slate-100" />
                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <span className="rounded-xl bg-black/60 px-3 py-1 text-xs text-white">Option {i + 1}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="rounded-2xl border bg-white p-5 shadow-sm">
        <h3 className="mb-3 text-lg font-semibold">Landscape Concepts</h3>
        {landscapeImages.length === 0 ? (
          <p className="text-sm text-slate-500">No landscape concepts generated yet.</p>
        ) : (
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            {landscapeImages.map((src, i) => (
              <div key={src} className="relative group">
                <img src={src} alt={`Landscape concept ${i + 1}`} className="h-48 w-full rounded-xl object-cover bg-slate-100" />
                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <span className="rounded-xl bg-black/60 px-3 py-1 text-xs text-white">Option {i + 1}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
