// packages/ui/src/components/EmptyState.tsx
// Kealee Platform Empty State Component

import React from 'react';
import { cn } from '../lib/utils';
import { Button, ButtonProps } from './Button';

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
   * Primary action button
   */
  action?: {
    label: string;
    onClick: () => void;
    variant?: ButtonProps['variant'];
  };
  /**
   * Secondary action button
   */
  secondaryAction?: {
    label: string;
    onClick: () => void;
  };
}

/**
 * EmptyState component for displaying empty states with helpful messaging
 * 
 * @example
 * ```tsx
 * <EmptyState
 *   icon={<FolderOpen size={48} />}
 *   title="No projects yet"
 *   description="Get started by creating your first project"
 *   action={{ label: "Create Project", onClick: handleCreate }}
 * />
 * ```
 */
const EmptyState: React.FC<EmptyStateProps> = ({
  icon,
  title,
  description,
  action,
  secondaryAction,
  className,
  ...props
}) => {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center',
        'text-center py-12 px-6',
        className
      )}
      {...props}
    >
      {/* Icon */}
      {icon && (
        <div className="mb-6 text-gray-400">
          {icon}
        </div>
      )}

      {/* Title */}
      <h3 className="text-2xl font-bold text-gray-900 mb-2">
        {title}
      </h3>

      {/* Description */}
      {description && (
        <p className="text-gray-600 max-w-md mb-8">
          {description}
        </p>
      )}

      {/* Actions */}
      {(action || secondaryAction) && (
        <div className="flex items-center gap-3">
          {action && (
            <Button
              variant={action.variant || 'primary'}
              onClick={action.onClick}
            >
              {action.label}
            </Button>
          )}
          {secondaryAction && (
            <Button
              variant="ghost"
              onClick={secondaryAction.onClick}
            >
              {secondaryAction.label}
            </Button>
          )}
        </div>
      )}
    </div>
  );
};

EmptyState.displayName = 'EmptyState';

export { EmptyState };
