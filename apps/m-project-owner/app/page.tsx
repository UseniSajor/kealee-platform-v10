import Link from 'next/link'

export default function HomePage() {
  return (
    <main style={{ maxWidth: 960, margin: '0 auto', padding: 24 }}>
      <h1 style={{ fontSize: 28, fontWeight: 700 }}>Project Owner Hub</h1>
      <p style={{ marginTop: 8, opacity: 0.8 }}>
        Start a new project and complete readiness before moving into contracts and milestones.
      </p>

      <div style={{ marginTop: 16, display: 'flex', gap: 12 }}>
        <Link
          href="/projects/new"
          style={{
            display: 'inline-flex',
            padding: '10px 14px',
            borderRadius: 10,
            background: 'var(--primary)',
            color: 'var(--primary-foreground)',
            textDecoration: 'none',
            fontWeight: 600,
          }}
        >
          Create a project
        </Link>
      </div>
    </main>
  )
}

