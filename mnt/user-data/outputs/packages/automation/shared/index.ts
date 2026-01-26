// ============================================================================
// SHARED INFRASTRUCTURE
// ============================================================================
// packages/automation/shared/index.ts

export * from './queue';
export * from './events';
export * from './ai';
export * from './integrations';
export * from './utils';

// ============================================================================
// QUEUE SETUP (BullMQ)
// ============================================================================
// packages/automation/shared/queue/index.ts

import { Queue, Worker, QueueScheduler, Job } from 'bullmq';
import Redis from 'ioredis';

// Redis connection
const createRedisConnection = () => new Redis(process.env.REDIS_URL!, {
  maxRetriesPerRequest: null,
  enableReadyCheck: false,
});

export const connection = createRedisConnection();

// Queue names
export const QUEUE_NAMES = {
  BID_ENGINE: 'bid-engine',
  VISIT_SCHEDULER: 'visit-scheduler',
  CHANGE_ORDER: 'change-order',
  REPORT_GENERATOR: 'report-generator',
  PERMIT_TRACKER: 'permit-tracker',
  INSPECTION: 'inspection-coordinator',
  BUDGET_TRACKER: 'budget-tracker',
  COMMUNICATION: 'communication-hub',
  TASK_QUEUE: 'task-queue',
  DOCUMENT_GENERATOR: 'document-generator',
  PREDICTIVE: 'predictive-engine',
  SMART_SCHEDULER: 'smart-scheduler',
  QA_INSPECTOR: 'qa-inspector',
  DECISION_SUPPORT: 'decision-support',
} as const;

// Create all queues
export const queues = Object.fromEntries(
  Object.entries(QUEUE_NAMES).map(([key, name]) => [
    key,
    new Queue(name, { connection: createRedisConnection() })
  ])
) as Record<keyof typeof QUEUE_NAMES, Queue>;

// Create all schedulers
export const schedulers = Object.fromEntries(
  Object.entries(QUEUE_NAMES).map(([key, name]) => [
    key,
    new QueueScheduler(name, { connection: createRedisConnection() })
  ])
) as Record<keyof typeof QUEUE_NAMES, QueueScheduler>;

// Worker factory
export function createWorker<T = any>(
  queueName: string,
  processor: (job: Job<T>) => Promise<any>,
  concurrency = 5
): Worker {
  return new Worker(queueName, processor, {
    connection: createRedisConnection(),
    concurrency,
    limiter: {
      max: 100,
      duration: 60000, // 100 jobs per minute
    },
  });
}

// Job options presets
export const JOB_OPTIONS = {
  DEFAULT: {
    attempts: 3,
    backoff: { type: 'exponential', delay: 1000 },
    removeOnComplete: { age: 86400 }, // 24 hours
    removeOnFail: { age: 604800 }, // 7 days
  },
  HIGH_PRIORITY: {
    priority: 1,
    attempts: 5,
    backoff: { type: 'exponential', delay: 500 },
  },
  SCHEDULED: {
    attempts: 3,
    backoff: { type: 'fixed', delay: 5000 },
  },
};

// ============================================================================
// EVENT BUS (Redis Pub/Sub)
// ============================================================================
// packages/automation/shared/events/index.ts

import Redis from 'ioredis';
import { EventEmitter } from 'events';

export interface KealeeEvent<T = any> {
  type: string;
  data: T;
  timestamp: string;
  source: string;
  correlationId?: string;
}

