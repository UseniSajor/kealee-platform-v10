'use client';

import { useEffect } from 'react';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Root error boundary caught:', error);
  }, [error]);

  return (
    <div style={{ padding: '2rem', fontFamily: 'monospace' }}>
      <h2 style={{ color: 'red' }}>Something went wrong!</h2>
      <pre style={{ whiteSpace: 'pre-wrap', background: '#f5f5f5', padding: '1rem', borderRadius: '8px', marginTop: '1rem' }}>
        {error.message}
      </pre>
      {error.digest && (
        <p style={{ marginTop: '0.5rem', color: '#666' }}>Digest: {error.digest}</p>
      )}
      <pre style={{ whiteSpace: 'pre-wrap', background: '#fff0f0', padding: '1rem', borderRadius: '8px', marginTop: '1rem', fontSize: '12px' }}>
        {error.stack}
      </pre>
      <button
        onClick={reset}
        style={{ marginTop: '1rem', padding: '0.5rem 1rem', background: '#0070f3', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
      >
        Try again
      </button>
    </div>
  );
}
