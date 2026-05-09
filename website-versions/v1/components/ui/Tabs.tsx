'use client'

import { useState } from 'react'

interface Tab {
  id:      string
  label:   string
  content: React.ReactNode
}

interface TabsProps {
  tabs:         Tab[]
  defaultTab?:  string
  className?:   string
}

export function Tabs({ tabs, defaultTab, className = '' }: TabsProps) {
  const [active, setActive] = useState(defaultTab ?? tabs[0]?.id)
  const current = tabs.find(t => t.id === active)

  return (
    <div className={className}>
      <div className="flex gap-1 overflow-x-auto border-b border-gray-200 pb-px">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActive(tab.id)}
            className={`whitespace-nowrap rounded-t-lg px-4 py-2.5 text-sm font-medium transition-colors ${
              active === tab.id
                ? 'border-b-2 text-[#2ABFBF]'
                : 'text-gray-500 hover:text-gray-700'
            }`}
            style={active === tab.id ? { borderColor: '#2ABFBF' } : {}}
          >
            {tab.label}
          </button>
        ))}
      </div>
      <div className="mt-4">{current?.content}</div>
    </div>
  )
}
