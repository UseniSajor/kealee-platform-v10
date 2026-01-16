'use client'

import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { api } from '@/lib/api'

export default function SatisfactionSurveyPage({
  params,
}: {
  params: { id: string }
}) {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [survey, setSurvey] = useState<{
    id: string
    packageId: string
    status: string
    overallRating: number | null
    communicationRating: number | null
    qualityRating: number | null
    timelinessRating: number | null
    valueRating: number | null
    whatWentWell: string | null
    whatCouldImprove: string | null
    additionalComments: string | null
    wouldRecommend: boolean | null
    completedAt: string | null
  } | null>(null)
  const [error, setError] = useState<string | null>(null)

  const [formData, setFormData] = useState({
    overallRating: 0,
    communicationRating: 0,
    qualityRating: 0,
    timelinessRating: 0,
    valueRating: 0,
    whatWentWell: '',
    whatCouldImprove: '',
    additionalComments: '',
    wouldRecommend: false,
    recommendationReason: '',
  })

  useEffect(() => {
    loadSurvey()
  }, [params.id])

  const loadSurvey = useCallback(async () => {
    try {
      // First get the handoff package to find the survey
      const packageRes = await api.getHandoffPackage(params.id)
      if (packageRes.package.satisfactionSurvey) {
        const surveyRes = await api.getSatisfactionSurvey(
          packageRes.package.satisfactionSurvey.id
        )
        setSurvey(surveyRes.survey)

        // Pre-fill form if already started
        if (surveyRes.survey.overallRating) {
          setFormData({
            overallRating: surveyRes.survey.overallRating || 0,
            communicationRating: surveyRes.survey.communicationRating || 0,
            qualityRating: surveyRes.survey.qualityRating || 0,
            timelinessRating: surveyRes.survey.timelinessRating || 0,
            valueRating: surveyRes.survey.valueRating || 0,
            whatWentWell: surveyRes.survey.whatWentWell || '',
            whatCouldImprove: surveyRes.survey.whatCouldImprove || '',
            additionalComments: surveyRes.survey.additionalComments || '',
            wouldRecommend: surveyRes.survey.wouldRecommend || false,
            recommendationReason: surveyRes.survey.recommendationReason || '',
          })
        } else {
          // Start the survey if not started
          await api.startSatisfactionSurvey(packageRes.package.id)
        }
      } else {
        setError('Satisfaction survey not found')
      }
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to load survey')
    } finally {
      setLoading(false)
    }
  }, [params.id])

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault()

      if (formData.overallRating === 0) {
        alert('Please provide an overall rating')
        return
      }

      setSubmitting(true)
      try {
        const packageRes = await api.getHandoffPackage(params.id)
        if (!packageRes.package.satisfactionSurvey) {
          throw new Error('Survey not found')
        }

        await api.submitSatisfactionSurvey(packageRes.package.satisfactionSurvey.id, {
          overallRating: formData.overallRating,
          communicationRating: formData.communicationRating || undefined,
          qualityRating: formData.qualityRating || undefined,
          timelinessRating: formData.timelinessRating || undefined,
          valueRating: formData.valueRating || undefined,
          whatWentWell: formData.whatWentWell || undefined,
          whatCouldImprove: formData.whatCouldImprove || undefined,
          additionalComments: formData.additionalComments || undefined,
          wouldRecommend: formData.wouldRecommend || undefined,
          recommendationReason: formData.recommendationReason || undefined,
        })

        alert('Thank you for your feedback!')
        router.push(`/projects/${params.id}/handoff`)
      } catch (e: unknown) {
        alert(e instanceof Error ? e.message : 'Failed to submit survey')
      } finally {
        setSubmitting(false)
      }
    },
    [formData, params.id, router]
  )

  const StarRating = ({
    value,
    onChange,
    label,
  }: {
    value: number
    onChange: (value: number) => void
    label: string
  }) => (
    <div className="space-y-2">
      <label className="text-sm font-medium text-neutral-700">{label}</label>
      <div className="flex items-center gap-2">
        {[1, 2, 3, 4, 5].map((rating) => (
          <button
            key={rating}
            type="button"
            onClick={() => onChange(rating)}
            className="focus:outline-none"
          >
            <svg
              className={`h-8 w-8 ${
                rating <= value ? 'text-yellow-400' : 'text-neutral-300'
              } transition-colors hover:text-yellow-500`}
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
            </svg>
          </button>
        ))}
        {value > 0 ? (
          <span className="ml-2 text-sm text-neutral-600">{value} / 5</span>
        ) : null}
      </div>
    </div>
  )

  if (loading) {
    return (
      <main className="mx-auto w-full max-w-2xl px-4 py-6">
        <div>Loading survey...</div>
      </main>
    )
  }

  if (survey?.status === 'COMPLETED') {
    return (
      <main className="mx-auto w-full max-w-2xl px-4 py-6">
        <div className="rounded-xl border border-green-200 bg-green-50 p-6 text-center">
          <h1 className="text-2xl font-semibold text-green-900">Thank You!</h1>
          <p className="mt-2 text-sm text-green-800">
            Your feedback has been submitted. We appreciate your time!
          </p>
          <Link
            href={`/projects/${params.id}/handoff`}
            className="mt-4 inline-block rounded-lg bg-green-600 px-6 py-3 text-sm font-semibold text-white hover:bg-green-700"
          >
            Back to Handoff Package
          </Link>
        </div>
      </main>
    )
  }

  return (
    <main className="mx-auto w-full max-w-2xl px-4 py-6">
      <nav aria-label="Breadcrumb" className="text-sm text-neutral-600">
        <ol className="flex flex-wrap items-center gap-2">
          <li>
            <Link className="underline underline-offset-4" href="/">
              Home
            </Link>
          </li>
          <li aria-hidden="true">/</li>
          <li>
            <Link className="underline underline-offset-4" href={`/projects/${params.id}`}>
              Project
            </Link>
          </li>
          <li aria-hidden="true">/</li>
          <li>
            <Link className="underline underline-offset-4" href={`/projects/${params.id}/handoff`}>
              Handoff
            </Link>
          </li>
          <li aria-hidden="true">/</li>
          <li className="text-neutral-800">Survey</li>
        </ol>
      </nav>

      <header className="mt-4">
        <h1 className="text-2xl font-semibold text-neutral-900">Project Satisfaction Survey</h1>
        <p className="mt-1 text-sm text-neutral-600">
          Please share your feedback about your project experience
        </p>
      </header>

      {error ? (
        <div className="mt-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800" role="alert">
          {error}
        </div>
      ) : null}

      <form onSubmit={handleSubmit} className="mt-6 space-y-6">
        {/* Overall Rating (Required) */}
        <div className="rounded-xl border border-neutral-200 bg-white p-6">
          <StarRating
            value={formData.overallRating}
            onChange={(value) => setFormData({ ...formData, overallRating: value })}
            label="Overall Rating *"
          />
        </div>

        {/* Detailed Ratings */}
        <div className="rounded-xl border border-neutral-200 bg-white p-6">
          <h2 className="text-lg font-semibold text-neutral-900 mb-4">Detailed Ratings</h2>
          <div className="space-y-4">
            <StarRating
              value={formData.communicationRating}
              onChange={(value) => setFormData({ ...formData, communicationRating: value })}
              label="Communication"
            />
            <StarRating
              value={formData.qualityRating}
              onChange={(value) => setFormData({ ...formData, qualityRating: value })}
              label="Quality of Work"
            />
            <StarRating
              value={formData.timelinessRating}
              onChange={(value) => setFormData({ ...formData, timelinessRating: value })}
              label="Timeliness"
            />
            <StarRating
              value={formData.valueRating}
              onChange={(value) => setFormData({ ...formData, valueRating: value })}
              label="Value for Money"
            />
          </div>
        </div>

        {/* Text Feedback */}
        <div className="rounded-xl border border-neutral-200 bg-white p-6">
          <h2 className="text-lg font-semibold text-neutral-900 mb-4">Feedback</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-neutral-700">
                What went well?
              </label>
              <textarea
                value={formData.whatWentWell}
                onChange={(e) => setFormData({ ...formData, whatWentWell: e.target.value })}
                rows={4}
                className="mt-1 w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                placeholder="Share what you enjoyed about the project..."
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-neutral-700">
                What could be improved?
              </label>
              <textarea
                value={formData.whatCouldImprove}
                onChange={(e) => setFormData({ ...formData, whatCouldImprove: e.target.value })}
                rows={4}
                className="mt-1 w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                placeholder="Share suggestions for improvement..."
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-neutral-700">
                Additional Comments
              </label>
              <textarea
                value={formData.additionalComments}
                onChange={(e) => setFormData({ ...formData, additionalComments: e.target.value })}
                rows={4}
                className="mt-1 w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                placeholder="Any other comments or feedback..."
              />
            </div>
          </div>
        </div>

        {/* Recommendation */}
        <div className="rounded-xl border border-neutral-200 bg-white p-6">
          <h2 className="text-lg font-semibold text-neutral-900 mb-4">Recommendation</h2>
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                id="wouldRecommend"
                checked={formData.wouldRecommend}
                onChange={(e) => setFormData({ ...formData, wouldRecommend: e.target.checked })}
                className="h-4 w-4 rounded border-neutral-300 text-blue-600 focus:ring-2 focus:ring-blue-500"
              />
              <label htmlFor="wouldRecommend" className="text-sm font-medium text-neutral-700">
                Would you recommend this service to others?
              </label>
            </div>
            {formData.wouldRecommend ? (
              <div>
                <label className="block text-sm font-medium text-neutral-700">
                  Why? (Optional)
                </label>
                <textarea
                  value={formData.recommendationReason}
                  onChange={(e) => setFormData({ ...formData, recommendationReason: e.target.value })}
                  rows={3}
                  className="mt-1 w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  placeholder="Tell us why you would recommend this service..."
                />
              </div>
            ) : null}
          </div>
        </div>

        {/* Submit Button */}
        <div className="flex items-center justify-between">
          <Link
            href={`/projects/${params.id}/handoff`}
            className="text-sm text-blue-600 underline underline-offset-4 hover:text-blue-700"
          >
            ← Back to Handoff Package
          </Link>
          <button
            type="submit"
            disabled={submitting || formData.overallRating === 0}
            className="rounded-lg bg-blue-600 px-6 py-3 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
          >
            {submitting ? 'Submitting...' : 'Submit Survey'}
          </button>
        </div>
      </form>
    </main>
  )
}
