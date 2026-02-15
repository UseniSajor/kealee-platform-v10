"use client"

import * as React from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import {
  ArrowLeft,
  Brain,
  CheckCircle2,
  FileText,
  Image,
  Loader2,
  Upload,
  Wand2,
  X,
  AlertTriangle,
} from "lucide-react"
import { Button } from "@kealee/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@kealee/ui/card"
import { Input } from "@kealee/ui/input"
import { Label } from "@kealee/ui/label"
import { cn } from "@/lib/utils"
import { useRunAITakeoff } from "@/hooks/useEstimates"

type ProcessingStatus = "idle" | "uploading" | "processing" | "complete" | "error"
type DetailLevel = "QUICK" | "STANDARD" | "DETAILED"

interface UploadedFile {
  id: string
  name: string
  type: string
  size: number
  discipline: string
  status: "pending" | "processing" | "done" | "error"
}

interface ExtractedItem {
  id: string
  category: string
  description: string
  quantity: number
  unit: string
  confidence: number
  source: string
  floor?: string
  drawingRef?: string
}

interface TakeoffResult {
  totalItems: number
  averageConfidence: number
  items: ExtractedItem[]
  byCategory: Record<string, { count: number }>
  processingTime: number
}

const DISCIPLINE_OPTIONS = [
  { value: "ARCHITECTURAL", label: "Architectural" },
  { value: "STRUCTURAL", label: "Structural" },
  { value: "MECHANICAL", label: "Mechanical/HVAC" },
  { value: "ELECTRICAL", label: "Electrical" },
  { value: "PLUMBING", label: "Plumbing" },
  { value: "CIVIL", label: "Civil/Site" },
]

const CONFIDENCE_COLORS: Record<string, string> = {
  high: "text-green-600 bg-green-50",
  medium: "text-yellow-600 bg-yellow-50",
  low: "text-red-600 bg-red-50",
}

function getConfidenceLevel(conf: number): string {
  if (conf >= 80) return "high"
  if (conf >= 60) return "medium"
  return "low"
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return bytes + " B"
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB"
  return (bytes / (1024 * 1024)).toFixed(1) + " MB"
}

