import { z } from "zod";

export const CaptureZoneEnum = z.enum([
  "front_exterior", "rear_exterior", "left_side_exterior", "right_side_exterior",
  "roof_visible", "driveway", "front_yard", "rear_yard", "porch", "deck",
  "garage_exterior", "facade_detail", "window_detail", "door_entry",
  "problem_area_exterior", "hvac_exterior_unit", "electrical_service_exterior", "drainage_grading",
  "entry", "foyer", "living_room", "family_room", "dining_room", "kitchen", "pantry",
  "primary_bedroom", "bedroom_2", "bedroom_3", "bedroom_4",
  "primary_bath", "bathroom_2", "bathroom_3", "hallway", "stairs", "laundry", "mudroom",
  "basement_finished", "basement_unfinished", "attic", "crawlspace",
  "garage_interior", "utility_room", "mechanical_room",
  "hvac_air_handler", "hvac_furnace", "hvac_thermostat", "water_heater",
  "electrical_panel", "plumbing_fixture_area", "structural_concern_area", "problem_area_interior",
  "scan_room", "scan_full_property",
]);

export const CaptureModeEnum = z.enum(["self_capture", "enhanced_scan", "kealee_site_visit"]);

export const SiteVisitStatusEnum = z.enum([
  "not_scheduled", "requested", "scheduled", "completed",
]);

export const SystemCategoryEnum = z.enum([
  "architecture", "structure", "roofing", "envelope", "hvac", "plumbing",
  "electrical", "interiors", "landscape", "sitework", "drainage", "life_safety", "accessibility",
]);

export const CreateCaptureSessionSchema = z.object({
  intake_id: z.string().min(1),
  property_id: z.string().optional(),
  project_id: z.string().optional(),
  project_path: z.string().min(1),
  handoff_method: z.enum(["desktop_sms", "desktop_qr", "mobile_direct"]).default("mobile_direct"),
  phone_number: z.string().min(7).optional(),
  source_device: z.string().optional(),
  source_platform: z.string().optional(),
  required_zones: z.array(CaptureZoneEnum).min(1).optional(),
  capture_mode: CaptureModeEnum.default("self_capture"),
  preferred_visit_window: z.string().optional(),
});

export const SendCaptureLinkSchema = z.object({
  capture_session_id: z.string().min(1),
  phone_number: z.string().min(7),
});

export const StartCaptureSessionSchema = z.object({
  capture_session_token: z.string().min(1),
});

export const CaptureAssetUploadSchema = z.object({
  capture_session_id: z.string().min(1),
  intake_id: z.string().min(1),
  property_id: z.string().optional(),
  project_id: z.string().optional(),
  asset_type: z.enum(["photo", "video", "voice_note", "sketch", "plan"]),
  file_url: z.string().url(),
  file_path: z.string().optional(),
  file_name: z.string().optional(),
  mime_type: z.string().optional(),
  file_size_bytes: z.number().int().optional(),
  duration_seconds: z.number().int().optional(),
  capture_zone: CaptureZoneEnum,
  capture_area_type: z.enum(["interior", "exterior", "document", "system"]),
  floor_level: z.string().optional(),
  room_name: z.string().optional(),
  building_side: z.string().optional(),
  system_category: SystemCategoryEnum.optional(),
  is_required: z.boolean().default(false),
  captured_at: z.string().datetime().optional(),
  gps_lat: z.number().optional(),
  gps_lng: z.number().optional(),
  device_orientation: z.string().optional(),
});

export const CaptureVoiceNoteSchema = z.object({
  capture_session_id: z.string().min(1),
  intake_id: z.string().min(1),
  capture_zone: CaptureZoneEnum.optional(),
  audio_url: z.string().url(),
});

export const CompleteCaptureSessionSchema = z.object({
  capture_session_id: z.string().min(1),
  completed_zones: z.array(CaptureZoneEnum),
  skipped_zones: z.array(CaptureZoneEnum).default([]),
  walkthrough_video_uploaded: z.boolean().default(false),
});

export type CaptureZone = z.infer<typeof CaptureZoneEnum>;
export type CaptureMode = z.infer<typeof CaptureModeEnum>;
export type SiteVisitStatus = z.infer<typeof SiteVisitStatusEnum>;
export type SystemCategory = z.infer<typeof SystemCategoryEnum>;
export type CreateCaptureSessionInput = z.infer<typeof CreateCaptureSessionSchema>;
export type SendCaptureLinkInput = z.infer<typeof SendCaptureLinkSchema>;
export type StartCaptureSessionInput = z.infer<typeof StartCaptureSessionSchema>;
export type CaptureAssetUploadInput = z.infer<typeof CaptureAssetUploadSchema>;
export type CaptureVoiceNoteInput = z.infer<typeof CaptureVoiceNoteSchema>;
export type CompleteCaptureSessionInput = z.infer<typeof CompleteCaptureSessionSchema>;

export interface CaptureSessionRecord {
  id: string;
  intake_id: string;
  property_id?: string;
  project_id?: string;
  project_path: string;
  capture_session_token: string;
  token_expires_at: string;
  handoff_method?: string;
  source_device?: string;
  source_platform?: string;
  status: "draft" | "in_progress" | "completed" | "expired";
  current_zone?: string;
  required_zones: string[];
  completed_zones: string[];
  skipped_zones: string[];
  capture_progress_percent: number;
  capture_mode: CaptureMode;
  scan_enabled: boolean;
  scan_completed: boolean;
  site_visit_requested: boolean;
  site_visit_status: SiteVisitStatus;
  site_visit_fee: number;
  preferred_visit_window?: string;
  walkthrough_video_uploaded: boolean;
  voice_notes_count: number;
  uploaded_assets_count: number;
  realtime_channel?: string;
  started_at?: string;
  completed_at?: string;
  created_at: string;
  updated_at: string;
}

export interface CaptureAssetRecord {
  id: string;
  capture_session_id: string;
  intake_id: string;
  property_id?: string;
  project_id?: string;
  asset_type: "photo" | "video" | "voice_note" | "sketch" | "plan";
  file_url: string;
  file_path?: string;
  file_name?: string;
  mime_type?: string;
  file_size_bytes?: number;
  duration_seconds?: number;
  capture_zone: string;
  capture_area_type: "interior" | "exterior" | "document" | "system";
  floor_level?: string;
  room_name?: string;
  building_side?: string;
  system_category?: string;
  is_required: boolean;
  captured_at?: string;
  uploaded_at: string;
  gps_lat?: number;
  gps_lng?: number;
  ai_labels: string[];
  ai_summary?: string;
  ai_confidence?: number;
}

export interface CaptureCompletenessReport {
  requiredZones: string[];
  completedZones: string[];
  skippedZones: string[];
  missingRequired: string[];
  progressPercent: number;
  isComplete: boolean;
  assetsByZone: Record<string, CaptureAssetRecord[]>;
  totalAssets: number;
  voiceNotesCount: number;
  walkthroughVideoUploaded: boolean;
}
