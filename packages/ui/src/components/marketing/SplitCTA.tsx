// packages/ui/src/components/marketing/SplitCTA.tsx
// Side-by-side CTA blocks for different audiences

'use client';

import React from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { cn } from '../../lib/utils';

export interface CTASection {
  title: string;
  subtitle: string;
  cta: {
    label: string;
    href: string;
  };
  bgVariant: 'navy' | 'orange' | 'teal' | 'white' | 'gray';
  icon?: React.ReactNode;
}

export interface SplitCTAProps {
  sections: CTASection[];
  className?: string;
}

const bgConfig = {
  navy: {
    container: 'bg-[#1A2B4A]',
    title: 'text-white',
    subtitle: 'text-gray-300',
    button: 'bg-white text-[#1A2B4A] hover:bg-gray-100',
  },
  orange: {
    container: 'bg-[#E8793A]',
    title: 'text-white',
    subtitle: 'text-orange-100',
    button: 'bg-white text-[#E8793A] hover:bg-gray-100',
  },
  teal: {
    container: 'bg-[#2ABFBF]',
    title: 'text-white',
    subtitle: 'text-teal-100',
    button: 'bg-white text-[#2ABFBF] hover:bg-gray-100',
  },
  white: {
    container: 'bg-white border border-gray-200',
    title: 'text-[#1A2B4A]',
    subtitle: 'text-gray-600',
    button: 'bg-[#E8793A] text-white hover:bg-[#d16a2f]',
  },
  gray: {
    container: 'bg-gray-100',
    title: 'text-[#1A2B4A]',
    subtitle: 'text-gray-600',
    button: 'bg-[#1A2B4A] text-white hover:bg-[#1A2B4A]/90',
  },
};

export const SplitCTA: React.FC<SplitCTAProps> = ({
  sections,
  className,
}) => {
  const gridCols = sections.length === 2
    ? 'md:grid-cols-2'
    : sections.length === 3
    ? 'md:grid-cols-3'
    : 'md:grid-cols-2 lg:grid-cols-4';

  return (
    <div className={cn('grid gap-4 md:gap-6', gridCols, className)}>
      {sections.map((section, index) => (
        <motion.div
          key={index}
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.4, delay: index * 0.1 }}
          className={cn(
            'rounded-xl p-6 md:p-8 flex flex-col',
            bgConfig[section.bgVariant].container
          )}
        >
          {/* Icon */}
          {section.icon && (
            <div className="mb-4">{section.icon}</div>
          )}

          {/* Title */}
          <h3
            className={cn(
              'text-xl md:text-2xl font-bold mb-2',
              bgConfig[section.bgVariant].title
            )}
            style={{ fontFamily: '"Clash Display", "Plus Jakarta Sans", sans-serif' }}
          >
            {section.title}
          </h3>

          {/* Subtitle */}
          <p
            className={cn(
              'text-sm md:text-base mb-6 flex-grow',
              bgConfig[section.bgVariant].subtitle
            )}
          >
            {section.subtitle}
          </p>

          {/* CTA Button */}
          <Link
            href={section.cta.href}
            className={cn(
              'inline-flex items-center justify-center px-6 py-3 rounded-lg font-semibold transition-colors text-center',
              bgConfig[section.bgVariant].button
            )}
          >
            {section.cta.label}
          </Link>
        </motion.div>
      ))}
    </div>
  );
};

export default SplitCTA;
