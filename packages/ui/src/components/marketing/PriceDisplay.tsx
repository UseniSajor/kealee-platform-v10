// packages/ui/src/components/marketing/PriceDisplay.tsx
// Price display component with JetBrains Mono font

'use client';

import React from 'react';
import { cn } from '../../lib/utils';

export interface PriceDisplayProps {
  amount: number | string;
  period?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  color?: 'orange' | 'navy' | 'teal' | 'green' | 'gray';
  showCurrency?: boolean;
  className?: string;
}

const sizeClasses = {
  sm: 'text-lg',
  md: 'text-2xl',
  lg: 'text-4xl',
  xl: 'text-5xl',
};

const periodSizes = {
  sm: 'text-xs',
  md: 'text-sm',
  lg: 'text-base',
  xl: 'text-lg',
};

const colorClasses = {
  orange: 'text-[#E8793A]',
  navy: 'text-[#1A2B4A]',
  teal: 'text-[#2ABFBF]',
  green: 'text-[#38A169]',
  gray: 'text-gray-700',
};

export const PriceDisplay: React.FC<PriceDisplayProps> = ({
  amount,
  period,
  size = 'md',
  color = 'orange',
  showCurrency = true,
  className,
}) => {
  const formattedAmount = typeof amount === 'number'
    ? amount.toLocaleString('en-US')
    : amount;

  return (
    <span
      className={cn(
        'font-mono font-bold',
        sizeClasses[size],
        colorClasses[color],
        className
      )}
      style={{ fontFamily: '"JetBrains Mono", monospace' }}
    >
      {showCurrency && '$'}
      {formattedAmount}
      {period && (
        <span className={cn('font-normal text-gray-500', periodSizes[size])}>
          /{period}
        </span>
      )}
    </span>
  );
};

export default PriceDisplay;
