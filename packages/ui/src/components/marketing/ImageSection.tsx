'use client';

import Image from 'next/image';
import { motion } from 'framer-motion';
import { brand } from './brand';

export interface ImageSectionProps {
  title: string;
  subtitle?: string;
  description: string;
  imageSrc: string;
  imageAlt: string;
  imagePosition?: 'left' | 'right';
  accentColor?: 'teal' | 'orange' | 'navy' | 'green';
  children?: React.ReactNode;
  className?: string;
}

const accentColors = {
  teal: brand.teal,
  orange: brand.orange,
  navy: brand.navy,
  green: brand.success,
};

export function ImageSection({
  title,
  subtitle,
  description,
  imageSrc,
  imageAlt,
  imagePosition = 'right',
  accentColor = 'teal',
  children,
  className = '',
}: ImageSectionProps) {
  const color = accentColors[accentColor];

  const textContent = (
    <motion.div
      initial={{ opacity: 0, x: imagePosition === 'right' ? -30 : 30 }}
      whileInView={{ opacity: 1, x: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.6 }}
    >
      {subtitle && (
        <p
          className="text-sm font-semibold uppercase tracking-wider mb-3"
          style={{ color, fontFamily: '"Plus Jakarta Sans", sans-serif' }}
        >
          {subtitle}
        </p>
      )}
      <h2
        className="text-3xl lg:text-4xl font-bold mb-4"
        style={{ fontFamily: '"Clash Display", sans-serif', color: brand.navy }}
      >
        {title}
      </h2>
      <p
        className="text-base lg:text-lg leading-relaxed mb-6"
        style={{ fontFamily: '"Plus Jakarta Sans", sans-serif', color: brand.gray[600] }}
      >
        {description}
      </p>
      {children}
    </motion.div>
  );

  const imageContent = (
    <motion.div
      initial={{ opacity: 0, x: imagePosition === 'right' ? 30 : -30 }}
      whileInView={{ opacity: 1, x: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.6, delay: 0.1 }}
      className="relative rounded-2xl overflow-hidden shadow-lg"
    >
      <Image
        src={imageSrc}
        alt={imageAlt}
        width={800}
        height={600}
        className="w-full h-auto object-cover"
        sizes="(max-width: 768px) 100vw, 50vw"
      />
      {/* Subtle accent border */}
      <div
        className="absolute inset-0 rounded-2xl"
        style={{ boxShadow: `inset 0 0 0 1px ${color}20` }}
      />
    </motion.div>
  );

  return (
    <section className={`py-16 lg:py-20 px-4 sm:px-6 lg:px-8 ${className}`}>
      <div className="max-w-6xl mx-auto grid lg:grid-cols-2 gap-12 items-center">
        {imagePosition === 'left' ? (
          <>
            {imageContent}
            {textContent}
          </>
        ) : (
          <>
            {textContent}
            {imageContent}
          </>
        )}
      </div>
    </section>
  );
}
