'use client';

import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2, Sparkles, CheckCircle2, AlertTriangle, Upload, FileText } from 'lucide-react';
import { apiClient } from '@/lib/api';
import { formatCurrency } from '@/lib/utils';

interface ScopeAnalysisStepProps {
  data: any;
  onNext: (data: any) => void;
  onBack: () => void;
  isFirst: boolean;
  isLast: boolean;
  isSubmitting?: boolean;
}

export function ScopeAnalysisStep({
  data,
  onNext,
  onBack,
}: ScopeAnalysisStepProps) {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysis, setAnalysis] = useState<any>(data.scopeAnalysis || null);
  const [analysisError, setAnalysisError] = useState<string | null>(null);
  const [selectedItems, setSelectedItems] = useState<Set<string>>(
    new Set(data.selectedItems || [])
  );

  // AI Takeoff state
  const [showTakeoff, setShowTakeoff] = useState(false);
  const [takeoffFile, setTakeoffFile] = useState<File | null>(null);
  const [takeoffStatus, setTakeoffStatus] = useState<'idle' | 'uploading' | 'processing' | 'complete'>('idle');
  const [takeoffJobId, setTakeoffJobId] = useState<string | null>(null);

  useEffect(() => {
    if (!analysis && data.basicInfo?.description && !showTakeoff) {
      analyzeScope();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const analyzeScope = async () => {
    setIsAnalyzing(true);
    setAnalysisError(null);
    try {
      const response = await apiClient.analyzeScope(
        data.basicInfo.description
      );

      if (response.success && response.data) {
        const result = response.data as any;

        // Normalize the API response to match expected shape
        const normalizedAnalysis = {
          workItems: result.workItems || result.work_items || result.items || [],
          suggestedAssemblies: result.suggestedAssemblies || result.suggested_assemblies || result.assemblies || [],
          estimatedRange: result.estimatedRange || result.estimated_range || result.budgetRange || {
            min: result.estimatedMin || result.minCost || 0,
            max: result.estimatedMax || result.maxCost || 0,
          },
        };

        // Ensure work items have IDs
        normalizedAnalysis.workItems = normalizedAnalysis.workItems.map(
          (item: any, index: number) => ({
            id: item.id || String(index + 1),
            name: item.name || item.title || `Work Item ${index + 1}`,
            description: item.description || item.desc || '',
            confidence: item.confidence || item.score || 0.5,
          })
        );

        setAnalysis(normalizedAnalysis);

        // Pre-select high confidence items
        const highConfidence = new Set<string>(
          normalizedAnalysis.workItems
            .filter((item: any) => item.confidence >= 0.85)
            .map((item: any) => item.id as string)
        );
        setSelectedItems(highConfidence);
      } else {
        setAnalysisError(response.error || 'Scope analysis returned no results');
      }
    } catch (error) {
      console.error('Scope analysis failed:', error);
      setAnalysisError('Failed to analyze scope. Please try again or skip.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleTakeoffUpload = useCallback(async () => {
    if (!takeoffFile) return;
    setTakeoffStatus('uploading');
    setAnalysisError(null);
    try {
      const formData = new FormData();
      formData.append('file', takeoffFile);
      formData.append('discipline', 'general');
      if (data.basicInfo?.estimateId) {
        formData.append('estimateId', data.basicInfo.estimateId);
      }
      const res = await apiClient.uploadAITakeoff(formData);
      if (res.success && res.data) {
        const jobId = (res.data as any).takeoffJobId || (res.data as any).id;
        setTakeoffJobId(jobId);
        setTakeoffStatus('processing');

        // Poll for completion
        const poll = setInterval(async () => {
          try {
            const status = await apiClient.getAITakeoffJob(jobId);
            const job = (status.data as any);
            if (job?.status === 'TAKEOFF_REVIEW' || job?.status === 'TAKEOFF_CONFIRMED') {
              clearInterval(poll);
              setTakeoffStatus('complete');
              // Convert takeoff results into scope analysis work items
              const items = (job.results || []).map((r: any, i: number) => ({
                id: `takeoff-${i}`,
                name: r.ctcTaskName || r.name || `Item ${i + 1}`,
                description: `CTC ${r.ctcTaskNumber || ''} - ${r.unit || ''} @ $${r.unitCost || 0}/unit`,
                confidence: r.confidence || 0.85,
                ctcTaskNumber: r.ctcTaskNumber,
                quantity: r.quantity,
                unitCost: r.unitCost,
              }));
              setAnalysis({
                workItems: items,
                suggestedAssemblies: [],
                estimatedRange: { min: 0, max: 0 },
                takeoffJobId: jobId,
              });
              setSelectedItems(new Set(items.map((it: any) => it.id)));
            } else if (job?.status === 'TAKEOFF_FAILED') {
              clearInterval(poll);
              setTakeoffStatus('idle');
              setAnalysisError('AI takeoff processing failed. Please try again.');
            }
          } catch {
            // Keep polling
          }
        }, 5000);
      }
    } catch {
      setAnalysisError('Failed to upload plans for AI takeoff.');
      setTakeoffStatus('idle');
    }
  }, [takeoffFile, data.basicInfo]);

  const toggleItem = (itemId: string) => {
    const newSelected = new Set(selectedItems);
    if (newSelected.has(itemId)) {
      newSelected.delete(itemId);
    } else {
      newSelected.add(itemId);
    }
    setSelectedItems(newSelected);
  };

  const handleNext = () => {
    onNext({
      scopeAnalysis: analysis,
      selectedItems: Array.from(selectedItems),
      takeoffJobId: analysis?.takeoffJobId || takeoffJobId || null,
    });
  };

  if (isAnalyzing) {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold">AI Scope Analysis</h2>
          <p className="text-muted-foreground mt-1">
            Analyzing your project description...
          </p>
        </div>

        <div className="flex flex-col items-center justify-center py-12">
          <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
          <p className="text-muted-foreground">Analyzing scope of work...</p>
          <p className="text-sm text-muted-foreground mt-2">
            This usually takes 5-10 seconds
          </p>
        </div>
      </div>
    );
  }

  if (analysisError) {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold">AI Scope Analysis</h2>
          <p className="text-muted-foreground mt-1">
            Analysis encountered an issue
          </p>
        </div>

        <Card className="border-destructive/20">
          <CardContent className="p-6">
            <div className="flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 text-destructive flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm text-muted-foreground">{analysisError}</p>
                <Button
                  variant="outline"
                  size="sm"
                  className="mt-3"
                  onClick={analyzeScope}
                >
                  Retry Analysis
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-between pt-4 border-t">
          <Button variant="outline" onClick={onBack}>
            Back
          </Button>
          <Button onClick={() => onNext({ scopeAnalysis: null })}>
            Skip Analysis
          </Button>
        </div>
      </div>
    );
  }

  if (!analysis) {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold">AI Scope Analysis</h2>
          <p className="text-muted-foreground mt-1">
            Unable to analyze scope automatically
          </p>
        </div>

        <div className="flex justify-between pt-4 border-t">
          <Button variant="outline" onClick={onBack}>
            Back
          </Button>
          <Button onClick={() => onNext({ scopeAnalysis: null })}>
            Skip Analysis
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold flex items-center gap-2">
          <Sparkles className="h-6 w-6 text-primary" />
          AI Scope Analysis
        </h2>
        <p className="text-muted-foreground mt-1">
          Review the detected work items and select what to include
        </p>
      </div>

      {/* AI Takeoff Upload Option */}
      <Card className="border-dashed">
        <CardContent className="p-4">
          {!showTakeoff ? (
            <button
              type="button"
              className="flex items-center gap-3 w-full text-left"
              onClick={() => setShowTakeoff(true)}
            >
              <Upload className="h-5 w-5 text-primary" />
              <div>
                <p className="font-medium text-sm">Upload Plans for AI Takeoff</p>
                <p className="text-xs text-muted-foreground">
                  Upload architectural plans to automatically extract CTC tasks and quantities
                </p>
              </div>
            </button>
          ) : (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <p className="font-medium text-sm flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  AI Takeoff from Plans
                </p>
                <Button variant="ghost" size="sm" onClick={() => setShowTakeoff(false)}>
                  Cancel
                </Button>
              </div>
              <div className="border rounded-lg p-4 text-center">
                <input
                  type="file"
                  accept=".pdf,.png,.jpg,.jpeg,.tiff,.dxf,.dwg"
                  className="hidden"
                  id="takeoff-plan-upload"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) setTakeoffFile(f);
                  }}
                />
                <label htmlFor="takeoff-plan-upload" className="cursor-pointer">
                  {takeoffFile ? (
                    <p className="text-sm font-medium">{takeoffFile.name}</p>
                  ) : (
                    <p className="text-sm text-muted-foreground">
                      Click to select PDF, PNG, TIFF, DXF, or DWG file
                    </p>
                  )}
                </label>
              </div>
              {takeoffFile && (
                <Button
                  onClick={handleTakeoffUpload}
                  disabled={takeoffStatus === 'uploading' || takeoffStatus === 'processing'}
                  className="w-full"
                >
                  {takeoffStatus === 'uploading'
                    ? 'Uploading...'
                    : takeoffStatus === 'processing'
                    ? 'AI is processing...'
                    : 'Run AI Takeoff'}
                </Button>
              )}
              {takeoffStatus === 'processing' && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Processing plans — this may take a few minutes
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Detected Work Items */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Detected Work Items</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {analysis.workItems.map((item: any) => (
              <div
                key={item.id}
                className="flex items-start gap-3 p-3 rounded-lg border hover:bg-accent/50 transition-colors cursor-pointer"
                onClick={() => toggleItem(item.id)}
              >
                <div className="flex-shrink-0 mt-0.5">
                  {selectedItems.has(item.id) ? (
                    <CheckCircle2 className="h-5 w-5 text-primary" />
                  ) : (
                    <div className="h-5 w-5 rounded-full border-2 border-muted-foreground" />
                  )}
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <p className="font-medium">{item.name}</p>
                    <Badge
                      variant={
                        item.confidence >= 0.9
                          ? 'success'
                          : item.confidence >= 0.8
                          ? 'default'
                          : 'outline'
                      }
                    >
                      {Math.round(item.confidence * 100)}% confidence
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">
                    {item.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Suggested Assemblies */}
      {analysis.suggestedAssemblies && analysis.suggestedAssemblies.length > 0 && (
        <Card className="bg-primary/5 border-primary/20">
          <CardHeader>
            <CardTitle className="text-lg">Suggested Assemblies</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {analysis.suggestedAssemblies.map((assembly: any, idx: number) => {
                const assemblyName = typeof assembly === 'string' ? assembly : (assembly.name || assembly.title || '');
                return (
                  <li key={idx} className="flex items-center gap-2 text-sm">
                    <span className="text-primary">&#8226;</span>
                    {assemblyName}
                  </li>
                );
              })}
            </ul>
            <p className="text-xs text-muted-foreground mt-3">
              These assemblies will be available in the next step
            </p>
          </CardContent>
        </Card>
      )}

      {/* Estimated Range */}
      {analysis.estimatedRange &&
        (analysis.estimatedRange.min > 0 || analysis.estimatedRange.max > 0) && (
        <Card>
          <CardContent className="p-6">
            <div className="text-center">
              <p className="text-sm text-muted-foreground mb-2">
                Estimated Budget Range
              </p>
              <p className="text-3xl font-bold">
                {formatCurrency(analysis.estimatedRange.min)} -{' '}
                {formatCurrency(analysis.estimatedRange.max)}
              </p>
              <p className="text-xs text-muted-foreground mt-2">
                Based on similar projects in your area
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="flex justify-between pt-4 border-t">
        <Button variant="outline" onClick={onBack}>
          Back
        </Button>
        <Button onClick={handleNext} disabled={selectedItems.size === 0}>
          Next: Build Estimate ({selectedItems.size} items selected)
        </Button>
      </div>
    </div>
  );
}
