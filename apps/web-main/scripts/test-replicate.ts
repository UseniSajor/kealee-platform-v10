import Replicate from 'replicate'
import { join } from 'path'
import { existsSync, readFileSync } from 'fs'

const webMainRoot = join(__dirname, '..')
for (const name of ['.env.local', '.env.vercel.production', '.env']) {
  const p = join(webMainRoot, name)
  if (!existsSync(p)) continue
  for (const line of readFileSync(p, 'utf8').split(/\r?\n/)) {
    const t = line.trim()
    if (!t || t.startsWith('#')) continue
    const eq = t.indexOf('=')
    if (eq < 1) continue
    const key = t.slice(0, eq).trim()
    if (!process.env[key]) process.env[key] = t.slice(eq + 1).trim().replace(/^["']|["']$/g, '')
  }
}

async function test() {
  const token = process.env.REPLICATE_API_TOKEN
  console.log('REPLICATE_API_TOKEN present:', Boolean(token))
  const replicate = new Replicate({ auth: token })
  let prediction = await replicate.predictions.create({
    model: 'black-forest-labs/flux-1.1-pro-ultra',
    input: {
      prompt: 'A simple red apple on a clean wooden table, square 1:1, photorealistic',
      aspect_ratio: '1:1',
      raw: false,
      safety_tolerance: 2,
    },
  })
  
  console.log('Prediction created:', prediction.id, 'Status:', prediction.status)
  
  while (prediction.status !== 'succeeded' && prediction.status !== 'failed' && prediction.status !== 'canceled') {
    await new Promise((resolve) => setTimeout(resolve, 2000))
    prediction = await replicate.predictions.get(prediction.id)
    console.log('Polling prediction status:', prediction.status)
  }
  
  if (prediction.status === 'succeeded') {
    console.log('Success! Output:', prediction.output)
  } else {
    console.error('Failed! Error:', prediction.error)
  }
}

test().catch(console.error)
