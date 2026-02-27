'use client'

import { useState, useEffect, useCallback } from 'react'
import type { FunnelSessionData, FunnelUserType, FunnelProjectType, BudgetRange, FunnelTimeline } from './types'
import { TOTAL_STEPS } from './types'
import { createSession, updateSession } from './api'

const STORAGE_KEY = 'kealee_funnel_session'

const initialData: FunnelSessionData = {
  sessionId: null,
  userType: null,
  projectType: null,
  city: '',
  state: '',
  budget: null,
  timeline: null,
}

function loadFromStorage(): FunnelSessionData | null {
  if (typeof window === 'undefined') return null
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (!stored) return null
    return JSON.parse(stored) as FunnelSessionData
  } catch {
    return null
  }
}

function saveToStorage(data: FunnelSessionData): void {
  if (typeof window === 'undefined') return
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
  } catch {}
}

export function useFunnelSession() {
  const [currentStep, setCurrentStep] = useState(0)
  const [formData, setFormData] = useState<FunnelSessionData>(initialData)
  const [isLoading, setIsLoading] = useState(false)

  // Load from localStorage on mount
  useEffect(() => {
    const stored = loadFromStorage()
    if (stored) {
      setFormData(stored)
    }
  }, [])

  // Save to localStorage on change
  useEffect(() => {
    if (formData.sessionId) {
      saveToStorage(formData)
    }
  }, [formData])

  const ensureSession = useCallback(async (): Promise<string> => {
    if (formData.sessionId) return formData.sessionId

    setIsLoading(true)
    try {
      // Extract UTM params from URL
      const params = new URLSearchParams(window.location.search)
      const utmParams: Record<string, string> = {}
      for (const key of ['utm_source', 'utm_medium', 'utm_campaign']) {
        const val = params.get(key)
        if (val) utmParams[key] = val
      }

      const sessionId = await createSession(Object.keys(utmParams).length > 0 ? utmParams : undefined)
      setFormData((prev) => ({ ...prev, sessionId }))
      return sessionId
    } finally {
      setIsLoading(false)
    }
  }, [formData.sessionId])

  const setField = useCallback(
    async <K extends keyof FunnelSessionData>(field: K, value: FunnelSessionData[K]) => {
      setFormData((prev) => ({ ...prev, [field]: value }))

      // Sync to backend
      const sessionId = formData.sessionId || (await ensureSession())
      try {
        await updateSession(sessionId, { [field]: value, currentStep })
      } catch (err) {
        console.warn('[useFunnelSession] Failed to sync:', err)
      }
    },
    [formData.sessionId, currentStep, ensureSession]
  )

  const nextStep = useCallback(() => {
    setCurrentStep((prev) => Math.min(prev + 1, TOTAL_STEPS - 1))
  }, [])

  const prevStep = useCallback(() => {
    setCurrentStep((prev) => Math.max(prev - 1, 0))
  }, [])

  const reset = useCallback(() => {
    setFormData(initialData)
    setCurrentStep(0)
    if (typeof window !== 'undefined') {
      localStorage.removeItem(STORAGE_KEY)
    }
  }, [])

  const isStepComplete = useCallback(
    (step: number): boolean => {
      switch (step) {
        case 0: return formData.userType !== null
        case 1: return formData.projectType !== null
        case 2: return formData.city.length > 0 && formData.state.length > 0
        case 3: return formData.budget !== null
        case 4: return formData.timeline !== null
        default: return false
      }
    },
    [formData]
  )

  const isComplete = formData.userType !== null &&
    formData.projectType !== null &&
    formData.city.length > 0 &&
    formData.state.length > 0 &&
    formData.budget !== null &&
    formData.timeline !== null

  return {
    currentStep,
    setCurrentStep,
    formData,
    setField,
    nextStep,
    prevStep,
    reset,
    isStepComplete,
    isComplete,
    isLoading,
    ensureSession,
    totalSteps: TOTAL_STEPS,
  }
}
