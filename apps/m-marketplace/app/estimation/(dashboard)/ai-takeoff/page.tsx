'use client';

import { useState, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from '@estimation/components/ui/button';
import { Badge } from '@estimation/components/ui/badge';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@estimation/components/ui/card';
import { Input } from '@estimation/components/ui/input';
import { Label } from '@estimation/components/ui/label';
import { cn } from '@estimation/lib/utils';
import { apiClient } from '@estimation/lib/api';
import {
  ArrowLeft,
  Brain,
  CheckCircle2,
  FileText,
  Image,
  Loader2,
  Upload,
  Wand2,
  X,
  AlertTriangle,
  Download,
} from 'lucide-react';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type ProcessingStatus = 'idle' | 'uploading' | 'processing' | 'complete' | 'error';
type DetailLevel = 'QUICK' | 'STANDARD' | 'DETAILED';

interface UploadedFile {
  id: string;
  file: File;
  name: string;
  type: string;
  size: number;
  discipline: string;
  status: 'pending' | 'uploading' | 'processing' | 'done' | 'error';
}

interface ExtractedItem {
  id: string;
  category: string;
  description: string;
  quantity: number;
  unit: string;
  confidence: number;
  source: string;
  floor?: string;
  drawingRef?: string;
}

interface TakeoffResult {
  totalItems: number;
  averageConfidence: number;
  items: ExtractedItem[];
  byCategory: Record<string, { count: number }>;
  processingTime: number;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const DISCIPLINE_OPTIONS = [
  { value: 'ARCHITECTURAL', label: 'Architectural' },
  { value: 'STRUCTURAL', label: 'Structural' },
  { value: 'MECHANICAL', label: 'Mechanical/HVAC' },
  { value: 'ELECTRICAL', label: 'Electrical' },
  { value: 'PLUMBING', label: 'Plumbing' },
  { value: 'CIVIL', label: 'Civil/Site' },
];

const CONFIDENCE_COLORS: Record<string, string> = {
  high: 'text-green-600 bg-green-50',
  medium: 'text-yellow-600 bg-yellow-50',
  low: 'text-red-600 bg-red-50',
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function getConfidenceLevel(conf: number): string {
  if (conf >= 80) return 'high';
  if (conf >= 60) return 'medium';
  return 'low';
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
}

function getFileType(file: File): string {
  const name = file.name.toLowerCase();
  if (name.endsWith('.pdf')) return 'PDF';
  if (name.endsWith('.dwg') || name.endsWith('.dxf')) return 'CAD';
  if (name.endsWith('.jpg') || name.endsWith('.jpeg')) return 'JPG';
  if (name.endsWith('.png')) return 'PNG';
  if (name.endsWith('.tiff') || name.endsWith('.tif')) return 'TIFF';
  return 'FILE';
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function AITakeoffPage() {
  const router = useRouter();
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [detailLevel, setDetailLevel] = useState<DetailLevel>('STANDARD');
  const [autoLink, setAutoLink] = useState(true);
  const [status, setStatus] = useState<ProcessingStatus>('idle');
  const [result, setResult] = useState<TakeoffResult | null>(null);
  const [projectName, setProjectName] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // ---- File handling ----

  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const incoming = Array.from(e.target.files || []);
    const newFiles: UploadedFile[] = incoming.map((f) => ({
      id: Math.random().toString(36).substr(2, 9),
      file: f,
      name: f.name,
      type: getFileType(f),
      size: f.size,
      discipline: 'ARCHITECTURAL',
      status: 'pending' as const,
    }));
    setFiles((prev) => [...prev, ...newFiles]);
    // Reset input so re-selecting the same file works
    if (fileInputRef.current) fileInputRef.current.value = '';
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    const incoming = Array.from(e.dataTransfer.files);
    const newFiles: UploadedFile[] = incoming.map((f) => ({
      id: Math.random().toString(36).substr(2, 9),
      file: f,
      name: f.name,
      type: getFileType(f),
      size: f.size,
      discipline: 'ARCHITECTURAL',
      status: 'pending' as const,
    }));
    setFiles((prev) => [...prev, ...newFiles]);
  }

  function removeFile(id: string) {
    setFiles((prev) => prev.filter((f) => f.id !== id));
  }

  function updateDiscipline(id: string, discipline: string) {
    setFiles((prev) => prev.map((f) => (f.id === id ? { ...f, discipline } : f)));
  }

  // ---- AI Takeoff execution ----

  async function runAITakeoff() {
    if (files.length === 0) return;

    setStatus('uploading');
    setErrorMsg('');
    setFiles((prev) => prev.map((f) => ({ ...f, status: 'uploading' as const })));

    const startTime = Date.now();

    try {
      // Step 1 -- Upload each file and collect plan IDs
      const planIds: string[] = [];
      for (const f of files) {
        setFiles((prev) =>
          prev.map((pf) => (pf.id === f.id ? { ...pf, status: 'uploading' as const } : pf))
        );

        const uploadRes = await apiClient.uploadPlan(f.file);
        const planId =
          uploadRes?.planId || uploadRes?.data?.planId || uploadRes?.id || uploadRes?.data?.id;
        if (planId) {
          planIds.push(planId);
        }

        setFiles((prev) =>
          prev.map((pf) => (pf.id === f.id ? { ...pf, status: 'processing' as const } : pf))
        );
      }

      // Step 2 -- Extract quantities from each plan
      setStatus('processing');
      const allItems: ExtractedItem[] = [];

      for (const planId of planIds) {
        const extractRes = await apiClient.extractQuantities(planId);
        if (extractRes.success && extractRes.data) {
          const data = extractRes.data as any;
          const rawItems = data.items || data.extractedItems || data.takeoff?.items || [];
          const mapped: ExtractedItem[] = rawItems.map((item: any, idx: number) => ({
            id: item.id || String(allItems.length + idx + 1),
            category: item.category || item.csiCode || 'GENERAL',
            description: item.description || item.name || '',
            quantity: item.quantity || 0,
            unit: item.unit || 'EA',
            confidence: item.confidence ?? item.confidenceScore ?? 80,
            source: item.source || 'AI_EXTRACTED',
            floor: item.floor || item.level,
            drawingRef: item.drawingRef || item.drawingReference,
          }));
          allItems.push(...mapped);
        }
      }

      const elapsed = (Date.now() - startTime) / 1000;

      // Build category summary
      const byCategory: Record<string, { count: number }> = {};
      for (const item of allItems) {
        if (!byCategory[item.category]) byCategory[item.category] = { count: 0 };
        byCategory[item.category].count++;
      }

      const avgConf =
        allItems.length > 0
          ? Math.round(allItems.reduce((s, i) => s + i.confidence, 0) / allItems.length)
          : 0;

      setResult({
        totalItems: allItems.length,
        averageConfidence: avgConf,
        items: allItems,
        byCategory,
        processingTime: parseFloat(elapsed.toFixed(1)),
      });

      setFiles((prev) => prev.map((f) => ({ ...f, status: 'done' as const })));
      setStatus('complete');
    } catch (err: any) {
      console.error('AI Takeoff error:', err);
      setErrorMsg(
        err?.message || err?.response?.data?.error || 'AI Takeoff failed. Please try again.'
      );
      setFiles((prev) => prev.map((f) => ({ ...f, status: 'error' as const })));
      setStatus('error');
    }
  }

  // ---- CSV Export ----

  function exportCSV() {
    if (!result) return;
    const headers = ['Description', 'Category', 'Quantity', 'Unit', 'Confidence', 'Drawing Ref', 'Floor'];
    const rows = result.items.map((item) => [
      `"${item.description}"`,
      item.category,
      item.quantity,
      item.unit,
      `${item.confidence}%`,
      item.drawingRef || '',
      item.floor || '',
    ]);
    const csv = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ai-takeoff-${projectName || 'export'}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  // ---- Render ----

  return (
    <div className="space-y-6">
      {/* Back link */}
      <div className="flex items-center gap-4">
        <Link href="/estimation/takeoff">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="mr-1 h-4 w-4" /> Back to Takeoff
          </Button>
        </Link>
      </div>

      {/* Page Header */}
      <div className="flex items-center gap-3">
        <div className="p-3 rounded-xl bg-purple-100">
          <Wand2 className="h-6 w-6 text-purple-600" />
        </div>
        <div>
          <h1 className="text-3xl font-bold">AI Takeoff</h1>
          <p className="text-muted-foreground">
            Upload project plans and photos for automatic quantity extraction
          </p>
        </div>
      </div>

      {/* Error Banner */}
      {status === 'error' && errorMsg && (
        <Card className="border-red-200 bg-red-50/50">
          <CardContent className="p-4 flex items-center gap-3">
            <AlertTriangle className="h-5 w-5 text-red-500 shrink-0" />
            <div>
              <p className="text-sm font-medium text-red-800">AI Takeoff Error</p>
              <p className="text-sm text-red-600">{errorMsg}</p>
            </div>
            <Button
              variant="outline"
              size="sm"
              className="ml-auto"
              onClick={() => {
                setStatus('idle');
                setErrorMsg('');
              }}
            >
              Try Again
            </Button>
          </CardContent>
        </Card>
      )}

      {status !== 'complete' ? (
        <>
          {/* ---- Upload Section ---- */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Upload className="h-5 w-5" /> Upload Plans &amp; Photos
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label className="mb-1.5">Project Name</Label>
                <Input
                  value={projectName}
                  onChange={(e) => setProjectName(e.target.value)}
                  placeholder="e.g. Riverside Commons - Phase 2"
                />
              </div>

              {/* Drop zone */}
              <div
                onClick={() => fileInputRef.current?.click()}
                onDrop={handleDrop}
                onDragOver={(e) => e.preventDefault()}
                className="border-2 border-dashed rounded-lg p-8 text-center cursor-pointer hover:border-purple-300 hover:bg-purple-50/30 transition-colors"
              >
                <Upload className="h-9 w-9 mx-auto mb-3 text-purple-400" />
                <p className="text-sm font-medium text-gray-700">
                  Drop files here or click to upload
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  PDF plans, DWG/DXF drawings, JPG/PNG photos &mdash; up to 100MB each
                </p>
                <input
                  ref={fileInputRef}
                  type="file"
                  className="hidden"
                  multiple
                  accept=".pdf,.dwg,.dxf,.jpg,.jpeg,.png,.tiff"
                  onChange={handleFileSelect}
                />
              </div>

              {/* File list */}
              {files.length > 0 && (
                <div className="space-y-2">
                  <p className="text-sm font-medium">
                    {files.length} file(s) selected
                  </p>
                  {files.map((f) => (
                    <div
                      key={f.id}
                      className="flex items-center gap-3 p-3 border rounded-lg"
                    >
                      {f.type === 'PDF' || f.type === 'CAD' ? (
                        <FileText className="h-5 w-5 text-red-500 shrink-0" />
                      ) : (
                        <Image className="h-5 w-5 text-blue-500 shrink-0" />
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{f.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {formatFileSize(f.size)} &middot; {f.type}
                        </p>
                      </div>
                      <select
                        value={f.discipline}
                        onChange={(e) => updateDiscipline(f.id, e.target.value)}
                        className="border rounded px-2 py-1 text-xs bg-white"
                      >
                        {DISCIPLINE_OPTIONS.map((d) => (
                          <option key={d.value} value={d.value}>
                            {d.label}
                          </option>
                        ))}
                      </select>
                      {f.status === 'uploading' || f.status === 'processing' ? (
                        <Loader2 className="h-4 w-4 animate-spin text-purple-500" />
                      ) : f.status === 'done' ? (
                        <CheckCircle2 className="h-4 w-4 text-green-500" />
                      ) : f.status === 'error' ? (
                        <AlertTriangle className="h-4 w-4 text-red-500" />
                      ) : (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            removeFile(f.id);
                          }}
                          className="p-1 hover:bg-red-50 rounded"
                        >
                          <X className="h-3.5 w-3.5 text-gray-400 hover:text-red-500" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* ---- AI Settings ---- */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Brain className="h-5 w-5" /> AI Settings
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <Label className="mb-1.5">Detail Level</Label>
                  <select
                    value={detailLevel}
                    onChange={(e) => setDetailLevel(e.target.value as DetailLevel)}
                    className="w-full border rounded-md px-3 py-2 text-sm bg-white"
                  >
                    <option value="QUICK">Quick Scan &mdash; Fast overview</option>
                    <option value="STANDARD">Standard &mdash; Balanced detail</option>
                    <option value="DETAILED">Detailed &mdash; Maximum extraction</option>
                  </select>
                </div>
                <div>
                  <Label className="mb-1.5">Options</Label>
                  <label className="flex items-center gap-2 mt-2">
                    <input
                      type="checkbox"
                      checked={autoLink}
                      onChange={(e) => setAutoLink(e.target.checked)}
                      className="h-4 w-4 rounded border-gray-300"
                    />
                    <span className="text-sm text-gray-700">
                      Auto-link to cost database assemblies
                    </span>
                  </label>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* ---- Run Button ---- */}
          <div className="flex justify-end">
            <Button
              onClick={runAITakeoff}
              disabled={files.length === 0 || status === 'uploading' || status === 'processing'}
              size="lg"
              className="gap-2"
            >
              {status === 'uploading' || status === 'processing' ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" />
                  {status === 'uploading' ? 'Uploading...' : 'Processing...'}
                </>
              ) : (
                <>
                  <Wand2 className="h-5 w-5" /> Run AI Takeoff
                </>
              )}
            </Button>
          </div>
        </>
      ) : (
        result && (
          <>
            {/* ---- Results Summary ---- */}
            <Card className="border-green-200 bg-green-50/30">
              <CardContent className="p-6">
                <div className="flex items-center gap-3 mb-4">
                  <CheckCircle2 className="h-6 w-6 text-green-600" />
                  <div>
                    <h2 className="text-lg font-bold">AI Takeoff Complete</h2>
                    <p className="text-sm text-muted-foreground">
                      Processed in {result.processingTime}s &middot; {result.totalItems} items
                      extracted &middot; {result.averageConfidence}% avg confidence
                    </p>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div className="bg-white rounded-lg p-3 text-center border">
                    <p className="text-2xl font-bold text-blue-600">{result.totalItems}</p>
                    <p className="text-xs text-muted-foreground">Items Extracted</p>
                  </div>
                  <div className="bg-white rounded-lg p-3 text-center border">
                    <p className="text-2xl font-bold text-green-600">
                      {result.averageConfidence}%
                    </p>
                    <p className="text-xs text-muted-foreground">Avg Confidence</p>
                  </div>
                  <div className="bg-white rounded-lg p-3 text-center border">
                    <p className="text-2xl font-bold text-purple-600">
                      {Object.keys(result.byCategory).length}
                    </p>
                    <p className="text-xs text-muted-foreground">Categories</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* ---- Extracted Items Table ---- */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Extracted Quantities</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b bg-muted/40">
                        <th className="text-left px-4 py-3 font-medium">Description</th>
                        <th className="text-left px-4 py-3 font-medium">Category</th>
                        <th className="text-right px-4 py-3 font-medium">Qty</th>
                        <th className="text-center px-4 py-3 font-medium">Unit</th>
                        <th className="text-center px-4 py-3 font-medium">Confidence</th>
                        <th className="text-left px-4 py-3 font-medium">Drawing</th>
                        <th className="text-left px-4 py-3 font-medium">Floor</th>
                      </tr>
                    </thead>
                    <tbody>
                      {result.items.map((item) => {
                        const confLevel = getConfidenceLevel(item.confidence);
                        return (
                          <tr key={item.id} className="border-b hover:bg-muted/20">
                            <td className="px-4 py-3 font-medium">{item.description}</td>
                            <td className="px-4 py-3">
                              <span className="text-xs bg-muted px-2 py-0.5 rounded">
                                {item.category.replace(/_/g, ' ')}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-right font-medium">
                              {item.quantity.toLocaleString()}
                            </td>
                            <td className="px-4 py-3 text-center text-muted-foreground">
                              {item.unit}
                            </td>
                            <td className="px-4 py-3 text-center">
                              <span
                                className={cn(
                                  'px-2 py-0.5 rounded-full text-xs font-medium',
                                  CONFIDENCE_COLORS[confLevel]
                                )}
                              >
                                {item.confidence}%
                              </span>
                            </td>
                            <td className="px-4 py-3 text-muted-foreground font-mono text-xs">
                              {item.drawingRef || '-'}
                            </td>
                            <td className="px-4 py-3 text-muted-foreground">
                              {item.floor || '-'}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>

            {/* ---- Actions ---- */}
            <div className="flex justify-between">
              <Button
                variant="outline"
                onClick={() => {
                  setStatus('idle');
                  setResult(null);
                  setFiles([]);
                }}
              >
                Start New Takeoff
              </Button>
              <div className="flex gap-3">
                <Button variant="outline" className="gap-2" onClick={exportCSV}>
                  <Download className="h-4 w-4" /> Export CSV
                </Button>
                <Button
                  className="gap-2"
                  onClick={() => router.push('/estimation/estimates/new')}
                >
                  <CheckCircle2 className="h-4 w-4" /> Create Estimate from Takeoff
                </Button>
              </div>
            </div>
          </>
        )
      )}
    </div>
  );
}
