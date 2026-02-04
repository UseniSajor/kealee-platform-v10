// packages/ui/src/components/marketing/PlatformFlowDiagram.tsx
// End-to-end platform flow: Design → Permit → Build → Inspect → Closeout

'use client';

import React from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { cn } from '../../lib/utils';

export interface FlowPhase {
  name: string;
  badge: string;
  features: string[];
  href: string;
  color: 'teal' | 'green' | 'orange' | 'navy';
}

export interface PlatformFlowDiagramProps {
  phases?: FlowPhase[];
  className?: string;
}

const defaultPhases: FlowPhase[] = [
  {
    name: 'Design',
    badge: 'm-architect',
    features: ['Architecture Plans', '3D Renderings', 'Engineering'],
    href: '/architect',
    color: 'teal',
  },
  {
    name: 'Permit',
    badge: 'm-permits',
    features: ['AI Review', 'Form Filling', 'Status Tracking'],
    href: '/permits',
    color: 'green',
  },
  {
    name: 'Build',
    badge: 'm-ops',
    features: ['Contractor Network', 'Project Management', 'Estimation'],
    href: '/ops',
    color: 'orange',
  },
  {
    name: 'Inspect',
    badge: 'm-permits',
    features: ['Scheduling', 'Corrections', 'Documentation'],
    href: '/permits',
    color: 'green',
  },
  {
    name: 'Closeout',
    badge: 'm-project-owner',
    features: ['Final Walkthrough', 'Warranty', 'Handoff'],
    href: '/project-owner',
    color: 'navy',
  },
];

const colorConfig = {
  teal: {
    bg: 'bg-[#2ABFBF]/10',
    border: 'border-[#2ABFBF]',
    text: 'text-[#2ABFBF]',
    badge: 'bg-[#2ABFBF]/20 text-[#2ABFBF]',
  },
  green: {
    bg: 'bg-[#38A169]/10',
    border: 'border-[#38A169]',
    text: 'text-[#38A169]',
    badge: 'bg-[#38A169]/20 text-[#38A169]',
  },
  orange: {
    bg: 'bg-[#E8793A]/10',
    border: 'border-[#E8793A]',
    text: 'text-[#E8793A]',
    badge: 'bg-[#E8793A]/20 text-[#E8793A]',
  },
  navy: {
    bg: 'bg-[#4A90D9]/10',
    border: 'border-[#4A90D9]',
    text: 'text-[#4A90D9]',
    badge: 'bg-[#4A90D9]/20 text-[#4A90D9]',
  },
};

export const PlatformFlowDiagram: React.FC<PlatformFlowDiagramProps> = ({
  phases = defaultPhases,
  className,
}) => {
  return (
    <div className={cn('w-full', className)}>
      {/* Desktop - Horizontal */}
      <div className="hidden lg:flex items-stretch justify-between relative">
        {phases.map((phase, index) => (
          <React.Fragment key={index}>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: index * 0.1 }}
              className="flex-1"
            >
              <Link
                href={phase.href}
                className={cn(
                  'block h-full rounded-xl border-2 p-4 transition-all duration-200 hover:shadow-md',
                  colorConfig[phase.color].bg,
                  colorConfig[phase.color].border
                )}
              >
                {/* Phase Name */}
                <h4
                  className={cn(
                    'text-lg font-bold mb-2',
                    colorConfig[phase.color].text
                  )}
                  style={{ fontFamily: '"Clash Display", "Plus Jakarta Sans", sans-serif' }}
                >
                  {phase.name}
                </h4>

                {/* Badge */}
                <span
                  className={cn(
                    'inline-block text-xs font-medium px-2 py-0.5 rounded-full mb-3',
                    colorConfig[phase.color].badge
                  )}
                >
                  {phase.badge}
                </span>

                {/* Features */}
                <ul className="space-y-1">
                  {phase.features.map((feature, fIndex) => (
                    <li key={fIndex} className="text-xs text-gray-600 flex items-center">
                      <span className={cn('w-1 h-1 rounded-full mr-2', colorConfig[phase.color].text.replace('text-', 'bg-'))} />
                      {feature}
                    </li>
                  ))}
                </ul>
              </Link>
            </motion.div>

            {/* Arrow Between Phases */}
            {index < phases.length - 1 && (
              <motion.div
                initial={{ opacity: 0, scale: 0.5 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.3, delay: index * 0.1 + 0.2 }}
                className="flex items-center justify-center px-2"
              >
                <svg
                  className="w-6 h-6 text-gray-300"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 5l7 7-7 7"
                  />
                </svg>
              </motion.div>
            )}
          </React.Fragment>
        ))}
      </div>

      {/* Tablet - 3 columns */}
      <div className="hidden md:grid lg:hidden grid-cols-3 gap-4">
        {phases.map((phase, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.4, delay: index * 0.1 }}
          >
            <Link
              href={phase.href}
              className={cn(
                'block h-full rounded-xl border-2 p-4 transition-all duration-200 hover:shadow-md',
                colorConfig[phase.color].bg,
                colorConfig[phase.color].border
              )}
            >
              <div className="flex items-center justify-between mb-2">
                <h4
                  className={cn(
                    'text-base font-bold',
                    colorConfig[phase.color].text
                  )}
                  style={{ fontFamily: '"Clash Display", "Plus Jakarta Sans", sans-serif' }}
                >
                  {phase.name}
                </h4>
                <span className="text-xs text-gray-400 font-mono">{index + 1}</span>
              </div>
              <span
                className={cn(
                  'inline-block text-xs font-medium px-2 py-0.5 rounded-full mb-2',
                  colorConfig[phase.color].badge
                )}
              >
                {phase.badge}
              </span>
              <ul className="space-y-1">
                {phase.features.slice(0, 2).map((feature, fIndex) => (
                  <li key={fIndex} className="text-xs text-gray-600">
                    • {feature}
                  </li>
                ))}
              </ul>
            </Link>
          </motion.div>
        ))}
      </div>

      {/* Mobile - Vertical */}
      <div className="md:hidden relative pl-6">
        {/* Vertical Line */}
        <div className="absolute left-[11px] top-4 bottom-4 w-0.5 bg-gray-200" />

        {phases.map((phase, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.4, delay: index * 0.1 }}
            className="relative mb-4 last:mb-0"
          >
            {/* Dot on Line */}
            <div
              className={cn(
                'absolute -left-6 top-4 w-3 h-3 rounded-full border-2 bg-white z-10',
                colorConfig[phase.color].border
              )}
            />

            <Link
              href={phase.href}
              className={cn(
                'block rounded-xl border-2 p-4 transition-all duration-200 active:shadow-md',
                colorConfig[phase.color].bg,
                colorConfig[phase.color].border
              )}
            >
              <div className="flex items-center justify-between mb-2">
                <h4
                  className={cn(
                    'text-base font-bold',
                    colorConfig[phase.color].text
                  )}
                  style={{ fontFamily: '"Clash Display", "Plus Jakarta Sans", sans-serif' }}
                >
                  {phase.name}
                </h4>
                <span
                  className={cn(
                    'text-xs font-medium px-2 py-0.5 rounded-full',
                    colorConfig[phase.color].badge
                  )}
                >
                  {phase.badge}
                </span>
              </div>
              <ul className="flex flex-wrap gap-x-3 gap-y-1">
                {phase.features.map((feature, fIndex) => (
                  <li key={fIndex} className="text-xs text-gray-600">
                    • {feature}
                  </li>
                ))}
              </ul>
            </Link>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

export default PlatformFlowDiagram;
