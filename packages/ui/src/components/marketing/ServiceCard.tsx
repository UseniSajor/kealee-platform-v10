// packages/ui/src/components/marketing/ServiceCard.tsx
// Compact service card for à la carte services

'use client';

import React from 'react';
import Link from 'next/link';
import { cn } from '../../lib/utils';

export interface ServiceCardProps {
  icon: React.ReactNode;
  name: string;
  price: number | string;
  description: string;
  ctaHref: string;
  className?: string;
}

export const ServiceCard: React.FC<ServiceCardProps> = ({
  icon,
  name,
  price,
  description,
  ctaHref,
  className,
}) => {
  const formattedPrice = typeof price === 'number'
    ? price.toLocaleString('en-US')
    : price;

  return (
    <div
      className={cn(
        'bg-white rounded-lg border border-gray-200 p-4 hover:border-gray-300 hover:shadow-sm transition-all duration-200',
        className
      )}
    >
      <div className="flex items-start gap-3">
        {/* Icon */}
        <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center flex-shrink-0 text-gray-600">
          {icon}
        </div>

        {/* Content */}
        <div className="flex-grow min-w-0">
          <div className="flex items-center justify-between mb-1">
            <h4 className="font-semibold text-[#4A90D9] text-sm truncate pr-2">
              {name}
            </h4>
            <span
              className="font-bold text-[#E8793A] text-sm flex-shrink-0"
              style={{ fontFamily: '"JetBrains Mono", monospace' }}
            >
              ${formattedPrice}
            </span>
          </div>
          <p className="text-xs text-gray-500 line-clamp-1 mb-2">{description}</p>
          <Link
            href={ctaHref}
            className="text-xs font-semibold text-[#2ABFBF] hover:text-[#2ABFBF]/80 transition-colors inline-flex items-center"
          >
            Order
            <svg
              className="w-3 h-3 ml-1"
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
          </Link>
        </div>
      </div>
    </div>
  );
};

export default ServiceCard;
