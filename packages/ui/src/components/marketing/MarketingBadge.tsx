// packages/ui/src/components/marketing/MarketingBadge.tsx
// Pill-shaped status/category badge for marketing

'use client';

import React from 'react';
import { cn } from '../../lib/utils';

export interface MarketingBadgeProps {
  text: string;
  color?: 'navy' | 'orange' | 'teal' | 'green' | 'gray' | 'purple' | 'red';
  size?: 'sm' | 'md' | 'lg';
  variant?: 'solid' | 'outline' | 'soft';
  className?: string;
}

const colorConfig = {
  navy: {
    solid: 'bg-[#1A2B4A] text-white',
    outline: 'border-[#1A2B4A] text-[#1A2B4A]',
    soft: 'bg-[#1A2B4A]/10 text-[#1A2B4A]',
  },
  orange: {
    solid: 'bg-[#E8793A] text-white',
    outline: 'border-[#E8793A] text-[#E8793A]',
    soft: 'bg-[#E8793A]/10 text-[#E8793A]',
  },
  teal: {
    solid: 'bg-[#2ABFBF] text-white',
    outline: 'border-[#2ABFBF] text-[#2ABFBF]',
    soft: 'bg-[#2ABFBF]/10 text-[#2ABFBF]',
  },
  green: {
    solid: 'bg-[#38A169] text-white',
    outline: 'border-[#38A169] text-[#38A169]',
    soft: 'bg-[#38A169]/10 text-[#38A169]',
  },
  gray: {
    solid: 'bg-gray-500 text-white',
    outline: 'border-gray-400 text-gray-600',
    soft: 'bg-gray-100 text-gray-600',
  },
  purple: {
    solid: 'bg-purple-600 text-white',
    outline: 'border-purple-500 text-purple-600',
    soft: 'bg-purple-100 text-purple-700',
  },
  red: {
    solid: 'bg-red-500 text-white',
    outline: 'border-red-500 text-red-600',
    soft: 'bg-red-50 text-red-600',
  },
};

const sizeClasses = {
  sm: 'px-2 py-0.5 text-xs',
  md: 'px-3 py-1 text-sm',
  lg: 'px-4 py-1.5 text-base',
};

export const MarketingBadge: React.FC<MarketingBadgeProps> = ({
  text,
  color = 'gray',
  size = 'md',
  variant = 'soft',
  className,
}) => {
  return (
    <span
      className={cn(
        'inline-flex items-center justify-center font-medium rounded-full',
        variant === 'outline' && 'border-2 bg-transparent',
        colorConfig[color][variant],
        sizeClasses[size],
        className
      )}
    >
      {text}
    </span>
  );
};

export default MarketingBadge;
