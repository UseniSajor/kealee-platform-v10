/**
 * @kealee/core-bim — LayerManager Component
 *
 * Toggle-based UI for controlling which visualization layers are visible
 * in the BIM viewer. Layers map to Kealee OS modules (Design, Permit,
 * Construction, Financial, Operations, Land).
 */

import React, { useCallback } from 'react';

import type { LayerManagerProps, ViewerLayer } from '../types';

/** Layer definitions with labels and default colors */
const LAYER_DEFINITIONS: {
  value: ViewerLayer;
  label: string;
  color: string;
  description: string;
}[] = [
  {
    value: 'DESIGN',
    label: 'Design',
    color: '#4488ff',
    description: 'Architectural & engineering design elements',
  },
  {
    value: 'PERMIT',
    label: 'Permits',
    color: '#ff8844',
    description: 'Permit-related annotations and zones',
  },
  {
    value: 'CONSTRUCTION',
    label: 'Construction',
    color: '#44cc44',
    description: 'Construction progress and status',
  },
  {
    value: 'FINANCIAL',
    label: 'Financial',
    color: '#cc44cc',
    description: 'Cost and payment tracking overlays',
  },
  {
    value: 'OPERATIONS',
    label: 'Operations',
    color: '#cccc44',
    description: 'Maintenance and operations data',
  },
  {
    value: 'LAND',
    label: 'Land',
    color: '#88cc44',
    description: 'Site and land survey information',
  },
];

/** Panel styles */
const panelStyle: React.CSSProperties = {
  backgroundColor: 'rgba(255, 255, 255, 0.95)',
  borderRadius: '8px',
  padding: '12px',
  boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
  fontFamily: 'sans-serif',
  fontSize: '13px',
  minWidth: '180px',
};

const labelStyle: React.CSSProperties = {
  display: 'block',
  fontWeight: 'bold',
  marginBottom: '8px',
  color: '#333',
  fontSize: '12px',
  textTransform: 'uppercase',
  letterSpacing: '0.5px',
};

/**
 * LayerManager — Layer visibility toggle panel.
 *
 * Renders a list of checkboxes for each viewer layer.
 * Toggling a layer adds or removes it from the visible set.
 *
 * @param props - LayerManagerProps.
 */
export const LayerManager: React.FC<LayerManagerProps> = ({
  visibleLayers,
  onLayersChange,
}) => {
  const visibleSet = new Set(visibleLayers);

  /** Toggle a layer's visibility */
  const handleToggle = useCallback(
    (layer: ViewerLayer) => {
      const newSet = new Set(visibleLayers);
      if (newSet.has(layer)) {
        newSet.delete(layer);
      } else {
        newSet.add(layer);
      }
      onLayersChange(Array.from(newSet));
    },
    [visibleLayers, onLayersChange]
  );

  /** Toggle all layers on or off */
  const handleToggleAll = useCallback(() => {
    if (visibleLayers.length === LAYER_DEFINITIONS.length) {
      onLayersChange([]);
    } else {
      onLayersChange(LAYER_DEFINITIONS.map((l) => l.value));
    }
  }, [visibleLayers, onLayersChange]);

  const allVisible = visibleLayers.length === LAYER_DEFINITIONS.length;

  return (
    <div style={panelStyle}>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '8px',
        }}
      >
        <span style={labelStyle}>Layers</span>
        <button
          onClick={handleToggleAll}
          style={{
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            fontSize: '11px',
            color: '#4488ff',
            padding: 0,
          }}
        >
          {allVisible ? 'Hide All' : 'Show All'}
        </button>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
        {LAYER_DEFINITIONS.map((layer) => {
          const isVisible = visibleSet.has(layer.value);

          return (
            <label
              key={layer.value}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                cursor: 'pointer',
                padding: '4px 0',
                opacity: isVisible ? 1 : 0.5,
              }}
              title={layer.description}
            >
              <input
                type="checkbox"
                checked={isVisible}
                onChange={() => handleToggle(layer.value)}
                style={{ margin: 0, cursor: 'pointer' }}
              />
              <span
                style={{
                  width: '10px',
                  height: '10px',
                  borderRadius: '2px',
                  backgroundColor: layer.color,
                  flexShrink: 0,
                }}
              />
              <span style={{ color: '#333' }}>{layer.label}</span>
            </label>
          );
        })}
      </div>
    </div>
  );
};
