'use client'

import Link from 'next/link'
import { ChevronDown } from 'lucide-react'
import { usePathname } from 'next/navigation'
import { NavDropdown } from './NavDropdown'
import type { NavItem as NavItemType } from '@/config/navigation'

interface Props {
  item:       NavItemType
  isOpen:     boolean
  onToggle:   () => void
  onClose:    () => void
}

export function NavItem({ item, isOpen, onToggle, onClose }: Props) {
  const pathname  = usePathname()
  const hasDropdown = 'type' in item && item.type === 'dropdown'
  const href      = 'href' in item ? item.href : undefined
  const isActive  = href ? (href === '/' ? pathname === '/' : pathname.startsWith(href)) : false

  const baseClasses = `
    relative inline-flex items-center gap-1 rounded-md px-2.5 py-1.5 text-sm font-medium
    transition-colors hover:text-[#1A2B4A] hover:bg-gray-50
  `
  const activeColor = isActive || isOpen ? '#1A2B4A' : '#4A5568'

  if (!hasDropdown) {
    return (
      <Link
        href={href ?? '/'}
        className={baseClasses}
        style={{ color: activeColor }}
        onClick={onClose}
      >
        {item.label}
        {isActive && (
          <span
            className="absolute bottom-0 left-2.5 right-2.5 h-0.5 rounded-full"
            style={{ backgroundColor: '#2ABFBF' }}
          />
        )}
      </Link>
    )
  }

  // Dropdown item
  const dropdownItem = item as Extract<NavItemType, { type: 'dropdown' }>

  return (
    <div className="relative">
      <button
        onClick={onToggle}
        className={`${baseClasses} select-none`}
        style={{ color: activeColor }}
        aria-expanded={isOpen}
        aria-haspopup="true"
      >
        {item.label}
        <ChevronDown
          className={`h-3.5 w-3.5 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
        />
        {(isActive || isOpen) && (
          <span
            className="absolute bottom-0 left-2.5 right-2.5 h-0.5 rounded-full"
            style={{ backgroundColor: '#2ABFBF' }}
          />
        )}
      </button>

      <NavDropdown item={dropdownItem} isOpen={isOpen} />
    </div>
  )
}
