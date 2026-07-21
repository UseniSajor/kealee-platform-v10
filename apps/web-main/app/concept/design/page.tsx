import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { Container } from '@/components/ui/Container'

export const metadata: Metadata = {
  title: 'AI Design Intake — Kealee',
  description: 'Tell us about your project and get an AI-generated concept package.',
}

interface Props {
  searchParams: Promise<{ path?: string }>
}

export default async function ConceptDesignPage({ searchParams }: Props) {
  const params = await searchParams
  const projectPath = params.path

  if (!projectPath) {
    redirect('/concept')
  }

  // Redirect to the existing intake form with the project path
  redirect(`/intake/${projectPath}`)
}
