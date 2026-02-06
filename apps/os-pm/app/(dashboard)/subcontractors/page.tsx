"use client"

import * as React from "react"
import {
  Users,
  Star,
  Shield,
  FileCheck,
  AlertTriangle,
  Search,
  Plus,
  Phone,
  Mail,
  Building2,
  MapPin,
  ExternalLink,
} from "lucide-react"

import { Button } from "@kealee/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@kealee/ui/card"
import { Input } from "@kealee/ui/input"
import { cn } from "@/lib/utils"

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

type ComplianceStatus = "valid" | "expiring" | "expired" | "missing" | "none"

type Subcontractor = {
  id: string
  company: string
  trades: string[]
  contactName: string
  phone: string
  email: string
  address: string
  rating: number
  license: ComplianceStatus
  insurance: ComplianceStatus
  bond: "active" | "none"
  activeProjects: number
}

/* ------------------------------------------------------------------ */
/*  Mock data                                                          */
/* ------------------------------------------------------------------ */

const TRADES = [
  "All",
  "Electrical",
  "Plumbing",
  "HVAC",
  "Concrete",
  "Framing",
  "Roofing",
  "Painting",
  "Flooring",
  "Drywall",
  "Landscaping",
] as const

const COMPLIANCE_OPTIONS = ["All", "Compliant", "Issues"] as const

const MOCK_SUBS: Subcontractor[] = [
  {
    id: "sub-01",
    company: "Rodriguez Electric LLC",
    trades: ["Electrical"],
    contactName: "Marco Rodriguez",
    phone: "(512) 555-0147",
    email: "marco@rodriguezelectric.com",
    address: "4821 Industrial Blvd, Austin, TX",
    rating: 5,
    license: "valid",
    insurance: "valid",
    bond: "active",
    activeProjects: 3,
  },
  {
    id: "sub-02",
    company: "Premier Plumbing Co",
    trades: ["Plumbing"],
    contactName: "Sarah Chen",
    phone: "(512) 555-0293",
    email: "sarah@premierplumbing.com",
    address: "1100 Commerce Dr, Austin, TX",
    rating: 4,
    license: "valid",
    insurance: "expiring",
    bond: "active",
    activeProjects: 2,
  },
  {
    id: "sub-03",
    company: "Summit HVAC Solutions",
    trades: ["HVAC"],
    contactName: "James Whitfield",
    phone: "(512) 555-0381",
    email: "james@summithvac.com",
    address: "780 Tech Park Ln, Round Rock, TX",
    rating: 5,
    license: "valid",
    insurance: "valid",
    bond: "active",
    activeProjects: 4,
  },
  {
    id: "sub-04",
    company: "Solid Ground Concrete",
    trades: ["Concrete"],
    contactName: "David Morales",
    phone: "(512) 555-0422",
    email: "david@solidgroundconcrete.com",
    address: "3300 Quarry Rd, Cedar Park, TX",
    rating: 4,
    license: "valid",
    insurance: "valid",
    bond: "active",
    activeProjects: 2,
  },
  {
    id: "sub-05",
    company: "Atlas Framing",
    trades: ["Framing"],
    contactName: "Kevin Nguyen",
    phone: "(512) 555-0558",
    email: "kevin@atlasframing.com",
    address: "6200 Construction Way, Pflugerville, TX",
    rating: 3,
    license: "expired",
    insurance: "valid",
    bond: "none",
    activeProjects: 1,
  },
  {
    id: "sub-06",
    company: "Top Coat Painting",
    trades: ["Painting"],
    contactName: "Lisa Park",
    phone: "(512) 555-0634",
    email: "lisa@topcoatpainting.com",
    address: "920 Artisan St, Austin, TX",
    rating: 4,
    license: "valid",
    insurance: "valid",
    bond: "none",
    activeProjects: 3,
  },
  {
    id: "sub-07",
    company: "Lone Star Roofing",
    trades: ["Roofing"],
    contactName: "Brian Hawkins",
    phone: "(512) 555-0719",
    email: "brian@lonestarroofing.com",
    address: "4455 Ridge Pkwy, Georgetown, TX",
    rating: 5,
    license: "valid",
    insurance: "expired",
    bond: "active",
    activeProjects: 2,
  },
  {
    id: "sub-08",
    company: "Precision Flooring Inc",
    trades: ["Flooring"],
    contactName: "Angela Torres",
    phone: "(512) 555-0847",
    email: "angela@precisionflooring.com",
    address: "2780 Finish Line Dr, Austin, TX",
    rating: 4,
    license: "valid",
    insurance: "valid",
    bond: "active",
    activeProjects: 1,
  },
  {
    id: "sub-09",
    company: "CleanLine Drywall",
    trades: ["Drywall"],
    contactName: "Tom Bradley",
    phone: "(512) 555-0963",
    email: "tom@cleanlinedrywall.com",
    address: "1540 Panel Ave, Round Rock, TX",
    rating: 3,
    license: "missing",
    insurance: "expired",
    bond: "none",
    activeProjects: 0,
  },
  {
    id: "sub-10",
    company: "GreenScape Landscaping",
    trades: ["Landscaping"],
    contactName: "Maria Alvarez",
    phone: "(512) 555-1082",
    email: "maria@greenscapetx.com",
    address: "870 Garden Loop, Austin, TX",
    rating: 4,
    license: "valid",
    insurance: "valid",
    bond: "none",
    activeProjects: 2,
  },
  {
    id: "sub-11",
    company: "AllTrade Mechanical",
    trades: ["Plumbing", "HVAC"],
    contactName: "Robert Kim",
    phone: "(512) 555-1155",
    email: "robert@alltrademech.com",
    address: "5500 Pipe Rd, Leander, TX",
    rating: 4,
    license: "valid",
    insurance: "expiring",
    bond: "active",
    activeProjects: 3,
  },
  {
    id: "sub-12",
    company: "Heritage Builders Group",
    trades: ["Framing", "Concrete"],
    contactName: "William Foster",
    phone: "(512) 555-1278",
    email: "william@heritagebuilders.com",
    address: "3100 Foundation Blvd, Austin, TX",
    rating: 5,
    license: "valid",
    insurance: "valid",
    bond: "active",
    activeProjects: 5,
  },
]

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

