'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2, Sparkles, CheckCircle2, AlertTriangle } from 'lucide-react';
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

  useEffect(() => {
    if (!analysis && data.basicInfo?.description) {
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
