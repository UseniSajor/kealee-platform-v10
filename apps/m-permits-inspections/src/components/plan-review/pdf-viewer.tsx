/**
 * PDF Viewer Component
 * Professional plan review interface with markup tools
 */

'use client';

import {useState, useRef, useEffect} from 'react';
import {Card, CardContent, CardHeader, CardTitle} from '@/components/ui/card';
import {Button} from '@/components/ui/button';
import {Select, SelectContent, SelectItem, SelectTrigger, SelectValue} from '@/components/ui/select';
import {Badge} from '@/components/ui/badge';
import {
  ArrowRight,
  Square,
  Circle,
  Minus,
  Type,
  Highlighter,
  CheckCircle,
  Ruler,
  Layers,
  Eye,
  EyeOff,
} from 'lucide-react';
import {pdfMarkupService, MarkupAnnotation} from '@/services/plan-review/pdf-markup';
import {commentLibraryService} from '@/services/plan-review/comment-library';
import {markupPaletteService} from '@/services/plan-review/markup-palette';
import {measurementToolsService} from '@/services/plan-review/measurement-tools';

interface PDFViewerProps {
  reviewId: string;
  documentId: string;
  documentUrl: string;
  discipline: string;
}

export function PDFViewer({reviewId, documentId, documentUrl, discipline}: PDFViewerProps) {
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [selectedTool, setSelectedTool] = useState<string>('arrow');
  const [selectedColor, setSelectedColor] = useState('#FF0000');
  const [selectedSeverity, setSelectedSeverity] = useState<'MINOR' | 'MAJOR' | 'CRITICAL'>('MAJOR');
  const [annotations, setAnnotations] = useState<MarkupAnnotation[]>([]);
  const [showCommentLibrary, setShowCommentLibrary] = useState(false);
  const [isDrawing, setIsDrawing] = useState(false);
  const [drawStart, setDrawStart] = useState<{x: number; y: number} | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const palette = markupPaletteService.getPalette(discipline);
  const comments = commentLibraryService.getComments(discipline);

  // Load annotations
  useEffect(() => {
    loadAnnotations();
  }, [reviewId, documentId]);

  const loadAnnotations = async () => {
    const loaded = await pdfMarkupService.getAnnotationsByPage(
      reviewId,
      documentId,
      currentPage
    );
    setAnnotations(loaded);
  };

  // Handle canvas drawing
  const handleCanvasMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!canvasRef.current) return;

    const rect = canvasRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    setIsDrawing(true);
    setDrawStart({x, y});
  };

  const handleCanvasMouseUp = async (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!canvasRef.current || !drawStart || !isDrawing) return;

    const rect = canvasRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    // Create annotation
    const annotation = await pdfMarkupService.createAnnotation(reviewId, documentId, {
      reviewId,
      documentId,
      pageNumber: currentPage,
      tool: {
        id: selectedTool,
        type: selectedTool as any,
        color: selectedColor,
        strokeWidth: 2,
        opacity: 0.8,
      },
      coordinates: {
        x: drawStart.x,
        y: drawStart.y,
        width: x - drawStart.x,
        height: y - drawStart.y,
      },
      severity: selectedSeverity,
      createdBy: 'current-user-id', // Get from auth
    });

    setAnnotations([...annotations, annotation]);
    setIsDrawing(false);
    setDrawStart(null);
  };

  const handleAddComment = async (commentId: string) => {
    const comment = commentLibraryService.getComment(commentId);
    if (!comment) return;

    // Add comment as annotation
    // In production, would prompt for variables
    const annotation = await pdfMarkupService.createAnnotation(reviewId, documentId, {
      reviewId,
      documentId,
      pageNumber: currentPage,
      tool: {
        id: 'text',
        type: 'text',
        color: '#000000',
        strokeWidth: 1,
        opacity: 1,
      },
      coordinates: {x: 100, y: 100},
      comment: comment.comment,
      codeReference: comment.codeSection,
      severity: comment.severity,
      createdBy: 'current-user-id',
    });

    setAnnotations([...annotations, annotation]);
    setShowCommentLibrary(false);
  };

  return (
    <div className="flex h-screen">
      {/* Toolbar */}
      <div className="w-64 border-r bg-gray-50 p-4 space-y-4 overflow-y-auto">
        <div>
          <h3 className="font-semibold mb-2">Markup Tools</h3>
          <div className="grid grid-cols-2 gap-2">
            {palette.tools.map((tool) => (
              <Button
                key={tool.type}
                variant={selectedTool === tool.type ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedTool(tool.type)}
                className="flex flex-col items-center gap-1 h-auto py-2"
              >
                <span className="text-lg">{tool.icon}</span>
                <span className="text-xs">{tool.name}</span>
              </Button>
            ))}
          </div>
        </div>

        <div>
          <h3 className="font-semibold mb-2">Colors</h3>
          <div className="grid grid-cols-4 gap-2">
            {palette.colors.map((color) => (
              <button
                key={color}
                className={`w-8 h-8 rounded border-2 ${
                  selectedColor === color ? 'border-gray-900' : 'border-gray-300'
                }`}
                style={{backgroundColor: color}}
                onClick={() => setSelectedColor(color)}
              />
            ))}
          </div>
        </div>

        <div>
          <h3 className="font-semibold mb-2">Severity</h3>
          <Select value={selectedSeverity} onValueChange={(v: any) => setSelectedSeverity(v)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="MINOR">
                <Badge className="bg-yellow-500">Minor</Badge>
              </SelectItem>
              <SelectItem value="MAJOR">
                <Badge className="bg-orange-500">Major</Badge>
              </SelectItem>
              <SelectItem value="CRITICAL">
                <Badge className="bg-red-500">Critical</Badge>
              </SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <Button
            variant="outline"
            className="w-full"
            onClick={() => setShowCommentLibrary(!showCommentLibrary)}
          >
            {showCommentLibrary ? <EyeOff className="w-4 h-4 mr-2" /> : <Eye className="w-4 h-4 mr-2" />}
            Comment Library
          </Button>
        </div>

        {showCommentLibrary && (
          <div className="border rounded p-2 max-h-64 overflow-y-auto">
            <div className="space-y-1">
              {comments.slice(0, 10).map((comment) => (
                <button
                  key={comment.id}
                  className="w-full text-left p-2 text-sm hover:bg-gray-100 rounded"
                  onClick={() => handleAddComment(comment.id)}
                >
                  <div className="font-medium">{comment.title}</div>
                  <div className="text-xs text-gray-500">{comment.codeSection}</div>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* PDF Viewer */}
      <div className="flex-1 flex flex-col">
        {/* PDF Controls */}
        <div className="border-b p-2 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
              disabled={currentPage === 1}
            >
              Previous
            </Button>
            <span className="text-sm">
              Page {currentPage} of {totalPages || '?'}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(Math.min(totalPages || 1, currentPage + 1))}
              disabled={currentPage >= (totalPages || 1)}
            >
              Next
            </Button>
          </div>

          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm">
              <Ruler className="w-4 h-4 mr-2" />
              Measure
            </Button>
            <Button variant="outline" size="sm">
              <Layers className="w-4 h-4 mr-2" />
              Compare
            </Button>
          </div>
        </div>

        {/* PDF Canvas */}
        <div ref={containerRef} className="flex-1 overflow-auto bg-gray-100 p-4">
          <div className="relative inline-block">
            <img
              src={documentUrl}
              alt={`Page ${currentPage}`}
              className="max-w-full h-auto shadow-lg"
            />
            <canvas
              ref={canvasRef}
              className="absolute top-0 left-0 cursor-crosshair"
              style={{
                width: '100%',
                height: '100%',
              }}
              onMouseDown={handleCanvasMouseDown}
              onMouseUp={handleCanvasMouseUp}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
