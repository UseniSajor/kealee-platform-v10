import React from 'react'
import { clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

interface KeystoneKIconProps extends React.SVGProps<SVGSVGElement> {
  size?: number | string
  className?: string
  title?: string
}

export function KeystoneKIcon({
  size = 24,
  className,
  title,
  ...props
}: KeystoneKIconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={twMerge('text-kealee-primary dark:text-kealee-primary-hover', className)}
      {...props}
    >
      {title && <title>{title}</title>}
      {/* Left stem (wider at top) */}
      <polygon points="12,4 40,4 32,96 16,96" fill="currentColor" />
      {/* Top right arm */}
      <polygon points="86,4 56,4 40,46 64,46" fill="currentColor" />
      {/* Bottom right arm */}
      <polygon points="60,54 40,54 62,96 88,96" fill="currentColor" />
    </svg>
  )
}
