'use client'

export default function DashboardError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center px-4">
      <div className="text-center">
        <h1 className="font-display text-2xl font-bold" style={{ color: '#1A2B4A' }}>Something went wrong</h1>
        <p className="mt-2 text-sm text-gray-600">{error.message || 'An unexpected error occurred.'}</p>
        <button onClick={reset} className="mt-6 rounded-lg px-6 py-2.5 text-sm font-semibold text-white shadow-sm" style={{ backgroundColor: '#E8793A' }}>
          Try again
        </button>
      </div>
    </div>
  )
}