// Event types
export const EVENT_TYPES = {
  // Project events
  PROJECT_CREATED: 'project.created',
  PROJECT_PHASE_CHANGED: 'project.phase.changed',
  PROJECT_MILESTONE_DUE: 'project.milestone.due',
  PROJECT_COMPLETED: 'project.completed',
  
  // Bid events
  BID_REQUEST_CREATED: 'bid.request.created',
  BID_INVITATION_SENT: 'bid.invitation.sent',
  BID_SUBMITTED: 'bid.submitted',
  BID_DEADLINE_APPROACHING: 'bid.deadline.approaching',
  BID_ANALYSIS_COMPLETE: 'bid.analysis.complete',
  
  // Visit events
  VISIT_SCHEDULED: 'visit.scheduled',
  VISIT_REMINDER: 'visit.reminder',
  VISIT_COMPLETED: 'visit.completed',
  VISIT_REPORT_GENERATED: 'visit.report.generated',
  
  // Permit events
  PERMIT_STATUS_CHANGED: 'permit.status.changed',
  PERMIT_COMMENTS_RECEIVED: 'permit.comments.received',
  PERMIT_APPROVED: 'permit.approved',
  PERMIT_EXPIRING: 'permit.expiring',
  
  // Inspection events
  INSPECTION_SCHEDULED: 'inspection.scheduled',
  INSPECTION_COMPLETED: 'inspection.completed',
  INSPECTION_FAILED: 'inspection.failed',
  
  // Change order events
  CHANGE_ORDER_CREATED: 'change_order.created',
  CHANGE_ORDER_APPROVED: 'change_order.approved',
  CHANGE_ORDER_REJECTED: 'change_order.rejected',
  
  // Budget events
  BUDGET_THRESHOLD_EXCEEDED: 'budget.threshold.exceeded',
  BUDGET_VARIANCE_DETECTED: 'budget.variance.detected',
  
  // Report events
  REPORT_DUE: 'report.due',
  REPORT_GENERATED: 'report.generated',
  REPORT_SENT: 'report.sent',
  
  // AI events
  PREDICTION_GENERATED: 'prediction.generated',
  RISK_ALERT: 'risk.alert',
  QA_ISSUE_DETECTED: 'qa.issue.detected',
  
  // Task events
  TASK_CREATED: 'task.created',
  TASK_ASSIGNED: 'task.assigned',
  TASK_COMPLETED: 'task.completed',
  TASK_OVERDUE: 'task.overdue',
} as const;

export class EventBus extends EventEmitter {
  private publisher: Redis;
  private subscriber: Redis;
  private readonly channel = 'kealee:events';

  constructor() {
    super();
    this.publisher = new Redis(process.env.REDIS_URL!);
    this.subscriber = new Redis(process.env.REDIS_URL!);
    this.setupSubscriber();
  }

  private setupSubscriber() {
    this.subscriber.subscribe(this.channel);
    this.subscriber.on('message', (channel, message) => {
      try {
        const event: KealeeEvent = JSON.parse(message);
        this.emit(event.type, event);
        this.emit('*', event); // Wildcard for all events
      } catch (error) {
        console.error('Failed to parse event:', error);
      }
    });
  }

  async publish<T>(type: string, data: T, source: string, correlationId?: string): Promise<void> {
    const event: KealeeEvent<T> = {
      type,
      data,
      timestamp: new Date().toISOString(),
      source,
      correlationId,
    };
    await this.publisher.publish(this.channel, JSON.stringify(event));
  }

  subscribe(eventType: string, handler: (event: KealeeEvent) => void): void {
    this.on(eventType, handler);
  }

  unsubscribe(eventType: string, handler: (event: KealeeEvent) => void): void {
    this.off(eventType, handler);
  }
}

// Singleton
let eventBus: EventBus | null = null;
export const getEventBus = (): EventBus => {
  if (!eventBus) {
    eventBus = new EventBus();
  }
  return eventBus;
};

// ============================================================================
// AI UTILITIES
// ============================================================================
// packages/automation/shared/ai/index.ts

import Anthropic from '@anthropic-ai/sdk';

// Claude AI client
export const claude = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY!,
});

// AI request helper
export async function generateText(
  prompt: string,
  systemPrompt?: string,
  maxTokens = 4096
): Promise<string> {
  const response = await claude.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: maxTokens,
    system: systemPrompt,
    messages: [{ role: 'user', content: prompt }],
  });

  const textBlock = response.content.find(block => block.type === 'text');
  return textBlock?.text || '';
}

// Structured JSON output
export async function generateJSON<T>(
  prompt: string,
  systemPrompt?: string
): Promise<T> {
  const response = await generateText(
    prompt + '\n\nRespond with valid JSON only, no markdown or explanation.',
    systemPrompt
  );
  
  // Extract JSON from response
  const jsonMatch = response.match(/\{[\s\S]*\}|\[[\s\S]*\]/);
  if (!jsonMatch) {
    throw new Error('No JSON found in response');
  }
  
  return JSON.parse(jsonMatch[0]);
}

