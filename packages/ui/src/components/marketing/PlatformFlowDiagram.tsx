'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { ArrowRight, ChevronRight } from 'lucide-react';
import { brand, shadows } from './brand';
import { Badge } from './Badge';

export interface FlowNode {
  id: string;
  phase: string;
  app: string;
  appBadge: string;
  features: string[];
  href: string;
  color: 'teal' | 'orange' | 'navy' | 'green';
}

export interface PlatformFlowDiagramProps {
  nodes: FlowNode[];
  className?: string;
}

const colorMap = {
  teal: brand.teal,
  orange: brand.orange,
  navy: brand.navy,
  green: brand.success,
};

export function PlatformFlowDiagram({ nodes, className = '' }: PlatformFlowDiagramProps) {
  return (
    <div className={className}>
      {/* Desktop: Horizontal Flow */}
      <div className="hidden lg:block">
        <div className="flex items-stretch justify-center gap-2">
          {nodes.map((node, index) => (
            <div key={node.id} className="flex items-center">
              {/* Node Card */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
              >
                <Link
                  href={node.href}
                  className="block w-[200px] bg-white rounded-xl overflow-hidden transition-all hover:shadow-lg group"
                  style={{ boxShadow: shadows.level1 }}
                >
                  {/* Color Bar */}
                  <div className="h-1" style={{ backgroundColor: colorMap[node.color] }} />

                  <div className="p-4">
                    {/* Phase Name */}
                    <h4
                      className="font-bold text-base mb-1"
                      style={{ fontFamily: '"Clash Display", sans-serif', color: brand.navy }}
                    >
                      {node.phase}
                    </h4>

                    {/* App Badge */}
                    <Badge
                      text={node.appBadge}
                      color={node.color}
                      size="sm"
                      variant="subtle"
                    />

                    {/* Features */}
                    <ul className="mt-3 space-y-1">
                      {node.features.slice(0, 3).map((feature) => (
                        <li
                          key={feature}
                          className="text-xs text-gray-600 flex items-center gap-1.5"
                          style={{ fontFamily: '"Plus Jakarta Sans", sans-serif' }}
                        >
                          <ChevronRight className="w-3 h-3 text-gray-400" />
                          {feature}
                        </li>
                      ))}
                    </ul>
                  </div>
                </Link>
              </motion.div>

              {/* Arrow Connector */}
              {index < nodes.length - 1 && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.5 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.3, delay: index * 0.1 + 0.2 }}
                  className="mx-2"
                >
                  <ArrowRight className="w-6 h-6 text-gray-300" />
                </motion.div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Tablet: 2-column grid */}
      <div className="hidden md:grid lg:hidden grid-cols-2 gap-4">
        {nodes.map((node, index) => (
          <motion.div
            key={node.id}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.4, delay: index * 0.1 }}
          >
            <Link
              href={node.href}
              className="block bg-white rounded-xl overflow-hidden transition-all hover:shadow-md"
              style={{ boxShadow: shadows.level1 }}
            >
              <div className="h-1" style={{ backgroundColor: colorMap[node.color] }} />
              <div className="p-4 flex items-start gap-3">
                <div
                  className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 font-bold text-white text-sm"
                  style={{ backgroundColor: colorMap[node.color], fontFamily: '"Clash Display", sans-serif' }}
                >
                  {index + 1}
                </div>
                <div className="flex-1 min-w-0">
                  <h4
                    className="font-bold text-sm mb-0.5"
                    style={{ fontFamily: '"Clash Display", sans-serif', color: brand.navy }}
                  >
                    {node.phase}
                  </h4>
                  <Badge text={node.appBadge} color={node.color} size="sm" variant="subtle" />
                  <ul className="mt-2 space-y-0.5">
                    {node.features.slice(0, 2).map((feature) => (
                      <li key={feature} className="text-xs text-gray-600">
                        {feature}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </Link>
          </motion.div>
        ))}
      </div>

      {/* Mobile: Vertical Flow */}
      <div className="md:hidden space-y-3">
        {nodes.map((node, index) => (
          <motion.div
            key={node.id}
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.4, delay: index * 0.1 }}
            className="relative"
          >
            {/* Vertical Connector */}
            {index < nodes.length - 1 && (
              <div
                className="absolute left-5 top-full w-0.5 h-3 z-0"
                style={{ backgroundColor: brand.gray[200] }}
              />
            )}

            <Link
              href={node.href}
              className="block bg-white rounded-xl overflow-hidden relative z-10"
              style={{ boxShadow: shadows.level1 }}
            >
              <div className="h-1" style={{ backgroundColor: colorMap[node.color] }} />
              <div className="p-4 flex items-start gap-3">
                <div
                  className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 font-bold text-white"
                  style={{ backgroundColor: colorMap[node.color], fontFamily: '"Clash Display", sans-serif' }}
                >
                  {index + 1}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <h4
                      className="font-bold"
                      style={{ fontFamily: '"Clash Display", sans-serif', color: brand.navy }}
                    >
                      {node.phase}
                    </h4>
                    <Badge text={node.appBadge} color={node.color} size="sm" variant="subtle" />
                  </div>
                  <ul className="space-y-0.5">
                    {node.features.map((feature) => (
                      <li key={feature} className="text-xs text-gray-600">
                        {feature}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </Link>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
