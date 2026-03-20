import type { UpdateTwinFromCaptureInput, DigitalTwinDetail } from "../schemas/twin-schemas";
import type { CaptureAssetRecord } from "../schemas/capture-schemas";
import { deriveSpatialNodes, deriveSystemNodes, deriveObservations } from "./create-digital-twin";

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

  const allSpatial = deriveSpatialNodes(twin.id, assets);
  const allSystem = deriveSystemNodes(twin.id, assets);
  const allObs = deriveObservations(twin.id, assets, allSpatial, allSystem);

  return {
    spatialNodesToAdd: allSpatial.filter((n) => !existingSpatialKeys.has(n.node_key)),
    systemNodesToAdd: allSystem.filter((n) => !existingSysKeys.has(n.system_key)),
    observationsToAdd: allObs,
    newSessionIds: twin.source_capture_session_ids.includes(input.capture_session_id)
      ? twin.source_capture_session_ids
      : [...twin.source_capture_session_ids, input.capture_session_id],
  };
}
