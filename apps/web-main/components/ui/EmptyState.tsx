import { Button } from './Button'

interface EmptyStateProps {
  icon?:        React.ReactNode
  title:        string
  description?: string
  action?:      { label: string; href?: string; onClick?: () => void }
  className?:   string
}

export function EmptyState({ icon, title, description, action, className = '' }: EmptyStateProps) {
  return (
    <div className={`flex flex-col items-center justify-center rounded-xl border border-dashed border-gray-300 bg-gray-50 py-16 text-center ${className}`}>
      {icon && <div className="mb-4 text-4xl">{icon}</div>}
      <h3 className="text-base font-semibold" style={{ color: '#1A2B4A' }}>{title}</h3>
      {description && <p className="mt-2 text-sm text-gray-500">{description}</p>}
      {action && (
        <div className="mt-5">
          <Button
            href={action.href}
            onClick={action.onClick}
            size="sm"
          >
            {action.label}
          </Button>
        </div>
      )}
    </div>
  )
}
