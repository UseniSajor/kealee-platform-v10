'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Upload,
  FileSpreadsheet,
  FileText,
  Download,
  Loader2,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  ArrowLeft,
  Database,
  Package,
  Wrench,
  Truck,
  Layers,
  Clock,
  RefreshCw,
  Sparkles,
  Trash2,
} from 'lucide-react';
import { apiClient } from '@/lib/api';
import Link from 'next/link';

type ImportType = 'materials' | 'labor' | 'equipment' | 'assemblies';
type FileMode = 'csv' | 'pdf';

interface ImportResult {
  success: boolean;
  imported: number;
  skipped: number;
  errors: string[];
  costDatabaseId?: string;
}

interface ImportJob {
  id: string;
  fileName: string;
  fileSize: number;
  status: string;
  progress: number;
  totalPages?: number;
  materialsFound: number;
  laborRatesFound: number;
  equipmentFound: number;
  assembliesFound: number;
  totalImported: number;
  totalSkipped: number;
  errors?: string[];
  costDatabaseId?: string;
  startedAt?: string;
  completedAt?: string;
  createdAt: string;
}

const IMPORT_TYPES: { value: ImportType; label: string; icon: React.ReactNode; description: string }[] = [
  {
    value: 'materials',
    label: 'Materials',
    icon: <Package className="h-5 w-5" />,
    description: 'Import material costs (lumber, concrete, steel, etc.)',
  },
  {
    value: 'labor',
    label: 'Labor Rates',
    icon: <Wrench className="h-5 w-5" />,
    description: 'Import labor rates by trade (electrician, plumber, carpenter, etc.)',
  },
  {
    value: 'equipment',
    label: 'Equipment Rates',
    icon: <Truck className="h-5 w-5" />,
    description: 'Import equipment rental rates (excavators, cranes, etc.)',
  },
  {
    value: 'assemblies',
    label: 'Assemblies',
    icon: <Layers className="h-5 w-5" />,
    description: 'Import pre-built assemblies (wall systems, floor systems, etc.)',
  },
];

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  PENDING: { label: 'Pending', color: 'bg-gray-100 text-gray-700' },
  UPLOADING: { label: 'Uploading', color: 'bg-blue-100 text-blue-700' },
  EXTRACTING: { label: 'Extracting Text', color: 'bg-blue-100 text-blue-700' },
  STRUCTURING: { label: 'AI Processing', color: 'bg-purple-100 text-purple-700' },
  IMPORTING: { label: 'Importing Data', color: 'bg-amber-100 text-amber-700' },
  COMPLETED: { label: 'Completed', color: 'bg-green-100 text-green-700' },
  FAILED: { label: 'Failed', color: 'bg-red-100 text-red-700' },
};

