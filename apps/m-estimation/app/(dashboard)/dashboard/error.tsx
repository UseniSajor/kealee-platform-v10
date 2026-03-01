'use client'

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <div className="flex min-h-[40vh] flex-col items-center justify-center px-4">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-900">Dashboard Error</h2>
        <p className="mt-2 text-gray-600">
          Failed to load dashboard data. Please try again.
        </p>
        <button
          onClick={reset}
          className="mt-6 rounded-lg bg-sky-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-sky-500"
        >
          Retry
        </button>
      </div>
    </div>
  )
}
