/**
 * @kealee/core-bim — BIMViewer Component
 *
 * Main React Three Fiber 3D viewer for BIM models. Provides orbit controls,
 * element selection, layer toggling, and configurable color schemes.
 *
 * @example
 * ```tsx
 * <BIMViewer
 *   modelUrl="/models/building-a.glb"
 *   onElementSelect={(el) => console.log('Selected:', el)}
 *   layers={['DESIGN', 'CONSTRUCTION']}
 *   colorScheme="BY_TRADE"
 * />
 * ```
 */

import React, { useState, useCallback, Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Environment, GizmoHelper, GizmoViewport } from '@react-three/drei';

import type {
  BIMViewerProps,
  BIMElementData,
  ViewerState,
  ViewerLayer,
  ColorScheme,
  Annotation,
} from '../types';
import {
  DEFAULT_VISIBLE_LAYERS,
  DEFAULT_COLOR_SCHEME,
} from '../types';
import { ModelLoader } from './ModelLoader';
import { ElementPicker } from './ElementPicker';
import { LayerManager } from './LayerManager';
import { ViewerControls } from './ViewerControls';
import { AnnotationOverlay } from './AnnotationOverlay';

/**
 * BIMViewer — Full-featured 3D BIM model viewer.
 *
 * Renders a glTF/GLB model in a Three.js scene with:
 * - Orbit camera controls (rotate, zoom, pan)
 * - Click-to-select element picking with raycasting
 * - Configurable visualization layers
 * - Multiple color schemes (by status, trade, cost, schedule, health)
 * - 3D annotation overlays
 * - Environment lighting and shadows
 *
 * @param props - BIMViewerProps configuration.
 */
