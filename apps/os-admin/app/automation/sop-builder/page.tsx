'use client'

import Link from 'next/link'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { ProtectedRoute } from '@/components/auth/protected-route'
import { AppLayout } from '@/components/layout/app-layout'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card'
import {
  ArrowLeft,
  Plus,
  Search,
  ChevronDown,
  ChevronRight,
  Trash2,
  Play,
  Pause,
  CheckCircle2,
  Clock,
  Loader2,
  Zap,
  FileText,
} from 'lucide-react'
import { apiRequest } from '@/lib/api'

// ── Types ──

interface SOPStep {
  id: string
  name: string
  description?: string
  order: number
  mandatory: boolean
  estimatedMinutes?: number
  requiredIntegration?: string
}

interface SOPPhase {
  id: string
  name: string
  description?: string
  order: number
  entryCondition?: string
  exitCondition?: string
  steps: SOPStep[]
}

interface SOPTemplate {
  id: string
  name: string
  description?: string
  projectType: string
  version: number
  status: string
  active: boolean
  createdAt: string
  updatedAt: string
  phases: SOPPhase[]
}

type View = 'list' | 'detail' | 'create'

const PROJECT_TYPES = [
  { value: 'KITCHEN', label: 'Kitchen Renovation' },
  { value: 'BATHROOM', label: 'Bathroom Renovation' },
  { value: 'ADDITION', label: 'Home Addition' },
  { value: 'NEW_CONSTRUCTION', label: 'New Construction' },
  { value: 'RENOVATION', label: 'General Renovation' },
  { value: 'CUSTOM', label: 'Custom Project' },
]

const INTEGRATIONS = [
  { value: '', label: 'None' },
  { value: 'm-permits-inspections', label: 'Permits Module' },
  { value: 'm-finance-trust', label: 'Escrow Module' },
  { value: 'm-project-owner', label: 'Homeowner Approval' },
  { value: 'm-marketplace', label: 'Contractor Assignment' },
  { value: 'm-architect', label: 'Architect Services' },
  { value: 'm-engineer', label: 'Engineering Services' },
]

const STATUS_COLORS: Record<string, string> = {
  DRAFT: 'bg-gray-100 text-gray-700',
  ACTIVE: 'bg-green-100 text-green-700',
  ARCHIVED: 'bg-yellow-100 text-yellow-700',
}

// ── Page ──

