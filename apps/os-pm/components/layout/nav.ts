import type { LucideIcon } from "lucide-react"
import {
  AlertTriangle,
  BarChart3,
  Briefcase,
  Building2,
  Calculator,
  CalendarClock,
  CalendarDays,
  CheckSquare,
  ClipboardCheck,
  ClipboardList,
  FileCheck,
  FileText,
  FolderKanban,
  Gavel,
  GitMerge,
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
  Command,
  CreditCard,
} from "lucide-react"

export type PmNavItem = {
  href: string
  label: string
  icon: LucideIcon
  match?: "exact" | "startsWith"
  /** If set, only internal staff see this item */
  internalOnly?: boolean
  /** Feature flags required to show this item (e.g. "field", "multifamily") */
  requires?: string[]
}

export type NavSection = {
  label: string
  items: PmNavItem[]
  /** If true, only internal staff see this entire section */
  internalOnly?: boolean
  /** Feature flags required to show entire section (e.g. "multifamily") */
  requires?: string[]
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
    requires: ["estimation"],
    items: [
      { href: "/estimates", label: "Estimates", icon: Calculator, match: "startsWith" },
      { href: "/estimates/ai-takeoff", label: "AI Takeoff", icon: Wand2, match: "startsWith" },
    ],
  },
  {
    label: "Field",
    requires: ["field"],
    items: [
      { href: "/daily-logs", label: "Daily Logs", icon: ClipboardList, match: "startsWith" },
      { href: "/punch-list", label: "Punch List", icon: CheckSquare, match: "startsWith" },
      { href: "/safety", label: "Safety", icon: Shield, match: "startsWith", requires: ["safety"] },
      { href: "/inspections", label: "Inspections", icon: HardHat, match: "startsWith" },
      { href: "/field-status", label: "Field Status", icon: MapPin, match: "startsWith" },
      { href: "/field-conflicts", label: "Conflicts", icon: AlertTriangle, match: "startsWith" },
      { href: "/mobilization", label: "Mobilization", icon: ClipboardCheck, match: "startsWith" },
    ],
  },
  {
    label: "Multifamily",
    requires: ["multifamily"],
    items: [
      { href: "/multifamily", label: "Overview", icon: Building2, match: "exact" },
      { href: "/multifamily/units", label: "Unit Tracker", icon: Building2, match: "startsWith" },
      { href: "/multifamily/draws", label: "Lender Draws", icon: Receipt, match: "startsWith" },
      { href: "/multifamily/phasing", label: "Area Phasing", icon: GitMerge, match: "startsWith" },
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
    label: "Automation",
    items: [
      { href: "/command-center", label: "Command Center", icon: Command, match: "startsWith" },
      { href: "/sop", label: "SOP Tracker", icon: ClipboardCheck, match: "startsWith" },
    ],
  },
  {
    label: "Account",
    items: [
      { href: "/subscription", label: "Subscription", icon: CreditCard, match: "startsWith" },
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

/**
 * Get sections filtered by role AND active features.
 *
 * `activeFeatures` is a set of feature strings like
 * "multifamily", "field", "safety", "estimation", "coordination".
 *
 * When not provided, ALL feature-gated sections are shown
 * (backward-compatible for internal staff who see everything).
 */
export function getNavSections(
  isInternal: boolean,
  activeFeatures?: Set<string>,
): NavSection[] {
  function meetsRequirements(requires?: string[]): boolean {
    if (!requires || requires.length === 0) return true
    // Internal staff always see everything
    if (isInternal && !activeFeatures) return true
    // If features provided, check them
    if (activeFeatures) {
      return requires.every((r) => activeFeatures.has(r))
    }
    return true
  }

  return navSections
    .filter(
      (section) =>
        (!section.internalOnly || isInternal) && meetsRequirements(section.requires),
    )
    .map((section) => ({
      ...section,
      items: section.items.filter(
        (item) =>
          (!item.internalOnly || isInternal) && meetsRequirements(item.requires),
      ),
    }))
    .filter((section) => section.items.length > 0)
}
