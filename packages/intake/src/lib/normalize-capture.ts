import type { CaptureSessionRecord, CaptureAssetRecord, CaptureCompletenessReport, CaptureMode, SiteVisitStatus } from "../schemas/capture-schemas";

export function normalizeCaptureSession(raw: Record<string, unknown>): CaptureSessionRecord {
  return {
    id: String(raw.id ?? ""),
    intake_id: String(raw.intake_id ?? ""),
    property_id: raw.property_id ? String(raw.property_id) : undefined,
    project_id: raw.project_id ? String(raw.project_id) : undefined,
    project_path: String(raw.project_path ?? ""),
    capture_session_token: String(raw.capture_session_token ?? ""),
    token_expires_at: String(raw.token_expires_at ?? ""),
    handoff_method: raw.handoff_method ? String(raw.handoff_method) : undefined,
    source_device: raw.source_device ? String(raw.source_device) : undefined,
    source_platform: raw.source_platform ? String(raw.source_platform) : undefined,
    status: (raw.status as CaptureSessionRecord["status"]) ?? "draft",
    current_zone: raw.current_zone ? String(raw.current_zone) : undefined,
    required_zones: Array.isArray(raw.required_zones) ? (raw.required_zones as string[]) : [],
    completed_zones: Array.isArray(raw.completed_zones) ? (raw.completed_zones as string[]) : [],
    skipped_zones: Array.isArray(raw.skipped_zones) ? (raw.skipped_zones as string[]) : [],
    capture_progress_percent: Number(raw.capture_progress_percent ?? 0),
    capture_mode: (raw.capture_mode as CaptureMode) ?? "self_capture",
    scan_enabled: Boolean(raw.scan_enabled),
    scan_completed: Boolean(raw.scan_completed),
    site_visit_requested: Boolean(raw.site_visit_requested),
    site_visit_status: (raw.site_visit_status as SiteVisitStatus) ?? "not_scheduled",
    site_visit_fee: Number(raw.site_visit_fee ?? 0),
    walkthrough_video_uploaded: Boolean(raw.walkthrough_video_uploaded),
    voice_notes_count: Number(raw.voice_notes_count ?? 0),
    uploaded_assets_count: Number(raw.uploaded_assets_count ?? 0),
    realtime_channel: raw.realtime_channel ? String(raw.realtime_channel) : undefined,
    started_at: raw.started_at ? String(raw.started_at) : undefined,
    completed_at: raw.completed_at ? String(raw.completed_at) : undefined,
    created_at: String(raw.created_at ?? new Date().toISOString()),
    updated_at: String(raw.updated_at ?? new Date().toISOString()),
  };
}

export function normalizeAsset(raw: Record<string, unknown>): CaptureAssetRecord {
  return {
    id: String(raw.id ?? ""),
    capture_session_id: String(raw.capture_session_id ?? ""),
    intake_id: String(raw.intake_id ?? ""),
    property_id: raw.property_id ? String(raw.property_id) : undefined,
    project_id: raw.project_id ? String(raw.project_id) : undefined,
    asset_type: (raw.asset_type as CaptureAssetRecord["asset_type"]) ?? "photo",
    file_url: String(raw.file_url ?? ""),
    file_path: raw.file_path ? String(raw.file_path) : undefined,
    file_name: raw.file_name ? String(raw.file_name) : undefined,
    mime_type: raw.mime_type ? String(raw.mime_type) : undefined,
    file_size_bytes: raw.file_size_bytes ? Number(raw.file_size_bytes) : undefined,
    duration_seconds: raw.duration_seconds ? Number(raw.duration_seconds) : undefined,
    capture_zone: String(raw.capture_zone ?? ""),
    capture_area_type: (raw.capture_area_type as CaptureAssetRecord["capture_area_type"]) ?? "exterior",
    floor_level: raw.floor_level ? String(raw.floor_level) : undefined,
    room_name: raw.room_name ? String(raw.room_name) : undefined,
    building_side: raw.building_side ? String(raw.building_side) : undefined,
    system_category: raw.system_category ? String(raw.system_category) : undefined,
    is_required: Boolean(raw.is_required),
    captured_at: raw.captured_at ? String(raw.captured_at) : undefined,
    uploaded_at: String(raw.uploaded_at ?? new Date().toISOString()),
    gps_lat: raw.gps_lat ? Number(raw.gps_lat) : undefined,
    gps_lng: raw.gps_lng ? Number(raw.gps_lng) : undefined,
    ai_labels: Array.isArray(raw.ai_labels) ? (raw.ai_labels as string[]) : [],
    ai_summary: raw.ai_summary ? String(raw.ai_summary) : undefined,
    ai_confidence: raw.ai_confidence ? Number(raw.ai_confidence) : undefined,
  };
}

export function buildCompletenessReport(
  session: CaptureSessionRecord,
  assets: CaptureAssetRecord[],
  voiceNotesCount: number,
): CaptureCompletenessReport {
  const assetsByZone: Record<string, CaptureAssetRecord[]> = {};
  for (const asset of assets) {
    if (!assetsByZone[asset.capture_zone]) assetsByZone[asset.capture_zone] = [];
    assetsByZone[asset.capture_zone].push(asset);
  }

  const { required_zones: requiredZones, completed_zones: completedZones, skipped_zones: skippedZones } = session;
  const missingRequired = requiredZones.filter(
    (z) => !completedZones.includes(z) && !skippedZones.includes(z),
  );

  const doneCount = requiredZones.filter((z) => completedZones.includes(z)).length;
  const progressPercent = requiredZones.length > 0 ? Math.round((doneCount / requiredZones.length) * 100) : 0;

  return {
    requiredZones,
    completedZones,
    skippedZones,
    missingRequired,
    progressPercent,
    isComplete: missingRequired.length === 0,
    assetsByZone,
    totalAssets: assets.length,
    voiceNotesCount,
    walkthroughVideoUploaded: session.walkthrough_video_uploaded,
  };
}
