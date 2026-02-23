"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { ArrowLeft, ClipboardCheck, Loader2, Save } from "lucide-react"
import { Button } from "@kealee/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@kealee/ui/card"
import { Input } from "@kealee/ui/input"
import { useCreateMobilization } from "@pm/hooks/useMobilization"
import { api } from "@pm/lib/api/index"

// ---------------------------------------------------------------------------
// Template definitions
// ---------------------------------------------------------------------------

interface TemplateItem {
  label: string
  status: "pending" | "complete"
  assignee?: string
  dueDate?: string
  notes?: string
}

interface Template {
  id: string
  name: string
  items: TemplateItem[]
}

const TEMPLATES: Template[] = [
  {
    id: "site-setup",
    name: "Site Setup",
    items: [
      { label: "Trailers", status: "pending" },
      { label: "Temp power", status: "pending" },
      { label: "Temp water", status: "pending" },
      { label: "Access roads", status: "pending" },
      { label: "Fencing", status: "pending" },
      { label: "Signage", status: "pending" },
      { label: "Dumpsters", status: "pending" },
    ],
  },
  {
    id: "utility-coordination",
    name: "Utility Coordination",
    items: [
      { label: "Electric service", status: "pending" },
      { label: "Water service", status: "pending" },
      { label: "Sewer connection", status: "pending" },
      { label: "Gas service", status: "pending" },
      { label: "Telecom/data", status: "pending" },
    ],
  },
  {
    id: "insurance-permits",
    name: "Insurance & Permits",
    items: [
      { label: "GL certificate", status: "pending" },
      { label: "Builder's risk", status: "pending" },
      { label: "Permit posting", status: "pending" },
      { label: "OSHA posting", status: "pending" },
      { label: "Business license", status: "pending" },
    ],
  },
  {
    id: "safety-setup",
    name: "Safety Setup",
    items: [
      { label: "First aid station", status: "pending" },
      { label: "Fire extinguishers", status: "pending" },
      { label: "Emergency contacts posted", status: "pending" },
      { label: "Site safety plan", status: "pending" },
      { label: "PPE station", status: "pending" },
    ],
  },
]

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

interface ProjectOption {
  id: string
  name: string
}

