'use client'

/**
 * @kealee/pascal-wrapper — ElementLibrary
 *
 * Slide-over panel showing the furniture & fixture catalog.
 * Users drag elements from here onto the floor plan canvas.
 */

import React, { useState } from 'react'
import { FURNITURE_CATALOG } from '../constants'
import type { FurnitureCategory } from '../types'
import { useEditorStore } from '../SceneContext'

const CATEGORIES: { id: FurnitureCategory | 'all'; label: string }[] = [
  { id: 'all',               label: 'All' },
  { id: 'seating',           label: 'Seating' },
  { id: 'table',             label: 'Tables' },
  { id: 'kitchen_appliance', label: 'Appliances' },
  { id: 'kitchen_cabinet',   label: 'Cabinets' },
  { id: 'island',            label: 'Islands' },
  { id: 'bath_fixture',      label: 'Bath' },
  { id: 'bed',               label: 'Beds' },
  { id: 'storage',           label: 'Storage' },
  { id: 'other',             label: 'Other' },
]

export interface ElementLibraryProps {
  onClose?: () => void
}

export const ElementLibrary: React.FC<ElementLibraryProps> = ({ onClose }) => {
  const [activeCategory, setActiveCategory] = useState<FurnitureCategory | 'all'>('all')
  const [search, setSearch] = useState('')
  const { addFurniture, setToolMode } = useEditorStore(s => s)

  const filtered = FURNITURE_CATALOG.filter(item => {
    const matchCat = activeCategory === 'all' || item.category === activeCategory
    const matchSearch = item.label.toLowerCase().includes(search.toLowerCase())
    return matchCat && matchSearch
  })

  const handlePlace = (item: typeof FURNITURE_CATALOG[0]) => {
    // Place at canvas center (scene coord 20,20)
    addFurniture({
      catalogId: item.id,
      label: item.label,
      category: item.category,
      x: 20, y: 20,
      rotation: 0,
      width: item.width,
      depth: item.depth,
      height: item.height,
    })
    setToolMode('select')
  }

  return (
    <div style={{
      width: 280, height: '100%', backgroundColor: 'white',
      borderLeft: '1px solid #E5E7EB', display: 'flex', flexDirection: 'column',
      fontFamily: 'system-ui, sans-serif',
    }}>
      {/* Header */}
      <div style={{ padding: '16px 16px 12px', borderBottom: '1px solid #F1F5F9', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <p style={{ margin: 0, fontSize: 13, fontWeight: 700, color: '#1A2B4A' }}>Element Library</p>
          <p style={{ margin: 0, fontSize: 11, color: '#9CA3AF', marginTop: 2 }}>Click to place on canvas</p>
        </div>
        {onClose && (
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 18, color: '#9CA3AF' }}>×</button>
        )}
      </div>

      {/* Search */}
      <div style={{ padding: '10px 16px' }}>
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search elements..."
          style={{
            width: '100%', padding: '7px 10px', borderRadius: 8,
            border: '1px solid #E5E7EB', fontSize: 12, outline: 'none',
            boxSizing: 'border-box',
          }}
        />
      </div>

      {/* Category tabs */}
      <div style={{ padding: '0 8px 8px', display: 'flex', flexWrap: 'wrap', gap: 4 }}>
        {CATEGORIES.map(cat => (
          <button
            key={cat.id}
            onClick={() => setActiveCategory(cat.id)}
            style={{
              padding: '4px 8px', borderRadius: 6, border: 'none', cursor: 'pointer', fontSize: 11, fontWeight: 600,
              backgroundColor: activeCategory === cat.id ? '#1A2B4A' : '#F1F5F9',
              color: activeCategory === cat.id ? 'white' : '#6B7280',
            }}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* Items grid */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '0 12px 12px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, alignContent: 'start' }}>
        {filtered.map(item => (
          <button
            key={item.id}
            onClick={() => handlePlace(item)}
            style={{
              display: 'flex', flexDirection: 'column', alignItems: 'center',
              padding: '10px 8px', borderRadius: 8, border: '1px solid #E5E7EB',
              background: 'white', cursor: 'pointer', gap: 4,
              transition: 'all 0.1s ease',
              textAlign: 'center',
            }}
            onMouseEnter={e => (e.currentTarget.style.borderColor = '#E8724B')}
            onMouseLeave={e => (e.currentTarget.style.borderColor = '#E5E7EB')}
          >
            <span style={{ fontSize: 22 }}>{item.symbol}</span>
            <span style={{ fontSize: 10, fontWeight: 600, color: '#374151', lineHeight: 1.2 }}>{item.label}</span>
            <span style={{ fontSize: 9, color: '#9CA3AF' }}>{item.width}′ × {item.depth}′</span>
          </button>
        ))}
        {filtered.length === 0 && (
          <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: 24, color: '#9CA3AF', fontSize: 12 }}>
            No elements found
          </div>
        )}
      </div>
    </div>
  )
}
