'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { Check } from 'lucide-react';
import { brand, shadows } from './brand';
import { Badge } from './Badge';

export interface PricingTierCardProps {
  name: string;
  price: number | string;
  period?: string;
  description?: string;
  popular?: boolean;
  features: string[];
  cta: {
    label: string;
    href: string;
  };
  accentColor?: 'teal' | 'orange' | 'navy' | 'green';
  className?: string;
}

const accentColors = {
  teal: brand.teal,
  orange: brand.orange,
  navy: brand.navy,
  green: brand.success,
};

export function PricingTierCard({
  name,
  price,
  period,
  description,
  popular = false,
  features,
  cta,
  accentColor = 'orange',
  className = '',
}: PricingTierCardProps) {
  const color = accentColors[accentColor];
  const formattedPrice = typeof price === 'number'
    ? price.toLocaleString('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0 })
    : price;

  return (
    <motion.div
      whileHover={{ y: -4 }}
      transition={{ duration: 0.2 }}
      className={`relative bg-white rounded-xl overflow-hidden flex flex-col ${className}`}
      style={{
        boxShadow: popular ? shadows.level3 : shadows.level1,
        border: popular ? `2px solid ${color}` : '1px solid #E5E7EB',
      }}
    >
      {/* Popular Badge */}
      {popular && (
        <div className="absolute top-0 right-0 mt-4 mr-4">
          <Badge text="Popular" color={accentColor} size="sm" />
        </div>
      )}

      <div className="p-6 flex-1 flex flex-col">
        {/* Plan Name */}
        <h3
          className="text-lg font-semibold mb-2"
          style={{ fontFamily: '"Plus Jakarta Sans", sans-serif', color: brand.navy }}
        >
          {name}
        </h3>

        {/* Price */}
        <div className="mb-4">
          <span
            className="text-4xl font-bold"
            style={{ fontFamily: '"JetBrains Mono", monospace', color: brand.orange }}
          >
            {formattedPrice}
          </span>
          {period && (
            <span className="text-sm text-gray-500 ml-1">/{period}</span>
          )}
        </div>

        {/* Description */}
        {description && (
          <p
            className="text-sm text-gray-600 mb-6"
            style={{ fontFamily: '"Plus Jakarta Sans", sans-serif' }}
          >
            {description}
          </p>
        )}

        {/* Features */}
        <ul className="space-y-3 mb-6 flex-1">
          {features.map((feature) => (
            <li key={feature} className="flex items-start gap-2">
              <Check className="w-4 h-4 mt-0.5 flex-shrink-0 text-green-500" />
              <span
                className="text-sm text-gray-700"
                style={{ fontFamily: '"Plus Jakarta Sans", sans-serif' }}
              >
                {feature}
              </span>
            </li>
          ))}
        </ul>

        {/* CTA */}
        <Link
          href={cta.href}
          className="flex items-center justify-center w-full py-3 px-4 rounded-lg font-semibold text-sm transition-all hover:opacity-90"
          style={{
            backgroundColor: popular ? color : 'transparent',
            color: popular ? '#FFFFFF' : color,
            border: popular ? 'none' : `2px solid ${color}`,
            fontFamily: '"Plus Jakarta Sans", sans-serif',
          }}
        >
          {cta.label}
        </Link>
      </div>
    </motion.div>
  );
}
