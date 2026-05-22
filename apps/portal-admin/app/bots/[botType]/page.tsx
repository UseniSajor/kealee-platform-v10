import Link from 'next/link'
import { V30Prompts } from '@kealee/kealee-agent-stack'
import type { V30BotType } from '@kealee/kealee-agent-stack'

const TYPES = [
  'intake', 'design', 'estimate', 'zoning', 'floorplan', 'permit', 'video', 'contractor', 'sales', 'support', 'project',
] as const

export default async function BotPromptPage({ params }: { params: Promise<{ botType: string }> }) {
  const { botType } = await params
  const type = TYPES.includes(botType as (typeof TYPES)[number]) ? (botType as V30BotType) : null
  const prompt = type ? V30Prompts.getV30SystemPrompt(type) : ''

  return (
    <main style={{ maxWidth: 800, margin: '0 auto', padding: 32 }}>
      <Link href="/" style={{ fontSize: 13, color: '#7c3aed' }}>← Admin</Link>
      <h1 style={{ fontSize: 22 }}>{botType} system prompt</h1>
      <pre
        style={{
          fontSize: 11,
          background: '#0f172a',
          color: '#e2e8f0',
          padding: 16,
          borderRadius: 8,
          overflow: 'auto',
          maxHeight: '70vh',
          whiteSpace: 'pre-wrap',
        }}
      >
        {prompt || 'Unknown bot type'}
      </pre>
    </main>
  )
}
