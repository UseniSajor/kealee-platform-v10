'use client';

import { Shield, Clock, MapPin, Lock } from 'lucide-react';
import { brand } from './brand';

export interface TrustBarProps {
  items?: string[];
  variant?: 'light' | 'dark';
  showIcons?: boolean;
  className?: string;
}

const defaultItems = [
  'Licensed & Insured',
  '20+ Years Experience',
  'DC-Baltimore Corridor',
  'Escrow Protected',
];

const iconMap: Record<string, React.ReactNode> = {
  'Licensed & Insured': <Shield className="w-4 h-4" />,
  '20+ Years Experience': <Clock className="w-4 h-4" />,
  'DC-Baltimore Corridor': <MapPin className="w-4 h-4" />,
  'Escrow Protected': <Lock className="w-4 h-4" />,
};

export function TrustBar({
  items = defaultItems,
  variant = 'light',
  showIcons = false,
  className = '',
}: TrustBarProps) {
  const textColor = variant === 'dark' ? 'text-gray-300' : 'text-gray-500';
  const dotColor = variant === 'dark' ? 'text-gray-500' : 'text-gray-300';

  return (
    <div
      className={`flex flex-wrap items-center justify-center gap-x-2 gap-y-1 text-sm ${textColor} ${className}`}
      style={{ fontFamily: '"Plus Jakarta Sans", sans-serif' }}
    >
      {items.map((item, index) => (
        <span key={item} className="flex items-center gap-1.5">
          {showIcons && iconMap[item] && (
            <span style={{ color: brand.teal }}>{iconMap[item]}</span>
          )}
          <span>{item}</span>
          {index < items.length - 1 && (
            <span className={`ml-2 ${dotColor}`}>•</span>
          )}
        </span>
      ))}
    </div>
  );
}
