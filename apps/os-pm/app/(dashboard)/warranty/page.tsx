"use client"

import * as React from "react"
import {
  AlertCircle,
  AlertTriangle,
  Calendar,
  CheckCircle2,
  Clock,
  FileText,
  Filter,
  Loader2,
  Search,
  Shield,
  ShieldAlert,
  ShieldCheck,
  ShieldX,
  Wrench,
} from "lucide-react"
import { useWarranties } from "@/hooks/useWarranty"
import { Button } from "@kealee/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@kealee/ui/card"
import { Input } from "@kealee/ui/input"
import { cn } from "@/lib/utils"

type WarrantyStatus = "active" | "expiring" | "expired"
type ClaimStatus = "open" | "in-progress" | "resolved" | "denied"

interface WarrantyItem {
  id: string
  system: string
  contractor: string
  startDate: string
  endDate: string
  duration: string
  status: WarrantyStatus
  claimsCount: number
  project: string
}

interface WarrantyClaim {
  id: string
  warrantyId: string
  itemSystem: string
  issueDescription: string
  reportedDate: string
  status: ClaimStatus
  assignedTo: string
  priority: "low" | "medium" | "high"
}

const WARRANTY_STATUS_STYLES: Record<WarrantyStatus, string> = {
  active: "bg-green-100 text-green-800",
  expiring: "bg-yellow-100 text-yellow-800",
  expired: "bg-red-100 text-red-800",
}

const WARRANTY_STATUS_ICONS: Record<WarrantyStatus, React.ElementType> = {
  active: ShieldCheck,
  expiring: ShieldAlert,
  expired: ShieldX,
}

const CLAIM_STATUS_STYLES: Record<ClaimStatus, string> = {
  open: "bg-blue-100 text-blue-800",
  "in-progress": "bg-yellow-100 text-yellow-800",
  resolved: "bg-green-100 text-green-800",
  denied: "bg-red-100 text-red-800",
}

function formatDate(d: string) {
  return new Date(d + "T00:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
}

function formatShortDate(d: string) {
  return new Date(d + "T00:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric" })
}

export default function WarrantyPage() {
  const [search, setSearch] = React.useState("")
  const [statusFilter, setStatusFilter] = React.useState<string>("all")

  const { data, isLoading } = useWarranties({ status: statusFilter !== "all" ? statusFilter : undefined, search: search || undefined })
  const warranties = data?.items ?? []
  const claims = data?.claims ?? []

  if (isLoading) return (<div className="flex items-center justify-center h-64"><Loader2 className="h-8 w-8 animate-spin text-gray-400" /></div>)

  const filteredWarranties = warranties

  const stats = {
    active: warranties.filter((w) => w.status === "active").length,
    expiring: warranties.filter((w) => w.status === "expiring").length,
    openClaims: claims.filter((c) => c.status === "open" || c.status === "in-progress").length,
    resolvedClaims: claims.filter((c) => c.status === "resolved").length,
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Warranty Management</h1>
          <p className="text-gray-500 mt-1">Track warranties, expirations, and claims</p>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Active Warranties", value: stats.active, icon: ShieldCheck, color: "text-green-600 bg-green-50" },
          { label: "Expiring Soon", value: stats.expiring, icon: ShieldAlert, color: "text-yellow-600 bg-yellow-50" },
          { label: "Open Claims", value: stats.openClaims, icon: AlertCircle, color: "text-red-600 bg-red-50" },
          { label: "Resolved Claims", value: stats.resolvedClaims, icon: CheckCircle2, color: "text-blue-600 bg-blue-50" },
        ].map((s) => (
          <Card key={s.label}>
            <CardContent className="p-4 flex items-center gap-3">
              <div className={cn("p-2 rounded-lg", s.color)}><s.icon size={20} /></div>
              <div><p className="text-2xl font-bold">{s.value}</p><p className="text-xs text-gray-500">{s.label}</p></div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <CardTitle>Warranty Items</CardTitle>
            <div className="flex gap-2">
              {(["all", "active", "expiring", "expired"] as const).map((s) => (
                <button key={s} onClick={() => setStatusFilter(s)} className={cn("px-3 py-1.5 rounded-md text-sm font-medium transition-colors", statusFilter === s ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-700 hover:bg-gray-200")}>
                  {s === "all" ? "All" : s.charAt(0).toUpperCase() + s.slice(1)}
                </button>
              ))}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="mb-4">
            <div className="relative">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <Input placeholder="Search by system or contractor..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-gray-50">
                  <th className="text-left px-4 py-3 font-medium text-gray-600">System / Component</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Contractor</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Start</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">End</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Duration</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Status</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Claims</th>
                </tr>
              </thead>
              <tbody>
                {filteredWarranties.map((w) => {
                  const StatusIcon = WARRANTY_STATUS_ICONS[w.status]
                  return (
                    <tr key={w.id} className="border-b hover:bg-gray-50">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <Shield size={16} className="text-gray-400 shrink-0" />
                          <div>
                            <p className="font-medium text-gray-900">{w.system}</p>
                            <p className="text-xs text-gray-400">{w.project}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-gray-600">{w.contractor}</td>
                      <td className="px-4 py-3 text-gray-500">{formatShortDate(w.startDate)}</td>
                      <td className="px-4 py-3 text-gray-500">{formatShortDate(w.endDate)}</td>
                      <td className="px-4 py-3 text-gray-600">{w.duration}</td>
                      <td className="px-4 py-3">
                        <span className={cn("px-2 py-0.5 rounded-full text-xs font-medium inline-flex items-center gap-1", WARRANTY_STATUS_STYLES[w.status])}>
                          <StatusIcon size={12} />{w.status.charAt(0).toUpperCase() + w.status.slice(1)}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        {w.claimsCount > 0 ? (
                          <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-800">{w.claimsCount}</span>
                        ) : (
                          <span className="text-gray-400">---</span>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Wrench size={20} />Active Warranty Claims</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {claims.map((claim) => (
            <div key={claim.id} className={cn("border rounded-lg p-4", claim.priority === "high" && "border-red-200 bg-red-50/30")}>
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2 mb-2">
                <div className="flex items-center gap-3">
                  <span className="text-sm font-bold text-gray-700">{claim.id}</span>
                  <span className={cn("px-2 py-0.5 rounded-full text-xs font-medium", CLAIM_STATUS_STYLES[claim.status])}>
                    {claim.status === "in-progress" ? "In Progress" : claim.status.charAt(0).toUpperCase() + claim.status.slice(1)}
                  </span>
                  {claim.priority === "high" && (
                    <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800 flex items-center gap-1">
                      <AlertTriangle size={10} />High Priority
                    </span>
                  )}
                </div>
                <span className="text-xs text-gray-400 flex items-center gap-1">
                  <Calendar size={12} />Reported: {formatShortDate(claim.reportedDate)}
                </span>
              </div>
              <div className="mb-2">
                <p className="text-sm font-medium text-gray-800">{claim.itemSystem}</p>
                <p className="text-sm text-gray-600 mt-1">{claim.issueDescription}</p>
              </div>
              <div className="flex items-center justify-between text-xs text-gray-500 pt-2 border-t">
                <span>Assigned to: <span className="font-medium text-gray-700">{claim.assignedTo}</span></span>
                {claim.status !== "resolved" && claim.status !== "denied" && (
                  <Button variant="outline" size="sm" className="h-7 text-xs">Update Status</Button>
                )}
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  )
}
