// packages/ui/src/components/marketing/SectionLabel.tsx
// Uppercase section label with colored accent

'use client';

import React from 'react';
import { cn } from '../../lib/utils';

export interface SectionLabelProps {
  text: string;
  color?: 'navy' | 'orange' | 'teal' | 'green' | 'gray';
  className?: string;
}

const colorClasses = {
  navy: 'text-[#4A90D9]',
  orange: 'text-[#E8793A]',
  teal: 'text-[#2ABFBF]',
  green: 'text-[#38A169]',
  gray: 'text-gray-500',
};

export const SectionLabel: React.FC<SectionLabelProps> = ({
  text,
  color = 'gray',
  className,
}) => {
  return (
    <span
      className={cn(
        'text-[13px] font-semibold uppercase tracking-[0.1em]',
        colorClasses[color],
        className
      )}
    >
      {text}
    </span>
  );
};

export default SectionLabel;