export const BIMViewer: React.FC<BIMViewerProps> = ({
  modelUrl,
  onElementSelect,
  layers,
  colorScheme,
  initialState,
  annotations = [],
  onAnnotationClick,
  width = '100%',
  height = '600px',
  backgroundColor = '#f0f0f0',
  ambientOcclusion = true,
  shadows = true,
}) => {
  // Viewer state management
  const [viewerState, setViewerState] = useState<ViewerState>({
    cameraPosition: initialState?.cameraPosition ?? { x: 10, y: 10, z: 10 },
    cameraTarget: initialState?.cameraTarget ?? { x: 0, y: 0, z: 0 },
    visibleLayers: layers ?? initialState?.visibleLayers ?? DEFAULT_VISIBLE_LAYERS,
    elementFilters: initialState?.elementFilters ?? [],
    colorScheme: colorScheme ?? initialState?.colorScheme ?? DEFAULT_COLOR_SCHEME,
    selectedElements: initialState?.selectedElements ?? [],
    fov: initialState?.fov ?? 50,
  });

  const [selectedElement, setSelectedElement] = useState<BIMElementData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  /** Handle element selection from raycasting */
  const handleElementSelect = useCallback(
    (element: BIMElementData | null) => {
      setSelectedElement(element);
      if (element) {
        setViewerState((prev) => ({
          ...prev,
          selectedElements: [element.id],
        }));
      } else {
        setViewerState((prev) => ({
          ...prev,
          selectedElements: [],
        }));
      }
      onElementSelect?.(element);
    },
    [onElementSelect]
  );

  /** Handle viewer state changes from controls */
  const handleStateChange = useCallback((updates: Partial<ViewerState>) => {
    setViewerState((prev) => ({ ...prev, ...updates }));
  }, []);

  /** Handle layer visibility changes */
  const handleLayersChange = useCallback(
    (newLayers: ViewerLayer[]) => {
      setViewerState((prev) => ({ ...prev, visibleLayers: newLayers }));
    },
    []
  );

  /** Handle model load completion */
  const handleModelLoad = useCallback(() => {
    setIsLoading(false);
  }, []);

  /** Handle model load error */
  const handleModelError = useCallback((err: Error) => {
    setError(err);
    setIsLoading(false);
  }, []);

  if (error) {
    return (
      <div
        style={{
          width,
          height,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#fee',
          border: '1px solid #f88',
          borderRadius: '4px',
          padding: '20px',
          fontFamily: 'sans-serif',
        }}
      >
        <div style={{ textAlign: 'center' }}>
          <p style={{ color: '#c44', fontWeight: 'bold', marginBottom: '8px' }}>
            Failed to load BIM model
          </p>
          <p style={{ color: '#666', fontSize: '14px' }}>{error.message}</p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ position: 'relative', width, height }}>
      {/* Loading overlay */}
      {isLoading && (
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: 'rgba(240, 240, 240, 0.9)',
            zIndex: 10,
            fontFamily: 'sans-serif',
          }}
        >
          <div style={{ textAlign: 'center' }}>
            <div
              style={{
                width: '40px',
                height: '40px',
                border: '4px solid #ddd',
                borderTopColor: '#4488ff',
                borderRadius: '50%',
                animation: 'spin 1s linear infinite',
                margin: '0 auto 12px',
              }}
            />
            <p style={{ color: '#666' }}>Loading BIM model...</p>
          </div>
        </div>
      )}

      {/* Three.js Canvas */}
      <Canvas
        shadows={shadows}
        camera={{
          position: [
            viewerState.cameraPosition.x,
            viewerState.cameraPosition.y,
            viewerState.cameraPosition.z,
          ],
          fov: viewerState.fov ?? 50,
          near: 0.1,
          far: 10000,
        }}
        style={{ background: backgroundColor }}
      >
        {/* Lighting */}
        <ambientLight intensity={0.4} />
        <directionalLight
          position={[10, 20, 10]}
          intensity={0.8}
          castShadow={shadows}
          shadow-mapSize-width={2048}
          shadow-mapSize-height={2048}
        />
        <directionalLight position={[-10, 10, -10]} intensity={0.3} />

        {/* Environment for PBR materials */}
        {ambientOcclusion && (
          <Environment preset="city" background={false} />
        )}

        {/* Model */}
        <Suspense fallback={null}>
          <ModelLoader
            url={modelUrl}
            onLoad={handleModelLoad}
            onError={handleModelError}
            colorScheme={viewerState.colorScheme}
          />
        </Suspense>

        {/* Element picking (raycasting) */}
        <ElementPicker
          onPick={handleElementSelect}
          selectedElement={selectedElement}
          enabled={true}
        />

        {/* Orbit controls */}
        <OrbitControls
          target={[
            viewerState.cameraTarget.x,
            viewerState.cameraTarget.y,
            viewerState.cameraTarget.z,
          ]}
          enableDamping
          dampingFactor={0.1}
          minDistance={0.5}
          maxDistance={1000}
        />

        {/* Navigation gizmo */}
        <GizmoHelper alignment="bottom-right" margin={[60, 60]}>
          <GizmoViewport
            axisColors={['#f73', '#3f7', '#37f']}
            labelColor="white"
          />
        </GizmoHelper>

        {/* Ground grid */}
        <gridHelper args={[100, 100, '#ccc', '#eee']} />

        {/* Annotation overlays */}
        {annotations.length > 0 && (
          <AnnotationOverlay
            annotations={annotations}
            onAnnotationClick={onAnnotationClick}
            visible={true}
          />
        )}
      </Canvas>

      {/* UI overlays */}
      <div
        style={{
          position: 'absolute',
          top: '12px',
          right: '12px',
          zIndex: 5,
          display: 'flex',
          flexDirection: 'column',
          gap: '8px',
        }}
      >
        <ViewerControls
          viewerState={viewerState}
          onStateChange={handleStateChange}
        />
        <LayerManager
          visibleLayers={viewerState.visibleLayers}
          onLayersChange={handleLayersChange}
        />
      </div>

      {/* Selected element info panel */}
      {selectedElement && (
        <div
          style={{
            position: 'absolute',
            bottom: '12px',
            left: '12px',
            backgroundColor: 'rgba(255,255,255,0.95)',
            borderRadius: '8px',
            padding: '12px 16px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
            maxWidth: '320px',
            fontFamily: 'sans-serif',
            fontSize: '13px',
            zIndex: 5,
          }}
        >
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '8px',
            }}
          >
            <strong style={{ fontSize: '14px' }}>{selectedElement.name}</strong>
            <button
              onClick={() => handleElementSelect(null)}
              style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                fontSize: '16px',
                color: '#999',
                padding: '0 4px',
              }}
            >
              x
            </button>
          </div>
          <div style={{ color: '#666' }}>
            <p style={{ margin: '2px 0' }}>Type: {selectedElement.elementType}</p>
            <p style={{ margin: '2px 0' }}>System: {selectedElement.system ?? 'N/A'}</p>
            <p style={{ margin: '2px 0' }}>Status: {selectedElement.status}</p>
            <p style={{ margin: '2px 0' }}>
              IFC ID: {selectedElement.ifcGlobalId}
            </p>
          </div>
        </div>
      )}
    </div>
  );
};
