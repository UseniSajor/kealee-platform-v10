import Link from "next/link";

const categories = ["All", "Structural", "MEP", "Civil", "Industry News"];

const articles = [
  {
    title: "Understanding Seismic Retrofit Requirements for Older Buildings",
    date: "February 10, 2026",
    category: "Structural",
    excerpt:
      "Many older buildings were constructed before modern seismic codes were adopted. Learn about the most common retrofit strategies, when they are required, and how to plan for compliance with current building standards.",
    readTime: "6 min read",
  },
  {
    title: "HVAC System Selection: Heat Pumps vs. Traditional Systems for Commercial Projects",
    date: "February 3, 2026",
    category: "MEP",
    excerpt:
      "The shift toward electrification is changing how engineers approach HVAC design. This article compares heat pump systems with traditional gas-fired equipment for commercial applications, covering efficiency, cost, and code compliance.",
    readTime: "8 min read",
  },
  {
    title: "Stormwater Management Best Practices for New Developments",
    date: "January 27, 2026",
    category: "Civil",
    excerpt:
      "Stormwater regulations continue to evolve as municipalities address flooding and water quality. Explore current best management practices (BMPs), Low Impact Development (LID) strategies, and what developers need to know for permitting.",
    readTime: "7 min read",
  },
  {
    title: "How AI Is Changing the Engineering Review Process",
    date: "January 20, 2026",
    category: "Industry News",
    excerpt:
      "Artificial intelligence tools are beginning to reshape how engineering firms handle plan reviews, quantity takeoffs, and code compliance checks. We look at the current state of AI in engineering and what it means for project timelines.",
    readTime: "5 min read",
  },
  {
    title: "Foundation Design Considerations for Expansive Soils",
    date: "January 13, 2026",
    category: "Structural",
    excerpt:
      "Expansive clay soils present unique challenges for foundation engineering. This article covers identification methods, design strategies including post-tensioned slabs and drilled piers, and moisture management techniques to prevent structural damage.",
    readTime: "7 min read",
  },
];

function getCategoryColor(category: string): string {
  switch (category) {
    case "Structural":
      return "#1A2B4A";
    case "MEP":
      return "#2DD4BF";
    case "Civil":
      return "#22C55E";
    case "Industry News":
      return "#6366f1";
    default:
      return "#71717a";
  }
}

