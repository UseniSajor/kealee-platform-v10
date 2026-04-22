/**
 * Concept Image Generator Service (Enhancement 2)
 * Generates concept renderings via AI (Stable Diffusion, Midjourney, or Claude Vision)
 * Pattern: Take concept data → Generate prompt → Call AI API → Return image URLs
 */

import { Anthropic } from '@anthropic-ai/sdk'

// ============================================================================
// Types
// ============================================================================

export interface ConceptImageInput {
  title: string
  description?: string
  styleDirection?: string
  projectType?: string
  existingPhotos?: string[] // URLs to reference photos
}

export interface ConceptImageOutput {
  url: string
  label: string
  caption: string
  prompt: string
  format: 'jpg' | 'png'
}

// ============================================================================
// Prompt Generation (Enhancement 2A)
// ============================================================================

function generateImagePrompt(input: ConceptImageInput, type: 'exterior' | 'interior'): string {
  const basePrompt = `Create a professional architectural ${type} rendering for: "${input.title}"`

  const components: string[] = [basePrompt]

  if (input.description) {
    components.push(`Description: ${input.description}`)
  }

  if (input.styleDirection) {
    components.push(`Style: ${input.styleDirection}`)
  }

  // Project-specific details
  switch (input.projectType) {
    case 'kitchen_remodel':
      if (type === 'interior') {
        components.push(
          'Modern kitchen with high-end appliances, granite counters, custom cabinetry, pendant lighting'
        )
      }
      break
    case 'bathroom_remodel':
      if (type === 'interior') {
        components.push('Spa-like bathroom with custom tile, double vanity, soaking tub, walk-in shower')
      }
      break
    case 'exterior_renovation':
      if (type === 'exterior') {
        components.push('Modern exterior with updated siding, new windows, landscaping, driveway')
      }
      break
  }

  // Add quality directive
  components.push('Professional architectural photography style, photorealistic, high detail, well-lit')

  return components.join('. ')
}

// ============================================================================
// Claude Vision-based Image Description (Enhancement 2B)
// ============================================================================

export async function generateConceptDescriptionViaVision(
  input: ConceptImageInput,
  existingPhotoUrl?: string
): Promise<string> {
  try {
    const client = new Anthropic()

    if (!existingPhotoUrl) {
      return generateImagePrompt(input, 'interior')
    }

    // If we have an existing photo, analyze it and suggest modifications
    const message = await client.messages.create({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 1024,
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'image',
              source: {
                type: 'url',
                url: existingPhotoUrl,
              },
            },
            {
              type: 'text',
              text: `Analyze this ${input.projectType || 'interior'} space and describe how it should look after the following concept update:

Title: ${input.title}
Description: ${input.description || 'See photo'}
Style Direction: ${input.styleDirection || 'Modern and contemporary'}

Provide a detailed description of the expected result that could be used to generate a rendering.`,
            },
          ],
        },
      ],
    })

    const textContent = message.content.find((block) => block.type === 'text')
    return textContent && 'text' in textContent ? textContent.text : generateImagePrompt(input, 'interior')
  } catch (err) {
    console.error('[Image Generation] Vision analysis failed:', err)
    return generateImagePrompt(input, 'interior')
  }
}

// ============================================================================
// Image Generation via API (Enhancement 2C - Placeholder for Future Integration)
// ============================================================================

export async function generateConceptImages(
  input: ConceptImageInput
): Promise<ConceptImageOutput[]> {
  try {
    // NOTE: This is a placeholder for actual image generation
    // In production, integrate with:
    // - Stable Diffusion API (https://api.stability.ai)
    // - Midjourney (via API if available)
    // - DALL-E 3 (via OpenAI API)
    // - Kealee's custom rendering service

    const images: ConceptImageOutput[] = []

    // Generate exterior concept
    const exteriorPrompt = generateImagePrompt(input, 'exterior')
    images.push({
      url: 'https://placeholder.kealee.com/concepts/exterior.jpg', // Replace with actual image URL
      label: 'Exterior Concept',
      caption: 'Proposed exterior rendering',
      prompt: exteriorPrompt,
      format: 'jpg',
    })

    // Generate interior concept
    const interiorPrompt = generateImagePrompt(input, 'interior')
    images.push({
      url: 'https://placeholder.kealee.com/concepts/interior.jpg', // Replace with actual image URL
      label: 'Interior Concept',
      caption: 'Proposed interior rendering',
      prompt: interiorPrompt,
      format: 'jpg',
    })

    // TODO: Integrate actual image generation API
    // Example for Stable Diffusion:
    /*
    const stabilityResponse = await fetch('https://api.stability.ai/v2beta/stable-image/generate/core', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.STABILITY_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        prompt: exteriorPrompt,
        aspect_ratio: '16:9',
        output_format: 'jpeg',
      }),
    })

    const stabilityData = await stabilityResponse.json()
    // Process and store image...
    */

    return images
  } catch (err: any) {
    console.error('[Image Generation] Failed to generate concept images:', err?.message)
    return []
  }
}

// ============================================================================
// Mock Image Data for Testing
// ============================================================================

export function getMockConceptImages(input: ConceptImageInput): ConceptImageOutput[] {
  return [
    {
      url: 'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=800',
      label: 'Concept 1',
      caption: 'Modern kitchen design with open shelving',
      prompt: generateImagePrompt(input, 'interior'),
      format: 'jpg',
    },
    {
      url: 'https://images.unsplash.com/photo-1556909294-8e5d7d42e8a3?w=800',
      label: 'Concept 2',
      caption: 'Alternative layout with island seating',
      prompt: generateImagePrompt(input, 'interior'),
      format: 'jpg',
    },
    {
      url: 'https://images.unsplash.com/photo-1596178065887-8f38f6834daf?w=800',
      label: 'Concept 3',
      caption: 'Traditional kitchen style',
      prompt: generateImagePrompt(input, 'interior'),
      format: 'jpg',
    },
  ]
}

// ============================================================================
// Store Generated Images
// ============================================================================

export interface StorageResult {
  imageUrls: string[]
  fileUploadIds: string[]
}

export async function storeConceptImages(
  images: ConceptImageOutput[],
  deps: { storage: any; prisma: any }
): Promise<StorageResult> {
  try {
    const imageUrls: string[] = []
    const fileUploadIds: string[] = []

    // Upload each image to Supabase Storage
    for (const image of images) {
      // Fetch image from URL
      const response = await fetch(image.url)
      const buffer = await response.arrayBuffer()

      // Upload to Supabase (simulated)
      // In production: use @kealee/storage uploadFile()
      imageUrls.push(image.url)

      // Create FileUpload record
      // In production: await createFileUpload({...})
    }

    return { imageUrls, fileUploadIds }
  } catch (err: any) {
    console.error('[Image Storage] Failed to store concept images:', err?.message)
    return { imageUrls: [], fileUploadIds: [] }
  }
}
