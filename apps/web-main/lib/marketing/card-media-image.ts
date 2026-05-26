import OpenAI from 'openai'
import Replicate from 'replicate'
import type { CardMediaSpec } from './card-media-spec'

const QUALITY_SUFFIX =
  'photorealistic, square 1:1 composition, professional real-estate photography, no people, no logos, no watermarks, 8k'

function buildDallePrompt(spec: CardMediaSpec, description: string): string {
  const room = spec.roomType ?? 'space'
  if (spec.imageType === 'before') {
    return `Before renovation: ${description}. Dated worn ${room}, needs remodel, same camera angle as after shot. ${QUALITY_SUFFIX}`
  }
  if (spec.imageType === 'hero' || spec.imageType === 'after') {
    return `Hero showcase: ${description}. Beautiful renovated ${room} with ${spec.style} design. ${QUALITY_SUFFIX}`
  }
  if (spec.imageType === 'trend') {
    return `Construction industry visual: ${description}. ${spec.style} aesthetic. ${QUALITY_SUFFIX}`
  }
  return `${description}. ${spec.style} style ${room}. ${QUALITY_SUFFIX}`
}

async function generateWithDalle(spec: CardMediaSpec, description: string): Promise<string> {
  const apiKey = process.env.OPENAI_API_KEY
  if (!apiKey) throw new Error('OPENAI_API_KEY not set')

  const openai = new OpenAI({ apiKey })
  const prompt = buildDallePrompt(spec, description)

  const response = await openai.images.generate({
    model: 'dall-e-3',
    prompt,
    n: 1,
    size: '1024x1024',
    quality: 'hd',
    style: spec.imageType === 'detail' ? 'natural' : 'vivid',
  })

  const url = response.data?.[0]?.url
  if (!url) throw new Error('DALL-E returned no image URL')
  return url
}

async function generateWithReplicate(spec: CardMediaSpec, description: string): Promise<string> {
  const token = process.env.REPLICATE_API_TOKEN
  if (!token) throw new Error('REPLICATE_API_TOKEN not set')

  const replicate = new Replicate({ auth: token })
  const prompt = [
    spec.title,
    description,
    spec.style,
    QUALITY_SUFFIX,
  ].join(', ')

  const output = (await replicate.run('stability-ai/sdxl:latest', {
    input: { prompt, width: 1024, height: 1024, num_outputs: 1 },
  })) as string[]

  if (!output?.[0]) throw new Error('Replicate SDXL returned no image')
  return output[0]
}

/** DesignBot / concept-engine image path (DALL-E primary, Replicate SDXL fallback). */
export async function generateCardImageUrl(
  spec: CardMediaSpec,
  description: string,
): Promise<string> {
  if (process.env.OPENAI_API_KEY) {
    try {
      return await generateWithDalle(spec, description)
    } catch (err) {
      console.warn('[card-media-image] DALL-E failed, trying Replicate:', err)
    }
  }
  return generateWithReplicate(spec, description)
}
