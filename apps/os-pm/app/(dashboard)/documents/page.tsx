"use client"

import * as React from "react"
import { Download, FileSignature, FileText, Plus, ShieldCheck } from "lucide-react"

import { DocumentUpload } from "@/components/projects/DocumentUpload"
import { Button } from "@kealee/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@kealee/ui/card"
import { Input } from "@kealee/ui/input"
import { cn } from "@/lib/utils"

type DocTemplate = { id: string; name: string; description: string; tags: string[] }
type SignRequest = { id: string; docName: string; recipient: string; status: "draft" | "sent" | "completed"; sentAt?: string }

function uid(prefix: string) {
  return `${prefix}_${Math.random().toString(16).slice(2)}`
}

function toCsv(rows: Record<string, string>[]) {
  if (!rows.length) return ""
  const headers = Object.keys(rows[0])
  const escape = (v: string) => {
    const needs = /[",\n]/.test(v)
    const escaped = v.replaceAll('"', '""')
    return needs ? `"${escaped}"` : escaped
  }
  return [headers.join(","), ...rows.map((r) => headers.map((h) => escape(r[h] ?? "")).join(","))].join("\n")
}

function downloadText(text: string, filename: string, mime = "text/plain;charset=utf-8") {
  const blob = new Blob([text], { type: mime })
  const url = URL.createObjectURL(blob)
  const a = document.createElement("a")
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

export default function DocumentsPage() {
  const [query, setQuery] = React.useState("")
  const templates: DocTemplate[] = React.useMemo(
    () => [
      { id: "tpl-1", name: "Change Order", description: "Standard change order template.", tags: ["contract", "scope"] },
      { id: "tpl-2", name: "RFI", description: "Request for information form.", tags: ["engineering", "clarification"] },
      { id: "tpl-3", name: "Submittal Cover Sheet", description: "Covers permit / plan submittals.", tags: ["permits"] },
      { id: "tpl-4", name: "Lien Waiver", description: "Conditional/unconditional waiver.", tags: ["finance", "legal"] },
    ],
    []
  )

  const [signRequests, setSignRequests] = React.useState<SignRequest[]>([
    { id: "s1", docName: "Change Order - CO-12.pdf", recipient: "client@company.com", status: "sent", sentAt: "2026-01-10 14:05" },
    { id: "s2", docName: "Lien Waiver - Draw 2.pdf", recipient: "gc@company.com", status: "completed", sentAt: "2026-01-07 09:12" },
  ])

  const filteredTemplates = React.useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return templates
    return templates.filter((t) => t.name.toLowerCase().includes(q) || t.tags.some((x) => x.toLowerCase().includes(q)))
  }, [templates, query])

  function exportTemplates() {
    const rows: Record<string, string>[] = templates.map((t) => ({
      id: t.id,
      name: t.name,
      description: t.description,
      tags: t.tags.join("|"),
    }))
    downloadText(toCsv(rows), `document-templates-${new Date().toISOString().slice(0, 10)}.csv`, "text/csv;charset=utf-8")
  }

  function createSignRequest() {
    const req: SignRequest = {
      id: uid("sign"),
      docName: "New signing request (placeholder)",
      recipient: "client@company.com",
      status: "draft",
    }
    setSignRequests((prev) => [req, ...prev])
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold">Documents</h1>
          <p className="text-neutral-600 mt-1">Global repository + templates + signing workflow (DocuSign placeholder).</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" size="sm" onClick={exportTemplates}>
            <Download className="h-4 w-4" />
            Export templates
          </Button>
          <Button size="sm" onClick={createSignRequest}>
            <Plus className="h-4 w-4" />
            New signing request
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="xl:col-span-2 space-y-6">
          <Card className="py-0">
            <CardHeader>
              <CardTitle className="text-base">Global document repository</CardTitle>
            </CardHeader>
            <CardContent className="pb-4">
              <DocumentUpload projectId="global" />
            </CardContent>
          </Card>

          <Card className="py-0">
            <CardHeader>
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <CardTitle className="text-base">Template library</CardTitle>
                <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search templates…" className="sm:w-64" />
              </div>
            </CardHeader>
            <CardContent className="pb-4 space-y-3">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {filteredTemplates.map((t) => (
                  <div key={t.id} className="rounded-xl border bg-white p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="font-medium text-neutral-900">{t.name}</div>
                        <div className="text-sm text-neutral-600 mt-1">{t.description}</div>
                        <div className="mt-2 flex flex-wrap gap-2">
                          {t.tags.map((tag) => (
                            <span
                              key={tag}
                              className="inline-flex items-center rounded-full border bg-neutral-50 px-2.5 py-0.5 text-xs font-medium text-neutral-700"
                            >
                              {tag}
                            </span>
                          ))}
                        </div>
                      </div>
                      <div className="flex flex-col gap-2">
                        <Button variant="outline" size="sm" onClick={() => alert("Open template (placeholder)")}>
                          <FileText className="h-4 w-4" />
                          Open
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => alert("Create doc from template (placeholder)")}>
                          Use
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
                {!filteredTemplates.length ? (
                  <div className="rounded-xl border bg-white p-6 text-sm text-neutral-600">No templates match.</div>
                ) : null}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card className="py-0">
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <ShieldCheck className="h-4 w-4" /> Document signing (DocuSign)
              </CardTitle>
            </CardHeader>
            <CardContent className="pb-4 space-y-3">
              <div className="rounded-xl border bg-white p-4 text-sm text-neutral-700">
                <div className="font-medium text-neutral-900">Integration placeholder</div>
                <div className="mt-2 text-sm text-neutral-600">
                  Next step: create signing envelopes, send to recipients, track completion and store signed PDFs.
                </div>
              </div>

              <div className="rounded-xl border bg-white">
                <div className="px-4 py-3 border-b text-sm font-medium text-neutral-900">Signing requests</div>
                <ul className="divide-y">
                  {signRequests.map((s) => (
                    <li key={s.id} className="px-4 py-3">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <div className="font-medium text-neutral-900 truncate">{s.docName}</div>
                          <div className="text-xs text-neutral-600 mt-0.5">
                            to: {s.recipient} {s.sentAt ? `• ${s.sentAt}` : ""}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <span
                            className={cn(
                              "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium",
                              s.status === "completed"
                                ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                                : s.status === "sent"
                                  ? "bg-amber-50 text-amber-700 border-amber-200"
                                  : "bg-neutral-50 text-neutral-700 border-neutral-200"
                            )}
                          >
                            {s.status}
                          </span>
                          <Button variant="outline" size="sm" onClick={() => alert("Open signing request (placeholder)")}>
                            <FileSignature className="h-4 w-4" />
                            Open
                          </Button>
                        </div>
                      </div>
                    </li>
                  ))}
                  {!signRequests.length ? (
                    <li className="px-4 py-8 text-center text-sm text-neutral-600">No signing requests.</li>
                  ) : null}
                </ul>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

