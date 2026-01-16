'use client';

import React, {useEffect, useState} from 'react';
import {Card} from '@/components/ui/card';
import {Badge} from '@/components/ui/badge';
import {AlertTriangle, CheckCircle2, Ruler, Package, AlertCircle} from 'lucide-react';
import {
  VideoAIAnalysis,
  ObjectDetection,
  DefectDetection,
  MaterialRecognition,
} from '@/types/video-inspection';
import {aiVideoAnalysisService} from '@/services/video-inspection/ai-video-analysis';

interface AIAnalysisOverlayProps {
  videoElement: HTMLVideoElement | null;
  enabled: boolean;
  onAnalysisUpdate: (analysis: Partial<VideoAIAnalysis>) => void;
}

export function AIAnalysisOverlay({
  videoElement,
  enabled,
  onAnalysisUpdate,
}: AIAnalysisOverlayProps) {
  const [currentAnalysis, setCurrentAnalysis] = useState<Partial<VideoAIAnalysis>>({});
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  useEffect(() => {
    if (!enabled || !videoElement) return;

    // Initialize AI models
    aiVideoAnalysisService.initialize();

    // Analyze video frames periodically
    const interval = setInterval(() => {
      analyzeCurrentFrame();
    }, 2000); // Analyze every 2 seconds

    return () => {
      clearInterval(interval);
    };
  }, [enabled, videoElement]);

  const analyzeCurrentFrame = async () => {
    if (!videoElement || isAnalyzing) return;

    setIsAnalyzing(true);
    try {
      const analysis = await aiVideoAnalysisService.analyzeVideoFrame(videoElement, {
        detectObjects: true,
        detectDefects: true,
        recognizeMaterials: true,
      });

      setCurrentAnalysis(analysis);
      onAnalysisUpdate(analysis);
    } catch (error) {
      console.error('Error analyzing frame:', error);
    } finally {
      setIsAnalyzing(false);
    }
  };

  if (!enabled) return null;

  return (
    <div className="absolute top-4 right-4 z-20 max-w-sm">
      <Card className="p-4 bg-white/95 backdrop-blur">
        <div className="mb-3">
          <h4 className="font-semibold text-sm mb-2">AI Analysis</h4>
          {isAnalyzing && (
            <Badge variant="outline" className="text-xs">
              Analyzing...
            </Badge>
          )}
        </div>

        {/* Object Detections */}
        {currentAnalysis.objectDetections && currentAnalysis.objectDetections.length > 0 && (
          <div className="mb-3">
            <div className="flex items-center gap-2 mb-1">
              <Package className="w-4 h-4 text-blue-500" />
              <span className="text-xs font-medium">Objects Detected</span>
            </div>
            <div className="space-y-1">
              {currentAnalysis.objectDetections.slice(0, 3).map((detection) => (
                <div key={detection.id} className="text-xs text-gray-600">
                  {detection.objectType} ({Math.round(detection.confidence * 100)}%)
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Defects */}
        {currentAnalysis.defects && currentAnalysis.defects.length > 0 && (
          <div className="mb-3">
            <div className="flex items-center gap-2 mb-1">
              <AlertTriangle className="w-4 h-4 text-red-500" />
              <span className="text-xs font-medium">Defects</span>
            </div>
            <div className="space-y-1">
              {currentAnalysis.defects.map((defect) => (
                <div
                  key={defect.id}
                  className={`text-xs p-1 rounded ${
                    defect.severity === 'critical'
                      ? 'bg-red-100 text-red-700'
                      : defect.severity === 'major'
                        ? 'bg-orange-100 text-orange-700'
                        : 'bg-yellow-100 text-yellow-700'
                  }`}>
                  {defect.defectType}: {defect.description}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Materials */}
        {currentAnalysis.materialRecognitions &&
          currentAnalysis.materialRecognitions.length > 0 && (
            <div className="mb-3">
              <div className="flex items-center gap-2 mb-1">
                <Ruler className="w-4 h-4 text-green-500" />
                <span className="text-xs font-medium">Materials</span>
              </div>
              <div className="space-y-1">
                {currentAnalysis.materialRecognitions.map((material) => (
                  <div key={material.id} className="text-xs text-gray-600">
                    {material.materialType} ({Math.round(material.confidence * 100)}%)
                  </div>
                ))}
              </div>
            </div>
          )}

        {/* Code Compliance */}
        {currentAnalysis.codeCompliance && currentAnalysis.codeCompliance.length > 0 && (
          <div>
            <div className="flex items-center gap-2 mb-1">
              <CheckCircle2 className="w-4 h-4 text-green-500" />
              <span className="text-xs font-medium">Compliance</span>
            </div>
            <div className="space-y-1">
              {currentAnalysis.codeCompliance.map((check) => (
                <div
                  key={check.id}
                  className={`text-xs flex items-center gap-1 ${
                    check.compliant ? 'text-green-700' : 'text-red-700'
                  }`}>
                  {check.compliant ? (
                    <CheckCircle2 className="w-3 h-3" />
                  ) : (
                    <AlertCircle className="w-3 h-3" />
                  )}
                  {check.codeReference}: {check.compliant ? 'Compliant' : 'Non-compliant'}
                </div>
              ))}
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}