// Report narrative generation
export async function generateReportNarrative(data: {
  projectName: string;
  periodStart: Date;
  periodEnd: Date;
  progress: { phase: string; percentComplete: number };
  schedule: { status: string; variance: number };
  budget: { spent: number; remaining: number; variance: number };
  highlights: string[];
  issues: string[];
  nextSteps: string[];
}): Promise<string> {
  const prompt = `Generate a professional construction project status report narrative.

PROJECT: ${data.projectName}
PERIOD: ${data.periodStart.toLocaleDateString()} - ${data.periodEnd.toLocaleDateString()}

PROGRESS:
- Phase: ${data.progress.phase}
- Completion: ${data.progress.percentComplete}%

SCHEDULE:
- Status: ${data.schedule.status}
- Variance: ${data.schedule.variance} days

BUDGET:
- Spent: $${data.budget.spent.toLocaleString()}
- Remaining: $${data.budget.remaining.toLocaleString()}
- Variance: ${data.budget.variance > 0 ? '+' : ''}${data.budget.variance}%

HIGHLIGHTS:
${data.highlights.map(h => `- ${h}`).join('\n')}

ISSUES:
${data.issues.map(i => `- ${i}`).join('\n')}

NEXT STEPS:
${data.nextSteps.map(n => `- ${n}`).join('\n')}

Write a clear, professional narrative summary (3-4 paragraphs) suitable for client communication.`;

  return generateText(prompt, 'You are a professional construction project manager writing status reports.');
}

// ============================================================================
// INTEGRATIONS
// ============================================================================
// packages/automation/shared/integrations/index.ts

export * from './docusign';
export * from './sendgrid';
export * from './twilio';
export * from './google-calendar';
export * from './google-maps';
export * from './gohighlevel';
export * from './weather';

// ============================================================================
// DOCUSIGN INTEGRATION
// ============================================================================
// packages/automation/shared/integrations/docusign.ts

import docusign from 'docusign-esign';

export class DocuSignClient {
  private apiClient: docusign.ApiClient;
  private accountId: string;

  constructor() {
    this.apiClient = new docusign.ApiClient();
    this.apiClient.setBasePath(process.env.DOCUSIGN_BASE_PATH || 'https://na4.docusign.net/restapi');
    this.accountId = process.env.DOCUSIGN_ACCOUNT_ID!;
  }

  async authenticate(): Promise<void> {
    const privateKey = Buffer.from(process.env.DOCUSIGN_PRIVATE_KEY!, 'base64');
    const results = await this.apiClient.requestJWTUserToken(
      process.env.DOCUSIGN_INTEGRATION_KEY!,
      process.env.DOCUSIGN_USER_ID!,
      ['signature', 'impersonation'],
      privateKey,
      3600
    );
    this.apiClient.addDefaultHeader('Authorization', `Bearer ${results.body.access_token}`);
  }

  async sendEnvelope(params: {
    documentBase64: string;
    documentName: string;
    signers: Array<{
      email: string;
      name: string;
      recipientId: string;
      signHereTab?: { x: number; y: number; page: number };
    }>;
    emailSubject: string;
  }): Promise<string> {
    await this.authenticate();

    const envelopesApi = new docusign.EnvelopesApi(this.apiClient);

    const envelope: docusign.EnvelopeDefinition = {
      emailSubject: params.emailSubject,
      documents: [{
        documentBase64: params.documentBase64,
        name: params.documentName,
        fileExtension: 'pdf',
        documentId: '1',
      }],
      recipients: {
        signers: params.signers.map(signer => ({
          email: signer.email,
          name: signer.name,
          recipientId: signer.recipientId,
          routingOrder: '1',
          tabs: signer.signHereTab ? {
            signHereTabs: [{
              xPosition: signer.signHereTab.x.toString(),
              yPosition: signer.signHereTab.y.toString(),
              documentId: '1',
              pageNumber: signer.signHereTab.page.toString(),
            }],
          } : undefined,
        })),
      },
      status: 'sent',
    };

    const result = await envelopesApi.createEnvelope(this.accountId, { envelopeDefinition: envelope });
    return result.envelopeId!;
  }

  async getEnvelopeStatus(envelopeId: string): Promise<string> {
    await this.authenticate();
    const envelopesApi = new docusign.EnvelopesApi(this.apiClient);
    const result = await envelopesApi.getEnvelope(this.accountId, envelopeId);
    return result.status!;
  }
}

// ============================================================================
// SENDGRID INTEGRATION
// ============================================================================
// packages/automation/shared/integrations/sendgrid.ts

import sgMail from '@sendgrid/mail';

sgMail.setApiKey(process.env.SENDGRID_API_KEY!);

export interface EmailParams {
  to: string | string[];
  subject: string;
  html?: string;
  text?: string;
  templateId?: string;
  dynamicTemplateData?: Record<string, any>;
  attachments?: Array<{
    content: string; // Base64
    filename: string;
    type: string;
    disposition?: 'attachment' | 'inline';
  }>;
}

