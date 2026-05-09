import { forwardRef } from 'react'
import Link from 'next/link'
import { Loader2 } from 'lucide-react'

type Variant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'teal'
type Size    = 'sm' | 'md' | 'lg'

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant
  size?:    Size
  loading?: boolean
  href?:    string
  external?: boolean
  leftIcon?:  React.ReactNode
  rightIcon?: React.ReactNode
}

const variants: Record<Variant, string> = {
  primary:   'text-white hover:opacity-90',
  secondary: 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50',
  outline:   'border-2 hover:opacity-80',
  ghost:     'text-gray-600 hover:bg-gray-100 hover:text-gray-900',
  teal:      'text-white hover:opacity-90',
}

const variantStyles: Record<Variant, React.CSSProperties> = {
  primary:   { backgroundColor: '#E8793A' },
  secondary: {},
  outline:   { borderColor: '#2ABFBF', color: '#2ABFBF' },
  ghost:     {},
  teal:      { backgroundColor: '#2ABFBF' },
}

const sizes: Record<Size, string> = {
  sm: 'px-3 py-1.5 text-xs rounded-lg gap-1.5',
  md: 'px-4 py-2 text-sm rounded-lg gap-2',
  lg: 'px-6 py-3 text-sm rounded-xl gap-2',
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { variant = 'primary', size = 'md', loading, href, external, leftIcon, rightIcon, children, className = '', disabled, ...props },
  ref,
) {
  const base = `inline-flex items-center justify-center font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed ${variants[variant]} ${sizes[size]} ${className}`
  const style = variantStyles[variant]

  const inner = (
    <>
      {loading && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
      {!loading && leftIcon}
      {children}
      {rightIcon}
    </>
  )

  if (href) {
    const linkProps = external ? { target: '_blank', rel: 'noopener noreferrer' } : {}
    return (
      <Link href={href} className={base} style={style} {...linkProps}>
        {inner}
      </Link>
    )
  }

  return (
    <button ref={ref} className={base} style={style} disabled={disabled || loading} {...props}>
      {inner}
    </button>
  )
})
