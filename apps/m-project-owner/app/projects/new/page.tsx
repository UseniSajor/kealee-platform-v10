'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { api, type ProjectCategory, type PropertySummary, type ReadinessItem } from '@/lib/api'

type StepId = 1 | 2 | 3 | 4 | 5

const CATEGORY_OPTIONS = [
  { value: 'KITCHEN', label: 'Kitchen' },
  { value: 'BATHROOM', label: 'Bathroom' },
  { value: 'ADDITION', label: 'Addition' },
  { value: 'NEW_CONSTRUCTION', label: 'New construction' },
  { value: 'RENOVATION', label: 'Renovation' },
  { value: 'OTHER', label: 'Other' },
] as const

const STEPS: Array<{ id: StepId; label: string }> = [
  { id: 1, label: 'Basic info' },
  { id: 2, label: 'Property' },
  { id: 3, label: 'Budget & timeline' },
  { id: 4, label: 'Team' },
  { id: 5, label: 'Readiness preview' },
]

function cx(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(' ')
}

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null
}

function readString(v: unknown): string | null {
  return typeof v === 'string' ? v : null
}

function readNumber(v: unknown): number | null {
  return typeof v === 'number' && Number.isFinite(v) ? v : null
}

export default function NewProjectWizardPage() {
  const router = useRouter()

  const [step, setStep] = useState<StepId>(1)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [projectId, setProjectId] = useState<string | null>(null)

  // Step 1
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [category, setCategory] = useState<ProjectCategory>('KITCHEN')
  const [additionSqFt, setAdditionSqFt] = useState<string>('')

  // Step 2
  const [propertyMode, setPropertyMode] = useState<'link' | 'create'>('link')
  const [propertyQuery, setPropertyQuery] = useState('')
  const [propertyResults, setPropertyResults] = useState<PropertySummary[]>([])
  const [propertyId, setPropertyId] = useState<string | null>(null)

  const [addr, setAddr] = useState('')
  const [addr2, setAddr2] = useState('')
  const [city, setCity] = useState('')
  const [state, setState] = useState('')
  const [zip, setZip] = useState('')
  const [duplicateWarning, setDuplicateWarning] = useState<string | null>(null)
  const [addressError, setAddressError] = useState<string | null>(null)
  const [latitude] = useState<number | null>(null)
  const [longitude] = useState<number | null>(null)

  // Lot details
  const [lotNumber, setLotNumber] = useState('')
  const [parcelNumber, setParcelNumber] = useState('')
  const [lotSizeSqFt, setLotSizeSqFt] = useState<string>('')
  const [yearBuilt, setYearBuilt] = useState<string>('')

  // Step 3
  const [budgetTotal, setBudgetTotal] = useState<string>('')
  const [startDate, setStartDate] = useState<string>('')
  const [endDate, setEndDate] = useState<string>('')

  // Step 4
  const [memberUserId, setMemberUserId] = useState('')
  const [memberRole, setMemberRole] = useState<'CONTRACTOR' | 'PROJECT_MANAGER' | 'MEMBER' | 'VIEWER'>('CONTRACTOR')
  const [members, setMembers] = useState<Array<{ userId: string; role: string }>>([])

  // Step 5
  const [readinessItems, setReadinessItems] = useState<ReadinessItem[]>([])

  // Prompt 1.8: Enhanced offline capability - load draft state (refresh-safe)
  useEffect(() => {
    const savedProjectId = window.localStorage.getItem('kealee:projectWizard:projectId')
    if (savedProjectId) setProjectId(savedProjectId)
    const savedStep = Number(window.localStorage.getItem('kealee:projectWizard:step') || '1') as StepId
    if (savedStep >= 1 && savedStep <= 5) setStep(savedStep)

    // Load all form state from localStorage for offline capability
    try {
      const savedState = window.localStorage.getItem('kealee:projectWizard:formState')
      if (savedState) {
        const state = JSON.parse(savedState)
        if (state.name) setName(state.name)
        if (state.description) setDescription(state.description)
        if (state.category) setCategory(state.category)
        if (state.additionSqFt) setAdditionSqFt(state.additionSqFt)
        if (state.propertyMode) setPropertyMode(state.propertyMode)
        if (state.propertyId) setPropertyId(state.propertyId)
        if (state.addr) setAddr(state.addr)
        if (state.city) setCity(state.city)
        if (state.state) setState(state.state)
        if (state.zip) setZip(state.zip)
        if (state.budgetTotal) setBudgetTotal(state.budgetTotal)
        if (state.startDate) setStartDate(state.startDate)
        if (state.endDate) setEndDate(state.endDate)
      }
    } catch {
      // Ignore parse errors
    }
  }, [])

  // Prompt 1.8: Auto-save form state to localStorage for offline capability
  useEffect(() => {
    const formState = {
      name,
      description,
      category,
      additionSqFt,
      propertyMode,
      propertyId,
      addr,
      city,
      state,
      zip,
      budgetTotal,
      startDate,
      endDate,
    }
    window.localStorage.setItem('kealee:projectWizard:formState', JSON.stringify(formState))
  }, [name, description, category, additionSqFt, propertyMode, propertyId, addr, city, state, zip, budgetTotal, startDate, endDate])

  useEffect(() => {
    if (projectId) window.localStorage.setItem('kealee:projectWizard:projectId', projectId)
    window.localStorage.setItem('kealee:projectWizard:step', String(step))
  }, [projectId, step])

  // If we have a project draft, try to rehydrate the form from API (resume wizard).
  useEffect(() => {
    if (!projectId) return
    let cancelled = false

    ;(async () => {
      try {
        const res = await api.getProject(projectId)
        if (cancelled) return

        const project = isRecord(res.project) ? res.project : null
        if (!project) return

        const pName = readString(project.name)
        const pDesc = readString(project.description)
        const pCategory = readString(project.category) as ProjectCategory | null
        const pCategoryMetadata = isRecord(project.categoryMetadata) ? project.categoryMetadata : null
        const pPropertyId = readString(project.propertyId)
        const pBudgetTotal = readNumber(project.budgetTotal)
        const pStartDateIso = readString(project.startDate)
        const pEndDateIso = readString(project.endDate)

        if (pName) setName(pName)
        setDescription(pDesc ?? '')
        if (pCategory) setCategory(pCategory)
        if (pCategory === 'ADDITION') {
          const v = readNumber(pCategoryMetadata?.additionSquareFeet)
          if (v !== null) setAdditionSqFt(String(v))
        }
        if (pPropertyId) setPropertyId(pPropertyId)

        if (pBudgetTotal !== null) setBudgetTotal(String(pBudgetTotal))

        // API returns ISO timestamps; the date input needs YYYY-MM-DD
        if (pStartDateIso) setStartDate(pStartDateIso.slice(0, 10))
        if (pEndDateIso) setEndDate(pEndDateIso.slice(0, 10))
      } catch {
        // If user isn't authenticated yet, or draft is missing, we just keep local state.
      }
    })()

    return () => {
      cancelled = true
    }
  }, [projectId])

  const stepTitle = useMemo(() => {
    switch (step) {
      case 1:
        return 'Basic info'
      case 2:
        return 'Property'
      case 3:
        return 'Budget & timeline'
      case 4:
        return 'Team'
      case 5:
        return 'Readiness preview'
    }
  }, [step])

  async function handleNext() {
    setError(null)
    setDuplicateWarning(null)
    setAddressError(null)

    try {
      setSaving(true)

      if (step === 1) {
        if (!name.trim()) throw new Error('Project name is required.')
        if (category === 'ADDITION' && additionSqFt.trim()) {
          const v = Number(additionSqFt)
          if (Number.isNaN(v) || v <= 0) throw new Error('Addition square footage must be a valid number > 0.')
        }
        if (!projectId) {
          const res = await api.createProject({
            name: name.trim(),
            description: description.trim() ? description.trim() : undefined,
            category,
            categoryMetadata:
              category === 'ADDITION' && additionSqFt.trim()
                ? { additionSquareFeet: Number(additionSqFt) }
                : undefined,
          })
          setProjectId(res.project.id)
        } else {
          await api.updateProject(projectId, {
            name: name.trim(),
            description: description.trim() ? description.trim() : null,
            category,
            categoryMetadata:
              category === 'ADDITION'
                ? { additionSquareFeet: additionSqFt.trim() ? Number(additionSqFt) : null }
                : null,
          })
        }
      }

      if (step === 2) {
        if (!projectId) throw new Error('Missing project draft. Go back to Step 1.')

        if (propertyMode === 'link') {
          if (!propertyId) throw new Error('Select a property (or switch to create).')
          await api.updateProject(projectId, { propertyId })
        } else {
          if (!addr.trim() || !city.trim() || !state.trim() || !zip.trim()) {
            throw new Error('Complete the full address (address, city, state, zip).')
          }

          // Basic invalid-address checks (Prompt 1.2). If Google autocomplete is not used,
          // we still guard common bad inputs.
          const zipOk = /^\d{5}(-\d{4})?$/.test(zip.trim())
          if (!zipOk) {
            setAddressError('ZIP must be a valid US ZIP code (e.g., 12345 or 12345-6789).')
            throw new Error('Invalid address.')
          }
          if (state.trim().length < 2) {
            setAddressError('State must be at least 2 characters (e.g., MD).')
            throw new Error('Invalid address.')
          }

          const validation = await api.validateAddress({
            address: addr.trim(),
            city: city.trim(),
            state: state.trim(),
            zip: zip.trim(),
          })

          if (validation.existingProjects > 0) {
            setDuplicateWarning(
              `Warning: ${validation.existingProjects} existing project(s) are already linked to this address.`
            )
          }

          const created = await api.createProperty({
            address: addr.trim(),
            address2: addr2.trim() ? addr2.trim() : null,
            city: city.trim(),
            state: state.trim(),
            zip: zip.trim(),
            country: 'US',
            latitude,
            longitude,
            lotNumber: lotNumber.trim() ? lotNumber.trim() : null,
            parcelNumber: parcelNumber.trim() ? parcelNumber.trim() : null,
            lotSizeSqFt: lotSizeSqFt.trim() ? Number(lotSizeSqFt) : null,
            yearBuilt: yearBuilt.trim() ? Number(yearBuilt) : null,
          })

          setPropertyId(created.property.id)
          await api.updateProject(projectId, { propertyId: created.property.id })
        }
      }

      if (step === 3) {
        if (!projectId) throw new Error('Missing project draft. Go back to Step 1.')
        const budget = budgetTotal.trim() ? Number(budgetTotal) : null
        if (budget !== null && (Number.isNaN(budget) || budget < 0)) throw new Error('Budget must be a valid number ≥ 0.')
        if (startDate && endDate && startDate > endDate) throw new Error('Start date must be on/before end date.')

        await api.updateProject(projectId, {
          budgetTotal: budget,
          startDate: startDate ? new Date(startDate).toISOString() : null,
          endDate: endDate ? new Date(endDate).toISOString() : null,
        })
      }

      if (step === 4) {
        if (!projectId) throw new Error('Missing project draft. Go back to Step 1.')
        // Progressive save members (best-effort; owner must be authenticated)
        for (const m of members) {
          await api.addProjectMember(projectId, m)
        }
      }

      if (step === 5) {
        if (!projectId) throw new Error('Missing project draft.')
        // Ensure readiness checklist exists (Prompt 1.4)
        try {
          const generated = await api.generateReadiness(projectId)
          setReadinessItems(generated.items)
        } catch {
          const listed = await api.listReadiness(projectId)
          setReadinessItems(listed.items)
        }

        // Finish: clear wizard draft state (Prompt 1.8: Clear offline state)
        window.localStorage.removeItem('kealee:projectWizard:projectId')
        window.localStorage.removeItem('kealee:projectWizard:step')
        window.localStorage.removeItem('kealee:projectWizard:formState')
        router.push(`/projects/${projectId}`)
        return
      }

      setStep((s) => (Math.min(5, s + 1) as StepId))
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Something went wrong.')
    } finally {
      setSaving(false)
    }
  }

  function handleBack() {
    setError(null)
    setDuplicateWarning(null)
    setStep((s) => (Math.max(1, s - 1) as StepId))
  }

  async function runPropertySearch() {
    setError(null)
    try {
      const q = propertyQuery.trim()
      if (!q) return
      const res = await api.searchProperties(q, undefined, 8)
      setPropertyResults(res.properties || [])
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Property search failed.')
    }
  }

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
          Step {step} of 5 — <span className="font-medium text-neutral-800">{stepTitle}</span>
        </p>
      </header>

      {/* Prompt 1.8: Mobile-responsive step indicators */}
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
                    'min-h-[44px] min-w-[44px]', // Prompt 1.8: Touch-friendly tap target (44x44px minimum)
                    isCurrent ? 'border-neutral-900 text-neutral-900' : 'border-neutral-200 text-neutral-700',
                    canGoBack ? 'active:scale-95 hover:border-neutral-900' : 'opacity-70'
                  )}
                  onClick={() => {
                    if (!canGoBack) return
                    setError(null)
                    setDuplicateWarning(null)
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
        <div className="grid grid-cols-5 gap-1.5 sm:gap-2" aria-hidden="true">
          {([1, 2, 3, 4, 5] as const).map((s) => (
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

      {duplicateWarning ? (
        <div className="mt-4 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900" role="status">
          {duplicateWarning}
        </div>
      ) : null}

      {addressError ? (
        <div className="mt-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800" role="alert">
          {addressError}
        </div>
      ) : null}

      {/* Prompt 1.8: Mobile-optimized section with responsive padding */}
      <section className="mt-4 sm:mt-6 rounded-xl border border-neutral-200 bg-white p-3 shadow-sm sm:p-4 sm:p-6">
        {step === 1 ? (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-neutral-900" htmlFor="name">
                Project name
              </label>
              <input
                id="name"
                className="mt-1 w-full rounded-lg border border-neutral-300 px-3 py-3 text-base sm:py-2 sm:text-sm"
                value={name}
                onChange={(e) => setName(e.target.value)}
                autoComplete="off"
                // Prompt 1.8: Mobile-friendly input (larger font, prevents zoom on iOS)
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
                // Prompt 1.8: Mobile-friendly textarea
              />
            </div>

            <div>
              <div className="flex items-center justify-between gap-3">
                <label className="block text-sm font-medium text-neutral-900">Category</label>
                <span className="text-xs text-neutral-600">Pick one</span>
              </div>

              {/* Prompt 1.8: Mobile-responsive grid (1 col on mobile, 2 on tablet, 3 on desktop) */}
              <div className="mt-2 grid grid-cols-1 gap-2 xs:grid-cols-2 sm:grid-cols-3">
                {CATEGORY_OPTIONS.map((c) => {
                  const selected = c.value === category
                  return (
                    <button
                      key={c.value}
                      type="button"
                      className={cx(
                        'touch-manipulation rounded-lg border p-3 text-left active:scale-95',
                        'min-h-[60px]', // Prompt 1.8: Touch-friendly tap target
                        selected ? 'border-neutral-900 bg-neutral-50' : 'border-neutral-200'
                      )}
                      onClick={() => setCategory(c.value)}
                      aria-pressed={selected}
                    >
                      <div className="flex items-center gap-2">
                        <span
                          aria-hidden="true"
                          className="inline-flex h-8 w-8 items-center justify-center rounded-md bg-neutral-100 text-sm font-semibold text-neutral-800"
                        >
                          {c.value === 'KITCHEN' ? 'K' : null}
                          {c.value === 'BATHROOM' ? 'B' : null}
                          {c.value === 'ADDITION' ? '+' : null}
                          {c.value === 'NEW_CONSTRUCTION' ? 'N' : null}
                          {c.value === 'RENOVATION' ? 'R' : null}
                          {c.value === 'OTHER' ? 'O' : null}
                        </span>
                        <div>
                          <div className="text-sm font-semibold text-neutral-900">{c.label}</div>
                          <div className="text-xs text-neutral-600">{c.value}</div>
                        </div>
                      </div>
                    </button>
                  )
                })}
              </div>
            </div>

            {category === 'ADDITION' ? (
              <div>
                <label className="block text-sm font-medium text-neutral-900" htmlFor="additionSqFt">
                  Addition square footage
                </label>
                <input
                  id="additionSqFt"
                  className="mt-1 w-full rounded-lg border border-neutral-300 px-3 py-2"
                  value={additionSqFt}
                  onChange={(e) => setAdditionSqFt(e.target.value)}
                  inputMode="numeric"
                  placeholder="e.g., 300"
                />
                <p className="mt-2 text-xs text-neutral-600">
                  Saved into `project.categoryMetadata.additionSquareFeet`.
                </p>
              </div>
            ) : null}
          </div>
        ) : null}

        {step === 2 ? (
          <div className="space-y-4">
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                className={cx(
                  'touch-manipulation rounded-lg border px-4 py-3 text-base active:scale-95 sm:px-3 sm:py-2 sm:text-sm min-h-[44px]',
                  propertyMode === 'link' ? 'border-neutral-900 bg-neutral-50' : 'border-neutral-300'
                )}
                onClick={() => setPropertyMode('link')}
              >
                Link existing
              </button>
              <button
                type="button"
                className={cx(
                  'touch-manipulation rounded-lg border px-4 py-3 text-base active:scale-95 sm:px-3 sm:py-2 sm:text-sm min-h-[44px]',
                  propertyMode === 'create' ? 'border-neutral-900 bg-neutral-50' : 'border-neutral-300'
                )}
                onClick={() => setPropertyMode('create')}
              >
                Create new
              </button>
            </div>

            {propertyMode === 'link' ? (
              <div className="space-y-3">
                <div className="flex gap-2">
                  <input
                    className="w-full rounded-lg border border-neutral-300 px-3 py-3 text-base sm:py-2 sm:text-sm"
                    placeholder="Search by address/city/state/zip…"
                    value={propertyQuery}
                    onChange={(e) => setPropertyQuery(e.target.value)}
                  />
                  <button
                    type="button"
                    className="touch-manipulation rounded-lg bg-neutral-900 px-4 py-3 text-base font-medium text-white active:bg-neutral-800 sm:px-3 sm:py-2 sm:text-sm min-h-[44px]"
                    onClick={runPropertySearch}
                  >
                    Search
                  </button>
                </div>

                <div className="space-y-2">
                  {propertyResults.length === 0 ? (
                    <p className="text-sm text-neutral-600">No results yet.</p>
                  ) : (
                    propertyResults.map((p) => (
                      <label
                        key={p.id}
                        className={cx(
                          'flex cursor-pointer items-start gap-3 rounded-lg border p-3',
                          propertyId === p.id ? 'border-neutral-900' : 'border-neutral-200'
                        )}
                      >
                        <input
                          type="radio"
                          name="property"
                          checked={propertyId === p.id}
                          onChange={() => setPropertyId(p.id)}
                          aria-label={`Select property ${p.address}, ${p.city}`}
                        />
                        <div className="text-sm">
                          <div className="font-medium text-neutral-900">{p.address}</div>
                          <div className="text-neutral-600">
                            {p.city}, {p.state} {p.zip}
                          </div>
                        </div>
                      </label>
                    ))
                  )}
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div className="sm:col-span-2">
                  <label className="block text-sm font-medium text-neutral-900" htmlFor="addr">
                    Address
                  </label>
                  <input
                    id="addr"
                    className="mt-1 w-full rounded-lg border border-neutral-300 px-3 py-3 text-base sm:py-2 sm:text-sm"
                    value={addr}
                    onChange={(e) => setAddr(e.target.value)}
                    placeholder="123 Main St"
                  />
                  <p className="mt-2 text-xs text-neutral-600">
                    Google Maps autocomplete will be added behind an API key (later).
                  </p>
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-sm font-medium text-neutral-900" htmlFor="addr2">
                    Address line 2 (optional)
                  </label>
                  <input
                    id="addr2"
                    className="mt-1 w-full rounded-lg border border-neutral-300 px-3 py-2"
                    value={addr2}
                    onChange={(e) => setAddr2(e.target.value)}
                    placeholder="Unit, Apt, Suite"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-neutral-900" htmlFor="city">
                    City
                  </label>
                  <input
                    id="city"
                    className="mt-1 w-full rounded-lg border border-neutral-300 px-3 py-2"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-neutral-900" htmlFor="state">
                    State
                  </label>
                  <input
                    id="state"
                    className="mt-1 w-full rounded-lg border border-neutral-300 px-3 py-2"
                    value={state}
                    onChange={(e) => setState(e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-neutral-900" htmlFor="zip">
                    ZIP
                  </label>
                  <input
                    id="zip"
                    className="mt-1 w-full rounded-lg border border-neutral-300 px-3 py-2"
                    value={zip}
                    onChange={(e) => setZip(e.target.value)}
                    inputMode="numeric"
                  />
                </div>

                <div className="sm:col-span-2">
                  <h3 className="text-sm font-semibold text-neutral-900">Lot details (optional)</h3>
                  <div className="mt-2 grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <div>
                      <label className="block text-sm font-medium text-neutral-900" htmlFor="lotNumber">
                        Lot number
                      </label>
                      <input
                        id="lotNumber"
                        className="mt-1 w-full rounded-lg border border-neutral-300 px-3 py-2"
                        value={lotNumber}
                        onChange={(e) => setLotNumber(e.target.value)}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-neutral-900" htmlFor="parcelNumber">
                        Parcel number
                      </label>
                      <input
                        id="parcelNumber"
                        className="mt-1 w-full rounded-lg border border-neutral-300 px-3 py-2"
                        value={parcelNumber}
                        onChange={(e) => setParcelNumber(e.target.value)}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-neutral-900" htmlFor="lotSizeSqFt">
                        Lot size (sq ft)
                      </label>
                      <input
                        id="lotSizeSqFt"
                        className="mt-1 w-full rounded-lg border border-neutral-300 px-3 py-2"
                        value={lotSizeSqFt}
                        onChange={(e) => setLotSizeSqFt(e.target.value)}
                        inputMode="numeric"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-neutral-900" htmlFor="yearBuilt">
                        Year built
                      </label>
                      <input
                        id="yearBuilt"
                        className="mt-1 w-full rounded-lg border border-neutral-300 px-3 py-2"
                        value={yearBuilt}
                        onChange={(e) => setYearBuilt(e.target.value)}
                        inputMode="numeric"
                      />
                    </div>
                  </div>
                  <p className="mt-2 text-xs text-neutral-600">
                    Lat/long will be populated automatically once Google autocomplete is enabled.
                  </p>
                </div>
              </div>
            )}
          </div>
        ) : null}

        {step === 3 ? (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-neutral-900" htmlFor="budget">
                Budget (USD)
              </label>
              <input
                id="budget"
                className="mt-1 w-full rounded-lg border border-neutral-300 px-3 py-2"
                value={budgetTotal}
                onChange={(e) => setBudgetTotal(e.target.value)}
                inputMode="decimal"
                placeholder="150000"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-neutral-900" htmlFor="start">
                Start date (optional)
              </label>
              <input
                id="start"
                type="date"
                className="mt-1 w-full rounded-lg border border-neutral-300 px-3 py-2"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-neutral-900" htmlFor="end">
                End date (optional)
              </label>
              <input
                id="end"
                type="date"
                className="mt-1 w-full rounded-lg border border-neutral-300 px-3 py-2"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>
          </div>
        ) : null}

        {step === 4 ? (
          <div className="space-y-4">
            <div className="rounded-lg border border-neutral-200 bg-neutral-50 p-3 text-sm text-neutral-700">
              Team selection will be enhanced with user search + invitations. For now you can add a user by ID.
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              <div className="sm:col-span-2">
                <label className="block text-sm font-medium text-neutral-900" htmlFor="memberUserId">
                  User ID
                </label>
                <input
                  id="memberUserId"
                  className="mt-1 w-full rounded-lg border border-neutral-300 px-3 py-2"
                  value={memberUserId}
                  onChange={(e) => setMemberUserId(e.target.value)}
                  placeholder="UUID"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-neutral-900" htmlFor="memberRole">
                  Role
                </label>
                <select
                  id="memberRole"
                  className="mt-1 w-full rounded-lg border border-neutral-300 px-3 py-2"
                  value={memberRole}
                  onChange={(e) =>
                    setMemberRole(e.target.value as 'CONTRACTOR' | 'PROJECT_MANAGER' | 'MEMBER' | 'VIEWER')
                  }
                >
                  <option value="CONTRACTOR">Contractor</option>
                  <option value="PROJECT_MANAGER">Project manager</option>
                  <option value="MEMBER">Member</option>
                  <option value="VIEWER">Viewer</option>
                </select>
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                className="rounded-lg bg-neutral-900 px-3 py-2 text-sm font-medium text-white disabled:opacity-60"
                disabled={!memberUserId.trim()}
                onClick={() => {
                  const userId = memberUserId.trim()
                  if (!userId) return
                  setMembers((prev) => {
                    const without = prev.filter((m) => m.userId !== userId)
                    return [...without, { userId, role: memberRole }]
                  })
                  setMemberUserId('')
                }}
              >
                Add member
              </button>
            </div>

            <div className="space-y-2">
              {members.length === 0 ? (
                <p className="text-sm text-neutral-600">No team members added yet.</p>
              ) : (
                members.map((m) => (
                  <div key={m.userId} className="flex items-center justify-between rounded-lg border border-neutral-200 p-3">
                    <div className="text-sm">
                      <div className="font-medium text-neutral-900">{m.userId}</div>
                      <div className="text-neutral-600">{m.role}</div>
                    </div>
                    <button
                      type="button"
                      className="text-sm text-red-700 underline underline-offset-4"
                      onClick={() => setMembers((prev) => prev.filter((x) => x.userId !== m.userId))}
                    >
                      Remove
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        ) : null}

        {step === 5 ? (
          <div className="space-y-3">
            <div className="rounded-lg border border-neutral-200 bg-neutral-50 p-3 text-sm text-neutral-700">
              Readiness checklist preview (generated from admin templates).
            </div>
            {projectId ? (
              <div className="space-y-2">
                <button
                  type="button"
                  className="rounded-lg border border-neutral-300 px-3 py-2 text-sm"
                  onClick={async () => {
                    setError(null)
                    try {
                      const listed = await api.listReadiness(projectId)
                      setReadinessItems(listed.items)
                    } catch (e: unknown) {
                      setError(e instanceof Error ? e.message : 'Failed to load readiness items.')
                    }
                  }}
                >
                  Refresh checklist
                </button>
                {readinessItems.length === 0 ? (
                  <p className="text-sm text-neutral-600">No readiness items yet (configure templates in os-admin).</p>
                ) : (
                  <ul className="space-y-2">
                    {readinessItems.map((ri) => (
                      <li key={ri.id} className="rounded-lg border border-neutral-200 p-3">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <div className="text-sm font-semibold text-neutral-900">
                              {ri.title}{' '}
                              <span className="text-xs font-medium text-neutral-600">
                                {ri.required ? '(required)' : '(optional)'}
                              </span>
                            </div>
                            {ri.description ? <div className="mt-1 text-sm text-neutral-700">{ri.description}</div> : null}
                            <div className="mt-2 text-xs text-neutral-600">
                              Type: {ri.type} • Status: {ri.status}
                              {ri.dueDate ? ` • Due: ${ri.dueDate.slice(0, 10)}` : ''}
                            </div>
                          </div>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            ) : (
              <p className="text-sm text-neutral-600">Create a project draft first to preview readiness.</p>
            )}
            <p className="text-sm text-neutral-600">
              When you finish, you’ll be taken to your project detail page.
            </p>
          </div>
        ) : null}
      </section>

      {/* Prompt 1.8: Mobile-optimized footer with touch-friendly buttons */}
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
          disabled={saving}
          aria-busy={saving}
        >
          {step === 5 ? 'Finish' : saving ? 'Saving…' : 'Next'}
        </button>
      </footer>
    </main>
  )
}

