import { tool } from "@langchain/core/tools";
import { z } from "zod";
import Anthropic from "@anthropic-ai/sdk";
import OpenAI from "openai";
import type {
  Complexity,
  DesignBrief,
  PermitPathSummary,
  SiteContext,
  VisionAnalysis,
} from "./types";

function id(prefix: string) {
  return `${prefix}_${Math.random().toString(36).slice(2, 10)}`;
}

function getAnthropicClient(): Anthropic {
  return new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
}

function getOpenAIClient(): OpenAI {
  return new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
}

/**
 * Generate a single image via DALL-E 3 and return its URL.
 * Falls back to null on failure so callers can handle gracefully.
 */
async function generateDalleImage(prompt: string, size: "1792x1024" | "1024x1792" | "1024x1024" = "1792x1024"): Promise<string | null> {
  try {
    const client = getOpenAIClient();
    const response = await client.images.generate({
      model: "dall-e-3",
      prompt,
      n: 1,
      size,
      quality: "hd",
      response_format: "url",
    });
    return response.data[0]?.url ?? null;
  } catch (err) {
    console.warn("[generateDalleImage] DALL-E 3 call failed:", (err as Error).message);
    return null;
  }
}

export const createIntakeRecord = tool(
  async (input: { clientName: string; contactEmail: string; contactPhone?: string; projectAddress: string; projectType: string }) => {
    return {
      intakeId: id("intake"),
      createdAt: new Date().toISOString(),
      ...input,
    };
  },
  {
    name: "createIntakeRecord",
    description: "Create a new intake record.",
    schema: z.object({
      clientName: z.string(),
      contactEmail: z.string().email(),
      contactPhone: z.string().optional(),
      projectAddress: z.string(),
      projectType: z.string(),
    }),
  },
);

export const updateIntakeRecord = tool(
  async (input: { intakeId: string; fields: Record<string, unknown> }) => {
    return {
      updated: true,
      intakeId: input.intakeId,
      fields: input.fields,
      updatedAt: new Date().toISOString(),
    };
  },
  {
    name: "updateIntakeRecord",
    description: "Update an intake record.",
    schema: z.object({
      intakeId: z.string(),
      fields: z.record(z.string(), z.any()),
    }),
  },
);

export const fetchPropertyContext = tool(
  async (input: { projectAddress: string }): Promise<SiteContext & { jurisdiction: string }> => {
    return {
      jurisdiction: input.projectAddress.includes("DC") ? "Washington, DC" : "Prince George's County, MD",
      streetViewAvailable: true,
      satelliteViewAvailable: true,
      visibleBuildingFootprintNotes: "Approximate rectangular single-family footprint visible from map context.",
      topographyNotes: "Mostly flat front setback with minor side grade variation.",
      neighborhoodContextNotes: "Predominantly brick and siding homes with moderate front-yard landscaping.",
    };
  },
  {
    name: "fetchPropertyContext",
    description: "Fetch basic property context from address input.",
    schema: z.object({
      projectAddress: z.string(),
    }),
  },
);

export const analyzeUploadedPhotos = tool(
  async (input: { intakeId: string; photoUrls: string[] }): Promise<VisionAnalysis> => {
    // No photos — return confident fallback immediately
    if (!input.photoUrls || input.photoUrls.length === 0) {
      return {
        buildingType: "single-family detached",
        estimatedStories: "2",
        roofForm: "gable",
        facadeMaterials: ["brick", "painted trim"],
        siteFeatures: ["front walk", "driveway"],
        landscapeConditions: ["sparse foundation planting"],
        confidence: 0.4,
      };
    }

    try {
      const client = getAnthropicClient();

      // Build image content blocks — use up to 3 photos for analysis
      const photoUrls = input.photoUrls.slice(0, 3);
      const imageBlocks: Anthropic.ImageBlockParam[] = photoUrls.map((url: string) => ({
        type: "image",
        source: { type: "url", url },
      }));

      const response = await client.messages.create({
        model: "claude-sonnet-4-20250514",
        max_tokens: 800,
        messages: [
          {
            role: "user",
            content: [
              ...imageBlocks,
              {
                type: "text",
                text: `Analyze these property photos and return a JSON object with exactly these fields:
{
  "buildingType": string (e.g. "single-family detached"),
  "estimatedStories": string (e.g. "2"),
  "roofForm": string (e.g. "gable", "hip", "flat"),
  "facadeMaterials": string[] (e.g. ["brick", "vinyl siding"]),
  "siteFeatures": string[] (e.g. ["driveway", "front porch"]),
  "landscapeConditions": string[] (e.g. ["mature trees", "sparse lawn"]),
  "confidence": number between 0 and 1
}
Return only valid JSON, no markdown.`,
              },
            ],
          },
        ],
      });

      const raw = response.content[0].type === "text" ? response.content[0].text.trim() : "";
      const parsed = JSON.parse(raw) as VisionAnalysis;
      return parsed;
    } catch (err) {
      console.warn("[analyzeUploadedPhotos] Claude vision failed, using fallback:", err);
      return {
        buildingType: "single-family detached",
        estimatedStories: "2",
        roofForm: "gable",
        facadeMaterials: ["brick", "painted trim"],
        siteFeatures: ["front walk", "driveway"],
        landscapeConditions: ["sparse foundation planting"],
        confidence: 0.5,
      };
    }
  },
  {
    name: "analyzeUploadedPhotos",
    description: "Analyze uploaded property photos using Claude vision.",
    schema: z.object({
      intakeId: z.string(),
      photoUrls: z.array(z.string().url()).default([]),
    }),
  },
);

