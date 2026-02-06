'use client';

import { motion } from 'framer-motion';
import { brand } from './brand';

export interface ProcessStep {
  number: number;
  title: string;
  description: string;
}

export interface ProcessStepsProps {
  steps: ProcessStep[];
  accentColor?: 'teal' | 'orange' | 'navy' | 'green';
  className?: string;
}

const accentColors = {
  teal: brand.teal,
  orange: brand.orange,
  navy: brand.navy,
  green: brand.success,
};

export function ProcessSteps({
  steps,
  accentColor = 'teal',
  className = '',
}: ProcessStepsProps) {
  const color = accentColors[accentColor];

  return (
    <div className={`${className}`}>
      {/* Desktop: Horizontal */}
      <div className="hidden md:block">
        <div className="flex items-start">
          {steps.map((step, index) => (
            <div key={step.number} className="flex-1 relative">
              {/* Connector Line */}
              {index < steps.length - 1 && (
                <div
                  className="absolute top-6 left-1/2 w-full h-0.5"
                  style={{ backgroundColor: brand.gray[200] }}
                />
              )}

              {/* Step Content */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.15 }}
                className="relative z-10 text-center px-4"
              >
                {/* Number Circle */}
                <div
                  className="w-12 h-12 rounded-full mx-auto mb-4 flex items-center justify-center text-white font-bold text-lg"
                  style={{ backgroundColor: color, fontFamily: '"Clash Display", sans-serif' }}
                >
                  {step.number}
                </div>

                {/* Title */}
                <h4
                  className="font-bold text-base mb-2"
                  style={{ fontFamily: '"Plus Jakarta Sans", sans-serif', color: brand.navy }}
                >
                  {step.title}
                </h4>

                {/* Description */}
                <p
                  className="text-sm text-gray-600 max-w-[200px] mx-auto"
                  style={{ fontFamily: '"Plus Jakarta Sans", sans-serif' }}
                >
                  {step.description}
                </p>
              </motion.div>
            </div>
          ))}
        </div>
      </div>

      {/* Mobile: Vertical */}
      <div className="md:hidden space-y-6">
        {steps.map((step, index) => (
          <motion.div
            key={step.number}
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.4, delay: index * 0.1 }}
            className="flex gap-4"
          >
            {/* Number & Line */}
            <div className="flex flex-col items-center">
              <div
                className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold flex-shrink-0"
                style={{ backgroundColor: color, fontFamily: '"Clash Display", sans-serif' }}
              >
                {step.number}
              </div>
              {index < steps.length - 1 && (
                <div className="w-0.5 flex-1 mt-2" style={{ backgroundColor: brand.gray[200] }} />
              )}
            </div>

            {/* Content */}
            <div className="pb-6">
              <h4
                className="font-bold text-base mb-1"
                style={{ fontFamily: '"Plus Jakarta Sans", sans-serif', color: brand.navy }}
              >
                {step.title}
              </h4>
              <p
                className="text-sm text-gray-600"
                style={{ fontFamily: '"Plus Jakarta Sans", sans-serif' }}
              >
                {step.description}
              </p>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