export async function sendEmail(params: EmailParams): Promise<void> {
  await sgMail.send({
    to: params.to,
    from: {
      email: process.env.SENDGRID_FROM_EMAIL!,
      name: 'Kealee Construction',
    },
    subject: params.subject,
    html: params.html,
    text: params.text,
    templateId: params.templateId,
    dynamicTemplateData: params.dynamicTemplateData,
    attachments: params.attachments,
  });
}

// Email templates
export const EMAIL_TEMPLATES = {
  BID_INVITATION: 'd-xxxxxxxxxxxx',
  BID_RECEIVED: 'd-xxxxxxxxxxxx',
  VISIT_REMINDER: 'd-xxxxxxxxxxxx',
  REPORT_DELIVERY: 'd-xxxxxxxxxxxx',
  PERMIT_STATUS: 'd-xxxxxxxxxxxx',
  INSPECTION_RESULT: 'd-xxxxxxxxxxxx',
  CHANGE_ORDER_REQUEST: 'd-xxxxxxxxxxxx',
  BUDGET_ALERT: 'd-xxxxxxxxxxxx',
};

// ============================================================================
// TWILIO INTEGRATION
// ============================================================================
// packages/automation/shared/integrations/twilio.ts

import twilio from 'twilio';

const client = twilio(
  process.env.TWILIO_ACCOUNT_SID!,
  process.env.TWILIO_AUTH_TOKEN!
);

export async function sendSMS(to: string, body: string): Promise<string> {
  const message = await client.messages.create({
    body,
    from: process.env.TWILIO_PHONE_NUMBER!,
    to,
  });
  return message.sid;
}

export async function sendWhatsApp(to: string, body: string): Promise<string> {
  const message = await client.messages.create({
    body,
    from: `whatsapp:${process.env.TWILIO_WHATSAPP_NUMBER!}`,
    to: `whatsapp:${to}`,
  });
  return message.sid;
}

// ============================================================================
// GOOGLE CALENDAR INTEGRATION
// ============================================================================
// packages/automation/shared/integrations/google-calendar.ts

import { google } from 'googleapis';

const auth = new google.auth.GoogleAuth({
  credentials: JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT!),
  scopes: ['https://www.googleapis.com/auth/calendar'],
});

const calendar = google.calendar({ version: 'v3', auth });

export interface CalendarEvent {
  summary: string;
  description?: string;
  location?: string;
  start: Date;
  end: Date;
  attendees?: string[];
}

export async function createCalendarEvent(
  calendarId: string,
  event: CalendarEvent
): Promise<string> {
  const result = await calendar.events.insert({
    calendarId,
    requestBody: {
      summary: event.summary,
      description: event.description,
      location: event.location,
      start: { dateTime: event.start.toISOString() },
      end: { dateTime: event.end.toISOString() },
      attendees: event.attendees?.map(email => ({ email })),
      reminders: {
        useDefault: false,
        overrides: [
          { method: 'email', minutes: 60 },
          { method: 'popup', minutes: 30 },
        ],
      },
    },
  });
  return result.data.id!;
}

export async function getAvailableSlots(
  calendarId: string,
  startDate: Date,
  endDate: Date,
  durationMinutes: number
): Promise<Array<{ start: Date; end: Date }>> {
  const freeBusy = await calendar.freebusy.query({
    requestBody: {
      timeMin: startDate.toISOString(),
      timeMax: endDate.toISOString(),
      items: [{ id: calendarId }],
    },
  });

  const busyPeriods = freeBusy.data.calendars?.[calendarId]?.busy || [];
  const slots: Array<{ start: Date; end: Date }> = [];
  
  // Find available slots (simplified - production would need more logic)
  let current = new Date(startDate);
  const workDayStart = 9; // 9 AM
  const workDayEnd = 17; // 5 PM

  while (current < endDate) {
    const hour = current.getHours();
    
    if (hour >= workDayStart && hour < workDayEnd) {
      const slotEnd = new Date(current.getTime() + durationMinutes * 60000);
      
      const isBusy = busyPeriods.some(busy => {
        const busyStart = new Date(busy.start!);
        const busyEnd = new Date(busy.end!);
        return current < busyEnd && slotEnd > busyStart;
      });

      if (!isBusy) {
        slots.push({ start: new Date(current), end: slotEnd });
      }
    }

    current = new Date(current.getTime() + 30 * 60000); // 30-minute increments
  }

  return slots;
}

