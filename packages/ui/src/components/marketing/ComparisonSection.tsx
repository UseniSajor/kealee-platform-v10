'use client';

import { motion } from 'framer-motion';
import { X, Check } from 'lucide-react';
import { brand } from './brand';

export interface ComparisonSectionProps {
  leftTitle: string;
  leftItems: string[];
  rightTitle: string;
  rightItems: string[];
  className?: string;
}

export function ComparisonSection({
  leftTitle,
  leftItems,
  rightTitle,
  rightItems,
  className = '',
}: ComparisonSectionProps) {
  return (
    <div className={`grid md:grid-cols-2 gap-6 lg:gap-8 ${className}`}>
      {/* Without / Left Column */}
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        whileInView={{ opacity: 1, x: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5 }}
        className="bg-red-50 rounded-xl p-6"
      >
        <h3
          className="text-lg font-bold mb-4 flex items-center gap-2"
          style={{ fontFamily: '"Clash Display", sans-serif', color: '#B91C1C' }}
        >
          <X className="w-5 h-5" />
          {leftTitle}
        </h3>
        <ul className="space-y-3">
          {leftItems.map((item) => (
            <li key={item} className="flex items-start gap-3">
              <X className="w-4 h-4 mt-0.5 flex-shrink-0 text-red-500" />
              <span
                className="text-sm text-gray-700"
                style={{ fontFamily: '"Plus Jakarta Sans", sans-serif' }}
              >
                {item}
              </span>
            </li>
          ))}
        </ul>
      </motion.div>

      {/* With / Right Column */}
      <motion.div
        initial={{ opacity: 0, x: 20 }}
        whileInView={{ opacity: 1, x: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5, delay: 0.1 }}
        className="bg-green-50 rounded-xl p-6"
      >
        <h3
          className="text-lg font-bold mb-4 flex items-center gap-2"
          style={{ fontFamily: '"Clash Display", sans-serif', color: '#166534' }}
        >
          <Check className="w-5 h-5" />
          {rightTitle}
        </h3>
        <ul className="space-y-3">
          {rightItems.map((item) => (
            <li key={item} className="flex items-start gap-3">
              <Check className="w-4 h-4 mt-0.5 flex-shrink-0 text-green-600" />
              <span
                className="text-sm text-gray-700"
                style={{ fontFamily: '"Plus Jakarta Sans", sans-serif' }}
              >
                {item}
              </span>
            </li>
          ))}
        </ul>
      </motion.div>
    </div>
  );
}
