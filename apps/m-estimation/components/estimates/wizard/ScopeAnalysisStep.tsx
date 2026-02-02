'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2, Sparkles, CheckCircle2 } from 'lucide-react';
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
    try {
      const response = await apiClient.analyzeScope(
        data.basicInfo.description
      );

      if (response.success) {
        // Mock response for now (replace with actual API)
        const mockAnalysis = {
          workItems: [
            { id: '1', name: 'Foundation', description: '2,000 SF slab on grade', confidence: 0.95 },
            { id: '2', name: 'Framing', description: 'Wood frame, 2x6 walls', confidence: 0.90 },
            { id: '3', name: 'Roofing', description: 'Asphalt shingles, 2,500 SF', confidence: 0.88 },
            { id: '4', name: 'Plumbing', description: '2 full bathrooms', confidence: 0.92 },
            { id: '5', name: 'Electrical', description: 'Standard 200A service', confidence: 0.90 },
            { id: '6', name: 'Drywall', description: 'Level 4 finish', confidence: 0.85 },
            { id: '7', name: 'HVAC', description: 'Split system (suggested)', confidence: 0.70 },
            { id: '8', name: 'Insulation', description: 'R-19 walls, R-38 ceiling', confidence: 0.75 },
          ],
          suggestedAssemblies: [
            'Residential Foundation - Slab on Grade (ASM-001)',
            'Wood Frame Wall - 2x6 16" OC (ASM-042)',
            'Asphalt Shingle Roof - Standard (ASM-087)',
          ],
          estimatedRange: { min: 180000, max: 220000 },
        };

        setAnalysis(mockAnalysis);
        // Pre-select high confidence items
        const highConfidence = new Set(
          mockAnalysis.workItems
            .filter((item: any) => item.confidence >= 0.85)
            .map((item: any) => item.id)
        );
        setSelectedItems(highConfidence);
      }
    } catch (error) {
      console.error('Scope analysis failed:', error);
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
      <Card className="bg-primary/5 border-primary/20">
        <CardHeader>
          <CardTitle className="text-lg">Suggested Assemblies</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2">
            {analysis.suggestedAssemblies.map((assembly: string, idx: number) => (
              <li key={idx} className="flex items-center gap-2 text-sm">
                <span className="text-primary">•</span>
                {assembly}
              </li>
            ))}
          </ul>
          <p className="text-xs text-muted-foreground mt-3">
            These assemblies will be available in the next step
          </p>
        </CardContent>
      </Card>

      {/* Estimated Range */}
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
