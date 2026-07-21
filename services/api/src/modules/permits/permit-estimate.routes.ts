/**
 * Permit Estimate Routes — Public lead capture for county SEO pages
 * No authentication required.
 *
 * POST /permits/estimate-request
 *   Accepts multipart or JSON body from PermitFunnel component.
 *   Stores lead in permit_service_leads table and logs to console for team visibility.
 */

import { FastifyInstance } from 'fastify'
import { prismaAny } from '../../utils/prisma-helper'

export async function permitEstimateRoutes(fastify: FastifyInstance) {
  fastify.post(
    '/estimate-request',
    {
      config: {
        rateLimit: { max: 10, timeWindow: '1 minute' },
      },
    },
    async (request, reply) => {
      try {
        // Support both multipart (with file uploads) and plain JSON
        const body = (request.body as any) || {}

        const name: string = body.name || ''
        const email: string = body.email || ''
        const contactAddress: string = body.contactAddress || body.address || ''
        const projectType: string = body.projectType || ''
        const hasPlans: string = body.hasPlans || ''
        const projectDescription: string = body.projectDescription || ''
        const squareFootage: string = body.squareFootage || ''
        const countySlug: string = body.countySlug || ''

        // Build a human-readable message summarising the submission
        const messageParts: string[] = [
          `County: ${countySlug || 'unknown'}`,
          `Project type: ${projectType || 'unknown'}`,
          `Has plans: ${hasPlans || 'unknown'}`,
        ]
        if (projectDescription) messageParts.push(`Description: ${projectDescription}`)
        if (squareFootage) messageParts.push(`Sq ft: ${squareFootage}`)
        if (contactAddress) messageParts.push(`Address: ${contactAddress}`)
        const message = messageParts.join(' | ')

        // Persist to permit_service_leads — all required fields must have a value
        try {
          await (prismaAny as any).permitServiceLead.create({
            data: {
              fullName: name || 'Website Visitor',
              company: '',
              email: email || '',
              phone: null,
              role: 'homeowner_or_contractor',
              contractorType: projectType || 'unknown',
              licenseNumber: null,
              yearsInBusiness: 'unknown',
              jurisdictions: countySlug ? [countySlug] : [],
              permitsPerMonth: '1',
              servicesNeeded: ['permit_filing'],
              urgency: 'standard',
              message,
              status: 'NEW',
              priority: 'MEDIUM',
              source: 'COUNTY_SEO_PAGE',
              consent: true,
            },
          })
        } catch (dbErr: any) {
          // Log but don't fail the request — lead data is also console-logged below
          fastify.log.warn({ err: dbErr?.message }, 'permit-estimate: DB write failed, continuing')
        }

        // Always log to console so Railway logs capture the lead even if DB is unreachable
        fastify.log.info(
          {
            event: 'permit_estimate_request',
            name,
            email,
            countySlug,
            projectType,
            hasPlans,
            contactAddress,
          },
          'New permit estimate request'
        )

        return reply.code(200).send({ success: true })
      } catch (err: any) {
        fastify.log.error({ err: err?.message }, 'permit-estimate: unexpected error')
        // Return success regardless — we never want the front-end funnel to show an error
        return reply.code(200).send({ success: true })
      }
    }
  )
}
