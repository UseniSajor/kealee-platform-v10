'use client'

/**
 * @kealee/pascal-wrapper — PascalEditor
 *
 * Top-level editor component. Composes all sub-components into
 * the full Pascal Editor experience inside Kealee.
 *
 * Features:
 * - 2D SVG floor plan editor
 * - 3D Three.js scene viewer
 * - Element library panel
 * - Properties panel
 * - Floating toolbar
 * - Autosave
 * - Keyboard shortcuts
 * - AI geometry export
 */

import React, { useState, useCallback, useEffect, useRef } from 'react'
import { EditorProvider, useEditorStore } from './SceneContext'
import type { PascalSceneData, ProjectType } from './types'
import { createDefaultScene } from './SceneContext'
import { FloorPlanCanvas } from './components/FloorPlanCanvas'
import { SceneViewer3D } from './components/SceneViewer3D'
import { EditorToolBar } from './components/EditorToolBar'
import { ElementLibrary } from './components/ElementLibrary'
import { PropertiesPanel } from './components/PropertiesPanel'
import { sceneToEstimateInput } from './utils/scene-to-estimate'

// ---------------------------------------------------------------------------
// Floor selector
// ---------------------------------------------------------------------------

function FloorSelector() {
  const { scene, activeFloorId, setActiveFloor, addFloor } = useEditorStore(s => s)
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '0 12px' }}>
      {scene.floors.map(f => (
        <button
          key={f.id}
          onClick={() => setActiveFloor(f.id)}
          style={{
            padding: '4px 12px', borderRadius: 6, border: 'none', cursor: 'pointer', fontSize: 11, fontWeight: 600,
            backgroundColor: activeFloorId === f.id ? '#1A2B4A' : '#F1F5F9',
            color: activeFloorId === f.id ? 'white' : '#4B5563',
          }}
        >
          {f.name}
        </button>
      ))}
      <button
        onClick={() => addFloor(`Floor ${scene.floors.length + 1}`, scene.floors.length)}
        style={{ padding: '4px 10px', borderRadius: 6, border: '1px dashed #CBD5E1', background: 'none', cursor: 'pointer', fontSize: 11, color: '#9CA3AF' }}
      >
        + Add Floor
      </button>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Save indicator
// ---------------------------------------------------------------------------

function SaveIndicator({ onSave }: { onSave?: (scene: PascalSceneData) => Promise<void> }) {
  const { isDirty, isSaving, scene, setIsSaving, setIsDirty } = useEditorStore(s => s)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    if (!isDirty || !onSave) return
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(async () => {
      setIsSaving(true)
      try {
        await onSave(scene)
        setIsDirty(false)
      } finally {
        setIsSaving(false)
      }
    }, 2000)
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current) }
  }, [isDirty, scene, onSave, setIsSaving, setIsDirty])

  const color = isSaving ? '#F59E0B' : isDirty ? '#E8724B' : '#10B981'
  const label = isSaving ? 'Saving...' : isDirty ? 'Unsaved changes' : 'Saved'

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color, fontFamily: 'system-ui' }}>
      <div style={{ width: 6, height: 6, borderRadius: '50%', backgroundColor: color }} />
      {label}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Inner editor (uses store)
// ---------------------------------------------------------------------------

interface InnerEditorProps {
  onSave?: (scene: PascalSceneData) => Promise<void>
  onExportEstimate?: (input: ReturnType<typeof sceneToEstimateInput>) => void
  showReels?: boolean
  height?: string | number
}

