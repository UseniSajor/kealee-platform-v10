"use client"
import * as React from "react"
import { Search, Upload, FileText, Layers, Building2, Wrench, TreePine, Compass, Download, Eye, Loader2 } from "lucide-react"
import { Button } from "@kealee/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@kealee/ui/card"
import { Input } from "@kealee/ui/input"
import { cn } from "@pm/lib/utils"
import { api } from "@pm/lib/api/index"

type Discipline = "All" | "Architectural" | "Structural" | "MEP" | "Civil" | "Landscape"

interface DrawingSet {
  id: string
  number: string
  name: string
  discipline: Exclude<Discipline, "All">
  revision: string
  date: string
  uploadedBy: string
  sheets: number
}

const tabs: { label: Discipline; icon: React.ElementType }[] = [
  { label: "All", icon: Layers },
  { label: "Architectural", icon: Building2 },
  { label: "Structural", icon: Compass },
  { label: "MEP", icon: Wrench },
  { label: "Civil", icon: FileText },
  { label: "Landscape", icon: TreePine },
]

export default function DrawingsPage() {
  const [disc, setDisc] = React.useState<Discipline>("All")
  const [q, setQ] = React.useState("")
  const [drawings, setDrawings] = React.useState<DrawingSet[]>([])
  const [loading, setLoading] = React.useState(true)

  React.useEffect(() => {
    loadDrawings()
  }, [])

  async function loadDrawings() {
    setLoading(true)
    try {
      const res = await api.drawings.list()
      const data = res as any
      const items = data?.drawings || data?.data?.drawings || data?.items || []
      const mapped: DrawingSet[] = items.map((d: any) => ({
        id: d.id,
        number: d.number || d.drawingNumber || d.code || "",
        name: d.name || d.title || "",
        discipline: d.discipline || "Architectural",
        revision: d.revision || d.currentRevision || "Rev 1",
        date: d.updatedAt ? new Date(d.updatedAt).toISOString().split("T")[0] : d.date || "",
        uploadedBy: d.uploadedBy || d.createdByName || "â€”",
        sheets: d.sheets || d.sheetCount || 1,
      }))
      setDrawings(mapped)
    } catch (err) {
      console.error("Failed to load drawings:", err)
    } finally {
      setLoading(false)
    }
  }

  const filtered = drawings.filter((d) => {
    if (disc !== "All" && d.discipline !== disc) return false
    if (q && !d.number.toLowerCase().includes(q.toLowerCase()) && !d.name.toLowerCase().includes(q.toLowerCase())) return false
    return true
  })

  const stats: Record<string, number> = {}
  for (const d of drawings) stats[d.discipline] = (stats[d.discipline] || 0) + 1

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Drawings & Plans</h1>
          <p className="text-muted-foreground">{drawings.length} drawing sets across all disciplines</p>
        </div>
        <Button><Upload className="mr-2 h-4 w-4" />Upload Drawing Set</Button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          <span className="ml-3 text-muted-foreground">Loading drawings...</span>
        </div>
      ) : (
        <>
          {Object.keys(stats).length > 0 && (
            <div className="grid gap-4 md:grid-cols-5">
              {Object.entries(stats).map(([d, c]) => (
                <Card key={d}>
                  <CardContent className="pt-4 pb-4">
                    <div className="text-sm font-medium text-muted-foreground">{d}</div>
                    <div className="text-2xl font-bold">{c}</div>
                    <div className="text-xs text-muted-foreground">drawing sets</div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          <div className="flex items-center gap-2 border-b pb-2">
            {tabs.map((tab) => {
              const I = tab.icon
              return (
                <button
                  key={tab.label}
                  onClick={() => setDisc(tab.label)}
                  className={cn(
                    "flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
                    disc === tab.label ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted"
                  )}
                >
                  <I className="h-4 w-4" />{tab.label}
                </button>
              )
            })}
          </div>

          <div className="relative max-w-sm">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input placeholder="Search by drawing number or name..." value={q} onChange={(e) => setQ(e.target.value)} className="pl-9" />
          </div>

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {filtered.map((dr) => (
              <Card key={dr.id} className="hover:shadow-md transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-base">{dr.number}</CardTitle>
                      <p className="text-sm text-muted-foreground mt-0.5">{dr.name}</p>
                    </div>
                    <span className="inline-flex items-center rounded-full bg-blue-50 px-2.5 py-0.5 text-xs font-medium text-blue-700">{dr.revision}</span>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between text-sm">
                    <div className="space-y-1">
                      <div className="text-muted-foreground"><span className="font-medium text-foreground">{dr.discipline}</span> Â· {dr.sheets} sheets</div>
                      <div className="text-muted-foreground">Uploaded {dr.date} by {dr.uploadedBy}</div>
                    </div>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="icon" className="h-8 w-8"><Eye className="h-4 w-4" /></Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8"><Download className="h-4 w-4" /></Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {filtered.length === 0 && (
            <div className="text-center py-12 text-muted-foreground">
              <FileText className="mx-auto h-12 w-12 mb-3 opacity-40" />
              <p className="text-lg font-medium">No drawings found</p>
              <p className="text-sm">Try adjusting your search or discipline filter.</p>
            </div>
          )}
        </>
      )}
    </div>
  )
}