export const classifyProjectComplexity = tool(
  async (input: { projectType: string; propertyUse?: string; goals: string[]; visionAnalysis: { confidence: number }; knownConstraints: string[] }): Promise<{ projectComplexity: Complexity; humanReviewRequired: boolean; reasons: string[] }> => {
    const reasons: string[] = [];
    let projectComplexity: Complexity = "low";

    if (
      input.projectType.toLowerCase().includes("addition") ||
      input.propertyUse?.toLowerCase().includes("multi") ||
      input.knownConstraints.some((c) => /slope|historic|retaining|structural/i.test(c)) ||
      input.visionAnalysis.confidence < 0.7
    ) {
      projectComplexity = "medium";
      reasons.push("non-trivial scope or lower confidence");
    }

    if (
      input.propertyUse?.toLowerCase().includes("mixed") ||
      input.projectType.toLowerCase().includes("multifamily")
    ) {
      projectComplexity = "high";
      reasons.push("commercial or mixed-use complexity");
    }

    return {
      projectComplexity,
      humanReviewRequired: projectComplexity !== "low",
      reasons,
    };
  },
  {
    name: "classifyProjectComplexity",
    description: "Classify project complexity.",
    schema: z.object({
      projectType: z.string(),
      propertyUse: z.string().optional().default("residential"),
      goals: z.array(z.string()).default([]),
      visionAnalysis: z.object({
        confidence: z.number(),
      }),
      knownConstraints: z.array(z.string()).default([]),
    }),
  },
);

export const generateDesignBrief = tool(
  async (input: { intakeId: string; projectSummary: string; stylePreferences: string[]; desiredMaterials?: string[]; preferredColorPalette?: string[]; visionAnalysis: Record<string, unknown>; siteContext: Record<string, unknown>; budgetRange: string }): Promise<DesignBrief> => {
    try {
      const client = getAnthropicClient();

      const prompt = `You are a professional residential design architect. Generate a concise design brief for this project.

Project Summary: ${input.projectSummary}
Style Preferences: ${input.stylePreferences.join(", ")}
Desired Materials: ${input.desiredMaterials?.join(", ") || "not specified"}
Preferred Colors: ${input.preferredColorPalette?.join(", ") || "not specified"}
Budget Range: ${input.budgetRange}
Vision Analysis: ${JSON.stringify(input.visionAnalysis)}
Site Context: ${JSON.stringify(input.siteContext)}

Return a JSON object with exactly these fields:
{
  "summary": string (2-3 sentences describing the overall design direction),
  "facadeStrategy": string (1-2 sentences on exterior facade approach),
  "landscapeStrategy": string (1-2 sentences on landscaping approach),
  "materials": string[] (3-5 recommended materials),
  "palette": string[] (3-4 color palette items),
  "budgetDirection": string (brief budget guidance)
}
Return only valid JSON, no markdown.`;

      const response = await client.messages.create({
        model: "claude-sonnet-4-20250514",
        max_tokens: 600,
        messages: [{ role: "user", content: prompt }],
      });

      const raw = response.content[0].type === "text" ? response.content[0].text.trim() : "";
      const parsed = JSON.parse(raw);
      return { id: id("brief"), ...parsed };
    } catch (err) {
      console.warn("[generateDesignBrief] Claude failed, using fallback:", err);
      return {
        id: id("brief"),
        summary: input.projectSummary,
        facadeStrategy: "Modernized curb appeal while preserving main massing and existing structural geometry.",
        landscapeStrategy: "Layered front-yard planting, edge cleanup, path emphasis, and foundation softening.",
        materials: input.desiredMaterials?.length ? input.desiredMaterials : ["fiber cement accents", "black metal details", "stone skirt"],
        palette: input.preferredColorPalette?.length ? input.preferredColorPalette : ["warm white", "charcoal", "natural wood"],
        budgetDirection: input.budgetRange,
      };
    }
  },
  {
    name: "generateDesignBrief",
    description: "Generate a structured design brief.",
    schema: z.object({
      intakeId: z.string(),
      projectSummary: z.string(),
      stylePreferences: z.array(z.string()),
      desiredMaterials: z.array(z.string()).optional(),
      preferredColorPalette: z.array(z.string()).optional(),
      visionAnalysis: z.record(z.string(), z.any()),
      siteContext: z.record(z.string(), z.any()),
      budgetRange: z.string(),
    }),
  },
);

