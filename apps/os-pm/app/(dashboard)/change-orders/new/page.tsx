"use client"

import * as React from "react"
import Link from "next/link"
import {
  ArrowLeft,
  FileUp,
  Plus,
  Save,
  Send,
  Trash2,
} from "lucide-react"
import { Button } from "@kealee/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@kealee/ui/card"
import { Input } from "@kealee/ui/input"
import { Label } from "@kealee/ui/label"
import { cn } from "@/lib/utils"

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface LineItem {
  id: string
  description: string
  qty: string
  unit: string
  unitPrice: string
}

// ---------------------------------------------------------------------------
// Reason options
// ---------------------------------------------------------------------------

const REASON_OPTIONS = [
  { value: "", label: "Select reason..." },
  { value: "owner-request", label: "Owner Request" },
  { value: "design-change", label: "Design Change" },
  { value: "unforeseen-conditions", label: "Unforeseen Conditions" },
  { value: "code-requirement", label: "Code Requirement" },
  { value: "value-engineering", label: "Value Engineering" },
]

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

let nextId = 1
function generateId(): string {
  return `li-${nextId++}`
}

function parseNum(val: string): number {
  const n = parseFloat(val)
  return isNaN(n) ? 0 : n
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value)
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function NewChangeOrderPage() {
  const [form, setForm] = React.useState({
    project: "",
    title: "",
    reason: "",
    description: "",
    scheduleDays: "",
    costImpact: "",
  })

  const [lineItems, setLineItems] = React.useState<LineItem[]>([
    { id: generateId(), description: "", qty: "", unit: "EA", unitPrice: "" },
  ])

  function update(field: string, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  function updateLineItem(
    id: string,
    field: keyof LineItem,
    value: string
  ) {
    setLineItems((prev) =>
      prev.map((li) => (li.id === id ? { ...li, [field]: value } : li))
    )
  }

  function addLineItem() {
    setLineItems((prev) => [
      ...prev,
      { id: generateId(), description: "", qty: "", unit: "EA", unitPrice: "" },
    ])
  }

  function removeLineItem(id: string) {
    setLineItems((prev) => {
      if (prev.length <= 1) return prev
      return prev.filter((li) => li.id !== id)
    })
  }

  const lineItemTotal = React.useMemo(() => {
    return lineItems.reduce((sum, li) => {
      return sum + parseNum(li.qty) * parseNum(li.unitPrice)
    }, 0)
  }, [lineItems])

  return (
    <div className="space-y-6 max-w-4xl">
      {/* ---- Back button ---- */}
      <div className="flex items-center gap-4">
        <Link href="/change-orders">
          <Button variant="ghost" size="sm">
            <ArrowLeft size={16} className="mr-1" />
            Back to Change Orders
          </Button>
        </Link>
      </div>

      {/* ---- Page header ---- */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">
          New Change Order
        </h1>
        <p className="text-gray-500 mt-1">
          Document a contract modification with detailed cost breakdown
        </p>
      </div>

      {/* ---- Basic info ---- */}
      <Card>
        <CardHeader>
          <CardTitle>Change Order Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <Label className="mb-1">Project *</Label>
              <select
                value={form.project}
                onChange={(e) => update("project", e.target.value)}
                className="w-full border rounded-md px-3 py-2 text-sm bg-white"
              >
                <option value="">Select project...</option>
                <option>Riverside Commons</option>
                <option>Oakwood Office Park</option>
                <option>Summit Residences</option>
              </select>
            </div>
            <div>
              <Label className="mb-1">Reason for Change *</Label>
              <select
                value={form.reason}
                onChange={(e) => update("reason", e.target.value)}
                className="w-full border rounded-md px-3 py-2 text-sm bg-white"
              >
                {REASON_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <Label className="mb-1">Title *</Label>
            <Input
              value={form.title}
              onChange={(e) => update("title", e.target.value)}
              placeholder="e.g. Additional foundation piers at grid lines D4-D7"
            />
          </div>

          <div>
            <Label className="mb-1">Description *</Label>
            <textarea
              value={form.description}
              onChange={(e) => update("description", e.target.value)}
              placeholder="Provide a detailed description of the change, including the reason, affected areas, and justification..."
              className="w-full border rounded-md px-3 py-2 text-sm min-h-[140px] resize-y"
            />
          </div>
        </CardContent>
      </Card>

      {/* ---- Line items ---- */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Cost Breakdown - Line Items</span>
            <Button
              variant="outline"
              size="sm"
              className="gap-1"
              onClick={addLineItem}
            >
              <Plus size={14} />
              Add Line
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-gray-50">
                  <th className="text-left p-3 font-medium text-gray-600 w-[40%]">
                    Description
                  </th>
                  <th className="text-right p-3 font-medium text-gray-600 w-[12%]">
                    Qty
                  </th>
                  <th className="text-center p-3 font-medium text-gray-600 w-[12%]">
                    Unit
                  </th>
                  <th className="text-right p-3 font-medium text-gray-600 w-[16%]">
                    Unit Price
                  </th>
                  <th className="text-right p-3 font-medium text-gray-600 w-[16%]">
                    Total
                  </th>
                  <th className="p-3 w-[4%]" />
                </tr>
              </thead>
              <tbody>
                {lineItems.map((li) => {
                  const rowTotal =
                    parseNum(li.qty) * parseNum(li.unitPrice)
                  return (
                    <tr
                      key={li.id}
                      className="border-b last:border-b-0"
                    >
                      <td className="p-2">
                        <Input
                          value={li.description}
                          onChange={(e) =>
                            updateLineItem(
                              li.id,
                              "description",
                              e.target.value
                            )
                          }
                          placeholder="Item description"
                          className="text-sm"
                        />
                      </td>
                      <td className="p-2">
                        <Input
                          type="number"
                          value={li.qty}
                          onChange={(e) =>
                            updateLineItem(li.id, "qty", e.target.value)
                          }
                          placeholder="0"
                          className="text-sm text-right"
                        />
                      </td>
                      <td className="p-2">
                        <select
                          value={li.unit}
                          onChange={(e) =>
                            updateLineItem(li.id, "unit", e.target.value)
                          }
                          className="w-full border rounded-md px-2 py-2 text-sm bg-white text-center"
                        >
                          <option>EA</option>
                          <option>LF</option>
                          <option>SF</option>
                          <option>CY</option>
                          <option>TON</option>
                          <option>HR</option>
                          <option>DAY</option>
                          <option>LS</option>
                          <option>GAL</option>
                          <option>LB</option>
                        </select>
                      </td>
                      <td className="p-2">
                        <Input
                          type="number"
                          value={li.unitPrice}
                          onChange={(e) =>
                            updateLineItem(
                              li.id,
                              "unitPrice",
                              e.target.value
                            )
                          }
                          placeholder="0.00"
                          className="text-sm text-right"
                          step="0.01"
                        />
                      </td>
                      <td className="p-2 text-right font-medium text-gray-900">
                        {formatCurrency(rowTotal)}
                      </td>
                      <td className="p-2">
                        <button
                          onClick={() => removeLineItem(li.id)}
                          className={cn(
                            "p-1 rounded hover:bg-red-50 text-gray-400 hover:text-red-500 transition-colors",
                            lineItems.length <= 1 &&
                              "opacity-30 cursor-not-allowed"
                          )}
                          disabled={lineItems.length <= 1}
                        >
                          <Trash2 size={14} />
                        </button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
              <tfoot>
                <tr className="border-t-2 bg-gray-50">
                  <td
                    colSpan={4}
                    className="p-3 text-right font-bold text-gray-900"
                  >
                    Total Amount
                  </td>
                  <td className="p-3 text-right font-bold text-gray-900 text-lg">
                    {formatCurrency(lineItemTotal)}
                  </td>
                  <td />
                </tr>
              </tfoot>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* ---- Impact ---- */}
      <Card>
        <CardHeader>
          <CardTitle>Impact Assessment</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <Label className="mb-1">Schedule Impact (Days)</Label>
              <Input
                type="number"
                value={form.scheduleDays}
                onChange={(e) => update("scheduleDays", e.target.value)}
                placeholder="e.g. 5 (positive = delay, negative = acceleration)"
              />
              <p className="text-xs text-gray-400 mt-1">
                Enter positive number for delays, negative for schedule
                reductions
              </p>
            </div>
            <div>
              <Label className="mb-1">Cost Impact Summary</Label>
              <div className="border rounded-md px-3 py-2 text-sm bg-gray-50">
                <span
                  className={cn(
                    "font-bold",
                    lineItemTotal > 0
                      ? "text-red-600"
                      : lineItemTotal < 0
                      ? "text-green-600"
                      : "text-gray-500"
                  )}
                >
                  {lineItemTotal > 0 ? "+" : ""}
                  {formatCurrency(lineItemTotal)}
                </span>
                <span className="text-gray-400 ml-2">
                  (calculated from line items)
                </span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ---- Attachments ---- */}
      <Card>
        <CardHeader>
          <CardTitle>Supporting Documents</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="border-2 border-dashed rounded-lg p-8 text-center text-gray-400 hover:border-blue-300 hover:text-blue-400 transition-colors cursor-pointer">
            <FileUp size={32} className="mx-auto mb-2" />
            <p className="text-sm font-medium">
              Drop files here or click to upload
            </p>
            <p className="text-xs mt-1">
              Proposals, sketches, photos, reports - PDF, images, DWG up to
              50MB
            </p>
          </div>
        </CardContent>
      </Card>

      {/* ---- Actions ---- */}
      <div className="flex justify-end gap-3">
        <Link href="/change-orders">
          <Button variant="outline">Cancel</Button>
        </Link>
        <Button variant="outline" className="gap-2">
          <Save size={16} />
          Save Draft
        </Button>
        <Button className="gap-2">
          <Send size={16} />
          Submit for Approval
        </Button>
      </div>
    </div>
  )
}
