'use client'

import { useCallback, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { api } from '@owner/lib/api'
import ContractorSelector from '@owner/components/ContractorSelector'

export default function NewContractPage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [templates, setTemplates] = useState<Array<{ id: string; name: string; version: number }>>([])
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(null)
  const [previewTerms, setPreviewTerms] = useState<string>('')
  const [terms, setTerms] = useState<string>('')
  const [contractorId, setContractorId] = useState<string | null>(null)

  // Milestones (Prompt 2.2)
  const [milestones, setMilestones] = useState<Array<{ id?: string; name: string; description: string; amount: string }>>([
    { name: '', description: '', amount: '' },
  ])
  const [totalAmount, setTotalAmount] = useState<number>(0)

  useEffect(() => {
    ;(async () => {
      try {
        const res = await api.getContractTemplates({ activeOnly: true })
        setTemplates(res.templates || [])
      } catch (e: unknown) {
        setError(e instanceof Error ? e.message : 'Failed to load templates')
      } finally {
        setLoading(false)
      }
    })()
  }, [])

  // Calculate total when milestones change
  useEffect(() => {
    const total = milestones.reduce((sum, m) => {
      const amount = parseFloat(m.amount) || 0
      return sum + amount
    }, 0)
    setTotalAmount(total)
  }, [milestones])

  const handleTemplateSelect = useCallback(
    async (templateId: string) => {
      setSelectedTemplateId(templateId)
      setError(null)
      try {
        const res = await api.previewContractTemplate(templateId, params.id)
        setPreviewTerms(res.preview.preview)
        setTerms(res.preview.preview) // Auto-populate terms from template
      } catch (e: unknown) {
        setError(e instanceof Error ? e.message : 'Failed to load template preview')
      }
    },
    [params.id]
  )

  const handleAddMilestone = () => {
    setMilestones([...milestones, { name: '', description: '', amount: '' }])
  }

  const handleMilestoneChange = (index: number, field: 'name' | 'description' | 'amount', value: string) => {
    const updated = [...milestones]
    updated[index] = { ...updated[index], [field]: value }
    setMilestones(updated)
  }

  const handleRemoveMilestone = (index: number) => {
    if (milestones.length > 1) {
      setMilestones(milestones.filter((_, i) => i !== index))
    }
  }

  const handleSave = async () => {
    if (!terms.trim()) {
      setError('Terms and conditions are required')
      return
    }

    // Validate milestones
    const validMilestones = milestones
      .map((m) => ({
        name: m.name.trim(),
        description: m.description.trim() || null,
        amount: parseFloat(m.amount) || 0,
      }))
      .filter((m) => m.name && m.amount > 0)

    if (validMilestones.length === 0) {
      setError('At least one milestone with a name and amount is required')
      return
    }

    setSaving(true)
    setError(null)

    try {
      const contract = await api.createContract({
        projectId: params.id,
        templateId: selectedTemplateId,
        contractorId: contractorId || null,
        terms: terms.trim(),
        milestones: validMilestones,
      })
      router.push(`/owner/projects/${params.id}/owner/contracts/${contract.contract.id}`)
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to create contract')
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <main className="mx-auto w-full max-w-4xl px-4 py-6">
        <div>Loading templates...</div>
      </main>
    )
  }

  return (
    <main className="mx-auto w-full max-w-4xl px-4 py-6">
      <nav aria-label="Breadcrumb" className="text-sm text-neutral-600">
        <ol className="flex flex-wrap items-center gap-2">
          <li>
            <Link className="underline underline-offset-4" href="/">
              Home
            </Link>
          </li>
          <li aria-hidden="true">/</li>
          <li>
            <Link className="underline underline-offset-4" href={`/owner/projects/${params.id}`}>
              Project
            </Link>
          </li>
          <li aria-hidden="true">/</li>
          <li className="text-neutral-800">New Contract</li>
        </ol>
      </nav>

      <header className="mt-4">
        <h1 className="text-2xl font-semibold text-neutral-900">Create Contract</h1>
        <p className="mt-1 text-sm text-neutral-600">Draft a contract for this project</p>
      </header>

      {error ? (
        <div className="mt-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800" role="alert">
          {error}
        </div>
      ) : null}

      <div className="mt-6 space-y-6">
        {/* Prompt 2.2: Template selection dropdown */}
        <section className="rounded-xl border border-neutral-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-neutral-900">1. Select Template</h2>
          <p className="mt-1 text-sm text-neutral-600">Choose a contract template to start from (optional)</p>
          <div className="mt-4">
            <select
              value={selectedTemplateId || ''}
              onChange={(e) => {
                if (e.target.value) {
                  handleTemplateSelect(e.target.value)
                } else {
                  setSelectedTemplateId(null)
                  setPreviewTerms('')
                  setTerms('')
                }
              }}
              className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-base sm:text-sm"
            >
              <option value="">No template (start from scratch)</option>
              {templates.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name} (v{t.version})
                </option>
              ))}
            </select>
          </div>
          {previewTerms && previewTerms !== terms ? (
            <div className="mt-4 rounded-lg border border-blue-200 bg-blue-50 p-3">
              <p className="text-sm font-medium text-blue-900">Template Preview:</p>
              <div className="mt-2 text-sm text-blue-800" dangerouslySetInnerHTML={{ __html: previewTerms }} />
              <button
                type="button"
                onClick={() => setTerms(previewTerms)}
                className="mt-3 rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-blue-700"
              >
                Use Template Content
              </button>
            </div>
          ) : null}
        </section>

        {/* Prompt 2.2: Rich text editor for custom modifications */}
        <section className="rounded-xl border border-neutral-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-neutral-900">2. Terms and Conditions</h2>
          <p className="mt-1 text-sm text-neutral-600">
            Edit the contract terms. Variables like $&#123;project.name&#125; will be auto-populated from project data.
          </p>
          <div className="mt-4">
            <textarea
              value={terms}
              onChange={(e) => setTerms(e.target.value)}
              rows={20}
              className="w-full rounded-lg border border-neutral-300 px-3 py-3 text-base font-mono sm:py-2 sm:text-sm"
              placeholder="Enter contract terms and conditions (HTML supported)..."
            />
            <p className="mt-2 text-xs text-neutral-600">
              <strong>Tip:</strong> You can use HTML tags for formatting. Variables will be replaced when the contract is finalized.
            </p>
          </div>
        </section>

        {/* Prompt 2.2: Milestone definition interface */}
        <section className="rounded-xl border border-neutral-200 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-neutral-900">3. Milestones</h2>
              <p className="mt-1 text-sm text-neutral-600">Define payment milestones for this contract</p>
            </div>
            <button
              type="button"
              onClick={handleAddMilestone}
              className="rounded-lg border border-neutral-300 px-3 py-2 text-sm font-medium hover:bg-neutral-50"
            >
              + Add Milestone
            </button>
          </div>

          <div className="mt-4 space-y-4">
            {milestones.map((milestone, index) => (
              <div key={index} className="rounded-lg border border-neutral-200 p-4">
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-12">
                  <div className="sm:col-span-5">
                    <label className="block text-sm font-medium text-neutral-700">Milestone Name *</label>
                    <input
                      type="text"
                      value={milestone.name}
                      onChange={(e) => handleMilestoneChange(index, 'name', e.target.value)}
                      placeholder="e.g., Demolition Complete"
                      className="mt-1 w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm"
                    />
                  </div>
                  <div className="sm:col-span-4">
                    <label className="block text-sm font-medium text-neutral-700">Amount (USD) *</label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={milestone.amount}
                      onChange={(e) => handleMilestoneChange(index, 'amount', e.target.value)}
                      placeholder="0.00"
                      className="mt-1 w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm"
                    />
                  </div>
                  <div className="sm:col-span-2 flex items-end">
                    {milestones.length > 1 ? (
                      <button
                        type="button"
                        onClick={() => handleRemoveMilestone(index)}
                        className="w-full rounded-lg border border-red-300 px-3 py-2 text-sm font-medium text-red-700 hover:bg-red-50"
                      >
                        Remove
                      </button>
                    ) : null}
                  </div>
                  <div className="sm:col-span-12">
                    <label className="block text-sm font-medium text-neutral-700">Description (optional)</label>
                    <textarea
                      value={milestone.description}
                      onChange={(e) => handleMilestoneChange(index, 'description', e.target.value)}
                      placeholder="Describe what needs to be completed for this milestone..."
                      rows={2}
                      className="mt-1 w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Prompt 2.2: Automatic total calculation */}
          <div className="mt-4 rounded-lg border border-blue-200 bg-blue-50 p-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-blue-900">Contract Total:</span>
              <span className="text-lg font-bold text-blue-900">
                ${totalAmount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
            </div>
            {totalAmount === 0 ? (
              <p className="mt-2 text-xs text-blue-800">Add milestones with amounts to calculate the total</p>
            ) : null}
          </div>
        </section>

        {/* Prompt 2.3: Contractor selection */}
        <section className="rounded-xl border border-neutral-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-neutral-900">4. Contractor (Optional)</h2>
          <p className="mt-1 text-sm text-neutral-600">
            Search and select a contractor from the marketplace, or send an invitation
          </p>
          <div className="mt-4">
            <ContractorSelector
              projectId={params.id}
              selectedContractorId={contractorId}
              onSelect={setContractorId}
            />
          </div>
        </section>

        <div className="flex justify-end gap-3">
          <Link
            href={`/owner/projects/${params.id}`}
            className="rounded-lg border border-neutral-300 px-4 py-2 text-sm font-medium text-neutral-700 hover:bg-neutral-50"
          >
            Cancel
          </Link>
          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="rounded-lg bg-blue-600 px-6 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
          >
            {saving ? 'Creating...' : 'Create Contract'}
          </button>
        </div>
      </div>
    </main>
  )
}
