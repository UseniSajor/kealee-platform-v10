"use client";

import React, { useState, useMemo, useCallback } from "react";
import {
  Search,
  Plus,
  Upload,
  Download,
  Users,
  FolderKanban,
  DollarSign,
  Star,
  ShieldCheck,
  ChevronDown,
  ChevronUp,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  LayoutGrid,
  LayoutList,
  MoreHorizontal,
  Mail,
  Phone,
  MapPin,
  FileText,
  MessageSquare,
  Edit,
  Trash2,
  Eye,
  Tag,
  ArrowUpDown,
  CheckSquare,
  Square,
  Building2,
  Clock,
  Calendar,
  Receipt,
  StickyNote,
  TrendingUp,
  X,
} from "lucide-react";
import { Button } from "@kealee/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@kealee/ui/card";
import { Input } from "@kealee/ui/input";
import { cn } from "@/lib/utils";
import { format } from "date-fns";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type ClientStatus = "Active" | "Inactive" | "Prospect" | "On Hold";
type PackageTier = "Enterprise" | "Professional" | "Standard" | "Basic";
type SortField = "name" | "revenue" | "projects" | "lastContact" | "rating";
type ViewMode = "table" | "grid";

interface ClientProject {
  name: string;
  status: string;
  value: number;
}

interface ClientInvoice {
  id: string;
  date: Date;
  amount: number;
  status: "Paid" | "Pending" | "Overdue";
}

interface ClientCommunication {
  date: Date;
  type: "Email" | "Phone" | "Meeting";
  summary: string;
}

interface ClientData {
  id: string;
  name: string;
  email: string;
  phone: string;
  company: string;
  packageTier: PackageTier;
  monthlyRate: number;
  status: ClientStatus;
  activeProjects: number;
  totalRevenue: number;
  lastContact: Date;
  rating: number | null;
  avatar: string;
  billingAddress: string;
  projects: ClientProject[];
  recentInvoices: ClientInvoice[];
  communications: ClientCommunication[];
  notes: string;
}

// ---------------------------------------------------------------------------
// Mock Data
// ---------------------------------------------------------------------------

