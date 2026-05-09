type Bg = 'white' | 'cloud' | 'navy' | 'teal' | 'transparent'

interface SectionProps extends React.HTMLAttributes<HTMLElement> {
  bg?:       Bg
  py?:       'sm' | 'md' | 'lg' | 'xl'
  as?:       'section' | 'div' | 'article'
}

const bgs: Record<Bg, string | React.CSSProperties> = {
  white:       'bg-white',
  cloud:       'bg-[#F7FAFC]',
  navy:        '',
  teal:        '',
  transparent: '',
}

const inlineBgs: Partial<Record<Bg, React.CSSProperties>> = {
  navy: { backgroundColor: '#1A2B4A' },
  teal: { backgroundColor: '#2ABFBF' },
}

const pys = { sm: 'py-10', md: 'py-16', lg: 'py-20', xl: 'py-24 lg:py-32' }

export function Section({ bg = 'white', py = 'lg', as: Tag = 'section', className = '', style, children, ...props }: SectionProps) {
  const bgClass = typeof bgs[bg] === 'string' ? bgs[bg] as string : ''
  const inlineStyle = { ...(inlineBgs[bg] ?? {}), ...style }

  return (
    <Tag className={`${bgClass} ${pys[py]} ${className}`} style={inlineStyle} {...props}>
      {children}
    </Tag>
  )
}