// ============================================================================
// GOOGLE MAPS INTEGRATION
// ============================================================================
// packages/automation/shared/integrations/google-maps.ts

import { Client } from '@googlemaps/google-maps-services-js';

const mapsClient = new Client({});

export interface Location {
  lat: number;
  lng: number;
  address?: string;
}

export async function geocodeAddress(address: string): Promise<Location> {
  const response = await mapsClient.geocode({
    params: {
      address,
      key: process.env.GOOGLE_MAPS_API_KEY!,
    },
  });

  const result = response.data.results[0];
  return {
    lat: result.geometry.location.lat,
    lng: result.geometry.location.lng,
    address: result.formatted_address,
  };
}

export async function calculateRoute(
  origin: Location,
  destinations: Location[]
): Promise<Array<{ destination: Location; distance: number; duration: number }>> {
  const response = await mapsClient.distancematrix({
    params: {
      origins: [`${origin.lat},${origin.lng}`],
      destinations: destinations.map(d => `${d.lat},${d.lng}`),
      key: process.env.GOOGLE_MAPS_API_KEY!,
    },
  });

  return response.data.rows[0].elements.map((element, index) => ({
    destination: destinations[index],
    distance: element.distance?.value || 0, // meters
    duration: element.duration?.value || 0, // seconds
  }));
}

export async function optimizeRoute(
  origin: Location,
  waypoints: Location[]
): Promise<Location[]> {
  const response = await mapsClient.directions({
    params: {
      origin: `${origin.lat},${origin.lng}`,
      destination: `${origin.lat},${origin.lng}`, // Return to origin
      waypoints: waypoints.map(w => `${w.lat},${w.lng}`),
      optimize: true,
      key: process.env.GOOGLE_MAPS_API_KEY!,
    },
  });

  const order = response.data.routes[0]?.waypoint_order || [];
  return order.map(i => waypoints[i]);
}

// ============================================================================
// GOHIGHLEVEL INTEGRATION
// ============================================================================
// packages/automation/shared/integrations/gohighlevel.ts

import axios from 'axios';

const ghlApi = axios.create({
  baseURL: 'https://rest.gohighlevel.com/v1',
  headers: {
    'Authorization': `Bearer ${process.env.GOHIGHLEVEL_API_KEY}`,
    'Content-Type': 'application/json',
  },
});

export interface GHLContact {
  id?: string;
  email: string;
  phone?: string;
  firstName: string;
  lastName: string;
  tags?: string[];
  customFields?: Record<string, any>;
}

export async function createOrUpdateContact(contact: GHLContact): Promise<string> {
  // Check if contact exists
  const existing = await ghlApi.get('/contacts/lookup', {
    params: { email: contact.email },
  }).catch(() => null);

  if (existing?.data?.contacts?.[0]) {
    // Update existing
    const id = existing.data.contacts[0].id;
    await ghlApi.put(`/contacts/${id}`, contact);
    return id;
  }

  // Create new
  const response = await ghlApi.post('/contacts', contact);
  return response.data.contact.id;
}

export async function addContactToWorkflow(
  contactId: string,
  workflowId: string
): Promise<void> {
  await ghlApi.post(`/contacts/${contactId}/workflow/${workflowId}`);
}

export async function sendInternalNotification(
  userId: string,
  message: string
): Promise<void> {
  await ghlApi.post('/conversations/messages', {
    type: 'Internal',
    userId,
    body: message,
  });
}

// ============================================================================
// WEATHER INTEGRATION
// ============================================================================
// packages/automation/shared/integrations/weather.ts

import axios from 'axios';

const weatherApi = axios.create({
  baseURL: 'https://api.openweathermap.org/data/2.5',
});

export interface WeatherForecast {
  date: Date;
  temp: { min: number; max: number };
  conditions: string;
  precipitation: number; // Probability 0-1
  wind: number; // mph
  isWorkable: boolean;
}

