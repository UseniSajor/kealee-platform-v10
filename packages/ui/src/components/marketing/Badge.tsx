'use client';

import { brand } from './brand';

export interface BadgeProps {
  text: string;
  color?: 'navy' | 'teal' | 'orange' | 'green' | 'gray' | 'white';
  size?: 'sm' | 'md' | 'lg';
  variant?: 'solid' | 'outline' | 'subtle';
  className?: string;
}

const colorConfig = {
  navy: {
    solid: { bg: brand.navy, text: '#FFFFFF', border: brand.navy },
    outline: { bg: 'transparent', text: brand.navy, border: brand.navy },
    subtle: { bg: '#E8ECF2', text: brand.navy, border: 'transparent' },
  },
  teal: {
    solid: { bg: brand.teal, text: '#FFFFFF', border: brand.teal },
    outline: { bg: 'transparent', text: brand.teal, border: brand.teal },
    subtle: { bg: '#E6F7F7', text: '#1A8F8F', border: 'transparent' },
  },
  orange: {
    solid: { bg: brand.orange, text: '#FFFFFF', border: brand.orange },
    outline: { bg: 'transparent', text: brand.orange, border: brand.orange },
    subtle: { bg: '#FEF3E8', text: '#C65A20', border: 'transparent' },
  },
  green: {
    solid: { bg: brand.success, text: '#FFFFFF', border: brand.success },
    outline: { bg: 'transparent', text: brand.success, border: brand.success },
    subtle: { bg: '#E8F5E9', text: '#2E7D32', border: 'transparent' },
  },
  gray: {
    solid: { bg: brand.gray[500], text: '#FFFFFF', border: brand.gray[500] },
    outline: { bg: 'transparent', text: brand.gray[600], border: brand.gray[300] },
    subtle: { bg: brand.gray[100], text: brand.gray[600], border: 'transparent' },
  },
  white: {
    solid: { bg: '#FFFFFF', text: brand.navy, border: '#FFFFFF' },
    outline: { bg: 'transparent', text: '#FFFFFF', border: '#FFFFFF' },
    subtle: { bg: 'rgba(255,255,255,0.1)', text: '#FFFFFF', border: 'transparent' },
  },
};

const sizeConfig = {
  sm: 'px-2 py-0.5 text-[11px]',
  md: 'px-2.5 py-1 text-xs',
  lg: 'px-3 py-1.5 text-sm',
};

export function Badge({
  text,
  color = 'teal',
  size = 'md',
  variant = 'solid',
  className = '',
}: BadgeProps) {
  const colors = colorConfig[color][variant];

  return (
    <span
      className={`inline-flex items-center font-semibold rounded-full whitespace-nowrap ${sizeConfig[size]} ${className}`}
      style={{
        backgroundColor: colors.bg,
        color: colors.text,
        borderWidth: variant === 'outline' ? '1px' : '0',
        borderColor: colors.border,
        fontFamily: '"Plus Jakarta Sans", sans-serif',
      }}
    >
      {text}
    </span>
  );
}
