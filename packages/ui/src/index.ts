// packages/ui/src/index.ts
// Kealee Platform UI Component Library - Main Export

// ========================================
// Base Components
// ========================================
export { default as Button } from './components/Button';
export type { ButtonProps } from './components/Button';

export { default as Input } from './components/Input';
export type { InputProps } from './components/Input';

export { default as Textarea } from './components/Textarea';
export type { TextareaProps } from './components/Textarea';

export { default as Card } from './components/Card';
export type { CardProps } from './components/Card';

export { default as Badge } from './components/Badge';
export type { BadgeProps } from './components/Badge';

export { default as ProgressBar } from './components/ProgressBar';
export type { ProgressBarProps } from './components/ProgressBar';

export { Progress } from './components/Progress';
export type { ProgressProps } from './components/Progress';

export { default as Modal } from './components/Modal';
export type { ModalProps } from './components/Modal';

export { default as Toast } from './components/Toast';
export type { ToastProps } from './components/Toast';

export { default as StepIndicator } from './components/StepIndicator';
export type { StepIndicatorProps, Step } from './components/StepIndicator';

export { Avatar } from './components/Avatar';
export type { AvatarProps } from './components/Avatar';

export { Loading } from './components/Loading';
export type { LoadingProps } from './components/Loading';

export { EmptyState } from './components/EmptyState';
export type { EmptyStateProps } from './components/EmptyState';

export { ErrorBoundary } from './components/ErrorBoundary';

// ========================================
// Layout Components
// ========================================
export {
  AppShell,
  useAppShell,
  ClientPortalLayout,
  OperationalLayout,
  Sidebar,
  TopNav,
  PageHeader,
  PageHeaderTab,
  PageHeaderTabs,
} from './components/layout';

export type {
  AppShellProps,
  ClientPortalLayoutProps,
  OperationalLayoutProps,
  SidebarProps,
  SidebarNavItem,
  SidebarSection,
  TopNavProps,
  UserInfo,
  Notification,
  PageHeaderProps,
  PageHeaderTabProps,
  BreadcrumbItem,
} from './components/layout';

// ========================================
// Card Components (Domain-Specific)
// ========================================
export {
  ProjectCard,
  BidCard,
  TaskCard,
  ContractorCard,
  EstimateCard,
  EscrowCard,
} from './components/cards';

export type {
  ProjectCardProps,
  ProjectStatus,
  BidCardProps,
  BidStatus,
  TaskCardProps,
  TaskStatus,
  TaskPriority,
  TaskAssignee,
  ContractorCardProps,
  ContractorStatus,
  ContractorSpecialty,
  ContractorCertification,
  EstimateCardProps,
  EstimateStatus,
  EstimateConfidence,
  EstimateCostBreakdown,
  EscrowCardProps,
  EscrowStatus,
  EscrowTransactionType,
  EscrowTransaction,
  EscrowMilestone,
} from './components/cards';

// ========================================
// Data Display Components
// ========================================
export {
  DataTable,
  KanbanBoard,
  Timeline,
  ProgressTracker,
  MetricCard,
  VisualTimeline,
  BeforeAfterSlider,
  BeforeAfterGallery,
} from './components/data-display';

export type {
  DataTableProps,
  Column,
  SortDirection,
  KanbanBoardProps,
  KanbanItem,
  KanbanColumn,
  TimelineProps,
  TimelineItem,
  TimelineItemStatus,
  ProgressTrackerProps,
  ProgressStep,
  StepStatus,
  MetricCardProps,
  TrendDirection,
  TrendSentiment,
  VisualTimelineProps,
  VisualTimelineEntry,
  VisualTimelinePhoto,
  BeforeAfterSliderProps,
  BeforeAfterGalleryProps,
  BeforeAfterPair,
} from './components/data-display';

// ========================================
// Feedback Components
// ========================================
export {
  ToastProvider,
  useToast,
  useToastActions,
  AlertBanner,
  LoadingState,
  Skeleton,
  CardSkeleton,
  TableSkeleton,
  EmptyState as EmptyStateNew,
  EmptyProjects,
  EmptySearchResults,
  EmptyTasks,
  EmptyNotifications,
  ErrorState,
  ComingSoon,
} from './components/feedback';

