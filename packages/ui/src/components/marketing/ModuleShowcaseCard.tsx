// packages/ui/src/components/marketing/ModuleShowcaseCard.tsx
// Card component for showcasing platform modules

'use client';

import React from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { cn } from '../../lib/utils';
import { PriceDisplay } from './PriceDisplay';

export interface ModuleShowcaseCardProps {
  icon: React.ReactNode;
  title: string;
  subtitle?: string;
  description: string;
  features: string[];
  priceAnchor?: string;
  cta: {
    label: string;
    href: string;
  };
  accentColor: 'navy' | 'orange' | 'teal' | 'green';
  className?: string;
}

const accentColors = {
  navy: 'border-t-[#1A2B4A]',
  orange: 'border-t-[#E8793A]',
  teal: 'border-t-[#2ABFBF]',
  green: 'border-t-[#38A169]',
};

const iconBgColors = {
  navy: 'bg-[#1A2B4A]/10 text-[#1A2B4A]',
  orange: 'bg-[#E8793A]/10 text-[#E8793A]',
  teal: 'bg-[#2ABFBF]/10 text-[#2ABFBF]',
  green: 'bg-[#38A169]/10 text-[#38A169]',
};

const ctaColors = {
  navy: 'text-[#1A2B4A] hover:text-[#1A2B4A]/80',
  orange: 'text-[#E8793A] hover:text-[#E8793A]/80',
  teal: 'text-[#2ABFBF] hover:text-[#2ABFBF]/80',
  green: 'text-[#38A169] hover:text-[#38A169]/80',
};

export const ModuleShowcaseCard: React.FC<ModuleShowcaseCardProps> = ({
  icon,
  title,
  subtitle,
  description,
  features,
  priceAnchor,
  cta,
  accentColor,
  className,
}) => {
  return (
    <motion.div
      whileHover={{ y: -4 }}
      transition={{ duration: 0.2 }}
      className={cn(
        'relative bg-white rounded-xl border border-gray-200 border-t-4 shadow-sm hover:shadow-lg transition-shadow duration-200',
        accentColors[accentColor],
        className
      )}
    >
      <div className="p-6">
        {/* Icon */}
        <div
          className={cn(
            'w-12 h-12 rounded-lg flex items-center justify-center mb-4',
            iconBgColors[accentColor]
          )}
        >
          {icon}
        </div>

        {/* Title & Subtitle */}
        <h3
          className="text-xl font-bold text-[#1A2B4A] mb-1"
          style={{ fontFamily: '"Clash Display", "Plus Jakarta Sans", sans-serif' }}
        >
          {title}
        </h3>
        {subtitle && (
          <p className="text-sm text-gray-500 mb-3">{subtitle}</p>
        )}

        {/* Description */}
        <p className="text-gray-600 text-sm mb-4 line-clamp-2">{description}</p>

        {/* Features (max 4) */}
        <ul className="space-y-2 mb-4">
          {features.slice(0, 4).map((feature, index) => (
            <li key={index} className="flex items-start text-sm text-gray-700">
              <svg
                className={cn(
                  'w-4 h-4 mr-2 mt-0.5 flex-shrink-0',
                  accentColor === 'navy' && 'text-[#1A2B4A]',
                  accentColor === 'orange' && 'text-[#E8793A]',
                  accentColor === 'teal' && 'text-[#2ABFBF]',
                  accentColor === 'green' && 'text-[#38A169]'
                )}
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
              {feature}
            </li>
          ))}
        </ul>

        {/* Price Anchor */}
        {priceAnchor && (
          <div className="mb-4">
            <span className="text-sm text-gray-500">Starting at </span>
            <PriceDisplay amount={priceAnchor} size="sm" color={accentColor} />
          </div>
        )}

        {/* CTA */}
        <Link
          href={cta.href}
          className={cn(
            'inline-flex items-center text-sm font-semibold transition-colors',
            ctaColors[accentColor]
          )}
        >
          {cta.label}
          <svg
            className="w-4 h-4 ml-1"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 5l7 7-7 7"
            />
          </svg>
        </Link>
      </div>
    </motion.div>
  );
};

export default ModuleShowcaseCard;