const CLIENTS: ClientData[] = [
  {
    id: "cl-001",
    name: "Sarah Johnson",
    email: "sarah@johnsonhomes.com",
    phone: "(512) 555-0147",
    company: "Johnson Homes LLC",
    packageTier: "Enterprise",
    monthlyRate: 5000,
    status: "Active",
    activeProjects: 3,
    totalRevenue: 245000,
    lastContact: new Date(Date.now() - 2 * 86400000),
    rating: 4.9,
    avatar: "SJ",
    billingAddress: "1200 Barton Springs Rd, Austin, TX 78704",
    projects: [
      { name: "Lakewood Residence", status: "In Progress", value: 120000 },
      { name: "Oak Hill Remodel", status: "In Progress", value: 75000 },
      { name: "Westlake New Build", status: "Planning", value: 50000 },
    ],
    recentInvoices: [
      { id: "INV-2024-0147", date: new Date(2026, 0, 15), amount: 25000, status: "Paid" },
      { id: "INV-2024-0098", date: new Date(2025, 11, 15), amount: 25000, status: "Paid" },
      { id: "INV-2024-0052", date: new Date(2025, 10, 15), amount: 25000, status: "Paid" },
    ],
    communications: [
      { date: new Date(Date.now() - 2 * 86400000), type: "Email", summary: "Sent updated project timeline for Lakewood Residence" },
      { date: new Date(Date.now() - 5 * 86400000), type: "Phone", summary: "Discussed Oak Hill remodel scope change request" },
      { date: new Date(Date.now() - 10 * 86400000), type: "Meeting", summary: "On-site walkthrough at Westlake property" },
    ],
    notes: "VIP client. Prefers email communication. Has referred 3 other clients in the past year. Annual review scheduled for March.",
  },
  {
    id: "cl-002",
    name: "Michael Chen",
    email: "mchen@chendev.com",
    phone: "(512) 555-0293",
    company: "Chen Development Group",
    packageTier: "Professional",
    monthlyRate: 3000,
    status: "Active",
    activeProjects: 2,
    totalRevenue: 187000,
    lastContact: new Date(Date.now() - 1 * 86400000),
    rating: 4.7,
    avatar: "MC",
    billingAddress: "4500 Congress Ave, Suite 200, Austin, TX 78745",
    projects: [
      { name: "South Congress Mixed Use", status: "In Progress", value: 130000 },
      { name: "East Side Townhomes", status: "Permitting", value: 57000 },
    ],
    recentInvoices: [
      { id: "INV-2024-0152", date: new Date(2026, 0, 20), amount: 18000, status: "Paid" },
      { id: "INV-2024-0110", date: new Date(2025, 11, 20), amount: 18000, status: "Paid" },
      { id: "INV-2024-0071", date: new Date(2025, 10, 20), amount: 15000, status: "Paid" },
    ],
    communications: [
      { date: new Date(Date.now() - 1 * 86400000), type: "Email", summary: "Sent permit status update for East Side Townhomes" },
      { date: new Date(Date.now() - 4 * 86400000), type: "Meeting", summary: "Design review meeting for South Congress project" },
      { date: new Date(Date.now() - 8 * 86400000), type: "Phone", summary: "Discussed budget adjustments for Q1" },
    ],
    notes: "Expanding portfolio aggressively in 2026. Interested in upgrading to Enterprise tier. Schedule follow-up in Feb.",
  },
  {
    id: "cl-003",
    name: "Thompson Family Trust",
    email: "admin@thompsonestates.com",
    phone: "(512) 555-0418",
    company: "Thompson Estates",
    packageTier: "Enterprise",
    monthlyRate: 5000,
    status: "Active",
    activeProjects: 1,
    totalRevenue: 1200000,
    lastContact: new Date(),
    rating: 4.8,
    avatar: "TF",
    billingAddress: "8900 Bee Cave Rd, Austin, TX 78746",
    projects: [
      { name: "Thompson Estate Main Residence", status: "In Progress", value: 1200000 },
    ],
    recentInvoices: [
      { id: "INV-2024-0160", date: new Date(2026, 1, 1), amount: 150000, status: "Pending" },
      { id: "INV-2024-0130", date: new Date(2026, 0, 1), amount: 150000, status: "Paid" },
      { id: "INV-2024-0095", date: new Date(2025, 11, 1), amount: 150000, status: "Paid" },
    ],
    communications: [
      { date: new Date(), type: "Meeting", summary: "Quarterly progress review with trust administrators" },
      { date: new Date(Date.now() - 7 * 86400000), type: "Email", summary: "Sent monthly progress report and photo documentation" },
      { date: new Date(Date.now() - 14 * 86400000), type: "Phone", summary: "Coordinated with landscape architect on exterior plans" },
    ],
    notes: "High-value estate project. Multiple stakeholders involved. All decisions require trust board approval. Primary contact is Richard Thompson.",
  },
  {
    id: "cl-004",
    name: "Robert Garcia",
    email: "robert@garciaproperties.com",
    phone: "(512) 555-0572",
    company: "Garcia Properties",
    packageTier: "Standard",
    monthlyRate: 1500,
    status: "Active",
    activeProjects: 2,
    totalRevenue: 95000,
    lastContact: new Date(Date.now() - 3 * 86400000),
    rating: 4.5,
    avatar: "RG",
    billingAddress: "2300 S Lamar Blvd, Austin, TX 78704",
    projects: [
      { name: "Zilker Duplex Renovation", status: "In Progress", value: 55000 },
      { name: "South 1st Retail Fit-out", status: "Planning", value: 40000 },
    ],
    recentInvoices: [
      { id: "INV-2024-0155", date: new Date(2026, 0, 25), amount: 8500, status: "Paid" },
      { id: "INV-2024-0115", date: new Date(2025, 11, 25), amount: 8500, status: "Paid" },
      { id: "INV-2024-0080", date: new Date(2025, 10, 25), amount: 7500, status: "Paid" },
    ],
    communications: [
      { date: new Date(Date.now() - 3 * 86400000), type: "Phone", summary: "Discussed timeline for Zilker duplex framing completion" },
      { date: new Date(Date.now() - 7 * 86400000), type: "Email", summary: "Sent scope of work for South 1st retail project" },
      { date: new Date(Date.now() - 15 * 86400000), type: "Meeting", summary: "Walk-through at Zilker duplex site" },
    ],
    notes: "Growing rental portfolio. Interested in property management add-on services. Responsive via phone.",
  },
  {
    id: "cl-005",
    name: "Mary Williams",
    email: "mary@williamsandsons.com",
    phone: "(512) 555-0631",
    company: "Williams & Sons",
    packageTier: "Professional",
    monthlyRate: 3000,
    status: "Active",
    activeProjects: 1,
    totalRevenue: 28000,
    lastContact: new Date(Date.now() - 1 * 86400000),
    rating: 5.0,
    avatar: "MW",
    billingAddress: "700 Lavaca St, Suite 1400, Austin, TX 78701",
    projects: [
      { name: "Williams Office Expansion", status: "Design Phase", value: 28000 },
    ],
    recentInvoices: [
      { id: "INV-2024-0161", date: new Date(2026, 1, 1), amount: 3000, status: "Pending" },
      { id: "INV-2024-0135", date: new Date(2026, 0, 1), amount: 3000, status: "Paid" },
    ],
    communications: [
      { date: new Date(Date.now() - 1 * 86400000), type: "Email", summary: "Shared design concepts for office expansion" },
      { date: new Date(Date.now() - 5 * 86400000), type: "Meeting", summary: "Initial consultation and space planning session" },
      { date: new Date(Date.now() - 12 * 86400000), type: "Phone", summary: "Introductory call and onboarding discussion" },
    ],
    notes: "New client as of January 2026. Excellent communicator and very organized. Family-owned construction firm since 1984.",
  },
  {
    id: "cl-006",
    name: "David Davis",
    email: "david@davisrealestate.com",
    phone: "(512) 555-0789",
    company: "Davis Real Estate",
    packageTier: "Enterprise",
    monthlyRate: 5000,
    status: "Active",
    activeProjects: 1,
    totalRevenue: 185000,
    lastContact: new Date(),
    rating: 4.2,
    avatar: "DD",
    billingAddress: "1100 Guadalupe St, Austin, TX 78701",
    projects: [
      { name: "Downtown Loft Conversions", status: "In Progress", value: 185000 },
    ],
    recentInvoices: [
      { id: "INV-2024-0158", date: new Date(2026, 1, 1), amount: 22000, status: "Pending" },
      { id: "INV-2024-0125", date: new Date(2026, 0, 1), amount: 22000, status: "Paid" },
      { id: "INV-2024-0088", date: new Date(2025, 11, 1), amount: 22000, status: "Paid" },
    ],
    communications: [
      { date: new Date(), type: "Phone", summary: "Urgent call about loft conversion HVAC delays" },
      { date: new Date(Date.now() - 3 * 86400000), type: "Email", summary: "Sent revised timeline accounting for supply chain issues" },
      { date: new Date(Date.now() - 10 * 86400000), type: "Meeting", summary: "Project status review with investor stakeholders" },
    ],
    notes: "Can be demanding on timelines. Requires frequent communication. Has expressed dissatisfaction with recent HVAC delays -- address proactively.",
  },
  {
    id: "cl-007",
    name: "Ana Martinez",
    email: "ana@martinezholdings.com",
    phone: "(512) 555-0845",
    company: "Martinez Holdings",
    packageTier: "Standard",
    monthlyRate: 1500,
    status: "Active",
    activeProjects: 1,
    totalRevenue: 18000,
    lastContact: new Date(Date.now() - 5 * 86400000),
    rating: 4.8,
    avatar: "AM",
    billingAddress: "3400 Manor Rd, Austin, TX 78723",
    projects: [
      { name: "Manor Road Accessory Dwelling", status: "Permitting", value: 18000 },
    ],
    recentInvoices: [
      { id: "INV-2024-0162", date: new Date(2026, 1, 1), amount: 1500, status: "Pending" },
      { id: "INV-2024-0140", date: new Date(2026, 0, 1), amount: 1500, status: "Paid" },
    ],
    communications: [
      { date: new Date(Date.now() - 5 * 86400000), type: "Email", summary: "Permit application submitted to City of Austin" },
      { date: new Date(Date.now() - 10 * 86400000), type: "Phone", summary: "Discussed ADU design options and zoning requirements" },
      { date: new Date(Date.now() - 18 * 86400000), type: "Meeting", summary: "Site assessment for accessory dwelling placement" },
    ],
    notes: "First-time builder. Very enthusiastic. Requires more hand-holding during permitting process. Bilingual -- Spanish preferred.",
  },
  {
    id: "cl-008",
    name: "James Park",
    email: "jpark@parkinvestments.com",
    phone: "(512) 555-0912",
    company: "Park Investments",
    packageTier: "Enterprise",
    monthlyRate: 5000,
    status: "Active",
    activeProjects: 1,
    totalRevenue: 320000,
    lastContact: new Date(Date.now() - 2 * 86400000),
    rating: 4.6,
    avatar: "JP",
    billingAddress: "500 W 2nd St, Suite 1900, Austin, TX 78701",
    projects: [
      { name: "Rainey Street Mixed-Use", status: "In Progress", value: 320000 },
    ],
    recentInvoices: [
      { id: "INV-2024-0156", date: new Date(2026, 0, 28), amount: 40000, status: "Paid" },
      { id: "INV-2024-0120", date: new Date(2025, 11, 28), amount: 40000, status: "Paid" },
      { id: "INV-2024-0085", date: new Date(2025, 10, 28), amount: 40000, status: "Paid" },
    ],
    communications: [
      { date: new Date(Date.now() - 2 * 86400000), type: "Meeting", summary: "Phase 2 kickoff meeting at Rainey Street site" },
      { date: new Date(Date.now() - 9 * 86400000), type: "Email", summary: "Distributed Phase 1 completion report and financials" },
      { date: new Date(Date.now() - 16 * 86400000), type: "Phone", summary: "Discussed leasing strategy impact on fit-out timeline" },
    ],
    notes: "Institutional investor. All communications must be documented. CFO reviews invoices. Potential for two more projects in 2026.",
  },
  {
    id: "cl-009",
    name: "Lisa Brown",
    email: "lisa@brownconstructionco.com",
    phone: "(512) 555-1047",
    company: "Brown Construction Co",
    packageTier: "Professional",
    monthlyRate: 3000,
    status: "Active",
    activeProjects: 2,
    totalRevenue: 156000,
    lastContact: new Date(Date.now() - 7 * 86400000),
    rating: 4.4,
    avatar: "LB",
    billingAddress: "6200 N Lamar Blvd, Austin, TX 78752",
    projects: [
      { name: "North Loop Retail Center", status: "In Progress", value: 96000 },
      { name: "Mueller Community Pool", status: "Bidding", value: 60000 },
    ],
    recentInvoices: [
      { id: "INV-2024-0148", date: new Date(2026, 0, 15), amount: 12000, status: "Paid" },
      { id: "INV-2024-0100", date: new Date(2025, 11, 15), amount: 12000, status: "Paid" },
      { id: "INV-2024-0065", date: new Date(2025, 10, 15), amount: 12000, status: "Paid" },
    ],
    communications: [
      { date: new Date(Date.now() - 7 * 86400000), type: "Email", summary: "Sent bid package for Mueller community pool project" },
      { date: new Date(Date.now() - 12 * 86400000), type: "Phone", summary: "Reviewed North Loop retail tenant improvement needs" },
      { date: new Date(Date.now() - 20 * 86400000), type: "Meeting", summary: "Monthly portfolio review meeting" },
    ],
    notes: "GC who also uses our PM platform. Dual relationship -- client and contractor on some projects. Keep communication channels separated.",
  },
  {
    id: "cl-010",
    name: "Kevin O'Brien",
    email: "kevin@obrienbuilders.com",
    phone: "(512) 555-1123",
    company: "O'Brien Builders",
    packageTier: "Standard",
    monthlyRate: 1500,
    status: "Inactive",
    activeProjects: 0,
    totalRevenue: 67000,
    lastContact: new Date(Date.now() - 14 * 86400000),
    rating: 4.1,
    avatar: "KO",
    billingAddress: "9500 Research Blvd, Austin, TX 78759",
    projects: [],
    recentInvoices: [
      { id: "INV-2024-0090", date: new Date(2025, 11, 5), amount: 1500, status: "Paid" },
      { id: "INV-2024-0055", date: new Date(2025, 10, 5), amount: 1500, status: "Paid" },
    ],
    communications: [
      { date: new Date(Date.now() - 14 * 86400000), type: "Email", summary: "Sent account pause confirmation and reactivation instructions" },
      { date: new Date(Date.now() - 16 * 86400000), type: "Phone", summary: "Client requested temporary account hold due to personal reasons" },
      { date: new Date(Date.now() - 30 * 86400000), type: "Meeting", summary: "Final walkthrough for completed Cedar Park project" },
    ],
    notes: "Account paused at client request. Expects to reactivate in Q2 2026. Follow up in April. Previous project completed on time and under budget.",
  },
  {
    id: "cl-011",
    name: "Patricia Nguyen",
    email: "patricia@nguyenproperties.com",
    phone: "(512) 555-1256",
    company: "Nguyen Properties",
    packageTier: "Professional",
    monthlyRate: 3000,
    status: "Active",
    activeProjects: 1,
    totalRevenue: 92000,
    lastContact: new Date(Date.now() - 3 * 86400000),
    rating: 4.9,
    avatar: "PN",
    billingAddress: "1800 E 4th St, Austin, TX 78702",
    projects: [
      { name: "East Austin Creative Office", status: "In Progress", value: 92000 },
    ],
    recentInvoices: [
      { id: "INV-2024-0157", date: new Date(2026, 0, 30), amount: 10000, status: "Paid" },
      { id: "INV-2024-0118", date: new Date(2025, 11, 30), amount: 10000, status: "Paid" },
      { id: "INV-2024-0078", date: new Date(2025, 10, 30), amount: 10000, status: "Paid" },
    ],
    communications: [
      { date: new Date(Date.now() - 3 * 86400000), type: "Meeting", summary: "Interior design selections review for creative office" },
      { date: new Date(Date.now() - 8 * 86400000), type: "Email", summary: "Shared sustainability certification options" },
      { date: new Date(Date.now() - 15 * 86400000), type: "Phone", summary: "Discussed green building incentives from City of Austin" },
    ],
    notes: "Passionate about sustainable building. LEED certification is a priority. Strong referral source -- referred Mary Williams.",
  },
  {
    id: "cl-012",
    name: "Tom Anderson",
    email: "tom@andersonhomes.com",
    phone: "(512) 555-1389",
    company: "Anderson Homes",
    packageTier: "Basic",
    monthlyRate: 800,
    status: "Prospect",
    activeProjects: 0,
    totalRevenue: 0,
    lastContact: new Date(),
    rating: null,
    avatar: "TA",
    billingAddress: "4100 Duval St, Austin, TX 78751",
    projects: [],
    recentInvoices: [],
    communications: [
      { date: new Date(), type: "Meeting", summary: "Initial sales meeting -- toured platform demo" },
      { date: new Date(Date.now() - 2 * 86400000), type: "Email", summary: "Sent platform overview and pricing sheet" },
      { date: new Date(Date.now() - 5 * 86400000), type: "Phone", summary: "Cold outreach call -- expressed interest in PM tools" },
    ],
    notes: "Prospect from website inquiry. Small custom home builder, 3-4 projects per year. Evaluating our platform vs. Buildertrend. Decision expected by mid-February.",
  },
  {
    id: "cl-013",
    name: "Jennifer Lee",
    email: "jlee@leedevelopments.com",
    phone: "(512) 555-1502",
    company: "Lee Developments",
    packageTier: "Enterprise",
    monthlyRate: 5000,
    status: "Active",
    activeProjects: 4,
    totalRevenue: 890000,
    lastContact: new Date(),
    rating: 4.7,
    avatar: "JL",
    billingAddress: "300 W 6th St, Suite 2200, Austin, TX 78701",
    projects: [
      { name: "Domain North Tower", status: "In Progress", value: 450000 },
      { name: "Pflugerville Town Center", status: "In Progress", value: 220000 },
      { name: "Round Rock Medical Office", status: "Permitting", value: 120000 },
      { name: "Cedar Park Senior Living", status: "Planning", value: 100000 },
    ],
    recentInvoices: [
      { id: "INV-2024-0163", date: new Date(2026, 1, 1), amount: 85000, status: "Pending" },
      { id: "INV-2024-0132", date: new Date(2026, 0, 1), amount: 85000, status: "Paid" },
      { id: "INV-2024-0092", date: new Date(2025, 11, 1), amount: 75000, status: "Paid" },
    ],
    communications: [
      { date: new Date(), type: "Meeting", summary: "Executive portfolio review -- all four active projects" },
      { date: new Date(Date.now() - 3 * 86400000), type: "Email", summary: "Sent consolidated monthly financial report across all projects" },
      { date: new Date(Date.now() - 6 * 86400000), type: "Phone", summary: "Discussed Cedar Park senior living project kickoff timeline" },
    ],
    notes: "Largest active client by project count. Dedicated PM assigned. Quarterly executive reviews mandatory. Board presentation materials needed by March 15.",
  },
  {
    id: "cl-014",
    name: "Mark Wilson",
    email: "mark@wilsongroup.com",
    phone: "(512) 555-1678",
    company: "Wilson Group",
    packageTier: "Standard",
    monthlyRate: 1500,
    status: "On Hold",
    activeProjects: 1,
    totalRevenue: 45000,
    lastContact: new Date(Date.now() - 30 * 86400000),
    rating: 3.8,
    avatar: "MW2",
    billingAddress: "7700 Parmer Ln, Austin, TX 78729",
    projects: [
      { name: "Parmer Tech Office", status: "On Hold", value: 45000 },
    ],
    recentInvoices: [
      { id: "INV-2024-0105", date: new Date(2025, 11, 10), amount: 5000, status: "Overdue" },
      { id: "INV-2024-0070", date: new Date(2025, 10, 10), amount: 5000, status: "Paid" },
    ],
    communications: [
      { date: new Date(Date.now() - 30 * 86400000), type: "Email", summary: "Client notified of project hold due to funding delays" },
      { date: new Date(Date.now() - 35 * 86400000), type: "Phone", summary: "Discussed outstanding invoice and payment plan options" },
      { date: new Date(Date.now() - 45 * 86400000), type: "Meeting", summary: "Project review -- identified funding gap for Phase 2" },
    ],
    notes: "Project on hold due to financing issues. Overdue invoice INV-2024-0105 outstanding. Escalate to collections if not resolved by Feb 15. Maintain relationship -- good long-term potential.",
  },
  {
    id: "cl-015",
    name: "Diana Cruz",
    email: "diana@cruzarchitecture.com",
    phone: "(512) 555-1834",
    company: "Cruz Architecture",
    packageTier: "Professional",
    monthlyRate: 3000,
    status: "Active",
    activeProjects: 2,
    totalRevenue: 134000,
    lastContact: new Date(Date.now() - 4 * 86400000),
    rating: 4.6,
    avatar: "DC",
    billingAddress: "600 Congress Ave, Suite 1100, Austin, TX 78701",
    projects: [
      { name: "SoCo Boutique Hotel", status: "In Progress", value: 98000 },
      { name: "Clarksville Historic Renovation", status: "Design Phase", value: 36000 },
    ],
    recentInvoices: [
      { id: "INV-2024-0159", date: new Date(2026, 0, 31), amount: 14000, status: "Paid" },
      { id: "INV-2024-0122", date: new Date(2025, 11, 31), amount: 14000, status: "Paid" },
      { id: "INV-2024-0082", date: new Date(2025, 10, 31), amount: 12000, status: "Paid" },
    ],
    communications: [
      { date: new Date(Date.now() - 4 * 86400000), type: "Email", summary: "Sent historic district compliance checklist for Clarksville project" },
      { date: new Date(Date.now() - 7 * 86400000), type: "Meeting", summary: "Design coordination meeting for SoCo boutique hotel" },
      { date: new Date(Date.now() - 14 * 86400000), type: "Phone", summary: "Reviewed structural engineer's report on Clarksville property" },
    ],
    notes: "Architect who also uses us for PM. Great design-build collaboration. Speaking at Austin AIA chapter event in March -- potential co-marketing opportunity.",
  },
];

