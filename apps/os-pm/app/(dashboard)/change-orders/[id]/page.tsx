"use client"
import * as React from "react"
import { useParams } from "next/navigation"
import { ArrowLeft, Brain, Calendar, CheckCircle2, Clock, Loader2, XCircle } from "lucide-react"
import { Button } from "@kealee/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@kealee/ui/card"
import { cn } from "@/lib/utils"
import { useChangeOrder } from "@/hooks/useChangeOrders"

export default function ChangeOrderDetailPage() {
  const params = useParams()
  const id = params.id as string
  const { data, isLoading } = useChangeOrder(id)

  const changeOrder = data?.changeOrder ?? data?.item ?? data ?? null

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
      </div>
    )
  }

  if (!changeOrder) {
    return <div className="text-center py-12">Change order not found</div>
  }

  const li = changeOrder?.lineItems ?? []
  const cs = changeOrder?.costSummary ?? {} as Record<string, number>
  const ap = changeOrder?.approvals ?? []

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => window.history.back()}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="flex-1">
          <h1 className="text-xl font-bold">
            {changeOrder.number}: {changeOrder.title}
          </h1>
          <p className="text-sm text-muted-foreground">
            Requested by {changeOrder.requestedBy} on {changeOrder.date || changeOrder.createdAt}
          </p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Line Items</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="px-4 py-2 text-left">Description</th>
                  <th className="px-4 py-2 text-center">Qty</th>
                  <th className="px-4 py-2 text-right">Unit Cost</th>
                  <th className="px-4 py-2 text-right">Amount</th>
                  <th className="px-4 py-2 text-left">Category</th>
                </tr>
              </thead>
              <tbody>
                {li.map((item: any, i: number) => (
                  <tr key={item.id ?? i} className="border-b">
                    <td className="px-4 py-2">{item.desc ?? item.description}</td>
                    <td className="px-4 py-2 text-center">
                      {item.qty} {item.unit}
                    </td>
                    <td className="px-4 py-2 text-right">${item.unitCost ?? item.unitPrice}</td>
                    <td className="px-4 py-2 text-right font-medium">${item.amount ?? item.total}</td>
                    <td className="px-4 py-2">{item.category}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Cost Summary</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span>Labor</span>
              <span>${cs.labor ?? 0}</span>
            </div>
            <div className="flex justify-between">
              <span>Material</span>
              <span>${cs.material ?? 0}</span>
            </div>
            <div className="flex justify-between">
              <span>Equipment</span>
              <span>${cs.equipment ?? 0}</span>
            </div>
            <div className="flex justify-between">
              <span>Sub</span>
              <span>${cs.sub ?? 0}</span>
            </div>
            <div className="flex justify-between border-t pt-2 font-bold">
              <span>Total</span>
              <span>${cs.total ?? 0}</span>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Approval Workflow</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            {ap.map((a: any, i: number) => (
              <React.Fragment key={a.role ?? i}>
                <div className="flex items-center gap-2">
                  {a.status === "Approved" ? (
                    <CheckCircle2 className="h-5 w-5 text-green-500" />
                  ) : (
                    <Clock className="h-5 w-5 text-muted-foreground" />
                  )}
                  <div>
                    <div className="text-sm font-medium">{a.role}</div>
                    <div className="text-xs text-muted-foreground">
                      {a.status === "Approved" ? a.name + " - " + a.date : a.status}
                    </div>
                  </div>
                </div>
                {i < ap.length - 1 && <div className="h-px w-8 bg-border" />}
              </React.Fragment>
            ))}
          </div>
        </CardContent>
      </Card>

      {changeOrder.scheduleImpact != null && (
        <Card>
          <CardHeader>
            <CardTitle>
              <Calendar className="h-4 w-4 inline mr-2" />
              Schedule Impact
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm">
              This change order adds{" "}
              <span className="font-bold text-orange-600">
                {changeOrder.scheduleImpact} calendar days
              </span>{" "}
              to the project schedule.
            </p>
          </CardContent>
        </Card>
      )}

      {changeOrder.aiAnalysis && (
        <Card className="border-blue-200 bg-blue-50/30">
          <CardHeader>
            <CardTitle className="text-blue-700">
              <Brain className="h-4 w-4 inline mr-2" />
              AI Cost Analysis
            </CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-blue-800 space-y-2">
            <p>{changeOrder.aiAnalysis}</p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
