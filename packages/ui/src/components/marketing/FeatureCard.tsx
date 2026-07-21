'use client';

import Image from 'next/image';
import { LucideIcon } from 'lucide-react';
import { brand } from './brand';

export interface FeatureCardProps {
  icon: LucideIcon;
  title: string;
  description: string;
  accentColor?: 'teal' | 'orange' | 'navy' | 'green';
  imageSrc?: string;
  imageAlt?: string;
  className?: string;
}

const accentColors = {
  teal: brand.teal,
  orange: brand.orange,
  navy: brand.navy,
  green: brand.success,
};

export function FeatureCard({
  icon: Icon,
  title,
  description,
  accentColor = 'teal',
  imageSrc,
  imageAlt = '',
  className = '',
}: FeatureCardProps) {
  const color = accentColors[accentColor];

  return (
    <div className={`text-center ${className}`}>
      {/* Optional image above icon */}
      {imageSrc && (
        <div className="rounded-xl overflow-hidden mb-4 mx-auto max-w-sm">
          <Image
            src={imageSrc}
            alt={imageAlt}
            width={400}
            height={240}
            className="w-full h-40 object-cover"
            sizes="(max-width: 768px) 100vw, 33vw"
          />
        </div>
      )}

      {/* Icon */}
      <div
        className="w-12 h-12 rounded-xl mx-auto mb-4 flex items-center justify-center"
        style={{ backgroundColor: `${color}15` }}
      >
        <Icon className="w-6 h-6" style={{ color }} />
      </div>

      {/* Title */}
      <h3
        className="text-lg font-bold mb-2"
        style={{ fontFamily: '"Plus Jakarta Sans", sans-serif', color: brand.navy }}
      >
        {title}
      </h3>

      {/* Description */}
      <p
        className="text-sm text-gray-600 leading-relaxed"
        style={{ fontFamily: '"Plus Jakarta Sans", sans-serif' }}
      >
        {description}
      </p>
    </div>
  );
}
