import type { CreateDigitalTwinInput, DigitalTwinRecord, SpatialNodeRecord, SystemNodeRecord, ObservationRecord } from "../schemas/twin-schemas";
import type { CaptureAssetRecord } from "../schemas/capture-schemas";

function makeId(prefix: string): string {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 7)}`;
}

export function buildDigitalTwinRecord(input: CreateDigitalTwinInput): DigitalTwinRecord {
  const now = new Date().toISOString();
  return {
    id: makeId("twin"),
    property_id: input.property_id,
    project_id: input.project_id,
    intake_id: input.intake_id,
    twin_type: "project",
    version: 1,
    creation_path: input.creation_path,
    status: "active",
    twin_summary: {},
    source_capture_session_ids: input.source_capture_session_ids ?? [],
    created_at: now,
    updated_at: now,
  };
}

export function deriveSpatialNodes(twinId: string, assets: CaptureAssetRecord[]): SpatialNodeRecord[] {
  const seen = new Map<string, SpatialNodeRecord>();
  for (const asset of assets) {
    const key = asset.capture_zone;
    if (!seen.has(key)) {
      seen.set(key, {
        id: makeId("spatial"),
        twin_id: twinId,
        node_type:
          asset.capture_area_type === "exterior" ? "exterior_zone"
            : asset.capture_area_type === "system" ? "system_location"
            : key.includes("problem") ? "problem_area"
            : "room",
        node_key: key,
        display_name: key.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()),
        floor_level: asset.floor_level,
        area_type: asset.capture_area_type,
        metadata: { room_name: asset.room_name, building_side: asset.building_side },
      });
    }
  }
  return Array.from(seen.values());
}

export function deriveSystemNodes(twinId: string, assets: CaptureAssetRecord[]): SystemNodeRecord[] {
  const seen = new Map<string, SystemNodeRecord>();
  for (const asset of assets) {
    if (!asset.system_category) continue;
    const key = `${asset.system_category}:${asset.capture_zone}`;
    if (!seen.has(key)) {
      seen.set(key, {
        id: makeId("system"),
        twin_id: twinId,
        system_category: asset.system_category,
        system_key: key,
        display_name: `${asset.system_category.toUpperCase()} — ${asset.capture_zone.replace(/_/g, " ")}`,
        metadata: { source_zone: asset.capture_zone },
      });
    }
  }
  return Array.from(seen.values());
}

export function deriveObservations(
  twinId: string,
  assets: CaptureAssetRecord[],
  spatialNodes: SpatialNodeRecord[],
  systemNodes: SystemNodeRecord[],
): ObservationRecord[] {
  const spatialByKey = new Map(spatialNodes.map((n) => [n.node_key, n]));
  const systemByKey = new Map(systemNodes.map((n) => [n.system_key, n]));
  const observations: ObservationRecord[] = [];
  for (const asset of assets) {
    if (!asset.ai_labels?.length && !asset.ai_summary) continue;
    const systemKey = asset.system_category ? `${asset.system_category}:${asset.capture_zone}` : undefined;
    observations.push({
      id: makeId("obs"),
      twin_id: twinId,
      capture_session_id: asset.capture_session_id,
      asset_id: asset.id,
      spatial_node_id: spatialByKey.get(asset.capture_zone)?.id,
      system_node_id: systemKey ? systemByKey.get(systemKey)?.id : undefined,
      observation_type: "ai_tagged_capture",
      confidence: asset.ai_confidence,
      title: asset.ai_labels?.length ? asset.ai_labels.join(", ") : "Captured observation",
      description: asset.ai_summary,
      tags: asset.ai_labels ?? [],
      source: "ai_extraction",
    });
  }
  return observations;
}
