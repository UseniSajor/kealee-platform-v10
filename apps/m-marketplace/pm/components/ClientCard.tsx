import Link from "next/link"
import type { PMClient } from "@pm/lib/types"

export function ClientCard({ client }: { client: PMClient }) {
  return (
    <Link
      href={`/pm/clients/${client.id}`}
      className="block rounded-xl border bg-white p-4 hover:bg-neutral-50 transition-colors"
    >
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="font-semibold truncate">{client.name}</div>
          <div className="mt-1 text-sm text-neutral-600 truncate">{client.email}</div>
          <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-neutral-500">
            <span>Package {client.packageTier}</span>
            <span>• {client.activeProjects} projects</span>
            <span>• {client.openTasks} open tasks</span>
          </div>
        </div>
        <div className="shrink-0 text-xs rounded-full border px-2 py-1 text-neutral-700">
          {client.status}
        </div>
      </div>
    </Link>
  )
}

