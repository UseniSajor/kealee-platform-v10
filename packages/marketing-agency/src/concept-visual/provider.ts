import type { ConceptVisualInput } from '../types'
import type { ConceptVisualResult } from './prompts'
import { buildConceptVisualPrompt } from './prompts'

export interface ConceptVisualProvider {
  isConfigured(): boolean
  generate(input: ConceptVisualInput): Promise<ConceptVisualResult>
}

export { buildConceptVisualPrompt, serviceTypeLabel, propertyStyleLabel } from './prompts'
