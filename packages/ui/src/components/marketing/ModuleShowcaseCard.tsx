'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { Check, ArrowRight, LucideIcon } from 'lucide-react';
import { brand, shadows } from './brand';
import { PriceDisplay } from './PriceDisplay';

export interface ModuleShowcaseCardProps {
  icon: LucideIcon;
  title: string;
  subtitle?: string;
  description: string;
  features: string[];
  priceAnchor: {
    amount: number | string;
    period?: string;
    showFrom?: boolean;
  };
  cta: {
    label: string;
    href: string;
  };
  accentColor: 'teal' | 'orange' | 'navy' | 'green';
  className?: string;
}

const accentColors = {
  teal: brand.teal,
  orange: brand.orange,
  navy: brand.navy,
  green: brand.success,
};

export function ModuleShowcaseCard({
  icon: Icon,
  title,
  subtitle,
  description,
  features,
  priceAnchor,
  cta,
  accentColor,
  className = '',
}: ModuleShowcaseCardProps) {
  const color = accentColors[accentColor];

  return (
    <motion.div
      whileHover={{ y: -4, boxShadow: shadows.level2 }}
      transition={{ duration: 0.2 }}
      className={`relative bg-white rounded-xl overflow-hidden ${className}`}
      style={{ boxShadow: shadows.level1 }}
    >
      {/* Accent Top Border */}
      <div className="h-1" style={{ backgroundColor: color }} />

      <div className="p-6">
        {/* Header */}
        <div className="flex items-start gap-4 mb-4">
          <div
            className="w-12 h-12 rounded-lg flex items-center justify-center flex-shrink-0"
            style={{ backgroundColor: `${color}15` }}
          >
            <Icon className="w-6 h-6" style={{ color }} />
          </div>
          <div className="flex-1 min-w-0">
            <h3
              className="text-lg font-bold truncate"
              style={{ fontFamily: '"Clash Display", sans-serif', color: brand.navy }}
            >
              {title}
            </h3>
            {subtitle && (
              <p className="text-sm text-gray-500" style={{ fontFamily: '"Plus Jakarta Sans", sans-serif' }}>
                {subtitle}
              </p>
            )}
          </div>
        </div>

        {/* Description */}
        <p
          className="text-sm text-gray-600 mb-4 line-clamp-2"
          style={{ fontFamily: '"Plus Jakarta Sans", sans-serif' }}
        >
          {description}
        </p>

        {/* Features */}
        <ul className="space-y-2 mb-6">
          {features.slice(0, 4).map((feature) => (
            <li key={feature} className="flex items-start gap-2">
              <Check className="w-4 h-4 mt-0.5 flex-shrink-0" style={{ color }} />
              <span className="text-sm text-gray-700" style={{ fontFamily: '"Plus Jakarta Sans", sans-serif' }}>
                {feature}
              </span>
            </li>
          ))}
        </ul>

        {/* Price */}
        <div className="mb-4">
          <PriceDisplay
            amount={priceAnchor.amount}
            period={priceAnchor.period}
            showFrom={priceAnchor.showFrom}
            size="md"
          />
        </div>

        {/* CTA */}
        <Link
          href={cta.href}
          className="flex items-center justify-center gap-2 w-full py-2.5 px-4 rounded-lg font-semibold text-sm transition-colors"
          style={{
            backgroundColor: color,
            color: '#FFFFFF',
            fontFamily: '"Plus Jakarta Sans", sans-serif',
          }}
        >
          {cta.label}
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    </motion.div>
  );
}
