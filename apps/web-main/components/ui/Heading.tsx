type Level   = 'h1' | 'h2' | 'h3' | 'h4'
type Color   = 'navy' | 'white' | 'teal' | 'orange'
type Size    = 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl'

interface HeadingProps extends React.HTMLAttributes<HTMLHeadingElement> {
  as?:    Level
  size?:  Size
  color?: Color
}

const sizes: Record<Size, string> = {
  xs:  'text-base lg:text-lg',
  sm:  'text-xl lg:text-2xl',
  md:  'text-2xl lg:text-3xl',
  lg:  'text-3xl lg:text-4xl',
  xl:  'text-4xl lg:text-[44px]',
  '2xl': 'text-4xl sm:text-5xl lg:text-[56px]',
}

const colors: Record<Color, string> = {
  navy:   '',
  white:  'text-white',
  teal:   '',
  orange: '',
}

const colorStyles: Record<Color, React.CSSProperties> = {
  navy:   { color: '#1A2B4A' },
  white:  {},
  teal:   { color: '#2ABFBF' },
  orange: { color: '#E8793A' },
}

export function Heading({ as: Tag = 'h2', size = 'lg', color = 'navy', className = '', style, children, ...props }: HeadingProps) {
  return (
    <Tag
      className={`font-bold font-display leading-tight ${sizes[size]} ${colors[color]} ${className}`}
      style={{ ...colorStyles[color], ...style }}
      {...props}
    >
      {children}
    </Tag>
  )
}