export type {
  Toast as ToastNotification,
  ToastType,
  ToastProviderProps,
  AlertBannerProps,
  AlertType,
  LoadingStateProps,
  LoadingVariant,
  LoadingSize,
  SkeletonProps,
  CardSkeletonProps,
  TableSkeletonProps,
  EmptyStateProps as EmptyStateNewProps,
  EmptyStateType,
  EmptyStateAction,
  PresetEmptyStateProps,
} from './components/feedback';

// ========================================
// Design Tokens & Theming
// ========================================
// Legacy design tokens (use only non-conflicting exports)
export { designTokens, typography, durations, easing } from './design-tokens';
export { default as designTokensDefault } from './design-tokens';

// New design tokens (preferred - these are the canonical exports)
export {
  colors,
  fonts,
  spacing,
  fontSize,
  fontWeight,
  borderRadius,
  shadows,
  zIndex,
  breakpoints,
  animation,
  tokens,
} from './tokens';
export { default as tokensDefault } from './tokens';

// Themes
export * from './themes';

// ========================================
// Live / Realtime Components
// ========================================
export {
  LiveNotificationBell,
  LiveProjectFeed,
  LiveBudgetTicker,
  LiveProgressBar,
  OnlineIndicator,
  LiveToast,
} from './components/live';

export type {
  LiveNotification,
  LiveNotificationBellProps,
  FeedItem,
  LiveProjectFeedProps,
  LiveBudgetTickerProps,
  LiveProgressBarProps,
  OnlineUser,
  OnlineIndicatorProps,
  LiveToastEvent,
  LiveToastProps,
} from './components/live';

// ========================================
// Scheduling Components
// ========================================
export { SiteCheckIn } from './components/scheduling/SiteCheckIn';
export type { SiteCheckInProps } from './components/scheduling/SiteCheckIn';

// ========================================
// Sensor Components
// ========================================
export { default as SensorWidget } from './components/sensors/SensorWidget';
export type { SensorWidgetProps } from './components/sensors/SensorWidget';

// ========================================
// PWA Components
// ========================================
export {
  ServiceWorkerRegistration,
  MobileBottomNav,
  OfflineBanner,
  PushPermission,
} from './components/pwa';

export type {
  ServiceWorkerRegistrationProps,
  MobileBottomNavProps,
  MobileNavTab,
  OfflineBannerProps,
  PushPermissionProps,
} from './components/pwa';

// ========================================
// PWA Hooks
// ========================================
export { useOfflineQueue } from './hooks/use-offline-queue';
export type {
  OfflineAction,
  SyncStatus,
  UseOfflineQueueReturn,
} from './hooks/use-offline-queue';

export { usePullToRefresh } from './hooks/use-pull-to-refresh';
export type {
  UsePullToRefreshOptions,
  UsePullToRefreshReturn,
} from './hooks/use-pull-to-refresh';

// ========================================
// Marketing Components
// ========================================
export * from './components/marketing';

// ========================================
// Chat Components
// ========================================
export { PlatformChat } from './components/PlatformChat';
export type {
  PlatformChatProps,
  ChatAction as PlatformChatAction,
  ChatSource as PlatformChatSource,
  ConversationMessage as PlatformConversationMessage,
} from './components/PlatformChat';

// ========================================
// Performance Components
// ========================================
export {
  Skeleton as SkeletonShimmer,
  DashboardSkeleton,
  ProjectDetailSkeleton,
  TableSkeleton as TableSkeletonShimmer,
  CardGridSkeleton,
  PhotoGallerySkeleton,
  FormSkeleton,
  TimelineSkeleton,
  ImageOptimized,
} from './components/performance';

export { WebVitals } from './components/performance/WebVitals';

// ========================================
// Upload Components
// ========================================
export { UploadProgress } from './components/uploads/UploadProgress';

// ========================================
// Upload Hooks
// ========================================
export { useChunkedUpload } from './hooks/use-chunked-upload';
export type {
  UploadOptions,
  UploadResult,
  UploadStatus,
  UseChunkedUploadReturn,
} from './hooks/use-chunked-upload';

// ========================================
// Utilities
// ========================================
export { cn } from './lib/utils';
export * from './utils';