export async function getWeatherForecast(
  lat: number,
  lng: number,
  days = 7
): Promise<WeatherForecast[]> {
  const response = await weatherApi.get('/forecast', {
    params: {
      lat,
      lon: lng,
      units: 'imperial',
      appid: process.env.OPENWEATHER_API_KEY!,
    },
  });

  // Process 3-hour forecasts into daily summaries
  const dailyForecasts = new Map<string, any[]>();
  
  for (const item of response.data.list) {
    const date = item.dt_txt.split(' ')[0];
    if (!dailyForecasts.has(date)) {
      dailyForecasts.set(date, []);
    }
    dailyForecasts.get(date)!.push(item);
  }

  return Array.from(dailyForecasts.entries())
    .slice(0, days)
    .map(([date, items]) => {
      const temps = items.map(i => i.main.temp);
      const precip = items.reduce((sum, i) => sum + (i.pop || 0), 0) / items.length;
      const winds = items.map(i => i.wind.speed);
      const conditions = items[Math.floor(items.length / 2)].weather[0].main;

      return {
        date: new Date(date),
        temp: {
          min: Math.min(...temps),
          max: Math.max(...temps),
        },
        conditions,
        precipitation: precip,
        wind: Math.max(...winds),
        isWorkable: precip < 0.5 && Math.max(...winds) < 25 && 
                    Math.min(...temps) > 32 && Math.max(...temps) < 100,
      };
    });
}

// ============================================================================
// UTILITIES
// ============================================================================
// packages/automation/shared/utils/index.ts

export * from './date';
export * from './money';
export * from './validation';
export * from './retry';

// ============================================================================
// DATE UTILITIES
// ============================================================================
// packages/automation/shared/utils/date.ts

import { addDays, addWeeks, addMonths, format, differenceInDays, isWeekend, startOfWeek, endOfWeek } from 'date-fns';

export function getWorkingDays(startDate: Date, endDate: Date): number {
  let count = 0;
  let current = new Date(startDate);
  
  while (current <= endDate) {
    if (!isWeekend(current)) {
      count++;
    }
    current = addDays(current, 1);
  }
  
  return count;
}

export function addWorkingDays(date: Date, days: number): Date {
  let result = new Date(date);
  let added = 0;
  
  while (added < days) {
    result = addDays(result, 1);
    if (!isWeekend(result)) {
      added++;
    }
  }
  
  return result;
}

export function getReportPeriod(type: 'weekly' | 'biweekly' | 'monthly', referenceDate = new Date()): {
  start: Date;
  end: Date;
} {
  switch (type) {
    case 'weekly':
      return {
        start: startOfWeek(referenceDate),
        end: endOfWeek(referenceDate),
      };
    case 'biweekly':
      const twoWeeksAgo = addWeeks(referenceDate, -2);
      return {
        start: startOfWeek(twoWeeksAgo),
        end: endOfWeek(referenceDate),
      };
    case 'monthly':
      const firstDay = new Date(referenceDate.getFullYear(), referenceDate.getMonth(), 1);
      const lastDay = new Date(referenceDate.getFullYear(), referenceDate.getMonth() + 1, 0);
      return { start: firstDay, end: lastDay };
  }
}

export function formatDate(date: Date, pattern = 'MMM d, yyyy'): string {
  return format(date, pattern);
}

// ============================================================================
// MONEY UTILITIES
// ============================================================================
// packages/automation/shared/utils/money.ts

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

export function calculatePercentage(part: number, whole: number): number {
  if (whole === 0) return 0;
  return Math.round((part / whole) * 100 * 10) / 10;
}

export function calculateVariance(actual: number, budgeted: number): {
  amount: number;
  percentage: number;
  status: 'under' | 'on-track' | 'over';
} {
  const amount = actual - budgeted;
  const percentage = calculatePercentage(amount, budgeted);
  
  let status: 'under' | 'on-track' | 'over';
  if (percentage < -5) status = 'under';
  else if (percentage > 5) status = 'over';
  else status = 'on-track';
  
  return { amount, percentage, status };
}

// ============================================================================
// RETRY UTILITY
// ============================================================================
// packages/automation/shared/utils/retry.ts

export interface RetryOptions {
  maxAttempts?: number;
  delayMs?: number;
  backoffMultiplier?: number;
  maxDelayMs?: number;
  retryCondition?: (error: any) => boolean;
}

export async function retry<T>(
  fn: () => Promise<T>,
  options: RetryOptions = {}
): Promise<T> {
  const {
    maxAttempts = 3,
    delayMs = 1000,
    backoffMultiplier = 2,
    maxDelayMs = 30000,
    retryCondition = () => true,
  } = options;

  let lastError: any;
  let currentDelay = delayMs;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      
      if (attempt === maxAttempts || !retryCondition(error)) {
        throw error;
      }

      console.log(`Attempt ${attempt} failed, retrying in ${currentDelay}ms...`);
      await new Promise(resolve => setTimeout(resolve, currentDelay));
      currentDelay = Math.min(currentDelay * backoffMultiplier, maxDelayMs);
    }
  }

  throw lastError;
}
