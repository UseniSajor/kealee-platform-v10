/**
 * @kealee/core-bim — glTF Converter
 *
 * Converts IFC model data to glTF/GLB format for web-based 3D rendering.
 * Uses web-ifc geometry extraction to build a Three.js-compatible scene
 * graph, then serializes to the glTF 2.0 binary format.
 *
 * This service is framework-agnostic and can run server-side or in the browser.
 */

import * as WebIFC from 'web-ifc';

import type { ConversionOptions, ParsedModel } from './types';

/** Geometry data extracted from a single IFC mesh */
interface ExtractedGeometry {
  expressId: number;
  vertices: Float32Array;
  indices: Uint32Array;
  normals: Float32Array;
  color: { r: number; g: number; b: number; a: number };
}

/**
 * GLTFConverter — Converts IFC files to optimized glTF/GLB for web viewing.
 *
 * @example
 * ```ts
 * const converter = new GLTFConverter();
 * await converter.initialize();
 *
 * const gltfBuffer = await converter.convertIFCToGLTF(ifcArrayBuffer);
 * const optimized = await converter.optimizeGLTF(gltfBuffer);
 *
 * converter.dispose();
 * ```
 */
export class GLTFConverter {
  private ifcApi: WebIFC.IfcAPI;
  private initialized = false;

  constructor() {
    this.ifcApi = new WebIFC.IfcAPI();
  }

  /**
   * Initialize the web-ifc WASM module for geometry extraction.
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
   * Convert an IFC file buffer to glTF format.
   *
   * This method:
   * 1. Opens the IFC model with web-ifc
   * 2. Extracts all mesh geometry (vertices, indices, normals)
   * 3. Builds a glTF 2.0 JSON structure with binary buffers
   * 4. Returns the result as a GLB (binary glTF) ArrayBuffer
   *
   * @param ifcBuffer - Raw IFC file contents.
   * @param options - Conversion options (format, compression, etc.).
   * @returns A GLB ArrayBuffer ready for Three.js GLTFLoader.
   */
  async convertIFCToGLTF(
    ifcBuffer: ArrayBuffer,
    options?: ConversionOptions
  ): Promise<ArrayBuffer> {
    this.ensureInitialized();

    const data = new Uint8Array(ifcBuffer);
    const modelId = this.ifcApi.OpenModel(data, {
      COORDINATE_TO_ORIGIN: true,
      USE_FAST_BOOLS: true,
    } as any);

    try {
      // Extract all geometry from the model
      const geometries = this.extractAllGeometry(modelId);

      // Build a glTF JSON + binary buffer
      const glb = this.buildGLB(geometries, options);

      return glb;
    } finally {
      this.ifcApi.CloseModel(modelId);
    }
  }

  /**
   * Optimize a glTF buffer for web delivery.
   *
   * Applies optimizations such as:
   * - Vertex deduplication
   * - Index buffer optimization
   * - Optional Draco mesh compression
   * - Texture resizing
   *
   * @param gltfBuffer - Input glTF/GLB buffer.
   * @param options - Optimization options.
   * @returns An optimized GLB ArrayBuffer.
   */
  async optimizeGLTF(
    gltfBuffer: ArrayBuffer,
    options?: ConversionOptions
  ): Promise<ArrayBuffer> {
    // Apply in-memory optimizations
    const view = new DataView(gltfBuffer);

    // Validate GLB magic number
    if (view.byteLength < 12) {
      throw new Error('Invalid GLB: buffer too small');
    }

    const magic = view.getUint32(0, true);
    if (magic !== 0x46546c67) {
      throw new Error('Invalid GLB: incorrect magic number');
    }

    // For now, return the buffer as-is.
    // In a production implementation, this would:
    // 1. Parse the GLB structure
    // 2. Apply Draco compression if options.dracoCompression
    // 3. Resize textures if options.maxTextureSize
    // 4. Apply mesh simplification if options.simplifyRatio
    // 5. Repack into an optimized GLB

    return gltfBuffer;
  }

