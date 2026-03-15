'use client'

import Link from 'next/link'
import { X, ChevronDown, ArrowRight } from 'lucide-react'
import { useState } from 'react'
import { PRIMARY_NAV, NAV_CTA_PRIMARY, NAV_CTA_SECONDARY, NAV_LOGIN } from '@/config/navigation'

interface Props {
  isOpen:  boolean
  onClose: () => void
}

export function MobileNav({ isOpen, onClose }: Props) {
  const [openItems, setOpenItems] = useState<Record<string, boolean>>({})

  function toggleItem(label: string) {
    setOpenItems(s => ({ ...s, [label]: !s[label] }))
  }

  if (!isOpen) return null

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40 bg-black/30 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Drawer */}
      <div className="fixed inset-y-0 right-0 z-50 flex w-full max-w-xs flex-col bg-white shadow-2xl">
        {/* Header */}
        <div className="flex h-16 items-center justify-between border-b border-gray-100 px-5">
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg" style={{ backgroundColor: '#E8793A' }}>
              <span className="text-xs font-bold text-white font-display">K</span>
            </div>
            <span className="text-lg font-bold font-display" style={{ color: '#1A2B4A' }}>Kealee</span>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-2 text-gray-500 hover:bg-gray-100 hover:text-gray-900"
            aria-label="Close menu"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Nav items — scrollable */}
        <nav className="flex-1 overflow-y-auto px-3 py-4">
          <div className="space-y-0.5">
            {PRIMARY_NAV.map(item => {
              const hasDropdown = 'type' in item && item.type === 'dropdown'
              const label = item.label
              const isExpanded = openItems[label]

              if (!hasDropdown) {
                const href = 'href' in item ? item.href : '/'
                return (
                  <Link
                    key={label}
                    href={href ?? '/'}
                    onClick={onClose}
                    className="flex items-center rounded-xl px-4 py-3 text-sm font-medium text-gray-700 hover:bg-gray-50"
                  >
                    {label}
                  </Link>
                )
              }

              const dropdownItem = item as Extract<typeof item, { type: 'dropdown' }>

              return (
                <div key={label}>
                  <button
                    onClick={() => toggleItem(label)}
                    className="flex w-full items-center justify-between rounded-xl px-4 py-3 text-sm font-medium text-gray-700 hover:bg-gray-50"
                    aria-expanded={isExpanded}
                  >
                    <span>{label}</span>
                    <ChevronDown
                      className={`h-4 w-4 text-gray-400 transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`}
                    />
                  </button>

                  {isExpanded && (
                    <div className="mt-0.5 ml-4 space-y-0.5 border-l-2 border-teal-100 pl-3">
                      {dropdownItem.groups.flatMap(g => g.links).map(link => (
                        <Link
                          key={link.href}
                          href={link.href}
                          onClick={onClose}
                          className="block rounded-lg px-3 py-2.5"
                        >
                          <span className="flex items-center gap-2">
                            <span className="text-sm font-medium" style={{ color: '#1A2B4A' }}>
                              {link.label}
                            </span>
                            {link.badge && (
                              <span className="rounded-full px-1.5 py-0.5 text-[10px] font-bold text-white" style={{ backgroundColor: '#E8793A' }}>
                                {link.badge}
                              </span>
                            )}
                          </span>
                          {link.description && (
                            <span className="mt-0.5 block text-xs text-gray-400">{link.description}</span>
                          )}
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </nav>

        {/* Bottom CTAs */}
        <div className="border-t border-gray-100 px-5 py-4 space-y-3">
          <Link
            href={NAV_CTA_PRIMARY.href}
            onClick={onClose}
            className="flex w-full items-center justify-center gap-2 rounded-xl py-3 text-sm font-semibold text-white transition-all hover:opacity-90"
            style={{ backgroundColor: '#E8793A' }}
          >
            {NAV_CTA_PRIMARY.label}
            <ArrowRight className="h-4 w-4" />
          </Link>
          <Link
            href={NAV_CTA_SECONDARY.href}
            onClick={onClose}
            className="flex w-full items-center justify-center gap-2 rounded-xl border-2 py-3 text-sm font-semibold transition-all hover:bg-teal-50"
            style={{ borderColor: '#2ABFBF', color: '#2ABFBF' }}
          >
            {NAV_CTA_SECONDARY.label}
          </Link>
          <Link
            href={NAV_LOGIN.href}
            onClick={onClose}
            className="flex w-full items-center justify-center gap-2 py-2 text-sm font-medium text-gray-500 hover:text-gray-900"
          >
            {NAV_LOGIN.label}
          </Link>
        </div>
      </div>
    </>
  )
}
