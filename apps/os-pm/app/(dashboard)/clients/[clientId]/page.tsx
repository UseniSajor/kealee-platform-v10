import Link from "next/link"

export default async function ClientDetailPage({ params }: { params: Promise<{ clientId: string }> }) {
  const { clientId } = await params

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-3xl font-bold">Client</h1>
        <p className="text-neutral-600 mt-1">Client ID: {clientId}</p>
      </div>

      <div className="text-sm text-neutral-700">
        This is a placeholder route for client details. Project routes live under{" "}
        <code className="px-1 py-0.5 rounded bg-neutral-100">/clients/{clientId}/projects/…</code>.
      </div>

      <div className="flex gap-2">
        <Link className="underline text-primary" href={`/clients/${clientId}/projects/demo-project`}>
          Go to a demo project
        </Link>
      </div>
    </div>
  )
}

