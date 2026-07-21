'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { Sparkles, Search, Users, Calculator, Clock, CheckCircle2 } from 'lucide-react'
import { getProgress } from '@kealee/funnel-session'

const MESSAGES = [
  { threshold: 10, text: 'Analyzing your project requirements...', icon: Search },
  { threshold: 30, text: 'Finding contractors in your area...', icon: Users },
  { threshold: 50, text: 'Building your budget breakdown...', icon: Calculator },
  { threshold: 80, text: 'Designing your project timeline...', icon: Clock },
  { threshold: 95, text: 'Finalizing your personalized plan...', icon: Sparkles },
  { threshold: 100, text: 'Your plan is ready!', icon: CheckCircle2 },
]

export function GeneratingState({ sessionId }: { sessionId: string }) {
  const router = useRouter()
  const [progress, setProgress] = useState(0)

  useEffect(() => {
    const interval = setInterval(async () => {
      const p = await getProgress(sessionId)
      setProgress(p)
      if (p >= 100) {
        clearInterval(interval)
        // Refresh the page to load the generated data
        setTimeout(() => router.refresh(), 500)
      }
    }, 2000)

    return () => clearInterval(interval)
  }, [sessionId, router])

  const currentMessage = [...MESSAGES].reverse().find((m) => progress >= m.threshold) || MESSAGES[0]
  const Icon = currentMessage.icon

  return (
    <div className="min-h-[60vh] flex items-center justify-center">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-md w-full text-center"
      >
        <div className="w-20 h-20 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-8">
          <Icon className="w-10 h-10 text-indigo-600 animate-pulse" />
        </div>

        <h2 className="text-2xl font-bold text-neutral-900 mb-2">
          Building Your Plan
        </h2>
        <p className="text-neutral-500 mb-8">
          Our AI is creating a personalized project plan just for you.
        </p>

        {/* Progress bar */}
        <div className="w-full bg-neutral-200 rounded-full h-3 mb-4 overflow-hidden">
          <motion.div
            className="h-full bg-indigo-600 rounded-full"
            initial={{ width: '0%' }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
          />
        </div>

        <div className="flex items-center justify-center gap-2 text-sm text-neutral-600">
          <Icon className="w-4 h-4 text-indigo-500" />
          <span>{currentMessage.text}</span>
        </div>

        <p className="text-xs text-neutral-400 mt-6">
          This usually takes 3-8 seconds
        </p>
      </motion.div>
    </div>
  )
}