  /**
   * Convert a ParsedModel (already opened via IFCParser) to glTF.
   * Useful when the model is already loaded and you want to avoid re-parsing.
   *
   * @param parsedModel - A ParsedModel from IFCParser.parseFile().
   * @param ifcApi - The IFCParser's IfcAPI instance (shared).
   * @param options - Conversion options.
   * @returns A GLB ArrayBuffer.
   */
  async convertParsedModelToGLTF(
    parsedModel: ParsedModel,
    ifcApi: WebIFC.IfcAPI,
    options?: ConversionOptions
  ): Promise<ArrayBuffer> {
    const geometries = this.extractAllGeometryFromApi(
      ifcApi,
      parsedModel.modelId
    );
    return this.buildGLB(geometries, options);
  }

  /**
   * Release all resources held by this converter.
   */
  dispose(): void {
    if (this.initialized) {
      this.ifcApi = null as unknown as WebIFC.IfcAPI;
      this.initialized = false;
    }
  }

  // -------------------------------------------------------------------------
  // Private — Geometry extraction
  // -------------------------------------------------------------------------

  private ensureInitialized(): void {
    if (!this.initialized) {
      throw new Error(
        'GLTFConverter has not been initialized. Call initialize() first.'
      );
    }
  }

  /**
   * Extract all mesh geometry from an IFC model opened with the internal API.
   */
  private extractAllGeometry(modelId: number): ExtractedGeometry[] {
    return this.extractAllGeometryFromApi(this.ifcApi, modelId);
  }

  /**
   * Extract all mesh geometry using a provided IfcAPI instance.
   */
  private extractAllGeometryFromApi(
    api: WebIFC.IfcAPI,
    modelId: number
  ): ExtractedGeometry[] {
    const geometries: ExtractedGeometry[] = [];

    api.StreamAllMeshes(modelId, (mesh) => {
      const expressId = mesh.expressID;

      for (let i = 0; i < mesh.geometries.size(); i++) {
        const geomData = mesh.geometries.get(i);
        const geometry = api.GetGeometry(modelId, geomData.geometryExpressID);

        const vertices = api.GetVertexArray(
          geometry.GetVertexData(),
          geometry.GetVertexDataSize()
        );

        const indices = api.GetIndexArray(
          geometry.GetIndexData(),
          geometry.GetIndexDataSize()
        );

        // Extract vertex positions and normals from interleaved buffer
        // web-ifc vertex format: [x, y, z, nx, ny, nz] per vertex
        const vertexCount = vertices.length / 6;
        const positions = new Float32Array(vertexCount * 3);
        const normals = new Float32Array(vertexCount * 3);

        for (let v = 0; v < vertexCount; v++) {
          positions[v * 3] = vertices[v * 6];
          positions[v * 3 + 1] = vertices[v * 6 + 1];
          positions[v * 3 + 2] = vertices[v * 6 + 2];
          normals[v * 3] = vertices[v * 6 + 3];
          normals[v * 3 + 1] = vertices[v * 6 + 4];
          normals[v * 3 + 2] = vertices[v * 6 + 5];
        }

        geometries.push({
          expressId,
          vertices: positions,
          indices: new Uint32Array(indices),
          normals,
          color: {
            r: geomData.color.x,
            g: geomData.color.y,
            b: geomData.color.z,
            a: geomData.color.w,
          },
        });

        geometry.delete();
      }
    });

    return geometries;
  }

  // -------------------------------------------------------------------------
  // Private — GLB construction
  // -------------------------------------------------------------------------

