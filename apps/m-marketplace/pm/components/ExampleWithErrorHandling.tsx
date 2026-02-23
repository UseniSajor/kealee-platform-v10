/**
 * Example component showing error handling best practices
 */

'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { apiRequest, handleApiError, toastSuccess, toastError, ButtonLoading, LoadingSpinner, Skeleton, CardSkeleton } from '@kealee/ui'
import { validateForm, getFieldError, commonSchemas } from '@kealee/ui'
import { z } from 'zod'

// Form validation schema
const formSchema = z.object({
  name: commonSchemas.nonEmptyString,
  email: commonSchemas.email,
  age: commonSchemas.positiveNumber,
})

type FormData = z.infer<typeof formSchema>

export function ExampleWithErrorHandling() {
  const queryClient = useQueryClient()
  const [formData, setFormData] = useState<Partial<FormData>>({})
  const [errors, setErrors] = useState<Array<{ field: string; message: string }>>([])
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Example: Fetch data with error handling
  const { data, isLoading, error } = useQuery({
    queryKey: ['example-data'],
    queryFn: async () => {
      try {
        return await apiRequest('/api/example', {
          retries: 3,
          retryDelay: 1000,
        })
      } catch (err) {
        handleApiError(err)
        throw err
      }
    },
  })

  // Example: Mutation with error handling
  const mutation = useMutation({
    mutationFn: async (data: FormData) => {
      return await apiRequest('/api/example', {
        method: 'POST',
        body: JSON.stringify(data),
        retries: 3,
      })
    },
    onSuccess: () => {
      toastSuccess('Data saved successfully!')
      queryClient.invalidateQueries({ queryKey: ['example-data'] })
    },
    onError: (error) => {
      handleApiError(error)
    },
  })

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setErrors([])

    // Validate form
    const validation = validateForm(formSchema, formData)
    if (!validation.success) {
      setErrors(validation.errors)
      setIsSubmitting(false)
      return
    }

    try {
      await mutation.mutateAsync(validation.data)
      setFormData({})
    } catch (error) {
      // Error already handled by mutation onError
    } finally {
      setIsSubmitting(false)
    }
  }

  // Loading state
  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton lines={3} />
        <CardSkeleton />
      </div>
    )
  }

  // Error state
  if (error) {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 p-4">
        <p className="text-sm text-red-800">
          Failed to load data. Please try again.
        </p>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="name" className="block text-sm font-medium">
          Name
        </label>
        <input
          id="name"
          type="text"
          value={formData.name || ''}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          className="mt-1 w-full rounded-lg border border-neutral-300 px-3 py-2"
        />
        {getFieldError(errors, 'name') && (
          <p className="mt-1 text-sm text-red-600">{getFieldError(errors, 'name')}</p>
        )}
      </div>

      <div>
        <label htmlFor="email" className="block text-sm font-medium">
          Email
        </label>
        <input
          id="email"
          type="email"
          value={formData.email || ''}
          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
          className="mt-1 w-full rounded-lg border border-neutral-300 px-3 py-2"
        />
        {getFieldError(errors, 'email') && (
          <p className="mt-1 text-sm text-red-600">{getFieldError(errors, 'email')}</p>
        )}
      </div>

      <ButtonLoading
        type="submit"
        loading={isSubmitting}
        className="rounded-lg bg-blue-600 px-4 py-2 text-white"
      >
        Submit
      </ButtonLoading>
    </form>
  )
}
