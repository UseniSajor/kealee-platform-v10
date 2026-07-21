'use client'

import { useState, useEffect } from 'react'
import { Loader2 } from 'lucide-react'

interface ProcessingProps {
  estimatedHours?: number
  status?: string
}

const MESSAGES = [
  'Analyzing site characteristics...',
  'Generating design concept...',
  'Computing feasibility metrics...',
  'Preparing recommendations...',
  'Finalizing your plan...',
]

export function ProcessingLoader({ estimatedHours = 2, status = 'generating' }: ProcessingProps) {
  const [messageIndex, setMessageIndex] = useState(0)
  const [progress, setProgress] = useState(0)
  const [timeRemaining, setTimeRemaining] = useState(estimatedHours * 60) // minutes

  useEffect(() => {
    // Rotate messages every 2 seconds
    const messageInterval = setInterval(() => {
      setMessageIndex((i) => (i + 1) % MESSAGES.length)
    }, 2000)

    return () => clearInterval(messageInterval)
  }, [])

  useEffect(() => {
    // Progress bar (0-90% over estimated time, then 90-99% on remaining)
    const progressInterval = setInterval(() => {
      setProgress((p) => {
        if (p < 90) return p + Math.random() * 15
        if (p < 99) return p + Math.random() * 2
        return p
      })
    }, 1000)

    return () => clearInterval(progressInterval)
  }, [])

  useEffect(() => {
    // Countdown timer
    const timerInterval = setInterval(() => {
      setTimeRemaining((t) => Math.max(0, t - 1))
    }, 1000)

    return () => clearInterval(timerInterval)
  }, [])

  const minutes = Math.floor(timeRemaining / 60)
  const seconds = timeRemaining % 60

  return (
    <div className="flex flex-col items-center justify-center py-20 px-4">
      <div className="max-w-md w-full space-y-6">
        {/* Spinner */}
        <div className="flex justify-center">
          <Loader2 className="w-12 h-12 text-blue-500 animate-spin" />
        </div>

        {/* Title */}
        <div className="text-center space-y-2">
          <h2 className="text-2xl font-bold text-gray-900">
            {status === 'pending' ? 'Processing your request...' : 'Generating your plan...'}
          </h2>
          <p className="text-gray-600">
            {status === 'pending'
              ? 'Getting ready to generate your analysis'
              : 'Creating your personalized design analysis'}
          </p>
        </div>

        {/* Current message */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <p className="text-center text-blue-900 font-medium">
            {MESSAGES[messageIndex]}
          </p>
        </div>

        {/* Progress bar */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm text-gray-600">
            <span>Progress</span>
            <span>{Math.min(Math.round(progress), 99)}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
            <div
              className="bg-blue-500 h-full transition-all duration-300"
              style={{ width: `${Math.min(progress, 99)}%` }}
            />
          </div>
        </div>

        {/* Time estimate */}
        <div className="text-center space-y-1">
          <p className="text-gray-600">Estimated time remaining</p>
          <p className="text-3xl font-bold text-gray-900">
            {minutes}:{seconds.toString().padStart(2, '0')}
          </p>
        </div>

        {/* Tips */}
        <div className="bg-gray-50 rounded-lg p-4 space-y-2">
          <p className="text-sm font-semibold text-gray-700">While you wait:</p>
          <ul className="text-sm text-gray-600 space-y-1">
            <li>• Review the project scope above</li>
            <li>• Prepare budget for next phase</li>
            <li>• Note any special requirements</li>
          </ul>
        </div>
      </div>
    </div>
  )
}
