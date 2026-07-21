/**
 * packages/intake/src/schemas/user-type-schemas.ts
 * User-type-discriminated intake schemas for homeowners and developers.
 * Used by intake bots, API validation, and portal forms.
 */
import { z } from "zod";

// ── Homeowner ──────────────────────────────────────────────────────────────────

export const HomeownerProjectPathSchema = z.enum([
  "exterior_concept",
  "kitchen_remodel",
  "bathroom_remodel",
  "interior_renovation",
  "whole_home_remodel",
  "addition_expansion",
  "design_build",            // integrated design + build planning
]);

export type HomeownerProjectPath = z.infer<typeof HomeownerProjectPathSchema>;

export const HomeownerIntakeSchema = z.object({
  user_type: z.literal("homeowner"),
  project_path: HomeownerProjectPathSchema,
  client_name: z.string().min(2),
  contact_email: z.string().email(),
  contact_phone: z.string().min(7),
  project_address: z.string().min(5),
  goals: z.array(z.string()).min(1),
  style_preferences: z.array(z.string()).min(1),
  budget_range: z.string().min(1),
  timeline_goal: z.string().min(1),
  desired_materials: z.array(z.string()).optional().default([]),
  structural_changes_expected: z.boolean().optional().default(false),
  inspiration_examples: z.array(z.string()).optional().default([]),
});

export type HomeownerIntake = z.infer<typeof HomeownerIntakeSchema>;

// ── Developer ─────────────────────────────────────────────────────────────────

export const DeveloperProjectTypeSchema = z.enum([
  "multifamily",
  "mixed_use",
  "townhome_development",
  "adu_program",
  "small_commercial",
  "redevelopment",
  "ground_up_residential",
]);

export type DeveloperProjectType = z.infer<typeof DeveloperProjectTypeSchema>;

export const DeveloperIntakeSchema = z.object({
  user_type: z.literal("developer"),
  intake_type: z.literal("feasibility"),
  client_name: z.string().min(2),
  contact_email: z.string().email(),
  contact_phone: z.string().min(7),
  entity_name: z.string().optional().default(""),
  project_address: z.string().min(5),
  parcel_id: z.string().optional().default(""),
  project_type: DeveloperProjectTypeSchema,
  current_property_condition: z.enum([
    "vacant_land",
    "existing_structure",
    "partially_occupied",
    "occupied_asset",
  ]),
  goals: z.array(z.string()).min(1),
  target_unit_count: z.string().optional().default(""),
  target_use_mix: z.array(z.string()).optional().default([]),
  height_goal: z.string().optional().default(""),
  parking_goal: z.string().optional().default(""),
  budget_range: z.string().optional().default(""),
  timeline_goal: z.string().optional().default(""),
  zoning_known: z.boolean().optional().default(false),
  zoning_notes: z.string().optional().default(""),
  uploaded_surveys: z.array(z.string()).optional().default([]),
  uploaded_plans: z.array(z.string()).optional().default([]),
  uploaded_massings: z.array(z.string()).optional().default([]),
});

export type DeveloperIntake = z.infer<typeof DeveloperIntakeSchema>;

// ── Union ─────────────────────────────────────────────────────────────────────

export const UserIntakeSchema = z.discriminatedUnion("user_type", [
  HomeownerIntakeSchema,
  DeveloperIntakeSchema,
]);

export type UserIntake = z.infer<typeof UserIntakeSchema>;
