'use client';

import { motion } from 'framer-motion';
import { brand } from './brand';

export interface Stat {
  value: string;
  label: string;
}

export interface StatsBarProps {
  stats: Stat[];
  className?: string;
}

export function StatsBar({ stats, className = '' }: StatsBarProps) {
  return (
    <section
      className={`py-12 lg:py-16 ${className}`}
      style={{ backgroundColor: brand.navy }}
    >
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 lg:gap-12">
          {stats.map((stat, index) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className="text-center"
            >
              <div
                className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-2"
                style={{ fontFamily: '"Clash Display", sans-serif', color: '#FFFFFF' }}
              >
                {stat.value}
              </div>
              <div
                className="text-sm lg:text-base"
                style={{ fontFamily: '"Plus Jakarta Sans", sans-serif', color: brand.gray[400] }}
              >
                {stat.label}
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
