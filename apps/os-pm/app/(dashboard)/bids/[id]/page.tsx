"use client"
import * as React from "react"
import { ArrowLeft, Award, Check, MessageSquare, Send, X } from "lucide-react"
import { Button } from "@kealee/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@kealee/ui/card"
import { cn } from "@/lib/utils"
interface Bid{contractor:string;baseBid:number;alternates:number;total:number;status:"Submitted"|"Under Review"|"Awarded"|"Rejected"}
const pkg={name:"BP-002 Structural Steel",trade:"Steel",status:"Evaluation",dueDate:"2026-01-25",preBidDate:"2026-01-10",description:"Furnish and install all structural steel framing including columns, beams, joists, decking, and miscellaneous metals per structural drawings S-200 through S-350. Includes shop drawings, fabrication, delivery, and erection."}
const bids:Bid[]=[
  {contractor:"Ironworks Steel Co.",baseBid:389000,alternates:12000,total:401000,status:"Under Review"},
  {contractor:"Metro Structural Inc.",baseBid:412000,alternates:8500,total:420500,status:"Under Review"},
  {contractor:"Pacific Steel Erectors",baseBid:395000,alternates:15000,total:410000,status:"Under Review"},
  {contractor:"Summit Fabricators",baseBid:445000,alternates:0,total:445000,status:"Submitted"},
]
const invited=[{name:"Ironworks Steel Co.",responded:true},{name:"Metro Structural Inc.",responded:true},{name:"Pacific Steel Erectors",responded:true},{name:"Summit Fabricators",responded:true},{name:"National Steel Works",responded:false},{name:"Elite Iron LLC",responded:false}]
const sc:Record<string,string>={Submitted:"bg-gray-100 text-gray-700","Under Review":"bg-blue-50 text-blue-700",Awarded:"bg-green-50 text-green-700",Rejected:"bg-red-50 text-red-700"}
function fmt(v:number){return new Intl.NumberFormat("en-US",{style:"currency",currency:"USD",minimumFractionDigits:0}).format(v)}
export default function BidDetailPage(){return(
  <div className="space-y-6">
    <div className="flex items-center gap-3">
      <Button variant="ghost" size="icon" onClick={()=>window.history.back()}><ArrowLeft className="h-4 w-4"/></Button>
      <div className="flex-1"><h1 className="text-xl font-bold">{pkg.name}</h1><p className="text-sm text-muted-foreground">{pkg.trade} · Due {pkg.dueDate}</p></div>
      <div className="flex gap-2">
        <Button variant="outline" size="sm"><MessageSquare className="mr-2 h-4 w-4"/>Request Clarification</Button>
        <Button variant="outline" size="sm" className="text-red-600"><X className="mr-2 h-4 w-4"/>Reject</Button>
        <Button size="sm"><Award className="mr-2 h-4 w-4"/>Award</Button>
      </div>
    </div>
    <Card><CardHeader><CardTitle>Scope of Work</CardTitle></CardHeader><CardContent><p className="text-sm text-muted-foreground leading-relaxed">{pkg.description}</p></CardContent></Card>
    <Card><CardHeader><CardTitle>Bid Comparison</CardTitle></CardHeader><CardContent className="p-0"><div className="overflow-x-auto">
      <table className="w-full text-sm"><thead><tr className="border-b bg-muted/50"><th className="px-4 py-3 text-left font-medium">Contractor</th><th className="px-4 py-3 text-right font-medium">Base Bid</th><th className="px-4 py-3 text-right font-medium">Alternates</th><th className="px-4 py-3 text-right font-medium">Total</th><th className="px-4 py-3 text-left font-medium">Status</th></tr></thead>
      <tbody>{bids.sort((a,b)=>a.total-b.total).map((bid,i)=><tr key={bid.contractor} className={cn("border-b last:border-0",i===0&&"bg-green-50/50")}>
        <td className="px-4 py-3 font-medium">{bid.contractor}{i===0&&<span className="ml-2 text-xs text-green-700">Low Bid</span>}</td>
        <td className="px-4 py-3 text-right">{fmt(bid.baseBid)}</td><td className="px-4 py-3 text-right">{fmt(bid.alternates)}</td><td className="px-4 py-3 text-right font-semibold">{fmt(bid.total)}</td>
        <td className="px-4 py-3"><span className={cn("rounded-full px-2.5 py-0.5 text-xs font-medium",sc[bid.status])}>{bid.status}</span></td>
      </tr>)}</tbody></table></div></CardContent></Card>
    <Card><CardHeader><CardTitle>Invited Contractors</CardTitle></CardHeader><CardContent><div className="grid gap-2 sm:grid-cols-2">
      {invited.map(c=><div key={c.name} className="flex items-center justify-between rounded-md border px-3 py-2 text-sm"><span>{c.name}</span>
        {c.responded?<span className="flex items-center gap-1 text-xs text-green-600"><Check className="h-3 w-3"/>Responded</span>:<span className="flex items-center gap-1 text-xs text-muted-foreground"><Send className="h-3 w-3"/>Pending</span>}
      </div>)}</div></CardContent></Card>
  </div>
)}
