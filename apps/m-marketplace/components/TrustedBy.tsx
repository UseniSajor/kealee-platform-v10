export function TrustedBy() {
  const logos = [
    { name: 'ABC Construction', width: 120 },
    { name: 'XYZ Builders', width: 140 },
    { name: 'BuildCo', width: 100 },
    { name: 'MetroDev', width: 130 },
    { name: 'UrbanBuild', width: 110 },
  ];

  return (
    <section className="py-12 bg-white border-y border-gray-200">
      <div className="container mx-auto px-6">
        <p className="text-center text-sm font-medium text-gray-600 mb-8">
          TRUSTED BY LEADING CONSTRUCTION COMPANIES
        </p>
        
        <div className="flex flex-wrap items-center justify-center gap-12 opacity-60">
          {logos.map((logo, i) => (
            <div
              key={i}
              className="text-gray-400 font-bold text-xl"
              style={{ width: logo.width }}
            >
              {logo.name}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}




