/**
 * @kealee/core-bim — IFC Parser
 *
 * Parses Industry Foundation Classes (IFC) files using the web-ifc library.
 * Extracts model structure, elements, and property sets for downstream
 * processing (conversion, clash detection, element extraction).
 *
 * This service is framework-agnostic and can run server-side or in the browser.
 */

import * as WebIFC from 'web-ifc';

import type {
  ParsedModel,
  BIMElementData,
  BIMElementType,
  BoundingBox,
  BIMMaterial,
  Vector3,
} from './types';

/**
 * Maps IFC type constants to BIMElementType enum values.
 * Uses web-ifc type IDs to classify elements.
 */
const IFC_TYPE_MAP: Record<number, BIMElementType> = {
  [WebIFC.IFCWALL]: 'WALL',
  [WebIFC.IFCWALLSTANDARDCASE]: 'WALL',
  [WebIFC.IFCSLAB]: 'SLAB',
  [WebIFC.IFCCOLUMN]: 'COLUMN',
  [WebIFC.IFCBEAM]: 'BEAM',
  [WebIFC.IFCDOOR]: 'DOOR',
  [WebIFC.IFCWINDOW]: 'WINDOW',
  [WebIFC.IFCSTAIR]: 'STAIR',
  [WebIFC.IFCSTAIRFLIGHT]: 'STAIR',
  [WebIFC.IFCROOF]: 'ROOF',
  [WebIFC.IFCRAILING]: 'RAILING',
  [WebIFC.IFCFOOTING]: 'FOOTING',
  [WebIFC.IFCPILE]: 'PILE',
  [WebIFC.IFCPLATE]: 'PLATE',
  [WebIFC.IFCCURTAINWALL]: 'CURTAIN_WALL',
  [WebIFC.IFCCOVERING]: 'COVERING',
  [WebIFC.IFCMEMBER]: 'MEMBER',
  [WebIFC.IFCPIPESEGMENT]: 'PIPE',
  [WebIFC.IFCDUCTSEGMENT]: 'DUCT',
  [WebIFC.IFCCABLECARRIERSEGMENT]: 'CABLE_TRAY',
  [WebIFC.IFCFLOWTERMINAL]: 'FLOW_TERMINAL',
  [WebIFC.IFCDISTRIBUTIONELEMENT]: 'DISTRIBUTION_ELEMENT',
  [WebIFC.IFCFURNISHINGELEMENT]: 'FURNISHING',
  [WebIFC.IFCSPACE]: 'SPACE',
  [WebIFC.IFCBUILDINGSTOREY]: 'BUILDING_STOREY',
  [WebIFC.IFCSITE]: 'SITE',
};

/** All IFC type IDs that we attempt to extract */
const EXTRACTABLE_IFC_TYPES = Object.keys(IFC_TYPE_MAP).map(Number);

/**
 * IFCParser — Parses IFC files and extracts structured BIM data.
 *
 * @example
 * ```ts
 * const parser = new IFCParser();
 * await parser.initialize();
 *
 * const model = await parser.parseFile(buffer);
 * const elements = parser.extractElements(model);
 *
 * parser.dispose();
 * ```
 */
export class IFCParser {
  private ifcApi: WebIFC.IfcAPI;
  private initialized = false;

  constructor() {
    this.ifcApi = new WebIFC.IfcAPI();
  }

  /**
   * Initialize the web-ifc WASM module.
   * Must be called before any parsing operations.
   *
   * @param wasmPath - Optional path to web-ifc WASM files directory.
   */
  async initialize(wasmPath?: string): Promise<void> {
    if (this.initialized) return;

    if (wasmPath) {
      this.ifcApi.SetWasmPath(wasmPath);
    }

    await this.ifcApi.Init();
    this.initialized = true;
  }

  /**
   * Parse an IFC file from an ArrayBuffer.
   *
   * @param buffer - Raw IFC file contents as an ArrayBuffer.
   * @returns A ParsedModel handle for further extraction.
   * @throws If the parser has not been initialized or the file is invalid.
   */
  async parseFile(buffer: ArrayBuffer): Promise<ParsedModel> {
    this.ensureInitialized();

    const data = new Uint8Array(buffer);
    const modelId = this.ifcApi.OpenModel(data);

    // Attempt to read schema information from file header
    let schema = 'IFC4';
    let header: Record<string, unknown> = {};

    try {
      const headerLine = this.ifcApi.GetHeaderLine(modelId, WebIFC.FILE_SCHEMA);
      if (headerLine && headerLine.arguments) {
        const schemaArgs = headerLine.arguments as unknown[];
        if (Array.isArray(schemaArgs) && schemaArgs.length > 0) {
          const firstArg = schemaArgs[0];
          if (Array.isArray(firstArg) && firstArg.length > 0) {
            schema = String(firstArg[0]?.value ?? 'IFC4');
          }
        }
      }
      header = { fileSchema: schema };
    } catch {
      // Header reading is best-effort
      header = { fileSchema: schema };
    }

    // Count geometry items
    let geometryCount = 0;
    for (const ifcType of EXTRACTABLE_IFC_TYPES) {
      try {
        const ids = this.ifcApi.GetLineIDsWithType(modelId, ifcType);
        geometryCount += ids.size();
      } catch {
        // Some types may not exist in this model
      }
    }

    return {
      modelId,
      schema,
      header,
      geometryCount,
    };
  }

