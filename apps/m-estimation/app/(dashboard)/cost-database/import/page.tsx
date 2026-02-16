'use client';

import { useState, useRef, useCallback } from 'react';
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
} from 'lucide-react';
import { apiClient } from '@/lib/api';
import Link from 'next/link';

type ImportType = 'materials' | 'labor' | 'equipment' | 'assemblies';

interface ImportResult {
  success: boolean;
  imported: number;
  skipped: number;
  errors: string[];
  costDatabaseId?: string;
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

export default function CostBookImportPage() {
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

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    // Validate file type
    if (!selectedFile.name.endsWith('.csv')) {
      setError('Please select a CSV file');
      return;
    }

    // Validate file size (max 10MB)
    if (selectedFile.size > 10 * 1024 * 1024) {
      setError('File size must be less than 10MB');
      return;
    }

    setFile(selectedFile);
    setError('');

    // Parse preview (first 5 rows)
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

  const handleImport = async () => {
    if (!file) {
      setError('Please select a file');
      return;
    }

    setUploading(true);
    setError('');

    try {
      let dbId = costDatabaseId;

      // Create new database if needed
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
          Upload a CSV file to bulk-import materials, labor rates, equipment rates, or assemblies
        </p>
      </div>

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
        <div className="space-y-6">
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
        </div>
      )}

      {/* Step 2: Upload File */}
      {step === 'upload' && (
        <div className="space-y-6">
          {/* Database Selection */}
          <Card>
            <CardHeader>
              <CardTitle>Target Cost Database</CardTitle>
              <CardDescription>
                Choose where to import the data
              </CardDescription>
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
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Database Name *
                    </label>
                    <Input
                      value={newDbName}
                      onChange={(e) => setNewDbName(e.target.value)}
                      placeholder="e.g., RSMeans 2026, Company Cost Book"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Region
                    </label>
                    <Input
                      value={newDbRegion}
                      onChange={(e) => setNewDbRegion(e.target.value)}
                      placeholder="e.g., National, Southeast, Houston TX"
                    />
                  </div>
                </div>
              ) : (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Cost Database ID
                  </label>
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
                <span className="text-gray-700">
                  Overwrite existing items with matching names
                </span>
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
                    <p className="text-sm text-gray-500">
                      {(file.size / 1024).toFixed(1)} KB
                    </p>
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
                    <p className="text-lg font-medium text-gray-600">
                      Click to select a CSV file
                    </p>
                    <p className="text-sm text-gray-500">
                      or drag and drop (max 10MB)
                    </p>
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
        <div className="space-y-6">
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
                      <p key={i} className="text-xs text-red-600">
                        {err}
                      </p>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex items-center gap-4">
                <Button onClick={resetForm} className="bg-amber-600 hover:bg-amber-700">
                  Import More
                </Button>
                <Link href="/cost-database">
                  <Button variant="outline">
                    View Cost Database
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
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
  );
}
