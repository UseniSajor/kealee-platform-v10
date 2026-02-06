'use client';

import { Star } from 'lucide-react';
import { brand, shadows } from './brand';

export interface TestimonialCardProps {
  quote: string;
  name: string;
  role: string;
  rating: number;
  projectType?: string;
  avatarUrl?: string;
  className?: string;
}

export function TestimonialCard({
  quote,
  name,
  role,
  rating,
  projectType,
  avatarUrl,
  className = '',
}: TestimonialCardProps) {
  return (
    <div
      className={`relative bg-white rounded-xl p-6 ${className}`}
      style={{ boxShadow: shadows.level1 }}
    >
      {/* Quote Decoration */}
      <div
        className="absolute top-4 right-4 text-6xl font-serif leading-none select-none"
        style={{ color: `${brand.teal}15`, fontFamily: 'Georgia, serif' }}
      >
        &ldquo;
      </div>

      {/* Rating */}
      <div className="flex items-center gap-1 mb-4">
        {[...Array(5)].map((_, i) => (
          <Star
            key={i}
            className="w-4 h-4"
            fill={i < rating ? brand.orange : 'transparent'}
            stroke={i < rating ? brand.orange : brand.gray[300]}
          />
        ))}
      </div>

      {/* Quote */}
      <blockquote
        className="text-gray-700 text-sm leading-relaxed mb-6 relative z-10"
        style={{ fontFamily: '"Plus Jakarta Sans", sans-serif' }}
      >
        &ldquo;{quote}&rdquo;
      </blockquote>

      {/* Author */}
      <div className="flex items-center gap-3">
        {avatarUrl ? (
          <img
            src={avatarUrl}
            alt={name}
            className="w-10 h-10 rounded-full object-cover"
          />
        ) : (
          <div
            className="w-10 h-10 rounded-full flex items-center justify-center text-white font-semibold text-sm"
            style={{ backgroundColor: brand.navy }}
          >
            {name.split(' ').map(n => n[0]).join('')}
          </div>
        )}
        <div>
          <div
            className="font-semibold text-sm"
            style={{ fontFamily: '"Plus Jakarta Sans", sans-serif', color: brand.navy }}
          >
            {name}
          </div>
          <div className="text-xs text-gray-500">{role}</div>
          {projectType && (
            <div className="text-xs text-teal-600 mt-0.5">{projectType}</div>
          )}
        </div>
      </div>
    </div>
  );
}
