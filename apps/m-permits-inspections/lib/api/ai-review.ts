// apps/m-permits-inspections/lib/api/ai-review.ts
// AI document review service

export interface DocumentReviewIssue {
  type: 'error' | 'warning' | 'info';
  message: string;
  field?: string;
  suggestion?: string;
}

export interface DocumentReviewResult {
  score: number; // 0-100
  issues: DocumentReviewIssue[];
  suggestions: string[];
  jurisdiction: string;
  permitTypes: string[];
  estimatedApprovalTime: string;
  confidence: number; // 0-1
}

class AIDocumentReviewService {
  private apiUrl: string;

  constructor() {
    this.apiUrl = process.env.NEXT_PUBLIC_AI_REVIEW_API_URL || '/api/ai/review';
  }

  async reviewDocuments(
    files: File[],
    jurisdiction: string,
    permitTypes: string[]
  ): Promise<DocumentReviewResult> {
    try {
      const formData = new FormData();
      files.forEach((file) => {
        formData.append('files', file);
      });
      formData.append('jurisdiction', jurisdiction);
      formData.append('permitTypes', JSON.stringify(permitTypes));

      const response = await fetch(this.apiUrl, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('AI review failed');
      }

      const result = await response.json();
      return result;
    } catch (error) {
      console.error('Error reviewing documents:', error);
      // Return default result on error
      return {
        score: 75,
        issues: [
          {
            type: 'warning',
            message: 'Unable to complete AI review. Please verify documents manually.',
          },
        ],
        suggestions: [],
        jurisdiction,
        permitTypes,
        estimatedApprovalTime: '21-30 days',
        confidence: 0.5,
      };
    }
  }

  async reviewSingleDocument(file: File): Promise<DocumentReviewResult> {
    return this.reviewDocuments([file], '', []);
  }
}

export const aiDocumentReviewService = new AIDocumentReviewService();
