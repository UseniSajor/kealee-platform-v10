// ============================================================
// NLP - CORRECTION PARSER
// Parse correction emails and comments from jurisdictions
// ============================================================

import OpenAI from 'openai';
import { AIResult, ParsedCorrection } from '../../types';

export class CorrectionParser {
  private openai: OpenAI | null = null;

  constructor(apiKey?: string) {
    if (apiKey) {
      this.openai = new OpenAI({ apiKey });
    }
  }

  /**
   * Parse correction text from email, portal comment, or phone transcript
   */
  async parseCorrection(
    text: string,
    source: 'email' | 'portal' | 'phone' | 'other' = 'email'
  ): Promise<AIResult<ParsedCorrection>> {
    const startTime = Date.now();

    try {
      if (!this.openai) {
        return this.parseBasic(text, source, startTime);
      }

      const prompt = `Parse this building permit correction text and extract structured information:

Text: "${text}"

Extract:
1. Individual issues (description, severity: critical/major/minor, discipline if mentioned)
2. Affected drawing sheets (if mentioned)
3. Due date (if mentioned)
4. Assigned party (architect, engineer, contractor, owner)

Return JSON with:
{
  "issues": [
    {
      "description": "clear issue description",
      "severity": "critical|major|minor",
      "discipline": "building|electrical|plumbing|mechanical|fire|zoning" (if mentioned),
      "affectedSheets": ["sheet numbers if mentioned"],
      "suggestedAction": "what needs to be done"
    }
  ],
  "dueDate": "ISO date string if mentioned",
  "assignedTo": "ARCHITECT|ENGINEER|CONTRACTOR|OWNER if mentioned"
}`;

      const response = await this.openai.chat.completions.create({
        model: 'gpt-4',
        messages: [
          {
            role: 'system',
            content: 'You are an expert at parsing building permit correction notices. Extract structured information accurately.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        response_format: { type: 'json_object' },
        temperature: 0.1
      });

      const content = response.choices[0]?.message?.content;
      if (!content) {
        throw new Error('No response from OpenAI');
      }

      const parsed = JSON.parse(content);
      
      const result: ParsedCorrection = {
        originalText: text,
        issues: parsed.issues || [],
        dueDate: parsed.dueDate ? new Date(parsed.dueDate) : undefined,
        assignedTo: parsed.assignedTo,
        confidence: 0.85
      };

      return {
        success: true,
        data: result,
        confidence: result.confidence,
        processingTimeMs: Date.now() - startTime
      };
    } catch (error) {
      // Fallback to basic parsing
      return this.parseBasic(text, source, startTime);
    }
  }

  /**
   * Basic parsing without AI (fallback)
   */
  private parseBasic(
    text: string,
    source: string,
    startTime: number
  ): AIResult<ParsedCorrection> {
    const issues: ParsedCorrection['issues'] = [];
    
    // Extract sheet references (e.g., "Sheet A-1", "A2.1", "S-3")
    const sheetPattern = /(?:sheet|sheet\s+)([A-Z]?\d+[\.-]?\d*)/gi;
    const sheetMatches = text.matchAll(sheetPattern);
    const affectedSheets = Array.from(sheetMatches, m => m[1]);

    // Extract severity keywords
    const severityKeywords = {
      critical: ['critical', 'must', 'required', 'mandatory', 'violation'],
      major: ['major', 'significant', 'important', 'correct'],
      minor: ['minor', 'suggest', 'recommend', 'consider']
    };

    // Split text into sentences and identify issues
    const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 10);
    
    sentences.forEach(sentence => {
      const lowerSentence = sentence.toLowerCase();
      let severity: 'critical' | 'major' | 'minor' = 'minor';

      if (severityKeywords.critical.some(kw => lowerSentence.includes(kw))) {
        severity = 'critical';
      } else if (severityKeywords.major.some(kw => lowerSentence.includes(kw))) {
        severity = 'major';
      }

      // Detect discipline
      let discipline: ParsedCorrection['issues'][0]['discipline'] | undefined;
      if (lowerSentence.includes('electrical') || lowerSentence.includes('wiring')) {
        discipline = 'electrical';
      } else if (lowerSentence.includes('plumbing') || lowerSentence.includes('water') || lowerSentence.includes('sewer')) {
        discipline = 'plumbing';
      } else if (lowerSentence.includes('mechanical') || lowerSentence.includes('hvac')) {
        discipline = 'mechanical';
      } else if (lowerSentence.includes('fire') || lowerSentence.includes('sprinkler')) {
        discipline = 'fire';
      } else if (lowerSentence.includes('zoning') || lowerSentence.includes('setback')) {
        discipline = 'zoning';
      }

      if (sentence.trim().length > 20) {
        issues.push({
          description: sentence.trim(),
          severity,
          discipline,
          affectedSheets: affectedSheets.length > 0 ? affectedSheets : undefined,
          suggestedAction: this.inferAction(sentence)
        });
      }
    });

    // Extract due date patterns
    const datePatterns = [
      /due\s+(?:by|on|before)?\s*(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4})/i,
      /(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4})/,
      /(?:by|before)\s+(\w+\s+\d{1,2},?\s+\d{4})/i
    ];