export default function CostBookImportPage() {
  // Mode state
  const [fileMode, setFileMode] = useState<FileMode>('pdf');

  // CSV state
  const [step, setStep] = useState<'select' | 'upload' | 'result'>('select');
  const [importType, setImportType] = useState<ImportType>('materials');
  const [file, setFile] = useState<File | null>(null);
  const [costDatabaseId, setCostDatabaseId] = useState('');
  const [newDbName, setNewDbName] = useState('');
  const [newDbRegion, setNewDbRegion] = useState('');
  const [useNewDb, setUseNewDb] = useState(true);
  const [overwrite, setOverwrite] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [result, setResult] = useState<ImportResult | null>(null);
  const [error, setError] = useState('');
  const [preview, setPreview] = useState<string[][]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // PDF state
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [pdfDbName, setPdfDbName] = useState('');
  const [pdfDbRegion, setPdfDbRegion] = useState('');
  const [pdfUploading, setPdfUploading] = useState(false);
  const [pdfError, setPdfError] = useState('');
  const pdfInputRef = useRef<HTMLInputElement>(null);

  // Import jobs state
  const [importJobs, setImportJobs] = useState<ImportJob[]>([]);
  const [loadingJobs, setLoadingJobs] = useState(false);

  // Fetch import jobs
  const fetchJobs = useCallback(async () => {
    setLoadingJobs(true);
    try {
      const res = await apiClient.listImportJobs({ limit: 20 });
      if (res.success && res.data) {
        const data = res.data as any;
        setImportJobs(data.data || []);
      }
    } catch {
      // Silently fail
    } finally {
      setLoadingJobs(false);
    }
  }, []);

  useEffect(() => {
    fetchJobs();
  }, [fetchJobs]);

  // Auto-refresh active jobs every 5 seconds
  useEffect(() => {
    const hasActiveJobs = importJobs.some(
      (j) => !['COMPLETED', 'FAILED'].includes(j.status)
    );
    if (!hasActiveJobs) return;

    const interval = setInterval(fetchJobs, 5000);
    return () => clearInterval(interval);
  }, [importJobs, fetchJobs]);

  // CSV file handler
  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    if (!selectedFile.name.endsWith('.csv')) {
      setError('Please select a CSV file');
      return;
    }
    if (selectedFile.size > 10 * 1024 * 1024) {
      setError('File size must be less than 10MB');
      return;
    }

    setFile(selectedFile);
    setError('');

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      const lines = text.split('\n').filter(l => l.trim()).slice(0, 6);
      const parsed = lines.map(line => {
        const fields: string[] = [];
        let current = '';
        let inQuotes = false;
        for (const char of line) {
          if (char === '"') { inQuotes = !inQuotes; continue; }
          if (char === ',' && !inQuotes) { fields.push(current.trim()); current = ''; continue; }
          current += char;
        }
        fields.push(current.trim());
        return fields;
      });
      setPreview(parsed);
    };
    reader.readAsText(selectedFile);
  }, []);

  // PDF file handler
  const handlePdfSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    if (!selectedFile.name.toLowerCase().endsWith('.pdf')) {
      setPdfError('Please select a PDF file');
      return;
    }
    if (selectedFile.size > 50 * 1024 * 1024) {
      setPdfError('File size must be less than 50MB');
      return;
    }

    setPdfFile(selectedFile);
    setPdfError('');
  }, []);

  const handleDownloadTemplate = async () => {
    const res = await apiClient.getCostBookTemplate(importType);
    if (res.success && res.data) {
      const blob = new Blob([res.data as string], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${importType}-template.csv`;
      a.click();
      URL.revokeObjectURL(url);
    }
  };

  // CSV import handler
  const handleImport = async () => {
    if (!file) {
      setError('Please select a file');
      return;
    }

    setUploading(true);
    setError('');

    try {
      let dbId = costDatabaseId;

      if (useNewDb && newDbName) {
        const dbRes = await apiClient.createCostDatabase({
          name: newDbName,
          region: newDbRegion || 'National',
          type: 'IMPORTED',
          version: new Date().toISOString().split('T')[0],
          source: file.name,
        });
        if (dbRes.success && dbRes.data) {
          dbId = (dbRes.data as any).data?.id || (dbRes.data as any).id;
        } else {
          setError(dbRes.error || 'Failed to create cost database');
          setUploading(false);
          return;
        }
      }

      const res = await apiClient.importCostBookCSV(file, importType, dbId || undefined, overwrite);

      if (res.success && res.data) {
        const importData = res.data as any;
        setResult({
          success: true,
          imported: importData.imported || 0,
          skipped: importData.skipped || 0,
          errors: importData.errors || [],
          costDatabaseId: importData.costDatabaseId,
        });
        setStep('result');
      } else {
        setError(res.error || 'Import failed');
      }
    } catch (err: any) {
      setError(err.message || 'Import failed');
    } finally {
      setUploading(false);
    }
  };

  // PDF import handler
  const handlePdfImport = async () => {
    if (!pdfFile) {
      setPdfError('Please select a PDF file');
      return;
    }
    if (!pdfDbName) {
      setPdfError('Please enter a database name');
      return;
    }

    setPdfUploading(true);
    setPdfError('');

    try {
      const res = await apiClient.importCostBookPDF(pdfFile, {
        name: pdfDbName,
        region: pdfDbRegion || 'National',
      });

      if (res.success) {
        setPdfFile(null);
        setPdfDbName('');
        setPdfDbRegion('');
        if (pdfInputRef.current) pdfInputRef.current.value = '';
        // Refresh jobs list
        await fetchJobs();
      } else {
        setPdfError(res.error || 'Upload failed');
      }
    } catch (err: any) {
      setPdfError(err.message || 'Upload failed');
    } finally {
      setPdfUploading(false);
    }
  };

  const handleDeleteJob = async (jobId: string) => {
    await apiClient.deleteImportJob(jobId);
    setImportJobs((prev) => prev.filter((j) => j.id !== jobId));
  };

  const resetForm = () => {
    setStep('select');
    setFile(null);
    setPreview([]);
    setResult(null);
    setError('');
    setCostDatabaseId('');
    setNewDbName('');
    setNewDbRegion('');
    setUseNewDb(true);
    setOverwrite(false);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleString(undefined, {
      month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit',
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/cost-database">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Cost Database
          </Button>
        </Link>
      </div>

      <div>
        <h1 className="text-3xl font-bold text-gray-900">Import Cost Book</h1>
        <p className="text-gray-600 mt-1">
          Upload a PDF or CSV file to import materials, labor rates, equipment rates, and assemblies
        </p>
      </div>

      {/* File Mode Toggle */}
      <div className="flex gap-2">
        <button
          onClick={() => setFileMode('pdf')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg border-2 font-medium transition-all ${
            fileMode === 'pdf'
              ? 'border-amber-500 bg-amber-50 text-amber-800'
              : 'border-gray-200 text-gray-600 hover:border-gray-300'
          }`}
        >
          <Sparkles className="h-4 w-4" />
          PDF (AI-Powered)
        </button>
        <button
          onClick={() => setFileMode('csv')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg border-2 font-medium transition-all ${
            fileMode === 'csv'
              ? 'border-amber-500 bg-amber-50 text-amber-800'
              : 'border-gray-200 text-gray-600 hover:border-gray-300'
          }`}
        >
          <FileSpreadsheet className="h-4 w-4" />
          CSV (Structured)
        </button>
      </div>

      {/* ================================================================ */}
      {/* PDF IMPORT MODE                                                  */}
      {/* ================================================================ */}
      {fileMode === 'pdf' && (
        <div className="space-y-6">
          {/* Upload Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-amber-600" />
                AI-Powered PDF Import
              </CardTitle>
              <CardDescription>
                Upload any cost code book PDF — our AI will extract materials, labor rates, equipment costs, and assemblies automatically.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Error */}
              {pdfError && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2">
                  <XCircle className="h-4 w-4 text-red-500 mt-0.5 flex-shrink-0" />
                  <p className="text-sm text-red-600">{pdfError}</p>
                </div>
              )}

              {/* Database Name & Region */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Database Name *
                  </label>
                  <Input
                    value={pdfDbName}
                    onChange={(e) => setPdfDbName(e.target.value)}
                    placeholder="e.g., RSMeans 2026, Company Cost Book"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Region
                  </label>
                  <Input
                    value={pdfDbRegion}
                    onChange={(e) => setPdfDbRegion(e.target.value)}
                    placeholder="e.g., National, Southeast, Houston TX"
                  />
                </div>
              </div>

              {/* File Upload */}
              <div
                className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
                  pdfFile ? 'border-amber-400 bg-amber-50' : 'border-gray-300 hover:border-gray-400'
                }`}
                onClick={() => pdfInputRef.current?.click()}
              >
                <input
                  ref={pdfInputRef}
                  type="file"
                  accept=".pdf"
                  onChange={handlePdfSelect}
                  className="hidden"
                />
                {pdfFile ? (
                  <div className="space-y-2">
                    <FileText className="h-12 w-12 text-amber-600 mx-auto" />
                    <p className="text-lg font-medium text-gray-900">{pdfFile.name}</p>
                    <p className="text-sm text-gray-500">{formatFileSize(pdfFile.size)}</p>
                    <Button variant="outline" size="sm" onClick={(e) => {
                      e.stopPropagation();
                      setPdfFile(null);
                      if (pdfInputRef.current) pdfInputRef.current.value = '';
                    }}>
                      Remove
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <Upload className="h-12 w-12 text-gray-400 mx-auto" />
                    <p className="text-lg font-medium text-gray-600">
                      Click to select a PDF file
                    </p>
                    <p className="text-sm text-gray-500">
                      Cost code books, RSMeans data, or any cost reference PDF (max 50MB)
                    </p>
                  </div>
                )}
              </div>

              {/* Upload Button */}
              <div className="flex justify-end">
                <Button
                  onClick={handlePdfImport}
                  disabled={!pdfFile || !pdfDbName || pdfUploading}
                  className="bg-amber-600 hover:bg-amber-700"
                >
                  {pdfUploading ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Uploading...
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-4 w-4 mr-2" />
                      Start AI Import
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Import Jobs List */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Clock className="h-5 w-5" />
                    Import Jobs
                  </CardTitle>
                  <CardDescription>Track the status of your PDF imports</CardDescription>
                </div>
                <Button variant="outline" size="sm" onClick={fetchJobs} disabled={loadingJobs}>
                  <RefreshCw className={`h-4 w-4 mr-1 ${loadingJobs ? 'animate-spin' : ''}`} />
                  Refresh
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {importJobs.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <FileText className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                  <p className="font-medium">No import jobs yet</p>
                  <p className="text-sm">Upload a PDF above to get started</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {importJobs.map((job) => {
                    const statusInfo = STATUS_LABELS[job.status] || { label: job.status, color: 'bg-gray-100 text-gray-700' };
                    return (
                      <div key={job.id} className="p-4 border rounded-lg">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-3">
                            <FileText className="h-5 w-5 text-gray-400" />
                            <div>
                              <p className="font-medium text-gray-900">{job.fileName}</p>
                              <p className="text-xs text-gray-500">
                                {formatFileSize(job.fileSize)} • {formatDate(job.createdAt)}
                                {job.totalPages ? ` • ${job.totalPages} pages` : ''}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className={`text-xs font-medium px-2 py-1 rounded-full ${statusInfo.color}`}>
                              {statusInfo.label}
                            </span>
                            {['COMPLETED', 'FAILED'].includes(job.status) && (
                              <button
                                onClick={() => handleDeleteJob(job.id)}
                                className="text-gray-400 hover:text-red-500 transition-colors"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            )}
                          </div>
                        </div>

                        {/* Progress bar */}
                        {!['COMPLETED', 'FAILED'].includes(job.status) && (
                          <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
                            <div
                              className="bg-amber-500 h-2 rounded-full transition-all duration-500"
                              style={{ width: `${job.progress}%` }}
                            />
                          </div>
                        )}

                        {/* Results */}
                        {job.status === 'COMPLETED' && (
                          <div className="flex items-center gap-4 mt-2 text-sm">
                            <span className="text-green-600 font-medium">
                              <CheckCircle2 className="h-4 w-4 inline mr-1" />
                              {job.totalImported} imported
                            </span>
                            {job.materialsFound > 0 && (
                              <span className="text-gray-500">{job.materialsFound} materials</span>
                            )}
                            {job.laborRatesFound > 0 && (
                              <span className="text-gray-500">{job.laborRatesFound} labor</span>
                            )}
                            {job.equipmentFound > 0 && (
                              <span className="text-gray-500">{job.equipmentFound} equipment</span>
                            )}
                            {job.assembliesFound > 0 && (
                              <span className="text-gray-500">{job.assembliesFound} assemblies</span>
                            )}
                            {job.costDatabaseId && (
                              <Link
                                href={`/cost-database/${job.costDatabaseId}`}
                                className="text-amber-600 hover:text-amber-700 font-medium"
                              >
                                View Database →
                              </Link>
                            )}
                          </div>
                        )}

                        {/* Errors */}
                        {job.status === 'FAILED' && job.errors && (
                          <div className="mt-2 p-2 bg-red-50 rounded text-xs text-red-600">
                            {Array.isArray(job.errors)
                              ? (job.errors as string[]).slice(0, 3).join('; ')
                              : String(job.errors)}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* ================================================================ */}
      {/* CSV IMPORT MODE                                                  */}
      {/* ================================================================ */}
      {fileMode === 'csv' && (
        <div className="space-y-6">
          {/* Error Display */}
          {error && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
              <XCircle className="h-5 w-5 text-red-500 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-sm font-medium text-red-800">Error</p>
                <p className="text-sm text-red-600">{error}</p>
              </div>
            </div>
          )}

          {/* Step 1: Select Import Type */}
          {step === 'select' && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Database className="h-5 w-5" />
                  Select Data Type
                </CardTitle>
                <CardDescription>
                  Choose the type of cost data you want to import
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {IMPORT_TYPES.map((type) => (
                    <button
                      key={type.value}
                      onClick={() => setImportType(type.value)}
                      className={`p-4 rounded-lg border-2 text-left transition-all ${
                        importType === type.value
                          ? 'border-amber-500 bg-amber-50'
                          : 'border-gray-200 hover:border-gray-300 bg-white'
                      }`}
                    >
                      <div className="flex items-center gap-3 mb-2">
                        <div className={`p-2 rounded-lg ${
                          importType === type.value ? 'bg-amber-100 text-amber-700' : 'bg-gray-100 text-gray-600'
                        }`}>
                          {type.icon}
                        </div>
                        <span className="font-semibold text-gray-900">{type.label}</span>
                      </div>
                      <p className="text-sm text-gray-600">{type.description}</p>
                    </button>
                  ))}
                </div>

                <div className="mt-6 flex items-center justify-between">
                  <Button variant="outline" onClick={handleDownloadTemplate}>
                    <Download className="h-4 w-4 mr-2" />
                    Download CSV Template
                  </Button>
                  <Button onClick={() => setStep('upload')} className="bg-amber-600 hover:bg-amber-700">
                    Continue
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Step 2: Upload File */}
          {step === 'upload' && (
            <div className="space-y-6">
              {/* Database Selection */}
              <Card>
                <CardHeader>
                  <CardTitle>Target Cost Database</CardTitle>
                  <CardDescription>Choose where to import the data</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex gap-4">
                    <button
                      onClick={() => setUseNewDb(true)}
                      className={`flex-1 p-3 rounded-lg border-2 text-left ${
                        useNewDb ? 'border-amber-500 bg-amber-50' : 'border-gray-200'
                      }`}
                    >
                      <p className="font-medium">Create New Database</p>
                      <p className="text-sm text-gray-600">Start fresh with a new cost database</p>
                    </button>
                    <button
                      onClick={() => setUseNewDb(false)}
                      className={`flex-1 p-3 rounded-lg border-2 text-left ${
                        !useNewDb ? 'border-amber-500 bg-amber-50' : 'border-gray-200'
                      }`}
                    >
                      <p className="font-medium">Use Existing Database</p>
                      <p className="text-sm text-gray-600">Add to an existing cost database</p>
                    </button>
                  </div>

                  {useNewDb ? (
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Database Name *</label>
                        <Input
                          value={newDbName}
                          onChange={(e) => setNewDbName(e.target.value)}
                          placeholder="e.g., RSMeans 2026, Company Cost Book"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Region</label>
                        <Input
                          value={newDbRegion}
                          onChange={(e) => setNewDbRegion(e.target.value)}
                          placeholder="e.g., National, Southeast, Houston TX"
                        />
                      </div>
                    </div>
                  ) : (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Cost Database ID</label>
                      <Input
                        value={costDatabaseId}
                        onChange={(e) => setCostDatabaseId(e.target.value)}
                        placeholder="Paste the cost database ID"
                      />
                    </div>
                  )}

                  <label className="flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      checked={overwrite}
                      onChange={(e) => setOverwrite(e.target.checked)}
                      className="rounded border-gray-300"
                    />
                    <span className="text-gray-700">Overwrite existing items with matching names</span>
                  </label>
                </CardContent>
              </Card>

              {/* File Upload */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Upload className="h-5 w-5" />
                    Upload CSV File
                  </CardTitle>
                  <CardDescription>
                    Importing: <span className="font-medium capitalize">{importType}</span>
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div
                    className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
                      file ? 'border-amber-400 bg-amber-50' : 'border-gray-300 hover:border-gray-400'
                    }`}
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept=".csv"
                      onChange={handleFileSelect}
                      className="hidden"
                    />
                    {file ? (
                      <div className="space-y-2">
                        <FileSpreadsheet className="h-12 w-12 text-amber-600 mx-auto" />
                        <p className="text-lg font-medium text-gray-900">{file.name}</p>
                        <p className="text-sm text-gray-500">{formatFileSize(file.size)}</p>
                        <Button variant="outline" size="sm" onClick={(e) => {
                          e.stopPropagation();
                          setFile(null);
                          setPreview([]);
                          if (fileInputRef.current) fileInputRef.current.value = '';
                        }}>
                          Remove
                        </Button>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <Upload className="h-12 w-12 text-gray-400 mx-auto" />
                        <p className="text-lg font-medium text-gray-600">Click to select a CSV file</p>
                        <p className="text-sm text-gray-500">or drag and drop (max 10MB)</p>
                      </div>
                    )}
                  </div>

                  {/* CSV Preview */}
                  {preview.length > 0 && (
                    <div className="mt-6">
                      <h3 className="text-sm font-medium text-gray-700 mb-2">
                        Preview (first {Math.min(preview.length - 1, 5)} rows)
                      </h3>
                      <div className="overflow-x-auto border rounded-lg">
                        <table className="w-full text-xs">
                          <thead className="bg-gray-50">
                            <tr>
                              {preview[0]?.map((header, i) => (
                                <th key={i} className="px-3 py-2 text-left font-medium text-gray-600 whitespace-nowrap">
                                  {header}
                                </th>
                              ))}
                            </tr>
                          </thead>
                          <tbody>
                            {preview.slice(1, 6).map((row, i) => (
                              <tr key={i} className="border-t">
                                {row.map((cell, j) => (
                                  <td key={j} className="px-3 py-2 text-gray-800 whitespace-nowrap">
                                    {cell || '-'}
                                  </td>
                                ))}
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}

                  <div className="mt-6 flex items-center justify-between">
                    <Button variant="outline" onClick={() => setStep('select')}>
                      Back
                    </Button>
                    <Button
                      onClick={handleImport}
                      disabled={!file || uploading || (useNewDb && !newDbName)}
                      className="bg-amber-600 hover:bg-amber-700"
                    >
                      {uploading ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Importing...
                        </>
                      ) : (
                        <>
                          <Upload className="h-4 w-4 mr-2" />
                          Import {importType}
                        </>
                      )}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Step 3: Results */}
          {step === 'result' && result && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  {result.errors.length === 0 ? (
                    <CheckCircle2 className="h-6 w-6 text-green-500" />
                  ) : (
                    <AlertTriangle className="h-6 w-6 text-amber-500" />
                  )}
                  Import Complete
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-3 gap-4 mb-6">
                  <div className="p-4 bg-green-50 rounded-lg text-center">
                    <p className="text-3xl font-bold text-green-700">{result.imported}</p>
                    <p className="text-sm text-green-600">Imported</p>
                  </div>
                  <div className="p-4 bg-gray-50 rounded-lg text-center">
                    <p className="text-3xl font-bold text-gray-700">{result.skipped}</p>
                    <p className="text-sm text-gray-600">Skipped</p>
                  </div>
                  <div className="p-4 bg-red-50 rounded-lg text-center">
                    <p className="text-3xl font-bold text-red-700">{result.errors.length}</p>
                    <p className="text-sm text-red-600">Errors</p>
                  </div>
                </div>

                {result.errors.length > 0 && (
                  <div className="mb-6">
                    <h3 className="text-sm font-medium text-red-700 mb-2">
                      Errors ({result.errors.length})
                    </h3>
                    <div className="max-h-48 overflow-y-auto bg-red-50 rounded-lg p-3 space-y-1">
                      {result.errors.map((err, i) => (
                        <p key={i} className="text-xs text-red-600">{err}</p>
                      ))}
                    </div>
                  </div>
                )}

                <div className="flex items-center gap-4">
                  <Button onClick={resetForm} className="bg-amber-600 hover:bg-amber-700">
                    Import More
                  </Button>
                  <Link href="/cost-database">
                    <Button variant="outline">View Cost Database</Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Help Section */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">CSV Format Guide</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-gray-600 space-y-3">
              <div>
                <p className="font-medium text-gray-800">Materials:</p>
                <code className="text-xs bg-gray-100 px-2 py-1 rounded block mt-1">
                  csiCode, name, description, category, unit, unitCost, minCost, maxCost, wasteFactor, supplier
                </code>
              </div>
              <div>
                <p className="font-medium text-gray-800">Labor Rates:</p>
                <code className="text-xs bg-gray-100 px-2 py-1 rounded block mt-1">
                  trade, classification, description, baseRate, burdenRate, totalRate, overtimeMultiplier, region
                </code>
              </div>
              <div>
                <p className="font-medium text-gray-800">Equipment Rates:</p>
                <code className="text-xs bg-gray-100 px-2 py-1 rounded block mt-1">
                  category, name, description, dailyRate, weeklyRate, monthlyRate, operatorRequired, fuelCostPerHour
                </code>
              </div>
              <div>
                <p className="font-medium text-gray-800">Assemblies:</p>
                <code className="text-xs bg-gray-100 px-2 py-1 rounded block mt-1">
                  csiCode, name, description, category, unit, materialCost, laborCost, equipmentCost, laborHours, crewSize
                </code>
              </div>
              <p className="text-xs text-gray-500 mt-4">
                Tip: Download a template for the exact format. The first row should be column headers.
                Numeric fields should not include currency symbols or commas.
              </p>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
