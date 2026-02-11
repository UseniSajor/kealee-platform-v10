import type { LucideIcon } from "lucide-react"
import {
  BarChart3,
  Briefcase,
  FileText,
  FolderKanban,
  Image,
  LayoutDashboard,
  MapPin,
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

// Navigation links for PM dashboard.
export const pmNavItems: PmNavItem[] = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard, match: "exact" },
  { href: "/work-queue", label: "Work Queue", icon: FolderKanban, match: "startsWith" },
  { href: "/pipeline", label: "Sales Pipeline", icon: TrendingUp, match: "startsWith" },
  { href: "/clients", label: "Clients", icon: Users, match: "startsWith" },
  { href: "/projects", label: "Projects", icon: Briefcase, match: "startsWith" },
  { href: "/reports", label: "Reports", icon: FileText, match: "startsWith" },
  { href: "/time-tracking", label: "Time Tracking", icon: Timer, match: "startsWith" },
  { href: "/documents", label: "Documents & Templates", icon: FileText, match: "startsWith" },
  { href: "/photos", label: "Photos", icon: Image, match: "startsWith" },
  { href: "/communication", label: "Communication", icon: MessageSquare, match: "startsWith" },
  { href: "/field-status", label: "Field Status", icon: MapPin, match: "startsWith" },
  { href: "/analytics", label: "Analytics", icon: BarChart3, match: "startsWith" },
]