// ---------------------------------------------------------------------------
// Helper Functions
// ---------------------------------------------------------------------------

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

function formatLastContact(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "1 day ago";
  if (diffDays < 7) return `${diffDays} days ago`;
  if (diffDays < 14) return "1 week ago";
  if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
  if (diffDays < 60) return "1 month ago";
  return `${Math.floor(diffDays / 30)} months ago`;
}

function getPackageBadgeClasses(tier: PackageTier): string {
  switch (tier) {
    case "Enterprise":
      return "bg-purple-100 text-purple-700 border-purple-200";
    case "Professional":
      return "bg-blue-100 text-blue-700 border-blue-200";
    case "Standard":
      return "bg-green-100 text-green-700 border-green-200";
    case "Basic":
      return "bg-gray-100 text-gray-600 border-gray-200";
  }
}

function getStatusBadgeClasses(status: ClientStatus): string {
  switch (status) {
    case "Active":
      return "bg-emerald-100 text-emerald-700 border-emerald-200";
    case "Inactive":
      return "bg-gray-100 text-gray-600 border-gray-200";
    case "Prospect":
      return "bg-blue-100 text-blue-700 border-blue-200";
    case "On Hold":
      return "bg-amber-100 text-amber-700 border-amber-200";
  }
}

function getInvoiceStatusClasses(status: "Paid" | "Pending" | "Overdue"): string {
  switch (status) {
    case "Paid":
      return "text-emerald-600 bg-emerald-50";
    case "Pending":
      return "text-amber-600 bg-amber-50";
    case "Overdue":
      return "text-red-600 bg-red-50";
  }
}

