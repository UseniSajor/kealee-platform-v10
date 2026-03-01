// packages/ui/src/components/EmptyState.tsx
// Kealee Platform Empty State Component

import React from 'react';
import { cn } from '../lib/utils';
import Button, { ButtonProps } from './Button';

export interface EmptyStateActionProps {
  label: string;
  href?: string;
  onClick?: () => void;
  variant?: ButtonProps['variant'];
}

export interface EmptyStateProps extends React.HTMLAttributes<HTMLDivElement> {
  /**
   * Icon or illustration to display
   */
  icon?: React.ReactNode;
  /**
   * Main heading text
   */
  title: string;
  /**
   * Description text
   */
  description?: string;
  /**
   * Primary action button -- supports both href (renders as <a>) and onClick
   */
  action?: EmptyStateActionProps;
  /**
   * Secondary action button
   */
  secondaryAction?: EmptyStateActionProps;
  /**
   * Visual size variant
   */
  size?: 'sm' | 'md' | 'lg';
}

const sizeStyles = {
  sm: { container: 'py-8 px-4', icon: 'mb-4', title: 'text-lg', desc: 'mb-5' },
  md: { container: 'py-12 px-6', icon: 'mb-6', title: 'text-2xl', desc: 'mb-8' },
  lg: { container: 'py-16 px-8', icon: 'mb-8', title: 'text-3xl', desc: 'mb-10' },
};

/**
 * Renders an action as a Button or an anchor depending on whether `href` is provided.
 */
function ActionElement({
  action,
  variant,
}: {
  action: EmptyStateActionProps;
  variant: ButtonProps['variant'];
}) {
  if (action.href) {
    return (
      <a
        href={action.href}
        className={cn(
          'inline-flex items-center justify-center font-semibold rounded-lg transition-all duration-200',
          'px-6 py-3 text-base',
          variant === 'ghost'
            ? 'text-primary-600 hover:text-primary-700 hover:bg-primary-50'
            : 'bg-primary-600 hover:bg-primary-700 text-white shadow-md hover:shadow-lg'
        )}
        onClick={action.onClick}
      >
        {action.label}
      </a>
    );
  }
  return (
    <Button variant={variant} onClick={action.onClick}>
      {action.label}
    </Button>
  );
}

/**
 * EmptyState component for displaying empty states with helpful messaging.
 *
 * Use this across all apps whenever a list, table, or dashboard section has
 * no data to display. It guides users toward the next action.
 *
 * @example
 * ```tsx
 * <EmptyState
 *   icon={<FolderOpen size={48} />}
 *   title="No projects yet"
 *   description="Get started by creating your first project"
 *   action={{ label: "Create Project", href: "/projects/new" }}
 * />
 * ```
 *
 * @example with onClick
 * ```tsx
 * <EmptyState
 *   title="No results"
 *   description="Try adjusting your search filters"
 *   action={{ label: "Clear filters", onClick: handleClear }}
 *   secondaryAction={{ label: "Learn more", href: "/docs/search" }}
 * />
 * ```
 */
const EmptyState: React.FC<EmptyStateProps> = ({
  icon,
  title,
  description,
  action,
  secondaryAction,
  size = 'md',
  className,
  ...props
}) => {
  const s = sizeStyles[size];

  return (
    <div
      role="status"
      aria-label={title}
      className={cn(
        'flex flex-col items-center justify-center',
        'text-center',
        s.container,
        className
      )}
      {...props}
    >
      {/* Icon */}
      {icon && (
        <div className={cn('text-gray-400', s.icon)} aria-hidden="true">
          {icon}
        </div>
      )}

      {/* Title */}
      <h3 className={cn('font-bold text-gray-900 mb-2', s.title)}>
        {title}
      </h3>

      {/* Description */}
      {description && (
        <p className={cn('text-gray-600 max-w-md', s.desc)}>
          {description}
        </p>
      )}

      {/* Actions */}
      {(action || secondaryAction) && (
        <div className="flex items-center gap-3">
          {action && (
            <ActionElement
              action={action}
              variant={action.variant || 'primary'}
            />
          )}
          {secondaryAction && (
            <ActionElement
              action={secondaryAction}
              variant={secondaryAction.variant || 'ghost'}
            />
          )}
        </div>
      )}
    </div>
  );
};

EmptyState.displayName = 'EmptyState';

export { EmptyState };
