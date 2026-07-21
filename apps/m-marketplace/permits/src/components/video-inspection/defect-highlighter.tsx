'use client';

import React, {useEffect, useRef} from 'react';
import {DefectDetection} from '@permits/src/types/video-inspection';

interface DefectHighlighterProps {
  canvas: HTMLCanvasElement;
  videoElement: HTMLVideoElement;
  defects: DefectDetection[];
  enabled: boolean;
}

export function DefectHighlighter({
  canvas,
  videoElement,
  defects,
  enabled,
}: DefectHighlighterProps) {
  const animationFrameRef = useRef<number>();

  useEffect(() => {
    if (!enabled || !canvas || !videoElement) return;

    const drawHighlights = () => {
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      // Set canvas size to match video
      canvas.width = videoElement.videoWidth || 1280;
      canvas.height = videoElement.videoHeight || 720;

      // Clear previous drawings
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Draw defect highlights
      for (const defect of defects) {
        const {x, y, width, height} = defect.boundingBox;

        // Choose color based on severity
        const color = getSeverityColor(defect.severity);
        const opacity = defect.confidence;

        // Draw bounding box
        ctx.strokeStyle = color;
        ctx.lineWidth = 3;
        ctx.globalAlpha = opacity;
        ctx.strokeRect(x, y, width, height);

        // Draw filled background with transparency
        ctx.fillStyle = color;
        ctx.globalAlpha = opacity * 0.2;
        ctx.fillRect(x, y, width, height);

        // Draw label background
        ctx.globalAlpha = 0.9;
        ctx.fillStyle = color;
        const labelText = `${defect.defectType.replace('_', ' ')} (${Math.round(defect.confidence * 100)}%)`;
        const textMetrics = ctx.measureText(labelText);
        const labelWidth = textMetrics.width + 10;
        const labelHeight = 20;

        ctx.fillRect(x, y - labelHeight - 2, labelWidth, labelHeight);

        // Draw label text
        ctx.fillStyle = '#fff';
        ctx.font = '14px Arial';
        ctx.globalAlpha = 1.0;
        ctx.fillText(labelText, x + 5, y - 5);

        // Draw severity indicator
        drawSeverityIndicator(ctx, x + width - 15, y + 5, defect.severity);
      }

      // Request next frame
      animationFrameRef.current = requestAnimationFrame(drawHighlights);
    };

    drawHighlights();

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [canvas, videoElement, defects, enabled]);

  return null;
}

function getSeverityColor(severity: string): string {
  switch (severity) {
    case 'critical':
      return '#ef4444'; // Red
    case 'major':
      return '#f59e0b'; // Orange
    case 'minor':
      return '#eab308'; // Yellow
    default:
      return '#64748b'; // Gray
  }
}

function drawSeverityIndicator(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  severity: string
) {
  ctx.fillStyle = getSeverityColor(severity);
  ctx.beginPath();
  ctx.arc(x, y, 6, 0, Math.PI * 2);
  ctx.fill();

  // Add pulsing animation for critical issues
  if (severity === 'critical') {
    ctx.strokeStyle = getSeverityColor(severity);
    ctx.lineWidth = 2;
    ctx.globalAlpha = 0.5;
    ctx.beginPath();
    ctx.arc(x, y, 10, 0, Math.PI * 2);
    ctx.stroke();
    ctx.globalAlpha = 1.0;
  }
}
