"use client"

import * as React from "react"
import Link from "next/link"
import {
  ArrowDown,
  ArrowLeft,
  ArrowUp,
  Check,
  CheckCircle,
  Clock,
  ExternalLink,
  MessageSquare,
  Minus,
  Package,
  Star,
  Truck,
} from "lucide-react"
import { Button } from "@kealee/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@kealee/ui/card"
import { Input } from "@kealee/ui/input"
import { cn } from "@/lib/utils"

interface SelectionOption {
  id: string
  name: string
  manufacturer: string
  price: number
  leadTime: string
  specs: string[]
  isSelected: boolean
}

const MOCK_SELECTION = {
  id: "SEL-002",
  category: "Countertops",
  itemName: "Kitchen Island Countertop",
  room: "Kitchen",
  project: "Riverside Commons",
  allowanceBudget: 6000,
  selectedOptionId: "OPT-2",
  selectedCost: 7800,
  status: "ordered" as const,
  dueDate: "2026-02-15",
  notes: "Owner prefers light-colored quartz with subtle veining. Island is 4ft x 8ft with waterfall edge on one side.",
}

const MOCK_OPTIONS: SelectionOption[] = [
  {
    id: "OPT-1",
    name: "Granite - Colonial White",
    manufacturer: "MSI Surfaces",
    price: 4800,
    leadTime: "2-3 weeks",
    specs: ["3cm thick slab", "Polished finish", "Natural stone - each slab unique", "Sealed on-site", "Heat resistant"],
    isSelected: false,
  },
  {
    id: "OPT-2",
    name: "Quartz - Brittanicca",
    manufacturer: "Cambria",
    price: 7800,
    leadTime: "3-4 weeks",
    specs: ["3cm thick slab", "Polished finish", "Non-porous surface", "No sealing required", "Stain resistant", "10-year limited warranty"],
    isSelected: true,
  },
  {
    id: "OPT-3",
    name: "Quartz - Calacatta Classique",
    manufacturer: "Silestone",
    price: 6200,
    leadTime: "2-3 weeks",
    specs: ["2cm thick slab", "Suede finish available", "HybriQ+ technology", "N-Boost treatment", "25-year warranty"],
    isSelected: false,
  },
  {
    id: "OPT-4",
    name: "Marble - Calacatta Gold",
    manufacturer: "Italy Import - Polycor",
    price: 11500,
    leadTime: "6-8 weeks",
    specs: ["3cm thick slab", "Honed or polished", "Natural stone - unique veining", "Requires periodic sealing", "Premium grade import"],
    isSelected: false,
  },
]

const WORKFLOW_STEPS = [
  { label: "Selection Made", status: "complete" as const, date: "Feb 5" },
  { label: "Owner Approved", status: "complete" as const, date: "Feb 8" },
  { label: "Ordered", status: "active" as const, date: "Feb 10" },
  { label: "Delivered", status: "pending" as const, date: "---" },
  { label: "Installed", status: "pending" as const, date: "---" },
]

const COMMENTS = [
  { id: "c1", user: "John Mitchell", role: "Owner", date: "2026-02-05", content: "We love the Cambria Brittanicca. The veining pattern is exactly what we were looking for. Please proceed with ordering." },
  { id: "c2", user: "Sarah Kim", role: "Project Manager", date: "2026-02-08", content: "Approved by owner. Note this is $1,800 over allowance. Change order CO-014 initiated for the overage." },
  { id: "c3", user: "Mike Torres", role: "Site Superintendent", date: "2026-02-10", content: "Order placed with Cambria. Template scheduled for Feb 20 after cabinets are set. Expected fabrication 2 weeks after template." },
]

function formatCurrency(n: number) {
  return "$" + n.toLocaleString()
}