export const generateExteriorConceptImages = tool(
  async (input: { intakeId: string; designBriefId: string; variations: number; imageStyle: string; preserveStructure: boolean; facadeStrategy?: string; materials?: string[]; palette?: string[]; buildingType?: string; stylePreferences?: string[] }) => {
    const style = input.imageStyle === "photoreal" ? "photorealistic architectural visualization" : `${input.imageStyle} architectural rendering`;
    const styleHint = (input.stylePreferences ?? []).join(", ") || "modern transitional";
    const materials = (input.materials ?? []).join(", ") || "fiber cement, stone accents, black metal details";
    const palette = (input.palette ?? []).join(", ") || "warm white, charcoal, natural wood";
    const facade = input.facadeStrategy || "modernized curb appeal with clean lines";
    const buildingType = input.buildingType || "single-family detached home";

    const basePrompt = `${style} of a ${buildingType} exterior renovation concept. ${facade}. Materials: ${materials}. Color palette: ${palette}. Style: ${styleHint}. Front elevation view, professional real estate photography, golden hour lighting, high resolution 8K, ultra detailed, no people, clean sky.`;

    const variationSuffixes = [
      "main concept render, primary design direction",
      "alternative material variation, slightly warmer palette",
      "night rendering with exterior lighting and landscaping glow",
      "twilight render showing landscape integration",
      "close-up facade detail render",
      "wide angle street view context render",
    ];

    const count = Math.min(input.variations, 6);
    const prompts = Array.from({ length: count }, (_, i) =>
      `${basePrompt} ${variationSuffixes[i] ?? variationSuffixes[0]}`
    );

    // Generate images sequentially to avoid rate limits (DALL-E 3: 1 img/req)
    const images: string[] = [];
    for (const prompt of prompts) {
      const url = await generateDalleImage(prompt, "1792x1024");
      if (url) {
        images.push(url);
      } else {
        // Fallback placeholder if DALL-E fails
        images.push(`https://placeholder.kealee.com/concept/exterior-${images.length + 1}.jpg`);
      }
    }

    return {
      designBriefId: input.designBriefId,
      images,
      generatedWithAI: images.some(u => !u.includes("placeholder.kealee.com")),
    };
  },
  {
    name: "generateExteriorConceptImages",
    description: "Generate exterior concept images using DALL-E 3 AI image generation.",
    schema: z.object({
      intakeId: z.string(),
      designBriefId: z.string(),
      variations: z.number().int().min(1).max(6),
      imageStyle: z.string().default("photoreal"),
      preserveStructure: z.boolean().default(true),
      facadeStrategy: z.string().optional(),
      materials: z.array(z.string()).optional(),
      palette: z.array(z.string()).optional(),
      buildingType: z.string().optional(),
      stylePreferences: z.array(z.string()).optional(),
    }),
  },
);

export const generateLandscapeConceptImages = tool(
  async (input: { intakeId: string; designBriefId: string; zones: string[]; variations: number; landscapeStrategy?: string; materials?: string[]; palette?: string[] }) => {
    const zones = input.zones.length > 0 ? input.zones.join(", ") : "front yard, entry path, foundation planting";
    const strategy = input.landscapeStrategy || "layered planting with clean hardscape and defined pathway";
    const palette = (input.palette ?? []).join(", ") || "warm white, charcoal, natural wood";

    const variationSuffixes = [
      "spring season landscape concept, lush greenery",
      "minimal modern landscape with clean lines and hardscape focus",
      "evening landscape lighting concept",
      "close-up entry and pathway detail",
    ];

    const basePrompt = `Photorealistic landscape architecture visualization, front yard residential concept. Zones: ${zones}. Design: ${strategy}. Color accents: ${palette}. Professional landscape photography, natural light, 8K resolution, ultra detailed, no people.`;

    const count = Math.min(input.variations, 4);
    const prompts = Array.from({ length: count }, (_, i) =>
      `${basePrompt} ${variationSuffixes[i] ?? variationSuffixes[0]}`
    );

    const images: string[] = [];
    for (const prompt of prompts) {
      const url = await generateDalleImage(prompt, "1792x1024");
      if (url) {
        images.push(url);
      } else {
        images.push(`https://placeholder.kealee.com/concept/landscape-${images.length + 1}.jpg`);
      }
    }

    return {
      designBriefId: input.designBriefId,
      images,
      generatedWithAI: images.some(u => !u.includes("placeholder.kealee.com")),
    };
  },
  {
    name: "generateLandscapeConceptImages",
    description: "Generate landscape concept images using DALL-E 3 AI image generation.",
    schema: z.object({
      intakeId: z.string(),
      designBriefId: z.string(),
      zones: z.array(z.string()),
      variations: z.number().int().min(1).max(4),
      landscapeStrategy: z.string().optional(),
      materials: z.array(z.string()).optional(),
      palette: z.array(z.string()).optional(),
    }),
  },
);

