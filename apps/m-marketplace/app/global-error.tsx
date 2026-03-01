'use client'

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <html>
      <body>
        <div style={{ display: 'flex', minHeight: '100vh', alignItems: 'center', justifyContent: 'center', padding: '1rem', fontFamily: 'system-ui, sans-serif' }}>
          <div style={{ textAlign: 'center' }}>
            <h1 style={{ fontSize: '2rem', fontWeight: 'bold', color: '#111827' }}>Something went wrong</h1>
            <p style={{ marginTop: '1rem', fontSize: '1.125rem', color: '#4b5563' }}>
              A critical error occurred. Please try refreshing the page.
            </p>
            <button
              onClick={reset}
              style={{ marginTop: '2rem', padding: '0.75rem 1.5rem', backgroundColor: '#0284c7', color: 'white', border: 'none', borderRadius: '0.5rem', cursor: 'pointer', fontSize: '0.875rem', fontWeight: 600 }}
            >
              Try again
            </button>
          </div>
        </div>
      </body>
    </html>
  )
}
