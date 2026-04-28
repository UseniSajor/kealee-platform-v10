/**
 * @kealee/scoring — local stub (lightweight, no monorepo dep)
 */
export class ContractorScoringService {
  async getScore(contractorId) {
    return { contractorId, score: 75, confidence: 'medium', components: {} }
  }
  async recordEvent(_event) {}
  async getLeaderboard(_filters) { return [] }
}
