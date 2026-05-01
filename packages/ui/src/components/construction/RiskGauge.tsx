// packages/ui/src/components/construction/RiskGauge.tsx
// AI Prediction / Risk Gauge — delay risk card with confidence bar

import React from 'react';
import { cn } from '../../lib/utils';
import { AlertTriangle, ChevronRight, X, Zap } from 'lucide-react';

export type RiskLevel = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export interface RiskCause {
  description: string;
  impactPct: number; // 0–100 contribution
  icon?: React.ReactNode;
}

export interface RiskRecommendation {
  text: string;
  onAction?: () => void;
}

export interface RiskGaugeProps {
  title?: string;
  riskLevel: RiskLevel;
  confidencePct: number; // 0–100
  causes?: RiskCause[];
  recommendations?: RiskRecommendation[];
  onViewAnalysis?: () => void;
  onTakeAction?: () => void;
  onDismiss?: () => void;
  className?: string;
}

const RISK_CONFIG: Record<RiskLevel, { label: string; bg: string; border: string; badge: string; bar: string }> = {
  LOW: {
    label: 'Low',
    bg: 'bg-success-50',
    border: 'border-success-200',
    badge: 'bg-success-100 text-success-700',
    bar: 'from-success-400 to-success-500',
  },
  MEDIUM: {
    label: 'Medium',
    bg: 'bg-warning-50',
    border: 'border-warning-200',
    badge: 'bg-warning-100 text-warning-700',
    bar: 'from-warning-400 to-warning-500',
  },
  HIGH: {
    label: 'High',
    bg: 'bg-error-50',
    border: 'border-error-200',
    badge: 'bg-error-100 text-error-700',
    bar: 'from-error-400 to-error-500',
  },
  CRITICAL: {
    label: 'Critical',
    bg: 'bg-error-50',
    border: 'border-error-300',
    badge: 'bg-error-600 text-white',
    bar: 'from-error-500 to-error-600',
  },
};

export function RiskGauge({
  title = 'Delay Risk Detected',
  riskLevel,
  confidencePct,
  causes = [],
  recommendations = [],
  onViewAnalysis,
  onTakeAction,
  onDismiss,
  className,
}: RiskGaugeProps) {
  const config = RISK_CONFIG[riskLevel];

  return (
    <div className={cn('rounded-xl border shadow-sm overflow-hidden', config.bg, config.border, className)}>
      {/* Header */}
      <div className="flex items-start justify-between p-4 pb-3">
        <div className="flex items-center gap-2">
          <AlertTriangle
            className={cn(
              'w-5 h-5 shrink-0',
              riskLevel === 'LOW' ? 'text-success-600' :
              riskLevel === 'MEDIUM' ? 'text-warning-600' : 'text-error-600'
            )}
          />
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider flex items-center gap-1.5">
              <Zap className="w-3 h-3" /> AI Prediction
            </p>
            <h3 className="font-bold text-gray-900 text-sm mt-0.5">{title}</h3>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className={cn('px-2.5 py-1 rounded-full text-xs font-bold', config.badge)}>
            {config.label.toUpperCase()} ({confidencePct}%)
          </span>
          {onDismiss && (
            <button onClick={onDismiss} className="text-gray-400 hover:text-gray-600 transition-colors">
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Confidence bar */}
      <div className="px-4 pb-3">
        <div className="flex items-center justify-between mb-1">
          <span className="text-xs text-gray-500">Confidence</span>
          <span className="text-xs font-semibold text-gray-700">{confidencePct}%</span>
        </div>
        <div className="h-2 bg-white/60 rounded-full overflow-hidden">
          <div
            className={cn('h-full rounded-full bg-gradient-to-r transition-all duration-700', config.bar)}
            style={{ width: `${confidencePct}%` }}
          />
        </div>
      </div>

      {/* Root causes */}
      {causes.length > 0 && (
        <div className="px-4 pb-3">
          <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-2">Root Causes</p>
          <ol className="space-y-1.5">
            {causes.map((cause, i) => (
              <li key={i} className="flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-white/80 border border-gray-200 flex items-center justify-center text-xs font-bold text-gray-600 shrink-0">
                  {i + 1}
                </span>
                {cause.icon && <span className="text-gray-500">{cause.icon}</span>}
                <span className="text-sm text-gray-700 flex-1">{cause.description}</span>
                <span className="text-xs font-semibold text-gray-500">{cause.impactPct}%</span>
              </li>
            ))}
          </ol>
        </div>
      )}

      {/* Recommendations */}
      {recommendations.length > 0 && (
        <div className="px-4 pb-3">
          <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-2">Recommendations</p>
          <ul className="space-y-1">
            {recommendations.map((rec, i) => (
              <li
                key={i}
                className={cn(
                  'flex items-center gap-2 text-sm text-gray-700 py-1 px-2 rounded-md',
                  rec.onAction && 'hover:bg-white/60 cursor-pointer transition-colors'
                )}
                onClick={rec.onAction}
              >
                <ChevronRight className="w-4 h-4 text-primary-600 shrink-0" />
                {rec.text}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Actions */}
      {(onViewAnalysis || onTakeAction || onDismiss) && (
        <div className="flex items-center gap-2 px-4 py-3 border-t border-white/40 bg-white/30">
          {onViewAnalysis && (
            <button
              onClick={onViewAnalysis}
              className="text-sm text-gray-600 hover:text-gray-900 px-3 py-1.5 rounded-md hover:bg-white/60 transition-colors"
            >
              View Full Analysis
            </button>
          )}
          {onTakeAction && (
            <button
              onClick={onTakeAction}
              className="ml-auto text-sm bg-primary-600 hover:bg-primary-700 text-white px-4 py-1.5 rounded-lg font-semibold transition-colors shadow-sm"
            >
              Take Action
            </button>
          )}
        </div>
      )}
    </div>
  );
}
