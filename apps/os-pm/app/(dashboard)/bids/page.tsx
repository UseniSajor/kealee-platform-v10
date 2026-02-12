"use client"
import * as React from "react"
import { Plus, Search, Package, DollarSign, Award } from "lucide-react"
import { Button } from "@kealee/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@kealee/ui/card"
import { Input } from "@kealee/ui/input"
import { cn } from "@/lib/utils"
type BidStatus = "Draft" | "Sent" | "Receiving" | "Evaluation" | "Awarded"
interface BidPackage { id:string; name:string; trade:string; status:BidStatus; bidsReceived:number; lowBid:number|null; dueDate:string }
const mockBids: BidPackage[] = [
  {id:"1",name:"BP-001 Foundation Concrete",trade:"Concrete",status:"Awarded",bidsReceived:5,lowBid:245000,dueDate:"2026-01-15"},
  {id:"2",name:"BP-002 Structural Steel",trade:"Steel",status:"Evaluation",bidsReceived:4,lowBid:389000,dueDate:"2026-01-25"},
  {id:"3",name:"BP-003 Electrical Rough-In",trade:"Electrical",status:"Receiving",bidsReceived:3,lowBid:178000,dueDate:"2026-02-15"},
  {id:"4",name:"BP-004 Plumbing",trade:"Plumbing",status:"Receiving",bidsReceived:2,lowBid:156000,dueDate:"2026-02-18"},
  {id:"5",name:"BP-005 HVAC Systems",trade:"HVAC",status:"Sent",bidsReceived:0,lowBid:null,dueDate:"2026-02-28"},
  {id:"6",name:"BP-006 Drywall & Framing",trade:"Drywall",status:"Draft",bidsReceived:0,lowBid:null,dueDate:"2026-03-10"},
  {id:"7",name:"BP-007 Painting",trade:"Painting",status:"Draft",bidsReceived:0,lowBid:null,dueDate:"2026-03-20"},
  {id:"8",name:"BP-008 Finish Electrical",trade:"Electrical",status:"Sent",bidsReceived:1,lowBid:92000,dueDate:"2026-02-22"},
]
const statusColor:Record<BidStatus,string>={Draft:"bg-gray-100 text-gray-700",Sent:"bg-blue-50 text-blue-700",Receiving:"bg-yellow-50 text-yellow-700",Evaluation:"bg-purple-50 text-purple-700",Awarded:"bg-green-50 text-green-700"}
function fmt(v:number){return new Intl.NumberFormat("en-US",{style:"currency",currency:"USD",minimumFractionDigits:0}).format(v)}
export default function BidsPage(){
  const[q,setQ]=React.useState("")
  const filtered=mockBids.filter(b=>!q||b.name.toLowerCase().includes(q.toLowerCase())||b.trade.toLowerCase().includes(q.toLowerCase()))
  const activeCount=mockBids.filter(b=>b.status!=="Draft"&&b.status!=="Awarded").length
  const totalBids=mockBids.reduce((s,b)=>s+b.bidsReceived,0)
  const pendingAward=mockBids.filter(b=>b.status==="Evaluation").length
  return(
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div><h1 className="text-2xl font-bold tracking-tight">Bid Management</h1>
        <p className="text-muted-foreground">Manage bid packages and contractor proposals</p></div>
        <Button><Plus className="mr-2 h-4 w-4"/>Create Bid Package</Button>
      </div>
      <div className="grid gap-4 md:grid-cols-3">
        <Card><CardContent className="pt-4 pb-4 flex items-center gap-3"><div className="rounded-full bg-blue-50 p-2"><Package className="h-5 w-5 text-blue-600"/></div><div><div className="text-2xl font-bold">{activeCount}</div><div className="text-sm text-muted-foreground">Active Packages</div></div></CardContent></Card>
        <Card><CardContent className="pt-4 pb-4 flex items-center gap-3"><div className="rounded-full bg-green-50 p-2"><DollarSign className="h-5 w-5 text-green-600"/></div><div><div className="text-2xl font-bold">{totalBids}</div><div className="text-sm text-muted-foreground">Bids Received</div></div></CardContent></Card>
        <Card><CardContent className="pt-4 pb-4 flex items-center gap-3"><div className="rounded-full bg-purple-50 p-2"><Award className="h-5 w-5 text-purple-600"/></div><div><div className="text-2xl font-bold">{pendingAward}</div><div className="text-sm text-muted-foreground">Pending Award</div></div></CardContent></Card>
      </div>
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"/>
        <Input placeholder="Search packages or trades..." value={q} onChange={(e)=>setQ(e.target.value)} className="pl-9"/>
      </div>
      <Card><CardContent className="p-0"><div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead><tr className="border-b bg-muted/50">
            <th className="px-4 py-3 text-left font-medium">Package Name</th>
            <th className="px-4 py-3 text-left font-medium">Trade</th>
            <th className="px-4 py-3 text-left font-medium">Status</th>
            <th className="px-4 py-3 text-center font-medium"># Bids</th>
            <th className="px-4 py-3 text-right font-medium">Low Bid</th>
            <th className="px-4 py-3 text-left font-medium">Due Date</th>
          </tr></thead>
          <tbody>{filtered.map(bp=><tr key={bp.id} className="border-b last:border-0 hover:bg-muted/30">
            <td className="px-4 py-3 font-medium">{bp.name}</td>
            <td className="px-4 py-3 text-muted-foreground">{bp.trade}</td>
            <td className="px-4 py-3"><span className={cn("rounded-full px-2.5 py-0.5 text-xs font-medium",statusColor[bp.status])}>{bp.status}</span></td>
            <td className="px-4 py-3 text-center">{bp.bidsReceived}</td>
            <td className="px-4 py-3 text-right font-medium">{bp.lowBid?fmt(bp.lowBid):"\u2014"}</td>
            <td className="px-4 py-3 text-muted-foreground">{bp.dueDate}</td>
          </tr>)}</tbody>
        </table>
      </div></CardContent></Card>
    </div>
  )
}
