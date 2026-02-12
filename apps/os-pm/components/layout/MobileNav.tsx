"use client"

import * as React from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { Menu, X } from "lucide-react"

import { Button } from "@kealee/ui/button"
import { cn } from "@/lib/utils"
import { useRole } from "@/lib/role-context"
import { getNavSections } from "./nav"

export function MobileNav() {
  const pathname = usePathname()
  const [open, setOpen] = React.useState(false)
  const { isInternal, userName, companyName, tier } = useRole()

  const sections = React.useMemo(() => getNavSections(isInternal), [isInternal])

  return (
    <>
      <Button variant="ghost" size="icon" onClick={() => setOpen(true)} aria-label="Open navigation menu">
        <Menu className="h-5 w-5" />
      </Button>

      {open ? (
        <div className="fixed inset-0 z-50">
          <button
            className="absolute inset-0 bg-black/40"
            aria-label="Close navigation menu"
            onClick={() => setOpen(false)}
          />

          <div className="absolute left-0 top-0 h-full w-80 max-w-[85vw] bg-white shadow-xl flex flex-col">
            <div className="flex items-center justify-between border-b px-4 py-3">
              <div>
                <Link href="/" className="font-bold text-lg text-blue-600" onClick={() => setOpen(false)}>
                  Kealee PM
                </Link>
                {companyName && (
                  <div className="text-xs text-neutral-500">{companyName}</div>
                )}
              </div>
              <Button variant="ghost" size="icon" onClick={() => setOpen(false)} aria-label="Close navigation menu">
                <X className="h-5 w-5" />
              </Button>
            </div>

            {/* Tier badge for external users */}
            {!isInternal && tier && tier !== "none" && (
              <div className="px-4 py-2 border-b">
                <span className={cn(
                  "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium border",
                  tier === "enterprise" ? "bg-purple-50 text-purple-700 border-purple-200" :
                  tier === "scale" ? "bg-blue-50 text-blue-700 border-blue-200" :
                  tier === "performance" ? "bg-emerald-50 text-emerald-700 border-emerald-200" :
                  "bg-neutral-50 text-neutral-700 border-neutral-200"
                )}>
                  {tier.charAt(0).toUpperCase() + tier.slice(1)} Plan
                </span>
              </div>
            )}

            <nav className="flex-1 overflow-y-auto p-2">
              {sections.map((section) => (
                <div key={section.label} className="mb-3">
                  <div className="flex items-center gap-2 px-3 py-1 text-[10px] font-semibold uppercase tracking-wider text-neutral-400">
                    {section.label}
                    {section.internalOnly && (
                      <span className="text-[9px] bg-amber-100 text-amber-700 px-1.5 rounded-full">Staff</span>
                    )}
                  </div>
                  <ul className="space-y-0.5">
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
                            onClick={() => setOpen(false)}
                            className={cn(
                              "flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors",
                              isActive ? "bg-primary/10 text-primary font-medium" : "text-neutral-700 hover:bg-neutral-100"
                            )}
                          >
                            <Icon className="h-4 w-4" />
                            <span className="truncate">{item.label}</span>
                          </Link>
                        </li>
                      )
                    })}
                  </ul>
                </div>
              ))}
            </nav>

            <div className="border-t p-3">
              <div className="text-sm font-medium text-neutral-700">{userName || "User"}</div>
              <div className="text-xs text-neutral-500">{isInternal ? "Kealee Staff" : "PM Software User"}</div>
            </div>
          </div>
        </div>
      ) : null}
    </>
  )
}
