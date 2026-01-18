# @kealee/shared-ai

Shared AI services for the Kealee Platform, providing AI-powered permit review, document analysis, and code compliance checking.

## Features

- **AI Permit Review**: Automated permit application review using AI
- **Document Analysis**: Analyze construction documents for completeness and quality
- **Code Compliance**: Check building code compliance

## Installation

This package is part of the Kealee monorepo and uses workspace protocol.

```bash
pnpm add @kealee/shared-ai
```

## Usage

### AI Review Service

```typescript
import { AIReviewService } from '@kealee/shared-ai';

const aiService = new AIReviewService({
  openaiApiKey: process.env.OPENAI_API_KEY,
  jurisdictionConfigs: [],
});

const result = await aiService.reviewPermit({
  permitId: 'permit_123',
  jurisdictionId: 'jurisdiction_456',
  permitType: 'residential',
  plans: [{ url: 'https://...', type: 'floor_plan' }],
  documents: [{ url: 'https://...', type: 'calculations' }],
  reviewSource: 'client_side_pre_review',
});

if (result.success) {
  console.log('Findings:', result.data.findings);
  console.log('Overall Score:', result.data.overallScore);
}
```

### Document Analyzer

```typescript
import { AIDocumentAnalyzer } from '@kealee/shared-ai';

const analyzer = new AIDocumentAnalyzer();

const completeness = await analyzer.analyzeCompleteness([
  'https://doc1.pdf',
  'https://doc2.pdf',
]);

console.log('Complete:', completeness.complete);
console.log('Score:', completeness.score);
```

### Code Analyzer

```typescript
import { AICodeAnalyzer } from '@kealee/shared-ai';

const codeAnalyzer = new AICodeAnalyzer();

const compliance = await codeAnalyzer.checkCompliance({
  permitType: 'residential',
  jurisdictionId: 'jur_123',
  projectDetails: { ... },
});

console.log('Compliant:', compliance.compliant);
console.log('Violations:', compliance.violations);
```

## Development Mode

The AI services gracefully degrade when no OpenAI API key is provided, returning mock data suitable for development and testing.

## Types

All TypeScript types are exported from the main package:

```typescript
import type {
  AIReviewConfig,
  AIReviewResult,
  AIFinding,
  FindingSeverity,
} from '@kealee/shared-ai';
```

## License

Proprietary - Kealee Platform
