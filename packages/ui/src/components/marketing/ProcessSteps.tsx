// packages/ui/src/components/marketing/ProcessSteps.tsx
// Horizontal/vertical process steps with connecting lines

'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { cn } from '../../lib/utils';

export interface ProcessStep {
  number: number;
  title: string;
  description: string;
}

export interface ProcessStepsProps {
  steps: ProcessStep[];
  accentColor?: 'navy' | 'orange' | 'teal' | 'green';
  className?: string;
}

const accentColors = {
  navy: 'bg-[#1A2B4A] text-white',
  orange: 'bg-[#E8793A] text-white',
  teal: 'bg-[#2ABFBF] text-white',
  green: 'bg-[#38A169] text-white',
};

const lineColors = {
  navy: 'bg-[#1A2B4A]',
  orange: 'bg-[#E8793A]',
  teal: 'bg-[#2ABFBF]',
  green: 'bg-[#38A169]',
};

export const ProcessSteps: React.FC<ProcessStepsProps> = ({
  steps,
  accentColor = 'teal',
  className,
}) => {
  return (
    <div className={cn('w-full', className)}>
      {/* Desktop - Horizontal */}
      <div className="hidden md:flex items-start justify-between relative">
        {/* Connecting Line */}
        <div
          className={cn(
            'absolute top-6 left-12 right-12 h-0.5 opacity-30',
            lineColors[accentColor]
          )}
        />

        {steps.map((step, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: index * 0.15 }}
            className="flex flex-col items-center text-center flex-1 px-4 relative z-10"
          >
            {/* Number Circle */}
            <div
              className={cn(
                'w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg mb-4',
                accentColors[accentColor]
              )}
              style={{ fontFamily: '"JetBrains Mono", monospace' }}
            >
              {step.number}
            </div>

            {/* Title */}
            <h4
              className="text-lg font-bold text-[#1A2B4A] mb-2"
              style={{ fontFamily: '"Clash Display", "Plus Jakarta Sans", sans-serif' }}
            >
              {step.title}
            </h4>

            {/* Description */}
            <p className="text-gray-600 text-sm max-w-[200px]">
              {step.description}
            </p>

            {/* Arrow (except last) */}
            {index < steps.length - 1 && (
              <div className="absolute top-6 -right-2 transform translate-x-1/2 hidden lg:block">
                <svg
                  className={cn(
                    'w-4 h-4',
                    accentColor === 'navy' && 'text-[#1A2B4A]',
                    accentColor === 'orange' && 'text-[#E8793A]',
                    accentColor === 'teal' && 'text-[#2ABFBF]',
                    accentColor === 'green' && 'text-[#38A169]'
                  )}
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path d="M10 6L8.59 7.41 13.17 12l-4.58 4.59L10 18l6-6z" />
                </svg>
              </div>
            )}
          </motion.div>
        ))}
      </div>

      {/* Mobile - Vertical */}
      <div className="md:hidden relative pl-8">
        {/* Vertical Line */}
        <div
          className={cn(
            'absolute left-[23px] top-6 bottom-6 w-0.5 opacity-30',
            lineColors[accentColor]
          )}
        />

        {steps.map((step, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: index * 0.15 }}
            className="flex items-start mb-8 last:mb-0 relative"
          >
            {/* Number Circle */}
            <div
              className={cn(
                'w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg flex-shrink-0 mr-4 relative z-10',
                accentColors[accentColor]
              )}
              style={{ fontFamily: '"JetBrains Mono", monospace' }}
            >
              {step.number}
            </div>

            {/* Content */}
            <div className="pt-2">
              <h4
                className="text-lg font-bold text-[#1A2B4A] mb-1"
                style={{ fontFamily: '"Clash Display", "Plus Jakarta Sans", sans-serif' }}
              >
                {step.title}
              </h4>
              <p className="text-gray-600 text-sm">{step.description}</p>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

export default ProcessSteps;
