import type { LucideIcon } from "lucide-react"
import {
  FileText,
  FolderKanban,
  Image,
  LayoutDashboard,
  MessageSquare,
  Timer,
  Users,
  TrendingUp,
} from "lucide-react"

export type PmNavItem = {
  href: string
  label: string
  icon: LucideIcon
  match?: "exact" | "startsWith"
}

// Navigation links to 11 primary pages.
export const pmNavItems: PmNavItem[] = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard, match: "exact" },
  { href: "/work-queue", label: "Work Queue", icon: FolderKanban, match: "startsWith" },
  { href: "/pipeline", label: "Sales Pipeline", icon: TrendingUp, match: "startsWith" },
  { href: "/clients", label: "Clients", icon: Users, match: "startsWith" },
  { href: "/reports", label: "Reports", icon: FileText, match: "startsWith" },
  { href: "/time-tracking", label: "Time Tracking", icon: Timer, match: "startsWith" },
  { href: "/documents", label: "Documents", icon: FileText, match: "startsWith" },
  { href: "/photos", label: "Photos", icon: Image, match: "startsWith" },
  { href: "/communication", label: "Communication", icon: MessageSquare, match: "startsWith" },
  { href: "/clients/demo-client/projects/demo-project/overview", label: "Project Overview", icon: FolderKanban },
  { href: "/clients/demo-client/projects/demo-project/timeline", label: "Project Timeline", icon: FolderKanban },
  { href: "/clients/demo-client/projects/demo-project/budget", label: "Project Budget", icon: FolderKanban },
]

