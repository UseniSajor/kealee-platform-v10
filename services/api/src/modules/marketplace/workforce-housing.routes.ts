import { FastifyInstance } from 'fastify';
import { prismaAny } from '../../utils/prisma-helper';
import { sanitizeErrorMessage } from '../../utils/sanitize-error';

/**
 * Workforce Housing Marketplace Routes — Phase 6
 * Workforce housing filters, grant finder, financing directory.
 * Act Alignment: HOME Program workforce housing, CDBG expansion.
 */
export async function workforceHousingRoutes(fastify: FastifyInstance) {
  // Workforce housing listings with AMI/eligibility filters
  fastify.get('/workforce-housing', {
    handler: async (request, reply) => {
      try {
        const query = request.query as {
          amiMax?: string;
          housingType?: string;
          minUnits?: string;
          maxUnits?: string;
          state?: string;
          page?: string;
          limit?: string;
        };

        const page = parseInt(query.page || '1');
        const limit = Math.min(parseInt(query.limit || '20'), 50);
        const skip = (page - 1) * limit;

        const prisma = prismaAny();

        // Query pattern book designs that qualify as workforce housing
        const where: any = {
          isPublic: true,
          status: { in: ['PUBLISHED', 'PRE_APPROVED'] },
        };

        if (query.housingType) where.housingType = query.housingType;

        const [designs, total] = await Promise.all([
          prisma.patternBookDesign.findMany({
            where,
            skip,
            take: limit,
            orderBy: { selectionCount: 'desc' },
            select: {
              id: true,
              slug: true,
              name: true,
              housingType: true,
              totalSqFt: true,
              bedrooms: true,
              bathrooms: true,
              costRangeLow: true,
              costRangeHigh: true,
              status: true,
              style: true,
            },
          }),
          prisma.patternBookDesign.count({ where }),
        ]);

        return reply.send({
          designs,
          pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
        });
      } catch (error) {
        return reply.status(500).send({ error: sanitizeErrorMessage(error) });
      }
    },
  });

  // Grant programs directory
  fastify.get('/grants', {
    handler: async (_request, reply) => {
      // Static directory of available grant programs aligned with the Act
      const grants = [
        {
          name: 'Housing Innovation Fund',
          section: 'Sec 209',
          fundSize: '$200M annual',
          maxPerProject: '$500,000',
          eligible: ['ADU', 'Duplex', 'Triplex', 'Fourplex', 'Townhouse', 'Small Apartment', 'Modular'],
          requirements: ['Missing-middle housing', '10%+ affordable units', 'Pattern book preferred'],
          status: 'Active',
        },
        {
          name: 'HOME Investment Partnerships',
          section: 'HOME Program Modernization',
          fundSize: '$1.5B annual',
          maxPerProject: 'Varies by jurisdiction',
          eligible: ['All residential types'],
          requirements: ['80% AMI income target', '20%+ affordable units', '15-20 year covenant'],
          status: 'Active',
        },
        {
          name: 'Community Development Block Grant',
          section: 'CDBG Expansion',
          fundSize: '$3.3B annual',
          maxPerProject: 'Varies by entitlement',
          eligible: ['New construction now eligible', 'All housing types'],
          requirements: ['51% LMI benefit', 'National objective met', 'Public benefit documented'],
          status: 'Active - New construction eligible',
        },
        {
          name: 'Low-Income Housing Tax Credits (LIHTC)',
          section: 'Existing program',
          fundSize: '$10B+ annual (4% & 9%)',
          maxPerProject: 'Varies by state allocation',
          eligible: ['All multifamily (5+ units)'],
          requirements: ['Income restrictions (50-60% AMI)', '15-year compliance', 'State QAP scoring'],
          status: 'Active',
        },
      ];

      return reply.send({ grants });
    },
  });

  // Financing programs directory
  fastify.get('/financing-programs', {
    handler: async (_request, reply) => {
      const programs = [
        {
          name: 'FHA 203(b)',
          type: 'Loan Insurance',
          unitRange: '1-4 units',
          maxLTV: '96.5%',
          term: '30 years',
          description: 'Standard FHA mortgage insurance for 1-4 unit properties.',
        },
        {
          name: 'FHA 221(d)(4)',
          type: 'Construction & Permanent',
          unitRange: '5+ units',
          maxLTV: '85%',
          term: '40 years',
          description: 'New construction or substantial rehabilitation of multifamily rental housing.',
        },
        {
          name: 'FHA 223(f)',
          type: 'Refinance/Acquisition',
          unitRange: '5+ units',
          maxLTV: '85%',
          term: '35 years',
          description: 'Refinance or acquisition of existing multifamily properties.',
        },
        {
          name: 'Conventional Multifamily',
          type: 'Bank/Agency Loan',
          unitRange: '5+ units',
          maxLTV: '75%',
          term: '5-30 years',
          description: 'Fannie Mae / Freddie Mac multifamily lending programs.',
        },
        {
          name: 'USDA Rural Development',
          type: 'Direct/Guaranteed Loans',
          unitRange: 'All sizes',
          maxLTV: '100%',
          term: '30-40 years',
          description: 'Financing for rural housing development (population < 35,000).',
        },
      ];

      return reply.send({ programs });
    },
  });
}
