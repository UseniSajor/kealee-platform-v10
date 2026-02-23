'use client';

import { useState } from 'react';
import Link from 'next/link';
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
import { Textarea } from '@estimation/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@estimation/components/ui/dialog';
import { cn } from '@estimation/lib/utils';
import { apiClient } from '@estimation/lib/api';
import {
  Brain,
  Search,
  TrendingUp,
  Lightbulb,
  GitCompare,
  BarChart3,
  Wand2,
  Loader2,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  X,
  FileText,
  DollarSign,
  Target,
} from 'lucide-react';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type ToolId =
  | 'scope-analysis'
  | 'cost-prediction'
  | 'value-engineering'
  | 'compare-estimates'
  | 'benchmark';

interface ToolConfig {
  id: ToolId;
  title: string;
  description: string;
  icon: React.ElementType;
  color: string;
  bgColor: string;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const AI_TOOLS: ToolConfig[] = [
  {
    id: 'scope-analysis',
    title: 'Scope Analysis',
    description:
      'Analyze a project description to identify scope items, divisions, and potential risks using AI.',
    icon: Search,
    color: 'text-blue-600',
    bgColor: 'bg-blue-100',
  },
  {
    id: 'cost-prediction',
    title: 'Cost Prediction',
    description:
      'Get an AI-powered cost prediction based on project type, size, location, and specifications.',
    icon: TrendingUp,
    color: 'text-green-600',
    bgColor: 'bg-green-100',
  },
  {
    id: 'value-engineering',
    title: 'Value Engineering',
    description:
      'Analyze an existing estimate for cost-saving opportunities while maintaining quality.',
    icon: Lightbulb,
    color: 'text-amber-600',
    bgColor: 'bg-amber-100',
  },
  {
    id: 'compare-estimates',
    title: 'Estimate Comparison',
    description:
      'Compare multiple estimates side-by-side to identify differences and anomalies.',
    icon: GitCompare,
    color: 'text-indigo-600',
    bgColor: 'bg-indigo-100',
  },
  {
    id: 'benchmark',
    title: 'Benchmarking',
    description:
      'Compare an estimate against industry benchmarks and historical data for your region.',
    icon: BarChart3,
    color: 'text-rose-600',
    bgColor: 'bg-rose-100',
  },
];

// ---------------------------------------------------------------------------
// Scope Analysis Panel
// ---------------------------------------------------------------------------

function ScopeAnalysisPanel({
  onClose,
}: {
  onClose: () => void;
}) {
  const [description, setDescription] = useState('');
  const [projectType, setProjectType] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState('');

  async function run() {
    if (!description.trim()) return;
    setLoading(true);
    setError('');
    setResult(null);
    try {
      const res = await apiClient.aiScopeAnalysis({
        description,
        projectType: projectType || undefined,
      });
      if (res.success) {
        setResult(res.data);
      } else {
        setError(res.error || 'Scope analysis failed.');
      }
    } catch (err: any) {
      setError(err?.message || 'An unexpected error occurred.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-4">
      <div>
        <Label className="mb-1.5">Project Description</Label>
        <Textarea
          rows={4}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Describe the project scope, building type, size, and key requirements..."
        />
      </div>
      <div>
        <Label className="mb-1.5">Project Type (optional)</Label>
        <Input
          value={projectType}
          onChange={(e) => setProjectType(e.target.value)}
          placeholder="e.g. Commercial Office, Residential Multi-family, Healthcare"
        />
      </div>

      {error && (
        <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 p-3 rounded-lg">
          <AlertTriangle className="h-4 w-4 shrink-0" />
          {error}
        </div>
      )}

      {result && (
        <div className="border rounded-lg p-4 bg-muted/20 space-y-3">
          <h4 className="font-medium flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-green-600" /> Analysis Results
          </h4>
          {result.divisions && Array.isArray(result.divisions) && (
            <div>
              <p className="text-sm font-medium mb-1">Identified Divisions</p>
              <div className="flex flex-wrap gap-1.5">
                {result.divisions.map((d: any, i: number) => (
                  <Badge key={i} variant="secondary">
                    {typeof d === 'string' ? d : d.name || d.code || JSON.stringify(d)}
                  </Badge>
                ))}
              </div>
            </div>
          )}
          {result.scopeItems && Array.isArray(result.scopeItems) && (
            <div>
              <p className="text-sm font-medium mb-1">Scope Items</p>
              <ul className="text-sm space-y-1 list-disc list-inside text-muted-foreground">
                {result.scopeItems.slice(0, 20).map((item: any, i: number) => (
                  <li key={i}>{typeof item === 'string' ? item : item.description || item.name || JSON.stringify(item)}</li>
                ))}
              </ul>
            </div>
          )}
          {result.risks && Array.isArray(result.risks) && result.risks.length > 0 && (
            <div>
              <p className="text-sm font-medium mb-1">Potential Risks</p>
              <ul className="text-sm space-y-1 list-disc list-inside text-red-600">
                {result.risks.map((r: any, i: number) => (
                  <li key={i}>{typeof r === 'string' ? r : r.description || r.name || JSON.stringify(r)}</li>
                ))}
              </ul>
            </div>
          )}
          {/* Fallback for unexpected shapes */}
          {!result.divisions && !result.scopeItems && (
            <pre className="text-xs bg-muted p-3 rounded overflow-x-auto">
              {JSON.stringify(result, null, 2)}
            </pre>
          )}
        </div>
      )}

      <div className="flex justify-end gap-2">
        <Button variant="outline" onClick={onClose}>
          Close
        </Button>
        <Button onClick={run} disabled={loading || !description.trim()} className="gap-2">
          {loading ? (
            <><Loader2 className="h-4 w-4 animate-spin" /> Analyzing...</>
          ) : (
            <><Search className="h-4 w-4" /> Analyze Scope</>
          )}
        </Button>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Cost Prediction Panel
// ---------------------------------------------------------------------------

function CostPredictionPanel({
  onClose,
}: {
  onClose: () => void;
}) {
  const [projectType, setProjectType] = useState('');
  const [squareFeet, setSquareFeet] = useState('');
  const [location, setLocation] = useState('');
  const [stories, setStories] = useState('');
  const [quality, setQuality] = useState('STANDARD');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState('');

  async function run() {
    if (!projectType.trim()) return;
    setLoading(true);
    setError('');
    setResult(null);
    try {
      const res = await apiClient.aiCostPrediction({
        projectType,
        squareFeet: squareFeet ? Number(squareFeet) : undefined,
        location: location || undefined,
        stories: stories ? Number(stories) : undefined,
        qualityLevel: quality,
      });
      if (res.success) {
        setResult(res.data);
      } else {
        setError(res.error || 'Cost prediction failed.');
      }
    } catch (err: any) {
      setError(err?.message || 'An unexpected error occurred.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-4">
      <div className="grid sm:grid-cols-2 gap-4">
        <div>
          <Label className="mb-1.5">Project Type</Label>
          <Input
            value={projectType}
            onChange={(e) => setProjectType(e.target.value)}
            placeholder="e.g. Office Building, Apartment Complex"
          />
        </div>
        <div>
          <Label className="mb-1.5">Square Feet</Label>
          <Input
            type="number"
            value={squareFeet}
            onChange={(e) => setSquareFeet(e.target.value)}
            placeholder="e.g. 50000"
          />
        </div>
        <div>
          <Label className="mb-1.5">Location</Label>
          <Input
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            placeholder="e.g. Austin, TX"
          />
        </div>
        <div>
          <Label className="mb-1.5">Stories</Label>
          <Input
            type="number"
            value={stories}
            onChange={(e) => setStories(e.target.value)}
            placeholder="e.g. 3"
          />
        </div>
      </div>
      <div>
        <Label className="mb-1.5">Quality Level</Label>
        <select
          value={quality}
          onChange={(e) => setQuality(e.target.value)}
          className="w-full border rounded-md px-3 py-2 text-sm bg-white"
        >
          <option value="ECONOMY">Economy</option>
          <option value="STANDARD">Standard</option>
          <option value="PREMIUM">Premium</option>
          <option value="LUXURY">Luxury</option>
        </select>
      </div>

      {error && (
        <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 p-3 rounded-lg">
          <AlertTriangle className="h-4 w-4 shrink-0" />
          {error}
        </div>
      )}

      {result && (
        <div className="border rounded-lg p-4 bg-muted/20 space-y-3">
          <h4 className="font-medium flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-green-600" /> Prediction Results
          </h4>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {result.estimatedCost != null && (
              <div className="bg-white rounded-lg p-3 text-center border">
                <p className="text-xl font-bold text-green-600">
                  ${Number(result.estimatedCost).toLocaleString()}
                </p>
                <p className="text-xs text-muted-foreground">Estimated Total</p>
              </div>
            )}
            {result.costPerSqFt != null && (
              <div className="bg-white rounded-lg p-3 text-center border">
                <p className="text-xl font-bold text-blue-600">
                  ${Number(result.costPerSqFt).toLocaleString()}
                </p>
                <p className="text-xs text-muted-foreground">Cost/SF</p>
              </div>
            )}
            {result.confidenceRange && (
              <div className="bg-white rounded-lg p-3 text-center border">
                <p className="text-lg font-bold text-purple-600">
                  {result.confidenceRange.low && result.confidenceRange.high
                    ? `$${Number(result.confidenceRange.low).toLocaleString()} - $${Number(result.confidenceRange.high).toLocaleString()}`
                    : JSON.stringify(result.confidenceRange)}
                </p>
                <p className="text-xs text-muted-foreground">Range</p>
              </div>
            )}
          </div>
          {result.breakdown && typeof result.breakdown === 'object' && (
            <div>
              <p className="text-sm font-medium mb-1">Cost Breakdown</p>
              <div className="space-y-1">
                {Object.entries(result.breakdown).map(([key, val]: [string, any]) => (
                  <div key={key} className="flex justify-between text-sm">
                    <span className="text-muted-foreground">{key}</span>
                    <span className="font-medium">
                      {typeof val === 'number' ? `$${val.toLocaleString()}` : String(val)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
          {/* Fallback */}
          {result.estimatedCost == null && result.costPerSqFt == null && (
            <pre className="text-xs bg-muted p-3 rounded overflow-x-auto">
              {JSON.stringify(result, null, 2)}
            </pre>
          )}
        </div>
      )}

      <div className="flex justify-end gap-2">
        <Button variant="outline" onClick={onClose}>
          Close
        </Button>
        <Button onClick={run} disabled={loading || !projectType.trim()} className="gap-2">
          {loading ? (
            <><Loader2 className="h-4 w-4 animate-spin" /> Predicting...</>
          ) : (
            <><TrendingUp className="h-4 w-4" /> Predict Cost</>
          )}
        </Button>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Value Engineering Panel
// ---------------------------------------------------------------------------

function ValueEngineeringPanel({
  onClose,
}: {
  onClose: () => void;
}) {
  const [estimateId, setEstimateId] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState('');

  async function run() {
    if (!estimateId.trim()) return;
    setLoading(true);
    setError('');
    setResult(null);
    try {
      const res = await apiClient.aiValueEngineering(estimateId.trim());
      if (res.success) {
        setResult(res.data);
      } else {
        setError(res.error || 'Value engineering analysis failed.');
      }
    } catch (err: any) {
      setError(err?.message || 'An unexpected error occurred.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-4">
      <div>
        <Label className="mb-1.5">Estimate ID</Label>
        <Input
          value={estimateId}
          onChange={(e) => setEstimateId(e.target.value)}
          placeholder="Enter the ID of the estimate to analyze"
        />
        <p className="text-xs text-muted-foreground mt-1">
          You can find the Estimate ID on the Estimates page or in the estimate detail URL.
        </p>
      </div>

      {error && (
        <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 p-3 rounded-lg">
          <AlertTriangle className="h-4 w-4 shrink-0" />
          {error}
        </div>
      )}

      {result && (
        <div className="border rounded-lg p-4 bg-muted/20 space-y-3">
          <h4 className="font-medium flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-green-600" /> Value Engineering Results
          </h4>
          {result.totalSavings != null && (
            <div className="bg-white rounded-lg p-3 text-center border">
              <p className="text-2xl font-bold text-green-600">
                ${Number(result.totalSavings).toLocaleString()}
              </p>
              <p className="text-xs text-muted-foreground">Potential Savings</p>
            </div>
          )}
          {result.suggestions && Array.isArray(result.suggestions) && (
            <div>
              <p className="text-sm font-medium mb-1">Suggestions</p>
              <div className="space-y-2">
                {result.suggestions.map((s: any, i: number) => (
                  <div key={i} className="border rounded-lg p-3 bg-white">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium">{s.title || s.description || s.name || `Suggestion ${i + 1}`}</p>
                      {s.savings != null && (
                        <Badge variant="secondary" className="text-green-700 bg-green-50">
                          Save ${Number(s.savings).toLocaleString()}
                        </Badge>
                      )}
                    </div>
                    {s.description && s.title && (
                      <p className="text-sm text-muted-foreground mt-1">{s.description}</p>
                    )}
                    {s.impact && (
                      <p className="text-xs text-muted-foreground mt-1">Impact: {s.impact}</p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
          {/* Fallback */}
          {!result.suggestions && result.totalSavings == null && (
            <pre className="text-xs bg-muted p-3 rounded overflow-x-auto">
              {JSON.stringify(result, null, 2)}
            </pre>
          )}
        </div>
      )}

      <div className="flex justify-end gap-2">
        <Button variant="outline" onClick={onClose}>
          Close
        </Button>
        <Button onClick={run} disabled={loading || !estimateId.trim()} className="gap-2">
          {loading ? (
            <><Loader2 className="h-4 w-4 animate-spin" /> Analyzing...</>
          ) : (
            <><Lightbulb className="h-4 w-4" /> Analyze</>
          )}
        </Button>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Compare Estimates Panel
// ---------------------------------------------------------------------------

function CompareEstimatesPanel({
  onClose,
}: {
  onClose: () => void;
}) {
  const [idsText, setIdsText] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState('');

  async function run() {
    const ids = idsText
      .split(/[,\n]+/)
      .map((s) => s.trim())
      .filter(Boolean);
    if (ids.length < 2) {
      setError('Please provide at least 2 estimate IDs.');
      return;
    }
    setLoading(true);
    setError('');
    setResult(null);
    try {
      const res = await apiClient.aiCompareEstimates(ids);
      if (res.success) {
        setResult(res.data);
      } else {
        setError(res.error || 'Comparison failed.');
      }
    } catch (err: any) {
      setError(err?.message || 'An unexpected error occurred.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-4">
      <div>
        <Label className="mb-1.5">Estimate IDs (comma or newline separated)</Label>
        <Textarea
          rows={3}
          value={idsText}
          onChange={(e) => setIdsText(e.target.value)}
          placeholder={"estimate-id-1\nestimate-id-2\nestimate-id-3"}
        />
        <p className="text-xs text-muted-foreground mt-1">
          Enter at least 2 estimate IDs to compare.
        </p>
      </div>

      {error && (
        <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 p-3 rounded-lg">
          <AlertTriangle className="h-4 w-4 shrink-0" />
          {error}
        </div>
      )}

      {result && (
        <div className="border rounded-lg p-4 bg-muted/20 space-y-3">
          <h4 className="font-medium flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-green-600" /> Comparison Results
          </h4>
          {result.summary && (
            <p className="text-sm text-muted-foreground">{result.summary}</p>
          )}
          {result.differences && Array.isArray(result.differences) && (
            <div>
              <p className="text-sm font-medium mb-1">Key Differences</p>
              <div className="space-y-1">
                {result.differences.map((d: any, i: number) => (
                  <div key={i} className="text-sm border rounded p-2 bg-white">
                    {typeof d === 'string' ? d : d.description || d.item || JSON.stringify(d)}
                  </div>
                ))}
              </div>
            </div>
          )}
          {result.anomalies && Array.isArray(result.anomalies) && result.anomalies.length > 0 && (
            <div>
              <p className="text-sm font-medium mb-1 text-amber-700">Anomalies</p>
              <ul className="text-sm space-y-1 list-disc list-inside text-amber-600">
                {result.anomalies.map((a: any, i: number) => (
                  <li key={i}>{typeof a === 'string' ? a : a.description || JSON.stringify(a)}</li>
                ))}
              </ul>
            </div>
          )}
          {/* Fallback */}
          {!result.differences && !result.summary && (
            <pre className="text-xs bg-muted p-3 rounded overflow-x-auto">
              {JSON.stringify(result, null, 2)}
            </pre>
          )}
        </div>
      )}

      <div className="flex justify-end gap-2">
        <Button variant="outline" onClick={onClose}>
          Close
        </Button>
        <Button onClick={run} disabled={loading} className="gap-2">
          {loading ? (
            <><Loader2 className="h-4 w-4 animate-spin" /> Comparing...</>
          ) : (
            <><GitCompare className="h-4 w-4" /> Compare</>
          )}
        </Button>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Benchmark Panel
// ---------------------------------------------------------------------------

function BenchmarkPanel({
  onClose,
}: {
  onClose: () => void;
}) {
  const [estimateId, setEstimateId] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState('');

  async function run() {
    if (!estimateId.trim()) return;
    setLoading(true);
    setError('');
    setResult(null);
    try {
      const res = await apiClient.aiBenchmark(estimateId.trim());
      if (res.success) {
        setResult(res.data);
      } else {
        setError(res.error || 'Benchmarking failed.');
      }
    } catch (err: any) {
      setError(err?.message || 'An unexpected error occurred.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-4">
      <div>
        <Label className="mb-1.5">Estimate ID</Label>
        <Input
          value={estimateId}
          onChange={(e) => setEstimateId(e.target.value)}
          placeholder="Enter the ID of the estimate to benchmark"
        />
      </div>

      {error && (
        <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 p-3 rounded-lg">
          <AlertTriangle className="h-4 w-4 shrink-0" />
          {error}
        </div>
      )}

      {result && (
        <div className="border rounded-lg p-4 bg-muted/20 space-y-3">
          <h4 className="font-medium flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-green-600" /> Benchmark Results
          </h4>
          {result.score != null && (
            <div className="bg-white rounded-lg p-3 text-center border">
              <p className="text-2xl font-bold text-blue-600">{result.score}/100</p>
              <p className="text-xs text-muted-foreground">Benchmark Score</p>
            </div>
          )}
          {result.percentile != null && (
            <div className="bg-white rounded-lg p-3 text-center border">
              <p className="text-2xl font-bold text-purple-600">{result.percentile}th</p>
              <p className="text-xs text-muted-foreground">Percentile</p>
            </div>
          )}
          {result.comparisons && Array.isArray(result.comparisons) && (
            <div>
              <p className="text-sm font-medium mb-1">Category Comparisons</p>
              <div className="space-y-2">
                {result.comparisons.map((c: any, i: number) => (
                  <div key={i} className="flex items-center justify-between text-sm border rounded p-2 bg-white">
                    <span>{c.category || c.name || `Item ${i + 1}`}</span>
                    <div className="flex items-center gap-2">
                      {c.yourCost != null && <span className="font-medium">${Number(c.yourCost).toLocaleString()}</span>}
                      {c.benchmark != null && (
                        <span className="text-muted-foreground">vs ${Number(c.benchmark).toLocaleString()}</span>
                      )}
                      {c.variance != null && (
                        <Badge
                          variant="secondary"
                          className={c.variance > 0 ? 'text-red-700 bg-red-50' : 'text-green-700 bg-green-50'}
                        >
                          {c.variance > 0 ? '+' : ''}{c.variance}%
                        </Badge>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
          {result.recommendations && Array.isArray(result.recommendations) && (
            <div>
              <p className="text-sm font-medium mb-1">Recommendations</p>
              <ul className="text-sm space-y-1 list-disc list-inside text-muted-foreground">
                {result.recommendations.map((r: any, i: number) => (
                  <li key={i}>{typeof r === 'string' ? r : r.description || JSON.stringify(r)}</li>
                ))}
              </ul>
            </div>
          )}
          {/* Fallback */}
          {result.score == null && result.percentile == null && !result.comparisons && (
            <pre className="text-xs bg-muted p-3 rounded overflow-x-auto">
              {JSON.stringify(result, null, 2)}
            </pre>
          )}
        </div>
      )}

      <div className="flex justify-end gap-2">
        <Button variant="outline" onClick={onClose}>
          Close
        </Button>
        <Button onClick={run} disabled={loading || !estimateId.trim()} className="gap-2">
          {loading ? (
            <><Loader2 className="h-4 w-4 animate-spin" /> Benchmarking...</>
          ) : (
            <><BarChart3 className="h-4 w-4" /> Run Benchmark</>
          )}
        </Button>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main Page
// ---------------------------------------------------------------------------

export default function AIToolsPage() {
  const [activeTool, setActiveTool] = useState<ToolId | null>(null);

  function renderPanel() {
    switch (activeTool) {
      case 'scope-analysis':
        return <ScopeAnalysisPanel onClose={() => setActiveTool(null)} />;
      case 'cost-prediction':
        return <CostPredictionPanel onClose={() => setActiveTool(null)} />;
      case 'value-engineering':
        return <ValueEngineeringPanel onClose={() => setActiveTool(null)} />;
      case 'compare-estimates':
        return <CompareEstimatesPanel onClose={() => setActiveTool(null)} />;
      case 'benchmark':
        return <BenchmarkPanel onClose={() => setActiveTool(null)} />;
      default:
        return null;
    }
  }

  const activeConfig = AI_TOOLS.find((t) => t.id === activeTool);

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center gap-3">
        <div className="p-3 rounded-xl bg-purple-100">
          <Brain className="h-6 w-6 text-purple-600" />
        </div>
        <div>
          <h1 className="text-3xl font-bold">AI Tools</h1>
          <p className="text-muted-foreground">
            AI-powered estimation analysis and optimization tools
          </p>
        </div>
      </div>

      {/* AI Takeoff Quick Link */}
      <Card className="border-purple-200 bg-gradient-to-r from-purple-50 to-indigo-50">
        <CardContent className="p-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="p-2.5 rounded-xl bg-purple-100">
                <Wand2 className="h-6 w-6 text-purple-600" />
              </div>
              <div>
                <h3 className="font-semibold text-lg">AI Takeoff</h3>
                <p className="text-sm text-muted-foreground">
                  Upload project plans for automatic quantity extraction using AI
                </p>
              </div>
            </div>
            <Button asChild className="gap-2">
              <Link href="/estimation/ai-takeoff">
                Open AI Takeoff <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Tools Grid */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {AI_TOOLS.map((tool) => {
          const Icon = tool.icon;
          return (
            <Card
              key={tool.id}
              className={cn(
                'cursor-pointer transition-all hover:shadow-md',
                activeTool === tool.id && 'ring-2 ring-primary'
              )}
              onClick={() => setActiveTool(activeTool === tool.id ? null : tool.id)}
            >
              <CardContent className="p-5">
                <div className="flex items-start gap-3">
                  <div className={cn('p-2.5 rounded-xl shrink-0', tool.bgColor)}>
                    <Icon className={cn('h-5 w-5', tool.color)} />
                  </div>
                  <div className="min-w-0">
                    <h3 className="font-semibold mb-1">{tool.title}</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      {tool.description}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Active Tool Panel */}
      {activeTool && activeConfig && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2 text-lg">
                <activeConfig.icon className={cn('h-5 w-5', activeConfig.color)} />
                {activeConfig.title}
              </CardTitle>
              <button
                onClick={() => setActiveTool(null)}
                className="p-1 rounded hover:bg-muted transition-colors"
              >
                <X className="h-4 w-4 text-muted-foreground" />
              </button>
            </div>
            <CardDescription>{activeConfig.description}</CardDescription>
          </CardHeader>
          <CardContent>{renderPanel()}</CardContent>
        </Card>
      )}
    </div>
  );
}
