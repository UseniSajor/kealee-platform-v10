import Link from "next/link"

export default function HomePage() {
  return (
    <div className="min-h-screen bg-neutral-50">
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-4xl font-bold text-neutral-900 mb-4">
            Architect Hub
          </h1>
          <p className="text-lg text-neutral-600 mb-8">
            Professional design project management for architects
          </p>
          <div className="space-y-4">
            <Link
              href="/projects/new"
              className="block p-6 bg-white rounded-lg border border-neutral-200 hover:border-primary hover:shadow-md transition-all"
            >
              <h2 className="text-xl font-semibold mb-2">Create New Design Project</h2>
              <p className="text-neutral-600">
                Set up a new design project linked to an existing Project Owner project
              </p>
            </Link>
            <Link
              href="/projects"
              className="block p-6 bg-white rounded-lg border border-neutral-200 hover:border-primary hover:shadow-md transition-all"
            >
              <h2 className="text-xl font-semibold mb-2">View All Projects</h2>
              <p className="text-neutral-600">
                Browse and manage all your design projects
              </p>
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
