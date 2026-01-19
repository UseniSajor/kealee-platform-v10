'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { api, type ProjectCategory } from '@/lib/api'
import { uploadFileToS3 } from '@/lib/s3-upload'
import { checkReadinessGates } from '@/lib/readiness-gates'

type StepId = 1 | 2 | 3 | 4

const CATEGORY_OPTIONS = [
  { value: 'KITCHEN', label: 'Kitchen' },
  { value: 'BATHROOM', label: 'Bathroom' },
  { value: 'ADDITION', label: 'Addition' },
  { value: 'NEW_CONSTRUCTION', label: 'New construction' },
  { value: 'RENOVATION', label: 'Renovation' },
  { value: 'OTHER', label: 'Other' },
] as const

const STEPS: Array<{ id: StepId; label: string }> = [
  { id: 1, label: 'Basic Info' },
  { id: 2, label: 'Scope' },
  { id: 3, label: 'Documents' },
  { id: 4, label: 'Review & Submit' },
]

function cx(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(' ')
}

export default function NewProjectWizardPage() {
  const router = useRouter()

  const [step, setStep] = useState<StepId>(1)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [projectId, setProjectId] = useState<string | null>(null)

  // Step 1: Basic Info
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [category, setCategory] = useState<ProjectCategory>('KITCHEN')
  const [location, setLocation] = useState('')
  const [budget, setBudget] = useState<string>('')

  // Step 2: Scope
  const [workType, setWorkType] = useState('')
  const [timeline, setTimeline] = useState('')
  const [requirements, setRequirements] = useState('')

  // Step 3: Documents
  const [sowFile, setSowFile] = useState<File | null>(null)
  const [plansFile, setPlansFile] = useState<File | null>(null)
  const [permitsFile, setPermitsFile] = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)
  const [uploadedFiles, setUploadedFiles] = useState<Array<{ url: string; fileName: string }>>([])

  // Step 4: Review
  const [gates, setGates] = useState<any>(null)

  // Load draft from localStorage
  useEffect(() => {
    const savedProjectId = window.localStorage.getItem('kealee:projectWizard:projectId')
    if (savedProjectId) setProjectId(savedProjectId)
    const savedStep = Number(window.localStorage.getItem('kealee:projectWizard:step') || '1') as StepId
    if (savedStep >= 1 && savedStep <= 4) setStep(savedStep)

    try {
      const savedState = window.localStorage.getItem('kealee:projectWizard:formState')
      if (savedState) {
        const state = JSON.parse(savedState)
        if (state.name) setName(state.name)
        if (state.description) setDescription(state.description)
        if (state.category) setCategory(state.category)
        if (state.location) setLocation(state.location)
        if (state.budget) setBudget(state.budget)
        if (state.workType) setWorkType(state.workType)
        if (state.timeline) setTimeline(state.timeline)
        if (state.requirements) setRequirements(state.requirements)
      }
    } catch {
      // Ignore parse errors
    }
  }, [])

  // Auto-save form state
  useEffect(() => {
    const formState = {
      name,
      description,
      category,
      location,
      budget,
      workType,
      timeline,
      requirements,
    }
    window.localStorage.setItem('kealee:projectWizard:formState', JSON.stringify(formState))
  }, [name, description, category, location, budget, workType, timeline, requirements])

  useEffect(() => {
    if (projectId) window.localStorage.setItem('kealee:projectWizard:projectId', projectId)
    window.localStorage.setItem('kealee:projectWizard:step', String(step))
  }, [projectId, step])

  // Load readiness gates on step 4
  useEffect(() => {
    if (step === 4 && projectId) {
      checkReadinessGates(projectId)
        .then(setGates)
        .catch(() => setGates(null))
    }
  }, [step, projectId])

  async function handleNext() {
    setError(null)

    try {
      setSaving(true)

      if (step === 1) {
        if (!name.trim()) throw new Error('Project name is required.')
        if (!location.trim()) throw new Error('Location is required.')
        if (!budget.trim() || Number(budget) <= 0) throw new Error('Valid budget is required.')

        if (!projectId) {
          const res = await api.createProject({
            name: name.trim(),
            description: description.trim() || undefined,
            category,
            categoryMetadata: {
              location: location.trim(),
              budget: Number(budget),
            },
          })
          setProjectId(res.project.id)
        } else {
          await api.updateProject(projectId, {
            name: name.trim(),
            description: description.trim() || null,
            category,
            categoryMetadata: {
              location: location.trim(),
              budget: Number(budget),
            },
            budgetTotal: Number(budget),
          })
        }
      }

      if (step === 2) {
        if (!projectId) throw new Error('Missing project draft. Go back to Step 1.')
        if (!workType.trim()) throw new Error('Work type is required.')
        if (!timeline.trim()) throw new Error('Timeline is required.')

        await api.updateProject(projectId, {
          categoryMetadata: {
            workType: workType.trim(),
            timeline: timeline.trim(),
            requirements: requirements.trim() || null,
          },
        })
      }

      if (step === 3) {
        if (!projectId) throw new Error('Missing project draft. Go back to Step 1.')

        setUploading(true)
        const filesToUpload: File[] = []
        if (sowFile) filesToUpload.push(sowFile)
        if (plansFile) filesToUpload.push(plansFile)
        if (permitsFile) filesToUpload.push(permitsFile)

        if (filesToUpload.length > 0) {
          const uploads = await Promise.all(
            filesToUpload.map((file) =>
              uploadFileToS3(file, {
                projectId,
                documentType: file === sowFile ? 'SOW' : file === plansFile ? 'PLANS' : 'PERMITS',
              })
            )
          )
          setUploadedFiles(uploads)
        }
        setUploading(false)
      }

      if (step === 4) {
        if (!projectId) throw new Error('Missing project draft.')

        // Check readiness gates
        const gatesStatus = await checkReadinessGates(projectId)
        if (!gatesStatus.canAdvance) {
          throw new Error(`Cannot submit project. Please complete: ${gatesStatus.blockers.join(', ')}`)
        }

        // Submit project (change status from DRAFT to READINESS)
        await api.updateProject(projectId, {
          status: 'READINESS',
        })

        // Clear wizard state
        window.localStorage.removeItem('kealee:projectWizard:projectId')
        window.localStorage.removeItem('kealee:projectWizard:step')
        window.localStorage.removeItem('kealee:projectWizard:formState')

        router.push(`/projects/${projectId}`)
        return
      }

      setStep((s) => (Math.min(4, s + 1) as StepId))
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Something went wrong.')
    } finally {
      setSaving(false)
      setUploading(false)
    }
  }

  function handleBack() {
    setError(null)
    setStep((s) => (Math.max(1, s - 1) as StepId))
  }

  const stepTitle = useMemo(() => {
    switch (step) {
      case 1:
        return 'Basic Info'
      case 2:
        return 'Scope'
      case 3:
        return 'Documents'
      case 4:
        return 'Review & Submit'
    }
  }, [step])

  return (
    <main className="mx-auto w-full max-w-3xl px-3 py-4 sm:px-4 sm:py-6">
      <nav aria-label="Breadcrumb" className="text-xs sm:text-sm text-neutral-600">
        <ol className="flex flex-wrap items-center gap-1.5 sm:gap-2">
          <li>
            <Link className="underline underline-offset-4 touch-manipulation" href="/">
              Home
            </Link>
          </li>
          <li aria-hidden="true">/</li>
          <li className="text-neutral-800">Create project</li>
        </ol>
      </nav>

      <header className="mt-3 sm:mt-4">
        <h1 className="text-xl font-semibold text-neutral-900 sm:text-2xl">Project creation</h1>
        <p className="mt-1 text-xs sm:text-sm text-neutral-600">
          Step {step} of 4 — <span className="font-medium text-neutral-800">{stepTitle}</span>
        </p>
      </header>

      <div className="mt-3 sm:mt-4 space-y-2" aria-label="Step progress">
        <ol className="flex flex-wrap gap-1.5 sm:gap-2">
          {STEPS.map((s) => {
            const isCurrent = s.id === step
            const canGoBack = s.id < step
            return (
              <li key={s.id}>
                <button
                  type="button"
                  className={cx(
                    'touch-manipulation rounded-full border px-2.5 py-1.5 text-xs sm:px-3 sm:py-1 sm:text-sm',
                    'min-h-[44px] min-w-[44px]',
                    isCurrent ? 'border-neutral-900 text-neutral-900' : 'border-neutral-200 text-neutral-700',
                    canGoBack ? 'active:scale-95 hover:border-neutral-900' : 'opacity-70'
                  )}
                  onClick={() => {
                    if (!canGoBack) return
                    setError(null)
                    setStep(s.id)
                  }}
                  aria-current={isCurrent ? 'step' : undefined}
                  aria-disabled={!canGoBack && !isCurrent}
                  disabled={!canGoBack && !isCurrent}
                >
                  <span className="hidden sm:inline">{s.id}. </span>
                  <span className="sm:hidden">{s.id}</span>
                  <span className="hidden sm:inline">{s.label}</span>
                </button>
              </li>
            )
          })}
        </ol>
        <div className="grid grid-cols-4 gap-1.5 sm:gap-2" aria-hidden="true">
          {([1, 2, 3, 4] as const).map((s) => (
            <div
              key={s}
              className={cx('h-1.5 sm:h-2 rounded-full', s <= step ? 'bg-blue-600' : 'bg-neutral-200')}
            />
          ))}
        </div>
      </div>

      {error ? (
        <div className="mt-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800" role="alert">
          {error}
        </div>
      ) : null}

      <section className="mt-4 sm:mt-6 rounded-xl border border-neutral-200 bg-white p-3 shadow-sm sm:p-4 sm:p-6">
        {step === 1 ? (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-neutral-900" htmlFor="name">
                Project name *
              </label>
              <input
                id="name"
                className="mt-1 w-full rounded-lg border border-neutral-300 px-3 py-3 text-base sm:py-2 sm:text-sm"
                value={name}
                onChange={(e) => setName(e.target.value)}
                autoComplete="off"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-neutral-900" htmlFor="desc">
                Description (optional)
              </label>
              <textarea
                id="desc"
                className="mt-1 w-full rounded-lg border border-neutral-300 px-3 py-3 text-base sm:py-2 sm:text-sm"
                rows={4}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-neutral-900" htmlFor="location">
                Location *
              </label>
              <input
                id="location"
                className="mt-1 w-full rounded-lg border border-neutral-300 px-3 py-3 text-base sm:py-2 sm:text-sm"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="123 Main St, City, State ZIP"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-neutral-900" htmlFor="budget">
                Budget (USD) *
              </label>
              <input
                id="budget"
                className="mt-1 w-full rounded-lg border border-neutral-300 px-3 py-3 text-base sm:py-2 sm:text-sm"
                type="number"
                value={budget}
                onChange={(e) => setBudget(e.target.value)}
                placeholder="150000"
              />
            </div>

            <div>
              <div className="flex items-center justify-between gap-3">
                <label className="block text-sm font-medium text-neutral-900">Category</label>
              </div>
              <div className="mt-2 grid grid-cols-1 gap-2 xs:grid-cols-2 sm:grid-cols-3">
                {CATEGORY_OPTIONS.map((c) => {
                  const selected = c.value === category
                  return (
                    <button
                      key={c.value}
                      type="button"
                      className={cx(
                        'touch-manipulation rounded-lg border p-3 text-left active:scale-95',
                        'min-h-[60px]',
                        selected ? 'border-neutral-900 bg-neutral-50' : 'border-neutral-200'
                      )}
                      onClick={() => setCategory(c.value)}
                      aria-pressed={selected}
                    >
                      <div className="text-sm font-semibold text-neutral-900">{c.label}</div>
                    </button>
                  )
                })}
              </div>
            </div>
          </div>
        ) : step === 2 ? (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-neutral-900" htmlFor="workType">
                Work Type *
              </label>
              <input
                id="workType"
                className="mt-1 w-full rounded-lg border border-neutral-300 px-3 py-3 text-base sm:py-2 sm:text-sm"
                value={workType}
                onChange={(e) => setWorkType(e.target.value)}
                placeholder="e.g., Kitchen renovation, Bathroom remodel"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-neutral-900" htmlFor="timeline">
                Timeline *
              </label>
              <input
                id="timeline"
                className="mt-1 w-full rounded-lg border border-neutral-300 px-3 py-3 text-base sm:py-2 sm:text-sm"
                value={timeline}
                onChange={(e) => setTimeline(e.target.value)}
                placeholder="e.g., 3-4 months, Start: Jan 2024, End: Apr 2024"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-neutral-900" htmlFor="requirements">
                Requirements (optional)
              </label>
              <textarea
                id="requirements"
                className="mt-1 w-full rounded-lg border border-neutral-300 px-3 py-3 text-base sm:py-2 sm:text-sm"
                rows={6}
                value={requirements}
                onChange={(e) => setRequirements(e.target.value)}
                placeholder="Describe specific requirements, materials, finishes, etc."
              />
            </div>
          </div>
        ) : step === 3 ? (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-neutral-900" htmlFor="sow">
                Statement of Work (SOW)
              </label>
              <input
                id="sow"
                type="file"
                className="mt-1 w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm"
                accept=".pdf,.doc,.docx"
                onChange={(e) => setSowFile(e.target.files?.[0] || null)}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-neutral-900" htmlFor="plans">
                Plans & Drawings
              </label>
              <input
                id="plans"
                type="file"
                className="mt-1 w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm"
                accept=".pdf,.dwg,.dxf"
                onChange={(e) => setPlansFile(e.target.files?.[0] || null)}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-neutral-900" htmlFor="permits">
                Permits
              </label>
              <input
                id="permits"
                type="file"
                className="mt-1 w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm"
                accept=".pdf"
                onChange={(e) => setPermitsFile(e.target.files?.[0] || null)}
              />
            </div>

            {uploading && <div className="text-sm text-neutral-600">Uploading files...</div>}
            {uploadedFiles.length > 0 && (
              <div className="rounded-lg border bg-neutral-50 p-3">
                <div className="text-sm font-medium text-neutral-900">Uploaded Files:</div>
                <ul className="mt-2 space-y-1 text-sm text-neutral-700">
                  {uploadedFiles.map((f, i) => (
                    <li key={i}>✓ {f.fileName}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        ) : step === 4 ? (
          <div className="space-y-4">
            <div className="rounded-lg border bg-neutral-50 p-3">
              <h3 className="text-sm font-medium text-neutral-900">Project Summary</h3>
              <div className="mt-2 space-y-1 text-sm text-neutral-700">
                <div><strong>Name:</strong> {name}</div>
                <div><strong>Location:</strong> {location}</div>
                <div><strong>Budget:</strong> ${Number(budget).toLocaleString()}</div>
                <div><strong>Work Type:</strong> {workType}</div>
                <div><strong>Timeline:</strong> {timeline}</div>
              </div>
            </div>

            {gates && (
              <div className="rounded-lg border bg-blue-50 p-3">
                <h3 className="text-sm font-medium text-blue-900">Readiness Gates</h3>
                <div className="mt-2 space-y-2">
                  {gates.gates.map((gate: any) => (
                    <div key={gate.key} className="flex items-center justify-between text-sm">
                      <span className={gate.status === 'completed' ? 'text-green-700' : 'text-neutral-700'}>
                        {gate.name} {gate.required && '*'}
                      </span>
                      <span className={gate.status === 'completed' ? 'text-green-700 font-medium' : 'text-neutral-600'}>
                        {gate.completionPercentage}%
                      </span>
                    </div>
                  ))}
                </div>
                {!gates.canAdvance && (
                  <div className="mt-2 text-sm text-red-700">
                    <strong>Blockers:</strong> {gates.blockers.join(', ')}
                  </div>
                )}
              </div>
            )}

            <div className="text-sm text-neutral-600">
              Review all information above. Click "Submit" to create your project.
            </div>
          </div>
        ) : null}
      </section>

      <footer className="mt-4 flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between">
        <button
          type="button"
          className="touch-manipulation rounded-lg border border-neutral-300 px-4 py-3 text-base font-medium disabled:opacity-50 sm:py-2 sm:text-sm min-h-[44px]"
          onClick={handleBack}
          disabled={saving || step === 1}
        >
          Back
        </button>

        <button
          type="button"
          className="touch-manipulation rounded-lg bg-blue-600 px-6 py-3 text-base font-semibold text-white disabled:opacity-60 active:bg-blue-700 sm:py-2 sm:text-sm min-h-[44px]"
          onClick={handleNext}
          disabled={saving || uploading}
          aria-busy={saving || uploading}
        >
          {step === 4 ? 'Submit' : saving || uploading ? 'Saving…' : 'Next'}
        </button>
      </footer>
    </main>
  )
}
