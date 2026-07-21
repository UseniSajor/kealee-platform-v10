"use client"
import * as React from "react"
import { useParams } from "next/navigation"
import { ArrowLeft, Award, Check, Loader2, MessageSquare, Send, X } from "lucide-react"
import { Button } from "@kealee/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@kealee/ui/card"
import { cn } from "@pm/lib/utils"
import { api } from "@pm/lib/api/index"

interface Bid {
  contractor: string
  baseBid: number
  alternates: number
  total: number
  status: string
}

interface InvitedContractor {
  name: string
  responded: boolean
}

const sc: Record<string, string> = {
  Submitted: "bg-gray-100 text-gray-700",
  "Under Review": "bg-blue-50 text-blue-700",
  Awarded: "bg-green-50 text-green-700",
  Rejected: "bg-red-50 text-red-700",
  SUBMITTED: "bg-gray-100 text-gray-700",
  REVIEW: "bg-blue-50 text-blue-700",
  AWARDED: "bg-green-50 text-green-700",
  REJECTED: "bg-red-50 text-red-700",
}

function fmt(v: number) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", minimumFractionDigits: 0 }).format(v)
}

export default function BidDetailPage() {
  const params = useParams()
  const id = params?.id as string

  const [loading, setLoading] = React.useState(true)
  const [pkg, setPkg] = React.useState<any>(null)
  const [bids, setBids] = React.useState<Bid[]>([])
  const [invited, setInvited] = React.useState<InvitedContractor[]>([])

  React.useEffect(() => {
    if (!id) return
    loadBidDetail()
  }, [id])

  async function loadBidDetail() {
    setLoading(true)
    try {
      // Load bid package details
      const res = await api.bids.get(id)
      const data = res as any
      const bidPkg = data?.bidPackage || data?.bid || data?.data || data || {}
      setPkg(bidPkg)

      // Load bid comparison / submissions
      try {
        const compRes = await api.bids.comparison(id)
        const compData = compRes as any
        const submissions = compData?.submissions || compData?.bids || compData?.comparison || compData?.data || []
        const mapped: Bid[] = submissions.map((s: any) => ({
          contractor: s.contractorName || s.contractor || s.companyName || "",
          baseBid: s.baseBid || s.baseAmount || 0,
          alternates: s.alternates || s.alternateAmount || 0,
          total: s.total || s.totalAmount || (s.baseBid || 0) + (s.alternates || 0),
          status: s.status || "Submitted",
        }))
        setBids(mapped)
      } catch {
        // Comparison endpoint may not exist; try to extract bids from the package
        const subs = bidPkg?.submissions || bidPkg?.bids || bidPkg?.responses || []
        const mapped: Bid[] = subs.map((s: any) => ({
          contractor: s.contractorName || s.contractor || s.companyName || "",
          baseBid: s.baseBid || s.baseAmount || 0,
          alternates: s.alternates || s.alternateAmount || 0,
          total: s.total || s.totalAmount || (s.baseBid || 0) + (s.alternates || 0),
          status: s.status || "Submitted",
        }))
        setBids(mapped)
      }

      // Extract invited contractors
      const invitedList = bidPkg?.invitations || bidPkg?.invitedContractors || bidPkg?.invited || []
      const mappedInvited: InvitedContractor[] = invitedList.map((c: any) => ({
        name: c.name || c.contractorName || c.companyName || "",
        responded: c.responded ?? c.hasResponded ?? (c.status === "responded" || c.status === "submitted"),
      }))
      setInvited(mappedInvited)
    } catch (err) {
      console.error("Failed to load bid detail:", err)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        <span className="ml-3 text-muted-foreground">Loading bid package...</span>
      </div>
    )
  }

  if (!pkg) {
    return (
      <div className="text-center py-20 text-muted-foreground">
        <p className="text-lg font-medium">Bid package not found</p>
        <Button variant="ghost" className="mt-4" onClick={() => window.history.back()}>
          <ArrowLeft className="mr-2 h-4 w-4" /> Go Back
        </Button>
      </div>
    )
  }

  const pkgName = pkg.name || pkg.title || "Bid Package"
  const pkgTrade = pkg.trade || pkg.category || ""
  const pkgDueDate = pkg.dueDate ? new Date(pkg.dueDate).toISOString().split("T")[0] : ""
  const pkgDescription = pkg.description || pkg.scopeOfWork || ""

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => window.history.back()}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="flex-1">
          <h1 className="text-xl font-bold">{pkgName}</h1>
          <p className="text-sm text-muted-foreground">
            {pkgTrade}{pkgTrade && pkgDueDate ? " · " : ""}
            {pkgDueDate && `Due ${pkgDueDate}`}
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm">
            <MessageSquare className="mr-2 h-4 w-4" />
            Request Clarification
          </Button>
          <Button variant="outline" size="sm" className="text-red-600">
            <X className="mr-2 h-4 w-4" />
            Reject
          </Button>
          <Button size="sm">
            <Award className="mr-2 h-4 w-4" />
            Award
          </Button>
        </div>
      </div>

      {pkgDescription && (
        <Card>
          <CardHeader>
            <CardTitle>Scope of Work</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground leading-relaxed">{pkgDescription}</p>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Bid Comparison</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="px-4 py-3 text-left font-medium">Contractor</th>
                  <th className="px-4 py-3 text-right font-medium">Base Bid</th>
                  <th className="px-4 py-3 text-right font-medium">Alternates</th>
                  <th className="px-4 py-3 text-right font-medium">Total</th>
                  <th className="px-4 py-3 text-left font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                {bids
                  .sort((a, b) => a.total - b.total)
                  .map((bid, i) => (
                    <tr key={bid.contractor + i} className={cn("border-b last:border-0", i === 0 && "bg-green-50/50")}>
                      <td className="px-4 py-3 font-medium">
                        {bid.contractor}
                        {i === 0 && <span className="ml-2 text-xs text-green-700">Low Bid</span>}
                      </td>
                      <td className="px-4 py-3 text-right">{fmt(bid.baseBid)}</td>
                      <td className="px-4 py-3 text-right">{fmt(bid.alternates)}</td>
                      <td className="px-4 py-3 text-right font-semibold">{fmt(bid.total)}</td>
                      <td className="px-4 py-3">
                        <span className={cn("rounded-full px-2.5 py-0.5 text-xs font-medium", sc[bid.status] || "bg-gray-100 text-gray-700")}>
                          {bid.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                {bids.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-4 py-10 text-center text-muted-foreground">
                      No bids received yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {invited.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Invited Contractors</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-2 sm:grid-cols-2">
              {invited.map((c) => (
                <div key={c.name} className="flex items-center justify-between rounded-md border px-3 py-2 text-sm">
                  <span>{c.name}</span>
                  {c.responded ? (
                    <span className="flex items-center gap-1 text-xs text-green-600">
                      <Check className="h-3 w-3" />
                      Responded
                    </span>
                  ) : (
                    <span className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Send className="h-3 w-3" />
                      Pending
                    </span>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