export default function SelectionDetailPage() {
  const [comment, setComment] = React.useState("")
  const sel = MOCK_SELECTION
  const variance = sel.selectedCost - sel.allowanceBudget

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/selections">
          <Button variant="ghost" size="sm"><ArrowLeft size={16} className="mr-1" />Back to Selections</Button>
        </Link>
      </div>

      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-stone-100 text-stone-800">{sel.category}</span>
            <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
              {sel.status.charAt(0).toUpperCase() + sel.status.slice(1)}
            </span>
          </div>
          <h1 className="text-2xl font-bold text-gray-900">{sel.itemName}</h1>
          <p className="text-sm text-gray-500 mt-1">{sel.room} - {sel.project}</p>
        </div>
      </div>

      <div className="grid md:grid-cols-3 gap-4">
        <Card className="text-center">
          <CardContent className="p-4">
            <p className="text-xs text-gray-500 mb-1">Allowance</p>
            <p className="text-2xl font-bold text-gray-900">{formatCurrency(sel.allowanceBudget)}</p>
          </CardContent>
        </Card>
        <Card className="text-center">
          <CardContent className="p-4">
            <p className="text-xs text-gray-500 mb-1">Selected Price</p>
            <p className="text-2xl font-bold text-blue-700">{formatCurrency(sel.selectedCost)}</p>
          </CardContent>
        </Card>
        <Card className={cn("text-center", variance > 0 ? "border-red-200" : "border-green-200")}>
          <CardContent className="p-4">
            <p className="text-xs text-gray-500 mb-1">Variance</p>
            <p className={cn("text-2xl font-bold flex items-center justify-center gap-1", variance > 0 ? "text-red-600" : "text-green-600")}>
              {variance > 0 ? <ArrowUp size={18} /> : <ArrowDown size={18} />}
              {variance > 0 ? "+" : ""}{formatCurrency(Math.abs(variance))}
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader><CardTitle>Approval Workflow</CardTitle></CardHeader>
        <CardContent>
          <div className="flex items-center justify-between max-w-2xl mx-auto">
            {WORKFLOW_STEPS.map((step, i) => (
              <React.Fragment key={step.label}>
                <div className="flex flex-col items-center gap-1">
                  <div className={cn(
                    "w-10 h-10 rounded-full flex items-center justify-center border-2",
                    step.status === "complete" ? "bg-green-500 border-green-500 text-white" :
                    step.status === "active" ? "bg-blue-500 border-blue-500 text-white" :
                    "bg-gray-100 border-gray-300 text-gray-400"
                  )}>
                    {step.status === "complete" ? <Check size={18} /> :
                     step.status === "active" ? <Package size={18} /> :
                     <span className="text-xs">{i + 1}</span>}
                  </div>
                  <p className={cn("text-xs font-medium text-center", step.status === "pending" ? "text-gray-400" : "text-gray-700")}>{step.label}</p>
                  <p className="text-[10px] text-gray-400">{step.date}</p>
                </div>
                {i < WORKFLOW_STEPS.length - 1 && (
                  <div className={cn("flex-1 h-0.5 mx-2", i < 2 ? "bg-green-500" : "bg-gray-200")} />
                )}
              </React.Fragment>
            ))}
          </div>
        </CardContent>
      </Card>

      <div>
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Options Comparison</h2>
        <div className="grid md:grid-cols-2 gap-4">
          {MOCK_OPTIONS.map((opt) => {
            const optVariance = opt.price - sel.allowanceBudget
            return (
              <Card key={opt.id} className={cn("transition-shadow", opt.isSelected && "ring-2 ring-blue-500 shadow-md")}>
                <CardContent className="p-0">
                  <div className={cn("h-40 flex items-center justify-center", opt.isSelected ? "bg-blue-50" : "bg-gray-100")}>
                    {opt.isSelected && (
                      <div className="absolute top-3 right-3 bg-blue-600 text-white px-2 py-0.5 rounded-full text-xs font-medium flex items-center gap-1">
                        <Star size={12} />Selected
                      </div>
                    )}
                    <div className="text-center">
                      <Package size={32} className="mx-auto text-gray-400 mb-2" />
                      <p className="text-xs text-gray-400">Product image placeholder</p>
                    </div>
                  </div>
                  <div className="p-4 space-y-3">
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="font-semibold text-gray-900">{opt.name}</h3>
                        <p className="text-sm text-gray-500">{opt.manufacturer}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-bold text-gray-900">{formatCurrency(opt.price)}</p>
                        <p className={cn("text-xs font-medium flex items-center gap-0.5 justify-end",
                          optVariance > 0 ? "text-red-600" : optVariance < 0 ? "text-green-600" : "text-gray-500"
                        )}>
                          {optVariance > 0 ? <ArrowUp size={10} /> : optVariance < 0 ? <ArrowDown size={10} /> : <Minus size={10} />}
                          {optVariance > 0 ? "+" : ""}{formatCurrency(Math.abs(optVariance))} vs allowance
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 text-xs text-gray-500">
                      <Truck size={12} />Lead time: {opt.leadTime}
                    </div>
                    <div className="border-t pt-3">
                      <p className="text-xs font-medium text-gray-600 mb-1.5">Specifications</p>
                      <ul className="space-y-1">
                        {opt.specs.map((spec, i) => (
                          <li key={i} className="text-xs text-gray-500 flex items-center gap-1.5">
                            <Check size={10} className="text-gray-400 shrink-0" />{spec}
                          </li>
                        ))}
                      </ul>
                    </div>
                    {!opt.isSelected && (
                      <Button variant="outline" size="sm" className="w-full mt-2">Select This Option</Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      </div>

      <Card>
        <CardHeader><CardTitle>Comments</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          {COMMENTS.map((c) => (
            <div key={c.id} className="border rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-7 h-7 rounded-full bg-gray-200 flex items-center justify-center text-xs font-bold text-gray-600">
                  {c.user.split(" ").map((n) => n[0]).join("")}
                </div>
                <div>
                  <p className="text-sm font-medium">{c.user} <span className="text-xs text-gray-400 font-normal">({c.role})</span></p>
                  <p className="text-xs text-gray-400">{new Date(c.date + "T00:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric" })}</p>
                </div>
              </div>
              <p className="text-sm text-gray-700">{c.content}</p>
            </div>
          ))}
          <div className="flex gap-2">
            <Input placeholder="Add a comment..." value={comment} onChange={(e) => setComment(e.target.value)} className="flex-1" />
            <Button><MessageSquare size={16} /></Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
