"use client"

import * as React from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { ChevronDown, ChevronRight, Settings, UserCircle2 } from "lucide-react"

import { cn } from "@/lib/utils"
import { useRole } from "@/lib/role-context"
import { getNavSections } from "./nav"

export function Sidebar() {
  const pathname = usePathname()
  const { isInternal, userName, companyName, tier, loading } = useRole()
  const [collapsed, setCollapsed] = React.useState(false)
  const [openSections, setOpenSections] = React.useState<Record<string, boolean>>({})

  const sections = React.useMemo(() => getNavSections(isInternal), [isInternal])

  // Initialize all sections as open
  React.useEffect(() => {
    const initial: Record<string, boolean> = {}
    sections.forEach((s) => { initial[s.label] = true })
    setOpenSections(initial)
  }, [sections])

  function toggleSection(label: string) {
    setOpenSections((prev) => ({ ...prev, [label]: !prev[label] }))
  }

  const sidebarWidth = collapsed ? "w-20" : "w-64"

  return (
    <aside
      className={cn(
        "h-dvh sticky top-0 border-r bg-white transition-all duration-200",
        "hidden md:flex md:flex-col",
        sidebarWidth
      )}
      aria-label="Sidebar navigation"
    >
      {/* Logo & Brand */}
      <div className="flex items-center border-b px-3 py-4 gap-3">
        <Link
          href="/"
          className="shrink-0"
          aria-label="Kealee PM"
        >
          <img
            src={collapsed ? "/kealee-icon-192x192.png" : "/kealee-logo-300w.png"}
            alt="Kealee Construction"
            className={collapsed ? "h-8 w-8" : "h-8 w-auto"}
          />
        </Link>
        {!collapsed && companyName && (
          <div className="min-w-0 flex-1">
            <div className="text-xs text-neutral-500 truncate">{companyName}</div>
          </div>
        )}
      </div>

      {/* Subscription Tier Badge (external users) */}
      {!loading && !isInternal && tier !== "none" && !collapsed && (
        <div className="mx-3 mt-3 mb-1">
          <span className={cn(
            "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium border",
            tier === "enterprise" ? "bg-purple-50 text-purple-700 border-purple-200" :
            tier === "scale" ? "bg-blue-50 text-blue-700 border-blue-200" :
            tier === "performance" ? "bg-emerald-50 text-emerald-700 border-emerald-200" :
            "bg-neutral-50 text-neutral-700 border-neutral-200"
          )}>
            {tier.charAt(0).toUpperCase() + tier.slice(1)}
          </span>
        </div>
      )}

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-2 px-2">
        {sections.map((section) => {
          const isOpen = openSections[section.label] !== false

          return (
            <div key={section.label} className="mb-1">
              {/* Section Header */}
              {!collapsed && (
                <button
                  onClick={() => toggleSection(section.label)}
                  className="flex items-center gap-1 px-2 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-neutral-400 hover:text-neutral-600 w-full"
                >
                  {isOpen ? (
                    <ChevronDown className="h-3 w-3" />
                  ) : (
                    <ChevronRight className="h-3 w-3" />
                  )}
                  {section.label}
                  {section.internalOnly && (
                    <span className="ml-auto text-[9px] bg-amber-100 text-amber-700 px-1.5 rounded-full">Staff</span>
                  )}
                </button>
              )}

              {/* Section Items */}
              {(isOpen || collapsed) && (
                <ul className={cn("flex flex-col gap-0.5", collapsed && "items-center")}>
                  {section.items.map((item) => {
                    const isActive =
                      item.match === "exact"
                        ? pathname === item.href
                        : item.href === "/"
                          ? pathname === "/"
                          : pathname.startsWith(item.href)

                    const Icon = item.icon

                    return (
                      <li key={item.href}>
                        <Link
                          href={item.href}
                          className={cn(
                            "relative group flex items-center gap-3 rounded-lg px-2.5 py-2 text-sm transition-all",
                            collapsed && "justify-center w-12 h-12 rounded-xl px-0",
                            isActive
                              ? "bg-primary text-primary-foreground shadow-sm"
                              : "text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900"
                          )}
                          aria-label={item.label}
                        >
                          <Icon className={cn("h-4 w-4 shrink-0", collapsed && "h-5 w-5")} />
                          {!collapsed && <span className="truncate">{item.label}</span>}

                          {/* Tooltip for collapsed mode */}
                          {collapsed && (
                            <div className="
                              absolute left-full ml-3 px-3 py-1.5
                              bg-neutral-900 text-white text-xs font-medium
                              rounded-lg whitespace-nowrap
                              opacity-0 invisible group-hover:opacity-100 group-hover:visible
                              transition-all duration-200
                              z-50 pointer-events-none
                            ">
                              {item.label}
                              <div className="absolute right-full top-1/2 -translate-y-1/2 border-4 border-transparent border-r-neutral-900" />
                            </div>
                          )}
                        </Link>
                      </li>
                    )
                  })}
                </ul>
              )}
            </div>
          )
        })}
      </nav>

      {/* Collapse Toggle */}
      <div className="border-t px-3 py-2">
        <button
          onClick={() => setCollapsed((v) => !v)}
          className="text-xs text-neutral-400 hover:text-neutral-600 w-full text-center"
        >
          {collapsed ? "Expand" : "Collapse"}
        </button>
      </div>

      {/* Settings & User */}
      <div className="border-t p-3 flex items-center gap-3">
        <Link
          href="/settings"
          className="text-neutral-400 hover:text-neutral-600 transition-colors"
          aria-label="Settings"
        >
          <Settings className="h-5 w-5" />
        </Link>
        {!collapsed && (
          <div className="min-w-0 flex-1">
            <div className="text-sm font-medium text-neutral-700 truncate">
              {userName || "User"}
            </div>
            <div className="text-xs text-neutral-400 truncate">
              {isInternal ? "Kealee Staff" : "PM Software"}
            </div>
          </div>
        )}
        <UserCircle2 className="h-8 w-8 text-neutral-300 shrink-0" />
      </div>
    </aside>
  )
}
