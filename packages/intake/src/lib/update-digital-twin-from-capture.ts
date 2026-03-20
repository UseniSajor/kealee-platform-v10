import type { UpdateTwinFromCaptureInput, DigitalTwinDetail, SpatialNodeRecord } from "../schemas/twin-schemas";
import type { CaptureAssetRecord } from "../schemas/capture-schemas";
import { deriveSpatialNodes, deriveSystemNodes, deriveObservations } from "./create-digital-twin";

/** Builds scan-generated spatial nodes from scan_room / scan_full_property assets */
function buildScanSpatialNodes(
  twinId: string,
  scanAssets: CaptureAssetRecord[],
  existingSpatialKeys: Set<string>,
): SpatialNodeRecord[] {
  const nodes: SpatialNodeRecord[] = [];
  const now = new Date().toISOString();

  scanAssets.forEach((asset, idx) => {
    const isScanRoom = asset.capture_zone === "scan_room";
    const nodeKey = isScanRoom
      ? `scan_generated_room_${idx + 1}`
      : "scan_generated_full_property";

    if (existingSpatialKeys.has(nodeKey)) return;

    nodes.push({
      id: `${twinId}_scan_${idx}`,
      twin_id: twinId,
      node_key: nodeKey,
      node_label: isScanRoom ? `Scan-Generated Room ${idx + 1}` : "Full Property Scan",
      node_type: isScanRoom ? "room" : "building",
      level: isScanRoom ? "interior" : "site",
      parent_key: null,
      floor_level: null,
      estimated_sqft: null,
      asset_count: 1,
      observation_count: 0,
      source: "scan_generated",
      created_at: now,
      updated_at: now,
    } as SpatialNodeRecord);

    existingSpatialKeys.add(nodeKey);
  });

  return nodes;
}

export function buildTwinUpdateFromCapture(
  input: UpdateTwinFromCaptureInput,
  assets: CaptureAssetRecord[],
  existingDetail: DigitalTwinDetail,
): {
  spatialNodesToAdd: ReturnType<typeof deriveSpatialNodes>;
  systemNodesToAdd: ReturnType<typeof deriveSystemNodes>;
  observationsToAdd: ReturnType<typeof deriveObservations>;
  newSessionIds: string[];
} {
  const { twin } = existingDetail;
  const existingSpatialKeys = new Set(existingDetail.spatialNodes.map((n) => n.node_key));
  const existingSysKeys = new Set(existingDetail.systemNodes.map((n) => n.system_key));

  // Partition scan assets from standard assets
  const scanAssets = assets.filter(
    (a) => a.capture_zone === "scan_room" || a.capture_zone === "scan_full_property",
  );
  const standardAssets = assets.filter(
    (a) => a.capture_zone !== "scan_room" && a.capture_zone !== "scan_full_property",
  );

  const standardSpatial = deriveSpatialNodes(twin.id, standardAssets);
  const scanSpatial = buildScanSpatialNodes(twin.id, scanAssets, existingSpatialKeys);
  const allSpatial = [...standardSpatial, ...scanSpatial];

  const allSystem = deriveSystemNodes(twin.id, standardAssets);
  const allObs = deriveObservations(twin.id, standardAssets, allSpatial, allSystem);

  return {
    spatialNodesToAdd: allSpatial.filter((n) => !existingSpatialKeys.has(n.node_key)),
    systemNodesToAdd: allSystem.filter((n) => !existingSysKeys.has(n.system_key)),
    observationsToAdd: allObs,
    newSessionIds: twin.source_capture_session_ids.includes(input.capture_session_id)
      ? twin.source_capture_session_ids
      : [...twin.source_capture_session_ids, input.capture_session_id],
  };
}
