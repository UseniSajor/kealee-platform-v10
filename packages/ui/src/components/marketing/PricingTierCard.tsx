// packages/ui/src/components/marketing/PricingTierCard.tsx
// Pricing tier card with popular badge and feature checklist

'use client';

import React from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { cn } from '../../lib/utils';

export interface PricingTierCardProps {
  name: string;
  price: number | string;
  period?: string;
  popular?: boolean;
  features: string[];
  cta: {
    label: string;
    href: string;
  };
  description?: string;
  className?: string;
}

export const PricingTierCard: React.FC<PricingTierCardProps> = ({
  name,
  price,
  period,
  popular = false,
  features,
  cta,
  description,
  className,
}) => {
  const formattedPrice = typeof price === 'number'
    ? price.toLocaleString('en-US')
    : price;

  return (
    <motion.div
      whileHover={{ y: -4 }}
      transition={{ duration: 0.2 }}
      className={cn(
        'relative bg-white rounded-xl border-2 p-6 flex flex-col',
        popular
          ? 'border-[#E8793A] shadow-lg'
          : 'border-gray-200 shadow-sm hover:shadow-md',
        className
      )}
    >
      {/* Popular Badge */}
      {popular && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2">
          <span className="bg-[#E8793A] text-white text-xs font-bold px-4 py-1 rounded-full">
            Popular
          </span>
        </div>
      )}

      {/* Plan Name */}
      <h3
        className="text-lg font-bold text-[#4A90D9] mb-2"
        style={{ fontFamily: '"Clash Display", "Plus Jakarta Sans", sans-serif' }}
      >
        {name}
      </h3>

      {/* Description */}
      {description && (
        <p className="text-sm text-gray-500 mb-4">{description}</p>
      )}

      {/* Price */}
      <div className="mb-6">
        <span
          className="text-4xl font-bold text-[#4A90D9]"
          style={{ fontFamily: '"JetBrains Mono", monospace' }}
        >
          ${formattedPrice}
        </span>
        {period && (
          <span className="text-gray-500 text-sm">/{period}</span>
        )}
      </div>

      {/* Feature Checklist */}
      <ul className="space-y-3 mb-6 flex-grow">
        {features.map((feature, index) => (
          <li key={index} className="flex items-start text-sm text-gray-700">
            <svg
              className="w-5 h-5 mr-2 flex-shrink-0 text-[#38A169]"
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

      {/* CTA Button */}
      <Link
        href={cta.href}
        className={cn(
          'w-full py-3 rounded-lg font-semibold text-center transition-all duration-200',
          popular
            ? 'bg-[#E8793A] text-white hover:bg-[#d16a2f]'
            : 'border-2 border-[#4A90D9] text-[#4A90D9] hover:bg-[#4A90D9] hover:text-white'
        )}
      >
        {cta.label}
      </Link>
    </motion.div>
  );
};

export default PricingTierCard;
