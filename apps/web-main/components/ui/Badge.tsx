type Variant = 'navy' | 'teal' | 'orange' | 'green' | 'gray'

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: Variant
}

const variants: Record<Variant, { bg: string; style: React.CSSProperties }> = {
  navy:   { bg: 'bg-navy/10',   style: { color: '#1A2B4A' } },
  teal:   { bg: '',              style: { backgroundColor: 'rgba(42,191,191,0.12)', color: '#1A8F8F' } },
  orange: { bg: '',              style: { backgroundColor: 'rgba(232,121,58,0.12)', color: '#C65A20' } },
  green:  { bg: 'bg-green-100', style: { color: '#276749' } },
  gray:   { bg: 'bg-gray-100',  style: { color: '#4A5568' } },
}

export function Badge({ variant = 'teal', className = '', style, children, ...props }: BadgeProps) {
  const v = variants[variant]
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-wider ${v.bg} ${className}`}
      style={{ ...v.style, ...style }}
      {...props}
    >
      {children}
    </span>
  )
}