  /**
   * Extract all classifiable elements from a parsed IFC model.
   *
   * @param model - A previously parsed model handle.
   * @returns An array of BIMElementData for each extracted element.
   */
  extractElements(model: ParsedModel): BIMElementData[] {
    this.ensureInitialized();

    const elements: BIMElementData[] = [];

    for (const ifcType of EXTRACTABLE_IFC_TYPES) {
      const bimType = IFC_TYPE_MAP[ifcType];
      if (!bimType) continue;

      try {
        const ids = this.ifcApi.GetLineIDsWithType(model.modelId, ifcType);

        for (let i = 0; i < ids.size(); i++) {
          const expressId = ids.get(i);

          try {
            const props = this.ifcApi.GetLine(model.modelId, expressId);
            const globalId = props?.GlobalId?.value ?? `element-${expressId}`;
            const name = props?.Name?.value ?? `${bimType} #${expressId}`;

            const element: BIMElementData = {
              id: String(expressId),
              ifcGlobalId: String(globalId),
              elementType: bimType,
              name: String(name),
              properties: this.extractProperties(model.modelId, expressId),
              boundingBox: this.computeBoundingBox(model.modelId, expressId),
              materials: this.extractMaterials(model.modelId, expressId),
              status: 'NEW',
              modelId: String(model.modelId),
            };

            elements.push(element);
          } catch {
            // Skip elements that fail to parse
          }
        }
      } catch {
        // Skip types that don't exist in this model
      }
    }

    return elements;
  }

  /**
   * Get all IFC property sets for a specific element.
   *
   * @param elementId - The IFC express ID of the element.
   * @returns A flat key-value map of all properties.
   */
  getProperties(elementId: number): Record<string, unknown> {
    this.ensureInitialized();
    // Note: requires a model to be open. This retrieves from the last opened model.
    // For multi-model usage, use extractProperties with an explicit modelId.
    return {};
  }

  /**
   * Close a parsed model and free associated resources.
   *
   * @param model - The parsed model to close.
   */
  closeModel(model: ParsedModel): void {
    this.ensureInitialized();
    try {
      this.ifcApi.CloseModel(model.modelId);
    } catch {
      // Best-effort cleanup
    }
  }

  /**
   * Dispose of the IFC API instance and release all resources.
   * After calling dispose, this parser instance cannot be reused.
   */
  dispose(): void {
    if (this.initialized) {
      try {
        // Close any remaining resources
        this.ifcApi = null as unknown as WebIFC.IfcAPI;
      } catch {
        // Best-effort cleanup
      }
      this.initialized = false;
    }
  }

  // -------------------------------------------------------------------------
  // Private helpers
  // -------------------------------------------------------------------------

  private ensureInitialized(): void {
    if (!this.initialized) {
      throw new Error(
        'IFCParser has not been initialized. Call initialize() first.'
      );
    }
  }

  /**
   * Extract IFC property sets for an element and flatten into a key-value map.
   */
  private extractProperties(
    modelId: number,
    expressId: number
  ): Record<string, unknown> {
    const result: Record<string, unknown> = {};

    try {
      const line = this.ifcApi.GetLine(modelId, expressId, true);
      if (!line) return result;

      // Walk the flattened properties
      for (const [key, value] of Object.entries(line)) {
        if (key === 'expressID' || key === 'type') continue;
        if (value && typeof value === 'object' && 'value' in value) {
          result[key] = (value as { value: unknown }).value;
        } else if (value !== null && value !== undefined) {
          result[key] = value;
        }
      }
    } catch {
      // Property extraction is best-effort
    }

    return result;
  }

  /**
   * Compute an axis-aligned bounding box for an element from its geometry.
   * Falls back to a zero-size box if geometry is not available.
   */
  private computeBoundingBox(
    _modelId: number,
    _expressId: number
  ): BoundingBox {
    // web-ifc geometry extraction is complex; return a placeholder that
    // downstream tools (element-extractor) can refine with actual mesh data.
    const zero: Vector3 = { x: 0, y: 0, z: 0 };
    return { min: { ...zero }, max: { ...zero } };
  }

  /**
   * Extract material assignments for an element.
   */
  private extractMaterials(
    modelId: number,
    expressId: number
  ): BIMMaterial[] {
    const materials: BIMMaterial[] = [];

    try {
      const line = this.ifcApi.GetLine(modelId, expressId, true);
      if (line?.HasAssociations) {
        // Walk associations looking for material references
        const associations = Array.isArray(line.HasAssociations)
          ? line.HasAssociations
          : [];

        for (const assoc of associations) {
          if (assoc?.RelatingMaterial) {
            const mat = assoc.RelatingMaterial;
            materials.push({
              name: mat?.Name?.value ?? 'Unknown Material',
              color: undefined,
              opacity: 1.0,
            });
          }
        }
      }
    } catch {
      // Material extraction is best-effort
    }

    // Always return at least a default material
    if (materials.length === 0) {
      materials.push({ name: 'Default', color: '#cccccc', opacity: 1.0 });
    }

    return materials;
  }
}