function getCommunicationIcon(type: "Email" | "Phone" | "Meeting") {
  switch (type) {
    case "Email":
      return <Mail size={14} className="text-blue-500" />;
    case "Phone":
      return <Phone size={14} className="text-green-500" />;
    case "Meeting":
      return <Users size={14} className="text-purple-500" />;
  }
}

// ---------------------------------------------------------------------------
// Star Rating Component
// ---------------------------------------------------------------------------

function StarRating({ rating }: { rating: number | null }) {
  if (rating === null) {
    return <span className="text-sm text-gray-400 italic">N/A</span>;
  }

  const fullStars = Math.floor(rating);
  const hasHalfStar = rating - fullStars >= 0.3;
  const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);

  return (
    <div className="flex items-center gap-1">
      <div className="flex">
        {Array.from({ length: fullStars }).map((_, i) => (
          <Star key={`full-${i}`} size={14} className="fill-amber-400 text-amber-400" />
        ))}
        {hasHalfStar && (
          <div className="relative">
            <Star size={14} className="text-gray-300" />
            <div className="absolute inset-0 overflow-hidden w-[7px]">
              <Star size={14} className="fill-amber-400 text-amber-400" />
            </div>
          </div>
        )}
        {Array.from({ length: emptyStars }).map((_, i) => (
          <Star key={`empty-${i}`} size={14} className="text-gray-300" />
        ))}
      </div>
      <span className="text-sm font-medium text-gray-700 ml-1">{rating.toFixed(1)}</span>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Expanded Client Detail Panel
// ---------------------------------------------------------------------------

function ClientExpandedDetail({ client }: { client: ClientData }) {
  return (
    <tr>
      <td colSpan={10} className="p-0">
        <div className="bg-slate-50 border-t border-b border-slate-200 px-8 py-6">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {/* Contact & Billing Info */}
            <div className="space-y-4">
              <h4 className="text-sm font-semibold text-gray-900 uppercase tracking-wide flex items-center gap-2">
                <Building2 size={14} />
                Contact Information
              </h4>
              <div className="space-y-2 text-sm">
                <div className="flex items-start gap-2 text-gray-600">
                  <Mail size={14} className="mt-0.5 shrink-0 text-gray-400" />
                  <a href={`mailto:${client.email}`} className="hover:text-blue-600 transition-colors">
                    {client.email}
                  </a>
                </div>
                <div className="flex items-start gap-2 text-gray-600">
                  <Phone size={14} className="mt-0.5 shrink-0 text-gray-400" />
                  <a href={`tel:${client.phone}`} className="hover:text-blue-600 transition-colors">
                    {client.phone}
                  </a>
                </div>
                <div className="flex items-start gap-2 text-gray-600">
                  <MapPin size={14} className="mt-0.5 shrink-0 text-gray-400" />
                  <span>{client.billingAddress}</span>
                </div>
              </div>
            </div>

            {/* Active Projects */}
            <div className="space-y-4">
              <h4 className="text-sm font-semibold text-gray-900 uppercase tracking-wide flex items-center gap-2">
                <FolderKanban size={14} />
                Active Projects ({client.projects.length})
              </h4>
              {client.projects.length > 0 ? (
                <div className="space-y-2">
                  {client.projects.map((project, idx) => (
                    <div
                      key={idx}
                      className="bg-white rounded-lg border border-gray-200 px-3 py-2 text-sm"
                    >
                      <div className="font-medium text-gray-900">{project.name}</div>
                      <div className="flex items-center justify-between mt-1">
                        <span className="text-xs text-gray-500">{project.status}</span>
                        <span className="text-xs font-medium text-gray-700">
                          {formatCurrency(project.value)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-400 italic">No active projects</p>
              )}
            </div>

            {/* Recent Invoices */}
            <div className="space-y-4">
              <h4 className="text-sm font-semibold text-gray-900 uppercase tracking-wide flex items-center gap-2">
                <Receipt size={14} />
                Recent Invoices
              </h4>
              {client.recentInvoices.length > 0 ? (
                <div className="space-y-2">
                  {client.recentInvoices.map((invoice) => (
                    <div
                      key={invoice.id}
                      className="bg-white rounded-lg border border-gray-200 px-3 py-2 text-sm flex items-center justify-between"
                    >
                      <div>
                        <div className="font-medium text-gray-700">{invoice.id}</div>
                        <div className="text-xs text-gray-400">
                          {format(invoice.date, "MMM d, yyyy")}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-medium text-gray-900">
                          {formatCurrency(invoice.amount)}
                        </div>
                        <span
                          className={cn(
                            "inline-block text-xs px-2 py-0.5 rounded-full font-medium",
                            getInvoiceStatusClasses(invoice.status)
                          )}
                        >
                          {invoice.status}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-400 italic">No invoices yet</p>
              )}
            </div>

            {/* Communication History & Notes */}
            <div className="space-y-4">
              <h4 className="text-sm font-semibold text-gray-900 uppercase tracking-wide flex items-center gap-2">
                <MessageSquare size={14} />
                Recent Communications
              </h4>
              <div className="space-y-2">
                {client.communications.map((comm, idx) => (
                  <div
                    key={idx}
                    className="bg-white rounded-lg border border-gray-200 px-3 py-2 text-sm"
                  >
                    <div className="flex items-center gap-2 mb-1">
                      {getCommunicationIcon(comm.type)}
                      <span className="text-xs font-medium text-gray-500">
                        {comm.type} -- {format(comm.date, "MMM d")}
                      </span>
                    </div>
                    <p className="text-xs text-gray-600 leading-relaxed">{comm.summary}</p>
                  </div>
                ))}
              </div>

              <h4 className="text-sm font-semibold text-gray-900 uppercase tracking-wide flex items-center gap-2 pt-2">
                <StickyNote size={14} />
                Notes
              </h4>
              <p className="text-xs text-gray-600 leading-relaxed bg-white rounded-lg border border-gray-200 px-3 py-2">
                {client.notes}
              </p>
            </div>
          </div>
        </div>
      </td>
    </tr>
  );
}

// ---------------------------------------------------------------------------
// Client Card (Grid View)
// ---------------------------------------------------------------------------

function ClientGridCard({
  client,
  isSelected,
  onToggleSelect,
}: {
  client: ClientData;
  isSelected: boolean;
  onToggleSelect: () => void;
}) {
  return (
    <Card variant="default" hover className="relative group">
      <div className="absolute top-4 right-4 flex items-center gap-2">
        <button
          onClick={(e) => {
            e.stopPropagation();
            onToggleSelect();
          }}
          className="text-gray-400 hover:text-gray-600 transition-colors"
        >
          {isSelected ? (
            <CheckSquare size={18} className="text-blue-600" />
          ) : (
            <Square size={18} />
          )}
        </button>
      </div>

      <div className="flex items-center gap-3 mb-4">
        <div
          className={cn(
            "w-12 h-12 rounded-full flex items-center justify-center font-bold text-sm shrink-0",
            client.status === "Active"
              ? "bg-blue-100 text-blue-700"
              : client.status === "Prospect"
              ? "bg-indigo-100 text-indigo-700"
              : "bg-gray-100 text-gray-600"
          )}
        >
          {client.avatar.slice(0, 2)}
        </div>
        <div className="min-w-0">
          <h3 className="font-semibold text-gray-900 truncate">{client.name}</h3>
          <p className="text-sm text-gray-500 truncate">{client.company}</p>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2 mb-4">
        <span
          className={cn(
            "inline-flex items-center px-2.5 py-0.5 text-xs font-medium rounded-full border",
            getStatusBadgeClasses(client.status)
          )}
        >
          {client.status}
        </span>
        <span
          className={cn(
            "inline-flex items-center px-2.5 py-0.5 text-xs font-medium rounded-full border",
            getPackageBadgeClasses(client.packageTier)
          )}
        >
          {client.packageTier}
        </span>
      </div>

      <div className="grid grid-cols-2 gap-3 mb-4">
        <div className="bg-gray-50 rounded-lg px-3 py-2">
          <div className="text-xs text-gray-500">Projects</div>
          <div className="text-lg font-bold text-gray-900">{client.activeProjects}</div>
        </div>
        <div className="bg-gray-50 rounded-lg px-3 py-2">
          <div className="text-xs text-gray-500">Revenue</div>
          <div className="text-lg font-bold text-gray-900">
            {formatCurrency(client.totalRevenue)}
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between text-sm text-gray-500 mb-3">
        <div className="flex items-center gap-1">
          <Clock size={14} />
          <span>{formatLastContact(client.lastContact)}</span>
        </div>
        <StarRating rating={client.rating} />
      </div>

      <div className="flex items-center gap-2 pt-3 border-t border-gray-100">
        <a
          href={`mailto:${client.email}`}
          className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
          title="Send Email"
        >
          <Mail size={16} />
        </a>
        <a
          href={`tel:${client.phone}`}
          className="p-2 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors"
          title="Call"
        >
          <Phone size={16} />
        </a>
        <div className="flex-1" />
        <Button variant="ghost" size="sm" leftIcon={<Eye size={14} />}>
          View
        </Button>
      </div>
    </Card>
  );
}

// ---------------------------------------------------------------------------
// Main Page Component
// ---------------------------------------------------------------------------

export default function ClientsPage() {
  // -- State -----------------------------------------------------------------
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"All" | ClientStatus>("All");
  const [packageFilter, setPackageFilter] = useState<"All" | PackageTier>("All");
  const [sortField, setSortField] = useState<SortField>("name");
  const [sortAsc, setSortAsc] = useState(true);
  const [viewMode, setViewMode] = useState<ViewMode>("table");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(15);

  // -- Filtering & Sorting ---------------------------------------------------
  const filteredClients = useMemo(() => {
    let result = [...CLIENTS];

    // Search filter
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(
        (c) =>
          c.name.toLowerCase().includes(q) ||
          c.email.toLowerCase().includes(q) ||
          c.phone.includes(q) ||
          c.company.toLowerCase().includes(q)
      );
    }

    // Status filter
    if (statusFilter !== "All") {
      result = result.filter((c) => c.status === statusFilter);
    }

    // Package filter
    if (packageFilter !== "All") {
      result = result.filter((c) => c.packageTier === packageFilter);
    }

    // Sorting
    result.sort((a, b) => {
      let cmp = 0;
      switch (sortField) {
        case "name":
          cmp = a.name.localeCompare(b.name);
          break;
        case "revenue":
          cmp = a.totalRevenue - b.totalRevenue;
          break;
        case "projects":
          cmp = a.activeProjects - b.activeProjects;
          break;
        case "lastContact":
          cmp = a.lastContact.getTime() - b.lastContact.getTime();
          break;
        case "rating":
          cmp = (a.rating ?? 0) - (b.rating ?? 0);
          break;
      }
      return sortAsc ? cmp : -cmp;
    });

    return result;
  }, [search, statusFilter, packageFilter, sortField, sortAsc]);

  // -- Pagination ------------------------------------------------------------
  const totalClients = 47; // total in system
  const totalPages = Math.max(1, Math.ceil(filteredClients.length / pageSize));
  const paginatedClients = filteredClients.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  // -- Selection Handlers ----------------------------------------------------
  const toggleSelect = useCallback((id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }, []);

  const toggleSelectAll = useCallback(() => {
    setSelectedIds((prev) => {
      if (prev.size === paginatedClients.length) {
        return new Set();
      }
      return new Set(paginatedClients.map((c) => c.id));
    });
  }, [paginatedClients]);

  const clearSelection = useCallback(() => {
    setSelectedIds(new Set());
  }, []);

  // -- Sort Handler ----------------------------------------------------------
  const handleSort = useCallback(
    (field: SortField) => {
      if (sortField === field) {
        setSortAsc((prev) => !prev);
      } else {
        setSortField(field);
        setSortAsc(true);
      }
    },
    [sortField]
  );

  const SortableHeader = ({
    field,
    children,
    className,
  }: {
    field: SortField;
    children: React.ReactNode;
    className?: string;
  }) => (
    <th
      className={cn(
        "px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider cursor-pointer hover:text-gray-700 select-none transition-colors",
        className
      )}
      onClick={() => handleSort(field)}
    >
      <div className="flex items-center gap-1">
        {children}
        <ArrowUpDown
          size={12}
          className={cn(
            "transition-colors",
            sortField === field ? "text-blue-600" : "text-gray-300"
          )}
        />
      </div>
    </th>
  );

  // -- KPI Data --------------------------------------------------------------
  const kpis = [
    {
      title: "Total Clients",
      value: "47",
      change: "+5 this month",
      changeType: "positive" as const,
      icon: Users,
      iconBg: "bg-blue-100",
      iconColor: "text-blue-600",
    },
    {
      title: "Active Projects",
      value: "24",
      change: "Across all clients",
      changeType: "neutral" as const,
      icon: FolderKanban,
      iconBg: "bg-emerald-100",
      iconColor: "text-emerald-600",
    },
    {
      title: "Monthly Revenue",
      value: "$487,250",
      change: "+12.3% vs last month",
      changeType: "positive" as const,
      icon: DollarSign,
      iconBg: "bg-violet-100",
      iconColor: "text-violet-600",
    },
    {
      title: "Avg Client Rating",
      value: "4.7 / 5.0",
      change: "Based on 44 reviews",
      changeType: "neutral" as const,
      icon: Star,
      iconBg: "bg-amber-100",
      iconColor: "text-amber-600",
    },
    {
      title: "Retention Rate",
      value: "94%",
      change: "+2% vs last quarter",
      changeType: "positive" as const,
      icon: ShieldCheck,
      iconBg: "bg-teal-100",
      iconColor: "text-teal-600",
    },
  ];

  // -- Render ----------------------------------------------------------------
  return (
    <div className="min-h-screen space-y-6 pb-8">
      {/* ================================================================== */}
      {/* HEADER                                                              */}
      {/* ================================================================== */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 tracking-tight">
            Client Management
          </h1>
          <p className="text-gray-500 mt-1">
            Manage clients, contracts, projects, and communications
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <Button variant="secondary" size="sm" leftIcon={<Upload size={16} />}>
            Import Clients
          </Button>
          <Button variant="secondary" size="sm" leftIcon={<Download size={16} />}>
            Export CSV
          </Button>
          <Button variant="primary" size="sm" leftIcon={<Plus size={16} />}>
            Add Client
          </Button>
        </div>
      </div>

      {/* ================================================================== */}
      {/* KPI CARDS                                                           */}
      {/* ================================================================== */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {kpis.map((kpi) => {
          const Icon = kpi.icon;
          return (
            <Card key={kpi.title} variant="default" className="p-5">
              <div className="flex items-start justify-between mb-3">
                <div
                  className={cn(
                    "w-10 h-10 rounded-lg flex items-center justify-center",
                    kpi.iconBg
                  )}
                >
                  <Icon size={20} className={kpi.iconColor} />
                </div>
                {kpi.changeType === "positive" && (
                  <TrendingUp size={16} className="text-emerald-500" />
                )}
              </div>
              <div className="text-2xl font-bold text-gray-900">{kpi.value}</div>
              <div className="text-xs text-gray-500 mt-1">{kpi.title}</div>
              <div
                className={cn(
                  "text-xs mt-2 font-medium",
                  kpi.changeType === "positive"
                    ? "text-emerald-600"
                    : "text-gray-400"
                )}
              >
                {kpi.change}
              </div>
            </Card>
          );
        })}
      </div>

      {/* ================================================================== */}
      {/* ADVANCED FILTERS                                                    */}
      {/* ================================================================== */}
      <Card variant="default" className="p-5">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4 items-end">
          {/* Search */}
          <div className="lg:col-span-2">
            <Input
              placeholder="Search by name, email, phone, company..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setCurrentPage(1);
              }}
              leftIcon={<Search size={16} />}
            />
          </div>

          {/* Status Filter */}
          <div className="space-y-2">
            <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide">
              Status
            </label>
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value as "All" | ClientStatus);
                setCurrentPage(1);
              }}
              className="w-full px-3 py-3 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white transition-all"
            >
              <option value="All">All Statuses</option>
              <option value="Active">Active</option>
              <option value="Inactive">Inactive</option>
              <option value="Prospect">Prospect</option>
              <option value="On Hold">On Hold</option>
            </select>
          </div>

          {/* Package Filter */}
          <div className="space-y-2">
            <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide">
              Package Tier
            </label>
            <select
              value={packageFilter}
              onChange={(e) => {
                setPackageFilter(e.target.value as "All" | PackageTier);
                setCurrentPage(1);
              }}
              className="w-full px-3 py-3 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white transition-all"
            >
              <option value="All">All Packages</option>
              <option value="Enterprise">Enterprise</option>
              <option value="Professional">Professional</option>
              <option value="Standard">Standard</option>
              <option value="Basic">Basic</option>
            </select>
          </div>

          {/* Sort By */}
          <div className="space-y-2">
            <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide">
              Sort By
            </label>
            <select
              value={sortField}
              onChange={(e) => {
                setSortField(e.target.value as SortField);
                setCurrentPage(1);
              }}
              className="w-full px-3 py-3 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white transition-all"
            >
              <option value="name">Name</option>
              <option value="revenue">Revenue</option>
              <option value="projects">Projects</option>
              <option value="lastContact">Last Contact</option>
              <option value="rating">Rating</option>
            </select>
          </div>

          {/* View Toggle */}
          <div className="space-y-2">
            <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide">
              View
            </label>
            <div className="flex rounded-lg border border-gray-300 overflow-hidden">
              <button
                onClick={() => setViewMode("table")}
                className={cn(
                  "flex-1 flex items-center justify-center gap-1.5 px-3 py-2.5 text-sm font-medium transition-colors",
                  viewMode === "table"
                    ? "bg-blue-600 text-white"
                    : "bg-white text-gray-600 hover:bg-gray-50"
                )}
              >
                <LayoutList size={16} />
                Table
              </button>
              <button
                onClick={() => setViewMode("grid")}
                className={cn(
                  "flex-1 flex items-center justify-center gap-1.5 px-3 py-2.5 text-sm font-medium transition-colors",
                  viewMode === "grid"
                    ? "bg-blue-600 text-white"
                    : "bg-white text-gray-600 hover:bg-gray-50"
                )}
              >
                <LayoutGrid size={16} />
                Cards
              </button>
            </div>
          </div>
        </div>
      </Card>

      {/* ================================================================== */}
      {/* BULK ACTIONS BAR                                                    */}
      {/* ================================================================== */}
      {selectedIds.size > 0 && (
        <div className="bg-blue-600 rounded-xl px-6 py-3 flex items-center justify-between shadow-lg animate-in slide-in-from-top-2">
          <div className="flex items-center gap-3 text-white">
            <CheckSquare size={18} />
            <span className="font-medium">
              {selectedIds.size} client{selectedIds.size !== 1 ? "s" : ""} selected
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              className="text-white hover:bg-blue-700 hover:text-white"
              leftIcon={<Mail size={14} />}
            >
              Bulk Email
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="text-white hover:bg-blue-700 hover:text-white"
              leftIcon={<Edit size={14} />}
            >
              Bulk Status Change
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="text-white hover:bg-blue-700 hover:text-white"
              leftIcon={<Tag size={14} />}
            >
              Bulk Tag
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="text-white hover:bg-blue-700 hover:text-white"
              leftIcon={<Download size={14} />}
            >
              Export Selected
            </Button>
            <div className="w-px h-6 bg-blue-400 mx-1" />
            <button
              onClick={clearSelection}
              className="text-blue-200 hover:text-white transition-colors p-1"
              title="Clear selection"
            >
              <X size={18} />
            </button>
          </div>
        </div>
      )}

      {/* ================================================================== */}
      {/* CLIENT TABLE VIEW                                                   */}
      {/* ================================================================== */}
      {viewMode === "table" ? (
        <Card variant="default" className="overflow-hidden p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="w-12 px-4 py-3">
                    <button onClick={toggleSelectAll} className="text-gray-400 hover:text-gray-600">
                      {selectedIds.size === paginatedClients.length &&
                      paginatedClients.length > 0 ? (
                        <CheckSquare size={18} className="text-blue-600" />
                      ) : (
                        <Square size={18} />
                      )}
                    </button>
                  </th>
                  <SortableHeader field="name" className="min-w-[200px]">
                    Client Name
                  </SortableHeader>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Company
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Package
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <SortableHeader field="projects">Active Projects</SortableHeader>
                  <SortableHeader field="revenue">Total Revenue</SortableHeader>
                  <SortableHeader field="lastContact">Last Contact</SortableHeader>
                  <SortableHeader field="rating">Rating</SortableHeader>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {paginatedClients.map((client) => {
                  const isExpanded = expandedId === client.id;
                  const isSelected = selectedIds.has(client.id);

                  return (
                    <React.Fragment key={client.id}>
                      <tr
                        className={cn(
                          "transition-colors group",
                          isSelected
                            ? "bg-blue-50"
                            : isExpanded
                            ? "bg-slate-50"
                            : "hover:bg-gray-50"
                        )}
                      >
                        {/* Checkbox */}
                        <td className="px-4 py-4">
                          <button
                            onClick={() => toggleSelect(client.id)}
                            className="text-gray-400 hover:text-gray-600"
                          >
                            {isSelected ? (
                              <CheckSquare size={18} className="text-blue-600" />
                            ) : (
                              <Square size={18} />
                            )}
                          </button>
                        </td>

                        {/* Client Name */}
                        <td className="px-4 py-4">
                          <button
                            onClick={() =>
                              setExpandedId(isExpanded ? null : client.id)
                            }
                            className="flex items-center gap-3 text-left group/name"
                          >
                            <div
                              className={cn(
                                "w-9 h-9 rounded-full flex items-center justify-center font-semibold text-xs shrink-0",
                                client.status === "Active"
                                  ? "bg-blue-100 text-blue-700"
                                  : client.status === "Prospect"
                                  ? "bg-indigo-100 text-indigo-700"
                                  : "bg-gray-100 text-gray-600"
                              )}
                            >
                              {client.avatar.slice(0, 2)}
                            </div>
                            <div>
                              <div className="font-semibold text-gray-900 group-hover/name:text-blue-600 transition-colors">
                                {client.name}
                              </div>
                              <div className="text-xs text-gray-400">{client.email}</div>
                            </div>
                            {isExpanded ? (
                              <ChevronUp size={14} className="text-gray-400 ml-1" />
                            ) : (
                              <ChevronDown size={14} className="text-gray-300 ml-1 opacity-0 group-hover:opacity-100 transition-opacity" />
                            )}
                          </button>
                        </td>

                        {/* Company */}
                        <td className="px-4 py-4">
                          <span className="text-sm text-gray-700">{client.company}</span>
                        </td>

                        {/* Package */}
                        <td className="px-4 py-4">
                          <div className="flex flex-col gap-1">
                            <span
                              className={cn(
                                "inline-flex items-center px-2.5 py-0.5 text-xs font-medium rounded-full border w-fit",
                                getPackageBadgeClasses(client.packageTier)
                              )}
                            >
                              {client.packageTier}
                            </span>
                            <span className="text-xs text-gray-400">
                              {formatCurrency(client.monthlyRate)}/mo
                            </span>
                          </div>
                        </td>

                        {/* Status */}
                        <td className="px-4 py-4">
                          <span
                            className={cn(
                              "inline-flex items-center px-2.5 py-0.5 text-xs font-medium rounded-full border",
                              getStatusBadgeClasses(client.status)
                            )}
                          >
                            <span
                              className={cn(
                                "w-1.5 h-1.5 rounded-full mr-1.5",
                                client.status === "Active" && "bg-emerald-500",
                                client.status === "Inactive" && "bg-gray-400",
                                client.status === "Prospect" && "bg-blue-500",
                                client.status === "On Hold" && "bg-amber-500"
                              )}
                            />
                            {client.status}
                          </span>
                        </td>

                        {/* Active Projects */}
                        <td className="px-4 py-4">
                          <span
                            className={cn(
                              "text-sm font-medium",
                              client.activeProjects > 0
                                ? "text-gray-900"
                                : "text-gray-400"
                            )}
                          >
                            {client.activeProjects}
                          </span>
                        </td>

                        {/* Total Revenue */}
                        <td className="px-4 py-4">
                          <span
                            className={cn(
                              "text-sm font-semibold",
                              client.totalRevenue > 0
                                ? "text-gray-900"
                                : "text-gray-400"
                            )}
                          >
                            {client.totalRevenue > 0
                              ? formatCurrency(client.totalRevenue)
                              : "$0"}
                          </span>
                        </td>

                        {/* Last Contact */}
                        <td className="px-4 py-4">
                          <div className="flex items-center gap-1.5 text-sm text-gray-600">
                            <Calendar size={13} className="text-gray-400" />
                            {formatLastContact(client.lastContact)}
                          </div>
                        </td>

                        {/* Rating */}
                        <td className="px-4 py-4">
                          <StarRating rating={client.rating} />
                        </td>

                        {/* Actions */}
                        <td className="px-4 py-4 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <button
                              onClick={() =>
                                setExpandedId(isExpanded ? null : client.id)
                              }
                              className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                              title="View details"
                            >
                              <Eye size={16} />
                            </button>
                            <button
                              className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                              title="Edit client"
                            >
                              <Edit size={16} />
                            </button>
                            <button
                              className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                              title="More actions"
                            >
                              <MoreHorizontal size={16} />
                            </button>
                          </div>
                        </td>
                      </tr>

                      {/* Expanded Detail Panel */}
                      {isExpanded && (
                        <ClientExpandedDetail client={client} />
                      )}
                    </React.Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>

          {paginatedClients.length === 0 && (
            <div className="py-16 text-center">
              <Users size={48} className="mx-auto text-gray-300 mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-1">
                No clients found
              </h3>
              <p className="text-sm text-gray-500">
                Try adjusting your search or filter criteria.
              </p>
            </div>
          )}
        </Card>
      ) : (
        /* ================================================================== */
        /* CLIENT GRID VIEW                                                    */
        /* ================================================================== */
        <div>
          {paginatedClients.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {paginatedClients.map((client) => (
                <ClientGridCard
                  key={client.id}
                  client={client}
                  isSelected={selectedIds.has(client.id)}
                  onToggleSelect={() => toggleSelect(client.id)}
                />
              ))}
            </div>
          ) : (
            <Card variant="default" className="py-16 text-center">
              <Users size={48} className="mx-auto text-gray-300 mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-1">
                No clients found
              </h3>
              <p className="text-sm text-gray-500">
                Try adjusting your search or filter criteria.
              </p>
            </Card>
          )}
        </div>
      )}

      {/* ================================================================== */}
      {/* PAGINATION                                                          */}
      {/* ================================================================== */}
      <Card variant="default" className="p-4">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          {/* Result Info */}
          <div className="text-sm text-gray-500">
            Showing{" "}
            <span className="font-medium text-gray-900">
              {filteredClients.length === 0
                ? 0
                : (currentPage - 1) * pageSize + 1}
            </span>
            {" - "}
            <span className="font-medium text-gray-900">
              {Math.min(currentPage * pageSize, filteredClients.length)}
            </span>{" "}
            of{" "}
            <span className="font-medium text-gray-900">{totalClients}</span>{" "}
            clients
          </div>

          {/* Page Size Selector */}
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <span>Rows per page:</span>
            <select
              value={pageSize}
              onChange={(e) => {
                setPageSize(Number(e.target.value));
                setCurrentPage(1);
              }}
              className="border border-gray-300 rounded-md px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
            >
              <option value={15}>15</option>
              <option value={25}>25</option>
              <option value={50}>50</option>
            </select>
          </div>

          {/* Page Navigation */}
          <div className="flex items-center gap-1">
            <button
              onClick={() => setCurrentPage(1)}
              disabled={currentPage === 1}
              className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
              title="First page"
            >
              <ChevronsLeft size={16} />
            </button>
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
              title="Previous page"
            >
              <ChevronLeft size={16} />
            </button>

            <div className="flex items-center gap-1 mx-2">
              {Array.from({ length: totalPages }, (_, i) => i + 1).map(
                (page) => (
                  <button
                    key={page}
                    onClick={() => setCurrentPage(page)}
                    className={cn(
                      "w-8 h-8 rounded-lg text-sm font-medium transition-colors",
                      currentPage === page
                        ? "bg-blue-600 text-white"
                        : "text-gray-600 hover:bg-gray-100"
                    )}
                  >
                    {page}
                  </button>
                )
              )}
            </div>

            <button
              onClick={() =>
                setCurrentPage((p) => Math.min(totalPages, p + 1))
              }
              disabled={currentPage === totalPages}
              className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
              title="Next page"
            >
              <ChevronRight size={16} />
            </button>
            <button
              onClick={() => setCurrentPage(totalPages)}
              disabled={currentPage === totalPages}
              className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
              title="Last page"
            >
              <ChevronsRight size={16} />
            </button>
          </div>
        </div>
      </Card>
    </div>
  );
}