    let dueDate: Date | undefined;
    for (const pattern of datePatterns) {
      const match = text.match(pattern);
      if (match) {
        try {
          dueDate = new Date(match[1]);
          if (!isNaN(dueDate.getTime())) break;
        } catch {
          // Continue to next pattern
        }
      }
    }

    // Detect assigned party
    let assignedTo: string | undefined;
    const assignedPatterns = [
      /(?:architect|architectural)\s+(?:must|should|needs?)/i,
      /(?:engineer|engineering)\s+(?:must|should|needs?)/i,
      /(?:contractor|builder)\s+(?:must|should|needs?)/i,
      /owner\s+(?:must|should|needs?)/i
    ];

    if (text.match(assignedPatterns[0])) assignedTo = 'ARCHITECT';
    else if (text.match(assignedPatterns[1])) assignedTo = 'ENGINEER';
    else if (text.match(assignedPatterns[2])) assignedTo = 'CONTRACTOR';
    else if (text.match(assignedPatterns[3])) assignedTo = 'OWNER';

    const result: ParsedCorrection = {
      originalText: text,
      issues: issues.length > 0 ? issues : [{
        description: text,
        severity: 'major',
      }],
      dueDate,
      assignedTo,
      confidence: 0.6 // Lower confidence for basic parsing
    };

    return {
      success: true,
      data: result,
      confidence: result.confidence,
      processingTimeMs: Date.now() - startTime,
      fallbackUsed: true
    };
  }

  /**
   * Infer suggested action from text
   */
  private inferAction(text: string): string | undefined {
    const lowerText = text.toLowerCase();
    
    if (lowerText.includes('add') || lowerText.includes('include')) {
      return 'Add missing information or elements';
    }
    if (lowerText.includes('revise') || lowerText.includes('update') || lowerText.includes('change')) {
      return 'Revise existing information';
    }
    if (lowerText.includes('clarify') || lowerText.includes('explain')) {
      return 'Provide clarification';
    }
    if (lowerText.includes('remove') || lowerText.includes('delete')) {
      return 'Remove incorrect information';
    }
    
    return undefined;
  }

  /**
   * Batch parse multiple corrections
   */
  async parseBatch(
    texts: string[],
    source: 'email' | 'portal' | 'phone' | 'other' = 'email'
  ): Promise<AIResult<ParsedCorrection[]>> {
    const results = await Promise.all(
      texts.map(text => this.parseCorrection(text, source))
    );

    const successful = results.filter(r => r.success);
    const parsed = successful
      .map(r => r.data)
      .filter((d): d is ParsedCorrection => d !== undefined);

    return {
      success: parsed.length > 0,
      data: parsed,
      confidence: parsed.length > 0
        ? parsed.reduce((sum, p) => sum + p.confidence, 0) / parsed.length
        : 0
    };
  }
}
