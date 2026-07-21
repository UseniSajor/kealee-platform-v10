'use client';

import Image from 'next/image';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { LucideIcon, ArrowRight } from 'lucide-react';
import { brand } from './brand';

export interface PortalPreviewProps {
  portalName: string;
  portalUrl: string;
  description: string;
  heroImage: string;
  heroImageAlt: string;
  accentColor?: 'teal' | 'orange' | 'navy' | 'green';
  sidebarItems: { icon: LucideIcon; label: string }[];
  stats: { label: string; value: string }[];
  features: string[];
  ctaHref?: string;
  className?: string;
}

const accentColors = {
  teal: brand.teal,
  orange: brand.orange,
  navy: brand.navy,
  green: brand.success,
};

export function PortalPreview({
  portalName,
  portalUrl,
  description,
  heroImage,
  heroImageAlt,
  accentColor = 'teal',
  sidebarItems,
  stats,
  features,
  ctaHref,
  className = '',
}: PortalPreviewProps) {
  const color = accentColors[accentColor];

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.6 }}
      className={`rounded-2xl overflow-hidden shadow-lg hover:shadow-xl transition-shadow duration-300 border border-gray-200 bg-white ${className}`}
    >
      {/* ── Top: Hero Image ─────────────────────────────────────── */}
      <div className="relative h-48 sm:h-56">
        <Image
          src={heroImage}
          alt={heroImageAlt}
          fill
          className="object-cover"
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
        />
        {/* Gradient overlay at bottom for transition to mockup */}
        <div className="absolute inset-0 bg-gradient-to-t from-white via-transparent to-transparent" />
        {/* Portal name badge */}
        <div className="absolute top-4 left-4">
          <span
            className="inline-flex items-center px-3 py-1.5 rounded-lg text-xs font-bold text-white shadow-md"
            style={{ backgroundColor: color }}
          >
            {portalName}
          </span>
        </div>
      </div>

      {/* ── Bottom: Styled Dashboard Mockup ─────────────────────── */}
      <div className="px-5 pb-5 -mt-6 relative z-10">
        {/* Browser Chrome Bar */}
        <div
          className="rounded-t-lg px-3 py-2 flex items-center gap-2"
          style={{ backgroundColor: brand.navy }}
        >
          {/* Traffic lights */}
          <div className="flex gap-1.5">
            <div className="w-2.5 h-2.5 rounded-full bg-red-400" />
            <div className="w-2.5 h-2.5 rounded-full bg-yellow-400" />
            <div className="w-2.5 h-2.5 rounded-full bg-green-400" />
          </div>
          {/* URL bar */}
          <div className="flex-1 ml-2 px-3 py-1 rounded-md bg-white/10 text-[10px] text-white/60 font-mono truncate">
            {portalUrl}
          </div>
        </div>

        {/* Dashboard Content Area */}
        <div
          className="rounded-b-lg border border-t-0 border-gray-200 bg-gray-50 p-3"
        >
          <div className="flex gap-3">
            {/* Mini Sidebar */}
            <div className="hidden sm:flex flex-col gap-1.5 w-28 shrink-0 border-r border-gray-200 pr-3">
              {sidebarItems.map((item) => {
                const Icon = item.icon;
                return (
                  <div
                    key={item.label}
                    className="flex items-center gap-2 px-2 py-1.5 rounded-md text-[10px] font-medium"
                    style={{ color: brand.gray[600] }}
                  >
                    <Icon className="w-3 h-3 shrink-0" style={{ color }} />
                    <span className="truncate">{item.label}</span>
                  </div>
                );
              })}
            </div>

            {/* Main Content */}
            <div className="flex-1 min-w-0">
              {/* Stats Row */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mb-3">
                {stats.map((stat) => (
                  <div
                    key={stat.label}
                    className="rounded-lg bg-white p-2 border border-gray-100"
                  >
                    <div
                      className="text-sm font-bold"
                      style={{ fontFamily: '"JetBrains Mono", monospace', color: brand.navy }}
                    >
                      {stat.value}
                    </div>
                    <div
                      className="text-[9px] mt-0.5"
                      style={{ color: brand.gray[500] }}
                    >
                      {stat.label}
                    </div>
                  </div>
                ))}
              </div>

              {/* Feature List */}
              <div className="space-y-1">
                {features.map((feature) => (
                  <div
                    key={feature}
                    className="flex items-center gap-1.5 text-[10px]"
                    style={{ color: brand.gray[600] }}
                  >
                    <div
                      className="w-1.5 h-1.5 rounded-full shrink-0"
                      style={{ backgroundColor: color }}
                    />
                    {feature}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Description & CTA */}
        <div className="mt-4">
          <p
            className="text-sm leading-relaxed mb-3"
            style={{ fontFamily: '"Plus Jakarta Sans", sans-serif', color: brand.gray[600] }}
          >
            {description}
          </p>
          {ctaHref && (
            <Link
              href={ctaHref}
              className="inline-flex items-center gap-1.5 text-sm font-semibold transition-colors hover:opacity-80"
              style={{ color, fontFamily: '"Plus Jakarta Sans", sans-serif' }}
            >
              Learn more
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          )}
        </div>
      </div>
    </motion.div>
  );
}
