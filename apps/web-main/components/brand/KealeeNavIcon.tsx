import React from 'react'
import { clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

interface KealeeNavIconProps extends React.SVGProps<SVGSVGElement> {
  size?: number | string
  className?: string
}

export function KealeeNavIcon({
  size = 24,
  className,
  ...props
}: KealeeNavIconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-label="Open navigation menu"
      className={twMerge(
        'text-kealee-primary transition-colors hover:text-kealee-primary-hover',
        className
      )}
      {...props}
    >
      <path
        d="M3 6H21"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M3 12H21"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M3 18H21"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}
