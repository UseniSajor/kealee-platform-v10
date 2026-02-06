'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';
import { brand } from './brand';

export interface CTASection {
  title: string;
  subtitle: string;
  cta: {
    label: string;
    href: string;
  };
  bgVariant: 'white' | 'dark' | 'teal';
  ctaColor?: 'orange' | 'navy' | 'white' | 'teal';
}

export interface SplitCTAProps {
  sections: CTASection[];
  className?: string;
}

const bgStyles = {
  white: {
    background: '#FFFFFF',
    titleColor: brand.navy,
    subtitleColor: brand.gray[600],
    border: `1px solid ${brand.gray[200]}`,
  },
  dark: {
    background: brand.navy,
    titleColor: '#FFFFFF',
    subtitleColor: brand.gray[300],
    border: 'none',
  },
  teal: {
    background: brand.teal,
    titleColor: '#FFFFFF',
    subtitleColor: 'rgba(255,255,255,0.8)',
    border: 'none',
  },
};

const ctaStyles = {
  orange: {
    bg: brand.orange,
    text: '#FFFFFF',
    border: 'none',
  },
  navy: {
    bg: brand.navy,
    text: '#FFFFFF',
    border: 'none',
  },
  white: {
    bg: 'transparent',
    text: '#FFFFFF',
    border: '2px solid #FFFFFF',
  },
  teal: {
    bg: brand.teal,
    text: '#FFFFFF',
    border: 'none',
  },
};

export function SplitCTA({ sections, className = '' }: SplitCTAProps) {
  const gridCols = sections.length === 2 ? 'md:grid-cols-2' : sections.length === 3 ? 'md:grid-cols-3' : 'md:grid-cols-4';

  return (
    <div className={`grid grid-cols-1 ${gridCols} ${className}`}>
      {sections.map((section, index) => {
        const bg = bgStyles[section.bgVariant];
        const cta = ctaStyles[section.ctaColor || (section.bgVariant === 'dark' ? 'white' : 'orange')];

        return (
          <motion.div
            key={section.title}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: index * 0.1 }}
            className="p-8 lg:p-10"
            style={{ backgroundColor: bg.background, border: bg.border }}
          >
            <h3
              className="text-xl lg:text-2xl font-bold mb-2"
              style={{ fontFamily: '"Clash Display", sans-serif', color: bg.titleColor }}
            >
              {section.title}
            </h3>
            <p
              className="text-sm mb-6"
              style={{ fontFamily: '"Plus Jakarta Sans", sans-serif', color: bg.subtitleColor }}
            >
              {section.subtitle}
            </p>
            <Link
              href={section.cta.href}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg font-semibold text-sm transition-all hover:opacity-90"
              style={{
                backgroundColor: cta.bg,
                color: cta.text,
                border: cta.border,
                fontFamily: '"Plus Jakarta Sans", sans-serif',
              }}
            >
              {section.cta.label}
              <ArrowRight className="w-4 h-4" />
            </Link>
          </motion.div>
        );
      })}
    </div>
  );
}
