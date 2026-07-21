/**
 * @kealee/core-bim — ViewerControls Component
 *
 * Camera and display controls for the BIM viewer.
 * Provides a UI panel for color scheme selection, camera presets,
 * and element filtering.
 */

import React, { useCallback } from 'react';

import type { ViewerControlsProps, ColorScheme } from '../types';

/** All available color schemes with labels */
const COLOR_SCHEME_OPTIONS: { value: ColorScheme; label: string }[] = [
  { value: 'DEFAULT', label: 'Default' },
  { value: 'BY_STATUS', label: 'By Status' },
  { value: 'BY_TRADE', label: 'By Trade' },
  { value: 'BY_COST', label: 'By Cost' },
  { value: 'BY_SCHEDULE', label: 'By Schedule' },
  { value: 'BY_HEALTH', label: 'By Health' },
];

/** Camera preset positions */
const CAMERA_PRESETS: {
  label: string;
  position: { x: number; y: number; z: number };
  target: { x: number; y: number; z: number };
}[] = [
  { label: 'Perspective', position: { x: 10, y: 10, z: 10 }, target: { x: 0, y: 0, z: 0 } },
  { label: 'Top', position: { x: 0, y: 20, z: 0 }, target: { x: 0, y: 0, z: 0 } },
  { label: 'Front', position: { x: 0, y: 5, z: 20 }, target: { x: 0, y: 5, z: 0 } },
  { label: 'Right', position: { x: 20, y: 5, z: 0 }, target: { x: 0, y: 5, z: 0 } },
  { label: 'Back', position: { x: 0, y: 5, z: -20 }, target: { x: 0, y: 5, z: 0 } },
  { label: 'Left', position: { x: -20, y: 5, z: 0 }, target: { x: 0, y: 5, z: 0 } },
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
  marginBottom: '6px',
  color: '#333',
  fontSize: '12px',
  textTransform: 'uppercase',
  letterSpacing: '0.5px',
};

const selectStyle: React.CSSProperties = {
  width: '100%',
  padding: '6px 8px',
  borderRadius: '4px',
  border: '1px solid #ddd',
  fontSize: '13px',
  backgroundColor: '#fff',
  cursor: 'pointer',
};

const buttonStyle: React.CSSProperties = {
  padding: '4px 8px',
  borderRadius: '4px',
  border: '1px solid #ddd',
  backgroundColor: '#fff',
  cursor: 'pointer',
  fontSize: '12px',
  flex: 1,
  textAlign: 'center',
};

/**
 * ViewerControls — Camera and display control panel.
 *
 * Renders a floating UI panel with:
 * - Color scheme dropdown
 * - Camera preset buttons
 *
 * @param props - ViewerControlsProps.
 */
export const ViewerControls: React.FC<ViewerControlsProps> = ({
  viewerState,
  onStateChange,
  availableSchemes,
}) => {
  const schemes = availableSchemes
    ? COLOR_SCHEME_OPTIONS.filter((s) => availableSchemes.includes(s.value))
    : COLOR_SCHEME_OPTIONS;

  /** Handle color scheme change */
  const handleSchemeChange = useCallback(
    (e: React.ChangeEvent<HTMLSelectElement>) => {
      onStateChange({ colorScheme: e.target.value as ColorScheme });
    },
    [onStateChange]
  );

  /** Handle camera preset selection */
  const handleCameraPreset = useCallback(
    (preset: (typeof CAMERA_PRESETS)[number]) => {
      onStateChange({
        cameraPosition: preset.position,
        cameraTarget: preset.target,
      });
    },
    [onStateChange]
  );

  return (
    <div style={panelStyle}>
      {/* Color Scheme */}
      <div style={{ marginBottom: '12px' }}>
        <label style={labelStyle}>Color Scheme</label>
        <select
          value={viewerState.colorScheme}
          onChange={handleSchemeChange}
          style={selectStyle}
        >
          {schemes.map((s) => (
            <option key={s.value} value={s.value}>
              {s.label}
            </option>
          ))}
        </select>
      </div>

      {/* Camera Presets */}
      <div>
        <label style={labelStyle}>Camera</label>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
          {CAMERA_PRESETS.map((preset) => (
            <button
              key={preset.label}
              onClick={() => handleCameraPreset(preset)}
              style={{
                ...buttonStyle,
                backgroundColor:
                  viewerState.cameraPosition.x === preset.position.x &&
                  viewerState.cameraPosition.y === preset.position.y &&
                  viewerState.cameraPosition.z === preset.position.z
                    ? '#e8f0ff'
                    : '#fff',
              }}
            >
              {preset.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
