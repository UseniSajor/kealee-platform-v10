// packages/ui/src/components/marketing/TrustBar.tsx
// Reusable trust strip for marketing pages

'use client';

import React from 'react';
import { cn } from '../../lib/utils';

export interface TrustBarProps {
  items?: string[];
  variant?: 'light' | 'dark';
  className?: string;
}

const defaultTrustItems = [
  'Licensed & Insured',
  '20+ Years Experience',
  'DC-Baltimore Corridor',
  'Escrow Protected',
];

export const TrustBar: React.FC<TrustBarProps> = ({
  items = defaultTrustItems,
  variant = 'light',
  className,
}) => {
  return (
    <div
      className={cn(
        'flex flex-wrap items-center justify-center gap-2 text-sm',
        variant === 'light' ? 'text-gray-500' : 'text-gray-300',
        className
      )}
    >
      {items.map((item, index) => (
        <React.Fragment key={index}>
          <span className="whitespace-nowrap">{item}</span>
          {index < items.length - 1 && (
            <span className={cn(
              'mx-2',
              variant === 'light' ? 'text-gray-300' : 'text-gray-500'
            )}>
              •
            </span>
          )}
        </React.Fragment>
      ))}
    </div>
  );
};

export default TrustBar;
