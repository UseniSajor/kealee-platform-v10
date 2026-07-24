'use client';

/**
 * Offline fallback page — shown when user navigates while offline
 * and the page isn't cached.
 */

export default function OfflinePage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 p-6">
      <div className="w-full max-w-md text-center">
        {/* Offline icon */}
        <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-amber-100">
          <svg
            className="h-10 w-10 text-amber-600"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M18.364 5.636a9 9 0 010 12.728M5.636 18.364a9 9 0 010-12.728"
            />
            <line
              x1="4"
              y1="4"
              x2="20"
              y2="20"
              stroke="currentColor"
              strokeWidth={1.5}
              strokeLinecap="round"
            />
          </svg>
        </div>

        <h1 className="text-xl font-semibold text-gray-900">
          You're Offline
        </h1>

        <p className="mt-2 text-sm text-gray-500 leading-relaxed">
          It looks like you've lost your internet connection.
          Previously viewed pages are still available from cache.
        </p>

        <div className="mt-6 space-y-3">
          <button
            onClick={() => window.location.reload()}
            className="w-full rounded-xl bg-blue-600 px-6 py-3 text-sm font-medium text-white hover:bg-blue-700 active:bg-blue-800"
          >
            Try Again
          </button>

          <button
            onClick={() => window.history.back()}
            className="w-full rounded-xl bg-gray-100 px-6 py-3 text-sm font-medium text-gray-700 hover:bg-gray-200"
          >
            Go Back
          </button>
        </div>

        <div className="mt-8 rounded-xl border border-amber-200 bg-amber-50 p-4">
          <p className="text-xs text-amber-700 leading-relaxed">
            <strong>What you can still do:</strong>
            <br />
            View cached project pages, take photos (they'll sync later),
            write daily log entries, and check in/out on site.
          </p>
        </div>
      </div>
    </div>
  );
}
