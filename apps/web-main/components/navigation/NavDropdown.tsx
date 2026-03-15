'use client'

import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import type { NavDropdown as NavDropdownType } from '@/config/navigation'

interface Props {
  item:    NavDropdownType & { type: 'dropdown' }
  isOpen:  boolean
}

export function NavDropdown({ item, isOpen }: Props) {
  if (!isOpen) return null

  const cols = item.groups.length === 1 ? 'grid-cols-1' : 'grid-cols-2'

  return (
    <div className="absolute left-1/2 top-full z-50 mt-1 -translate-x-1/2">
      {/* Arrow pointer */}
      <div className="mx-auto mb-[-1px] h-2 w-4 overflow-hidden">
        <div className="mx-auto h-3 w-3 rotate-45 transform border border-gray-200 bg-white" style={{ marginTop: 2, marginLeft: 4 }} />
      </div>

      <div
        className="min-w-[320px] max-w-[520px] overflow-hidden rounded-xl border border-gray-200 bg-white shadow-xl"
        style={{ boxShadow: '0 20px 40px -8px rgba(26,43,74,0.18)' }}
      >
        {/* Link groups */}
        <div className={`grid ${cols} gap-0 p-4`}>
          {item.groups.map((group, gi) => (
            <div key={gi} className={gi > 0 ? 'border-l border-gray-100 pl-4 ml-0' : ''}>
              {group.title && (
                <p className="mb-2 px-2 text-[10px] font-bold uppercase tracking-widest text-gray-400">
                  {group.title}
                </p>
              )}
              <div className="space-y-0.5">
                {group.links.map(link => (
                  <Link
                    key={link.href}
                    href={link.href}
                    className="group flex items-start gap-3 rounded-lg px-2.5 py-2.5 transition-colors hover:bg-gray-50"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold transition-colors group-hover:text-[#2ABFBF]" style={{ color: '#1A2B4A' }}>
                          {link.label}
                        </span>
                        {link.badge && (
                          <span className="rounded-full px-1.5 py-0.5 text-[10px] font-bold text-white" style={{ backgroundColor: '#E8793A' }}>
                            {link.badge}
                          </span>
                        )}
                      </div>
                      {link.description && (
                        <p className="mt-0.5 text-xs leading-snug text-gray-500">{link.description}</p>
                      )}
                    </div>
                    <ArrowRight className="mt-0.5 h-3.5 w-3.5 flex-shrink-0 text-gray-300 opacity-0 transition-opacity group-hover:opacity-100" />
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Featured CTA bar */}
        {item.featured && (
          <Link
            href={item.featured.href}
            className="group flex items-center justify-between border-t border-gray-100 px-5 py-3.5 transition-colors hover:bg-orange-50"
            style={{ backgroundColor: 'rgba(232,121,58,0.04)' }}
          >
            <div>
              <p className="text-sm font-semibold" style={{ color: '#E8793A' }}>{item.featured.label}</p>
              {item.featured.description && (
                <p className="text-xs text-gray-500">{item.featured.description}</p>
              )}
            </div>
            <ArrowRight className="h-4 w-4 flex-shrink-0 transition-transform group-hover:translate-x-1" style={{ color: '#E8793A' }} />
          </Link>
        )}
      </div>
    </div>
  )
}
