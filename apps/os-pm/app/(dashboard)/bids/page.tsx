"use client"
import * as React from "react"
import Link from "next/link"
import { Plus, Search, Package, DollarSign, Award, Loader2 } from "lucide-react"
import { Button } from "@kealee/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@kealee/ui/card"
import { Input } from "@kealee/ui/input"
import { cn } from "@/lib/utils"
import { api } from "@/lib/api/index"

type BidStatus = "Draft" | "Sent" | "Receiving" | "Evaluation" | "Awarded" | "Closed"

interface BidPackage {
  id: string
  name: string
  trade: string
  status: BidStatus
  bidsReceived: number
  lowBid: number | null
  dueDate: string
}

const statusColor: Record<string, string> = {
  Draft: "bg-gray-100 text-gray-700",
  Sent: "bg-blue-50 text-blue-700",
  Receiving: "bg-yellow-50 text-yellow-700",
  Evaluation: "bg-purple-50 text-purple-700",
  Awarded: "bg-green-50 text-green-700",
  Closed: "bg-gray-100 text-gray-600",
  DRAFT: "bg-gray-100 text-gray-700",
  OPEN: "bg-blue-50 text-blue-700",
  CLOSED: "bg-gray-100 text-gray-600",
  AWARDED: "bg-green-50 text-green-700",
}

function fmt(v: number) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", minimumFractionDigits: 0 }).format(v)
}

export default function BidsPage() {
  const [q, setQ] = React.useState("")
  const [bids, setBids] = React.useState<BidPackage[]>([])
  const [loading, setLoading] = React.useState(true)

  React.useEffect(() => {
    loadBids()
  }, [])

  async function loadBids() {
    setLoading(true)
    try {
      const res = await api.bids.list()
      const data = res as any
      const items = data?.bids || data?.data?.bids || data?.bidPackages || data?.items || []
      const mapped: BidPackage[] = items.map((b: any) => ({
        id: b.id,
        name: b.name || b.title || "",
        trade: b.trade || b.category || "",
        status: b.status || "Draft",
        bidsReceived: b.bidsReceived || b.submissionCount || b.responses?.length || 0,
        lowBid: b.lowBid || b.lowestBid || null,
        dueDate: b.dueDate ? new Date(b.dueDate).toISOString().split("T")[0] : "",
      }))
      setBids(mapped)
    } catch (err) {
      console.error("Failed to load bids:", err)
    } finally {
      setLoading(false)
    }
  }

  const filtered = bids.filter(
    (b) => !q || b.name.toLowerCase().includes(q.toLowerCase()) || b.trade.toLowerCase().includes(q.toLowerCase())
  )
  const activeCount = bids.filter((b) => b.status !== "Draft" && b.status !== "Awarded" && b.status !== "Closed").length
  const totalBidsReceived = bids.reduce((s, b) => s + b.bidsReceived, 0)
  const pendingAward = bids.filter((b) => b.status === "Evaluation").length

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Bid Management</h1>
          <p className="text-muted-foreground">Manage bid packages and contractor proposals</p>
        </div>
        <Button asChild>
          <Link href="/bids/new"><Plus className="mr-2 h-4 w-4" />Create Bid Package</Link>
        </Button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          <span className="ml-3 text-muted-foreground">Loading bid packages...</span>
        </div>
      ) : (
        <>
          <div className="grid gap-4 md:grid-cols-3">
            <Card>
              <CardContent className="pt-4 pb-4 flex items-center gap-3">
                <div className="rounded-full bg-blue-50 p-2"><Package className="h-5 w-5 text-blue-600" /></div>
                <div><div className="text-2xl font-bold">{activeCount}</div><div className="text-sm text-muted-foreground">Active Packages</div></div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4 pb-4 flex items-center gap-3">
                <div className="rounded-full bg-green-50 p-2"><DollarSign className="h-5 w-5 text-green-600" /></div>
                <div><div className="text-2xl font-bold">{totalBidsReceived}</div><div className="text-sm text-muted-foreground">Bids Received</div></div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4 pb-4 flex items-center gap-3">
                <div className="rounded-full bg-purple-50 p-2"><Award className="h-5 w-5 text-purple-600" /></div>
                <div><div className="text-2xl font-bold">{pendingAward}</div><div className="text-sm text-muted-foreground">Pending Award</div></div>
              </CardContent>
            </Card>
          </div>

          <div className="relative max-w-sm">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input placeholder="Search packages or trades..." value={q} onChange={(e) => setQ(e.target.value)} className="pl-9" />
          </div>

          <Card>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b bg-muted/50">
                      <th className="px-4 py-3 text-left font-medium">Package Name</th>
                      <th className="px-4 py-3 text-left font-medium">Trade</th>
                      <th className="px-4 py-3 text-left font-medium">Status</th>
                      <th className="px-4 py-3 text-center font-medium"># Bids</th>
                      <th className="px-4 py-3 text-right font-medium">Low Bid</th>
                      <th className="px-4 py-3 text-left font-medium">Due Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map((bp) => (
                      <tr key={bp.id} className="border-b last:border-0 hover:bg-muted/30">
                        <td className="px-4 py-3 font-medium">{bp.name}</td>
                        <td className="px-4 py-3 text-muted-foreground">{bp.trade}</td>
                        <td className="px-4 py-3">
                          <span className={cn("rounded-full px-2.5 py-0.5 text-xs font-medium", statusColor[bp.status] || "bg-gray-100 text-gray-700")}>
                            {bp.status}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-center">{bp.bidsReceived}</td>
                        <td className="px-4 py-3 text-right font-medium">{bp.lowBid ? fmt(bp.lowBid) : "\u2014"}</td>
                        <td className="px-4 py-3 text-muted-foreground">{bp.dueDate}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

          {filtered.length === 0 && (
            <div className="text-center py-12 text-muted-foreground">
              <Package className="mx-auto h-12 w-12 mb-3 opacity-40" />
              <p className="text-lg font-medium">No bid packages found</p>
              <p className="text-sm">{q ? "Try adjusting your search." : "Create your first bid package to get started."}</p>
            </div>
          )}
        </>
      )}
    </div>
  )
}
