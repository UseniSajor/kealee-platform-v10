// packages/ui/src/components/construction/EstimateBreakdown.tsx
// Estimate breakdown component with CSI division line items

import React, { useState } from 'react';
import { cn } from '../../lib/utils';
import { ChevronDown, ChevronRight, FileText, Info } from 'lucide-react';

export interface EstimateLineItem {
  id: string;
  division: string;
  description: string;
  quantity: number;
  unit: string;
  unitCost: number;
  totalCost: number;
}

export interface EstimateDivision {
  code: string;
  name: string;
  items: EstimateLineItem[];
  subtotal: number;
}

export interface EstimateBreakdownProps {
  estimateNumber?: string;
  status?: 'DRAFT' | 'REVIEW' | 'APPROVED' | 'SENT';
  lowRange: number;
  midRange: number;
  highRange: number;
  confidence?: number; // 0–1
  contingencyPct?: number;
  divisions?: EstimateDivision[];
  className?: string;
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(amount);
}

const STATUS_CONFIG = {
  DRAFT: { label: 'Draft', className: 'bg-gray-100 text-gray-600' },
  REVIEW: { label: 'In Review', className: 'bg-warning-100 text-warning-700' },
  APPROVED: { label: 'Approved', className: 'bg-success-100 text-success-700' },
  SENT: { label: 'Sent', className: 'bg-primary-100 text-primary-700' },
};

export function EstimateBreakdown({
  estimateNumber,
  status = 'DRAFT',
  lowRange,
  midRange,
  highRange,
  confidence = 0.85,
  contingencyPct = 10,
  divisions = [],
  className,
}: EstimateBreakdownProps) {
  const [expandedDivisions, setExpandedDivisions] = useState<Set<string>>(new Set());

  const toggleDivision = (code: string) => {
    setExpandedDivisions((prev) => {
      const next = new Set(prev);
      next.has(code) ? next.delete(code) : next.add(code);
      return next;
    });
  };

  const statusConfig = STATUS_CONFIG[status];

  return (
    <div className={cn('bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden', className)}>
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
        <div className="flex items-center gap-2">
          <FileText className="w-5 h-5 text-gray-400" />
          <div>
            {estimateNumber && (
              <p className="text-xs text-gray-500 font-mono">{estimateNumber}</p>
            )}
            <h3 className="font-semibold text-gray-900">Cost Estimate</h3>
          </div>
        </div>
        <span className={cn('px-2.5 py-1 rounded-full text-xs font-medium', statusConfig.className)}>
          {statusConfig.label}
        </span>
      </div>

      {/* Range display */}
      <div className="px-5 py-4 bg-gray-50 border-b border-gray-100">
        <div className="grid grid-cols-3 gap-4">
          <div className="text-center">
            <p className="text-xs text-gray-500 mb-0.5">Low</p>
            <p className="text-lg font-bold text-success-700">{formatCurrency(lowRange)}</p>
          </div>
          <div className="text-center border-x border-gray-200">
            <p className="text-xs text-gray-500 mb-0.5">Most Likely</p>
            <p className="text-xl font-bold text-gray-900">{formatCurrency(midRange)}</p>
          </div>
          <div className="text-center">
            <p className="text-xs text-gray-500 mb-0.5">High</p>
            <p className="text-lg font-bold text-warning-700">{formatCurrency(highRange)}</p>
          </div>
        </div>

        {/* Confidence bar */}
        <div className="mt-3">
          <div className="flex items-center justify-between text-xs text-gray-500 mb-1">
            <div className="flex items-center gap-1">
              <Info className="w-3 h-3" />
              <span>Confidence</span>
            </div>
            <span className="font-medium">{Math.round(confidence * 100)}%</span>
          </div>
          <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
            <div
              className={cn(
                'h-full rounded-full',
                confidence >= 0.8 ? 'bg-success-500' : confidence >= 0.6 ? 'bg-warning-500' : 'bg-error-400'
              )}
              style={{ width: `${confidence * 100}%` }}
            />
          </div>
        </div>

        {contingencyPct > 0 && (
          <p className="text-xs text-gray-500 mt-2">
            Includes {contingencyPct}% contingency · Mid-range estimate
          </p>
        )}
      </div>

      {/* Division breakdown */}
      {divisions.length > 0 && (
        <div>
          <div className="px-5 py-2 bg-gray-50 border-b border-gray-100">
            <div className="grid grid-cols-12 gap-2 text-xs font-semibold text-gray-500 uppercase tracking-wide">
              <div className="col-span-1">Div</div>
              <div className="col-span-5">Description</div>
              <div className="col-span-2 text-right">Qty</div>
              <div className="col-span-2 text-right">Unit $</div>
              <div className="col-span-2 text-right">Total</div>
            </div>
          </div>

          {divisions.map((division) => {
            const isExpanded = expandedDivisions.has(division.code);
            return (
              <div key={division.code} className="border-b border-gray-100 last:border-0">
                {/* Division row */}
                <button
                  onClick={() => toggleDivision(division.code)}
                  className="w-full px-5 py-3 flex items-center gap-2 hover:bg-gray-50 transition-colors"
                >
                  {isExpanded ? (
                    <ChevronDown className="w-4 h-4 text-gray-400 shrink-0" />
                  ) : (
                    <ChevronRight className="w-4 h-4 text-gray-400 shrink-0" />
                  )}
                  <div className="grid grid-cols-12 gap-2 flex-1 text-sm">
                    <span className="col-span-1 font-mono text-xs text-gray-500">{division.code}</span>
                    <span className="col-span-7 font-semibold text-gray-900 text-left">{division.name}</span>
                    <span className="col-span-4 text-right font-semibold text-gray-900">
                      {formatCurrency(division.subtotal)}
                    </span>
                  </div>
                </button>

                {/* Line items */}
                {isExpanded && division.items.map((item) => (
                  <div key={item.id} className="px-5 py-2 bg-gray-50/50 grid grid-cols-12 gap-2 text-xs">
                    <div className="col-span-1" />
                    <div className="col-span-5 text-gray-700">{item.description}</div>
                    <div className="col-span-2 text-right text-gray-600">
                      {item.quantity} {item.unit}
                    </div>
                    <div className="col-span-2 text-right text-gray-600">
                      {formatCurrency(item.unitCost)}
                    </div>
                    <div className="col-span-2 text-right font-medium text-gray-800">
                      {formatCurrency(item.totalCost)}
                    </div>
                  </div>
                ))}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
