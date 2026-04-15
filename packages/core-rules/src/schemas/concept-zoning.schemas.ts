import { z } from "zod";

/**
 * Concept Intake Validation Schema
 * Validates homeowner project information for design concept generation
 */
export const ConceptIntakeSchema = z.object({
  projectType: z
    .enum(["garden", "kitchen", "landscape", "renovation"])
    .describe("Type of home improvement project"),
  scope: z
    .string()
    .min(10, "Scope must be at least 10 characters")
    .max(500, "Scope cannot exceed 500 characters")
    .describe("Detailed project scope and requirements"),
  budget: z
    .number()
    .min(100, "Budget must be at least $100")
    .max(1000000, "Budget cannot exceed $1,000,000")
    .describe("Project budget in dollars"),
  location: z
    .string()
    .regex(/^[0-9]{5}$/, "Location must be a valid 5-digit zip code")
    .describe("5-digit zip code for property location"),
  homeownerEmail: z
    .string()
    .email("Invalid email address")
    .describe("Homeowner email for communication"),
});

export type ConceptIntake = z.infer<typeof ConceptIntakeSchema>;

/**
 * Zoning Intake Validation Schema
 * Validates property information for zoning analysis
 */
export const ZoningIntakeSchema = z.object({
  location: z
    .string()
    .regex(/^[0-9]{5}$/, "Location must be a valid 5-digit zip code")
    .describe("5-digit zip code for property location"),
  propertySize: z
    .number()
    .min(100, "Property size must be at least 100 sq ft")
    .max(50000, "Property size cannot exceed 50,000 sq ft")
    .describe("Property size in square feet"),
  projectType: z
    .enum(["garden", "kitchen", "landscape", "renovation"])
    .describe("Type of home improvement project"),
  email: z
    .string()
    .email("Invalid email address")
    .describe("Homeowner email for communication"),
});

export type ZoningIntake = z.infer<typeof ZoningIntakeSchema>;

/**
 * Concept Response Schema
 * Validates AI-generated concept response
 */
export const ConceptResponseSchema = z.object({
  mepSystem: z.object({
    irrigation: z.string().optional(),
    lighting: z.string().optional(),
    drainage: z.string().optional(),
    electrical: z.string().optional(),
    plumbing: z.string().optional(),
  }),
  billOfMaterials: z.array(
    z.object({
      item: z.string(),
      quantity: z.number(),
      unit: z.string(),
      estimatedCost: z.number(),
    })
  ),
  estimatedCost: z.number(),
  description: z.string(),
});

export type ConceptResponse = z.infer<typeof ConceptResponseSchema>;

/**
 * Zoning Response Schema
 * Validates AI-generated zoning response
 */
export const ZoningResponseSchema = z.object({
  jurisdiction: z.string(),
  zoning: z.string(),
  setbacks: z.object({
    front: z.number(),
    side: z.number(),
    rear: z.number(),
  }),
  far: z.number().optional(),
  permitType: z.array(z.string()),
  requirements: z.array(z.string()),
});

export type ZoningResponse = z.infer<typeof ZoningResponseSchema>;