function hasComplianceIssue(sub: Subcontractor): boolean {
  return (
    sub.license === "expired" ||
    sub.license === "missing" ||
    sub.insurance === "expired" ||
    sub.insurance === "expiring"
  )
}

function complianceDotColor(status: ComplianceStatus): string {
  switch (status) {
    case "valid":
      return "bg-emerald-500"
    case "expiring":
      return "bg-amber-500"
    case "expired":
      return "bg-red-500"
    case "missing":
    case "none":
      return "bg-neutral-400"
  }
}

function complianceLabel(status: ComplianceStatus): string {
  switch (status) {
    case "valid":
      return "Valid"
    case "expiring":
      return "Expiring Soon"
    case "expired":
      return "Expired"
    case "missing":
      return "Missing"
    case "none":
      return "None"
  }
}

function renderStars(rating: number) {
  return (
    <span className="inline-flex items-center gap-0.5">
      {Array.from({ length: 5 }, (_, i) => (
        <Star
          key={i}
          className={cn(
            "h-3.5 w-3.5",
            i < rating ? "fill-amber-400 text-amber-400" : "fill-neutral-200 text-neutral-200"
          )}
        />
      ))}
    </span>
  )
}

/* ------------------------------------------------------------------ */
/*  Page                                                               */
/* ------------------------------------------------------------------ */

