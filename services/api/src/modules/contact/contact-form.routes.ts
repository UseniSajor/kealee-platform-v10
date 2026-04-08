/**
 * services/api/src/modules/contact/contact-form.routes.ts
 *
 * Contact form submission API — 8 form types, all routed to the right team.
 *
 * POST /contact/submit                 — general contact
 * POST /contact/complete-build         — high-value complete build inquiry
 * POST /contact/enterprise             — enterprise/B2B inquiry
 * POST /contact/partner                — partnership inquiry
 * POST /contact/careers                — job application
 * POST /contact/press                  — media inquiry
 * POST /contact/portal-help            — portal access support
 * POST /contact/404                    — 404 catch-all
 */

import { FastifyInstance } from 'fastify'
import { z } from 'zod'
import { prismaAny } from '../../utils/prisma-helper'
import { sanitizeErrorMessage } from '../../utils/sanitize-error'

// ── Email routing by form type ────────────────────────────────────────────────
const FORM_ROUTING: Record<string, string> = {
  'general':        process.env.KEALEE_LEADS_EMAIL       ?? 'leads@kealee.com',
  'complete-build': process.env.KEALEE_SALES_EMAIL        ?? 'sales@kealee.com',
  'enterprise':     process.env.KEALEE_SALES_EMAIL        ?? 'sales@kealee.com',
  'partner':        process.env.KEALEE_PARTNER_EMAIL      ?? 'partnerships@kealee.com',
  'careers':        process.env.KEALEE_CAREERS_EMAIL      ?? 'careers@kealee.com',
  'press':          process.env.KEALEE_PRESS_EMAIL        ?? 'press@kealee.com',
  'portal-help':    process.env.KEALEE_SUPPORT_EMAIL      ?? 'support@kealee.com',
  '404-lost':       process.env.KEALEE_SUPPORT_EMAIL      ?? 'support@kealee.com',
}

// ── Shared base schema ────────────────────────────────────────────────────────
const BaseSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  phone: z.string().optional(),
  message: z.string().min(5),
  pageUrl: z.string().optional(),
})

// ── Form-specific schemas ─────────────────────────────────────────────────────
const CompleteBuildSchema = BaseSchema.extend({
  projectType: z.string().min(2),
  squareFeet: z.number().int().min(1).optional(),
  jurisdiction: z.string().optional(),
  currentStage: z.enum(['Just thinking', 'Have design ideas', 'Need architect help', 'Ready for contractor']).optional(),
  budget: z.string().optional(),
  timeline: z.string().optional(),
})

const EnterpriseSchema = z.object({
  companyName: z.string().min(2),
  name: z.string().min(2),
  title: z.string().optional(),
  email: z.string().email(),
  phone: z.string().optional(),
  companySize: z.string().optional(),
  projectsPerYear: z.string().optional(),
  specificNeeds: z.string().min(10),
  timeline: z.string().optional(),
  pageUrl: z.string().optional(),
})

const PartnerSchema = z.object({
  organizationName: z.string().min(2),
  name: z.string().min(2),
  email: z.string().email(),
  phone: z.string().optional(),
  partnershipType: z.enum(['Integration/API', 'White-label', 'Referral', 'Distribution', 'Other']),
  proposedCollaboration: z.string().min(10),
  timeline: z.string().optional(),
  pageUrl: z.string().optional(),
})

const CareersSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  phone: z.string().optional(),
  position: z.string().min(2),
  coverLetter: z.string().optional(),
  linkedinUrl: z.string().url().optional(),
  resumeUrl: z.string().optional(),
  pageUrl: z.string().optional(),
})

const PressSchema = z.object({
  name: z.string().min(2),
  publication: z.string().min(2),
  email: z.string().email(),
  phone: z.string().optional(),
  articleTopic: z.string().min(10),
  deadline: z.string().optional(),
  specificQuestions: z.string().optional(),
  pageUrl: z.string().optional(),
})

