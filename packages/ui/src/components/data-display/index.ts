// packages/ui/src/components/data-display/index.ts
// Data display components for Kealee Platform

export {
  DataTable,
  type DataTableProps,
  type Column,
  type SortDirection,
} from './DataTable';

export {
  KanbanBoard,
  type KanbanBoardProps,
  type KanbanItem,
  type KanbanColumn,
} from './KanbanBoard';

export {
  Timeline,
  type TimelineProps,
  type TimelineItem,
  type TimelineItemStatus,
} from './Timeline';

export {
  ProgressTracker,
  type ProgressTrackerProps,
  type ProgressStep,
  type StepStatus,
} from './ProgressTracker';

export {
  MetricCard,
  type MetricCardProps,
  type TrendDirection,
  type TrendSentiment,
} from './MetricCard';

export {
  VisualTimeline,
  type VisualTimelineProps,
  type VisualTimelineEntry,
  type VisualTimelinePhoto,
} from './VisualTimeline';

export {
  BeforeAfterSlider,
  BeforeAfterGallery,
  type BeforeAfterSliderProps,
  type BeforeAfterGalleryProps,
  type BeforeAfterPair,
} from './BeforeAfterSlider';
