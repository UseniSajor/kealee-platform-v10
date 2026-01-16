"use client"

import * as React from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { Menu, X } from "lucide-react"

import { Button } from "@kealee/ui/button"
import { cn } from "@/lib/utils"
import { pmNavItems } from "./nav"

export function MobileNav() {
  const pathname = usePathname()
  const [open, setOpen] = React.useState(false)

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
              <Link href="/" className="font-bold text-lg" onClick={() => setOpen(false)}>
                Kealee PM
              </Link>
              <Button variant="ghost" size="icon" onClick={() => setOpen(false)} aria-label="Close navigation menu">
                <X className="h-5 w-5" />
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
                        onClick={() => setOpen(false)}
                        className={cn(
                          "flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors",
                          isActive ? "bg-primary/10 text-primary" : "text-neutral-700 hover:bg-neutral-100"
                        )}
                      >
                        <Icon className="h-4 w-4" />
                        <span className="truncate">{item.label}</span>
                      </Link>
                    </li>
                  )
                })}
              </ul>
            </nav>

            <div className="border-t p-3 text-xs text-neutral-600">
              Demo links use placeholder IDs (e.g. <span className="font-mono">demo-client</span>).
            </div>
          </div>
        </div>
      ) : null}
    </>
  )
}

