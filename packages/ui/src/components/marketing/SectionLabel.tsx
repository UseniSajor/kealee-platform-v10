'use client';

import { brand } from './brand';

export interface SectionLabelProps {
  text: string;
  color?: 'navy' | 'teal' | 'orange' | 'green' | 'gray';
  className?: string;
}

const colorMap = {
  navy: brand.navy,
  teal: brand.teal,
  orange: brand.orange,
  green: brand.success,
  gray: brand.gray[500],
};

export function SectionLabel({ text, color = 'teal', className = '' }: SectionLabelProps) {
  return (
    <span
      className={`inline-block text-[13px] font-semibold uppercase tracking-[0.1em] ${className}`}
      style={{ color: colorMap[color], fontFamily: '"Plus Jakarta Sans", sans-serif' }}
    >
      {text}
    </span>
  );
}
