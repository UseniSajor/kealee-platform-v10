// packages/ui/src/components/marketing/FeatureCard.tsx
// Simple feature card with icon, title, and description

'use client';

import React from 'react';
import { cn } from '../../lib/utils';

export interface FeatureCardProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  iconColor?: 'navy' | 'orange' | 'teal' | 'green';
  className?: string;
}

const iconColorClasses = {
  navy: 'text-[#1A2B4A]',
  orange: 'text-[#E8793A]',
  teal: 'text-[#2ABFBF]',
  green: 'text-[#38A169]',
};

export const FeatureCard: React.FC<FeatureCardProps> = ({
  icon,
  title,
  description,
  iconColor = 'teal',
  className,
}) => {
  return (
    <div className={cn('p-4', className)}>
      {/* Icon */}
      <div className={cn('mb-3', iconColorClasses[iconColor])}>
        {icon}
      </div>

      {/* Title */}
      <h4
        className="text-lg font-bold text-[#1A2B4A] mb-2"
        style={{ fontFamily: '"Clash Display", "Plus Jakarta Sans", sans-serif' }}
      >
        {title}
      </h4>

      {/* Description */}
      <p className="text-gray-600 text-base leading-relaxed">
        {description}
      </p>
    </div>
  );
};

export default FeatureCard;
