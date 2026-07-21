type Width = 'sm' | 'md' | 'lg' | 'xl' | 'full'

interface ContainerProps extends React.HTMLAttributes<HTMLDivElement> {
  width?: Width
}

const widths: Record<Width, string> = {
  sm:   'max-w-2xl',
  md:   'max-w-4xl',
  lg:   'max-w-6xl',
  xl:   'max-w-7xl',
  full: 'max-w-[1400px]',
}

export function Container({ width = 'xl', className = '', children, ...props }: ContainerProps) {
  return (
    <div className={`mx-auto w-full ${widths[width]} px-4 sm:px-6 lg:px-8 ${className}`} {...props}>
      {children}
    </div>
  )
}
