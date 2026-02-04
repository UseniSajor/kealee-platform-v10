// packages/ui/src/components/marketing/StatsBar.tsx
// Full-width stats bar with large numbers

'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { cn } from '../../lib/utils';

export interface Stat {
  value: string | number;
  label: string;
}

export interface StatsBarProps {
  stats: Stat[];
  className?: string;
}

export const StatsBar: React.FC<StatsBarProps> = ({ stats, className }) => {
  return (
    <section className={cn('w-full bg-[#4A90D9] py-12 md:py-16', className)}>
      <div className="max-w-6xl mx-auto px-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
          {stats.map((stat, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
            >
              <p
                className="text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-2"
                style={{ fontFamily: '"Clash Display", "Plus Jakarta Sans", sans-serif' }}
              >
                {stat.value}
              </p>
              <p className="text-gray-400 text-sm md:text-base">{stat.label}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default StatsBar;
