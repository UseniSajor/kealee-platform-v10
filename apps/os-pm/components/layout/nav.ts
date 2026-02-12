import type { LucideIcon } from "lucide-react"
import {
  BarChart3,
  Briefcase,
  Calculator,
  CalendarClock,
  CalendarDays,
  CheckSquare,
  ClipboardList,
  FileCheck,
  FileText,
  FolderKanban,
  Gavel,
  HardHat,
  Image,
  LayoutDashboard,
  ListChecks,
  MapPin,
  MessageSquare,
  Palette,
  PenTool,
  Receipt,
  Ruler,
  Scale,
  Shield,
  Timer,
  TrendingUp,
  Users,
  Wand2,
  Wrench,
  Zap,
} from "lucide-react"

export type PmNavItem = {
  href: string
  label: string
  icon: LucideIcon
  match?: "exact" | "startsWith"
  /** If set, only internal staff see this item */
  internalOnly?: boolean
}

export type NavSection = {
  label: string
  items: PmNavItem[]
  /** If true, only internal staff see this entire section */
  internalOnly?: boolean
}

// ── Navigation Sections ───────────────────────────────────────────

export const navSections: NavSection[] = [
  {
    label: "Core",
    items: [
      { href: "/", label: "Dashboard", icon: LayoutDashboard, match: "exact" },
      { href: "/projects", label: "Projects", icon: Briefcase, match: "startsWith" },
      { href: "/schedule", label: "Schedule", icon: CalendarClock, match: "startsWith" },
      { href: "/tasks", label: "Tasks", icon: ListChecks, match: "startsWith" },
    ],
  },
  {
    label: "Financial",
    items: [
      { href: "/budget", label: "Budget", icon: Receipt, match: "startsWith" },
      { href: "/change-orders", label: "Change Orders", icon: FileCheck, match: "startsWith" },
      { href: "/bids", label: "Bids", icon: Gavel, match: "startsWith" },
      { href: "/contracts", label: "Contracts", icon: Scale, match: "startsWith" },
    ],
  },
  {
    label: "Estimation",
    items: [
      { href: "/estimates", label: "Estimates", icon: Calculator, match: "startsWith" },
      { href: "/estimates/ai-takeoff", label: "AI Takeoff", icon: Wand2, match: "startsWith" },
    ],
  },
  {
    label: "Field",
    items: [
      { href: "/daily-logs", label: "Daily Logs", icon: ClipboardList, match: "startsWith" },
      { href: "/punch-list", label: "Punch List", icon: CheckSquare, match: "startsWith" },
      { href: "/safety", label: "Safety", icon: Shield, match: "startsWith" },
      { href: "/inspections", label: "Inspections", icon: HardHat, match: "startsWith" },
      { href: "/field-status", label: "Field Status", icon: MapPin, match: "startsWith" },
    ],
  },
  {
    label: "Documents",
    items: [
      { href: "/documents", label: "Documents", icon: FileText, match: "startsWith" },
      { href: "/drawings", label: "Drawings", icon: PenTool, match: "startsWith" },
      { href: "/photos", label: "Photos", icon: Image, match: "startsWith" },
      { href: "/rfis", label: "RFIs", icon: MessageSquare, match: "startsWith" },
      { href: "/submittals", label: "Submittals", icon: Ruler, match: "startsWith" },
    ],
  },
  {
    label: "Collaboration",
    items: [
      { href: "/communication", label: "Messages", icon: MessageSquare, match: "startsWith" },
      { href: "/meetings", label: "Meetings", icon: CalendarDays, match: "startsWith" },
      { href: "/directory", label: "Team Directory", icon: Users, match: "startsWith" },
      { href: "/reports", label: "Reports", icon: BarChart3, match: "startsWith" },
    ],
  },
  {
    label: "Selections",
    items: [
      { href: "/selections", label: "Selections", icon: Palette, match: "startsWith" },
      { href: "/warranty", label: "Warranty", icon: Wrench, match: "startsWith" },
    ],
  },
  {
    label: "Internal Tools",
    internalOnly: true,
    items: [
      { href: "/work-queue", label: "Work Queue", icon: FolderKanban, match: "startsWith", internalOnly: true },
      { href: "/pipeline", label: "Sales Pipeline", icon: TrendingUp, match: "startsWith", internalOnly: true },
      { href: "/clients", label: "Clients", icon: Users, match: "startsWith", internalOnly: true },
      { href: "/time-tracking", label: "Time Tracking", icon: Timer, match: "startsWith", internalOnly: true },
      { href: "/autonomous-actions", label: "AI Actions", icon: Zap, match: "startsWith", internalOnly: true },
      { href: "/contractor-rankings", label: "Contractor Rankings", icon: BarChart3, match: "startsWith", internalOnly: true },
      { href: "/contractor-payments", label: "Payments", icon: Receipt, match: "startsWith", internalOnly: true },
      { href: "/analytics", label: "Analytics", icon: BarChart3, match: "startsWith", internalOnly: true },
    ],
  },
]

// Flat list of all items (for backward compatibility)
export const pmNavItems: PmNavItem[] = navSections.flatMap((s) => s.items)

// Get sections filtered by role
export function getNavSections(isInternal: boolean): NavSection[] {
  return navSections
    .filter((section) => !section.internalOnly || isInternal)
    .map((section) => ({
      ...section,
      items: section.items.filter((item) => !item.internalOnly || isInternal),
    }))
}
