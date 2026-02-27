'use client'

import React, { useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ArrowRight,
  ArrowLeft,
  Home,
  HardHat,
  Compass,
  TrendingUp,
  Building2,
  UtensilsCrossed,
  Bath,
  PlusSquare,
  Building,
  Trees,
  Flower2,
  Store,
  DollarSign,
  Zap,
  Calendar,
  CalendarDays,
  CalendarRange,
  Search,
  Sparkles,
  MapPin,
  Clock,
  User,
} from 'lucide-react'
import { Header } from '@/components/Header'
import { Footer } from '@/components/Footer'
import {
  useFunnelSession,
  USER_TYPES,
  PROJECT_TYPES,
  BUDGET_RANGES,
  TIMELINES,
  US_STATES,
} from '@kealee/funnel-session'
import type { FunnelUserType, FunnelProjectType, BudgetRange as BudgetRangeType, FunnelTimeline } from '@kealee/funnel-session'
import { triggerGeneration } from '@kealee/funnel-session'

// Icon mapping for dynamic rendering
const ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  Home, HardHat, Compass, TrendingUp, Building2,
  ChefHat: UtensilsCrossed, Bath, PlusSquare, Building, Trees, Flower2, Store,
  DollarSign, Zap, Calendar, CalendarDays, CalendarRange, Search,
}

const STEP_CONFIG = [
  { title: 'I am a...', subtitle: 'Tell us about yourself so we can personalize your experience.', icon: User },
  { title: 'What type of project?', subtitle: 'Select the category that best describes your project.', icon: Building2 },
  { title: 'Where is your project?', subtitle: 'Help us find the best local professionals for you.', icon: MapPin },
  { title: 'What\'s your budget?', subtitle: 'This helps us match you with the right tier of professionals.', icon: DollarSign },
  { title: 'When do you want to start?', subtitle: 'Let us know your timeline so we can prioritize accordingly.', icon: Clock },
]