const InnerEditor: React.FC<InnerEditorProps> = ({ onSave, onExportEstimate, height = '100vh' }) => {
  const { viewMode, scene } = useEditorStore(s => s)
  const [libraryOpen, setLibraryOpen] = useState(false)

  // Keyboard shortcuts
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return
      // (shortcuts handled in toolbar — extend here as needed)
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [])

  const handleExportEstimate = useCallback(() => {
    if (onExportEstimate) {
      onExportEstimate(sceneToEstimateInput(scene))
    }
  }, [scene, onExportEstimate])

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height, backgroundColor: '#F8FAFC', fontFamily: 'system-ui, sans-serif' }}>

      {/* Top bar */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        height: 52, backgroundColor: 'white', borderBottom: '1px solid #E5E7EB',
        padding: '0 16px', gap: 16, flexShrink: 0,
      }}>
        {/* Left: logo + scene name */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, minWidth: 0 }}>
          <div style={{ width: 28, height: 28, borderRadius: 6, backgroundColor: '#1A2B4A', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <span style={{ color: '#E8724B', fontSize: 12, fontWeight: 900 }}>K</span>
          </div>
          <span style={{ fontSize: 13, fontWeight: 700, color: '#1A2B4A', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {scene.name}
          </span>
        </div>

        {/* Center: floor selector */}
        <FloorSelector />

        {/* Right: save + actions */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexShrink: 0 }}>
          <SaveIndicator onSave={onSave} />
          {onExportEstimate && (
            <button
              onClick={handleExportEstimate}
              style={{
                padding: '6px 14px', borderRadius: 8, border: 'none', cursor: 'pointer',
                backgroundColor: '#E8724B', color: 'white', fontSize: 12, fontWeight: 700,
              }}
            >
              Generate Estimate
            </button>
          )}
        </div>
      </div>

      {/* Main area */}
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden', position: 'relative' }}>

        {/* Canvas area */}
        <div style={{ flex: 1, position: 'relative', overflow: 'hidden' }}>
          {viewMode === '2d' && (
            <FloorPlanCanvas
              width={undefined as unknown as number}
              height={undefined as unknown as number}
              className="w-full h-full"
            />
          )}
          {(viewMode === '3d' || viewMode === 'render' || viewMode === 'walkthrough') && (
            <SceneViewer3D width="100%" height="100%" />
          )}

          {/* Floating toolbar */}
          <div style={{ position: 'absolute', top: 16, left: '50%', transform: 'translateX(-50%)', zIndex: 20 }}>
            <EditorToolBar
              onOpenLibrary={() => setLibraryOpen(v => !v)}
            />
          </div>

          {/* Zoom indicator */}
          <div style={{ position: 'absolute', bottom: 16, left: 16, fontSize: 10, color: '#9CA3AF', fontFamily: 'system-ui', backgroundColor: 'white', padding: '3px 8px', borderRadius: 4, border: '1px solid #E5E7EB' }}>
            <ViewModeZoomLabel />
          </div>
        </div>

        {/* Element library (slide-over) */}
        {libraryOpen && (
          <ElementLibrary onClose={() => setLibraryOpen(false)} />
        )}

        {/* Properties panel (always visible) */}
        <PropertiesPanel />
      </div>
    </div>
  )
}

function ViewModeZoomLabel() {
  const { zoom, viewMode } = useEditorStore(s => s)
  return <>{viewMode === '2d' ? `${Math.round(zoom * 100)}%` : '3D'}</>
}

// ---------------------------------------------------------------------------
// Public export: PascalEditor
// ---------------------------------------------------------------------------

export interface PascalEditorProps {
  /** Initial scene data. If omitted, a blank scene is created. */
  initialScene?: PascalSceneData
  /** Project type (used when creating a blank scene). */
  projectType?: ProjectType
  /** Scene name (used when creating a blank scene). */
  name?: string
  /** Called when scene is saved (for persistence). Return a promise that resolves when saved. */
  onSave?: (scene: PascalSceneData) => Promise<void>
  /** Called when user clicks "Generate Estimate". Receives structured quantities. */
  onExportEstimate?: (input: ReturnType<typeof sceneToEstimateInput>) => void
  /** Editor container height */
  height?: string | number
  className?: string
}

export const PascalEditor: React.FC<PascalEditorProps> = ({
  initialScene,
  projectType = 'addition',
  name = 'New Project',
  onSave,
  onExportEstimate,
  height = '100vh',
  className,
}) => {
  const scene = initialScene ?? createDefaultScene(projectType, name)
  return (
    <EditorProvider initialScene={scene}>
      <div className={className} style={{ height }}>
        <InnerEditor onSave={onSave} onExportEstimate={onExportEstimate} height={height} />
      </div>
    </EditorProvider>
  )
}
