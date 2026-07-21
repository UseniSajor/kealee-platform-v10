/**
 * Regenerate marketing/campaigns/rotation-8week.json from web-main marketing-engine.
 * Run: pnpm run generate:marketing-library
 */
import { writeFileSync, mkdirSync } from 'fs'
import { join } from 'path'
import {
  WEEKLY_CAMPAIGN_ROTATION,
  CAMPAIGN_TYPES,
  KEALEE_PRODUCTS,
  MARKETING_PERSONAS,
  CAMPAIGN_MESSAGE_TEMPLATES,
} from '../apps/web-main/lib/marketing/marketing-engine'

const root = join(__dirname, '..', 'marketing', 'campaigns')

type WeekKey = keyof typeof WEEKLY_CAMPAIGN_ROTATION

function buildWeekManifest(weekIndex: number, weekKey: WeekKey) {
  const weekCampaign = WEEKLY_CAMPAIGN_ROTATION[weekKey]
  const campaigns: Record<string, unknown>[] = []

  for (const [templateKey, day] of Object.entries(CAMPAIGN_TYPES)) {
    const product = KEALEE_PRODUCTS[weekCampaign.primary as keyof typeof KEALEE_PRODUCTS]
    const persona = MARKETING_PERSONAS[weekCampaign.persona as keyof typeof MARKETING_PERSONAS]
    if (!product || !persona) continue

    const templates =
      CAMPAIGN_MESSAGE_TEMPLATES[weekCampaign.primary as keyof typeof CAMPAIGN_MESSAGE_TEMPLATES]
    const msg = templates?.[templateKey as keyof typeof templates]

    campaigns.push({
      id: `${weekCampaign.primary}-w${weekIndex}-${templateKey}`,
      week_number: weekIndex,
      week_key: weekKey,
      product_id: weekCampaign.primary,
      secondary_product: weekCampaign.secondary,
      campaign_type: templateKey,
      persona_id: weekCampaign.persona,
      theme: weekCampaign.theme,
      scheduled_day: day.day,
      channels: day.channels,
      organic_channels: day.channels.filter(c =>
        ['email', 'web', 'slack', 'social', 'blog'].includes(c),
      ),
      email_subject: msg?.subject ?? `${product.name} — ${day.name}`,
      email_body_preview: (msg?.body ?? weekCampaign.theme).trim().slice(0, 200),
      status: 'scheduled',
    })
  }

  return {
    week_index: weekIndex,
    week_key: weekKey,
    primary_product: weekCampaign.primary,
    theme: weekCampaign.theme,
    campaigns,
  }
}

function main() {
  mkdirSync(root, { recursive: true })

  const weekKeys = Object.keys(WEEKLY_CAMPAIGN_ROTATION) as WeekKey[]
  const weeks = weekKeys.map((key, i) => buildWeekManifest(i + 1, key))

  const manifest = {
    id: 'rotation-8week',
    version: new Date().toISOString().slice(0, 10),
    title: '8-week product rotation (repeats annually)',
    updatedAt: new Date().toISOString(),
    source: 'apps/web-main/lib/marketing/marketing-engine.ts',
    canonicalUpsellPath: 'concept → permit → drawings',
    upsellPathRef: '../upsell-path.json',
    repeatNote: 'Week 9+ uses (weekNum - 1) % 8 rotation in campaign-runner',
    weeks,
    campaignTypes: CAMPAIGN_TYPES,
    products: Object.fromEntries(
      Object.entries(KEALEE_PRODUCTS).map(([k, v]) => [k, { id: v.id, name: v.name }]),
    ),
  }

  const outPath = join(root, 'rotation-8week.json')
  writeFileSync(outPath, JSON.stringify(manifest, null, 2), 'utf8')
  console.log(`Wrote ${outPath} (${weeks.length} weeks, ${weeks.reduce((n, w) => n + w.campaigns.length, 0)} campaign slots)`)
}

main()
