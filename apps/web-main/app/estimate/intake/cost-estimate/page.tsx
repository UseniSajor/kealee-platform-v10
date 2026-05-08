'use client'

import { useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { FileText, AlertCircle, CheckCircle, ImagePlus, FileVideo, Loader2, X } from 'lucide-react'
import { uploadIntakeFilesSequentially, type IntakeUploadedFile } from '@/lib/intake-file-upload'
import { SERVICE_PRICING, formatPrice } from '@kealee/shared/pricing'
import {
  getCostEstimateProjectNamePlaceholder,
  getCostEstimateScopePlaceholder,
} from '@kealee/shared'

export default function CostEstimateIntakePage() {
  const router = useRouter()
  const [step, setStep] = useState<'form' | 'review'>('form')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const [formData, setFormData] = useState({
    projectName: '',
    projectType: '',
    projectAddress: '',
    squareFootage: '',
    scopeDescription: '',
    clientName: '',
    contactEmail: '',
    contactPhone: '',
    docDescription: '',
  })

  const [uploadedFiles, setUploadedFiles] = useState<IntakeUploadedFile[]>([])
  const [uploading, setUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const pricing = SERVICE_PRICING.estimation.cost_estimate
  const tierCode = 'cost_estimate'

  const projectTypes = [
    'Residential Remodel',
    'Kitchen Remodel',
    'Bathroom Renovation',
    'Exterior Work',
    'Structural Repair',
    'Mechanical/Electrical/Plumbing',
    'Commercial Buildout',
    'Other',
  ]

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const selected = Array.from(e.target.files ?? [])
    if (!selected.length) return
    if (uploadedFiles.length + selected.length > 5) {
      setError('You can upload a maximum of 5 files.')
      return
    }
    setError('')
    setUploading(true)
    try {
      const newFiles = await uploadIntakeFilesSequentially(selected)
      if (newFiles.length === 0) {
        setError('Upload failed. Use images or PDF under 50 MB each.')
        return
      }
      if (newFiles.length < selected.length) {
        setError('Some files could not be uploaded. Others were saved.')
      }
      setUploadedFiles(prev => [...prev, ...newFiles])
    } catch {
      setError('Upload failed. Please try again.')
    } finally {
      setUploading(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (step === 'form') {
      // Validate required fields
      if (!formData.projectName || !formData.projectType || !formData.clientName || !formData.contactEmail) {
        setError('Please fill in all required fields')
        return
      }
      if (formData.scopeDescription.trim().length < 10) {
        setError('Please add a bit more detail in scope of work (at least 10 characters).')
        return
      }
      const hasAreaPhoto = uploadedFiles.some(f => f.type === 'image')
      const hasPdf = uploadedFiles.some(f => f.type === 'document')
      if (!hasAreaPhoto || !hasPdf) {
        setError('Please upload at least one photo of the project area and at least one PDF (plans, drawings, or specs).')
        return
      }
      setStep('review')
      return
    }

    // Step 2: Submit intake
    setLoading(true)
    try {
      const hasAreaPhoto = uploadedFiles.some(f => f.type === 'image')
      const hasPdf = uploadedFiles.some(f => f.type === 'document')
      if (!hasAreaPhoto || !hasPdf) {
        setError('Please upload at least one area photo and one PDF before payment.')
        setLoading(false)
        setStep('form')
        return
      }
      const intakeRes = await fetch('/api/v1/estimation/intake', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          project: {
            scopeDetail: 'construction_documents',
            projectStage: 'design_development',
            projectScope: 'interior_remodel',
            estimatedBudget: undefined,
          },
          contact: {
            name: formData.clientName,
            email: formData.contactEmail,
            phone: formData.contactPhone,
          },
          description: [formData.scopeDescription, formData.docDescription].filter(Boolean).join('\n\n'),
          hasDesignDrawings: true,
          tierPreference: tierCode,
          attachmentUrls: uploadedFiles.map(f => f.url),
        }),
      })

      if (!intakeRes.ok) {
        const errorData = await intakeRes.json().catch(() => ({}))
        throw new Error(errorData.message || 'Failed to create estimation intake')
      }

      const { intakeId } = await intakeRes.json()

      // Store email in localStorage for checkout
      localStorage.setItem('estimationEmail', formData.contactEmail)

      // Redirect to checkout
      const price = pricing.amount // Already in cents
      router.push(`/estimate/checkout?intakeId=${intakeId}&tier=${tierCode}&price=${price}`)
    } catch (err) {
      setError((err as Error).message || 'An error occurred')
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 py-12 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="flex items-center justify-center gap-3 mb-4">
            <FileText className="w-8 h-8 text-blue-600" />
            <h1 className="text-3xl font-bold text-slate-900">Cost Estimate</h1>
          </div>
          <p className="text-lg text-slate-600">
            Trade-by-trade cost breakdown validated against RSMeans data
          </p>
          <p className="text-xl font-bold text-blue-600 mt-2">{formatPrice(pricing.amount, 'display')}</p>
        </div>

        {/* Progress */}
        <div className="mb-8 flex justify-center items-center gap-4">
          <div
            className={`w-10 h-10 rounded-full flex items-center justify-center font-bold ${
              step === 'form' ? 'bg-blue-600 text-white' : 'bg-blue-200 text-blue-700'
            }`}
          >
            1
          </div>
          <div className="w-12 h-1 bg-slate-300" />
          <div
            className={`w-10 h-10 rounded-full flex items-center justify-center font-bold ${
              step === 'review' ? 'bg-blue-600 text-white' : 'bg-slate-200 text-slate-500'
            }`}
          >
            2
          </div>
        </div>

        {/* Form Card */}
        <div className="bg-white rounded-lg shadow-lg p-8">
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex gap-3 text-red-700">
              <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Step 1: Project Information */}
            {step === 'form' && (
              <>
                <div>
                  <label className="block text-sm font-semibold text-slate-900 mb-2">
                    Project Name *
                  </label>
                  <input
                    type="text"
                    value={formData.projectName}
                    onChange={(e) => setFormData({ ...formData, projectName: e.target.value })}
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder={getCostEstimateProjectNamePlaceholder(formData.projectType)}
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-900 mb-2">
                    Project Type *
                  </label>
                  <select
                    value={formData.projectType}
                    onChange={(e) => setFormData({ ...formData, projectType: e.target.value })}
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Select a project type</option>
                    {projectTypes.map((type) => (
                      <option key={type} value={type}>
                        {type}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-900 mb-2">
                    Project Address
                  </label>
                  <input
                    type="text"
                    value={formData.projectAddress}
                    onChange={(e) => setFormData({ ...formData, projectAddress: e.target.value })}
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="123 Main Street, Washington DC 20001"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-900 mb-2">
                    Square Footage
                  </label>
                  <input
                    type="number"
                    value={formData.squareFootage}
                    onChange={(e) => setFormData({ ...formData, squareFootage: e.target.value })}
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="e.g., 2500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-900 mb-2">
                    Scope of Work *
                  </label>
                  <textarea
                    value={formData.scopeDescription}
                    onChange={(e) => setFormData({ ...formData, scopeDescription: e.target.value })}
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    rows={4}
                    placeholder={getCostEstimateScopePlaceholder(formData.projectType)}
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-900 mb-2">
                    Photos and construction PDFs <span className="text-red-600">*</span>
                  </label>
                  <p className="text-xs text-slate-500 mb-2">
                    One photo of the project area (JPG, PNG, WEBP, or HEIC) and at least one PDF (plans, specs, or drawings) are required. Up to 5 files, 50 MB each.
                  </p>
                  {uploadedFiles.length > 0 && (
                    <div className="flex flex-wrap gap-2 mb-3">
                      {uploadedFiles.map((f, i) => (
                        <div key={i} className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs text-slate-700">
                          {f.type === 'video' ? (
                            <FileVideo className="h-3.5 w-3.5 text-blue-500 shrink-0" />
                          ) : f.type === 'document' ? (
                            <FileText className="h-3.5 w-3.5 text-amber-600 shrink-0" />
                          ) : (
                            <ImagePlus className="h-3.5 w-3.5 text-green-500 shrink-0" />
                          )}
                          <span className="max-w-[140px] truncate">{f.name}</span>
                          <button
                            type="button"
                            onClick={() => setUploadedFiles(prev => prev.filter((_, j) => j !== i))}
                            className="text-slate-400 hover:text-red-500"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                  <input
                    ref={fileInputRef}
                    type="file"
                    multiple
                    accept="image/jpeg,image/png,image/webp,image/heic,image/heif,video/mp4,video/quicktime,application/pdf"
                    onChange={handleFileChange}
                    className="sr-only"
                    id="cost-estimate-uploads"
                  />
                  {uploadedFiles.length < 5 && (
                    <label
                      htmlFor="cost-estimate-uploads"
                      className={`flex items-center justify-center gap-2 w-full rounded-lg border-2 border-dashed px-4 py-3 text-sm font-medium cursor-pointer ${
                        uploading ? 'border-blue-200 bg-blue-50 text-blue-600' : 'border-slate-300 text-slate-600 hover:border-blue-400 hover:bg-slate-50'
                      }`}
                    >
                      {uploading ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" /> Uploading…
                        </>
                      ) : (
                        <>
                          <ImagePlus className="h-4 w-4" /> Add photos or PDFs
                        </>
                      )}
                    </label>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-900 mb-2">
                    Extra notes on your documents (optional)
                  </label>
                  <textarea
                    value={formData.docDescription}
                    onChange={(e) => setFormData({ ...formData, docDescription: e.target.value })}
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    rows={2}
                    placeholder="e.g. which sheet is existing conditions, revision date, etc."
                  />
                </div>

                {/* Contact Information */}
                <div className="border-t pt-6">
                  <h3 className="text-sm font-semibold text-slate-900 mb-4">Contact Information</h3>

                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-semibold text-slate-900 mb-2">
                        Name *
                      </label>
                      <input
                        type="text"
                        value={formData.clientName}
                        onChange={(e) => setFormData({ ...formData, clientName: e.target.value })}
                        className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Your full name"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-slate-900 mb-2">
                        Email *
                      </label>
                      <input
                        type="email"
                        value={formData.contactEmail}
                        onChange={(e) => setFormData({ ...formData, contactEmail: e.target.value })}
                        className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="your@email.com"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-slate-900 mb-2">
                        Phone
                      </label>
                      <input
                        type="tel"
                        value={formData.contactPhone}
                        onChange={(e) => setFormData({ ...formData, contactPhone: e.target.value })}
                        className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="(202) 555-0100"
                      />
                    </div>
                  </div>
                </div>
              </>
            )}

            {/* Step 2: Review */}
            {step === 'review' && (
              <div className="space-y-6">
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="flex gap-3">
                    <CheckCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <h3 className="font-semibold text-blue-900">Review Your Order</h3>
                      <p className="text-sm text-blue-700 mt-1">
                        Please review the information below before proceeding to payment
                      </p>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 py-4 border-y">
                  <div>
                    <p className="text-xs text-slate-600">Project</p>
                    <p className="font-semibold text-slate-900">{formData.projectName}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-600">Type</p>
                    <p className="font-semibold text-slate-900">{formData.projectType}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-600">Contact</p>
                    <p className="font-semibold text-slate-900">{formData.clientName}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-600">Email</p>
                    <p className="font-semibold text-slate-900">{formData.contactEmail}</p>
                  </div>
                </div>

                <div className="py-4 border-b">
                  <p className="text-xs text-slate-600 mb-2">Scope of Work</p>
                  <p className="text-slate-700">{formData.scopeDescription}</p>
                </div>

                <div className="py-4 border-b">
                  <p className="text-xs text-slate-600 mb-2">Uploaded files</p>
                  <p className="text-slate-700">{uploadedFiles.length} file{uploadedFiles.length !== 1 ? 's' : ''}</p>
                </div>

                <div className="bg-slate-100 rounded-lg p-4">
                  <p className="text-sm text-slate-600 mb-2">Estimate Price</p>
                  <p className="text-3xl font-bold text-blue-600">{formatPrice(pricing.amount, 'display')}</p>
                </div>
              </div>
            )}

            {/* Buttons */}
            <div className="flex gap-3 pt-6">
              {step === 'review' && (
                <button
                  type="button"
                  onClick={() => setStep('form')}
                  className="flex-1 px-6 py-3 border border-slate-300 rounded-lg font-semibold text-slate-700 hover:bg-slate-50 transition"
                >
                  Back
                </button>
              )}
              <button
                type="submit"
                disabled={loading}
                className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 disabled:opacity-50 transition"
              >
                {loading ? 'Processing...' : step === 'form' ? 'Continue to Review' : 'Proceed to Payment'}
              </button>
            </div>
          </form>
        </div>

        {/* Info Section */}
        <div className="mt-8 bg-white rounded-lg shadow p-6">
          <h3 className="font-semibold text-slate-900 mb-4">What's Included</h3>
          <ul className="space-y-3 text-sm text-slate-700">
            {pricing.features.map((feature, i) => (
              <li key={i} className="flex gap-3">
                <span className="text-blue-600 font-bold">✓</span>
                {feature}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  )
}
