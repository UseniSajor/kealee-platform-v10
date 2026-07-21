'use client'

import { Loader2 } from 'lucide-react'

interface LoadingStateProps {
  message?: string
  estimatedTime?: number
  progress?: number
}

export default function LoadingState({
  message = 'Generating your plan...',
  estimatedTime = 45,
  progress,
}: LoadingStateProps) {
  const messages = [
    'Analyzing project requirements...',
    'Checking zoning and regulations...',
    'Calculating cost estimates...',
    'Identifying risks and opportunities...',
    'Generating recommendations...',
  ]

  const currentMessage = messages[Math.floor(Math.random() * messages.length)]

  return (
    <div className="flex flex-col items-center justify-center py-20">
      <div className="relative w-20 h-20 mb-8">
        <Loader2 className="w-20 h-20 text-orange-600 animate-spin" />
      </div>

      <h2 className="text-2xl font-bold text-slate-900 mb-3 text-center">{message}</h2>
      <p className="text-lg text-slate-600 text-center mb-8">{currentMessage}</p>

      {estimatedTime && (
        <p className="text-sm text-slate-500">Estimated time: {estimatedTime} seconds</p>
      )}

      {progress !== undefined && (
        <div className="w-full max-w-xs mt-8">
          <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-orange-600 transition-all duration-500"
              style={{ width: `${progress}%` }}
            />
          </div>
          <p className="text-center text-sm text-slate-600 mt-3">{progress}% complete</p>
        </div>
      )}

      <div className="mt-12 flex gap-2 justify-center">
        <div className="w-2 h-2 bg-orange-600 rounded-full animate-pulse" />
        <div className="w-2 h-2 bg-orange-600 rounded-full animate-pulse" style={{ animationDelay: '0.2s' }} />
        <div className="w-2 h-2 bg-orange-600 rounded-full animate-pulse" style={{ animationDelay: '0.4s' }} />
      </div>
    </div>
  )
}
