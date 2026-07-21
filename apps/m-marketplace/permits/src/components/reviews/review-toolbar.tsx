// ============================================================
// REVIEW TOOLBAR - Tool selection and page navigation
// ============================================================

'use client';

import { Button } from '@permits/src/components/ui/button';
import { Badge } from '@permits/src/components/ui/badge';
import { 
  MousePointer2, 
  Highlighter, 
  MessageSquare, 
  Ruler,
  ChevronLeft,
  ChevronRight,
  ZoomIn,
  ZoomOut,
  Save,
  CheckCircle,
  X
} from 'lucide-react';

interface ReviewToolbarProps {
  review: any;
  activeTool: 'select' | 'highlight' | 'comment' | 'measure';
  onToolChange: (tool: 'select' | 'highlight' | 'comment' | 'measure') => void;
  selectedPage: number;
  onPageChange: (page: number) => void;
}

export function ReviewToolbar({
  review,
  activeTool,
  onToolChange,
  selectedPage,
  onPageChange,
}: ReviewToolbarProps) {
  const tools = [
    { id: 'select' as const, icon: MousePointer2, label: 'Select' },
    { id: 'highlight' as const, icon: Highlighter, label: 'Highlight' },
    { id: 'comment' as const, icon: MessageSquare, label: 'Comment' },
    { id: 'measure' as const, icon: Ruler, label: 'Measure' },
  ];

  const handleSave = async () => {
    // Save all markups and comments
    await fetch(`/api/reviews/${review.id}/save`, {
      method: 'POST',
    });
  };

  const handleApprove = async () => {
    await fetch(`/api/reviews/${review.id}/approve`, {
      method: 'POST',
    });
  };

  const handleReject = async () => {
    await fetch(`/api/reviews/${review.id}/reject`, {
      method: 'POST',
    });
  };

  return (
    <div className="border-b bg-white p-4 flex items-center justify-between">
      {/* Left: Tools */}
      <div className="flex items-center gap-2">
        <div className="flex items-center gap-1 border-r pr-4 mr-4">
          {tools.map((tool) => {
            const Icon = tool.icon;
            return (
              <Button
                key={tool.id}
                variant={activeTool === tool.id ? 'default' : 'outline'}
                size="sm"
                onClick={() => onToolChange(tool.id)}
                className="gap-2"
              >
                <Icon className="w-4 h-4" />
                {tool.label}
              </Button>
            );
          })}
        </div>

        {/* Page Navigation */}
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onPageChange(Math.max(1, selectedPage - 1))}
            disabled={selectedPage <= 1}
          >
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <span className="text-sm font-medium min-w-[80px] text-center">
            Page {selectedPage}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onPageChange(selectedPage + 1)}
          >
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Right: Actions */}
      <div className="flex items-center gap-2">
        <Button variant="outline" size="sm" onClick={handleSave}>
          <Save className="w-4 h-4 mr-2" />
          Save
        </Button>
        <Button variant="outline" size="sm" onClick={handleReject}>
          <X className="w-4 h-4 mr-2" />
          Request Corrections
        </Button>
        <Button size="sm" onClick={handleApprove}>
          <CheckCircle className="w-4 h-4 mr-2" />
          Approve
        </Button>
      </div>
    </div>
  );
}
