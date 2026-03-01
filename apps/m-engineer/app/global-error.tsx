'use client';
export default function GlobalError({ error, reset }: { error: Error; reset: () => void }) {
  return (
    <html><body>
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'system-ui, sans-serif' }}>
        <div style={{ textAlign: 'center', maxWidth: 400, padding: 24 }}>
          <h1 style={{ fontSize: 28, fontWeight: 700, marginBottom: 16 }}>Application Error</h1>
          <p style={{ color: '#666', marginBottom: 24 }}>A critical error occurred. Please try again.</p>
          <button onClick={reset} style={{ padding: '10px 24px', background: '#4f46e5', color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer', fontSize: 16 }}>Try again</button>
        </div>
      </div>
    </body></html>
  );
}
