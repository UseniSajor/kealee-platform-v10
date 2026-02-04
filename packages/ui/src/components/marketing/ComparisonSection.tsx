// packages/ui/src/components/marketing/ComparisonSection.tsx
// Two-column comparison with X and check items

'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { cn } from '../../lib/utils';

export interface ComparisonSectionProps {
  leftTitle: string;
  leftItems: string[];
  rightTitle: string;
  rightItems: string[];
  className?: string;
}

export const ComparisonSection: React.FC<ComparisonSectionProps> = ({
  leftTitle,
  leftItems,
  rightTitle,
  rightItems,
  className,
}) => {
  return (
    <div className={cn('grid md:grid-cols-2 gap-6 md:gap-8', className)}>
      {/* Left Column - Negative/Without */}
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        whileInView={{ opacity: 1, x: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5 }}
        className="bg-red-50/50 border border-red-100 rounded-xl p-6"
      >
        <h3
          className="text-lg font-bold text-red-700 mb-4 flex items-center"
          style={{ fontFamily: '"Clash Display", "Plus Jakarta Sans", sans-serif' }}
        >
          <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
          {leftTitle}
        </h3>
        <ul className="space-y-3">
          {leftItems.map((item, index) => (
            <li key={index} className="flex items-start text-gray-700">
              <svg
                className="w-5 h-5 mr-2 mt-0.5 text-red-400 flex-shrink-0"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
              <span className="text-sm">{item}</span>
            </li>
          ))}
        </ul>
      </motion.div>

      {/* Right Column - Positive/With */}
      <motion.div
        initial={{ opacity: 0, x: 20 }}
        whileInView={{ opacity: 1, x: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5, delay: 0.1 }}
        className="bg-green-50/50 border border-green-100 rounded-xl p-6"
      >
        <h3
          className="text-lg font-bold text-green-700 mb-4 flex items-center"
          style={{ fontFamily: '"Clash Display", "Plus Jakarta Sans", sans-serif' }}
        >
          <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
          {rightTitle}
        </h3>
        <ul className="space-y-3">
          {rightItems.map((item, index) => (
            <li key={index} className="flex items-start text-gray-700">
              <svg
                className="w-5 h-5 mr-2 mt-0.5 text-green-500 flex-shrink-0"
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
              <span className="text-sm">{item}</span>
            </li>
          ))}
        </ul>
      </motion.div>
    </div>
  );
};

export default ComparisonSection;
