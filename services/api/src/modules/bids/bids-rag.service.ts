import { prisma } from '@kealee/database'

/**
 * BidsRAGService - Vector search and AI insights for bid intelligence
 *
 * Uses OpenAI embeddings (text-embedding-3-small) and pgvector for
 * similarity search across historical bids.
 *
 * Requires: OPENAI_API_KEY environment variable
 */
export class BidsRAGService {
  private getOpenAI() {
    // Lazy-load OpenAI to avoid hard dependency
    try {
      const OpenAI = require('openai')
      return new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
    } catch {
      throw new Error('OpenAI SDK not installed. Run: pnpm add openai')
    }
  }

  /**
   * Generate embedding for a bid
   */
  async generateEmbedding(bidId: string) {
    const bid = await prisma.opportunityBid.findUnique({ where: { id: bidId } })
    if (!bid) throw new Error('Bid not found')

    if (!process.env.OPENAI_API_KEY) {
      throw new Error('OPENAI_API_KEY not configured')
    }

    const openai = this.getOpenAI()
    const text = `${bid.projectName} ${bid.description || ''} ${bid.scope || ''} ${bid.location || ''}`

    const response = await openai.embeddings.create({
      model: 'text-embedding-3-small',
      input: text,
    })

    const embedding = response.data[0].embedding

    // Store embedding (requires raw SQL for vector type)
    await prisma.$executeRawUnsafe(
      `INSERT INTO opportunity_bid_embeddings (id, "bidId", embedding, metadata, "createdAt")
       VALUES ($1, $2, $3::vector, $4, NOW())
       ON CONFLICT ("bidId") DO UPDATE SET embedding = $3::vector, metadata = $4`,
      `emb_${bidId}`,
      bidId,
      `[${embedding.join(',')}]`,
      JSON.stringify({ model: 'text-embedding-3-small' })
    )

    return { bidId, embedded: true }
  }

  /**
   * Find similar bids using cosine similarity
   */
  async findSimilarBids(bidId: string, limit = 5) {
    const result: any[] = await prisma.$queryRawUnsafe(
      `SELECT embedding FROM opportunity_bid_embeddings WHERE "bidId" = $1`,
      bidId
    )

    if (!result || result.length === 0) {
      throw new Error('Bid not embedded. Call POST /embed first.')
    }

    const embedding = result[0].embedding

    const similar: any[] = await prisma.$queryRawUnsafe(
      `SELECT
        be."bidId",
        ob."projectName",
        ob."ownerName",
        ob."estimatedValue",
        ob."bidAmount",
        ob.status,
        (1 - (be.embedding <=> $1::vector)) as similarity
       FROM opportunity_bid_embeddings be
       JOIN opportunity_bids ob ON be."bidId" = ob.id
       WHERE be."bidId" != $2
       ORDER BY be.embedding <=> $1::vector
       LIMIT $3`,
      `[${embedding.join(',')}]`,
      bidId,
      limit
    )

    return similar
  }

  /**
   * Get AI insights based on similar past bids
   */
  async getAIInsights(bidId: string) {
    if (!process.env.OPENAI_API_KEY) {
      throw new Error('OPENAI_API_KEY not configured')
    }

    const similarBids = await this.findSimilarBids(bidId, 3)
    const currentBid = await prisma.opportunityBid.findUnique({ where: { id: bidId } })

    if (!currentBid) throw new Error('Bid not found')

    const openai = this.getOpenAI()

    const prompt = `Based on these similar past bids, provide insights for the current opportunity:

Current Opportunity:
- Project: ${currentBid.projectName}
- Estimated Value: ${currentBid.estimatedValue}
- Scope: ${currentBid.scope}

Similar Past Bids:
${similarBids.map((b: any, i: number) => `
${i + 1}. ${b.projectName}
   - Estimated: ${b.estimatedValue}
   - Bid: ${b.bidAmount}
   - Status: ${b.status}
   - Similarity: ${(b.similarity * 100).toFixed(1)}%
`).join('')}

Provide:
1. Recommended bid amount range
2. Key risks to watch for
3. Lessons learned from similar projects
4. Win probability estimate`

    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.7,
    })

    return {
      insights: response.choices[0].message.content,
      similarBids,
    }
  }
}

export const bidsRAGService = new BidsRAGService()