export const generatePermitPathSummary = tool(
  async (input: { projectAddress: string; jurisdiction?: string; projectType: string; propertyUse?: string; projectComplexity: "low" | "medium" | "high"; knownConstraints: string[] }): Promise<PermitPathSummary> => {
    try {
      const client = getAnthropicClient();

      const prompt = `You are a licensed residential permit consultant. Generate a preliminary permit path summary.

Project Type: ${input.projectType}
Address/Jurisdiction: ${input.projectAddress} (${input.jurisdiction ?? "unknown jurisdiction"})
Property Use: ${input.propertyUse ?? "residential"}
Complexity: ${input.projectComplexity}
Known Constraints: ${input.knownConstraints.join(", ") || "none"}

Return a JSON object with exactly these fields:
{
  "likelyPermitNeeded": boolean,
  "likelyDesignReviewNeeded": boolean,
  "likelyTradePermits": string[] (e.g. ["electrical", "plumbing"]),
  "notes": string[] (2-3 brief notes about permit requirements and next steps)
}
Return only valid JSON, no markdown. This is a preliminary estimate only.`;

      const response = await client.messages.create({
        model: "claude-sonnet-4-20250514",
        max_tokens: 400,
        messages: [{ role: "user", content: prompt }],
      });

      const raw = response.content[0].type === "text" ? response.content[0].text.trim() : "";
      return JSON.parse(raw) as PermitPathSummary;
    } catch (err) {
      console.warn("[generatePermitPathSummary] Claude failed, using fallback:", err);
      return {
        likelyPermitNeeded: /addition|deck|porch|driveway/i.test(input.projectType),
        likelyDesignReviewNeeded: input.projectComplexity !== "low",
        likelyTradePermits: /lighting|electrical/i.test(input.projectType) ? ["electrical"] : [],
        notes: [
          `Preliminary path to approval for ${input.jurisdiction || "the local jurisdiction"}.`,
          "Final code, zoning, and permit requirements must be confirmed during professional review.",
        ],
      };
    }
  },
  {
    name: "generatePermitPathSummary",
    description: "Generate a preliminary permit path summary.",
    schema: z.object({
      projectAddress: z.string(),
      jurisdiction: z.string().optional(),
      projectType: z.string(),
      propertyUse: z.string().optional(),
      projectComplexity: z.enum(["low", "medium", "high"]),
      knownConstraints: z.array(z.string()).default([]),
    }),
  },
);

export const buildClientConceptPackageDraft = tool(
  async (input: { intakeId: string; designBriefId: string; exteriorImages: string[]; landscapeImages: string[]; permitPathSummary: Record<string, unknown> }) => {
    return {
      packageDraftId: id("pkg"),
      intakeId: input.intakeId,
      sections: [
        "intake_summary",
        "design_brief",
        "exterior_concepts",
        "landscape_concepts",
        "permit_path",
      ],
      exteriorImages: input.exteriorImages,
      landscapeImages: input.landscapeImages,
      permitPathSummary: input.permitPathSummary,
    };
  },
  {
    name: "buildClientConceptPackageDraft",
    description: "Build the draft client package.",
    schema: z.object({
      intakeId: z.string(),
      designBriefId: z.string(),
      exteriorImages: z.array(z.string()).default([]),
      landscapeImages: z.array(z.string()).default([]),
      permitPathSummary: z.record(z.string(), z.any()),
    }),
  },
);

export const routeToCommandCenterReview = tool(
  async (input: { intakeId: string; reviewReason: string; priority: "LOW" | "NORMAL" | "HIGH" | "URGENT" }) => {
    return {
      queued: true,
      queueId: id("review"),
      reviewReason: input.reviewReason,
      priority: input.priority,
    };
  },
  {
    name: "routeToCommandCenterReview",
    description: "Queue for PM review.",
    schema: z.object({
      intakeId: z.string(),
      reviewReason: z.string(),
      priority: z.enum(["LOW", "NORMAL", "HIGH", "URGENT"]),
    }),
  },
);

export const exteriorConceptTools = [
  createIntakeRecord,
  updateIntakeRecord,
  fetchPropertyContext,
  analyzeUploadedPhotos,
  classifyProjectComplexity,
  generateDesignBrief,
  generateExteriorConceptImages,
  generateLandscapeConceptImages,
  generatePermitPathSummary,
  buildClientConceptPackageDraft,
  routeToCommandCenterReview,
];
