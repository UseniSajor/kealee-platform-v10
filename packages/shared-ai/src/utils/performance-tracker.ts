// ============================================================
// PERFORMANCE TRACKER
// Track and analyze AI engine performance
// ============================================================

import { PerformanceMetrics } from '../types';

export class PerformanceTracker {
  private metrics: PerformanceMetrics[] = [];

  /**
   * Record performance metric
   */
  record(metric: PerformanceMetrics): void {
    this.metrics.push(metric);
    
    // Keep only last 10,000 metrics
    if (this.metrics.length > 10000) {
      this.metrics = this.metrics.slice(-10000);
    }
  }

  /**
   * Get performance statistics
   */
  getStats(
    engine?: string,
    jurisdictionId?: string,
    startDate?: Date,
    endDate?: Date
  ): {
    totalRequests: number;
    successfulRequests: number;
    failedRequests: number;
    avgProcessingTime: number;
    avgConfidence: number;
    successRate: number;
    p50ProcessingTime: number;
    p95ProcessingTime: number;
    p99ProcessingTime: number;
  } {
    let filtered = this.metrics;

    if (engine) {
      filtered = filtered.filter(m => m.engine === engine);
    }

    if (jurisdictionId) {
      filtered = filtered.filter(m => m.jurisdictionId === jurisdictionId);
    }

    if (startDate) {
      filtered = filtered.filter(m => m.timestamp >= startDate);
    }

    if (endDate) {
      filtered = filtered.filter(m => m.timestamp <= endDate);
    }

    const total = filtered.length;
    const successful = filtered.filter(m => m.success).length;
    const failed = total - successful;
    
    const processingTimes = filtered
      .map(m => m.processingTimeMs)
      .sort((a, b) => a - b);
    
    const confidences = filtered
      .filter(m => m.confidence !== undefined)
      .map(m => m.confidence!);

    const avgProcessingTime = processingTimes.length > 0
      ? processingTimes.reduce((a, b) => a + b, 0) / processingTimes.length
      : 0;

    const avgConfidence = confidences.length > 0
      ? confidences.reduce((a, b) => a + b, 0) / confidences.length
      : 0;

    const p50 = this.percentile(processingTimes, 50);
    const p95 = this.percentile(processingTimes, 95);
    const p99 = this.percentile(processingTimes, 99);

    return {
      totalRequests: total,
      successfulRequests: successful,
      failedRequests: failed,
      avgProcessingTime,
      avgConfidence,
      successRate: total > 0 ? successful / total : 0,
      p50ProcessingTime: p50,
      p95ProcessingTime: p95,
      p99ProcessingTime: p99
    };
  }

  /**
   * Calculate percentile
   */
  private percentile(sortedArray: number[], percentile: number): number {
    if (sortedArray.length === 0) return 0;
    const index = Math.ceil((percentile / 100) * sortedArray.length) - 1;
    return sortedArray[Math.max(0, index)] || 0;
  }

  /**
   * Get error breakdown
   */
  getErrorBreakdown(
    engine?: string,
    jurisdictionId?: string
  ): Record<string, number> {
    let filtered = this.metrics.filter(m => !m.success);

    if (engine) {
      filtered = filtered.filter(m => m.engine === engine);
    }

    if (jurisdictionId) {
      filtered = filtered.filter(m => m.jurisdictionId === jurisdictionId);
    }

    const breakdown: Record<string, number> = {};
    filtered.forEach(m => {
      const errorType = m.errorType || 'unknown';
      breakdown[errorType] = (breakdown[errorType] || 0) + 1;
    });

    return breakdown;
  }

  /**
   * Clear old metrics
   */
  clearOldMetrics(olderThanDays: number = 30): void {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - olderThanDays);
    
    this.metrics = this.metrics.filter(m => m.timestamp >= cutoff);
  }

  /**
   * Export metrics
   */
  exportMetrics(format: 'json' | 'csv' = 'json'): string {
    if (format === 'json') {
      return JSON.stringify(this.metrics, null, 2);
    }

    // CSV format
    const headers = ['requestId', 'engine', 'jurisdictionId', 'processingTimeMs', 'confidence', 'success', 'errorType', 'timestamp'];
    const rows = this.metrics.map(m => [
      m.requestId,
      m.engine,
      m.jurisdictionId || '',
      m.processingTimeMs.toString(),
      m.confidence?.toString() || '',
      m.success.toString(),
      m.errorType || '',
      m.timestamp.toISOString()
    ]);

    return [
      headers.join(','),
      ...rows.map(row => row.join(','))
    ].join('\n');
  }
}
