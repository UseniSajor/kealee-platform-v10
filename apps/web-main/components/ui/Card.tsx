interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  hover?: boolean
  padding?: 'sm' | 'md' | 'lg' | 'none'
}

const paddings = { none: '', sm: 'p-4', md: 'p-5', lg: 'p-6 lg:p-8' }

export function Card({ hover, padding = 'md', className = '', children, ...props }: CardProps) {
  return (
    <div
      className={`rounded-xl border border-gray-200 bg-white ${paddings[padding]} ${hover ? 'transition-all hover:border-teal hover:shadow-md hover:-translate-y-0.5' : ''} shadow-sm ${className}`}
      {...props}
    >
      {children}
    </div>
  )
}
