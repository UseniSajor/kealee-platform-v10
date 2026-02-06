"use client"

import * as React from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { UserCircle2 } from "lucide-react"

import { cn } from "@/lib/utils"
import { pmNavItems } from "./nav"

export function Sidebar() {
  const pathname = usePathname()

  // Group items by section
  const sections = React.useMemo(() => {
    const groups: { section: string; items: typeof pmNavItems }[] = []
    let currentSection = ""
    for (const item of pmNavItems) {
      const sec = item.section || ""
      if (sec !== currentSection) {
        currentSection = sec
        groups.push({ section: sec, items: [] })
      }
      groups[groups.length - 1].items.push(item)
    }
    return groups
  }, [])

  return (
    <aside
      className={cn(
        "h-dvh sticky top-0 border-r bg-white",
        "hidden md:flex md:flex-col",
        "w-20" // Icon-only width
      )}
      aria-label="Sidebar navigation"
    >
      {/* Logo */}
      <div className="flex items-center justify-center border-b px-3 py-4">
        <Link
          href="/"
          className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center text-white font-bold text-lg"
          aria-label="Kealee PM"
        >
          K
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-2 px-3">
        <ul className="flex flex-col items-center gap-1">
          {sections.map((group) => (
            <React.Fragment key={group.section}>
              {group.section && (
                <li className="w-full my-1">
                  <div className="h-px bg-neutral-200 mx-2" />
                </li>
              )}
              {group.items.map((item) => {
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
                        "relative group flex items-center justify-center w-11 h-11 rounded-xl transition-all",
                        isActive
                          ? "bg-primary text-primary-foreground shadow-lg"
                          : "text-neutral-500 hover:bg-neutral-100 hover:text-neutral-900"
                      )}
                      aria-label={item.label}
                    >
                      <Icon className="h-5 w-5" />

                      {/* Tooltip */}
                      <div className="
                        absolute left-full ml-3 px-3 py-1.5
                        bg-neutral-900 text-white text-sm font-medium
                        rounded-lg whitespace-nowrap
                        opacity-0 invisible group-hover:opacity-100 group-hover:visible
                        transition-all duration-200
                        z-50
                      ">
                        {item.label}
                        <div className="absolute right-full top-1/2 -translate-y-1/2 border-4 border-transparent border-r-neutral-900" />
                      </div>
                    </Link>
                  </li>
                )
              })}
            </React.Fragment>
          ))}
        </ul>
      </nav>

      {/* User Avatar */}
      <div className="border-t p-3 flex justify-center">
        <button className="relative group">
          <UserCircle2 className="h-10 w-10 text-neutral-400 hover:text-neutral-600 transition-colors" />

          {/* Tooltip */}
          <div className="
            absolute left-full ml-3 px-3 py-1.5
            bg-neutral-900 text-white text-sm font-medium
            rounded-lg whitespace-nowrap
            opacity-0 invisible group-hover:opacity-100 group-hover:visible
            transition-all duration-200
            z-50
          ">
            PM User
            <div className="absolute right-full top-1/2 -translate-y-1/2 border-4 border-transparent border-r-neutral-900" />
          </div>
        </button>
      </div>
    </aside>
  )
}
