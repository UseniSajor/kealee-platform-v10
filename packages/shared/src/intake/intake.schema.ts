import { z } from "zod";

export const IntakeDataSchema = z.object({
  clientName: z.string().min(2, "Name is required"),
  contactEmail: z.string().email("Valid email required"),
  contactPhone: z.string().optional(),
  projectAddress: z.string().min(5, "Address is required"),
  jurisdiction: z.string().optional(),
  projectType: z.enum([
    "exterior_refresh",
    "facade_redesign",
    "landscape_redesign",
    "driveway_hardscape",
    "addition_concept",
    "porch_deck_concept",
  ]),
  propertyUse: z
    .enum(["primary_residence", "investment_property", "multifamily"])
    .default("primary_residence"),
  goals: z.array(z.string()).optional().default([]),
  stylePreferences: z.array(z.string()).min(1, "Select at least one style"),
  budgetRange: z.enum(["under_10k", "10k_25k", "25k_50k", "50k_100k", "100k_plus"]),
  timelineGoal: z.string().optional(),
  knownConstraints: z.array(z.string()).optional().default([]),
  desiredMaterials: z.array(z.string()).optional().default([]),
  preferredColorPalette: z.array(z.string()).optional().default([]),
  uploadedPhotos: z.array(z.string()).min(1, "At least one photo required"),
  existingPlansUploaded: z.array(z.string()).optional().default([]),
  surveyUploaded: z.boolean().optional().default(false),
});

export type ValidatedIntakeData = z.infer<typeof IntakeDataSchema>;

export const CreateConceptIntakeSchema = z.object({
  intakeData: IntakeDataSchema,
  funnelSessionId: z.string().optional(),
  source: z.string().default("portal_owner"),
});

export const PackageTierSchema = z.enum([
  "essential",
  "professional",
  "premium",
  "white_glove",
]);

export const CreateCheckoutSessionSchema = z.object({
  intakeId: z.string(),
  packageTier: PackageTierSchema,
  successUrl: z.string().url(),
  cancelUrl: z.string().url(),
});
