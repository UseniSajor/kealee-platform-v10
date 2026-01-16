"use client"

import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { Button } from "@kealee/ui/button"
import { signOut } from "@/lib/auth"
import {
  Clock,
  FileText,
  LayoutDashboard,
  ListTodo,
  LogOut,
  MessageSquare,
  Users,
} from "lucide-react"

const navItems = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/work-queue", label: "Work Queue", icon: ListTodo },
  { href: "/clients", label: "Clients", icon: Users },
  { href: "/reports", label: "Reports", icon: FileText },
  { href: "/time-tracking", label: "Time", icon: Clock },
  { href: "/communication", label: "Messages", icon: MessageSquare },
]

export function PMNav() {
  const pathname = usePathname()
  const router = useRouter()

  if (pathname.startsWith("/login")) return null

  async function handleLogout() {
    await signOut()
    router.push("/login")
  }

  return (
    <nav className="bg-white border-b border-neutral-200">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center space-x-8">
            <Link href="/" className="font-bold text-xl text-primary">
              Kealee PM
            </Link>

            <div className="hidden md:flex space-x-1">
              {navItems.map((item) => {
                const Icon = item.icon
                const isActive = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href)

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={[
                      "flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium",
                      isActive ? "bg-primary/10 text-primary" : "text-neutral-700 hover:bg-neutral-100",
                    ].join(" ")}
                  >
                    <Icon className="h-4 w-4" />
                    <span>{item.label}</span>
                  </Link>
                )
              })}
            </div>
          </div>

          <Button variant="ghost" size="sm" onClick={handleLogout}>
            <LogOut className="h-4 w-4 mr-2" />
            Logout
          </Button>
        </div>
      </div>
    </nav>
  )
}

