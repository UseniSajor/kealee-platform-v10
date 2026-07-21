// ============================================================
// PDF VIEWER WITH FABRIC.JS MARKUP TOOLS
// ============================================================

'use client';

import { useEffect, useRef, useState } from 'react';
import { fabric } from 'fabric';
import { Document, Page, pdfjs } from 'react-pdf';
import 'react-pdf/dist/esm/Page/AnnotationLayer.css';
import 'react-pdf/dist/esm/Page/TextLayer.css';

// Configure PDF.js worker
pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.js`;

interface PDFViewerProps {
  documentUrl: string;
  selectedPage: number;
  onPageChange: (page: number) => void;
  activeTool: 'select' | 'highlight' | 'comment' | 'measure';
  reviewId: string;
}

export function PDFViewer({
  documentUrl,
  selectedPage,
  onPageChange,
  activeTool,
  reviewId,
}: PDFViewerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fabricCanvasRef = useRef<fabric.Canvas | null>(null);
  const [numPages, setNumPages] = useState<number>(0);
  const [pageScale, setPageScale] = useState(1.5);
  const [isDrawing, setIsDrawing] = useState(false);
  const [startPoint, setStartPoint] = useState<{ x: number; y: number } | null>(null);

  // Initialize Fabric.js canvas
  useEffect(() => {
    if (!canvasRef.current) return;

    const canvas = new fabric.Canvas(canvasRef.current, {
      width: 800,
      height: 1000,
      selection: activeTool === 'select',
    });

    fabricCanvasRef.current = canvas;

    // Load existing markups
    loadMarkups();

    return () => {
      canvas.dispose();
    };
  }, []);

  // Update canvas based on active tool
  useEffect(() => {
    if (!fabricCanvasRef.current) return;

    const canvas = fabricCanvasRef.current;
    canvas.selection = activeTool === 'select';
    canvas.defaultCursor = activeTool === 'select' ? 'default' : 'crosshair';

    // Remove existing event listeners
    canvas.off('mouse:down');
    canvas.off('mouse:move');
    canvas.off('mouse:up');

    if (activeTool === 'highlight') {
      canvas.on('mouse:down', (e) => {
        const pointer = canvas.getPointer(e.e);
        setStartPoint(pointer);
        setIsDrawing(true);
      });

      canvas.on('mouse:move', (e) => {
        if (!isDrawing || !startPoint) return;
        const pointer = canvas.getPointer(e.e);
        // Create highlight rectangle
        const rect = new fabric.Rect({
          left: Math.min(startPoint.x, pointer.x),
          top: Math.min(startPoint.y, pointer.y),
          width: Math.abs(pointer.x - startPoint.x),
          height: Math.abs(pointer.y - startPoint.y),
          fill: 'rgba(255, 255, 0, 0.3)',
          stroke: 'yellow',
          strokeWidth: 2,
          selectable: true,
        });
        canvas.remove(...canvas.getObjects().filter((obj: any) => obj.temp));
        rect.temp = true;
        canvas.add(rect);
        canvas.renderAll();
      });

      canvas.on('mouse:up', () => {
        if (!isDrawing || !startPoint) return;
        setIsDrawing(false);
        const objects = canvas.getObjects().filter((obj: any) => obj.temp);
        if (objects.length > 0) {
          objects.forEach((obj: any) => {
            obj.temp = false;
            saveMarkup(obj);
          });
        }
        setStartPoint(null);
      });
    } else if (activeTool === 'comment') {
      canvas.on('mouse:down', (e) => {
        const pointer = canvas.getPointer(e.e);
        createComment(pointer.x, pointer.y);
      });
    } else if (activeTool === 'measure') {
      canvas.on('mouse:down', (e) => {
        const pointer = canvas.getPointer(e.e);
        if (!startPoint) {
          setStartPoint(pointer);
        } else {
          createMeasurement(startPoint, pointer);
          setStartPoint(null);
        }
      });
    }
  }, [activeTool, isDrawing, startPoint]);

  const loadMarkups = async () => {
    try {
      const response = await fetch(`/api/reviews/${reviewId}/markups?page=${selectedPage}`);
      if (response.ok) {
        const markups = await response.json();
        if (fabricCanvasRef.current) {
          markups.forEach((markup: any) => {
            const obj = fabric.util.enlivenObjects([markup.data]);
            fabricCanvasRef.current?.add(...obj);
          });
        }
      }
    } catch (error) {
      console.error('Failed to load markups:', error);
    }
  };

  const saveMarkup = async (obj: fabric.Object) => {
    try {
      await fetch(`/api/reviews/${reviewId}/markups`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          page: selectedPage,
          type: obj.type,
          data: obj.toJSON(),
        }),
      });
    } catch (error) {
      console.error('Failed to save markup:', error);
    }
  };

  const createComment = (x: number, y: number) => {
    if (!fabricCanvasRef.current) return;

    const commentIcon = new fabric.Circle({
      left: x - 10,
      top: y - 10,
      radius: 10,
      fill: 'blue',
      stroke: 'darkblue',
      strokeWidth: 2,
    });

    fabricCanvasRef.current.add(commentIcon);
    saveMarkup(commentIcon);

    // Open comment dialog
    const commentText = prompt('Enter comment:');
    if (commentText) {
      // Save comment
      fetch(`/api/reviews/${reviewId}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          page: selectedPage,
          x,
          y,
          comment: commentText,
        }),
      });
    }
  };

  const createMeasurement = (
    start: { x: number; y: number },
    end: { x: number; y: number }
  ) => {
    if (!fabricCanvasRef.current) return;

    const distance = Math.sqrt(
      Math.pow(end.x - start.x, 2) + Math.pow(end.y - start.y, 2)
    );

    const line = new fabric.Line([start.x, start.y, end.x, end.y], {
      stroke: 'red',
      strokeWidth: 2,
    });

    const text = new fabric.Text(`${distance.toFixed(2)}`, {
      left: (start.x + end.x) / 2,
      top: (start.y + end.y) / 2 - 10,
      fontSize: 12,
      fill: 'red',
    });

    fabricCanvasRef.current.add(line, text);
    saveMarkup(line);
    saveMarkup(text);
  };

  const onDocumentLoadSuccess = ({ numPages }: { numPages: number }) => {
    setNumPages(numPages);
  };

  return (
    <div className="flex flex-col h-full bg-gray-100">
      {/* PDF Document */}
      <div className="flex-1 overflow-auto p-4">
        <div className="flex justify-center">
          <Document
            file={documentUrl}
            onLoadSuccess={onDocumentLoadSuccess}
            loading={<div>Loading PDF...</div>}
          >
            <div className="relative">
              <Page
                pageNumber={selectedPage}
                scale={pageScale}
                renderTextLayer={true}
                renderAnnotationLayer={true}
              />
              {/* Fabric.js Canvas Overlay */}
              <canvas
                ref={canvasRef}
                className="absolute top-0 left-0 pointer-events-auto"
                style={{
                  transform: `scale(${pageScale})`,
                  transformOrigin: 'top left',
                }}
              />
            </div>
          </Document>
        </div>
      </div>

      {/* Page Controls */}
      <div className="border-t bg-white p-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <button
            onClick={() => onPageChange(Math.max(1, selectedPage - 1))}
            disabled={selectedPage <= 1}
            className="px-3 py-1 border rounded disabled:opacity-50"
          >
            Previous
          </button>
          <span className="text-sm">
            Page {selectedPage} of {numPages}
          </span>
          <button
            onClick={() => onPageChange(Math.min(numPages, selectedPage + 1))}
            disabled={selectedPage >= numPages}
            className="px-3 py-1 border rounded disabled:opacity-50"
          >
            Next
          </button>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setPageScale(Math.max(0.5, pageScale - 0.25))}
            className="px-3 py-1 border rounded"
          >
            Zoom Out
          </button>
          <span className="text-sm">{Math.round(pageScale * 100)}%</span>
          <button
            onClick={() => setPageScale(Math.min(3, pageScale + 0.25))}
            className="px-3 py-1 border rounded"
          >
            Zoom In
          </button>
        </div>
      </div>
    </div>
  );
}
