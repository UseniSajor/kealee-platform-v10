"use client"

import * as React from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import {
  ArrowLeft,
  Calculator,
  DollarSign,
  Loader2,
  Plus,
  Save,
  Send,
  Trash2,
} from "lucide-react"
import { Button } from "@kealee/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@kealee/ui/card"
import { Input } from "@kealee/ui/input"
import { Label } from "@kealee/ui/label"
import { cn } from "@pm/lib/utils"
import { api } from "@pm/lib/api"

interface LineItem {
  id: string
  description: string
  category: string
  qty: string
  unit: string
  unitCost: string
}

const CATEGORY_OPTIONS = [
  "Sitework", "Foundations", "Concrete", "Framing", "Roofing",
  "Exterior Finishes", "Interior Finishes", "Drywall", "Painting",
  "Flooring", "Tile", "Cabinetry", "Countertops", "Doors & Hardware",
  "Windows", "Plumbing", "Electrical", "HVAC", "Insulation",
  "Demolition", "General Conditions", "Other",
]

const UNIT_OPTIONS = ["EA", "LF", "SF", "CY", "SY", "TON", "HR", "DAY", "LS", "GAL", "LB", "CF"]

let nextId = 1
function genId() { return `li-${nextId++}` }
function parseNum(v: string) { const n = parseFloat(v); return isNaN(n) ? 0 : n }
function fmt(v: number) { return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", minimumFractionDigits: 2 }).format(v) }

export default function NewEstimatePage() {
  const router = useRouter()
  const [saving, setSaving] = React.useState(false)
  const [creating, setCreating] = React.useState(false)
  const [form, setForm] = React.useState({
    name: "",
    projectName: "",
    type: "DETAILED",
    squareFootage: "",
    buildingType: "",
    stories: "1",
    overheadPercent: "10",
    profitPercent: "10",
    contingencyPercent: "5",
  })
  const [lineItems, setLineItems] = React.useState<LineItem[]>([
    { id: genId(), description: "", category: "General Conditions", qty: "", unit: "LS", unitCost: "" },
  ])

  function update(field: string, value: string) {
    setForm(prev => ({ ...prev, [field]: value }))
  }

  function updateItem(id: string, field: keyof LineItem, value: string) {
    setLineItems(prev => prev.map(li => li.id === id ? { ...li, [field]: value } : li))
  }

  function addItem() {
    setLineItems(prev => [...prev, { id: genId(), description: "", category: "Other", qty: "", unit: "EA", unitCost: "" }])
  }

  function removeItem(id: string) {
    setLineItems(prev => prev.length <= 1 ? prev : prev.filter(li => li.id !== id))
  }

  const subtotal = React.useMemo(() => lineItems.reduce((s, li) => s + parseNum(li.qty) * parseNum(li.unitCost), 0), [lineItems])
  const overhead = subtotal * (parseNum(form.overheadPercent) / 100)
  const profit = subtotal * (parseNum(form.profitPercent) / 100)
  const contingency = subtotal * (parseNum(form.contingencyPercent) / 100)
  const total = subtotal + overhead + profit + contingency
  const sqft = parseNum(form.squareFootage)
  const costPerSqFt = sqft > 0 ? total / sqft : 0

  return (
    <div className="space-y-6 max-w-5xl">
      <div className="flex items-center gap-4">
        <Link href="/pm/estimates"><Button variant="ghost" size="sm"><ArrowLeft size={16} className="mr-1" /> Back to Estimates</Button></Link>
      </div>

      <div>
        <h1 className="text-3xl font-bold text-gray-900">New Estimate</h1>
        <p className="text-gray-500 mt-1">Create a cost estimate with detailed line items</p>
      </div>

      {/* Project Info */}
      <Card>
        <CardHeader><CardTitle>Project Information</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="grid sm:grid-cols-2 gap-4">
            <div><Label className="mb-1">Estimate Name *</Label><Input value={form.name} onChange={e => update("name", e.target.value)} placeholder="e.g. Riverside Commons - Detailed Estimate" /></div>
            <div><Label className="mb-1">Project Name *</Label><Input value={form.projectName} onChange={e => update("projectName", e.target.value)} placeholder="e.g. Riverside Commons" /></div>
          </div>
          <div className="grid sm:grid-cols-4 gap-4">
            <div><Label className="mb-1">Type</Label>
              <select value={form.type} onChange={e => update("type", e.target.value)} className="w-full border rounded-md px-3 py-2 text-sm bg-white">
                <option value="QUICK_BUDGET">Quick Budget</option><option value="CONCEPTUAL">Conceptual</option><option value="PRELIMINARY">Preliminary</option><option value="DETAILED">Detailed</option><option value="BID_ESTIMATE">Bid Estimate</option>
              </select>
            </div>
            <div><Label className="mb-1">Square Footage</Label><Input type="number" value={form.squareFootage} onChange={e => update("squareFootage", e.target.value)} placeholder="e.g. 2500" /></div>
            <div><Label className="mb-1">Building Type</Label>
              <select value={form.buildingType} onChange={e => update("buildingType", e.target.value)} className="w-full border rounded-md px-3 py-2 text-sm bg-white">
                <option value="">Select...</option><option>Residential</option><option>Commercial</option><option>Industrial</option><option>Institutional</option><option>Mixed-Use</option>
              </select>
            </div>
            <div><Label className="mb-1">Stories</Label><Input type="number" value={form.stories} onChange={e => update("stories", e.target.value)} /></div>
          </div>
        </CardContent>
      </Card>

      {/* Line Items */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Line Items</span>
            <Button variant="outline" size="sm" onClick={addItem} className="gap-1"><Plus size={14} /> Add Item</Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead><tr className="border-b bg-gray-50">
                <th className="text-left p-3 font-medium w-[30%]">Description</th>
                <th className="text-left p-3 font-medium w-[15%]">Category</th>
                <th className="text-right p-3 font-medium w-[10%]">Qty</th>
                <th className="text-center p-3 font-medium w-[10%]">Unit</th>
                <th className="text-right p-3 font-medium w-[15%]">Unit Cost</th>
                <th className="text-right p-3 font-medium w-[15%]">Total</th>
                <th className="p-3 w-[5%]" />
              </tr></thead>
              <tbody>
                {lineItems.map(li => {
                  const rowTotal = parseNum(li.qty) * parseNum(li.unitCost)
                  return (
                    <tr key={li.id} className="border-b">
                      <td className="p-2"><Input value={li.description} onChange={e => updateItem(li.id, "description", e.target.value)} placeholder="Item description" className="text-sm" /></td>
                      <td className="p-2">
                        <select value={li.category} onChange={e => updateItem(li.id, "category", e.target.value)} className="w-full border rounded-md px-2 py-2 text-xs bg-white">
                          {CATEGORY_OPTIONS.map(c => <option key={c}>{c}</option>)}
                        </select>
                      </td>
                      <td className="p-2"><Input type="number" value={li.qty} onChange={e => updateItem(li.id, "qty", e.target.value)} placeholder="0" className="text-sm text-right" /></td>
                      <td className="p-2">
                        <select value={li.unit} onChange={e => updateItem(li.id, "unit", e.target.value)} className="w-full border rounded-md px-2 py-2 text-xs bg-white text-center">
                          {UNIT_OPTIONS.map(u => <option key={u}>{u}</option>)}
                        </select>
                      </td>
                      <td className="p-2"><Input type="number" value={li.unitCost} onChange={e => updateItem(li.id, "unitCost", e.target.value)} placeholder="0.00" className="text-sm text-right" step="0.01" /></td>
                      <td className="p-2 text-right font-medium">{fmt(rowTotal)}</td>
                      <td className="p-2"><button onClick={() => removeItem(li.id)} disabled={lineItems.length <= 1} className={cn("p-1 rounded hover:bg-red-50", lineItems.length <= 1 && "opacity-30")}><Trash2 size={14} className="text-gray-400" /></button></td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Cost Summary */}
      <Card>
        <CardHeader><CardTitle className="flex items-center gap-2"><Calculator size={18} /> Cost Summary</CardTitle></CardHeader>
        <CardContent>
          <div className="grid sm:grid-cols-2 gap-6">
            <div className="space-y-3">
              <div className="grid grid-cols-3 gap-4">
                <div><Label className="mb-1">Overhead %</Label><Input type="number" value={form.overheadPercent} onChange={e => update("overheadPercent", e.target.value)} className="text-sm" /></div>
                <div><Label className="mb-1">Profit %</Label><Input type="number" value={form.profitPercent} onChange={e => update("profitPercent", e.target.value)} className="text-sm" /></div>
                <div><Label className="mb-1">Contingency %</Label><Input type="number" value={form.contingencyPercent} onChange={e => update("contingencyPercent", e.target.value)} className="text-sm" /></div>
              </div>
            </div>
            <div className="bg-gray-50 rounded-lg p-4 space-y-2 text-sm">
              <div className="flex justify-between"><span>Subtotal</span><span>{fmt(subtotal)}</span></div>
              <div className="flex justify-between text-gray-500"><span>Overhead ({form.overheadPercent}%)</span><span>{fmt(overhead)}</span></div>
              <div className="flex justify-between text-gray-500"><span>Profit ({form.profitPercent}%)</span><span>{fmt(profit)}</span></div>
              <div className="flex justify-between text-gray-500"><span>Contingency ({form.contingencyPercent}%)</span><span>{fmt(contingency)}</span></div>
              <div className="flex justify-between border-t pt-2 font-bold text-lg"><span>Total</span><span>{fmt(total)}</span></div>
              {sqft > 0 && <div className="flex justify-between text-gray-500 text-xs"><span>Cost per SF</span><span>{fmt(costPerSqFt)}/SF</span></div>}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="flex justify-end gap-3 pb-8">
        <Link href="/pm/estimates"><Button variant="outline">Cancel</Button></Link>
        <Button
          variant="outline"
          className="gap-2"
          disabled={saving || creating}
          onClick={async () => {
            if (!form.name.trim()) return alert("Please enter an estimate name")
            setSaving(true)
            try {
              const payload = buildPayload("DRAFT")
              await api.estimates.create(payload)
              router.push("/pm/estimates")
            } catch (err: any) {
              console.error("Save draft failed:", err)
              alert("Failed to save draft. Please try again.")
            } finally {
              setSaving(false)
            }
          }}
        >
          {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
          {saving ? "Saving..." : "Save Draft"}
        </Button>
        <Button
          className="gap-2"
          disabled={saving || creating}
          onClick={async () => {
            if (!form.name.trim()) return alert("Please enter an estimate name")
            if (!form.projectName.trim()) return alert("Please enter a project name")
            setCreating(true)
            try {
              const payload = buildPayload("ACTIVE")
              await api.estimates.create(payload)
              router.push("/pm/estimates")
            } catch (err: any) {
              console.error("Create estimate failed:", err)
              alert("Failed to create estimate. Please try again.")
            } finally {
              setCreating(false)
            }
          }}
        >
          {creating ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
          {creating ? "Creating..." : "Create Estimate"}
        </Button>
      </div>
    </div>
  )

  function buildPayload(status: "DRAFT" | "ACTIVE") {
    return {
      name: form.name,
      projectName: form.projectName,
      type: form.type,
      status,
      squareFootage: parseNum(form.squareFootage) || undefined,
      buildingType: form.buildingType || undefined,
      stories: parseInt(form.stories) || 1,
      overheadPercent: parseNum(form.overheadPercent),
      profitPercent: parseNum(form.profitPercent),
      contingencyPercent: parseNum(form.contingencyPercent),
      lineItems: lineItems
        .filter(li => li.description.trim())
        .map(li => ({
          description: li.description,
          category: li.category,
          quantity: parseNum(li.qty),
          unit: li.unit,
          unitCost: parseNum(li.unitCost),
        })),
      subtotal,
      overhead,
      profit,
      contingency,
      total,
      costPerSqFt: costPerSqFt > 0 ? costPerSqFt : undefined,
    }
  }
}