const PortalHelpSchema = z.object({
  email: z.string().email(),
  issueType: z.enum(["Can't access portal", 'Forgot password', "Can't download files", 'Other issue']),
  description: z.string().min(5),
})

const NotFoundSchema = z.object({
  email: z.string().email(),
  whatTheyNeeded: z.string().min(3),
  pageUrl: z.string().optional(),
})

// ── Helper: save submission ───────────────────────────────────────────────────
async function saveSubmission(data: {
  name: string
  email: string
  phone?: string
  formType: string
  subject: string
  message: string
  pageUrl?: string
  projectType?: string
  jurisdiction?: string
  budget?: string
  resumeUrl?: string
}) {
  return prismaAny.contactFormSubmission.create({ data })
}

// ── Helper: send notification email ──────────────────────────────────────────
async function sendNotification(formType: string, toEmail: string, data: Record<string, any>) {
  // Fire-and-forget — email failures should not block form submission
  try {
    const { emailService } = await import('../email/email.service')
    await emailService.sendEmail({
      to: toEmail,
      subject: `New ${formType} inquiry from ${data.name ?? data.email}`,
      html: `<pre>${JSON.stringify(data, null, 2)}</pre>`,
    })
  } catch {}
}

export async function contactFormRoutes(fastify: FastifyInstance) {

  // ── POST /contact/submit (general) ────────────────────────────────────────
  fastify.post('/submit', async (request, reply) => {
    try {
      const body = BaseSchema.parse(request.body)
      await saveSubmission({
        name: body.name,
        email: body.email,
        phone: body.phone,
        formType: 'general',
        subject: 'General contact inquiry',
        message: body.message,
        pageUrl: body.pageUrl,
      })
      void sendNotification('general', FORM_ROUTING['general'], body)
      return reply.code(201).send({ ok: true, message: "Thanks! We'll get back to you within 24 hours." })
    } catch (error: any) {
      return reply.code(500).send({ error: sanitizeErrorMessage(error, 'Failed to submit form') })
    }
  })

  // ── POST /contact/complete-build ──────────────────────────────────────────
  fastify.post('/complete-build', async (request, reply) => {
    try {
      const body = CompleteBuildSchema.parse(request.body)
      await saveSubmission({
        name: body.name,
        email: body.email,
        phone: body.phone,
        formType: 'complete-build',
        subject: `Complete Build inquiry — ${body.projectType}`,
        message: body.message,
        pageUrl: body.pageUrl,
        projectType: body.projectType,
        jurisdiction: body.jurisdiction,
        budget: body.budget,
      })
      void sendNotification('Complete Build', FORM_ROUTING['complete-build'], body)
      return reply.code(201).send({ ok: true, message: "Got it! A specialist will contact you within 24 hours." })
    } catch (error: any) {
      return reply.code(500).send({ error: sanitizeErrorMessage(error, 'Failed to submit form') })
    }
  })

  // ── POST /contact/enterprise ──────────────────────────────────────────────
  fastify.post('/enterprise', async (request, reply) => {
    try {
      const body = EnterpriseSchema.parse(request.body)
      await saveSubmission({
        name: body.name,
        email: body.email,
        phone: body.phone,
        formType: 'enterprise',
        subject: `Enterprise inquiry — ${body.companyName}`,
        message: body.specificNeeds,
        pageUrl: body.pageUrl,
      })
      void sendNotification('Enterprise', FORM_ROUTING['enterprise'], body)
      return reply.code(201).send({ ok: true, message: "Our business development team will reach out within 2 business days." })
    } catch (error: any) {
      return reply.code(500).send({ error: sanitizeErrorMessage(error, 'Failed to submit form') })
    }
  })

  // ── POST /contact/partner ─────────────────────────────────────────────────
  fastify.post('/partner', async (request, reply) => {
    try {
      const body = PartnerSchema.parse(request.body)
      await saveSubmission({
        name: body.name,
        email: body.email,
        phone: body.phone,
        formType: 'partner',
        subject: `Partnership inquiry — ${body.partnershipType}`,
        message: body.proposedCollaboration,
        pageUrl: body.pageUrl,
      })
      void sendNotification('Partnership', FORM_ROUTING['partner'], body)
      return reply.code(201).send({ ok: true, message: "Our partnerships team will review and get back to you within 5 business days." })
    } catch (error: any) {
      return reply.code(500).send({ error: sanitizeErrorMessage(error, 'Failed to submit form') })
    }
  })

  // ── POST /contact/careers ─────────────────────────────────────────────────
  fastify.post('/careers', async (request, reply) => {
    try {
      const body = CareersSchema.parse(request.body)
      await saveSubmission({
        name: body.name,
        email: body.email,
        phone: body.phone,
        formType: 'careers',
        subject: `Job application — ${body.position}`,
        message: body.coverLetter ?? 'No cover letter provided',
        pageUrl: body.pageUrl,
        resumeUrl: body.resumeUrl,
      })
      void sendNotification('Careers', FORM_ROUTING['careers'], body)
      return reply.code(201).send({ ok: true, message: "Application received! We'll review and reach out if it's a fit." })
    } catch (error: any) {
      return reply.code(500).send({ error: sanitizeErrorMessage(error, 'Failed to submit form') })
    }
  })

  // ── POST /contact/press ───────────────────────────────────────────────────
  fastify.post('/press', async (request, reply) => {
    try {
      const body = PressSchema.parse(request.body)
      await saveSubmission({
        name: body.name,
        email: body.email,
        phone: body.phone,
        formType: 'press',
        subject: `Press inquiry — ${body.publication}`,
        message: body.articleTopic + (body.specificQuestions ? `\n\nQuestions:\n${body.specificQuestions}` : ''),
        pageUrl: body.pageUrl,
      })
      void sendNotification('Press', FORM_ROUTING['press'], body)
      return reply.code(201).send({ ok: true, message: "Press inquiry received. Our media team will respond promptly." })
    } catch (error: any) {
      return reply.code(500).send({ error: sanitizeErrorMessage(error, 'Failed to submit form') })
    }
  })

  // ── POST /contact/portal-help ─────────────────────────────────────────────
  fastify.post('/portal-help', async (request, reply) => {
    try {
      const body = PortalHelpSchema.parse(request.body)
      await saveSubmission({
        name: body.email.split('@')[0],
        email: body.email,
        formType: 'portal-help',
        subject: `Portal help — ${body.issueType}`,
        message: body.description,
      })
      void sendNotification('Portal Help', FORM_ROUTING['portal-help'], body)
      return reply.code(201).send({ ok: true, message: "We'll help you access your portal right away! Check your email." })
    } catch (error: any) {
      return reply.code(500).send({ error: sanitizeErrorMessage(error, 'Failed to submit form') })
    }
  })

  // ── POST /contact/404 ─────────────────────────────────────────────────────
  fastify.post('/404', async (request, reply) => {
    try {
      const body = NotFoundSchema.parse(request.body)
      await saveSubmission({
        name: body.email.split('@')[0],
        email: body.email,
        formType: '404-lost',
        subject: '404 — visitor looking for page',
        message: body.whatTheyNeeded,
        pageUrl: body.pageUrl,
      })
      return reply.code(201).send({
        ok: true,
        message: "We've noted what you were looking for. Our team will reach out.",
        suggestions: [
          { label: 'AI Concept Design', href: '/concept' },
          { label: 'Permit Services', href: '/permits' },
          { label: 'Pricing', href: '/pricing' },
          { label: 'Contact Us', href: '/contact' },
        ],
      })
    } catch (error: any) {
      return reply.code(500).send({ error: sanitizeErrorMessage(error, 'Failed to submit form') })
    }
  })
}