export default function NewMobilizationPage() {
  const router = useRouter()
  const createMobilization = useCreateMobilization()

  // ---- Form state ----
  const [selectedTemplateId, setSelectedTemplateId] = React.useState("")
  const [projectId, setProjectId] = React.useState("")
  const [name, setName] = React.useState("")
  const [assignee, setAssignee] = React.useState("")
  const [dueDate, setDueDate] = React.useState("")

  // ---- Projects dropdown ----
  const [projects, setProjects] = React.useState<ProjectOption[]>([])
  const [loadingProjects, setLoadingProjects] = React.useState(true)

  React.useEffect(() => {
    loadProjects()
  }, [])

  async function loadProjects() {
    try {
      const res = await api.pmProjects.list()
      const data = res as any
      const items =
        data?.projects ||
        data?.data?.projects ||
        data?.items ||
        data?.data ||
        []
      const mapped: ProjectOption[] = (Array.isArray(items) ? items : []).map((p: any) => ({
        id: p.id,
        name: p.name || p.title || "",
      }))
      setProjects(mapped)
    } catch (err) {
      console.error("Failed to load projects:", err)
    } finally {
      setLoadingProjects(false)
    }
  }

  // ---- Auto-generate name when project or template changes ----
  const selectedTemplate = TEMPLATES.find((t) => t.id === selectedTemplateId)
  const selectedProject = projects.find((p) => p.id === projectId)

  React.useEffect(() => {
    if (selectedTemplate && selectedProject) {
      setName(`${selectedTemplate.name} â€” ${selectedProject.name}`)
    } else if (selectedTemplate) {
      setName(selectedTemplate.name)
    }
  }, [selectedTemplateId, projectId, selectedTemplate?.name, selectedProject?.name])

  // ---- Submit ----
  function handleCreate() {
    if (!selectedTemplate || !projectId) return

    createMobilization.mutate(
      {
        name,
        projectId,
        templateId: selectedTemplateId,
        templateName: selectedTemplate.name,
        assignee,
        dueDate: dueDate || undefined,
        status: "Not Started",
        items: selectedTemplate.items.map((item) => ({
          label: item.label,
          status: "pending",
          assignee: "",
          dueDate: "",
          notes: "",
        })),
      },
      {
        onSuccess: () => {
          router.push("/pm/mobilization")
        },
      }
    )
  }

  return (
    <div className="space-y-6 max-w-3xl">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => window.history.back()}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <h1 className="text-xl font-bold">New Mobilization Checklist</h1>
      </div>

      {/* Project selection */}
      <Card>
        <CardHeader>
          <CardTitle>Project</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="text-sm font-medium">Select Project</label>
            {loadingProjects ? (
              <div className="flex items-center gap-2 mt-1 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                Loading projects...
              </div>
            ) : (
              <select
                value={projectId}
                onChange={(e) => setProjectId(e.target.value)}
                className="mt-1 flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              >
                <option value="">Select a project...</option>
                {projects.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Template selection */}
      <Card>
        <CardHeader>
          <CardTitle>Choose Template</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 sm:grid-cols-2">
            {TEMPLATES.map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => setSelectedTemplateId(t.id)}
                className={`flex flex-col rounded-lg border-2 p-4 text-left transition-colors ${
                  selectedTemplateId === t.id
                    ? "border-blue-500 bg-blue-50/50"
                    : "border-gray-200 hover:border-gray-300"
                }`}
              >
                <div className="flex items-center gap-2 mb-2">
                  <ClipboardCheck
                    className={`h-5 w-5 ${
                      selectedTemplateId === t.id ? "text-blue-600" : "text-gray-400"
                    }`}
                  />
                  <span className="font-medium">{t.name}</span>
                </div>
                <span className="text-xs text-muted-foreground">
                  {t.items.length} items: {t.items.map((i) => i.label).join(", ")}
                </span>
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Checklist details */}
      <Card>
        <CardHeader>
          <CardTitle>Checklist Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="text-sm font-medium">Checklist Name</label>
            <Input
              placeholder="Auto-generated from template + project"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="mt-1"
            />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="text-sm font-medium">Assignee</label>
              <Input
                placeholder="Person responsible..."
                value={assignee}
                onChange={(e) => setAssignee(e.target.value)}
                className="mt-1"
              />
            </div>
            <div>
              <label className="text-sm font-medium">Due Date</label>
              <Input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="mt-1"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Preview items */}
      {selectedTemplate && (
        <Card>
          <CardHeader>
            <CardTitle>Template Preview &mdash; {selectedTemplate.name}</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {selectedTemplate.items.map((item, idx) => (
                <li
                  key={idx}
                  className="flex items-center gap-3 rounded-md border px-3 py-2 text-sm"
                >
                  <div className="flex h-5 w-5 items-center justify-center rounded border border-gray-300 bg-white text-xs text-muted-foreground">
                    {idx + 1}
                  </div>
                  <span>{item.label}</span>
                  <span className="ml-auto rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-500">
                    Pending
                  </span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {/* Actions */}
      <div className="flex justify-end gap-3">
        <Button variant="outline" onClick={() => window.history.back()}>
          Cancel
        </Button>
        <Button
          disabled={createMobilization.isPending || !selectedTemplateId || !projectId || !name}
          onClick={handleCreate}
          className="gap-2"
        >
          {createMobilization.isPending ? (
            <Loader2 size={16} className="animate-spin" />
          ) : (
            <Save size={16} />
          )}
          {createMobilization.isPending ? "Creating..." : "Create Checklist"}
        </Button>
      </div>
    </div>
  )
}

