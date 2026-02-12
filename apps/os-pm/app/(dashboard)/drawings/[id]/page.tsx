"use client"
import * as React from "react"
import { ArrowLeft, ChevronDown, Cloud, Download, MessageSquare, MousePointer2, MoveRight, Pencil, RectangleHorizontal, Share2, Type, ZoomIn, ZoomOut } from "lucide-react"
import { Button } from "@kealee/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@kealee/ui/card"
import { cn } from "@/lib/utils"
const mT=[{id:"arrow",l:"Arrow",ic:MoveRight},{id:"text",l:"Text",ic:Type},{id:"cloud",l:"Cloud",ic:Cloud},{id:"rect",l:"Rectangle",ic:RectangleHorizontal},{id:"free",l:"Freehand",ic:Pencil}]
const rfis=[{id:"RFI-042",t:"Column grid alignment",s:"Open"},{id:"RFI-038",t:"Window sill detail",s:"Answered"}]
const punch=[{id:"PI-015",t:"Drywall NE corner",s:"Open"},{id:"PI-012",t:"Floor transition",s:"Resolved"}]
const vers=["Rev 3","Rev 2","Rev 1"]
export default function DrawingViewerPage(){
  const[tool,setTool]=React.useState<string|null>(null)
  const[zoom,setZoom]=React.useState(100)
  const[vo,setVo]=React.useState(false)
  const[ver,setVer]=React.useState(vers[0])
  return(
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={()=>window.history.back()}><ArrowLeft className="h-4 w-4"/></Button>
        <div className="flex-1"><h1 className="text-xl font-bold">A-100 Floor Plan - Level 1</h1>
        <p className="text-sm text-muted-foreground">Architectural - {ver}</p></div>
        <Button variant="outline" size="sm"><Download className="mr-2 h-4 w-4"/>Download</Button>
        <Button variant="outline" size="sm"><Share2 className="mr-2 h-4 w-4"/>Share</Button>
      </div>
      <div className="grid gap-4 lg:grid-cols-[1fr_300px]">
        <div className="space-y-2">
          <div className="flex items-center gap-1 rounded-lg border bg-background p-1">
            <MousePointer2 className="h-4 w-4 mx-2 text-muted-foreground"/>
            {mT.map(t=>{const I=t.ic;return(<button key={t.id} onClick={()=>setTool(tool===t.id?null:t.id)} className={cn("flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-medium transition-colors",tool===t.id?"bg-primary text-primary-foreground":"text-muted-foreground hover:bg-muted")}><I className="h-3.5 w-3.5"/>{t.l}</button>)})}
            <div className="flex-1"/>
            <Button variant="ghost" size="icon" onClick={()=>setZoom(Math.max(25,zoom-25))}><ZoomOut className="h-3.5 w-3.5"/></Button>
            <span className="text-xs font-medium w-10 text-center">{zoom}%</span>
            <Button variant="ghost" size="icon" onClick={()=>setZoom(Math.min(400,zoom+25))}><ZoomIn className="h-3.5 w-3.5"/></Button>
          </div>
          <div className="flex items-center justify-center rounded-lg border-2 border-dashed bg-muted/30 min-h-[500px]">
            <div className="text-center text-muted-foreground">
              <div className="text-6xl font-light mb-3 opacity-20">Plan Viewer</div>
              <p className="text-sm">Drawing content renders here at {zoom}% zoom</p>
              {tool && <p className="text-xs mt-1 text-primary">Active tool: {tool}</p>}
            </div>
          </div>
        </div>
        <div className="space-y-4">
          <Card><CardHeader className="pb-2"><CardTitle className="text-sm">Version</CardTitle></CardHeader>
          <CardContent>
            <button onClick={()=>setVo(!vo)} className="flex w-full items-center justify-between rounded-md border px-3 py-2 text-sm"><span>{ver}</span><ChevronDown className="h-4 w-4 text-muted-foreground"/></button>
            {vo&&<div className="mt-1 w-full rounded-md border bg-background shadow-lg">{vers.map(v=><button key={v} onClick={()=>{setVer(v);setVo(false)}} className={cn("block w-full px-3 py-2 text-left text-sm hover:bg-muted",v===ver&&"bg-muted font-medium")}>{v}</button>)}</div>}
          </CardContent></Card>
          <Card><CardHeader className="pb-2"><CardTitle className="text-sm"><MessageSquare className="h-4 w-4 inline mr-1.5"/>Linked RFIs</CardTitle></CardHeader>
          <CardContent className="space-y-2">{rfis.map(r=><div key={r.id} className="flex items-center justify-between rounded-md border px-3 py-2 text-sm"><div><span className="font-medium">{r.id}</span><p className="text-xs text-muted-foreground">{r.t}</p></div><span className={cn("rounded-full px-2 py-0.5 text-xs font-medium",r.s==="Open"?"bg-yellow-50 text-yellow-700":"bg-green-50 text-green-700")}>{r.s}</span></div>)}</CardContent></Card>
          <Card><CardHeader className="pb-2"><CardTitle className="text-sm">Punch Items</CardTitle></CardHeader>
          <CardContent className="space-y-2">{punch.map(i=><div key={i.id} className="flex items-center justify-between rounded-md border px-3 py-2 text-sm"><div><span className="font-medium">{i.id}</span><p className="text-xs text-muted-foreground">{i.t}</p></div><span className={cn("rounded-full px-2 py-0.5 text-xs font-medium",i.s==="Open"?"bg-yellow-50 text-yellow-700":"bg-green-50 text-green-700")}>{i.s}</span></div>)}</CardContent></Card>
        </div>
      </div>
    </div>
  )
}
