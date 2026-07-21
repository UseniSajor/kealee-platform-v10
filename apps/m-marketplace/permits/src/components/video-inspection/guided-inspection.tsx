'use client';

import React, {useState, useRef, useEffect} from 'react';
import {Card} from '@permits/src/components/ui/card';
import {Button} from '@permits/src/components/ui/button';
import {Progress} from '@permits/src/components/ui/progress';
import {CheckCircle2, Circle, Camera, ArrowRight, ArrowLeft} from 'lucide-react';
import {VideoInspectionChecklistItem, ARMarker} from '@permits/src/types/video-inspection';
import {aiVideoAnalysisService} from '@permits/src/services/video-inspection/ai-video-analysis';

interface GuidedInspectionProps {
  checklist: VideoInspectionChecklistItem[];
  videoElement: HTMLVideoElement | null;
  onItemComplete: (itemId: string, timestamp: number, screenshotUrl?: string) => void;
  onItemSkip: (itemId: string) => void;
}

export function GuidedInspection({
  checklist,
  videoElement,
  onItemComplete,
  onItemSkip,
}: GuidedInspectionProps) {
  const [currentItemIndex, setCurrentItemIndex] = useState(0);
  const [currentItem, setCurrentItem] = useState<VideoInspectionChecklistItem | null>(
    checklist[0] || null,
  );
  const [arMarkers, setArMarkers] = useState<ARMarker[]>([]);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (currentItem) {
      // Generate AR markers for current item
      generateARMarkers(currentItem);
    }
  }, [currentItem]);

  useEffect(() => {
    if (videoElement && canvasRef.current) {
      drawAROverlay();
    }
  }, [videoElement, arMarkers]);

  const generateARMarkers = (item: VideoInspectionChecklistItem) => {
    // Generate markers based on checklist item requirements
    const markers: ARMarker[] = [
      {
        id: `marker-${item.id}`,
        checklistItemId: item.id,
        position: {x: 0.5, y: 0.3, overlay: 'center'},
        instruction: `Position camera to view: ${item.description}`,
        required: item.required,
      },
    ];
    setARMarkers(markers);
  };

  const drawAROverlay = () => {
    if (!canvasRef.current || !videoElement) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = videoElement.videoWidth || 1280;
    canvas.height = videoElement.videoHeight || 720;

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw AR markers
    arMarkers.forEach((marker) => {
      const x = marker.position.x * canvas.width;
      const y = marker.position.y * canvas.height;

      // Draw target circle
      ctx.strokeStyle = marker.required ? '#ef4444' : '#f59e0b';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(x, y, 50, 0, Math.PI * 2);
      ctx.stroke();

      // Draw instruction text
      ctx.fillStyle = '#fff';
      ctx.font = '16px Arial';
      ctx.textAlign = 'center';
      ctx.fillText(marker.instruction, x, y - 60);
    });
  };

  const captureScreenshot = (): string | null => {
    if (!videoElement || !canvasRef.current) return null;

    const canvas = document.createElement('canvas');
    canvas.width = videoElement.videoWidth;
    canvas.height = videoElement.videoHeight;
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;

    ctx.drawImage(videoElement, 0, 0);
    return canvas.toDataURL('image/jpeg', 0.8);
  };

  const handleComplete = async () => {
    if (!currentItem || !videoElement) return;

    const timestamp = videoElement.currentTime;
    const screenshotUrl = captureScreenshot();

    // Run AI analysis on current frame
    try {
      const analysis = await aiVideoAnalysisService.analyzeVideoFrame(videoElement, {
        detectObjects: true,
        detectDefects: true,
        recognizeMaterials: true,
      });

      // Store AI findings
      const aiFindings = [
        ...(analysis.defects?.map((d) => ({
          id: d.id,
          type: 'defect_detection' as const,
          confidence: d.confidence,
          description: d.description,
          timestamp: d.timestamp,
          severity: d.severity,
        })) || []),
      ];

      onItemComplete(currentItem.id, timestamp, screenshotUrl || undefined);
    } catch (error) {
      console.error('Error analyzing frame:', error);
      onItemComplete(currentItem.id, timestamp, screenshotUrl || undefined);
    }
  };

  const handleSkip = () => {
    if (!currentItem) return;
    onItemSkip(currentItem.id);
    nextItem();
  };

  const nextItem = () => {
    if (currentItemIndex < checklist.length - 1) {
      const nextIndex = currentItemIndex + 1;
      setCurrentItemIndex(nextIndex);
      setCurrentItem(checklist[nextIndex]);
    }
  };

  const previousItem = () => {
    if (currentItemIndex > 0) {
      const prevIndex = currentItemIndex - 1;
      setCurrentItemIndex(prevIndex);
      setCurrentItem(checklist[prevIndex]);
    }
  };

  const progress = ((currentItemIndex + 1) / checklist.length) * 100;
  const completedCount = checklist.filter((item) => item.status === 'completed').length;

  return (
    <div className="flex flex-col h-full">
      {/* Progress Bar */}
      <div className="p-4 bg-white border-b">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium">
            Item {currentItemIndex + 1} of {checklist.length}
          </span>
          <span className="text-sm text-gray-500">
            {completedCount} completed
          </span>
        </div>
        <Progress value={progress} className="h-2" />
      </div>

      {/* Current Item */}
      {currentItem && (
        <Card className="m-4 p-6">
          <div className="mb-4">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xs font-semibold text-gray-500 uppercase">
                {currentItem.category}
              </span>
              {currentItem.required && (
                <span className="text-xs bg-red-100 text-red-700 px-2 py-1 rounded">
                  Required
                </span>
              )}
            </div>
            <h3 className="text-lg font-semibold">{currentItem.description}</h3>
          </div>

          {/* AR Instructions */}
          {arMarkers.length > 0 && (
            <div className="mb-4 p-3 bg-blue-50 rounded-lg">
              <p className="text-sm text-blue-900">
                {arMarkers[0].instruction}
              </p>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-2">
            <Button onClick={handleComplete} className="flex-1">
              <CheckCircle2 className="w-4 h-4 mr-2" />
              Mark Complete
            </Button>
            <Button variant="outline" onClick={handleSkip}>
              Skip
            </Button>
            <Button variant="outline" onClick={captureScreenshot}>
              <Camera className="w-4 h-4" />
            </Button>
          </div>
        </Card>
      )}

      {/* Navigation */}
      <div className="flex items-center justify-between p-4 bg-white border-t mt-auto">
        <Button
          variant="outline"
          onClick={previousItem}
          disabled={currentItemIndex === 0}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Previous
        </Button>

        <div className="flex gap-1">
          {checklist.map((item, index) => (
            <div
              key={item.id}
              className={`w-2 h-2 rounded-full ${
                index === currentItemIndex
                  ? 'bg-blue-500'
                  : item.status === 'completed'
                    ? 'bg-green-500'
                    : 'bg-gray-300'
              }`}
            />
          ))}
        </div>

        <Button
          variant="outline"
          onClick={nextItem}
          disabled={currentItemIndex === checklist.length - 1}>
          Next
          <ArrowRight className="w-4 h-4 ml-2" />
        </Button>
      </div>

      {/* AR Overlay Canvas (positioned over video) */}
      <canvas
        ref={canvasRef}
        className="absolute pointer-events-none"
        style={{
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          zIndex: 10,
        }}
      />
    </div>
  );
}
