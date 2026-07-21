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
  Plug,
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
      { href: "/pm/projects", label: "Projects", icon: Briefcase, match: "startsWith" },
      { href: "/pm/schedule", label: "Schedule", icon: CalendarClock, match: "startsWith" },
      { href: "/pm/tasks", label: "Tasks", icon: ListChecks, match: "startsWith" },
    ],
  },
  {
    label: "Financial",
    items: [
      { href: "/pm/budget", label: "Budget", icon: Receipt, match: "startsWith" },
      { href: "/pm/change-orders", label: "Change Orders", icon: FileCheck, match: "startsWith" },
      { href: "/pm/bids", label: "Bids", icon: Gavel, match: "startsWith" },
      { href: "/pm/contracts", label: "Contracts", icon: Scale, match: "startsWith" },
    ],
  },
  {
    label: "Estimation",
    requires: ["estimation"],
    items: [
      { href: "/pm/estimates", label: "Estimates", icon: Calculator, match: "startsWith" },
      { href: "/pm/estimates/ai-takeoff", label: "AI Takeoff", icon: Wand2, match: "startsWith" },
    ],
  },
  {
    label: "Field",
    requires: ["field"],
    items: [
      { href: "/pm/daily-logs", label: "Daily Logs", icon: ClipboardList, match: "startsWith" },
      { href: "/pm/punch-list", label: "Punch List", icon: CheckSquare, match: "startsWith" },
      { href: "/pm/safety", label: "Safety", icon: Shield, match: "startsWith", requires: ["safety"] },
      { href: "/pm/inspections", label: "Inspections", icon: HardHat, match: "startsWith" },
      { href: "/field-status", label: "Field Status", icon: MapPin, match: "startsWith" },
      { href: "/pm/field-conflicts", label: "Conflicts", icon: AlertTriangle, match: "startsWith" },
      { href: "/pm/mobilization", label: "Mobilization", icon: ClipboardCheck, match: "startsWith" },
    ],
  },
  {
    label: "Multifamily",
    requires: ["multifamily"],
    items: [
      { href: "/pm/multifamily", label: "Overview", icon: Building2, match: "exact" },
      { href: "/pm/multifamily/units", label: "Unit Tracker", icon: Building2, match: "startsWith" },
      { href: "/pm/multifamily/draws", label: "Lender Draws", icon: Receipt, match: "startsWith" },
      { href: "/pm/multifamily/phasing", label: "Area Phasing", icon: GitMerge, match: "startsWith" },
    ],
  },
  {
    label: "Documents",
    items: [
      { href: "/pm/documents", label: "Documents", icon: FileText, match: "startsWith" },
      { href: "/pm/drawings", label: "Drawings", icon: PenTool, match: "startsWith" },
      { href: "/pm/photos", label: "Photos", icon: Image, match: "startsWith" },
      { href: "/pm/rfis", label: "RFIs", icon: MessageSquare, match: "startsWith" },
      { href: "/pm/submittals", label: "Submittals", icon: Ruler, match: "startsWith" },
    ],
  },
  {
    label: "Collaboration",
    items: [
      { href: "/pm/communication", label: "Messages", icon: MessageSquare, match: "startsWith" },
      { href: "/pm/meetings", label: "Meetings", icon: CalendarDays, match: "startsWith" },
      { href: "/pm/directory", label: "Team Directory", icon: Users, match: "startsWith" },
      { href: "/pm/reports", label: "Reports", icon: BarChart3, match: "startsWith" },
    ],
  },
  {
    label: "Selections",
    items: [
      { href: "/pm/selections", label: "Selections", icon: Palette, match: "startsWith" },
      { href: "/pm/warranty", label: "Warranty", icon: Wrench, match: "startsWith" },
    ],
  },
  {
    label: "Automation",
    items: [
      { href: "/pm/command-center", label: "Command Center", icon: Command, match: "startsWith" },
      { href: "/pm/integrations", label: "Integrations", icon: Plug, match: "startsWith" },
      { href: "/pm/sop", label: "SOP Tracker", icon: ClipboardCheck, match: "startsWith" },
    ],
  },
  {
    label: "Account",
    items: [
      { href: "/pm/subscription", label: "Subscription", icon: CreditCard, match: "startsWith" },
    ],
  },
  {
    label: "Internal Tools",
    internalOnly: true,
    items: [
      { href: "/pm/work-queue", label: "Work Queue", icon: FolderKanban, match: "startsWith", internalOnly: true },
      { href: "/pm/pipeline", label: "Sales Pipeline", icon: TrendingUp, match: "startsWith", internalOnly: true },
      { href: "/pm/clients", label: "Clients", icon: Users, match: "startsWith", internalOnly: true },
      { href: "/pm/time-tracking", label: "Time Tracking", icon: Timer, match: "startsWith", internalOnly: true },
      { href: "/pm/autonomous-actions", label: "AI Actions", icon: Zap, match: "startsWith", internalOnly: true },
      { href: "/pm/contractor-rankings", label: "Contractor Rankings", icon: BarChart3, match: "startsWith", internalOnly: true },
      { href: "/pm/contractor-payments", label: "Payments", icon: Receipt, match: "startsWith", internalOnly: true },
      { href: "/pm/analytics", label: "Analytics", icon: BarChart3, match: "startsWith", internalOnly: true },
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
