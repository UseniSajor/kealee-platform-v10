'use client';

import React, {useState, useRef, useEffect} from 'react';
import {Button} from '@permits/src/components/ui/button';
import {Card} from '@permits/src/components/ui/card';
import {Ruler, X, Check} from 'lucide-react';
import {Point, Measurement} from '@permits/src/types/video-inspection';
import {aiVideoAnalysisService} from '@permits/src/services/video-inspection/ai-video-analysis';

interface DimensionMeasurementToolProps {
  videoElement: HTMLVideoElement | null;
  canvas: HTMLCanvasElement | null;
  onMeasurementComplete: (measurement: Measurement) => void;
  onCancel: () => void;
}

export function DimensionMeasurementTool({
  videoElement,
  canvas,
  onMeasurementComplete,
  onCancel,
}: DimensionMeasurementToolProps) {
  const [mode, setMode] = useState<'reference' | 'measure'>('reference');
  const [referencePoints, setReferencePoints] = useState<Point[]>([]);
  const [measurementPoints, setMeasurementPoints] = useState<{start: Point | null; end: Point | null}>({
    start: null,
    end: null,
  });
  const [referenceLength, setReferenceLength] = useState<number>(12); // Default 12 inches
  const [isDrawing, setIsDrawing] = useState(false);

  useEffect(() => {
    if (!canvas || !videoElement) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = videoElement.videoWidth || 1280;
    canvas.height = videoElement.videoHeight || 720;

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Draw reference object (4 points)
      if (mode === 'reference' && referencePoints.length > 0) {
        ctx.strokeStyle = '#3b82f6';
        ctx.lineWidth = 2;
        ctx.setLineDash([5, 5]);

        for (let i = 0; i < referencePoints.length; i++) {
          const point = referencePoints[i];
          const nextPoint = referencePoints[(i + 1) % referencePoints.length];

          ctx.beginPath();
          ctx.moveTo(point.x, point.y);
          ctx.lineTo(nextPoint.x, nextPoint.y);
          ctx.stroke();

          // Draw point
          ctx.fillStyle = '#3b82f6';
          ctx.beginPath();
          ctx.arc(point.x, point.y, 5, 0, Math.PI * 2);
          ctx.fill();
        }

        ctx.setLineDash([]);
      }

      // Draw measurement line
      if (mode === 'measure' && measurementPoints.start && measurementPoints.end) {
        ctx.strokeStyle = '#22c55e';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(measurementPoints.start.x, measurementPoints.start.y);
        ctx.lineTo(measurementPoints.end.x, measurementPoints.end.y);
        ctx.stroke();

        // Draw endpoints
        ctx.fillStyle = '#22c55e';
        [measurementPoints.start, measurementPoints.end].forEach(point => {
          ctx.beginPath();
          ctx.arc(point.x, point.y, 6, 0, Math.PI * 2);
          ctx.fill();
        });

        // Draw measurement label
        const distance = Math.sqrt(
          Math.pow(measurementPoints.end.x - measurementPoints.start.x, 2) +
          Math.pow(measurementPoints.end.y - measurementPoints.start.y, 2)
        );
        const midX = (measurementPoints.start.x + measurementPoints.end.x) / 2;
        const midY = (measurementPoints.start.y + measurementPoints.end.y) / 2;

        ctx.fillStyle = '#fff';
        ctx.fillRect(midX - 40, midY - 15, 80, 20);
        ctx.fillStyle = '#22c55e';
        ctx.font = '12px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(`${Math.round(distance)}px`, midX, midY);
      }

      requestAnimationFrame(draw);
    };

    draw();
  }, [canvas, videoElement, mode, referencePoints, measurementPoints]);

  const handleCanvasClick = (e: {clientX: number; clientY: number}) => {
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    if (mode === 'reference') {
      if (referencePoints.length < 4) {
        setReferencePoints([...referencePoints, {x, y}]);
      }
    } else if (mode === 'measure') {
      if (!measurementPoints.start) {
        setMeasurementPoints({start: {x, y}, end: null});
      } else if (!measurementPoints.end) {
        setMeasurementPoints({...measurementPoints, end: {x, y}});
      }
    }
  };

  const handleMeasure = async () => {
    if (!videoElement || !measurementPoints.start || !measurementPoints.end) return;

    try {
      const measurements = await aiVideoAnalysisService.measureDimensions(
        videoElement,
        {
          start: measurementPoints.start,
          end: measurementPoints.end,
        },
        referencePoints.length === 4
          ? {
              points: referencePoints,
              length: referenceLength,
            }
          : undefined
      );

      if (measurements.length > 0) {
        onMeasurementComplete(measurements[0]);
      }
    } catch (error) {
      console.error('Error measuring:', error);
    }
  };

  const handleReset = () => {
    setReferencePoints([]);
    setMeasurementPoints({start: null, end: null});
    setMode('reference');
  };

  return (
    <Card className="p-4 bg-white/95 backdrop-blur">
      <div className="mb-4">
        <h3 className="font-semibold mb-2">Dimension Measurement</h3>
        
        {mode === 'reference' && (
          <div className="space-y-2">
            <p className="text-sm text-gray-600">
              Click 4 points to define reference object (e.g., ruler, door frame)
            </p>
            <div className="flex items-center gap-2">
              <label className="text-sm">Reference Length:</label>
              <input
                type="number"
                value={referenceLength}
                onChange={(e) => setReferenceLength(Number(e.target.value))}
                className="w-20 px-2 py-1 border rounded"
                min="0.1"
                step="0.1"
              />
              <span className="text-sm">inches</span>
            </div>
            <div className="text-sm text-gray-500">
              Points: {referencePoints.length}/4
            </div>
            {referencePoints.length === 4 && (
              <Button
                size="sm"
                onClick={() => setMode('measure')}
                className="w-full">
                <Check className="w-4 h-4 mr-2" />
                Reference Set - Start Measuring
              </Button>
            )}
          </div>
        )}

        {mode === 'measure' && (
          <div className="space-y-2">
            <p className="text-sm text-gray-600">
              Click two points to measure distance
            </p>
            {measurementPoints.start && !measurementPoints.end && (
              <p className="text-sm text-blue-600">Click second point...</p>
            )}
            {measurementPoints.start && measurementPoints.end && (
              <Button
                size="sm"
                onClick={handleMeasure}
                className="w-full">
                <Ruler className="w-4 h-4 mr-2" />
                Calculate Measurement
              </Button>
            )}
          </div>
        )}
      </div>

      <div className="flex gap-2">
        <Button variant="outline" size="sm" onClick={handleReset}>
          Reset
        </Button>
        <Button variant="outline" size="sm" onClick={onCancel}>
          <X className="w-4 h-4 mr-2" />
          Cancel
        </Button>
      </div>

      {canvas && (
        <div
          onClick={(e) => {
            if (canvas) {
              const rect = canvas.getBoundingClientRect();
              const x = e.clientX - rect.left;
              const y = e.clientY - rect.top;
              handleCanvasClick({clientX: e.clientX, clientY: e.clientY} as any);
            }
          }}
          className="absolute top-0 left-0 pointer-events-auto cursor-crosshair"
          style={{
            width: '100%',
            height: '100%',
            zIndex: 20,
          }}
        />
      )}
    </Card>
  );
}
