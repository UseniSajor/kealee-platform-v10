import Link from 'next/link'

export default function LoginPage() {
  const commandCenter = process.env.NEXT_PUBLIC_COMMAND_CENTER_URL ?? 'http://localhost:3023/login'
  return (
    <main className="flex min-h-screen items-center justify-center p-6">
      <section className="max-w-lg rounded-2xl border p-8 text-center" style={{ borderColor: 'var(--line)', background: 'var(--panel)' }}>
        <p className="text-xs font-bold uppercase tracking-[0.2em]" style={{ color: 'var(--green)' }}>Kealee internal systems</p>
        <h1 className="mt-4 text-3xl font-bold">Marketing OS authentication</h1>
        <p className="mt-3 text-sm" style={{ color: 'var(--muted)' }}>
          Marketing OS uses the existing Kealee Supabase session and administrative roles.
        </p>
        <Link href={commandCenter} className="mt-7 inline-flex rounded-lg px-5 py-3 text-sm font-bold text-white" style={{ background: 'var(--orange)' }}>
          Sign in through Command Center
        </Link>
      </section>
    </main>
  )
}
