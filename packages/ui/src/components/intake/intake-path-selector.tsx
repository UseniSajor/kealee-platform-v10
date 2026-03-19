'use client'

import { INTAKE_OPTION_CARDS } from '@kealee/intake'
import type { ProjectPath } from '@kealee/intake'
import { ArrowRight } from 'lucide-react'

interface IntakePathSelectorProps {
  onSelect: (path: ProjectPath) => void
}

const PATH_ICONS: Record<string, string> = {
  exterior_concept: '🏠',
  interior_renovation: '🛋️',
  whole_home_remodel: '🏗️',
  addition_expansion: '📐',
  design_build: '✏️',
  permit_path_only: '📋',
}

export function IntakePathSelector({ onSelect }: IntakePathSelectorProps) {
  return (
    <div>
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-bold" style={{ color: '#1A2B4A' }}>
          What type of project do you have?
        </h1>
        <p className="mt-2 text-gray-500">
          Select the path that best fits your project. We&apos;ll guide you through a quick intake to get started.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {INTAKE_OPTION_CARDS.map((card) => (
          <button
            key={card.path}
            onClick={() => onSelect(card.path)}
            className="group flex flex-col gap-3 rounded-2xl border border-gray-200 bg-white p-6 text-left transition-all hover:border-[#E8793A] hover:shadow-md"
          >
            <div className="flex items-center gap-3">
              <span className="text-3xl">{PATH_ICONS[card.path] ?? '📁'}</span>
              <span className="text-lg font-semibold" style={{ color: '#1A2B4A' }}>
                {card.title}
              </span>
            </div>
            <p className="text-sm text-gray-500 leading-relaxed">{card.subtitle}</p>
            <div
              className="mt-auto flex items-center gap-1 text-sm font-medium transition-colors group-hover:text-[#E8793A]"
              style={{ color: '#2ABFBF' }}
            >
              {card.cta} <ArrowRight className="h-3.5 w-3.5" />
            </div>
          </button>
        ))}
      </div>
    </div>
  )
}
