/**
 * services/command-center/workflows/__tests__/contractor-acquisition.test.ts
 *
 * Unit tests for the contractor acquisition workflow.
 * Mocks Redis, SendGrid, Twilio, and internal API calls.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

// ─── Mock external dependencies ───────────────────────────────────────────────

vi.mock('../integrations/sendgrid.js', () => ({
  sendRecruitmentEmail1:      vi.fn().mockResolvedValue(undefined),
  sendRecruitmentEmail2:      vi.fn().mockResolvedValue(undefined),
  sendRecruitmentEmail3:      vi.fn().mockResolvedValue(undefined),
  sendOnboardingWelcome:      vi.fn().mockResolvedValue(undefined),
  sendRegistrationReminder:   vi.fn().mockResolvedValue(undefined),
  sendVerificationReminder:   vi.fn().mockResolvedValue(undefined),
  sendActivationWelcome:      vi.fn().mockResolvedValue(undefined),
  sendReengagementEmail:      vi.fn().mockResolvedValue(undefined),
}));

vi.mock('../integrations/twilio.js', () => ({
  sendOutreachSms:             vi.fn().mockResolvedValue(undefined),
  sendRegistrationReminderSms: vi.fn().mockResolvedValue(undefined),
  sendVerificationReminderSms: vi.fn().mockResolvedValue(undefined),
  sendActivationWelcomeSms:    vi.fn().mockResolvedValue(undefined),
  sendReengagementSms:         vi.fn().mockResolvedValue(undefined),
}));

// Mock fetch for internal API calls
global.fetch = vi.fn().mockResolvedValue({
  ok:   true,
  json: () => Promise.resolve({ id: 'zoho-lead-123', created: true }),
  text: () => Promise.resolve(''),
} as Response);

// Mock BullMQ queue
vi.mock('../shared/queue.js', () => ({
  queues: {
    GROWTH_BOT: {
      add: vi.fn().mockResolvedValue({ id: 'job-1' }),
    },
  },
}));

// ─── Mock Redis ───────────────────────────────────────────────────────────────

function makeMockRedis() {
  const store = new Map<string, string>();
  return {
    set:     vi.fn().mockImplementation(async (key: string, val: string, ...args: unknown[]) => {
      // Simulate SET NX behaviour
      if (args.includes('NX') && store.has(key)) return null;
      store.set(key, val);
      return 'OK';
    }),
    get:     vi.fn().mockImplementation(async (key: string) => store.get(key) ?? null),
    publish: vi.fn().mockResolvedValue(1),
    _store:  store,
  };
}

// ─── Import after mocks ───────────────────────────────────────────────────────

import {
  sendRecruitmentEmail1,
  sendOnboardingWelcome,
  sendVerificationReminder,
  sendActivationWelcome,
  sendReengagementEmail,
} from '../../integrations/sendgrid.js';
import {
  sendOutreachSms,
  sendVerificationReminderSms,
  sendActivationWelcomeSms,
  sendReengagementSms,
} from '../../integrations/twilio.js';
import { ContractorAcquisitionWorkflow } from '../contractor-acquisition.workflow.js';

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('ContractorAcquisitionWorkflow', () => {
  let redis: ReturnType<typeof makeMockRedis>;
  let workflow: ContractorAcquisitionWorkflow;

  beforeEach(() => {
    vi.clearAllMocks();
    redis    = makeMockRedis();
    workflow = new ContractorAcquisitionWorkflow(redis as any);
  });

  // ─── Trade shortage detected ────────────────────────────────────────────────

  describe('handleTradeShortageDetected', () => {
    it('sends Email 1 and outreach SMS for each target', async () => {
      await workflow.handleTradeShortageDetected({
        trade:         'Framing',
        geo:           'Austin, TX',
        shortageScore: 82,
        targetEmails: [
          { email: 'contractor@example.com', firstName: 'Bob', phone: '+15125551234' },
        ],
      });

      expect(sendRecruitmentEmail1).toHaveBeenCalledOnce();
      expect(sendRecruitmentEmail1).toHaveBeenCalledWith(
        expect.objectContaining({ email: 'contractor@example.com', trade: 'Framing' }),
      );

      expect(sendOutreachSms).toHaveBeenCalledOnce();
      expect(sendOutreachSms).toHaveBeenCalledWith(
        expect.objectContaining({ phone: '+15125551234', trade: 'Framing' }),
      );
    });

    it('creates a Zoho lead for each target', async () => {
      await workflow.handleTradeShortageDetected({
        trade:         'Electrical',
        shortageScore: 77,
        targetEmails: [{ email: 'elec@example.com', firstName: 'Alice' }],
      });

      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/zoho/leads'),
        expect.objectContaining({ method: 'POST' }),
      );
    });

    it('deduplicates outreach for the same trade+email within 7 days', async () => {
      const targets = [{ email: 'dup@example.com', firstName: 'Jane' }];

      await workflow.handleTradeShortageDetected({
        trade: 'Concrete', shortageScore: 80, targetEmails: targets,
      });
      await workflow.handleTradeShortageDetected({
        trade: 'Concrete', shortageScore: 85, targetEmails: targets,
      });

      // sendRecruitmentEmail1 should only be called once
      expect(sendRecruitmentEmail1).toHaveBeenCalledTimes(1);
    });

    it('sends nothing when targetEmails is empty', async () => {
      await workflow.handleTradeShortageDetected({
        trade: 'Plumbing', shortageScore: 90, targetEmails: [],
      });

      expect(sendRecruitmentEmail1).not.toHaveBeenCalled();
      expect(sendOutreachSms).not.toHaveBeenCalled();
    });

    it('sends email without SMS if no phone provided', async () => {
      await workflow.handleTradeShortageDetected({
        trade:         'HVAC',
        shortageScore: 76,
        targetEmails: [{ email: 'hvac@example.com', firstName: 'Carlos' }],
      });

      expect(sendRecruitmentEmail1).toHaveBeenCalledOnce();
      expect(sendOutreachSms).not.toHaveBeenCalled();
    });
  });

  // ─── Lead captured ──────────────────────────────────────────────────────────

  describe('handleLeadCaptured', () => {
    it('sends Email 1 when lead captured with email', async () => {
      await workflow.handleLeadCaptured({
        email:     'new@example.com',
        firstName: 'Tom',
        trade:     'Roofing',
        source:    'web-form',
      });

      expect(sendRecruitmentEmail1).toHaveBeenCalledWith(
        expect.objectContaining({ email: 'new@example.com', trade: 'Roofing' }),
      );
    });

    it('deduplicates lead captured within dedup window', async () => {
      await workflow.handleLeadCaptured({ email: 'dup2@example.com' });
      await workflow.handleLeadCaptured({ email: 'dup2@example.com' });

      expect(sendRecruitmentEmail1).toHaveBeenCalledTimes(1);
    });

    it('updates Zoho lead stage when zohoLeadId provided', async () => {
      await workflow.handleLeadCaptured({
        email:       'lead@example.com',
        zohoLeadId:  'lead-abc-123',
      });

      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/zoho/leads/lead-abc-123/stage'),
        expect.objectContaining({ method: 'PUT' }),
      );
    });
  });

  // ─── Registration started ───────────────────────────────────────────────────

  describe('handleRegistrationStarted', () => {
    it('sends onboarding welcome email', async () => {
      await workflow.handleRegistrationStarted({
        email:         'reg@example.com',
        firstName:     'Sara',
        kealeeUserId:  'user-001',
        trade:         'Tile',
      });

      expect(sendOnboardingWelcome).toHaveBeenCalledWith(
        expect.objectContaining({ email: 'reg@example.com', firstName: 'Sara' }),
      );
    });

    it('deduplicates by kealeeUserId', async () => {
      const params = { email: 'r2@example.com', kealeeUserId: 'user-999' };
      await workflow.handleRegistrationStarted(params);
      await workflow.handleRegistrationStarted(params);

      expect(sendOnboardingWelcome).toHaveBeenCalledTimes(1);
    });
  });

  // ─── Documents uploaded ─────────────────────────────────────────────────────

  describe('handleDocumentsUploaded', () => {
    it('sends verification reminder email and SMS', async () => {
      await workflow.handleDocumentsUploaded({
        email:         'docs@example.com',
        phone:         '+15125559999',
        firstName:     'Mike',
        kealeeUserId:  'user-002',
        documentTypes: ['license', 'coi'],
      });

      expect(sendVerificationReminder).toHaveBeenCalledWith(
        expect.objectContaining({ email: 'docs@example.com' }),
      );
      expect(sendVerificationReminderSms).toHaveBeenCalledWith(
        expect.objectContaining({ phone: '+15125559999' }),
      );
    });

    it('updates Zoho lead stage when zohoLeadId present', async () => {
      await workflow.handleDocumentsUploaded({
        kealeeUserId: 'user-003',
        zohoLeadId:   'lead-docs-456',
        documentTypes: ['w9'],
      });

      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/zoho/leads/lead-docs-456/stage'),
        expect.any(Object),
      );
    });
  });

  // ─── Contractor verified ────────────────────────────────────────────────────

  describe('handleContractorVerified', () => {
    it('sends activation email and SMS', async () => {
      await workflow.handleContractorVerified({
        email:        'verified@example.com',
        phone:        '+15125550001',
        firstName:    'Dana',
        trade:        'Concrete',
        kealeeUserId: 'user-100',
      });

      expect(sendActivationWelcome).toHaveBeenCalledWith(
        expect.objectContaining({ email: 'verified@example.com', trade: 'Concrete' }),
      );
      expect(sendActivationWelcomeSms).toHaveBeenCalledWith(
        expect.objectContaining({ phone: '+15125550001', trade: 'Concrete' }),
      );
    });

    it('creates Zoho Contact for verified contractor', async () => {
      await workflow.handleContractorVerified({
        email:        'zohocon@example.com',
        firstName:    'Raj',
        kealeeUserId: 'user-101',
      });

      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/zoho/contacts'),
        expect.objectContaining({ method: 'POST' }),
      );
    });

    it('deduplicates activation within 30-day window', async () => {
      const params = { email: 'act@example.com', kealeeUserId: 'user-200' };
      await workflow.handleContractorVerified(params);
      await workflow.handleContractorVerified(params);

      expect(sendActivationWelcome).toHaveBeenCalledTimes(1);
    });
  });

  // ─── Contractor inactive ────────────────────────────────────────────────────

  describe('handleContractorInactive', () => {
    it('sends re-engagement email and SMS', async () => {
      await workflow.handleContractorInactive({
        email:            'inactive@example.com',
        phone:            '+15125558888',
        firstName:        'Lee',
        trade:            'Drywall',
        kealeeProfileId:  'profile-500',
        daysSinceLast:    75,
        inactivityScore:  82,
      });

      expect(sendReengagementEmail).toHaveBeenCalledWith(
        expect.objectContaining({ email: 'inactive@example.com', trade: 'Drywall' }),
      );
      expect(sendReengagementSms).toHaveBeenCalledWith(
        expect.objectContaining({ phone: '+15125558888', trade: 'Drywall' }),
      );
    });

    it('deduplicates re-engagement within 14 days', async () => {
      const params = { email: 'reng@example.com', kealeeProfileId: 'profile-999' };
      await workflow.handleContractorInactive(params);
      await workflow.handleContractorInactive(params);

      expect(sendReengagementEmail).toHaveBeenCalledTimes(1);
    });

    it('sends only email (no SMS) when phone not provided', async () => {
      await workflow.handleContractorInactive({
        email:            'noPhone@example.com',
        kealeeProfileId:  'profile-888',
      });

      expect(sendReengagementEmail).toHaveBeenCalledOnce();
      expect(sendReengagementSms).not.toHaveBeenCalled();
    });
  });

  // ─── Scheduled follow-up emails ─────────────────────────────────────────────

  describe('processScheduledEmail', () => {
    it('calls sendRecruitmentEmail2 for recruitment-email-2 job', async () => {
      const { sendRecruitmentEmail2 } = await import('../../integrations/sendgrid.js');

      await workflow.processScheduledEmail('recruitment-email-2', {
        email:     'seq@example.com',
        firstName: 'Ann',
        trade:     'Masonry',
      });

      expect(sendRecruitmentEmail2).toHaveBeenCalledWith(
        expect.objectContaining({ email: 'seq@example.com', trade: 'Masonry' }),
      );
    });

    it('calls sendRecruitmentEmail3 for recruitment-email-3 job', async () => {
      const { sendRecruitmentEmail3 } = await import('../../integrations/sendgrid.js');

      await workflow.processScheduledEmail('recruitment-email-3', {
        email: 'seq3@example.com',
        trade: 'Painting',
      });

      expect(sendRecruitmentEmail3).toHaveBeenCalledWith(
        expect.objectContaining({ email: 'seq3@example.com' }),
      );
    });
  });

  // ─── Redis publish ──────────────────────────────────────────────────────────

  describe('event publishing', () => {
    it('publishes documents_uploaded event to Redis', async () => {
      await workflow.handleDocumentsUploaded({
        email:        'pub@example.com',
        kealeeUserId: 'user-pub-001',
      });

      expect(redis.publish).toHaveBeenCalledWith(
        'kealee:events',
        expect.stringContaining('contractor.acquisition.documents_uploaded'),
      );
    });
  });
});
