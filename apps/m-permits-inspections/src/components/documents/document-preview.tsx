// ============================================================
// DOCUMENT PREVIEW
// PDF preview using PDF.js
// ============================================================

'use client';

import { useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { X } from 'lucide-react';
import * as pdfjsLib from 'pdfjs-dist';

// Set worker path
if (typeof window !== 'undefined') {
  pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;
}

interface DocumentPreviewProps {
  url: string;
  onClose: () => void;
}

export function DocumentPreview({ url, onClose }: DocumentPreviewProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [pageNum, setPageNum] = useState(1);
  const [numPages, setNumPages] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!canvasRef.current) return;

    const loadPdf = async () => {
      try {
        setLoading(true);
        const pdf = await pdfjsLib.getDocument(url).promise;
        setNumPages(pdf.numPages);

        const page = await pdf.getPage(pageNum);
        const viewport = page.getViewport({ scale: 1.5 });
        const canvas = canvasRef.current;
        if (!canvas) return;

        canvas.height = viewport.height;
        canvas.width = viewport.width;

        const renderContext = {
          canvasContext: canvas.getContext('2d'),
          viewport: viewport,
        };

        await page.render(renderContext).promise;
        setLoading(false);
      } catch (error) {
        console.error('Error loading PDF:', error);
        setLoading(false);
      }
    };

    loadPdf();
  }, [url, pageNum]);

  return (
    <div className="fixed inset-0 z-50 bg-black bg-opacity-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between p-4 border-b">
          <div className="flex items-center gap-4">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPageNum(Math.max(1, pageNum - 1))}
              disabled={pageNum === 1}
            >
              Previous
            </Button>
            <span className="text-sm text-gray-600">
              Page {pageNum} of {numPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPageNum(Math.min(numPages, pageNum + 1))}
              disabled={pageNum === numPages}
            >
              Next
            </Button>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-5 w-5" />
          </Button>
        </div>
        <div className="flex-1 overflow-auto p-4 flex items-center justify-center">
          {loading ? (
            <div className="text-gray-500">Loading document...</div>
          ) : (
            <canvas ref={canvasRef} className="border border-gray-200" />
          )}
        </div>
      </div>
    </div>
  );
}
