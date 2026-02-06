'use client';

import Link from 'next/link';
import { ArrowRight, LucideIcon } from 'lucide-react';
import { brand } from './brand';

export interface ServiceCardProps {
  icon: LucideIcon;
  name: string;
  price: string | number;
  description: string;
  ctaHref: string;
  className?: string;
}

export function ServiceCard({
  icon: Icon,
  name,
  price,
  description,
  ctaHref,
  className = '',
}: ServiceCardProps) {
  const formattedPrice = typeof price === 'number'
    ? price.toLocaleString('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0 })
    : price;

  return (
    <div
      className={`flex items-center gap-4 p-4 bg-white rounded-lg border border-gray-200 hover:border-gray-300 hover:shadow-sm transition-all ${className}`}
    >
      {/* Icon */}
      <div
        className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
        style={{ backgroundColor: `${brand.orange}15` }}
      >
        <Icon className="w-5 h-5" style={{ color: brand.orange }} />
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-baseline justify-between gap-2 mb-0.5">
          <h4
            className="font-semibold text-sm truncate"
            style={{ fontFamily: '"Plus Jakarta Sans", sans-serif', color: brand.navy }}
          >
            {name}
          </h4>
          <span
            className="text-sm font-bold flex-shrink-0"
            style={{ fontFamily: '"JetBrains Mono", monospace', color: brand.orange }}
          >
            {formattedPrice}
          </span>
        </div>
        <p
          className="text-xs text-gray-500 line-clamp-1"
          style={{ fontFamily: '"Plus Jakarta Sans", sans-serif' }}
        >
          {description}
        </p>
      </div>

      {/* CTA */}
      <Link
        href={ctaHref}
        className="flex-shrink-0 text-sm font-medium flex items-center gap-1 hover:underline"
        style={{ color: brand.orange, fontFamily: '"Plus Jakarta Sans", sans-serif' }}
      >
        Order
        <ArrowRight className="w-3 h-3" />
      </Link>
    </div>
  );
}
