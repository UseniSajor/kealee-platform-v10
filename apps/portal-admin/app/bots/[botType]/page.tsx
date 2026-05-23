import { BotPromptEditor } from './BotPromptEditor'

const TYPES = new Set([
  'intake', 'design', 'estimate', 'zoning', 'floorplan', 'permit', 'video', 'contractor', 'sales', 'marketing', 'support', 'project',
])

export default async function BotPromptPage({ params }: { params: Promise<{ botType: string }> }) {
  const { botType } = await params
  if (!TYPES.has(botType)) {
    return <main style={{ padding: 32 }}>Unknown bot: {botType}</main>
  }

  return (
    <main style={{ maxWidth: 900, margin: '0 auto', padding: 32 }}>
      <BotPromptEditor botType={botType} />
    </main>
  )
}
