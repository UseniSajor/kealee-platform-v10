// ============================================================
// REVIEW INTERFACE - AI-Assisted Review with PDF Markup
// ============================================================

'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { PDFViewer } from '@/components/reviews/pdf-viewer';
import { AIFindingsSidebar } from '@/components/reviews/ai-findings-sidebar';
import { CommentLibrary } from '@/components/reviews/comment-library';
import { MultiDisciplineView } from '@/components/reviews/multi-discipline-view';
import { ReviewToolbar } from '@/components/reviews/review-toolbar';
import { ReviewComments } from '@/components/reviews/review-comments';

export default function ReviewPage() {
  const params = useParams();
  const reviewId = params.id as string;
  const [selectedPage, setSelectedPage] = useState(1);
  const [activeTool, setActiveTool] = useState<'select' | 'highlight' | 'comment' | 'measure'>('select');

  // Fetch review data
  const { data: review, isLoading } = useQuery({
    queryKey: ['review', reviewId],
    queryFn: async () => {
      const response = await fetch(`/api/reviews/${reviewId}`);
      if (!response.ok) throw new Error('Failed to fetch review');
      return response.json();
    },
  });

  // Fetch AI findings
  const { data: aiFindings } = useQuery({
    queryKey: ['review-ai-findings', reviewId],
    queryFn: async () => {
      const response = await fetch(`/api/reviews/${reviewId}/ai-findings`);
      if (!response.ok) throw new Error('Failed to fetch AI findings');
      return response.json();
    },
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading review...</p>
        </div>
      </div>
    );
  }

  if (!review) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <p className="text-lg font-semibold">Review not found</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-[calc(100vh-4rem)]">
      {/* Main Review Area */}
      <div className="flex-1 flex flex-col">
        {/* Toolbar */}
        <ReviewToolbar
          review={review}
          activeTool={activeTool}
          onToolChange={setActiveTool}
          selectedPage={selectedPage}
          onPageChange={setSelectedPage}
        />

        {/* PDF Viewer */}
        <div className="flex-1 overflow-hidden">
          <PDFViewer
            documentUrl={review.permit.documents[0]?.url}
            selectedPage={selectedPage}
            onPageChange={setSelectedPage}
            activeTool={activeTool}
            reviewId={reviewId}
          />
        </div>
      </div>

      {/* Sidebar */}
      <div className="w-96 border-l bg-background overflow-y-auto">
        <Tabs defaultValue="findings" className="h-full">
          <TabsList className="w-full rounded-none border-b">
            <TabsTrigger value="findings" className="flex-1">
              AI Findings
            </TabsTrigger>
            <TabsTrigger value="comments" className="flex-1">
              Comments
            </TabsTrigger>
            <TabsTrigger value="library" className="flex-1">
              Library
            </TabsTrigger>
            <TabsTrigger value="coordination" className="flex-1">
              Coordination
            </TabsTrigger>
          </TabsList>

          <TabsContent value="findings" className="m-0 h-[calc(100%-3rem)] overflow-y-auto">
            <AIFindingsSidebar
              findings={aiFindings}
              reviewId={reviewId}
              onApproveFinding={(findingId) => {
                // Handle one-click approval
                fetch(`/api/reviews/${reviewId}/findings/${findingId}/approve`, {
                  method: 'POST',
                });
              }}
            />
          </TabsContent>

          <TabsContent value="comments" className="m-0 h-[calc(100%-3rem)] overflow-y-auto">
            <ReviewComments reviewId={reviewId} />
          </TabsContent>

          <TabsContent value="library" className="m-0 h-[calc(100%-3rem)] overflow-y-auto">
            <CommentLibrary
              jurisdictionId={review.permit.jurisdictionId}
              discipline={review.discipline}
              onSelectComment={(comment) => {
                // Add comment to PDF
                console.log('Selected comment:', comment);
              }}
            />
          </TabsContent>

          <TabsContent value="coordination" className="m-0 h-[calc(100%-3rem)] overflow-y-auto">
            <MultiDisciplineView
              permitId={review.permitId}
              currentDiscipline={review.discipline}
            />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
