import type { Metadata } from 'next'
import EditorHomeClient from './EditorHomeClient'

export const metadata: Metadata = {
  title: 'Design Studio — Kealee',
  description: 'Sketch your project, get an AI estimate, and start your Kealee build journey. Visual floor plan editor for additions, kitchen remodels, baths, ADUs, and more.',
}

export default function EditorPage() {
  return <EditorHomeClient />
}
