/**
 * Public Portal Services
 * Main export for all public portal services
 */

export {permitSearchService} from './permit-search';
export {permitTimelineService} from './permit-timeline';
export {documentViewerService} from './document-viewer';
export {publicCommentsService} from './public-comments';
export {calendarIntegrationService} from './calendar-integration';
export {faqResourcesService} from './faq-resources';

export type {
  PermitSearchQuery,
  PublicPermitInfo,
  PermitSearchResult,
} from './permit-search';

export type {
  PermitTimelineEvent,
  PermitTimeline,
} from './permit-timeline';

export type {
  PublicDocument,
  PublicInspectionResult,
} from './document-viewer';

export type {
  PublicComment,
  PublicCommentSubmission,
} from './public-comments';

export type {
  PublicHearing,
  MeetingCalendar,
} from './calendar-integration';

export type {
  FAQItem,
  EducationalResource,
} from './faq-resources';
