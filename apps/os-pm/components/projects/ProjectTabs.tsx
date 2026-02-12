"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"

import { cn } from "@/lib/utils"

type ProjectTabsProps = {
  clientId: string
  projectId: string
  className?: string
}

type ProjectTab = {
  label: string
  segment: "overview" | "timeline" | "budget" | "permits" | "documents" | "photos" | "contractors" | "reports" | "activity" | "audit"
}

const TABS: ProjectTab[] = [
  { label: "Overview", segment: "overview" },
  { label: "Timeline", segment: "timeline" },
  { label: "Budget", segment: "budget" },
  { label: "Permits", segment: "permits" },
  { label: "Documents", segment: "documents" },
  { label: "Photos", segment: "photos" },
  { label: "Contractors", segment: "contractors" },
  { label: "Reports", segment: "reports" },
  { label: "Activity", segment: "activity" },
  { label: "Audit", segment: "audit" },
]

function getActiveSegment(pathname: string, base: string): ProjectTab["segment"] {
  if (!pathname.startsWith(base)) return "overview"
  const remainder = pathname.slice(base.length).replace(/^\/+/, "")
  const seg = remainder.split("/")[0] || "overview"
  if (TABS.some((t) => t.segment === seg)) return seg as ProjectTab["segment"]
  return "overview"
}

export function ProjectTabs({ clientId, projectId, className }: ProjectTabsProps) {
  const pathname = usePathname() ?? ""
  const base = `/clients/${clientId}/projects/${projectId}`
  const active = getActiveSegment(pathname, base)

  return (
    <div className={cn("border-b bg-white", className)}>
      <nav
        className={cn(
          "flex gap-2 overflow-x-auto py-2",
          "[-webkit-overflow-scrolling:touch]"
        )}
        aria-label="Project tabs"
      >
        <div className="flex w-max gap-2 px-1">
          {TABS.map((tab) => {
            const href = `${base}/${tab.segment}`
            const isActive = active === tab.segment || (pathname === base && tab.segment === "overview")

            return (
              <Link
                key={tab.segment}
                href={href}
                aria-current={isActive ? "page" : undefined}
                className={cn(
                  "whitespace-nowrap rounded-md px-3 py-2 text-sm font-medium transition-colors",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40",
                  isActive
                    ? "bg-neutral-900 text-white"
                    : "text-neutral-700 hover:bg-neutral-100 hover:text-neutral-900"
                )}
              >
                {tab.label}
              </Link>
            )
          })}
        </div>
      </nav>
    </div>
  )
}