export default function BlogPage() {
  return (
    <div className="min-h-screen bg-zinc-50">
      {/* Header */}
      <header className="bg-white border-b border-zinc-200">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <Link href="/engineer" className="text-xl font-black" style={{ color: "#1A2B4A" }}>
              Kealee Engineering
            </Link>
            <nav className="flex items-center gap-6 text-sm">
              <Link href="/engineer/services" className="text-zinc-600 hover:text-zinc-900">Services</Link>
              <Link href="/engineer/pricing" className="text-zinc-600 hover:text-zinc-900">Pricing</Link>
              <Link href="/engineer/faq" className="text-zinc-600 hover:text-zinc-900">FAQ</Link>
              <Link href="/engineer/blog" className="font-semibold" style={{ color: "#1A2B4A" }}>Blog</Link>
              <Link
                href="/engineer/contact"
                className="px-4 py-2 text-white font-bold rounded-lg"
                style={{ backgroundColor: "#2DD4BF" }}
              >
                Get Quote
              </Link>
            </nav>
          </div>
        </div>
      </header>

      {/* Breadcrumb */}
      <div className="max-w-7xl mx-auto px-6 py-4">
        <nav className="text-sm text-zinc-500">
          <Link href="/engineer" className="hover:text-zinc-900">Home</Link>
          <span className="mx-2">/</span>
          <span className="text-zinc-900 font-medium">Blog</span>
        </nav>
      </div>

      {/* Hero */}
      <section className="py-16" style={{ backgroundColor: "#1A2B4A" }}>
        <div className="max-w-7xl mx-auto px-6 text-center">
          <h1 className="text-4xl lg:text-5xl font-black mb-6 text-white">
            Engineering Blog
          </h1>
          <p className="text-xl text-gray-300 max-w-2xl mx-auto">
            Insights, best practices, and industry updates from our team of licensed
            professional engineers.
          </p>
        </div>
      </section>

      {/* Category Filters */}
      <section className="bg-white border-b border-zinc-200">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex gap-3 flex-wrap">
            {categories.map((cat, i) => (
              <span
                key={cat}
                className={`px-4 py-2 rounded-full text-sm font-semibold cursor-pointer transition ${
                  i === 0
                    ? "text-white"
                    : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200"
                }`}
                style={i === 0 ? { backgroundColor: "#1A2B4A" } : undefined}
              >
                {cat}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* Articles */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {articles.map((article) => (
              <article
                key={article.title}
                className="bg-white rounded-2xl border border-zinc-200 overflow-hidden hover:shadow-lg transition group"
              >
                {/* Colored bar at top */}
                <div className="h-2" style={{ backgroundColor: getCategoryColor(article.category) }} />
                <div className="p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <span
                      className="inline-block px-3 py-1 text-xs font-bold rounded-full text-white"
                      style={{ backgroundColor: getCategoryColor(article.category) }}
                    >
                      {article.category}
                    </span>
                    <span className="text-xs text-zinc-400">{article.readTime}</span>
                  </div>
                  <h2 className="text-lg font-bold mb-3 group-hover:underline" style={{ color: "#1A2B4A" }}>
                    {article.title}
                  </h2>
                  <p className="text-sm text-zinc-600 mb-4 line-clamp-3">
                    {article.excerpt}
                  </p>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-zinc-400">{article.date}</span>
                    <span className="text-sm font-semibold" style={{ color: "#2DD4BF" }}>
                      Read more &rarr;
                    </span>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* Newsletter CTA */}
      <section className="py-16 bg-white">
        <div className="max-w-2xl mx-auto px-6 text-center">
          <h2 className="text-3xl font-black mb-4" style={{ color: "#1A2B4A" }}>
            Stay Up to Date
          </h2>
          <p className="text-zinc-600 mb-8">
            Get engineering insights and industry updates delivered to your inbox.
            No spam, unsubscribe anytime.
          </p>
          <div className="flex gap-3 max-w-md mx-auto">
            <input
              type="email"
              placeholder="Enter your email"
              className="flex-1 px-4 py-3 border border-zinc-300 rounded-xl text-sm focus:outline-none focus:ring-2"
              style={{ focusRingColor: "#2DD4BF" } as React.CSSProperties}
              readOnly
            />
            <button
              className="px-6 py-3 text-white font-bold rounded-xl hover:opacity-90"
              style={{ backgroundColor: "#2DD4BF" }}
            >
              Subscribe
            </button>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 text-white" style={{ backgroundColor: "#1A2B4A" }}>
        <div className="max-w-7xl mx-auto px-6 text-center">
          <h2 className="text-3xl font-black mb-4">Need Engineering Services?</h2>
          <p className="text-lg opacity-90 mb-8 max-w-2xl mx-auto">
            Our licensed engineers are ready to help with your next project.
            Get a free quote within 24 hours.
          </p>
          <Link
            href="/engineer/contact"
            className="inline-block px-8 py-4 font-bold rounded-xl hover:opacity-90"
            style={{ backgroundColor: "#2DD4BF", color: "#1A2B4A" }}
          >
            Get a Free Quote
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-zinc-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
            <div>
              <div className="text-lg font-bold mb-4">Kealee Engineering</div>
              <p className="text-sm text-zinc-400">
                Professional engineering services for the modern building industry.
              </p>
            </div>
            <div>
              <div className="text-sm font-bold text-zinc-400 uppercase mb-4">Services</div>
              <div className="space-y-2 text-sm">
                <Link href="/engineer/services/structural" className="block text-zinc-300 hover:text-white">Structural</Link>
                <Link href="/engineer/services/mep" className="block text-zinc-300 hover:text-white">MEP</Link>
                <Link href="/engineer/services/civil" className="block text-zinc-300 hover:text-white">Civil</Link>
                <Link href="/engineer/services/geotechnical" className="block text-zinc-300 hover:text-white">Geotechnical</Link>
              </div>
            </div>
            <div>
              <div className="text-sm font-bold text-zinc-400 uppercase mb-4">Resources</div>
              <div className="space-y-2 text-sm">
                <Link href="/engineer/pricing" className="block text-zinc-300 hover:text-white">Pricing</Link>
                <Link href="/engineer/faq" className="block text-zinc-300 hover:text-white">FAQ</Link>
                <Link href="/engineer/blog" className="block text-zinc-300 hover:text-white">Blog</Link>
              </div>
            </div>
            <div>
              <div className="text-sm font-bold text-zinc-400 uppercase mb-4">Contact</div>
              <div className="space-y-2 text-sm text-zinc-300">
                <div>engineering@kealee.com</div>
                <div>1-800-KEALEE</div>
              </div>
            </div>
          </div>
          <div className="border-t border-zinc-800 pt-8 text-center text-sm text-zinc-500">
            &copy; 2026 Kealee. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}