  /**
   * Build a GLB (binary glTF) from extracted geometry data.
   *
   * Constructs a minimal but valid glTF 2.0 structure:
   * - One scene with one root node
   * - One mesh per geometry with position, normal, and index accessors
   * - PBR materials derived from IFC colors
   */
  private buildGLB(
    geometries: ExtractedGeometry[],
    _options?: ConversionOptions
  ): ArrayBuffer {
    if (geometries.length === 0) {
      return this.buildEmptyGLB();
    }

    // Collect all binary data into a single buffer
    const bufferParts: ArrayBuffer[] = [];
    let currentOffset = 0;

    const accessors: unknown[] = [];
    const bufferViews: unknown[] = [];
    const meshes: unknown[] = [];
    const nodes: unknown[] = [];
    const materials: unknown[] = [];
    const materialMap = new Map<string, number>();

    for (let gi = 0; gi < geometries.length; gi++) {
      const geom = geometries[gi];

      // Get or create material
      const colorKey = `${geom.color.r.toFixed(3)}_${geom.color.g.toFixed(3)}_${geom.color.b.toFixed(3)}_${geom.color.a.toFixed(3)}`;
      let materialIndex = materialMap.get(colorKey);

      if (materialIndex === undefined) {
        materialIndex = materials.length;
        materialMap.set(colorKey, materialIndex);
        materials.push({
          name: `material_${materialIndex}`,
          pbrMetallicRoughness: {
            baseColorFactor: [geom.color.r, geom.color.g, geom.color.b, geom.color.a],
            metallicFactor: 0.1,
            roughnessFactor: 0.8,
          },
          doubleSided: true,
          alphaMode: geom.color.a < 1.0 ? 'BLEND' : 'OPAQUE',
        });
      }

      // Position buffer view
      const positionBytes = geom.vertices.buffer.slice(
        geom.vertices.byteOffset,
        geom.vertices.byteOffset + geom.vertices.byteLength
      ) as ArrayBuffer;
      const positionViewIndex = bufferViews.length;
      bufferViews.push({
        buffer: 0,
        byteOffset: currentOffset,
        byteLength: positionBytes.byteLength,
        target: 34962, // ARRAY_BUFFER
      });
      bufferParts.push(positionBytes);
      currentOffset += positionBytes.byteLength;

      // Compute position bounds
      let minX = Infinity, minY = Infinity, minZ = Infinity;
      let maxX = -Infinity, maxY = -Infinity, maxZ = -Infinity;
      for (let v = 0; v < geom.vertices.length; v += 3) {
        minX = Math.min(minX, geom.vertices[v]);
        minY = Math.min(minY, geom.vertices[v + 1]);
        minZ = Math.min(minZ, geom.vertices[v + 2]);
        maxX = Math.max(maxX, geom.vertices[v]);
        maxY = Math.max(maxY, geom.vertices[v + 1]);
        maxZ = Math.max(maxZ, geom.vertices[v + 2]);
      }

      // Position accessor
      const positionAccessorIndex = accessors.length;
      accessors.push({
        bufferView: positionViewIndex,
        componentType: 5126, // FLOAT
        count: geom.vertices.length / 3,
        type: 'VEC3',
        min: [minX, minY, minZ],
        max: [maxX, maxY, maxZ],
      });

      // Normal buffer view
      const normalBytes = geom.normals.buffer.slice(
        geom.normals.byteOffset,
        geom.normals.byteOffset + geom.normals.byteLength
      ) as ArrayBuffer;
      const normalViewIndex = bufferViews.length;
      bufferViews.push({
        buffer: 0,
        byteOffset: currentOffset,
        byteLength: normalBytes.byteLength,
        target: 34962,
      });
      bufferParts.push(normalBytes);
      currentOffset += normalBytes.byteLength;

      const normalAccessorIndex = accessors.length;
      accessors.push({
        bufferView: normalViewIndex,
        componentType: 5126,
        count: geom.normals.length / 3,
        type: 'VEC3',
      });

      // Index buffer view
      const indexBytes = geom.indices.buffer.slice(
        geom.indices.byteOffset,
        geom.indices.byteOffset + geom.indices.byteLength
      ) as ArrayBuffer;
      const indexViewIndex = bufferViews.length;
      bufferViews.push({
        buffer: 0,
        byteOffset: currentOffset,
        byteLength: indexBytes.byteLength,
        target: 34963, // ELEMENT_ARRAY_BUFFER
      });
      bufferParts.push(indexBytes);
      currentOffset += indexBytes.byteLength;

      const indexAccessorIndex = accessors.length;
      accessors.push({
        bufferView: indexViewIndex,
        componentType: 5125, // UNSIGNED_INT
        count: geom.indices.length,
        type: 'SCALAR',
      });

      // Mesh
      const meshIndex = meshes.length;
      meshes.push({
        name: `mesh_${geom.expressId}`,
        primitives: [
          {
            attributes: {
              POSITION: positionAccessorIndex,
              NORMAL: normalAccessorIndex,
            },
            indices: indexAccessorIndex,
            material: materialIndex,
          },
        ],
      });

      // Node
      nodes.push({
        name: `node_${geom.expressId}`,
        mesh: meshIndex,
        extras: { expressId: geom.expressId },
      });
    }

    // Build the glTF JSON
    const gltfJson = {
      asset: {
        version: '2.0',
        generator: '@kealee/core-bim GLTFConverter',
      },
      scene: 0,
      scenes: [
        {
          name: 'BIM Model',
          nodes: nodes.map((_, i) => i),
        },
      ],
      nodes,
      meshes,
      accessors,
      bufferViews,
      materials:
        materials.length > 0
          ? materials
          : [
              {
                name: 'default',
                pbrMetallicRoughness: {
                  baseColorFactor: [0.8, 0.8, 0.8, 1.0],
                  metallicFactor: 0.1,
                  roughnessFactor: 0.8,
                },
              },
            ],
      buffers: [{ byteLength: currentOffset }],
    };

    return this.packGLB(gltfJson, bufferParts, currentOffset);
  }

