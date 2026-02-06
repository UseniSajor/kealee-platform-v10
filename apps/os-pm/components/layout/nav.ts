import type { LucideIcon } from "lucide-react"
import {
  BarChart3,
  BookOpen,
  CalendarDays,
  ClipboardCheck,
  Cpu,
  DollarSign,
  FileEdit,
  FileText,
  FolderKanban,
  HardHat,
  Home,
  Image,
  LayoutDashboard,
  Link2,
  MessageSquare,
  NotebookPen,
  Timer,
  Truck,
  Users,
  TrendingUp,
} from "lucide-react"

export type PmNavItem = {
  href: string
  label: string
  icon: LucideIcon
  match?: "exact" | "startsWith"
  section?: string
}

// Navigation organized by functional area
export const pmNavItems: PmNavItem[] = [
  // Core
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard, match: "startsWith", section: "Core" },
  { href: "/work-queue", label: "Work Queue", icon: FolderKanban, match: "startsWith", section: "Core" },
  { href: "/scheduling", label: "Scheduling", icon: CalendarDays, match: "startsWith", section: "Core" },
  { href: "/clients", label: "Clients", icon: Users, match: "startsWith", section: "Core" },

  // Project Management
  { href: "/rfis", label: "RFIs", icon: MessageSquare, match: "startsWith", section: "Project Mgmt" },
  { href: "/submittals", label: "Submittals", icon: ClipboardCheck, match: "startsWith", section: "Project Mgmt" },
  { href: "/change-orders", label: "Change Orders", icon: FileEdit, match: "startsWith", section: "Project Mgmt" },
  { href: "/daily-logs", label: "Daily Logs", icon: NotebookPen, match: "startsWith", section: "Project Mgmt" },

  // Field & Operations
  { href: "/dispatch", label: "Dispatch", icon: Truck, match: "startsWith", section: "Field Ops" },
  { href: "/time-tracking", label: "Time Tracking", icon: Timer, match: "startsWith", section: "Field Ops" },
  { href: "/subcontractors", label: "Subcontractors", icon: HardHat, match: "startsWith", section: "Field Ops" },

  // Documents & Media
  { href: "/documents", label: "Documents", icon: FileText, match: "startsWith", section: "Docs & Media" },
  { href: "/photos", label: "Photos", icon: Image, match: "startsWith", section: "Docs & Media" },

  // Financial & Sales
  { href: "/price-book", label: "Price Book", icon: BookOpen, match: "startsWith", section: "Financial" },
  { href: "/pipeline", label: "Sales Pipeline", icon: TrendingUp, match: "startsWith", section: "Financial" },
  { href: "/crm", label: "CRM & Leads", icon: DollarSign, match: "startsWith", section: "Financial" },

  // Portals & Reporting
  { href: "/client-portal", label: "Client Portal", icon: Home, match: "startsWith", section: "Portals" },
  { href: "/analytics", label: "Analytics", icon: BarChart3, match: "startsWith", section: "Portals" },
  { href: "/reports", label: "Reports", icon: FileText, match: "startsWith", section: "Portals" },
  { href: "/communication", label: "Communication", icon: MessageSquare, match: "startsWith", section: "Portals" },

  // AI & Integrations
  { href: "/command-center", label: "Command Center", icon: Cpu, match: "startsWith", section: "AI & Ops" },
  { href: "/integrations", label: "Integrations", icon: Link2, match: "startsWith", section: "AI & Ops" },
]
