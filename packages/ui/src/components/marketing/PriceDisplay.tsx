'use client';

import { brand } from './brand';

export interface PriceDisplayProps {
  amount: number | string;
  period?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  color?: 'orange' | 'navy' | 'teal' | 'white';
  showFrom?: boolean;
  className?: string;
}

const sizeConfig = {
  sm: 'text-lg',
  md: 'text-2xl',
  lg: 'text-4xl',
  xl: 'text-5xl',
};

const colorMap = {
  orange: brand.orange,
  navy: brand.navy,
  teal: brand.teal,
  white: '#FFFFFF',
};

export function PriceDisplay({
  amount,
  period,
  size = 'md',
  color = 'orange',
  showFrom = false,
  className = '',
}: PriceDisplayProps) {
  // Format amount with commas and dollar sign
  const formattedAmount = typeof amount === 'number'
    ? amount.toLocaleString('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0 })
    : `$${amount}`;

  return (
    <span
      className={`inline-flex items-baseline gap-1 font-bold ${sizeConfig[size]} ${className}`}
      style={{ fontFamily: '"JetBrains Mono", monospace', color: colorMap[color] }}
    >
      {showFrom && <span className="text-[0.5em] font-normal opacity-70">from</span>}
      <span>{formattedAmount}</span>
      {period && (
        <span className="text-[0.4em] font-normal opacity-70">/{period}</span>
      )}
    </span>
  );
}
