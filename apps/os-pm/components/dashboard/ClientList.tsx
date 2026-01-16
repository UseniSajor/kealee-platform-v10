"use client"

import Link from "next/link"
import { formatDistanceToNow } from "date-fns"

import { cn } from "@/lib/utils"
import type { PMClient } from "@/lib/types"

function safeDate(value: string) {
  const d = new Date(value)
  return Number.isNaN(d.getTime()) ? null : d
}

export function ClientList({ clients }: { clients: PMClient[] }) {
  return (
    <div className="space-y-2">
      {clients.length ? (
        <ul className="divide-y rounded-xl border bg-white">
          {clients.map((c) => {
            const last = safeDate(c.lastContact)
            const lastLabel = last ? formatDistanceToNow(last, { addSuffix: true }) : "—"

            return (
              <li key={c.id}>
                <Link
                  href={`/clients/${c.id}`}
                  className={cn("block px-4 py-3 hover:bg-neutral-50 transition-colors")}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="font-medium text-neutral-900 truncate">{c.name}</div>
                      <div className="text-xs text-neutral-600 mt-0.5">
                        {c.activeProjects} active projects
                      </div>
                    </div>
                    <div className="text-xs text-neutral-600 whitespace-nowrap">Last contact: {lastLabel}</div>
                  </div>
                </Link>
              </li>
            )
          })}
        </ul>
      ) : (
        <div className="rounded-xl border bg-white px-4 py-10 text-center text-sm text-neutral-600">
          No clients assigned yet.
        </div>
      )}
    </div>
  )
}

