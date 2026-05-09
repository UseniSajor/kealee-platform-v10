'use client'

/**
 * @kealee/pascal-wrapper — EditorToolBar
 *
 * Floating toolbar for the Pascal Editor. Provides:
 * - Tool mode switching (select, wall, door, window, furniture, measure)
 * - View mode switching (2D, 3D, walkthrough, render)
 * - Render mode switching (sketch, standard, realistic, cinematic)
 * - Undo / redo
 * - Floor management
 */

import React from 'react'
import { useEditorStore } from '../SceneContext'
import type { ToolMode, ViewMode, RenderMode } from '../types'

interface ToolButtonProps {
  active: boolean
  onClick: () => void
  title: string
  children: React.ReactNode
  badge?: string
}

const ToolButton: React.FC<ToolButtonProps> = ({ active, onClick, title, children, badge }) => (
  <button
    onClick={onClick}
    title={title}
    style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      width: 44, height: 44, borderRadius: 8, border: 'none', cursor: 'pointer',
      backgroundColor: active ? '#E8724B' : 'transparent',
      color: active ? 'white' : '#4B5563',
      fontSize: 18, position: 'relative',
      transition: 'all 0.15s ease',
    }}
  >
    {children}
    {badge && (
      <span style={{
        position: 'absolute', top: 2, right: 2, fontSize: 8, fontWeight: 700,
        color: active ? 'white' : '#E8724B', fontFamily: 'system-ui',
      }}>
        {badge}
      </span>
    )}
  </button>
)

const Divider = () => (
  <div style={{ width: 1, height: 28, backgroundColor: '#E5E7EB', margin: '0 4px' }} />
)

export interface EditorToolBarProps {
  onOpenLibrary?: () => void
  onOpenRenders?: () => void
  className?: string
}

export const EditorToolBar: React.FC<EditorToolBarProps> = ({ onOpenLibrary, onOpenRenders, className }) => {
  const { toolMode, viewMode, renderMode, history, historyIndex, setToolMode, setViewMode, setRenderMode, undo, redo } = useEditorStore(s => s)

  const canUndo = historyIndex > 0
  const canRedo = historyIndex < history.length - 1

  const tools: { mode: ToolMode; icon: string; title: string }[] = [
    { mode: 'select',    icon: '↖',  title: 'Select (V)' },
    { mode: 'wall',      icon: '▬',  title: 'Draw Wall (W)' },
    { mode: 'door',      icon: '🚪', title: 'Add Door (D)' },
    { mode: 'window',    icon: '🪟', title: 'Add Window (N)' },
    { mode: 'room',      icon: '⬜', title: 'Define Room (R)' },
    { mode: 'furniture', icon: '🛋', title: 'Place Furniture (F)' },
    { mode: 'measure',   icon: '📏', title: 'Measure (M)' },
    { mode: 'pan',       icon: '✋', title: 'Pan (Space)' },
  ]

  const views: { mode: ViewMode; icon: string; title: string }[] = [
    { mode: '2d',          icon: '⬛', title: '2D Plan' },
    { mode: '3d',          icon: '🧊', title: '3D View' },
    { mode: 'walkthrough', icon: '👁',  title: 'Walkthrough' },
    { mode: 'render',      icon: '✨', title: 'Render' },
  ]

  const renders: { mode: RenderMode; label: string }[] = [
    { mode: 'sketch',    label: 'Sketch' },
    { mode: 'standard',  label: 'Standard' },
    { mode: 'realistic', label: 'Realistic' },
    { mode: 'cinematic', label: 'Cinematic' },
  ]

  return (
    <div
      className={className}
      style={{
        display: 'flex', alignItems: 'center', gap: 4,
        backgroundColor: 'white',
        border: '1px solid #E5E7EB',
        borderRadius: 12,
        padding: '6px 10px',
        boxShadow: '0 4px 16px rgba(0,0,0,0.10)',
        userSelect: 'none',
      }}
    >
      {/* Tool modes */}
      {tools.map(t => (
        <ToolButton
          key={t.mode}
          active={toolMode === t.mode}
          onClick={() => setToolMode(t.mode)}
          title={t.title}
        >
          {t.icon}
        </ToolButton>
      ))}

      <Divider />

      {/* Undo / Redo */}
      <ToolButton active={false} onClick={undo} title="Undo (Ctrl+Z)">
        <span style={{ opacity: canUndo ? 1 : 0.3 }}>↩</span>
      </ToolButton>
      <ToolButton active={false} onClick={redo} title="Redo (Ctrl+Y)">
        <span style={{ opacity: canRedo ? 1 : 0.3 }}>↪</span>
      </ToolButton>

      <Divider />

      {/* View modes */}
      {views.map(v => (
        <ToolButton
          key={v.mode}
          active={viewMode === v.mode}
          onClick={() => setViewMode(v.mode)}
          title={v.title}
        >
          {v.icon}
        </ToolButton>
      ))}

      <Divider />

      {/* Render mode selector (visible in render/3d mode) */}
      {(viewMode === 'render' || viewMode === '3d') && (
        <>
          {renders.map(r => (
            <button
              key={r.mode}
              onClick={() => setRenderMode(r.mode)}
              style={{
                height: 32, padding: '0 10px',
                borderRadius: 8, border: 'none', cursor: 'pointer',
                backgroundColor: renderMode === r.mode ? '#1A2B4A' : '#F1F5F9',
                color: renderMode === r.mode ? 'white' : '#4B5563',
                fontSize: 11, fontWeight: 600, fontFamily: 'system-ui',
                transition: 'all 0.15s ease',
              }}
            >
              {r.label}
            </button>
          ))}
          <Divider />
        </>
      )}

      {/* Library / Renders */}
      {onOpenLibrary && (
        <ToolButton active={false} onClick={onOpenLibrary} title="Element Library">
          📦
        </ToolButton>
      )}
      {onOpenRenders && (
        <ToolButton active={false} onClick={onOpenRenders} title="AI Renders">
          🎨
        </ToolButton>
      )}
    </div>
  )
}
