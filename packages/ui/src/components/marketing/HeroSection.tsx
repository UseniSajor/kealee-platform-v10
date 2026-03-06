'use client';

import Image from 'next/image';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { brand, animations } from './brand';
import { Badge } from './Badge';
import { TrustBar } from './TrustBar';

export interface HeroCTA {
  label: string;
  href: string;
  variant: 'primary' | 'outline' | 'ghost';
}

export interface HeroSectionProps {
  eyebrow?: string;
  eyebrowColor?: 'teal' | 'orange' | 'navy' | 'green';
  headline: string;
  subheadline?: string;
  ctas?: HeroCTA[];
  trustItems?: string[];
  bgPattern?: boolean;
  backgroundImage?: string;
  backgroundImageAlt?: string;
  className?: string;
}

export function HeroSection({
  eyebrow,
  eyebrowColor = 'teal',
  headline,
  subheadline,
  ctas = [],
  trustItems,
  bgPattern = false,
  backgroundImage,
  backgroundImageAlt = '',
  className = '',
}: HeroSectionProps) {
  const hasBackgroundImage = !!backgroundImage;
  const getButtonStyles = (variant: HeroCTA['variant']) => {
    switch (variant) {
      case 'primary':
        return {
          backgroundColor: brand.orange,
          color: '#FFFFFF',
          border: 'none',
        };
      case 'outline':
        return hasBackgroundImage
          ? {
              backgroundColor: '#C8882A',
              color: '#FFFFFF',
              border: 'none',
            }
          : {
              backgroundColor: 'transparent',
              color: brand.navy,
              border: `2px solid ${brand.navy}`,
            };
      case 'ghost':
        return hasBackgroundImage
          ? {
              backgroundColor: '#C8882A',
              color: '#FFFFFF',
              border: 'none',
            }
          : {
              backgroundColor: 'transparent',
              color: brand.gray[600],
              border: 'none',
            };
    }
  };

  return (
    <section
      className={`relative py-16 lg:py-24 px-4 sm:px-6 lg:px-8 overflow-hidden ${className}`}
    >
      {/* Optional background image with dark overlay */}
      {hasBackgroundImage && (
        <>
          <Image
            src={backgroundImage}
            alt={backgroundImageAlt}
            fill
            className="object-cover"
            sizes="100vw"
            priority
          />
          <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/50 to-black/70" />
        </>
      )}

      {/* Optional subtle pattern background (only when no image) */}
      {!hasBackgroundImage && bgPattern && (
        <div
          className="absolute inset-0 opacity-[0.02]"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%231A2B4A' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          }}
        />
      )}

      <div className="relative max-w-4xl mx-auto text-center">
        {/* Eyebrow Badge */}
        {eyebrow && (
          <motion.div {...animations.fadeInUp} className="mb-6">
            <Badge text={eyebrow} color={eyebrowColor} size="lg" variant="subtle" />
          </motion.div>
        )}

        {/* Headline */}
        <motion.h1
          {...animations.fadeInUp}
          transition={{ ...animations.fadeInUp.transition, delay: 0.1 }}
          className="text-4xl sm:text-5xl lg:text-[56px] font-bold leading-tight mb-6"
          style={{ fontFamily: '"Clash Display", sans-serif', color: hasBackgroundImage ? '#FFFFFF' : brand.navy }}
        >
          {headline}
        </motion.h1>

        {/* Subheadline */}
        {subheadline && (
          <motion.p
            {...animations.fadeInUp}
            transition={{ ...animations.fadeInUp.transition, delay: 0.2 }}
            className="text-lg lg:text-xl leading-relaxed mb-8 max-w-2xl mx-auto"
            style={{ fontFamily: '"Plus Jakarta Sans", sans-serif', color: hasBackgroundImage ? 'rgba(255,255,255,0.85)' : brand.gray[600] }}
          >
            {subheadline}
          </motion.p>
        )}

        {/* CTAs */}
        {ctas.length > 0 && (
          <motion.div
            {...animations.fadeInUp}
            transition={{ ...animations.fadeInUp.transition, delay: 0.3 }}
            className="flex flex-wrap items-center justify-center gap-3 mb-10"
          >
            {ctas.map((cta) => {
              const styles = getButtonStyles(cta.variant);
              return (
                <Link
                  key={cta.label}
                  href={cta.href}
                  className="inline-flex items-center justify-center px-6 py-3 text-sm font-semibold rounded-lg transition-all hover:opacity-90 hover:scale-[1.02]"
                  style={{
                    ...styles,
                    fontFamily: '"Plus Jakarta Sans", sans-serif',
                  }}
                >
                  {cta.label}
                </Link>
              );
            })}
          </motion.div>
        )}

        {/* Trust Strip */}
        {trustItems && (
          <motion.div
            {...animations.fadeInUp}
            transition={{ ...animations.fadeInUp.transition, delay: 0.4 }}
          >
            <TrustBar items={trustItems} showIcons />
          </motion.div>
        )}
      </div>
    </section>
  );
}
