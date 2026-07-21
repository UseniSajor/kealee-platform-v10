/**
 * @kealee/core-bim — AnnotationOverlay Component
 *
 * Renders HTML annotation markers on 3D positions in the BIM viewer.
 * Uses React Three Fiber's Html component from @react-three/drei to
 * project HTML elements onto 3D world-space coordinates.
 */

import React, { useState, useCallback } from 'react';
import { Html } from '@react-three/drei';

import type { AnnotationOverlayProps, Annotation } from '../types';

/** Priority color mapping */
const PRIORITY_COLORS: Record<string, string> = {
  LOW: '#44cc44',
  MEDIUM: '#cccc44',
  HIGH: '#cc8844',
  CRITICAL: '#cc4444',
};

/**
 * AnnotationOverlay — 3D-positioned HTML annotation markers.
 *
 * Each annotation renders as a small marker at its 3D position,
 * with an expandable tooltip showing the title and content.
 *
 * Must be used inside a React Three Fiber Canvas.
 *
 * @param props - AnnotationOverlayProps.
 */
export const AnnotationOverlay: React.FC<AnnotationOverlayProps> = ({
  annotations,
  onAnnotationClick,
  visible = true,
}) => {
  if (!visible || annotations.length === 0) return null;

  return (
    <group>
      {annotations.map((annotation) => (
        <AnnotationMarker
          key={annotation.id}
          annotation={annotation}
          onClick={onAnnotationClick}
        />
      ))}
    </group>
  );
};

// ---------------------------------------------------------------------------
// Subcomponents
// ---------------------------------------------------------------------------

interface AnnotationMarkerProps {
  annotation: Annotation;
  onClick?: (annotation: Annotation) => void;
}

/**
 * Individual annotation marker positioned in 3D space.
 */
const AnnotationMarker: React.FC<AnnotationMarkerProps> = ({
  annotation,
  onClick,
}) => {
  const [expanded, setExpanded] = useState(false);
  const color = PRIORITY_COLORS[annotation.priority ?? 'MEDIUM'] ?? '#cccc44';

  const handleClick = useCallback(() => {
    setExpanded((prev) => !prev);
    onClick?.(annotation);
  }, [annotation, onClick]);

  return (
    <Html
      position={[
        annotation.position.x,
        annotation.position.y,
        annotation.position.z,
      ]}
      center
      distanceFactor={10}
      style={{ pointerEvents: 'auto' }}
    >
      <div
        style={{
          position: 'relative',
          cursor: 'pointer',
          userSelect: 'none',
        }}
        onClick={handleClick}
      >
        {/* Marker dot */}
        <div
          style={{
            width: '16px',
            height: '16px',
            borderRadius: '50%',
            backgroundColor: color,
            border: '2px solid white',
            boxShadow: '0 1px 4px rgba(0,0,0,0.3)',
            transition: 'transform 0.15s ease',
            transform: expanded ? 'scale(1.3)' : 'scale(1)',
          }}
        />

        {/* Expanded tooltip */}
        {expanded && (
          <div
            style={{
              position: 'absolute',
              bottom: '24px',
              left: '50%',
              transform: 'translateX(-50%)',
              backgroundColor: 'rgba(255,255,255,0.97)',
              borderRadius: '8px',
              padding: '10px 14px',
              boxShadow: '0 2px 12px rgba(0,0,0,0.2)',
              minWidth: '200px',
              maxWidth: '300px',
              fontFamily: 'sans-serif',
              fontSize: '13px',
              zIndex: 20,
            }}
          >
            {/* Arrow */}
            <div
              style={{
                position: 'absolute',
                bottom: '-6px',
                left: '50%',
                transform: 'translateX(-50%) rotate(45deg)',
                width: '12px',
                height: '12px',
                backgroundColor: 'rgba(255,255,255,0.97)',
                boxShadow: '2px 2px 4px rgba(0,0,0,0.1)',
              }}
            />

            {/* Content */}
            <div style={{ position: 'relative', zIndex: 1 }}>
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: '6px',
                }}
              >
                <strong style={{ color: '#333', fontSize: '14px' }}>
                  {annotation.title}
                </strong>
                {annotation.priority && (
                  <span
                    style={{
                      fontSize: '10px',
                      padding: '2px 6px',
                      borderRadius: '4px',
                      backgroundColor: color,
                      color: 'white',
                      fontWeight: 'bold',
                      textTransform: 'uppercase',
                    }}
                  >
                    {annotation.priority}
                  </span>
                )}
              </div>

              <p
                style={{
                  color: '#666',
                  margin: '0 0 6px 0',
                  lineHeight: '1.4',
                  fontSize: '12px',
                }}
              >
                {annotation.content}
              </p>

              {annotation.createdAt && (
                <p
                  style={{
                    color: '#999',
                    margin: 0,
                    fontSize: '11px',
                  }}
                >
                  {new Date(annotation.createdAt).toLocaleDateString()}
                </p>
              )}
            </div>
          </div>
        )}
      </div>
    </Html>
  );
};
