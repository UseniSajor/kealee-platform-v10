export default function UnauthorizedPage() {
  return (
    <main className="flex min-h-screen items-center justify-center p-6">
      <section className="max-w-lg rounded-2xl border p-8 text-center" style={{ borderColor: 'var(--line)', background: 'var(--panel)' }}>
        <h1 className="text-3xl font-bold">Administrative access required</h1>
        <p className="mt-3 text-sm" style={{ color: 'var(--muted)' }}>
          Your Kealee account does not have the admin, super_admin, or marketing_admin role.
        </p>
      </section>
    </main>
  )
}
