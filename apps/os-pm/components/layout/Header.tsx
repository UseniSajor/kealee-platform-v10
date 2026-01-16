"use client"

import * as React from "react"
import { Bell, ChevronDown, Search } from "lucide-react"

import { Button } from "@kealee/ui/button"
import { Input } from "@kealee/ui/input"
import { cn } from "@/lib/utils"

export function Header({ leftSlot }: { leftSlot?: React.ReactNode }) {
  const [now, setNow] = React.useState(() => new Date())
  const [userMenuOpen, setUserMenuOpen] = React.useState(false)

  React.useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000)
    return () => clearInterval(id)
  }, [])

  const dateTime = now.toLocaleString(undefined, {
    weekday: "short",
    month: "short",
    day: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  })

  return (
    <header className="sticky top-0 z-30 border-b bg-white/90 backdrop-blur">
      <div className="flex items-center gap-3 px-4 py-3 sm:px-6">
        {leftSlot ? <div className="md:hidden">{leftSlot}</div> : null}

        <div className="flex-1">
          <div className="relative max-w-xl">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-500" />
            <Input className="pl-9" placeholder="Search clients, tasks, projects…" />
          </div>
        </div>

        <div className="hidden lg:block text-xs text-neutral-600 whitespace-nowrap">{dateTime}</div>

        <Button variant="ghost" size="icon" aria-label="Notifications">
          <Bell className="h-4 w-4" />
        </Button>

        <div className="relative">
          <Button
            variant="outline"
            size="sm"
            className="gap-2"
            onClick={() => setUserMenuOpen((v) => !v)}
            aria-haspopup="menu"
            aria-expanded={userMenuOpen}
          >
            <span className="hidden sm:inline">PM User</span>
            <ChevronDown className="h-4 w-4" />
          </Button>

          {userMenuOpen ? (
            <>
              <button
                className="fixed inset-0 z-40 cursor-default"
                aria-label="Close user menu"
                onClick={() => setUserMenuOpen(false)}
              />
              <div
                className={cn(
                  "absolute right-0 mt-2 z-50 w-48 rounded-md border bg-white shadow-lg",
                  "py-1"
                )}
                role="menu"
              >
                <button
                  className="w-full text-left px-3 py-2 text-sm hover:bg-neutral-100"
                  role="menuitem"
                  onClick={() => setUserMenuOpen(false)}
                >
                  Profile (placeholder)
                </button>
                <button
                  className="w-full text-left px-3 py-2 text-sm hover:bg-neutral-100"
                  role="menuitem"
                  onClick={() => setUserMenuOpen(false)}
                >
                  Settings (placeholder)
                </button>
                <div className="my-1 h-px bg-neutral-200" />
                <button
                  className="w-full text-left px-3 py-2 text-sm text-red-600 hover:bg-neutral-100"
                  role="menuitem"
                  onClick={() => setUserMenuOpen(false)}
                >
                  Sign out (placeholder)
                </button>
              </div>
            </>
          ) : null}
        </div>
      </div>
    </header>
  )
}

