'use client';

import { useState, useEffect, useRef } from 'react';
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
import {
  Upload,
  FileText,
  Loader2,
  Ruler,
  CheckCircle,
  AlertCircle,
  Clock,
  BarChart3,
  Plus,
  Eye,
  X,
} from 'lucide-react';
import { formatCurrency } from '@estimation/lib/utils';
import { apiClient } from '@estimation/lib/api';

interface TakeoffSession {
  id: string;
  name: string;
  planId?: string;
  status: 'uploading' | 'processing' | 'ready' | 'completed' | 'error';
  measurements?: Measurement[];
  createdAt: string;
  summary?: TakeoffSummary;
}

interface Measurement {
  id: string;
  description: string;
  type: string;
  value: number;
  unit: string;
  location?: string;
  floor?: string;
}

interface TakeoffSummary {
  totalMeasurements: number;
  byType: Record<string, number>;
  totalArea?: number;
  totalVolume?: number;
  totalLength?: number;
}

const statusConfig: Record<string, { label: string; icon: any; color: string }> = {
  uploading: { label: 'Uploading', icon: Upload, color: 'bg-blue-100 text-blue-700' },
  processing: { label: 'Processing', icon: Clock, color: 'bg-yellow-100 text-yellow-700' },
  ready: { label: 'Ready', icon: CheckCircle, color: 'bg-green-100 text-green-700' },
  completed: { label: 'Completed', icon: CheckCircle, color: 'bg-green-100 text-green-700' },
  error: { label: 'Error', icon: AlertCircle, color: 'bg-red-100 text-red-700' },
};

