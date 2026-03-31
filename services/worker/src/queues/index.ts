// Export all queues
export { BaseQueue } from './base.queue'
export type { BaseJobData } from './base.queue'

// Queue instances
export { EmailQueue, emailQueue } from './email.queue'
export { WebhookQueue, webhookQueue } from './webhook.queue'
export { MLQueue, mlQueue } from './ml.queue'
export { ReportsQueue, reportsQueue } from './reports.queue'
export { SalesQueue, salesQueue } from './sales.queue'
export { MLPredictionQueue, mlPredictionQueue } from './ml-prediction.queue'
export { LeadFollowupQueue, leadFollowupQueue } from './lead-followup.queue'
export type { LeadFollowupJobData } from './lead-followup.queue'