"use client"
import * as React from "react"
import { useParams } from "next/navigation"
import {
  ArrowLeft,
  ChevronDown,
  Cloud,
  Download,
  Loader2,
  MessageSquare,
  MousePointer2,
  MoveRight,
  Pencil,
  RectangleHorizontal,
  Share2,
  Type,
  ZoomIn,
  ZoomOut,
} from "lucide-react"
import { Button } from "@kealee/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@kealee/ui/card"
import { cn } from "@pm/lib/utils"
import { api } from "@pm/lib/api/index"

const markupTools = [
  { id: "arrow", l: "Arrow", ic: MoveRight },
  { id: "text", l: "Text", ic: Type },
  { id: "cloud", l: "Cloud", ic: Cloud },
  { id: "rect", l: "Rectangle", ic: RectangleHorizontal },
  { id: "free", l: "Freehand", ic: Pencil },
]

interface RFIItem {
  id: string
  title: string
  status: string
}

interface PunchItem {
  id: string
  title: string
  status: string
}

interface Revision {
  id: string
  label: string
}

export default function DrawingViewerPage() {
  const params = useParams()
  const id = params?.id as string

  const [loading, setLoading] = React.useState(true)
  const [drawing, setDrawing] = React.useState<any>(null)
  const [revisions, setRevisions] = React.useState<Revision[]>([])
  const [rfis, setRfis] = React.useState<RFIItem[]>([])
  const [punchItems, setPunchItems] = React.useState<PunchItem[]>([])

  const [tool, setTool] = React.useState<string | null>(null)
  const [zoom, setZoom] = React.useState(100)
  const [vo, setVo] = React.useState(false)
  const [currentRev, setCurrentRev] = React.useState("")

  React.useEffect(() => {
    if (!id) return
    loadDrawing()
  }, [id])

  async function loadDrawing() {
    setLoading(true)
    try {
      const res = await api.drawings.get(id)
      const data = res as any
      const d = data?.drawing || data?.data || data || {}
      setDrawing(d)

      // Load revisions
      try {
        const revRes = await api.drawings.revisions(id)
        const revData = revRes as any
        const revList = revData?.revisions || revData?.data || revData || []
        const mapped: Revision[] = revList.map((r: any, i: number) => ({
          id: r.id || String(i),
          label: r.label || r.name || r.revisionNumber || `Rev ${revList.length - i}`,
        }))
        setRevisions(mapped)
        if (mapped.length > 0) setCurrentRev(mapped[0].label)
      } catch {
        // Revisions may not exist
        const rev = d.currentRevision || d.revision || d.version || "Rev 1"
        setRevisions([{ id: "1", label: rev }])
        setCurrentRev(rev)
      }

      // Extract linked RFIs if available
      const linkedRfis = d.rfis || d.linkedRfis || []
      setRfis(
        linkedRfis.map((r: any) => ({
          id: r.id || r.rfiNumber || "",
          title: r.title || r.subject || r.question || "",
          status: r.status || "Open",
        }))
      )

      // Extract linked punch items if available
      const linkedPunch = d.punchItems || d.linkedPunchItems || []
      setPunchItems(
        linkedPunch.map((p: any) => ({
          id: p.id || p.number || "",
          title: p.title || p.description || "",
          status: p.status || "Open",
        }))
      )
    } catch (err) {
      console.error("Failed to load drawing:", err)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        <span className="ml-3 text-muted-foreground">Loading drawing...</span>
      </div>
    )
  }

  if (!drawing) {
    return (
      <div className="text-center py-20 text-muted-foreground">
        <p className="text-lg font-medium">Drawing not found</p>
        <Button variant="ghost" className="mt-4" onClick={() => window.history.back()}>
          <ArrowLeft className="mr-2 h-4 w-4" /> Go Back
        </Button>
      </div>
    )
  }

  const drawingName = drawing.title || drawing.name || drawing.number || "Drawing"
  const drawingDiscipline = drawing.discipline || drawing.category || "Architectural"
  const drawingUrl = drawing.fileUrl || drawing.url || drawing.thumbnailUrl || null

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => window.history.back()}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="flex-1">
          <h1 className="text-xl font-bold">{drawingName}</h1>
          <p className="text-sm text-muted-foreground">
            {drawingDiscipline} - {currentRev}
          </p>
        </div>
        <Button variant="outline" size="sm">
          <Download className="mr-2 h-4 w-4" />
          Download
        </Button>
        <Button variant="outline" size="sm">
          <Share2 className="mr-2 h-4 w-4" />
          Share
        </Button>
      </div>

      <div className="grid gap-4 lg:grid-cols-[1fr_300px]">
        <div className="space-y-2">
          {/* Markup Toolbar */}
          <div className="flex items-center gap-1 rounded-lg border bg-background p-1">
            <MousePointer2 className="h-4 w-4 mx-2 text-muted-foreground" />
            {markupTools.map((t) => {
              const I = t.ic
              return (
                <button
                  key={t.id}
                  onClick={() => setTool(tool === t.id ? null : t.id)}
                  className={cn(
                    "flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-medium transition-colors",
                    tool === t.id
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:bg-muted"
                  )}
                >
                  <I className="h-3.5 w-3.5" />
                  {t.l}
                </button>
              )
            })}
            <div className="flex-1" />
            <Button variant="ghost" size="icon" onClick={() => setZoom(Math.max(25, zoom - 25))}>
              <ZoomOut className="h-3.5 w-3.5" />
            </Button>
            <span className="text-xs font-medium w-10 text-center">{zoom}%</span>
            <Button variant="ghost" size="icon" onClick={() => setZoom(Math.min(400, zoom + 25))}>
              <ZoomIn className="h-3.5 w-3.5" />
            </Button>
          </div>

          {/* Drawing Viewer Area */}
          <div className="flex items-center justify-center rounded-lg border-2 border-dashed bg-muted/30 min-h-[500px]">
            {drawingUrl ? (
              <img
                src={drawingUrl}
                alt={drawingName}
                className="max-w-full max-h-[500px] object-contain"
                style={{ transform: `scale(${zoom / 100})` }}
              />
            ) : (
              <div className="text-center text-muted-foreground">
                <div className="text-6xl font-light mb-3 opacity-20">Plan Viewer</div>
                <p className="text-sm">Drawing content renders here at {zoom}% zoom</p>
                {tool && <p className="text-xs mt-1 text-primary">Active tool: {tool}</p>}
              </div>
            )}
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          {/* Version Selector */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Version</CardTitle>
            </CardHeader>
            <CardContent>
              <button
                onClick={() => setVo(!vo)}
                className="flex w-full items-center justify-between rounded-md border px-3 py-2 text-sm"
              >
                <span>{currentRev}</span>
                <ChevronDown className="h-4 w-4 text-muted-foreground" />
              </button>
              {vo && (
                <div className="mt-1 w-full rounded-md border bg-background shadow-lg">
                  {revisions.map((v) => (
                    <button
                      key={v.id}
                      onClick={() => {
                        setCurrentRev(v.label)
                        setVo(false)
                      }}
                      className={cn(
                        "block w-full px-3 py-2 text-left text-sm hover:bg-muted",
                        v.label === currentRev && "bg-muted font-medium"
                      )}
                    >
                      {v.label}
                    </button>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Linked RFIs */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">
                <MessageSquare className="h-4 w-4 inline mr-1.5" />
                Linked RFIs
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {rfis.length > 0 ? (
                rfis.map((r) => (
                  <div key={r.id} className="flex items-center justify-between rounded-md border px-3 py-2 text-sm">
                    <div>
                      <span className="font-medium">{r.id}</span>
                      <p className="text-xs text-muted-foreground">{r.title}</p>
                    </div>
                    <span
                      className={cn(
                        "rounded-full px-2 py-0.5 text-xs font-medium",
                        r.status === "Open" || r.status === "OPEN"
                          ? "bg-yellow-50 text-yellow-700"
                          : "bg-green-50 text-green-700"
                      )}
                    >
                      {r.status}
                    </span>
                  </div>
                ))
              ) : (
                <p className="text-xs text-muted-foreground">No linked RFIs</p>
              )}
            </CardContent>
          </Card>

          {/* Punch Items */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Punch Items</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {punchItems.length > 0 ? (
                punchItems.map((i) => (
                  <div key={i.id} className="flex items-center justify-between rounded-md border px-3 py-2 text-sm">
                    <div>
                      <span className="font-medium">{i.id}</span>
                      <p className="text-xs text-muted-foreground">{i.title}</p>
                    </div>
                    <span
                      className={cn(
                        "rounded-full px-2 py-0.5 text-xs font-medium",
                        i.status === "Open" || i.status === "OPEN"
                          ? "bg-yellow-50 text-yellow-700"
                          : "bg-green-50 text-green-700"
                      )}
                    >
                      {i.status}
                    </span>
                  </div>
                ))
              ) : (
                <p className="text-xs text-muted-foreground">No linked punch items</p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
