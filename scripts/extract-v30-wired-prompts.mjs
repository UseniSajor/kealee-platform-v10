/**
 * Extract bot prompts from Kealee Platform Agents/KEALEE-v30-ALL-10-BOTS-COMPLETE-WIRED.md
 * into packages/kealee-agent-stack/src/v30/prompts/*.ts
 */
import fs from 'fs'
import path from 'path'

const root = path.resolve(import.meta.dirname ?? '.', '..')
const src = path.join(root, 'Kealee Platform Agents/KEALEE-v30-ALL-10-BOTS-COMPLETE-WIRED.md')
const outDir = path.join(root, 'packages/kealee-agent-stack/src/v30/prompts')

const MAP = [
  ['INTAKE_BOT_SYSTEM_PROMPT', 'intake-bot.ts', 'INTAKE_BOT_PROMPT'],
  ['DESIGN_BOT_SYSTEM_PROMPT', 'design-bot.ts', 'DESIGN_BOT_PROMPT'],
  ['ESTIMATE_BOT_SYSTEM_PROMPT', 'estimate-bot.ts', 'ESTIMATE_BOT_PROMPT'],
  ['ZONING_BOT_SYSTEM_PROMPT', 'zoning-bot.ts', 'ZONING_BOT_PROMPT'],
  ['FLOORPLAN_BOT_SYSTEM_PROMPT', 'floorplan-bot.ts', 'FLOORPLAN_BOT_PROMPT'],
  ['PERMIT_BOT_SYSTEM_PROMPT', 'permit-bot.ts', 'PERMIT_BOT_PROMPT'],
  ['VIDEO_BOT_SYSTEM_PROMPT', 'video-bot.ts', 'VIDEO_BOT_PROMPT'],
  ['CONTRACTOR_BOT_SYSTEM_PROMPT', 'contractor-bot.ts', 'CONTRACTOR_BOT_PROMPT'],
  ['SALES_BOT_SYSTEM_PROMPT', 'sales-bot.ts', 'SALES_BOT_PROMPT'],
  ['PROJECT_BOT_SYSTEM_PROMPT', 'project-bot.ts', 'PROJECT_BOT_PROMPT'],
]

const md = fs.readFileSync(src, 'utf8')

for (const [constName, file, exportName] of MAP) {
  const re = new RegExp(
    `export const ${constName} = \`([\\s\\S]*?)\`;\\s*\n\`\`\``,
    'm',
  )
  const m = md.match(re)
  if (!m) {
    console.error('Missing', constName)
    process.exitCode = 1
    continue
  }
  const body = m[1].trim().replace(/\\/g, '\\\\').replace(/`/g, '\\`')
  const content = `/** Wired from Kealee Platform Agents/KEALEE-v30-ALL-10-BOTS-COMPLETE-WIRED.md */\nexport const ${exportName} = \`${body}\`\n`
  fs.writeFileSync(path.join(outDir, file), content)
  console.log('Wrote', file, body.length, 'chars')
}
