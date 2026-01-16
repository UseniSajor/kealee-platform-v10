# @kealee/shared-ai

Shared AI engine package for permit review, plan analysis, and document intelligence.

## Features

- **Plan Analysis**: Computer vision for architectural plans using GPT-4 Vision
- **Document Intelligence**: PDF processing, OCR, and metadata extraction
- **Code Compliance**: Building code checking and rule-based validation
- **NLP Services**: Correction parsing, form understanding, and report generation
- **Multi-tenancy**: Jurisdiction-specific model configurations
- **Feedback Loop**: Learning from corrections to improve accuracy
- **Performance Tracking**: Metrics and analytics for AI operations
- **Fallback Mechanisms**: Graceful degradation when AI unavailable

## Installation

```bash
pnpm add @kealee/shared-ai
```

## Usage

### Basic AI Review

```typescript
import { AIReviewService } from '@kealee/shared-ai';

const aiService = new AIReviewService({
  openaiApiKey: process.env.OPENAI_API_KEY!,
  jurisdictionConfigs: []
});

const result = await aiService.reviewPermit({
  permitId: 'perm-123',
  jurisdictionId: 'jur-456',
  permitType: 'BUILDING',
  plans: [
    { url: 'https://...', type: 'floor_plan' }
  ],
  documents: [
    { url: 'https://...', type: 'structural_calcs' }
  ],
  reviewSource: 'client_side_pre_review'
});
```

### Plan Analysis

```typescript
import { VisionEngine, DimensionExtractor } from '@kealee/shared-ai';

const visionEngine = new VisionEngine({
  provider: 'openai',
  apiKey: process.env.OPENAI_API_KEY!,
  model: 'gpt-4-vision-preview'
});

const extractor = new DimensionExtractor(visionEngine);
const dimensions = await extractor.extractAllDimensions(planImages);
```

### Document Processing

```typescript
import { PDFProcessor, MetadataExtractor } from '@kealee/shared-ai';

const processor = new PDFProcessor();
const pdfResult = await processor.processPDF('https://...');

const extractor = new MetadataExtractor(process.env.OPENAI_API_KEY);
const metadata = await extractor.extractAll('https://...');
```

### Code Compliance

```typescript
import { ComplianceChecker, CodeParser } from '@kealee/shared-ai';

const checker = new ComplianceChecker(process.env.OPENAI_API_KEY);
await checker.loadRules(codeRules);

const compliance = await checker.checkCompliance(planAnalysis, {
  permitType: 'BUILDING',
  jurisdictionId: 'jur-456'
});
```

### Feedback Loop

```typescript
import { LearningFeedbackService } from '@kealee/shared-ai';

const feedbackService = new LearningFeedbackService();

// Record feedback
feedbackService.recordFeedback({
  reviewId: 'review-123',
  permitId: 'perm-123',
  jurisdictionId: 'jur-456',
  source: 'jurisdiction_correction',
  feedback: {
    wasCorrect: false,
    actualOutcome: 'corrections_required',
    notes: 'AI missed critical structural issue'
  },
  timestamp: new Date()
});

// Get accuracy metrics
const accuracy = feedbackService.calculateAccuracy('jur-456', 'BUILDING');
```

## Architecture

### Modular Design

Each engine can be used independently:
- `plan-analysis`: Vision engine, dimension extraction, element detection
- `document-intelligence`: PDF processing, OCR, metadata extraction
- `code-compliance`: Code parsing, rule engine, compliance checking
- `nlp`: Correction parsing, form understanding, report generation

### Multi-tenancy

Support for jurisdiction-specific configurations:

```typescript
const jurisdictionConfig: JurisdictionAIConfig = {
  jurisdictionId: 'jur-456',
  enabledEngines: ['plan-analysis', 'code-compliance'],
  customRules: [...],
  modelPreferences: {
    planAnalysis: 'custom-model-v2',
    codeCompliance: 'gpt-4'
  },
  accuracyThresholds: {
    planAnalysis: 0.85,
    codeCompliance: 0.90
  }
};
```

### Performance Tracking

```typescript
import { PerformanceTracker } from '@kealee/shared-ai';

const tracker = new PerformanceTracker();
tracker.record({
  requestId: 'req-123',
  engine: 'vision-engine',
  processingTimeMs: 1500,
  confidence: 0.92,
  success: true,
  timestamp: new Date()
});

const stats = tracker.getStats('vision-engine');
```

## Environment Variables

```bash
OPENAI_API_KEY=your-api-key-here
```

## Development

```bash
# Build
pnpm build

# Watch mode
pnpm dev

# Test
pnpm test
```

## License

Proprietary - Kealee Platform
