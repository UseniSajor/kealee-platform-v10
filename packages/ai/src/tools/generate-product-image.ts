import OpenAI from "openai";
import * as fs from "fs";
import * as path from "path";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export const GENERATE_PRODUCT_IMAGE_TOOL_DEF = {
  name: "generate_product_image",
  description:
    "Generate professional before/after images for renovation products using DALL-E 3. Call this when you need product images for home page carousel, product pages, or design inspiration.",
  input_schema: {
    type: "object",
    properties: {
      product_id: {
        type: "string",
        description:
          "Product ID or name (e.g., 'kitchen-remodel', 'bathroom-renovation')",
      },
      image_type: {
        type: "string",
        enum: ["before", "after", "hero", "trend", "detail"],
        description:
          "Type of image: before (unfinished), after (completed), hero (showcase), trend (industry trend), detail (close-up)",
      },
      description: {
        type: "string",
        description:
          "Detailed prompt describing what to generate. Be specific about materials, colors, style.",
      },
      style: {
        type: "string",
        enum: [
          "modern",
          "contemporary",
          "traditional",
          "transitional",
          "minimalist",
          "luxury",
          "rustic",
          "industrial",
        ],
        description: "Design style to ensure visual consistency",
      },
      room_type: {
        type: "string",
        description:
          "Room type if applicable (kitchen, bathroom, bedroom, living room, etc.)",
      },
    },
    required: ["product_id", "image_type", "description", "style"],
  },
};

interface GenerateImageInput {
  product_id: string;
  image_type: string;
  description: string;
  style: string;
  room_type?: string;
}

interface GenerateImageResult {
  success: boolean;
  product_id: string;
  image_type: string;
  image_url: string;
  style: string;
  prompt_used: string;
  db_save_command?: string;
  error?: string;
}

/**
 * Generate a product image using DALL-E 3
 * In production, this would also save to database via API call
 */
export async function generate_product_image(
  input: GenerateImageInput | string,
  ...args: unknown[]
): Promise<GenerateImageResult> {
  // Handle both string and object input formats
  let params: GenerateImageInput;

  if (typeof input === "object" && input !== null) {
    params = input as GenerateImageInput;
  } else {
    // Fallback parsing if called with string arg
    return {
      success: false,
      product_id: "unknown",
      image_type: "unknown",
      image_url: "",
      style: "unknown",
      prompt_used: "",
      error: "Invalid input format",
    };
  }

  const { product_id, image_type, description, style, room_type } = params;

  // Build detailed prompt
  let fullPrompt = "";
  if (image_type === "before") {
    fullPrompt = `BEFORE renovation image: ${description}. 
Show an unfinished, dated ${room_type || "space"} in need of renovation. 
Realistic photography style. Professional quality. Modern camera angle.`;
  } else if (image_type === "after") {
    fullPrompt = `AFTER renovation image: ${description}. 
Show a beautifully renovated ${room_type || "space"} with ${style} design aesthetic. 
Magazine-quality photography. Professional lighting. Design showcase style.`;
  } else if (image_type === "hero") {
    fullPrompt = `Hero showcase image: ${description}. 
Stunning ${style} design aesthetic. Professional architectural photography. 
High-end finish showcase. Dramatic lighting. Magazine cover quality. 
Perfect for home page carousel.`;
  } else if (image_type === "trend") {
    fullPrompt = `Construction industry trend image: ${description}. 
Showcase cutting-edge design trends in ${room_type || "home renovation"}. 
${style} aesthetic with modern finishes. Professional photography. 
Show why this trend is popular. Architectural digest quality.`;
  } else if (image_type === "detail") {
    fullPrompt = `Close-up detail shot: ${description}. 
Macro photography of high-end finishes and materials. 
Professional product photography style. Museum lighting. 
Show craftsmanship and quality. Ultra sharp focus.`;
  }

  // Add style descriptor
  fullPrompt += `\n\nStyle: ${style}. Professional photography. No people. No watermarks. 4K quality.`;

  try {
    console.log(`[keabot-design] Generating ${image_type} image for ${product_id}...`);
    console.log(`[keabot-design] Prompt: ${fullPrompt.substring(0, 100)}...`);

    const response = await openai.images.generate({
      model: "dall-e-3",
      prompt: fullPrompt,
      n: 1,
      size: "1024x1024",
      quality: "hd",
      style: image_type === "before" ? "natural" : "vivid",
    });

    if (!response.data || !response.data[0]?.url) {
      throw new Error("No image URL returned from DALL-E");
    }

    const imageUrl = response.data[0].url;

    console.log(`[keabot-design] ✅ Generated ${image_type} image for ${product_id}`);

    // In production, call API endpoint to save to database
    // This would be: POST /api/images with { productId, type, url, prompt, style }
    const dbSaveCommand = `
      curl -X POST https://arstic-kindness.up.railway.app/api/product-images \\
        -H "Content-Type: application/json" \\
        -H "Authorization: Bearer YOUR_API_KEY" \\
        -d '{
          "productId": "${product_id}",
          "type": "${image_type}",
          "url": "${imageUrl}",
          "prompt": "${description}",
          "style": "${style}"
        }'
    `;

    return {
      success: true,
      product_id,
      image_type,
      image_url: imageUrl,
      style,
      prompt_used: fullPrompt,
      db_save_command: dbSaveCommand,
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error(`[keabot-design] ❌ Failed to generate image: ${errorMessage}`);

    return {
      success: false,
      product_id,
      image_type,
      image_url: "",
      style,
      prompt_used: fullPrompt,
      error: errorMessage,
    };
  }
}

/**
 * Batch generate images for a product (5 unique variants)
 */
export async function generate_product_image_set(productId: string, productName: string) {
  const styles = [
    "modern",
    "contemporary",
    "traditional",
    "transitional",
    "luxury",
  ];

  const images: GenerateImageResult[] = [];

  console.log(`\n[keabot-design] 🎨 Generating 5-image set for: ${productName}`);

  for (let i = 0; i < styles.length; i++) {
    const style = styles[i];

    // Generate before image
    const beforeResult = await generate_product_image({
      product_id: productId,
      image_type: "before",
      description: `A typical ${productName.toLowerCase()} space before renovation`,
      style: style,
    });

    images.push(beforeResult);

    // Generate after image
    const afterResult = await generate_product_image({
      product_id: productId,
      image_type: "after",
      description: `A beautifully renovated ${productName.toLowerCase()} with high-end finishes`,
      style: style,
    });

    images.push(afterResult);
  }

  const successful = images.filter((img) => img.success).length;
  console.log(
    `[keabot-design] ✅ Generated ${successful}/${images.length} images for ${productName}`
  );

  return images;
}
