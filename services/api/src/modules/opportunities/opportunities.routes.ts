import { FastifyInstance } from 'fastify'
import { prismaAny } from '../../utils/prisma-helper'

export async function opportunitiesRoutes(fastify: FastifyInstance) {

  // POST /api/opportunities/interest — save interest list signup
  fastify.post('/interest', async (request, reply) => {
    const { name, email, role, tradeType, location, note } = request.body as {
      name: string
      email: string
      role: string
      tradeType?: string
      location?: string
      note?: string
    }

    if (!name || !email || !role) {
      return reply.status(400).send({ error: 'name, email, and role are required' })
    }

    const existing = await prismaAny.interestListSignup.findUnique({ where: { email } })
    if (existing) {
      return reply.status(200).send({ status: 'already_registered', message: 'You are already on the list.' })
    }

    const signup = await prismaAny.interestListSignup.create({
      data: { name, email, role, tradeType: tradeType || null, location: location || null, note: note || null },
    })

    return reply.status(201).send({ status: 'success', id: signup.id })
  })

  // GET /api/opportunities/interest/count — for dashboard
  fastify.get('/interest/count', async (_request, reply) => {
    const count = await prismaAny.interestListSignup.count()
    return reply.send({ count })
  })

  // GET /api/opportunities/categories — list opportunity categories
  fastify.get('/categories', async (_request, reply) => {
    const categories = await prismaAny.opportunityCategory.findMany({
      orderBy: { slug: 'asc' },
    })
    return reply.send(categories)
  })

  // GET /api/opportunities/contracts — list government contracts
  fastify.get('/contracts', async (request, reply) => {
    const { status, agencyLevel, naicsCode, limit } = request.query as {
      status?: string
      agencyLevel?: string
      naicsCode?: string
      limit?: string
    }

    const contracts = await prismaAny.governmentContract.findMany({
      where: {
        ...(status && { status }),
        ...(agencyLevel && { agencyLevel }),
        ...(naicsCode && { naicsCode }),
      },
      orderBy: { dueDate: 'asc' },
      take: limit ? parseInt(limit, 10) : 50,
    })
    return reply.send(contracts)
  })

  // GET /api/opportunities/apprenticeships — list apprenticeship programs
  fastify.get('/apprenticeships', async (request, reply) => {
    const { tradeType, isActive } = request.query as {
      tradeType?: string
      isActive?: string
    }

    const programs = await prismaAny.apprenticeshipProgram.findMany({
      where: {
        ...(tradeType && { tradeType }),
        isActive: isActive !== 'false',
      },
      orderBy: { createdAt: 'desc' },
    })
    return reply.send(programs)
  })
}