export default function SOPBuilderPage() {
  const [view, setView] = useState<View>('list')
  const [templates, setTemplates] = useState<SOPTemplate[]>([])
  const [selectedTemplate, setSelectedTemplate] = useState<SOPTemplate | null>(null)
  const [loading, setLoading] = useState(true)
  const [seeding, setSeeding] = useState(false)
  const [search, setSearch] = useState('')
  const [error, setError] = useState('')

  // ── Fetch Templates ──

  const fetchTemplates = useCallback(async () => {
    try {
      setLoading(true)
      setError('')
      const data = await apiRequest<{ templates: SOPTemplate[] }>('/sop/templates')
      setTemplates(data.templates || [])
    } catch (err: any) {
      setError(err.message || 'Failed to load templates')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchTemplates()
  }, [fetchTemplates])

  // ── Seed Default Template ──

  const seedDefault = async () => {
    try {
      setSeeding(true)
      setError('')
      await apiRequest('/sop/templates/seed', { method: 'POST' })
      await fetchTemplates()
    } catch (err: any) {
      setError(err.message || 'Failed to seed template')
    } finally {
      setSeeding(false)
    }
  }

  // ── Delete Template ──

  const deleteTemplate = async (id: string) => {
    if (!confirm('Delete this SOP template? This cannot be undone.')) return
    try {
      await apiRequest(`/sop/templates/${id}`, { method: 'DELETE' })
      setTemplates((prev) => prev.filter((t) => t.id !== id))
      if (selectedTemplate?.id === id) {
        setSelectedTemplate(null)
        setView('list')
      }
    } catch (err: any) {
      setError(err.message || 'Failed to delete')
    }
  }

  // ── Toggle Active ──

  const toggleActive = async (template: SOPTemplate) => {
    try {
      await apiRequest(`/sop/templates/${template.id}`, {
        method: 'PATCH',
        body: { active: !template.active, status: !template.active ? 'ACTIVE' : 'ARCHIVED' },
      })
      await fetchTemplates()
    } catch (err: any) {
      setError(err.message)
    }
  }

  // ── Filter ──

  const filtered = useMemo(() => {
    if (!search.trim()) return templates
    const q = search.trim().toLowerCase()
    return templates.filter(
      (t) =>
        t.name.toLowerCase().includes(q) ||
        t.projectType.toLowerCase().includes(q) ||
        t.description?.toLowerCase().includes(q)
    )
  }, [search, templates])

  // ── View: Detail ──

  const openDetail = (template: SOPTemplate) => {
    setSelectedTemplate(template)
    setView('detail')
  }

  return (
    <ProtectedRoute>
      <AppLayout>
        <div className="container mx-auto p-6 max-w-6xl">
          {view === 'list' && (
            <TemplateList
              templates={filtered}
              loading={loading}
              seeding={seeding}
              search={search}
              error={error}
              onSearch={setSearch}
              onSeed={seedDefault}
              onOpen={openDetail}
              onDelete={deleteTemplate}
              onToggleActive={toggleActive}
              onCreate={() => setView('create')}
            />
          )}

          {view === 'detail' && selectedTemplate && (
            <TemplateDetail
              template={selectedTemplate}
              onBack={() => { setView('list'); setSelectedTemplate(null) }}
              onDelete={() => deleteTemplate(selectedTemplate.id)}
              onToggleActive={() => toggleActive(selectedTemplate)}
              onRefresh={fetchTemplates}
            />
          )}

          {view === 'create' && (
            <TemplateCreate
              onBack={() => setView('list')}
              onCreated={async () => {
                await fetchTemplates()
                setView('list')
              }}
            />
          )}
        </div>
      </AppLayout>
    </ProtectedRoute>
  )
}

// ════════════════════════════════════════════════════════════════
// Template List
// ════════════════════════════════════════════════════════════════

function TemplateList({
  templates, loading, seeding, search, error,
  onSearch, onSeed, onOpen, onDelete, onToggleActive, onCreate,
}: {
  templates: SOPTemplate[]
  loading: boolean
  seeding: boolean
  search: string
  error: string
  onSearch: (s: string) => void
  onSeed: () => void
  onOpen: (t: SOPTemplate) => void
  onDelete: (id: string) => void
  onToggleActive: (t: SOPTemplate) => void
  onCreate: () => void
}) {
  return (
    <>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <Link href="/automation">
            <Button variant="ghost" size="sm" className="mb-2">
              <ArrowLeft className="mr-2 h-4 w-4" /> Back to Automation
            </Button>
          </Link>
          <h1 className="text-3xl font-bold">SOP Builder</h1>
          <p className="text-gray-600 mt-1">Create and manage Standard Operating Procedure templates</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={onSeed} disabled={seeding}>
            {seeding ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Zap className="mr-2 h-4 w-4" />}
            Seed Default
          </Button>
          <Button onClick={onCreate}>
            <Plus className="mr-2 h-4 w-4" /> New Template
          </Button>
        </div>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">{error}</div>
      )}

      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search templates by name, type, or description..."
              value={search}
              onChange={(e) => onSearch(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      <div className="bg-white rounded-lg shadow-sm border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Template</TableHead>
              <TableHead>Project Type</TableHead>
              <TableHead>Phases</TableHead>
              <TableHead>Steps</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Version</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-10">
                  <Loader2 className="h-6 w-6 animate-spin mx-auto text-gray-400" />
                </TableCell>
              </TableRow>
            ) : templates.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-10 text-gray-500">
                  No SOP templates yet. Click "Seed Default" to create the multifamily new construction template, or "New Template" to build your own.
                </TableCell>
              </TableRow>
            ) : (
              templates.map((t) => {
                const totalSteps = t.phases?.reduce((sum, p) => sum + (p.steps?.length || 0), 0) || 0
                return (
                  <TableRow key={t.id} className="cursor-pointer hover:bg-gray-50" onClick={() => onOpen(t)}>
                    <TableCell>
                      <div className="font-medium">{t.name}</div>
                      {t.description && <div className="text-xs text-gray-500 mt-0.5 line-clamp-1">{t.description}</div>}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{t.projectType.replace(/_/g, ' ')}</Badge>
                    </TableCell>
                    <TableCell>{t.phases?.length || 0}</TableCell>
                    <TableCell>{totalSteps}</TableCell>
                    <TableCell>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${STATUS_COLORS[t.status] || 'bg-gray-100'}`}>
                        {t.status}
                      </span>
                    </TableCell>
                    <TableCell>v{t.version}</TableCell>
                    <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                      <Button variant="ghost" size="sm" onClick={() => onToggleActive(t)}>
                        {t.active ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                      </Button>
                      <Button variant="ghost" size="sm" className="text-red-500" onClick={() => onDelete(t.id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                )
              })
            )}
          </TableBody>
        </Table>
      </div>
    </>
  )
}

// ════════════════════════════════════════════════════════════════
// Template Detail (Read-only view with expandable phases/steps)
// ════════════════════════════════════════════════════════════════

function TemplateDetail({
  template, onBack, onDelete, onToggleActive, onRefresh,
}: {
  template: SOPTemplate
  onBack: () => void
  onDelete: () => void
  onToggleActive: () => void
  onRefresh: () => void
}) {
  const [expandedPhases, setExpandedPhases] = useState<Set<string>>(new Set())

  const togglePhase = (id: string) => {
    setExpandedPhases((prev) => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  const expandAll = () => {
    setExpandedPhases(new Set(template.phases.map((p) => p.id)))
  }

  const collapseAll = () => {
    setExpandedPhases(new Set())
  }

  const totalSteps = template.phases.reduce((sum, p) => sum + (p.steps?.length || 0), 0)
  const totalMinutes = template.phases.reduce(
    (sum, p) => sum + (p.steps?.reduce((s, st) => s + (st.estimatedMinutes || 0), 0) || 0),
    0
  )

  return (
    <>
      <div className="mb-6">
        <Button variant="ghost" size="sm" className="mb-2" onClick={onBack}>
          <ArrowLeft className="mr-2 h-4 w-4" /> Back to Templates
        </Button>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">{template.name}</h1>
            {template.description && <p className="text-gray-600 mt-1">{template.description}</p>}
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={onToggleActive}>
              {template.active ? <><Pause className="mr-2 h-4 w-4" /> Deactivate</> : <><Play className="mr-2 h-4 w-4" /> Activate</>}
            </Button>
            <Button variant="outline" className="text-red-600 border-red-200" onClick={onDelete}>
              <Trash2 className="mr-2 h-4 w-4" /> Delete
            </Button>
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">{template.phases.length}</div>
            <div className="text-sm text-gray-500">Phases</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">{totalSteps}</div>
            <div className="text-sm text-gray-500">Steps</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">{Math.round(totalMinutes / 60)}h {totalMinutes % 60}m</div>
            <div className="text-sm text-gray-500">Est. Duration</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${STATUS_COLORS[template.status] || 'bg-gray-100'}`}>
                {template.status}
              </span>
            </div>
            <div className="text-sm text-gray-500 mt-1">v{template.version} | {template.projectType.replace(/_/g, ' ')}</div>
          </CardContent>
        </Card>
      </div>

      {/* Phases */}
      <div className="flex justify-between items-center mb-3">
        <h2 className="text-lg font-semibold">Phases & Steps</h2>
        <div className="flex gap-2">
          <Button variant="ghost" size="sm" onClick={expandAll}>Expand All</Button>
          <Button variant="ghost" size="sm" onClick={collapseAll}>Collapse All</Button>
        </div>
      </div>

      <div className="space-y-3">
        {template.phases
          .sort((a, b) => a.order - b.order)
          .map((phase) => {
            const isExpanded = expandedPhases.has(phase.id)
            const phaseMinutes = phase.steps?.reduce((s, st) => s + (st.estimatedMinutes || 0), 0) || 0
            return (
              <Card key={phase.id}>
                <div
                  className="px-6 py-4 flex items-center justify-between cursor-pointer hover:bg-gray-50"
                  onClick={() => togglePhase(phase.id)}
                >
                  <div className="flex items-center gap-3">
                    {isExpanded ? <ChevronDown className="h-5 w-5 text-gray-400" /> : <ChevronRight className="h-5 w-5 text-gray-400" />}
                    <div>
                      <div className="font-medium">
                        Phase {phase.order}: {phase.name}
                      </div>
                      {phase.description && <div className="text-sm text-gray-500">{phase.description}</div>}
                    </div>
                  </div>
                  <div className="flex items-center gap-4 text-sm text-gray-500">
                    <span>{phase.steps?.length || 0} steps</span>
                    {phaseMinutes > 0 && (
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" /> {phaseMinutes}m
                      </span>
                    )}
                  </div>
                </div>

                {isExpanded && (
                  <div className="px-6 pb-4 border-t">
                    {phase.entryCondition && (
                      <div className="mt-3 text-xs text-gray-500">
                        <span className="font-medium">Entry:</span> {phase.entryCondition}
                      </div>
                    )}
                    {phase.exitCondition && (
                      <div className="text-xs text-gray-500 mb-3">
                        <span className="font-medium">Exit:</span> {phase.exitCondition}
                      </div>
                    )}
                    <table className="w-full mt-2">
                      <thead>
                        <tr className="text-xs text-gray-500 border-b">
                          <th className="text-left py-2 w-8">#</th>
                          <th className="text-left py-2">Step</th>
                          <th className="text-left py-2 w-24">Required</th>
                          <th className="text-left py-2 w-20">Est.</th>
                          <th className="text-left py-2 w-40">Integration</th>
                        </tr>
                      </thead>
                      <tbody>
                        {phase.steps
                          ?.sort((a, b) => a.order - b.order)
                          .map((step) => (
                            <tr key={step.id} className="border-b last:border-0 text-sm">
                              <td className="py-2 text-gray-400">{step.order}</td>
                              <td className="py-2">
                                <div className="font-medium">{step.name}</div>
                                {step.description && <div className="text-xs text-gray-500">{step.description}</div>}
                              </td>
                              <td className="py-2">
                                {step.mandatory ? (
                                  <Badge variant="outline" className="text-xs bg-red-50 text-red-600 border-red-200">Required</Badge>
                                ) : (
                                  <Badge variant="outline" className="text-xs">Optional</Badge>
                                )}
                              </td>
                              <td className="py-2 text-gray-500">
                                {step.estimatedMinutes ? `${step.estimatedMinutes}m` : '-'}
                              </td>
                              <td className="py-2">
                                {step.requiredIntegration ? (
                                  <Badge variant="outline" className="text-xs">
                                    {INTEGRATIONS.find((i) => i.value === step.requiredIntegration)?.label || step.requiredIntegration}
                                  </Badge>
                                ) : (
                                  <span className="text-gray-400 text-xs">-</span>
                                )}
                              </td>
                            </tr>
                          ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </Card>
            )
          })}
      </div>
    </>
  )
}

// ════════════════════════════════════════════════════════════════
// Template Create (Full builder form)
// ════════════════════════════════════════════════════════════════

interface PhaseInput {
  name: string
  description: string
  entryCondition: string
  exitCondition: string
  steps: StepInput[]
}

interface StepInput {
  name: string
  description: string
  mandatory: boolean
  estimatedMinutes: number
  requiredIntegration: string
}

function TemplateCreate({ onBack, onCreated }: { onBack: () => void; onCreated: () => void }) {
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [projectType, setProjectType] = useState('NEW_CONSTRUCTION')
  const [phases, setPhases] = useState<PhaseInput[]>([
    { name: '', description: '', entryCondition: '', exitCondition: '', steps: [{ name: '', description: '', mandatory: true, estimatedMinutes: 30, requiredIntegration: '' }] },
  ])
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const addPhase = () => {
    setPhases((prev) => [
      ...prev,
      { name: '', description: '', entryCondition: '', exitCondition: '', steps: [{ name: '', description: '', mandatory: true, estimatedMinutes: 30, requiredIntegration: '' }] },
    ])
  }

  const removePhase = (idx: number) => {
    if (phases.length <= 1) return
    setPhases((prev) => prev.filter((_, i) => i !== idx))
  }

  const updatePhase = (idx: number, field: keyof PhaseInput, value: any) => {
    setPhases((prev) => prev.map((p, i) => (i === idx ? { ...p, [field]: value } : p)))
  }

  const addStep = (phaseIdx: number) => {
    setPhases((prev) =>
      prev.map((p, i) =>
        i === phaseIdx
          ? { ...p, steps: [...p.steps, { name: '', description: '', mandatory: true, estimatedMinutes: 30, requiredIntegration: '' }] }
          : p
      )
    )
  }

  const removeStep = (phaseIdx: number, stepIdx: number) => {
    setPhases((prev) =>
      prev.map((p, i) =>
        i === phaseIdx ? { ...p, steps: p.steps.filter((_, si) => si !== stepIdx) } : p
      )
    )
  }

  const updateStep = (phaseIdx: number, stepIdx: number, field: keyof StepInput, value: any) => {
    setPhases((prev) =>
      prev.map((p, i) =>
        i === phaseIdx
          ? { ...p, steps: p.steps.map((s, si) => (si === stepIdx ? { ...s, [field]: value } : s)) }
          : p
      )
    )
  }

  const handleSave = async () => {
    if (!name.trim()) { setError('Template name is required'); return }
    if (phases.some((p) => !p.name.trim())) { setError('All phases must have a name'); return }
    if (phases.some((p) => p.steps.some((s) => !s.name.trim()))) { setError('All steps must have a name'); return }

    try {
      setSaving(true)
      setError('')
      await apiRequest('/sop/templates', {
        method: 'POST',
        body: {
          name,
          description: description || undefined,
          projectType,
          phases: phases.map((p, pi) => ({
            name: p.name,
            description: p.description || undefined,
            order: pi + 1,
            entryCondition: p.entryCondition || undefined,
            exitCondition: p.exitCondition || undefined,
            steps: p.steps.map((s, si) => ({
              name: s.name,
              description: s.description || undefined,
              order: si + 1,
              mandatory: s.mandatory,
              estimatedMinutes: s.estimatedMinutes || undefined,
              requiredIntegration: s.requiredIntegration || undefined,
            })),
          })),
        },
      })
      onCreated()
    } catch (err: any) {
      setError(err.message || 'Failed to create template')
    } finally {
      setSaving(false)
    }
  }

  return (
    <>
      <div className="mb-6">
        <Button variant="ghost" size="sm" className="mb-2" onClick={onBack}>
          <ArrowLeft className="mr-2 h-4 w-4" /> Back to Templates
        </Button>
        <h1 className="text-3xl font-bold">Create SOP Template</h1>
        <p className="text-gray-600 mt-1">Define phases and steps for a new Standard Operating Procedure</p>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">{error}</div>
      )}

      {/* Template Info */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Template Info</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Name</Label>
              <Input placeholder="e.g. Multifamily New Construction SOP" value={name} onChange={(e) => setName(e.target.value)} />
            </div>
            <div>
              <Label>Project Type</Label>
              <select
                className="w-full border rounded-md px-3 py-2 text-sm"
                value={projectType}
                onChange={(e) => setProjectType(e.target.value)}
              >
                {PROJECT_TYPES.map((pt) => (
                  <option key={pt.value} value={pt.value}>{pt.label}</option>
                ))}
              </select>
            </div>
          </div>
          <div>
            <Label>Description</Label>
            <Textarea placeholder="Describe the purpose and scope of this SOP..." value={description} onChange={(e) => setDescription(e.target.value)} rows={2} />
          </div>
        </CardContent>
      </Card>

      {/* Phases */}
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-lg font-semibold">Phases ({phases.length})</h2>
        <Button variant="outline" size="sm" onClick={addPhase}>
          <Plus className="mr-2 h-4 w-4" /> Add Phase
        </Button>
      </div>

      <div className="space-y-4 mb-6">
        {phases.map((phase, pi) => (
          <Card key={pi}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">Phase {pi + 1}</CardTitle>
                {phases.length > 1 && (
                  <Button variant="ghost" size="sm" className="text-red-500" onClick={() => removePhase(pi)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Phase Name</Label>
                  <Input placeholder="e.g. Pre-Construction" value={phase.name} onChange={(e) => updatePhase(pi, 'name', e.target.value)} />
                </div>
                <div>
                  <Label>Description</Label>
                  <Input placeholder="Brief description..." value={phase.description} onChange={(e) => updatePhase(pi, 'description', e.target.value)} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Entry Condition</Label>
                  <Input placeholder="When to enter this phase..." value={phase.entryCondition} onChange={(e) => updatePhase(pi, 'entryCondition', e.target.value)} />
                </div>
                <div>
                  <Label>Exit Condition</Label>
                  <Input placeholder="When this phase is complete..." value={phase.exitCondition} onChange={(e) => updatePhase(pi, 'exitCondition', e.target.value)} />
                </div>
              </div>

              {/* Steps */}
              <div className="mt-4">
                <div className="flex items-center justify-between mb-2">
                  <Label className="text-sm font-medium">Steps ({phase.steps.length})</Label>
                  <Button variant="ghost" size="sm" onClick={() => addStep(pi)}>
                    <Plus className="mr-1 h-3 w-3" /> Step
                  </Button>
                </div>
                <div className="space-y-2">
                  {phase.steps.map((step, si) => (
                    <div key={si} className="flex items-start gap-2 p-3 border rounded-lg bg-gray-50">
                      <span className="text-xs text-gray-400 mt-2 w-6">{si + 1}.</span>
                      <div className="flex-1 grid grid-cols-12 gap-2">
                        <div className="col-span-4">
                          <Input
                            placeholder="Step name"
                            value={step.name}
                            onChange={(e) => updateStep(pi, si, 'name', e.target.value)}
                            className="text-sm"
                          />
                        </div>
                        <div className="col-span-3">
                          <select
                            className="w-full border rounded-md px-2 py-2 text-sm"
                            value={step.requiredIntegration}
                            onChange={(e) => updateStep(pi, si, 'requiredIntegration', e.target.value)}
                          >
                            {INTEGRATIONS.map((i) => (
                              <option key={i.value} value={i.value}>{i.label}</option>
                            ))}
                          </select>
                        </div>
                        <div className="col-span-2">
                          <Input
                            type="number"
                            placeholder="Min"
                            value={step.estimatedMinutes}
                            onChange={(e) => updateStep(pi, si, 'estimatedMinutes', Number(e.target.value))}
                            className="text-sm"
                          />
                        </div>
                        <div className="col-span-2 flex items-center gap-2">
                          <input
                            type="checkbox"
                            checked={step.mandatory}
                            onChange={(e) => updateStep(pi, si, 'mandatory', e.target.checked)}
                            className="rounded"
                          />
                          <span className="text-xs text-gray-600">Required</span>
                        </div>
                        <div className="col-span-1 flex items-center justify-end">
                          {phase.steps.length > 1 && (
                            <Button variant="ghost" size="sm" className="text-red-400 h-8 w-8 p-0" onClick={() => removeStep(pi, si)}>
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Save */}
      <div className="flex justify-end gap-3">
        <Button variant="outline" onClick={onBack}>Cancel</Button>
        <Button onClick={handleSave} disabled={saving}>
          {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <FileText className="mr-2 h-4 w-4" />}
          Create Template
        </Button>
      </div>
    </>
  )
}
