// packages/ui/src/components/marketing/HeroSection.tsx
// Hero section component for marketing landing pages

'use client';

import React from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { cn } from '../../lib/utils';
import { MarketingBadge } from './MarketingBadge';
import { TrustBar } from './TrustBar';

export interface HeroCTA {
  label: string;
  variant: 'primary' | 'outline' | 'ghost';
  href: string;
}

export interface HeroSectionProps {
  eyebrow?: string;
  eyebrowColor?: 'navy' | 'orange' | 'teal' | 'green';
  headline: string;
  subheadline?: string;
  ctas?: HeroCTA[];
  trustItems?: string[];
  bgPattern?: 'dots' | 'grid' | 'none';
  className?: string;
}

const ctaVariants = {
  primary: 'bg-[#E8793A] hover:bg-[#d16a2f] text-white shadow-md hover:shadow-lg',
  outline: 'border-2 border-[#4A90D9] text-[#4A90D9] hover:bg-[#4A90D9] hover:text-white',
  ghost: 'text-[#4A90D9] hover:bg-gray-100',
};

const patternStyles = {
  dots: `radial-gradient(circle, #4A90D9 1px, transparent 1px)`,
  grid: `linear-gradient(#4A90D9 1px, transparent 1px), linear-gradient(90deg, #4A90D9 1px, transparent 1px)`,
  none: 'none',
};

export const HeroSection: React.FC<HeroSectionProps> = ({
  eyebrow,
  eyebrowColor = 'teal',
  headline,
  subheadline,
  ctas = [],
  trustItems,
  bgPattern = 'none',
  className,
}) => {
  return (
    <section
      className={cn(
        'relative w-full bg-white py-16 md:py-24 lg:py-32 overflow-hidden',
        className
      )}
    >
      {/* Background Pattern */}
      {bgPattern !== 'none' && (
        <div
          className="absolute inset-0 opacity-[0.02] pointer-events-none"
          style={{
            backgroundImage: patternStyles[bgPattern],
            backgroundSize: bgPattern === 'dots' ? '24px 24px' : '48px 48px',
          }}
        />
      )}

      <div className="relative max-w-4xl mx-auto px-6 text-center">
        {/* Eyebrow Badge */}
        {eyebrow && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="mb-6"
          >
            <MarketingBadge
              text={eyebrow}
              color={eyebrowColor}
              size="md"
              variant="soft"
            />
          </motion.div>
        )}

        {/* Headline */}
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="text-4xl md:text-5xl lg:text-[56px] font-bold text-[#4A90D9] leading-tight tracking-tight mb-6"
          style={{ fontFamily: '"Clash Display", "Plus Jakarta Sans", sans-serif' }}
        >
          {headline}
        </motion.h1>

        {/* Subheadline */}
        {subheadline && (
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="text-lg md:text-xl text-gray-600 max-w-2xl mx-auto mb-8"
            style={{ fontFamily: '"Plus Jakarta Sans", sans-serif' }}
          >
            {subheadline}
          </motion.p>
        )}

        {/* CTAs */}
        {ctas.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-12"
          >
            {ctas.map((cta, index) => (
              <Link
                key={index}
                href={cta.href}
                className={cn(
                  'px-8 py-3 rounded-lg font-semibold text-base transition-all duration-200',
                  ctaVariants[cta.variant]
                )}
              >
                {cta.label}
              </Link>
            ))}
          </motion.div>
        )}

        {/* Trust Items */}
        {trustItems && trustItems.length > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.4 }}
          >
            <TrustBar items={trustItems} variant="light" />
          </motion.div>
        )}
      </div>
    </section>
  );
};

export default HeroSection;
