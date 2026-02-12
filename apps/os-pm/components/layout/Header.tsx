"use client"

import * as React from "react"
import Link from "next/link"
import { Bell, ChevronDown, LogOut, Plus, Search, Settings, User } from "lucide-react"

import { Button } from "@kealee/ui/button"
import { Input } from "@kealee/ui/input"
import { cn } from "@/lib/utils"
import { useRole } from "@/lib/role-context"
import { supabase } from "@/lib/supabase"

const quickCreateItems = [
  { label: "New Project", href: "/projects/new" },
  { label: "Daily Log", href: "/daily-logs/new" },
  { label: "RFI", href: "/rfis/new" },
  { label: "Change Order", href: "/change-orders/new" },
  { label: "Punch Item", href: "/punch-list/new" },
  { label: "Meeting", href: "/meetings/new" },
]

export function Header({ leftSlot }: { leftSlot?: React.ReactNode }) {
  const { userName, companyName, isInternal, tier } = useRole()
  const [now, setNow] = React.useState(() => new Date())
  const [userMenuOpen, setUserMenuOpen] = React.useState(false)
  const [createMenuOpen, setCreateMenuOpen] = React.useState(false)

  React.useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 60000)
    return () => clearInterval(id)
  }, [])

  const dateTime = now.toLocaleString(undefined, {
    weekday: "short",
    month: "short",
    day: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  })

  async function handleSignOut() {
    await supabase.auth.signOut()
    window.location.href = "/login"
  }

  return (
    <header className="sticky top-0 z-30 border-b bg-white/90 backdrop-blur">
      <div className="flex items-center gap-3 px-4 py-3 sm:px-6">
        {leftSlot ? <div className="md:hidden">{leftSlot}</div> : null}

        {/* Brand - mobile only */}
        <div className="md:hidden font-bold text-lg text-blue-600">Kealee PM</div>

        <div className="flex-1">
          <div className="relative max-w-xl hidden sm:block">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-500" />
            <Input className="pl-9" placeholder="Search projects, tasks, documents..." />
          </div>
        </div>

        <div className="hidden lg:block text-xs text-neutral-600 whitespace-nowrap">{dateTime}</div>

        {/* Quick Create */}
        <div className="relative">
          <Button
            variant="default"
            size="sm"
            className="gap-1"
            onClick={() => setCreateMenuOpen((v) => !v)}
          >
            <Plus className="h-4 w-4" />
            <span className="hidden sm:inline">Create</span>
          </Button>

          {createMenuOpen && (
            <>
              <button
                className="fixed inset-0 z-40 cursor-default"
                aria-label="Close create menu"
                onClick={() => setCreateMenuOpen(false)}
              />
              <div className="absolute right-0 mt-2 z-50 w-48 rounded-md border bg-white shadow-lg py-1" role="menu">
                {quickCreateItems.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    className="block px-3 py-2 text-sm hover:bg-neutral-100"
                    role="menuitem"
                    onClick={() => setCreateMenuOpen(false)}
                  >
                    {item.label}
                  </Link>
                ))}
              </div>
            </>
          )}
        </div>

        {/* Notifications */}
        <Button variant="ghost" size="icon" aria-label="Notifications" className="relative">
          <Bell className="h-4 w-4" />
          <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-red-500 rounded-full text-[10px] text-white flex items-center justify-center">
            3
          </span>
        </Button>

        {/* User Menu */}
        <div className="relative">
          <Button
            variant="outline"
            size="sm"
            className="gap-2"
            onClick={() => setUserMenuOpen((v) => !v)}
            aria-haspopup="menu"
            aria-expanded={userMenuOpen}
          >
            <span className="hidden sm:inline truncate max-w-[120px]">
              {userName || "User"}
            </span>
            <ChevronDown className="h-4 w-4 shrink-0" />
          </Button>

          {userMenuOpen && (
            <>
              <button
                className="fixed inset-0 z-40 cursor-default"
                aria-label="Close user menu"
                onClick={() => setUserMenuOpen(false)}
              />
              <div
                className={cn(
                  "absolute right-0 mt-2 z-50 w-56 rounded-md border bg-white shadow-lg",
                  "py-1"
                )}
                role="menu"
              >
                {/* User Info */}
                <div className="px-3 py-2 border-b">
                  <div className="text-sm font-medium text-neutral-900">{userName || "User"}</div>
                  <div className="text-xs text-neutral-500">{companyName || (isInternal ? "Kealee Staff" : "PM Software")}</div>
                  {tier && tier !== "none" && !isInternal && (
                    <span className="inline-flex mt-1 items-center rounded-full px-2 py-0.5 text-[10px] font-medium bg-blue-50 text-blue-700 border border-blue-200">
                      {tier.charAt(0).toUpperCase() + tier.slice(1)} Plan
                    </span>
                  )}
                </div>

                <Link
                  href="/settings"
                  className="flex items-center gap-2 w-full text-left px-3 py-2 text-sm hover:bg-neutral-100"
                  role="menuitem"
                  onClick={() => setUserMenuOpen(false)}
                >
                  <Settings className="h-4 w-4" />
                  Settings
                </Link>
                <Link
                  href="/settings"
                  className="flex items-center gap-2 w-full text-left px-3 py-2 text-sm hover:bg-neutral-100"
                  role="menuitem"
                  onClick={() => setUserMenuOpen(false)}
                >
                  <User className="h-4 w-4" />
                  Profile
                </Link>
                <div className="my-1 h-px bg-neutral-200" />
                <button
                  className="flex items-center gap-2 w-full text-left px-3 py-2 text-sm text-red-600 hover:bg-neutral-100"
                  role="menuitem"
                  onClick={handleSignOut}
                >
                  <LogOut className="h-4 w-4" />
                  Sign out
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  )
}