export default function AITakeoffPage() {
  const router = useRouter()
  const [files, setFiles] = React.useState<UploadedFile[]>([])
  const [detailLevel, setDetailLevel] = React.useState<DetailLevel>("STANDARD")
  const [autoLink, setAutoLink] = React.useState(true)
  const [status, setStatus] = React.useState<ProcessingStatus>("idle")
  const [result, setResult] = React.useState<TakeoffResult | null>(null)
  const [projectName, setProjectName] = React.useState("")
  const [errorMsg, setErrorMsg] = React.useState("")
  const fileInputRef = React.useRef<HTMLInputElement>(null)

  const aiTakeoff = useRunAITakeoff()

  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const newFiles = Array.from(e.target.files || []).map(f => ({
      id: Math.random().toString(36).substr(2, 9),
      name: f.name,
      type: f.type.includes("pdf") ? "PDF" : f.type.includes("image") ? "JPG" : "PDF",
      size: f.size,
      discipline: "ARCHITECTURAL",
      status: "pending" as const,
    }))
    setFiles(prev => [...prev, ...newFiles])
  }

  function removeFile(id: string) {
    setFiles(prev => prev.filter(f => f.id !== id))
  }

  function updateDiscipline(id: string, discipline: string) {
    setFiles(prev => prev.map(f => f.id === id ? { ...f, discipline } : f))
  }

  async function runAITakeoff() {
    if (files.length === 0) return
    setStatus("processing")
    setErrorMsg("")
    setFiles(prev => prev.map(f => ({ ...f, status: "processing" as const })))

    const startTime = Date.now()

    try {
      const apiResult = await aiTakeoff.mutateAsync({
        files: files.map(f => ({
          name: f.name,
          type: f.type,
          size: f.size,
          discipline: f.discipline,
        })),
        disciplines: [...new Set(files.map(f => f.discipline))],
        detailLevel,
        autoLink,
        projectName: projectName || undefined,
      })

      const elapsed = (Date.now() - startTime) / 1000

      // Normalize the API response
      const items: ExtractedItem[] = (apiResult?.items ?? apiResult?.extractedItems ?? apiResult?.takeoff?.items ?? []).map((item: any, idx: number) => ({
        id: item.id || String(idx + 1),
        category: item.category || item.csiCode || "GENERAL",
        description: item.description || item.name || "",
        quantity: item.quantity || 0,
        unit: item.unit || "EA",
        confidence: item.confidence ?? item.confidenceScore ?? 80,
        source: item.source || "AI_EXTRACTED",
        floor: item.floor || item.level,
        drawingRef: item.drawingRef || item.drawingReference,
      }))

      const byCategory: Record<string, { count: number }> = {}
      for (const item of items) {
        if (!byCategory[item.category]) byCategory[item.category] = { count: 0 }
        byCategory[item.category].count++
      }

      const avgConf = items.length > 0
        ? Math.round(items.reduce((s, i) => s + i.confidence, 0) / items.length)
        : 0

      setResult({
        totalItems: items.length,
        averageConfidence: avgConf,
        items,
        byCategory,
        processingTime: parseFloat(elapsed.toFixed(1)),
      })

      setFiles(prev => prev.map(f => ({ ...f, status: "done" as const })))
      setStatus("complete")
    } catch (err: any) {
      console.error("AI Takeoff error:", err)
      setErrorMsg(err?.message || err?.response?.data?.error || "AI Takeoff failed. Please try again.")
      setFiles(prev => prev.map(f => ({ ...f, status: "error" as const })))
      setStatus("error")
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/estimates">
          <Button variant="ghost" size="sm"><ArrowLeft size={16} className="mr-1" /> Back to Estimates</Button>
        </Link>
      </div>

      <div className="flex items-center gap-3">
        <div className="p-3 rounded-xl bg-purple-100">
          <Wand2 size={24} className="text-purple-600" />
        </div>
        <div>
          <h1 className="text-3xl font-bold text-gray-900">AI Takeoff</h1>
          <p className="text-gray-500">Upload construction plans and photos for automatic quantity extraction</p>
        </div>
      </div>

      {status === "error" && errorMsg && (
        <Card className="border-red-200 bg-red-50/50">
          <CardContent className="p-4 flex items-center gap-3">
            <AlertTriangle size={20} className="text-red-500 shrink-0" />
            <div>
              <p className="text-sm font-medium text-red-800">AI Takeoff Error</p>
              <p className="text-sm text-red-600">{errorMsg}</p>
            </div>
            <Button variant="outline" size="sm" className="ml-auto" onClick={() => { setStatus("idle"); setErrorMsg("") }}>
              Try Again
            </Button>
          </CardContent>
        </Card>
      )}

      {status !== "complete" ? (
        <>
          {/* Upload Section */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Upload size={18} /> Upload Plans & Photos</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label className="mb-1.5">Project Name</Label>
                <Input value={projectName} onChange={(e) => setProjectName(e.target.value)} placeholder="e.g. Riverside Commons - Phase 2" />
              </div>

              <div
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed rounded-lg p-8 text-center cursor-pointer hover:border-purple-300 hover:bg-purple-50/30 transition-colors"
              >
                <Upload size={36} className="mx-auto mb-3 text-purple-400" />
                <p className="text-sm font-medium text-gray-700">Drop files here or click to upload</p>
                <p className="text-xs text-gray-400 mt-1">PDF plans, DWG/DXF drawings, JPG/PNG photos - up to 100MB each</p>
                <input ref={fileInputRef} type="file" className="hidden" multiple accept=".pdf,.dwg,.dxf,.jpg,.jpeg,.png,.tiff" onChange={handleFileSelect} />
              </div>

              {files.length > 0 && (
                <div className="space-y-2">
                  <p className="text-sm font-medium text-gray-700">{files.length} file(s) selected</p>
                  {files.map(f => (
                    <div key={f.id} className="flex items-center gap-3 p-3 border rounded-lg">
                      {f.type === "PDF" ? <FileText size={20} className="text-red-500 shrink-0" /> : <Image size={20} className="text-blue-500 shrink-0" />}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{f.name}</p>
                        <p className="text-xs text-gray-400">{formatFileSize(f.size)} · {f.type}</p>
                      </div>
                      <select value={f.discipline} onChange={(e) => updateDiscipline(f.id, e.target.value)} className="border rounded px-2 py-1 text-xs bg-white">
                        {DISCIPLINE_OPTIONS.map(d => <option key={d.value} value={d.value}>{d.label}</option>)}
                      </select>
                      {f.status === "processing" ? <Loader2 size={16} className="animate-spin text-purple-500" /> :
                       f.status === "done" ? <CheckCircle2 size={16} className="text-green-500" /> :
                       f.status === "error" ? <AlertTriangle size={16} className="text-red-500" /> :
                       <button onClick={() => removeFile(f.id)} className="p-1 hover:bg-red-50 rounded"><X size={14} className="text-gray-400 hover:text-red-500" /></button>}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Options */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Brain size={18} /> AI Settings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <Label className="mb-1.5">Detail Level</Label>
                  <select value={detailLevel} onChange={(e) => setDetailLevel(e.target.value as DetailLevel)} className="w-full border rounded-md px-3 py-2 text-sm bg-white">
                    <option value="QUICK">Quick Scan - Fast overview</option>
                    <option value="STANDARD">Standard - Balanced detail</option>
                    <option value="DETAILED">Detailed - Maximum extraction</option>
                  </select>
                </div>
                <div>
                  <Label className="mb-1.5">Options</Label>
                  <label className="flex items-center gap-2 mt-2">
                    <input type="checkbox" checked={autoLink} onChange={(e) => setAutoLink(e.target.checked)} className="h-4 w-4 rounded border-gray-300" />
                    <span className="text-sm text-gray-700">Auto-link to cost database assemblies</span>
                  </label>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Run Button */}
          <div className="flex justify-end">
            <Button onClick={runAITakeoff} disabled={files.length === 0 || status === "processing"} size="lg" className="gap-2">
              {status === "processing" ? <><Loader2 size={18} className="animate-spin" /> Processing...</> : <><Wand2 size={18} /> Run AI Takeoff</>}
            </Button>
          </div>
        </>
      ) : result && (
        <>
          {/* Results Summary */}
          <Card className="border-green-200 bg-green-50/30">
            <CardContent className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <CheckCircle2 size={24} className="text-green-600" />
                <div>
                  <h2 className="text-lg font-bold text-gray-900">AI Takeoff Complete</h2>
                  <p className="text-sm text-gray-500">Processed in {result.processingTime}s · {result.totalItems} items extracted · {result.averageConfidence}% avg confidence</p>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div className="bg-white rounded-lg p-3 text-center">
                  <p className="text-2xl font-bold text-blue-600">{result.totalItems}</p>
                  <p className="text-xs text-gray-500">Items Extracted</p>
                </div>
                <div className="bg-white rounded-lg p-3 text-center">
                  <p className="text-2xl font-bold text-green-600">{result.averageConfidence}%</p>
                  <p className="text-xs text-gray-500">Avg Confidence</p>
                </div>
                <div className="bg-white rounded-lg p-3 text-center">
                  <p className="text-2xl font-bold text-purple-600">{Object.keys(result.byCategory).length}</p>
                  <p className="text-xs text-gray-500">Categories</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Extracted Items Table */}
          <Card>
            <CardHeader>
              <CardTitle>Extracted Quantities</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b bg-gray-50">
                      <th className="text-left px-4 py-3 font-medium">Description</th>
                      <th className="text-left px-4 py-3 font-medium">Category</th>
                      <th className="text-right px-4 py-3 font-medium">Qty</th>
                      <th className="text-center px-4 py-3 font-medium">Unit</th>
                      <th className="text-center px-4 py-3 font-medium">Confidence</th>
                      <th className="text-left px-4 py-3 font-medium">Drawing</th>
                      <th className="text-left px-4 py-3 font-medium">Floor</th>
                    </tr>
                  </thead>
                  <tbody>
                    {result.items.map((item) => {
                      const confLevel = getConfidenceLevel(item.confidence)
                      return (
                        <tr key={item.id} className="border-b hover:bg-gray-50">
                          <td className="px-4 py-3 font-medium">{item.description}</td>
                          <td className="px-4 py-3"><span className="text-xs bg-gray-100 px-2 py-0.5 rounded">{item.category.replace(/_/g, " ")}</span></td>
                          <td className="px-4 py-3 text-right font-medium">{item.quantity.toLocaleString()}</td>
                          <td className="px-4 py-3 text-center text-gray-500">{item.unit}</td>
                          <td className="px-4 py-3 text-center">
                            <span className={cn("px-2 py-0.5 rounded-full text-xs font-medium", CONFIDENCE_COLORS[confLevel])}>
                              {item.confidence}%
                            </span>
                          </td>
                          <td className="px-4 py-3 text-gray-500 font-mono text-xs">{item.drawingRef || "-"}</td>
                          <td className="px-4 py-3 text-gray-500">{item.floor || "-"}</td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

          {/* Actions */}
          <div className="flex justify-between">
            <Button variant="outline" onClick={() => { setStatus("idle"); setResult(null); setFiles([]); }}>
              Start New Takeoff
            </Button>
            <div className="flex gap-3">
              <Button variant="outline" className="gap-2"><FileText size={16} /> Export CSV</Button>
              <Button className="gap-2" onClick={() => router.push("/estimates/new")}>
                <CheckCircle2 size={16} /> Create Estimate from Takeoff
              </Button>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
