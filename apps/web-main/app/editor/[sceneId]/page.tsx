/**
 * /editor/[sceneId] — Main Pascal Editor page
 *
 * Server component that fetches scene data then renders the client editor.
 * Autosave is handled client-side via the PascalEditor onSave callback.
 */

import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { getSupabaseAdmin } from '@/lib/supabase-server'
import EditorPageClient from './EditorPageClient'

interface Props {
  params: { sceneId: string }
  searchParams: { mode?: string }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  return {
    title: 'Design Studio — Kealee',
    description: 'Visual floor plan editor — sketch your project, get an AI estimate.',
    robots: 'noindex',
  }
}

export default async function EditorScenePage({ params, searchParams }: Props) {
  const supabase = getSupabaseAdmin()
  const { data: scene, error } = await supabase
    .from('pascal_scenes')
    .select('*')
    .eq('id', params.sceneId)
    .eq('is_deleted', false)
    .single()

  if (error || !scene) notFound()

  return (
    <EditorPageClient
      sceneId={params.sceneId}
      initialScene={scene.scene_data}
      sceneName={scene.name}
      projectType={scene.project_type?.toLowerCase() ?? 'addition'}
      initialMode={searchParams.mode ?? 'draw'}
    />
  )
}
