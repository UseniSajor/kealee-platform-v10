"use client"
import * as React from "react"
import { Plus, Search, FileText, DollarSign, Clock, AlertCircle, Loader2 } from "lucide-react"
import { Button } from "@kealee/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@kealee/ui/card"
import { Input } from "@kealee/ui/input"
import { cn } from "@pm/lib/utils"
import { useChangeOrders } from "@pm/hooks/useChangeOrders"

type COStatus="Draft"|"Submitted"|"Under Review"|"Approved"|"Rejected"

const statusColor:Record<COStatus,string>={Draft:"bg-gray-100 text-gray-700",Submitted:"bg-blue-50 text-blue-700","Under Review":"bg-yellow-50 text-yellow-700",Approved:"bg-green-50 text-green-700",Rejected:"bg-red-50 text-red-700"}
function fmt(v:number){return new Intl.NumberFormat("en-US",{style:"currency",currency:"USD",minimumFractionDigits:0,signDisplay:"auto"}).format(v)}

export default function ChangeOrdersPage(){
  const[q,setQ]=React.useState("")

  const { data, isLoading } = useChangeOrders({
    search: q || undefined,
  })
  const items = data?.items ?? []

  const totalCOs=items.length
  const pending=items.filter((c: any)=>c.status==="Submitted"||c.status==="Under Review").length
  const netChange=items.filter((c: any)=>c.status==="Approved").reduce((s: number,c: any)=>s+c.amount,0)

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
      </div>
    )
  }

  return(
    <div className="space-y-6">
      <div className="flex items-center justify-between"><div><h1 className="text-2xl font-bold tracking-tight">Change Order Log</h1><p className="text-muted-foreground">Track and manage project change orders</p></div><Button><Plus className="mr-2 h-4 w-4"/>Create Change Order</Button></div>
      <div className="grid gap-4 md:grid-cols-3">
        <Card><CardContent className="pt-4 pb-4 flex items-center gap-3"><div className="rounded-full bg-blue-50 p-2"><FileText className="h-5 w-5 text-blue-600"/></div><div><div className="text-2xl font-bold">{totalCOs}</div><div className="text-sm text-muted-foreground">Total COs</div></div></CardContent></Card>
        <Card><CardContent className="pt-4 pb-4 flex items-center gap-3"><div className="rounded-full bg-yellow-50 p-2"><Clock className="h-5 w-5 text-yellow-600"/></div><div><div className="text-2xl font-bold">{pending}</div><div className="text-sm text-muted-foreground">Pending Review</div></div></CardContent></Card>
        <Card><CardContent className="pt-4 pb-4 flex items-center gap-3"><div className="rounded-full bg-green-50 p-2"><DollarSign className="h-5 w-5 text-green-600"/></div><div><div className="text-2xl font-bold">{fmt(netChange)}</div><div className="text-sm text-muted-foreground">Net Change (Approved)</div></div></CardContent></Card>
      </div>
      <div className="relative max-w-sm"><Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"/><Input placeholder="Search change orders..." value={q} onChange={e=>setQ(e.target.value)} className="pl-9"/></div>
      <Card><CardContent className="p-0"><div className="overflow-x-auto"><table className="w-full text-sm">
        <thead><tr className="border-b bg-muted/50"><th className="px-4 py-3 text-left font-medium">CO #</th><th className="px-4 py-3 text-left font-medium">Title</th><th className="px-4 py-3 text-right font-medium">Amount</th><th className="px-4 py-3 text-left font-medium">Status</th><th className="px-4 py-3 text-left font-medium">Requested By</th><th className="px-4 py-3 text-left font-medium">Date</th></tr></thead>
        <tbody>{items.map((co: any)=><tr key={co.id} className="border-b last:border-0 hover:bg-muted/30">
          <td className="px-4 py-3 font-medium">{co.number}</td><td className="px-4 py-3">{co.title}</td>
          <td className={cn("px-4 py-3 text-right font-medium",co.amount<0?"text-red-600":"text-foreground")}>{fmt(co.amount)}</td>
          <td className="px-4 py-3"><span className={cn("rounded-full px-2.5 py-0.5 text-xs font-medium",statusColor[co.status as COStatus])}>{co.status}</span></td>
          <td className="px-4 py-3 text-muted-foreground">{co.requestedBy}</td><td className="px-4 py-3 text-muted-foreground">{co.date}</td>
        </tr>)}</tbody></table></div></CardContent></Card>
    </div>
  )
}

