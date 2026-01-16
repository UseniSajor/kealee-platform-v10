"use client"

import * as React from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { ChevronLeft, ChevronRight, UserCircle2 } from "lucide-react"

import { Button } from "@kealee/ui/button"
import { cn } from "@/lib/utils"
import { pmNavItems } from "./nav"

export function Sidebar() {
  const pathname = usePathname()
  const [collapsed, setCollapsed] = React.useState(false)

  return (
    <aside
      className={cn(
        "h-dvh sticky top-0 border-r bg-white",
        "hidden md:flex md:flex-col",
        collapsed ? "w-16" : "w-64"
      )}
      aria-label="Sidebar navigation"
    >
      <div className={cn("flex items-center justify-between gap-2 border-b px-3 py-3", collapsed && "justify-center")}>
        {!collapsed ? (
          <Link href="/" className="font-bold text-lg text-neutral-900">
            Kealee PM
          </Link>
        ) : (
          <Link href="/" className="font-bold text-lg text-neutral-900" aria-label="Kealee PM">
            K
          </Link>
        )}

        <Button
          variant="ghost"
          size="icon-sm"
          onClick={() => setCollapsed((v) => !v)}
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {collapsed ? <ChevronRight /> : <ChevronLeft />}
        </Button>
      </div>

      <nav className="flex-1 overflow-y-auto p-2">
        <ul className="space-y-1">
          {pmNavItems.map((item) => {
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
                    "flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors",
                    isActive ? "bg-primary/10 text-primary" : "text-neutral-700 hover:bg-neutral-100",
                    collapsed && "justify-center px-2"
                  )}
                  title={collapsed ? item.label : undefined}
                >
                  <Icon className="h-4 w-4" />
                  {!collapsed ? <span className="truncate">{item.label}</span> : null}
                </Link>
              </li>
            )
          })}
        </ul>
      </nav>

      <div className={cn("border-t p-3", collapsed && "px-2")}>
        <div className={cn("flex items-center gap-3", collapsed && "justify-center")}>
          <UserCircle2 className="h-9 w-9 text-neutral-500" />
          {!collapsed ? (
            <div className="min-w-0">
              <div className="text-sm font-medium text-neutral-900 truncate">PM User</div>
              <div className="text-xs text-neutral-500 truncate">pm@kealee.com</div>
            </div>
          ) : null}
        </div>
      </div>
    </aside>
  )
}

