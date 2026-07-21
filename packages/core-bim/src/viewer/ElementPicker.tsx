/**
 * @kealee/core-bim — ElementPicker Component
 *
 * Provides click-to-select functionality for BIM elements in the 3D scene.
 * Uses Three.js raycasting to detect which element the user clicked on,
 * highlights the selection, and reports it back to the parent component.
 */

import React, { useCallback, useRef, useEffect } from 'react';
import { useThree } from '@react-three/fiber';
import * as THREE from 'three';

import type { ElementPickerProps, BIMElementData } from '../types';

/** Highlight color for selected elements */
const HIGHLIGHT_COLOR = new THREE.Color(0xff8844);
const HOVER_COLOR = new THREE.Color(0x4488ff);

/** Original material cache for restoring after deselection */
const originalMaterials = new WeakMap<THREE.Mesh, THREE.Material | THREE.Material[]>();

/**
 * ElementPicker — Raycasting-based element selection for BIM models.
 *
 * Listens for click events on the Three.js canvas and uses raycasting
 * to determine which mesh was clicked. Extracts element metadata from
 * the mesh's userData (populated by ModelLoader from glTF extras).
 *
 * Must be used inside a React Three Fiber Canvas.
 *
 * @param props - ElementPickerProps.
 */
export const ElementPicker: React.FC<ElementPickerProps> = ({
  onPick,
  selectedElement,
  enabled = true,
}) => {
  const { camera, scene, gl } = useThree();
  const raycaster = useRef(new THREE.Raycaster());
  const mouse = useRef(new THREE.Vector2());
  const previousSelection = useRef<THREE.Mesh | null>(null);

  /**
   * Handle click events for element picking.
   */
  const handleClick = useCallback(
    (event: MouseEvent) => {
      if (!enabled) return;

      const canvas = gl.domElement;
      const rect = canvas.getBoundingClientRect();

      // Convert screen coordinates to normalized device coordinates (-1 to +1)
      mouse.current.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      mouse.current.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

      // Cast ray from camera through mouse position
      raycaster.current.setFromCamera(mouse.current, camera);
      const intersects = raycaster.current.intersectObjects(
        scene.children,
        true
      );

      // Restore previous selection
      restoreMaterial(previousSelection.current);
      previousSelection.current = null;

      // Find the first pickable mesh
      for (const intersect of intersects) {
        const mesh = intersect.object;
        if (!(mesh instanceof THREE.Mesh)) continue;

        // Look for pickable meshes (those with expressId from glTF extras)
        const pickableMesh = findPickableParent(mesh);
        if (!pickableMesh) continue;

        // Highlight the selected mesh
        highlightMesh(pickableMesh, HIGHLIGHT_COLOR);
        previousSelection.current = pickableMesh;

        // Build element data from mesh userData
        const elementData = buildElementData(pickableMesh);
        onPick(elementData);
        return;
      }

      // Clicked on empty space — deselect
      onPick(null);
    },
    [enabled, camera, scene, gl, onPick]
  );

  // Attach/detach click listener
  useEffect(() => {
    const canvas = gl.domElement;
    canvas.addEventListener('click', handleClick);
    return () => {
      canvas.removeEventListener('click', handleClick);
    };
  }, [gl, handleClick]);

  // Sync external selection state
  useEffect(() => {
    if (!selectedElement) {
      restoreMaterial(previousSelection.current);
      previousSelection.current = null;
    }
  }, [selectedElement]);

  // This component doesn't render any 3D objects itself
  return null;
};

// ---------------------------------------------------------------------------
// Helper functions
// ---------------------------------------------------------------------------

/**
 * Walk up the object hierarchy to find a mesh with pickable userData.
 */
function findPickableParent(
  object: THREE.Object3D
): THREE.Mesh | null {
  let current: THREE.Object3D | null = object;

  while (current) {
    if (
      current instanceof THREE.Mesh &&
      current.userData?.pickable === true
    ) {
      return current;
    }
    current = current.parent;
  }

  // If no pickable parent found, try the original mesh
  if (object instanceof THREE.Mesh) {
    return object;
  }

  return null;
}

/**
 * Highlight a mesh by replacing its material color.
 * Caches the original material for later restoration.
 */
function highlightMesh(mesh: THREE.Mesh, color: THREE.Color): void {
  if (!originalMaterials.has(mesh)) {
    // Cache the original material(s)
    originalMaterials.set(
      mesh,
      Array.isArray(mesh.material)
        ? mesh.material.map((m) => m.clone())
        : mesh.material.clone()
    );
  }

  const applyHighlight = (material: THREE.Material): void => {
    if (material instanceof THREE.MeshStandardMaterial) {
      material.emissive = color;
      material.emissiveIntensity = 0.3;
    }
  };

  if (Array.isArray(mesh.material)) {
    mesh.material.forEach(applyHighlight);
  } else {
    applyHighlight(mesh.material);
  }
}

/**
 * Restore a mesh's original material after deselection.
 */
function restoreMaterial(mesh: THREE.Mesh | null): void {
  if (!mesh) return;

  const original = originalMaterials.get(mesh);
  if (original) {
    mesh.material = original;
    originalMaterials.delete(mesh);
  } else {
    // Reset emissive if no cached material
    const resetEmissive = (material: THREE.Material): void => {
      if (material instanceof THREE.MeshStandardMaterial) {
        material.emissive = new THREE.Color(0x000000);
        material.emissiveIntensity = 0;
      }
    };

    if (Array.isArray(mesh.material)) {
      mesh.material.forEach(resetEmissive);
    } else {
      resetEmissive(mesh.material);
    }
  }
}

/**
 * Build a BIMElementData object from a mesh's userData.
 * Uses metadata stored in glTF extras by the GLTFConverter.
 */
function buildElementData(mesh: THREE.Mesh): BIMElementData {
  const userData = mesh.userData ?? {};
  const box = new THREE.Box3().setFromObject(mesh);

  return {
    id: String(userData.expressId ?? mesh.uuid),
    ifcGlobalId: String(userData.ifcGlobalId ?? userData.expressId ?? 'unknown'),
    elementType: userData.elementType ?? 'OTHER',
    name: userData.name ?? mesh.name ?? 'Unknown Element',
    properties: userData.properties ?? {},
    boundingBox: {
      min: { x: box.min.x, y: box.min.y, z: box.min.z },
      max: { x: box.max.x, y: box.max.y, z: box.max.z },
    },
    materials: [
      {
        name: Array.isArray(mesh.material)
          ? mesh.material[0]?.name ?? 'Default'
          : mesh.material?.name ?? 'Default',
      },
    ],
    status: userData.status ?? 'NEW',
    system: userData.system,
    modelId: userData.modelId,
    storey: userData.storey,
  };
}
