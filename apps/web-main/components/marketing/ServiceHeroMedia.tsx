'use client'

import Image from 'next/image'
import { BeforeAfterMedia } from './BeforeAfterMedia'
import { ProcessVideoLoop } from './ProcessVideoLoop'

interface ServiceHeroMediaProps {
  heroImage: string
  beforeImage?: string
  heroVideo?: string
  heroVideoWebM?: string
  alt: string
}

export function ServiceHeroMedia({
  heroImage,
  beforeImage,
  heroVideo,
  heroVideoWebM,
  alt,
}: ServiceHeroMediaProps) {
  if (heroVideo) {
    return (
      <div className="absolute inset-0">
        <ProcessVideoLoop
          src={heroVideo}
          webm={heroVideoWebM}
          poster={heroImage}
          className="h-full w-full object-cover opacity-30"
          autoPlayInView={false}
        />
      </div>
    )
  }

  if (beforeImage) {
    return (
      <div className="absolute inset-0 opacity-30">
        <BeforeAfterMedia
          beforeUrl={beforeImage}
          afterUrl={heroImage}
          alt={alt}
          sizes="100vw"
          priority
        />
      </div>
    )
  }

  return (
    <Image src={heroImage} alt={alt} fill className="object-cover opacity-25" priority />
  )
}