export default function TakeoffPage() {
  const [takeoffs, setTakeoffs] = useState<TakeoffSession[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [expandedSummary, setExpandedSummary] = useState<TakeoffSummary | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    async function fetchTakeoffs() {
      setIsLoading(true);
      try {
        const res = await apiClient.getTakeoffs();
        if (res.success && res.data) {
          const data = res.data as any;
          const items = Array.isArray(data) ? data : (data.takeoffs || data.items || []);
          setTakeoffs(items);
        }
      } catch {
        // fallback
      } finally {
        setIsLoading(false);
      }
    }
    fetchTakeoffs();
  }, []);

  const handleFileUpload = async (files: FileList | null) => {
    if (!files || files.length === 0) return;

    setIsUploading(true);
    try {
      for (const file of Array.from(files)) {
        const response = await apiClient.uploadPlan(file);
        if (response?.id || response?.data?.id) {
          const newTakeoff: TakeoffSession = {
            id: response.id || response.data.id,
            name: file.name,
            planId: response.planId || response.data?.planId,
            status: 'processing',
            createdAt: new Date().toISOString(),
          };
          setTakeoffs((prev) => [newTakeoff, ...prev]);

          // Auto-extract quantities
          if (newTakeoff.planId) {
            const extractRes = await apiClient.extractQuantities(newTakeoff.planId);
            if (extractRes.success) {
              setTakeoffs((prev) =>
                prev.map((t) =>
                  t.id === newTakeoff.id ? { ...t, status: 'ready' as const } : t
                )
              );
            }
          }
        }
      }
    } catch {
      // Error handling
    } finally {
      setIsUploading(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    handleFileUpload(e.dataTransfer.files);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = () => setIsDragOver(false);

  const viewSummary = async (takeoffId: string) => {
    if (expandedId === takeoffId) {
      setExpandedId(null);
      setExpandedSummary(null);
      return;
    }
    setExpandedId(takeoffId);
    try {
      const res = await apiClient.getTakeoffSummary(takeoffId);
      if (res.success && res.data) {
        setExpandedSummary(res.data as TakeoffSummary);
      }
    } catch {
      setExpandedSummary(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold">Takeoff</h1>
        <p className="text-muted-foreground mt-1">
          Upload project plans and extract quantities automatically
        </p>
      </div>

      {/* Upload Area */}
      <Card>
        <CardContent className="p-6">
          <div
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onClick={() => fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-xl p-12 text-center cursor-pointer transition-colors ${
              isDragOver
                ? 'border-primary bg-primary/5'
                : 'border-muted-foreground/25 hover:border-primary/50 hover:bg-muted/30'
            }`}
          >
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept=".pdf,.png,.jpg,.jpeg,.tiff,.dwg"
              onChange={(e) => handleFileUpload(e.target.files)}
              className="hidden"
            />
            {isUploading ? (
              <div>
                <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">Uploading & Processing...</h3>
                <p className="text-muted-foreground">Analyzing your project plans with AI</p>
              </div>
            ) : (
              <div>
                <Upload className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">Upload Project Plans</h3>
                <p className="text-muted-foreground mb-4">
                  Drag and drop PDF, images, or CAD files here, or click to browse
                </p>
                <div className="flex flex-wrap justify-center gap-2 text-xs text-muted-foreground">
                  <Badge variant="outline">PDF</Badge>
                  <Badge variant="outline">PNG</Badge>
                  <Badge variant="outline">JPG</Badge>
                  <Badge variant="outline">TIFF</Badge>
                  <Badge variant="outline">DWG</Badge>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Takeoff Sessions */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-lg">Takeoff Sessions</CardTitle>
              <CardDescription>
                {isLoading ? 'Loading...' : `${takeoffs.length} session${takeoffs.length !== 1 ? 's' : ''}`}
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground mr-3" />
              <span className="text-muted-foreground">Loading takeoff sessions...</span>
            </div>
          ) : takeoffs.length > 0 ? (
            <div className="space-y-3">
              {takeoffs.map((takeoff) => {
                const status = statusConfig[takeoff.status] || statusConfig.error;
                const StatusIcon = status.icon;
                const isExpanded = expandedId === takeoff.id;

                return (
                  <div key={takeoff.id}>
                    <div className="border rounded-lg p-4 hover:bg-accent/30 transition-colors">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className="h-10 w-10 rounded-lg bg-muted flex items-center justify-center">
                            <FileText className="h-5 w-5 text-muted-foreground" />
                          </div>
                          <div>
                            <p className="font-medium">{takeoff.name}</p>
                            <p className="text-sm text-muted-foreground">
                              Uploaded {new Date(takeoff.createdAt).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-medium ${status.color}`}>
                            <StatusIcon className="h-3.5 w-3.5" />
                            {status.label}
                          </div>
                          {(takeoff.status === 'ready' || takeoff.status === 'completed') && (
                            <div className="flex gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => viewSummary(takeoff.id)}
                              >
                                {isExpanded ? (
                                  <X className="mr-1 h-4 w-4" />
                                ) : (
                                  <Eye className="mr-1 h-4 w-4" />
                                )}
                                {isExpanded ? 'Close' : 'View'}
                              </Button>
                              <Button variant="outline" size="sm" asChild>
                                <Link href={`/estimates/new?takeoffId=${takeoff.id}`}>
                                  <Plus className="mr-1 h-4 w-4" />
                                  Create Estimate
                                </Link>
                              </Button>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Expanded Summary */}
                    {isExpanded && expandedSummary && (
                      <div className="ml-14 mt-2 border rounded-lg p-4 bg-muted/20">
                        <h4 className="font-medium mb-3 flex items-center gap-2">
                          <BarChart3 className="h-4 w-4" />
                          Takeoff Summary
                        </h4>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                          <div className="bg-background rounded-lg p-3 border">
                            <p className="text-sm text-muted-foreground">Measurements</p>
                            <p className="text-xl font-bold">{expandedSummary.totalMeasurements}</p>
                          </div>
                          {expandedSummary.totalArea && (
                            <div className="bg-background rounded-lg p-3 border">
                              <p className="text-sm text-muted-foreground">Total Area</p>
                              <p className="text-xl font-bold">{expandedSummary.totalArea.toLocaleString()} SF</p>
                            </div>
                          )}
                          {expandedSummary.totalLength && (
                            <div className="bg-background rounded-lg p-3 border">
                              <p className="text-sm text-muted-foreground">Total Length</p>
                              <p className="text-xl font-bold">{expandedSummary.totalLength.toLocaleString()} LF</p>
                            </div>
                          )}
                          {expandedSummary.totalVolume && (
                            <div className="bg-background rounded-lg p-3 border">
                              <p className="text-sm text-muted-foreground">Total Volume</p>
                              <p className="text-xl font-bold">{expandedSummary.totalVolume.toLocaleString()} CY</p>
                            </div>
                          )}
                        </div>
                        {expandedSummary.byType && Object.keys(expandedSummary.byType).length > 0 && (
                          <div>
                            <p className="text-sm font-medium mb-2">By Measurement Type</p>
                            <div className="flex flex-wrap gap-2">
                              {Object.entries(expandedSummary.byType).map(([type, count]) => (
                                <Badge key={type} variant="secondary">
                                  {type}: {count}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-12">
              <Ruler className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">No takeoff sessions yet</h3>
              <p className="text-muted-foreground mb-4">
                Upload project plans to start extracting quantities
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