  /**
   * Build an empty but valid GLB for models with no geometry.
   */
  private buildEmptyGLB(): ArrayBuffer {
    const gltfJson = {
      asset: { version: '2.0', generator: '@kealee/core-bim GLTFConverter' },
      scene: 0,
      scenes: [{ name: 'Empty', nodes: [] }],
    };

    return this.packGLB(gltfJson, [], 0);
  }

  /**
   * Pack glTF JSON and binary data into a GLB container.
   *
   * GLB format:
   * - 12-byte header: magic (4), version (4), total length (4)
   * - JSON chunk: length (4), type (4), padded JSON string
   * - BIN chunk: length (4), type (4), binary data
   */
  private packGLB(
    gltfJson: unknown,
    binaryParts: ArrayBuffer[],
    totalBinaryLength: number
  ): ArrayBuffer {
    // Encode JSON to UTF-8
    const jsonString = JSON.stringify(gltfJson);
    const encoder = new TextEncoder();
    const jsonBytes = encoder.encode(jsonString);

    // Pad JSON to 4-byte alignment
    const jsonPadding = (4 - (jsonBytes.length % 4)) % 4;
    const paddedJsonLength = jsonBytes.length + jsonPadding;

    // Pad binary to 4-byte alignment
    const binPadding = totalBinaryLength > 0 ? (4 - (totalBinaryLength % 4)) % 4 : 0;
    const paddedBinLength = totalBinaryLength + binPadding;

    // Calculate total GLB size
    const headerSize = 12;
    const jsonChunkSize = 8 + paddedJsonLength;
    const binChunkSize = totalBinaryLength > 0 ? 8 + paddedBinLength : 0;
    const totalSize = headerSize + jsonChunkSize + binChunkSize;

    // Build the GLB
    const glb = new ArrayBuffer(totalSize);
    const view = new DataView(glb);
    const bytes = new Uint8Array(glb);
    let offset = 0;

    // Header
    view.setUint32(offset, 0x46546c67, true); // magic: "glTF"
    offset += 4;
    view.setUint32(offset, 2, true); // version: 2
    offset += 4;
    view.setUint32(offset, totalSize, true); // total length
    offset += 4;

    // JSON chunk
    view.setUint32(offset, paddedJsonLength, true); // chunk length
    offset += 4;
    view.setUint32(offset, 0x4e4f534a, true); // chunk type: "JSON"
    offset += 4;
    bytes.set(jsonBytes, offset);
    offset += jsonBytes.length;
    // Pad with spaces (0x20)
    for (let p = 0; p < jsonPadding; p++) {
      bytes[offset++] = 0x20;
    }

    // BIN chunk (if there's binary data)
    if (totalBinaryLength > 0) {
      view.setUint32(offset, paddedBinLength, true); // chunk length
      offset += 4;
      view.setUint32(offset, 0x004e4942, true); // chunk type: "BIN\0"
      offset += 4;

      for (const part of binaryParts) {
        bytes.set(new Uint8Array(part), offset);
        offset += part.byteLength;
      }

      // Pad with zeros
      for (let p = 0; p < binPadding; p++) {
        bytes[offset++] = 0x00;
      }
    }

    return glb;
  }
}
