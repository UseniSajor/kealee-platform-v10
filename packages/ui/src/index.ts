// packages/ui/src/index.ts
// Kealee Platform UI Component Library - Main Export
// Enterprise Edition

// Core Components
export { default as Button } from './components/Button';
export type { ButtonProps } from './components/Button';

export { default as Input } from './components/Input';
export type { InputProps } from './components/Input';

export { default as Textarea } from './components/Textarea';
export type { TextareaProps } from './components/Textarea';

export { default as Card, CardHeader, CardContent, CardFooter } from './components/Card';
export type { CardProps, CardHeaderProps, CardContentProps, CardFooterProps } from './components/Card';

export { default as Badge } from './components/Badge';
export type { BadgeProps } from './components/Badge';

// Progress Components
export { default as ProgressBar } from './components/ProgressBar';
export type { ProgressBarProps } from './components/ProgressBar';

export { Progress } from './components/Progress';
export type { ProgressProps } from './components/Progress';

// Overlay Components
export { default as Modal } from './components/Modal';
export type { ModalProps } from './components/Modal';

export { default as Toast } from './components/Toast';
export type { ToastProps } from './components/Toast';

// Navigation Components
export { default as StepIndicator } from './components/StepIndicator';
export type { StepIndicatorProps, Step } from './components/StepIndicator';

export { PageHeader } from './components/PageHeader';
export type { PageHeaderProps, BreadcrumbItem } from './components/PageHeader';

// Data Display Components
export { Avatar } from './components/Avatar';
export type { AvatarProps } from './components/Avatar';

export { StatCard } from './components/StatCard';
export type { StatCardProps } from './components/StatCard';

export { DataTable } from './components/DataTable';
export type { DataTableProps, Column } from './components/DataTable';

// Feedback Components
export { Loading } from './components/Loading';
export type { LoadingProps } from './components/Loading';

export { EmptyState } from './components/EmptyState';
export type { EmptyStateProps } from './components/EmptyState';

export { ErrorBoundary } from './components/ErrorBoundary';

// Loading States
export {
  LoadingSpinner,
  PageLoading,
  ButtonLoading,
  Skeleton,
  CardSkeleton,
  TableSkeleton,
} from './components/LoadingStates';

// Design Tokens
export * from './design-tokens';
export { default as designTokens } from './design-tokens';

// Utilities
export { cn } from './lib/utils';