export default function GetStartedPage() {
  const router = useRouter()
  const {
    currentStep,
    formData,
    setField,
    nextStep,
    prevStep,
    isStepComplete,
    isComplete,
    ensureSession,
  } = useFunnelSession()

  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = useCallback(async () => {
    if (!isComplete) return
    setIsSubmitting(true)
    try {
      const sessionId = await ensureSession()
      await triggerGeneration(sessionId)
      router.push(`/your-plan/${sessionId}`)
    } catch (err) {
      console.error('Failed to generate page:', err)
      setIsSubmitting(false)
    }
  }, [isComplete, ensureSession, router])

  const handleCardSelect = useCallback(
    async (field: string, value: string) => {
      await ensureSession()
      await setField(field as any, value)
      // Auto-advance after selection (except last step)
      if (currentStep < 4) {
        setTimeout(() => nextStep(), 300)
      }
    },
    [ensureSession, setField, currentStep, nextStep]
  )

  const stepInfo = STEP_CONFIG[currentStep]
  const StepIcon = stepInfo.icon

  return (
    <div className="min-h-screen bg-neutral-50 flex flex-col font-sans">
      <Header />

      <main className="flex-grow pt-12 pb-24 px-4">
        <div className="max-w-4xl mx-auto">
          {/* Progress Header */}
          <div className="mb-12">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-xl bg-indigo-100 flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-indigo-600" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-neutral-900">Get Your Personalized Plan</h1>
                <p className="text-neutral-500 text-sm">Powered by AI — takes less than 60 seconds</p>
              </div>
            </div>

            <div className="mt-8 flex items-center justify-between relative">
              <div className="absolute top-1/2 left-0 w-full h-0.5 bg-neutral-200 -translate-y-1/2 z-0" />
              <div
                className="absolute top-1/2 left-0 h-0.5 bg-indigo-600 -translate-y-1/2 z-0 transition-all duration-500"
                style={{ width: `${(currentStep / (STEP_CONFIG.length - 1)) * 100}%` }}
              />

              {STEP_CONFIG.map((step, idx) => {
                const Icon = step.icon
                const isActive = idx <= currentStep
                const isCurrent = idx === currentStep

                return (
                  <div key={idx} className="relative z-10 flex flex-col items-center">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300 ${
                      isCurrent ? 'bg-indigo-600 text-white ring-4 ring-indigo-100 shadow-lg' :
                      isActive ? 'bg-indigo-600 text-white shadow-md' : 'bg-white text-neutral-400 border border-neutral-200'
                    }`}>
                      <Icon className="w-5 h-5" />
                    </div>
                    <span className={`absolute top-12 whitespace-nowrap text-xs font-medium hidden sm:block ${
                      isCurrent ? 'text-indigo-600' : 'text-neutral-400'
                    }`}>
                      Step {idx + 1}
                    </span>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Form Content */}
          <div className="bg-white rounded-3xl shadow-xl shadow-neutral-200/50 border border-neutral-100 p-8 md:p-12 overflow-hidden min-h-[460px] flex flex-col">
            <AnimatePresence mode="wait">
              {/* Step 0: User Type */}
              {currentStep === 0 && (
                <motion.div
                  key="step0"
                  initial={{ x: 50, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  exit={{ x: -50, opacity: 0 }}
                  className="space-y-6 flex-grow"
                >
                  <div>
                    <h2 className="text-2xl font-bold text-neutral-900 mb-1">{stepInfo.title}</h2>
                    <p className="text-neutral-500">{stepInfo.subtitle}</p>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {USER_TYPES.map((opt) => {
                      const Icon = ICON_MAP[opt.icon] || User
                      const isSelected = formData.userType === opt.value
                      return (
                        <button
                          key={opt.value}
                          onClick={() => handleCardSelect('userType', opt.value)}
                          className={`flex flex-col items-center justify-center p-6 rounded-2xl border-2 transition-all group ${
                            isSelected ? 'border-indigo-600 bg-indigo-50/50 shadow-md' : 'border-neutral-100 hover:border-neutral-300 bg-neutral-50/30'
                          }`}
                        >
                          <Icon className={`w-8 h-8 mb-3 transition-colors ${isSelected ? 'text-indigo-600' : 'text-neutral-400 group-hover:text-neutral-600'}`} />
                          <span className={`text-sm font-bold ${isSelected ? 'text-indigo-700' : 'text-neutral-700'}`}>{opt.label}</span>
                          {opt.description && (
                            <span className="text-xs text-neutral-400 mt-1 text-center">{opt.description}</span>
                          )}
                        </button>
                      )
                    })}
                  </div>
                </motion.div>
              )}

              {/* Step 1: Project Type */}
              {currentStep === 1 && (
                <motion.div
                  key="step1"
                  initial={{ x: 50, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  exit={{ x: -50, opacity: 0 }}
                  className="space-y-6 flex-grow"
                >
                  <div>
                    <h2 className="text-2xl font-bold text-neutral-900 mb-1">{stepInfo.title}</h2>
                    <p className="text-neutral-500">{stepInfo.subtitle}</p>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                    {PROJECT_TYPES.map((opt) => {
                      const Icon = ICON_MAP[opt.icon] || Building2
                      const isSelected = formData.projectType === opt.value
                      return (
                        <button
                          key={opt.value}
                          onClick={() => handleCardSelect('projectType', opt.value)}
                          className={`flex flex-col items-center justify-center p-5 rounded-2xl border-2 transition-all group ${
                            isSelected ? 'border-indigo-600 bg-indigo-50/50 shadow-md' : 'border-neutral-100 hover:border-neutral-300 bg-neutral-50/30'
                          }`}
                        >
                          <Icon className={`w-7 h-7 mb-2 transition-colors ${isSelected ? 'text-indigo-600' : 'text-neutral-400 group-hover:text-neutral-600'}`} />
                          <span className={`text-xs font-bold text-center ${isSelected ? 'text-indigo-700' : 'text-neutral-700'}`}>{opt.label}</span>
                        </button>
                      )
                    })}
                  </div>
                </motion.div>
              )}

              {/* Step 2: Location */}
              {currentStep === 2 && (
                <motion.div
                  key="step2"
                  initial={{ x: 50, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  exit={{ x: -50, opacity: 0 }}
                  className="space-y-6 flex-grow"
                >
                  <div>
                    <h2 className="text-2xl font-bold text-neutral-900 mb-1">{stepInfo.title}</h2>
                    <p className="text-neutral-500">{stepInfo.subtitle}</p>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-2xl">
                    <div>
                      <label className="block text-sm font-semibold text-neutral-900 mb-3">City</label>
                      <input
                        type="text"
                        value={formData.city}
                        onChange={async (e) => {
                          await ensureSession()
                          setField('city', e.target.value)
                        }}
                        placeholder="e.g. Bethesda"
                        className="w-full px-5 py-4 rounded-xl border border-neutral-200 focus:ring-2 focus:ring-indigo-600/20 focus:border-indigo-600 outline-none transition-all placeholder:text-neutral-400"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-neutral-900 mb-3">State</label>
                      <select
                        value={formData.state}
                        onChange={async (e) => {
                          await ensureSession()
                          setField('state', e.target.value)
                        }}
                        className="w-full px-5 py-4 rounded-xl border border-neutral-200 focus:ring-2 focus:ring-indigo-600/20 focus:border-indigo-600 outline-none transition-all bg-white appearance-none"
                      >
                        <option value="">Select State</option>
                        {US_STATES.map((s) => (
                          <option key={s.value} value={s.value}>{s.label}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <div className="bg-indigo-50 border border-indigo-100 rounded-2xl p-5 max-w-2xl">
                    <div className="flex gap-3">
                      <MapPin className="w-5 h-5 text-indigo-600 shrink-0 mt-0.5" />
                      <p className="text-sm text-indigo-700/80">
                        We currently serve the DC, Maryland, and Virginia metro area with the most accurate data. All US states are supported.
                      </p>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* Step 3: Budget */}
              {currentStep === 3 && (
                <motion.div
                  key="step3"
                  initial={{ x: 50, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  exit={{ x: -50, opacity: 0 }}
                  className="space-y-6 flex-grow"
                >
                  <div>
                    <h2 className="text-2xl font-bold text-neutral-900 mb-1">{stepInfo.title}</h2>
                    <p className="text-neutral-500">{stepInfo.subtitle}</p>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {BUDGET_RANGES.map((opt) => {
                      const isSelected = formData.budget === opt.value
                      return (
                        <button
                          key={opt.value}
                          onClick={() => handleCardSelect('budget', opt.value)}
                          className={`flex flex-col items-center justify-center p-6 rounded-2xl border-2 transition-all group ${
                            isSelected ? 'border-indigo-600 bg-indigo-50/50 shadow-md' : 'border-neutral-100 hover:border-neutral-300 bg-neutral-50/30'
                          }`}
                        >
                          <DollarSign className={`w-7 h-7 mb-2 transition-colors ${isSelected ? 'text-indigo-600' : 'text-neutral-400 group-hover:text-neutral-600'}`} />
                          <span className={`text-sm font-bold ${isSelected ? 'text-indigo-700' : 'text-neutral-700'}`}>{opt.label}</span>
                          {opt.description && (
                            <span className="text-xs text-neutral-400 mt-1">{opt.description}</span>
                          )}
                        </button>
                      )
                    })}
                  </div>
                </motion.div>
              )}

              {/* Step 4: Timeline */}
              {currentStep === 4 && (
                <motion.div
                  key="step4"
                  initial={{ x: 50, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  exit={{ x: -50, opacity: 0 }}
                  className="space-y-6 flex-grow"
                >
                  <div>
                    <h2 className="text-2xl font-bold text-neutral-900 mb-1">{stepInfo.title}</h2>
                    <p className="text-neutral-500">{stepInfo.subtitle}</p>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {TIMELINES.map((opt) => {
                      const Icon = ICON_MAP[opt.icon] || Clock
                      const isSelected = formData.timeline === opt.value
                      return (
                        <button
                          key={opt.value}
                          onClick={() => handleCardSelect('timeline', opt.value)}
                          className={`flex flex-col items-center justify-center p-6 rounded-2xl border-2 transition-all group ${
                            isSelected ? 'border-indigo-600 bg-indigo-50/50 shadow-md' : 'border-neutral-100 hover:border-neutral-300 bg-neutral-50/30'
                          }`}
                        >
                          <Icon className={`w-7 h-7 mb-2 transition-colors ${isSelected ? 'text-indigo-600' : 'text-neutral-400 group-hover:text-neutral-600'}`} />
                          <span className={`text-sm font-bold ${isSelected ? 'text-indigo-700' : 'text-neutral-700'}`}>{opt.label}</span>
                          {opt.description && (
                            <span className="text-xs text-neutral-400 mt-1">{opt.description}</span>
                          )}
                        </button>
                      )
                    })}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Actions */}
            <div className="mt-12 flex items-center justify-between gap-4 pt-8 border-t border-neutral-100">
              <button
                onClick={prevStep}
                disabled={currentStep === 0 || isSubmitting}
                className={`flex items-center gap-2 font-bold py-4 px-8 rounded-xl transition-all ${
                  currentStep === 0 ? 'opacity-0 pointer-events-none' : 'text-neutral-500 hover:bg-neutral-100'
                }`}
              >
                <ArrowLeft className="w-4 h-4" />
                Back
              </button>

              {currentStep < 4 ? (
                <button
                  onClick={nextStep}
                  disabled={!isStepComplete(currentStep)}
                  className="bg-indigo-600 text-white font-bold py-4 px-10 rounded-xl hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-200 flex items-center gap-2 active:scale-95 disabled:opacity-50 disabled:pointer-events-none"
                >
                  Continue
                  <ArrowRight className="w-4 h-4" />
                </button>
              ) : (
                <button
                  onClick={handleSubmit}
                  disabled={!isComplete || isSubmitting}
                  className="bg-green-600 text-white font-bold py-4 px-12 rounded-xl hover:bg-green-700 transition-all shadow-lg shadow-green-200 flex items-center gap-2 active:scale-95 disabled:opacity-50 overflow-hidden relative"
                >
                  {isSubmitting ? (
                    <div className="flex items-center gap-3">
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Generating Your Plan...
                    </div>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4" />
                      Generate My Plan
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              )}
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  )
}
