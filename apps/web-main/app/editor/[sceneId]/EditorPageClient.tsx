'use client'

/**
 * /editor/[sceneId] — Client wrapper for the Pascal Editor
 *
 * Handles:
 * - Mounting PascalEditor with scene data from server
 * - Autosave via onSave callback → PUT /api/editor/scenes/[id]
 * - Upload mode (shows upload zone if ?mode=upload)
 * - Estimate export → links to /estimate with scene context
 * - Reel carousel for the project type
 * - Navigation between editor, upload, and renders
 */

import { useState, useCallback } from 'react'
import dynamic from 'next/dynamic'
import { useRouter } from 'next/navigation'
import type { PascalSceneData, ProjectType } from '@kealee/pascal-wrapper'
import { sceneToEstimateInput } from '@kealee/pascal-wrapper'
import UploadZone from '@/components/editor/UploadZone'
import ReelCarousel from '@/components/editor/ReelCarousel'
import RenderPanel from '@/components/editor/RenderPanel'
import { ChevronLeft, Upload, Film, Sparkles } from 'lucide-react'
import Link from 'next/link'

// Lazy-load the heavy 3D editor (prevents SSR issues with WebGL / R3F)
const PascalEditor = dynamic(
  () => import('@kealee/pascal-wrapper').then(m => m.PascalEditor),
  { ssr: false, loading: () => <EditorSkeleton /> },
)

function EditorSkeleton() {
  return (
    <div className="flex-1 flex items-center justify-center bg-[#F8FAFC]">
      <div className="text-center">
        <div className="w-12 h-12 border-4 border-[#E8724B] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p className="text-slate-500 text-sm">Loading Design Studio...</p>
      </div>
    </div>
  )
}

interface Props {
  sceneId: string
  initialScene: PascalSceneData
  sceneName: string
  projectType: string
  initialMode: string
}

type SidePanel = 'none' | 'upload' | 'reels' | 'renders'

export default function EditorPageClient({ sceneId, initialScene, sceneName, projectType, initialMode }: Props) {
  const router = useRouter()
  const [sidePanel, setSidePanel] = useState<SidePanel>(initialMode === 'upload' ? 'upload' : 'none')
  const [estimateQueued, setEstimateQueued] = useState(false)

  // Autosave handler
  const handleSave = useCallback(async (scene: PascalSceneData) => {
    await fetch(`/api/editor/scenes/${sceneId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sceneData: scene }),
    })
  }, [sceneId])

  // Generate estimate from scene geometry
  const handleExportEstimate = useCallback(async (input: ReturnType<typeof sceneToEstimateInput>) => {
    setEstimateQueued(true)
    // Store estimate context in sessionStorage, redirect to intake
    sessionStorage.setItem('pascal_estimate_context', JSON.stringify(input))
    sessionStorage.setItem('pascal_scene_id', sceneId)
    router.push(`/intake/concept?sceneId=${sceneId}&sqft=${Math.round(input.totalSqFt)}`)
  }, [sceneId, router])

  return (
    <div className="flex flex-col h-screen bg-[#F8FAFC] overflow-hidden">

      {/* Sub-nav */}
      <div className="flex items-center gap-3 px-4 py-2 bg-white border-b border-slate-200 flex-shrink-0">
        <Link href="/editor" className="flex items-center gap-1 text-xs text-slate-500 hover:text-slate-900 transition">
          <ChevronLeft className="w-3.5 h-3.5" /> Studio
        </Link>
        <span className="text-slate-300 text-xs">/</span>
        <span className="text-xs font-semibold text-slate-700 truncate">{sceneName}</span>
        <div className="flex-1" />

        {/* Panel toggles */}
        <button
          onClick={() => setSidePanel(p => p === 'upload' ? 'none' : 'upload')}
          className={`flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg transition ${sidePanel === 'upload' ? 'bg-[#6B46C1] text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
        >
          <Upload className="w-3 h-3" /> Upload
        </button>
        <button
          onClick={() => setSidePanel(p => p === 'renders' ? 'none' : 'renders')}
          className={`flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg transition ${sidePanel === 'renders' ? 'bg-[#E8724B] text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
        >
          <Sparkles className="w-3 h-3" /> AI Renders
        </button>
        <button
          onClick={() => setSidePanel(p => p === 'reels' ? 'none' : 'reels')}
          className={`flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg transition ${sidePanel === 'reels' ? 'bg-[#1A2B4A] text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
        >
          <Film className="w-3 h-3" /> Reels
        </button>
      </div>

      {/* Main content row */}
      <div className="flex flex-1 overflow-hidden">

        {/* Editor canvas */}
        <div className="flex-1 relative overflow-hidden">
          <PascalEditor
            initialScene={initialScene}
            projectType={projectType as ProjectType}
            name={sceneName}
            onSave={handleSave}
            onExportEstimate={handleExportEstimate}
            height="100%"
          />
        </div>

        {/* Side panel */}
        {sidePanel === 'upload' && (
          <div className="w-96 border-l border-slate-200 bg-white overflow-y-auto flex-shrink-0">
            <UploadZone sceneId={sceneId} />
          </div>
        )}
        {sidePanel === 'renders' && (
          <div className="w-96 border-l border-slate-200 bg-white overflow-y-auto flex-shrink-0">
            <RenderPanel sceneId={sceneId} projectType={projectType as ProjectType} />
          </div>
        )}
        {sidePanel === 'reels' && (
          <div className="w-96 border-l border-slate-200 bg-white overflow-y-auto flex-shrink-0">
            <ReelCarousel projectType={projectType as ProjectType} />
          </div>
        )}
      </div>
    </div>
  )
}
