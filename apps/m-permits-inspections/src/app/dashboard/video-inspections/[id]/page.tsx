'use client';

import React, {useState, useEffect} from 'react';
import {useParams} from 'next/navigation';
import {VideoConference} from '@/components/video-inspection/video-conference';
import {GuidedInspection} from '@/components/video-inspection/guided-inspection';
import {AIAnalysisOverlay} from '@/components/video-inspection/ai-analysis-overlay';
import {VideoInspection, VideoAIAnalysis} from '@/types/video-inspection';
import {postProcessingService} from '@/services/video-inspection/post-processing';

export default function VideoInspectionPage() {
  const params = useParams();
  const inspectionId = params.id as string;

  const [inspection, setInspection] = useState<VideoInspection | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showGuidedInspection, setShowGuidedInspection] = useState(false);
  const [aiAnalysisEnabled, setAiAnalysisEnabled] = useState(true);
  const [currentAnalysis, setCurrentAnalysis] = useState<Partial<VideoAIAnalysis>>({});
  const [videoElement, setVideoElement] = useState<HTMLVideoElement | null>(null);

  useEffect(() => {
    loadInspection();
  }, [inspectionId]);

  const loadInspection = async () => {
    try {
      const response = await fetch(`/api/video-inspections/${inspectionId}`);
      if (!response.ok) throw new Error('Failed to load inspection');
      const data = await response.json();
      setInspection(data);
    } catch (error) {
      console.error('Error loading inspection:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleItemComplete = async (
    itemId: string,
    timestamp: number,
    screenshotUrl?: string,
  ) => {
    if (!inspection) return;

    const updatedChecklist = inspection.checklist.map((item) =>
      item.id === itemId
        ? {
            ...item,
            status: 'completed' as const,
            timestamp,
            screenshotUrl,
            completedAt: new Date(),
          }
        : item,
    );

    setInspection({...inspection, checklist: updatedChecklist});

    // Save to server
    await fetch(`/api/video-inspections/${inspectionId}/checklist/${itemId}`, {
      method: 'PUT',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify({status: 'completed', timestamp, screenshotUrl}),
    });
  };

  const handleItemSkip = async (itemId: string) => {
    if (!inspection) return;

    const updatedChecklist = inspection.checklist.map((item) =>
      item.id === itemId ? {...item, status: 'skipped' as const} : item,
    );

    setInspection({...inspection, checklist: updatedChecklist});

    await fetch(`/api/video-inspections/${inspectionId}/checklist/${itemId}`, {
      method: 'PUT',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify({status: 'skipped'}),
    });
  };

  const handleAnalysisUpdate = (analysis: Partial<VideoAIAnalysis>) => {
    setCurrentAnalysis(analysis);

    // Update inspection with AI analysis
    if (inspection) {
      setInspection({
        ...inspection,
        aiAnalysis: {
          ...inspection.aiAnalysis,
          ...analysis,
        } as VideoAIAnalysis,
      });
    }
  };

  const handleEndCall = async () => {
    if (!inspection) return;

    // Generate AI report
    if (inspection.aiAnalysis) {
      const report = await postProcessingService.generateAIReport(
        inspection,
        inspection.aiAnalysis,
      );

      // Save report
      await fetch(`/api/video-inspections/${inspectionId}/report`, {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify(report),
      });

      // Navigate to report review
      window.location.href = `/dashboard/video-inspections/${inspectionId}/report`;
    } else {
      // Navigate to inspection list
      window.location.href = '/dashboard/inspections';
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4" />
          <p className="text-gray-500">Loading inspection...</p>
        </div>
      </div>
    );
  }

  if (!inspection) {
    return (
      <div className="flex items-center justify-center h-screen">
        <p className="text-red-500">Inspection not found</p>
      </div>
    );
  }

  return (
    <div className="relative h-screen">
      {/* Video Conference */}
      <VideoConference
        inspection={inspection}
        currentUserId="current-user-id" // Get from auth
        onEndCall={handleEndCall}
        onParticipantUpdate={(participants) => {
          setInspection({...inspection, participants});
        }}
      />

      {/* AI Analysis Overlay */}
      {aiAnalysisEnabled && (
        <AIAnalysisOverlay
          videoElement={videoElement}
          enabled={aiAnalysisEnabled}
          onAnalysisUpdate={handleAnalysisUpdate}
        />
      )}

      {/* Guided Inspection Sidebar */}
      {showGuidedInspection && (
        <div className="absolute top-0 right-0 w-96 h-full bg-white shadow-lg z-30">
          <GuidedInspection
            checklist={inspection.checklist}
            videoElement={videoElement}
            onItemComplete={handleItemComplete}
            onItemSkip={handleItemSkip}
          />
        </div>
      )}

      {/* Toggle Buttons */}
      <div className="absolute bottom-20 left-4 z-30 flex flex-col gap-2">
        <button
          onClick={() => setShowGuidedInspection(!showGuidedInspection)}
          className="bg-white px-4 py-2 rounded-lg shadow-lg hover:bg-gray-50">
          {showGuidedInspection ? 'Hide' : 'Show'} Checklist
        </button>
        <button
          onClick={() => setAiAnalysisEnabled(!aiAnalysisEnabled)}
          className="bg-white px-4 py-2 rounded-lg shadow-lg hover:bg-gray-50">
          {aiAnalysisEnabled ? 'Disable' : 'Enable'} AI Analysis
        </button>
      </div>
    </div>
  );
}
