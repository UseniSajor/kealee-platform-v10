import { z } from "zod";

export const DigitalTwinCreationPathEnum = z.enum([
  "intake_only",
  "intake_plus_mobile_capture",
  "direct_mobile_capture",
  "uploads_only",
  "uploads_plus_ai_extraction",
  "imported_project_record",
  "imported_plans_and_sketches",
  "permit_or_project_conversion",
]);

export const CreateDigitalTwinSchema = z.object({
  property_id: z.string().min(1),
  project_id: z.string().optional(),
  intake_id: z.string().optional(),
  creation_path: DigitalTwinCreationPathEnum,
  source_capture_session_ids: z.array(z.string()).default([]),
});

export const UpdateTwinFromCaptureSchema = z.object({
  twin_id: z.string().min(1),
  capture_session_id: z.string().min(1),
});

export type DigitalTwinCreationPath = z.infer<typeof DigitalTwinCreationPathEnum>;
export type CreateDigitalTwinInput = z.infer<typeof CreateDigitalTwinSchema>;
export type UpdateTwinFromCaptureInput = z.infer<typeof UpdateTwinFromCaptureSchema>;

export interface DigitalTwinRecord {
  id: string;
  property_id: string;
  project_id?: string;
  intake_id?: string;
  twin_type: "project";
  version: number;
  creation_path: string;
  status: "active";
  twin_summary: Record<string, unknown>;
  source_capture_session_ids: string[];
  created_at: string;
  updated_at: string;
}

export interface SpatialNodeRecord {
  id: string;
  twin_id: string;
  parent_node_id?: string;
  node_type: "property" | "exterior_zone" | "room" | "system_location" | "problem_area";
  node_key: string;
  display_name: string;
  floor_level?: string;
  area_type?: string;
  metadata: Record<string, unknown>;
}

export interface SystemNodeRecord {
  id: string;
  twin_id: string;
  system_category: string;
  system_key: string;
  display_name: string;
  location_node_id?: string;
  metadata: Record<string, unknown>;
}

export interface ObservationRecord {
  id: string;
  twin_id: string;
  capture_session_id?: string;
  asset_id?: string;
  spatial_node_id?: string;
  system_node_id?: string;
  observation_type: string;
  severity?: "minor" | "moderate" | "severe";
  confidence?: number;
  title: string;
  description?: string;
  tags: string[];
  source: "user_capture" | "ai_extraction" | "manual_review";
}

export interface DigitalTwinDetail {
  twin: DigitalTwinRecord;
  spatialNodes: SpatialNodeRecord[];
  systemNodes: SystemNodeRecord[];
  observations: ObservationRecord[];
}
