// Email (Resend)
export {
  sendEmail,
  sendBatchEmails,
  sendEmailWithTemplate,
  wrapInEmailLayout,
} from './email';
export type {
  SendEmailOptions,
  SendEmailResult,
  BatchEmailMessage,
  BatchEmailResult,
  SendTemplateEmailOptions,
} from './email';

// SMS & WhatsApp (Twilio)
export {
  sendSMS,
  sendWhatsApp,
  SMS_TEMPLATES,
} from './sms';
export type {
  SendSMSOptions,
  SendSMSResult,
  SendWhatsAppOptions,
} from './sms';

// In-App Notifications
export {
  createInAppNotification,
  markAsRead,
  markAllRead,
  getUnreadNotifications,
  getUnreadCount,
  getNotifications,
  cleanupOldNotifications,
} from './in-app';
export type {
  CreateNotificationOptions,
  NotificationRecord,
} from './in-app';

// Templates
export { EmailLayout } from './templates/email-layout';
export { WelcomeEmail } from './templates/welcome';
export { NewLeadEmail } from './templates/new-lead';
export { BidAcceptedEmail } from './templates/bid-accepted';
export { MilestoneCompleteEmail } from './templates/milestone-complete';
export { WeeklyReportEmail } from './templates/weekly-report';
export { PaymentReleasedEmail } from './templates/payment-released';
export { PaymentFailedEmail } from './templates/payment-failed';
export { QAIssueEmail } from './templates/qa-issue';
export { DecisionNeededEmail } from './templates/decision-needed';
export { BidSubmittedEmail } from './templates/bid-submitted';
export { ContractSignedEmail } from './templates/contract-signed';
export { InspectionPassedEmail } from './templates/inspection-passed';
export { InspectionFailedEmail } from './templates/inspection-failed';
export { BudgetAlertEmail } from './templates/budget-alert';
export { ScheduleDisruptionEmail } from './templates/schedule-disruption';
export { EscrowFundedEmail } from './templates/escrow-funded';
export { ChangeOrderEmail } from './templates/change-order';
export { ConceptPackageConfirmationEmail } from './templates/concept-package-confirmation';
export { OrderStatusUpdateEmail } from './templates/order-status-update';
export { AccountSetupEmail } from './templates/account-setup';