export default function SubcontractorsPage() {
  const [search, setSearch] = React.useState("")
  const [tradeFilter, setTradeFilter] = React.useState<string>("All")
  const [complianceFilter, setComplianceFilter] = React.useState<string>("All")

  /* Derived data */
  const subsWithIssues = React.useMemo(() => MOCK_SUBS.filter(hasComplianceIssue), [])

  const filtered = React.useMemo(() => {
    let list = MOCK_SUBS

    /* search */
    const q = search.trim().toLowerCase()
    if (q) {
      list = list.filter(
        (s) =>
          s.company.toLowerCase().includes(q) ||
          s.contactName.toLowerCase().includes(q) ||
          s.trades.some((t) => t.toLowerCase().includes(q))
      )
    }

    /* trade */
    if (tradeFilter !== "All") {
      list = list.filter((s) => s.trades.includes(tradeFilter))
    }

    /* compliance */
    if (complianceFilter === "Compliant") {
      list = list.filter((s) => !hasComplianceIssue(s))
    } else if (complianceFilter === "Issues") {
      list = list.filter(hasComplianceIssue)
    }

    return list
  }, [search, tradeFilter, complianceFilter])

  const totalActive = React.useMemo(
    () => MOCK_SUBS.filter((s) => s.activeProjects > 0).length,
    []
  )

  const avgRating = React.useMemo(() => {
    const sum = MOCK_SUBS.reduce((acc, s) => acc + s.rating, 0)
    return (sum / MOCK_SUBS.length).toFixed(1)
  }, [])

  /* ---------------------------------------------------------------- */
  /*  Render                                                           */
  /* ---------------------------------------------------------------- */

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold">Subcontractors &amp; Vendors</h1>
          <p className="text-neutral-600 mt-1">
            Directory, compliance tracking, contracts, and performance
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button size="sm" onClick={() => alert("Add subcontractor (placeholder)")}>
            <Plus className="h-4 w-4" />
            Add Subcontractor
          </Button>
        </div>
      </div>

      {/* Compliance alerts */}
      {subsWithIssues.length > 0 && (
        <Card className="border-amber-300 bg-amber-50/60 py-0">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2 text-amber-800">
              <AlertTriangle className="h-4 w-4" />
              Compliance Alerts ({subsWithIssues.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="pb-4">
            <div className="space-y-2">
              {subsWithIssues.map((sub) => {
                const issues: string[] = []
                if (sub.license === "expired") issues.push("License expired")
                if (sub.license === "missing") issues.push("License missing")
                if (sub.insurance === "expired") issues.push("Insurance expired")
                if (sub.insurance === "expiring") issues.push("Insurance expiring soon")
                return (
                  <div
                    key={sub.id}
                    className="flex items-center justify-between gap-3 rounded-lg border border-amber-200 bg-white px-3 py-2 text-sm"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <Building2 className="h-4 w-4 text-amber-600 shrink-0" />
                      <span className="font-medium text-neutral-900 truncate">
                        {sub.company}
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-1.5 shrink-0">
                      {issues.map((issue) => (
                        <span
                          key={issue}
                          className="inline-flex items-center rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-800"
                        >
                          {issue}
                        </span>
                      ))}
                    </div>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Stats row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="py-0">
          <CardContent className="py-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-100 text-blue-600">
                <Users className="h-5 w-5" />
              </div>
              <div>
                <div className="text-2xl font-bold text-neutral-900">{MOCK_SUBS.length}</div>
                <div className="text-xs font-medium text-neutral-600">Total Subs</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="py-0">
          <CardContent className="py-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-100 text-emerald-600">
                <FileCheck className="h-5 w-5" />
              </div>
              <div>
                <div className="text-2xl font-bold text-neutral-900">{totalActive}</div>
                <div className="text-xs font-medium text-neutral-600">Active on Projects</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="py-0">
          <CardContent className="py-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-100 text-amber-600">
                <AlertTriangle className="h-5 w-5" />
              </div>
              <div>
                <div className="text-2xl font-bold text-neutral-900">{subsWithIssues.length}</div>
                <div className="text-xs font-medium text-neutral-600">Compliance Issues</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="py-0">
          <CardContent className="py-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-100 text-purple-600">
                <Star className="h-5 w-5" />
              </div>
              <div>
                <div className="text-2xl font-bold text-neutral-900">{avgRating}</div>
                <div className="text-xs font-medium text-neutral-600">Avg Rating</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card className="py-0">
        <CardContent className="py-4 space-y-3">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400 h-4 w-4" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by company, contact, or trade..."
              className="pl-9"
            />
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            {/* Trade filter */}
            <div className="flex flex-wrap gap-1.5">
              {TRADES.map((trade) => (
                <Button
                  key={trade}
                  variant={tradeFilter === trade ? "default" : "outline"}
                  size="sm"
                  onClick={() => setTradeFilter(trade)}
                  className="text-xs"
                >
                  {trade}
                </Button>
              ))}
            </div>

            {/* Compliance status filter */}
            <div className="flex gap-1.5 sm:ml-auto shrink-0">
              {COMPLIANCE_OPTIONS.map((opt) => (
                <Button
                  key={opt}
                  variant={complianceFilter === opt ? "default" : "outline"}
                  size="sm"
                  onClick={() => setComplianceFilter(opt)}
                  className="text-xs"
                >
                  {opt === "Issues" && <Shield className="h-3 w-3" />}
                  {opt}
                </Button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Results count */}
      <div className="text-sm text-neutral-600">
        Showing {filtered.length} of {MOCK_SUBS.length} subcontractors
      </div>

      {/* Card grid */}
      {filtered.length === 0 ? (
        <Card className="py-0">
          <CardContent className="py-12 text-center">
            <Users className="mx-auto h-12 w-12 text-neutral-300 mb-3" />
            <div className="font-medium text-neutral-900">No subcontractors match</div>
            <div className="text-sm text-neutral-600 mt-1">Try adjusting your filters or search.</div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map((sub) => (
            <Card key={sub.id} className="py-0 hover:shadow-md transition-shadow">
              <CardContent className="py-4 space-y-3">
                {/* Company + trades */}
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="font-semibold text-neutral-900 leading-tight">
                      {sub.company}
                    </h3>
                    <span className="text-xs text-neutral-500 tabular-nums shrink-0">
                      {sub.activeProjects} project{sub.activeProjects !== 1 ? "s" : ""}
                    </span>
                  </div>
                  <div className="mt-1.5 flex flex-wrap gap-1.5">
                    {sub.trades.map((trade) => (
                      <span
                        key={trade}
                        className="inline-flex items-center rounded-full border bg-neutral-50 px-2.5 py-0.5 text-xs font-medium text-neutral-700"
                      >
                        {trade}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Contact */}
                <div className="space-y-1 text-sm text-neutral-700">
                  <div className="font-medium text-neutral-900">{sub.contactName}</div>
                  <div className="flex items-center gap-1.5">
                    <Phone className="h-3.5 w-3.5 text-neutral-400" />
                    <span>{sub.phone}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Mail className="h-3.5 w-3.5 text-neutral-400" />
                    <span className="truncate">{sub.email}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <MapPin className="h-3.5 w-3.5 text-neutral-400" />
                    <span className="truncate">{sub.address}</span>
                  </div>
                </div>

                {/* Rating */}
                <div className="flex items-center gap-2">
                  {renderStars(sub.rating)}
                  <span className="text-xs text-neutral-500">{sub.rating}.0</span>
                </div>

                {/* Compliance */}
                <div className="rounded-lg border bg-neutral-50 p-2.5 space-y-1.5 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-neutral-600">License</span>
                    <span className="flex items-center gap-1.5">
                      <span className={cn("h-2 w-2 rounded-full", complianceDotColor(sub.license))} />
                      <span className="font-medium text-neutral-800">
                        {complianceLabel(sub.license)}
                      </span>
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-neutral-600">Insurance</span>
                    <span className="flex items-center gap-1.5">
                      <span className={cn("h-2 w-2 rounded-full", complianceDotColor(sub.insurance))} />
                      <span className="font-medium text-neutral-800">
                        {complianceLabel(sub.insurance)}
                      </span>
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-neutral-600">Bond</span>
                    <span className="flex items-center gap-1.5">
                      <span
                        className={cn(
                          "h-2 w-2 rounded-full",
                          sub.bond === "active" ? "bg-emerald-500" : "bg-neutral-400"
                        )}
                      />
                      <span className="font-medium text-neutral-800">
                        {sub.bond === "active" ? "Active" : "None"}
                      </span>
                    </span>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-2 pt-1">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1 text-xs"
                    onClick={() => alert(`View profile: ${sub.company} (placeholder)`)}
                  >
                    <ExternalLink className="h-3.5 w-3.5" />
                    View Profile
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-xs"
                    onClick={() => alert(`Send invite to ${sub.email} (placeholder)`)}
                  >
                    <Mail className="h-3.5 w-3.5" />
                    Invite
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-xs"
                    onClick={() => {
                      window.location.href = `tel:${sub.phone}`
                    }}
                  >
                    <Phone className="h-3.5 w-3.5" />
                    Call
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
