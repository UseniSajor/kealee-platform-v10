// packages/ui/src/components/marketing/TestimonialCard.tsx
// Testimonial card with quote, rating, and attribution

'use client';

import React from 'react';
import { cn } from '../../lib/utils';

export interface TestimonialCardProps {
  quote: string;
  name: string;
  role?: string;
  rating: number;
  projectType?: string;
  avatar?: string;
  className?: string;
}

export const TestimonialCard: React.FC<TestimonialCardProps> = ({
  quote,
  name,
  role,
  rating,
  projectType,
  avatar,
  className,
}) => {
  return (
    <div
      className={cn(
        'relative bg-white rounded-xl border border-gray-200 p-6 shadow-sm',
        className
      )}
    >
      {/* Large Quote Mark Decoration */}
      <div className="absolute top-4 left-4 text-[#2ABFBF]/10 pointer-events-none">
        <svg
          className="w-16 h-16"
          fill="currentColor"
          viewBox="0 0 24 24"
        >
          <path d="M14.017 21v-7.391c0-5.704 3.731-9.57 8.983-10.609l.995 2.151c-2.432.917-3.995 3.638-3.995 5.849h4v10h-9.983zm-14.017 0v-7.391c0-5.704 3.748-9.57 9-10.609l.996 2.151c-2.433.917-3.996 3.638-3.996 5.849h3.983v10h-9.983z" />
        </svg>
      </div>

      {/* Star Rating */}
      <div className="flex items-center mb-4 relative z-10">
        {[...Array(5)].map((_, i) => (
          <svg
            key={i}
            className={cn(
              'w-5 h-5',
              i < rating ? 'text-[#E8793A]' : 'text-gray-200'
            )}
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
          </svg>
        ))}
      </div>

      {/* Quote */}
      <p className="text-gray-700 text-base leading-relaxed mb-6 relative z-10">
        "{quote}"
      </p>

      {/* Attribution */}
      <div className="flex items-center relative z-10">
        {avatar ? (
          <img
            src={avatar}
            alt={name}
            className="w-10 h-10 rounded-full mr-3 object-cover"
          />
        ) : (
          <div className="w-10 h-10 rounded-full bg-[#4A90D9] text-white flex items-center justify-center mr-3 font-semibold text-sm">
            {name.split(' ').map(n => n[0]).join('').slice(0, 2)}
          </div>
        )}
        <div>
          <p className="font-semibold text-[#4A90D9] text-sm">{name}</p>
          {role && <p className="text-gray-500 text-xs">{role}</p>}
        </div>
        {projectType && (
          <span className="ml-auto text-xs text-gray-400 bg-gray-100 px-2 py-1 rounded">
            {projectType}
          </span>
        )}
      </div>
    </div>
  );
};

export default TestimonialCard;
