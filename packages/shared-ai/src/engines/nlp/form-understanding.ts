// ============================================================
// NLP - FORM UNDERSTANDING
// Understand jurisdiction-specific permit forms
// ============================================================

import OpenAI from 'openai';
import { MetadataExtractor } from '../document-intelligence/metadata-extractor';
import { AIResult, FormSchema, FormField, ExtractedField } from '../../types';

export class FormUnderstanding {
  private openai: OpenAI | null = null;
  private metadataExtractor: MetadataExtractor;

  constructor(apiKey?: string) {
    if (apiKey) {
      this.openai = new OpenAI({ apiKey });
    }
    this.metadataExtractor = new MetadataExtractor(apiKey);
  }

  /**
   * Analyze a form document and extract schema
   */
  async analyzeForm(
    formUrl: string,
    jurisdictionId: string,
    permitType: string
  ): Promise<AIResult<FormSchema>> {
    const startTime = Date.now();

    try {
      // First extract document metadata
      const docResult = await this.metadataExtractor.extractAll(formUrl);
      
      if (!docResult.success || !docResult.data) {
        return {
          success: false,
          error: 'Failed to extract form document',
          processingTimeMs: Date.now() - startTime
        };
      }

      const text = docResult.data.metadata.extractedText || '';
      
      if (!this.openai) {
        return this.analyzeFormBasic(text, jurisdictionId, permitType, startTime);
      }

      const prompt = `Analyze this permit application form and extract its structure:

Form text:
${text.substring(0, 8000)}

Extract:
1. Form name/title
2. All form fields with:
   - Field name/label
   - Field type (text, number, date, boolean, select, file)
   - Whether field is required
   - Validation rules (if any)
   - Options for select fields
3. Form sections (if organized into sections)

Return JSON:
{
  "formName": "form title",
  "fields": [
    {
      "name": "field identifier",
      "label": "field label as shown",
      "type": "text|number|date|boolean|select|file",
      "required": true/false,
      "validation": {
        "pattern": "regex if applicable",
        "min": number if applicable,
        "max": number if applicable,
        "options": ["option1", "option2"] for select fields
      }
    }
  ],
  "sections": [
    {
      "name": "section name",
      "fields": ["field names in this section"]
    }
  ]
}`;

      const response = await this.openai.chat.completions.create({
        model: 'gpt-4',
        messages: [
          {
            role: 'system',
            content: 'You are an expert at analyzing government forms and extracting their structure accurately.'
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
      
      const schema: FormSchema = {
        formName: parsed.formName || 'Unknown Form',
        jurisdictionId,
        permitType,
        fields: parsed.fields || [],
        sections: parsed.sections
      };

      return {
        success: true,
        data: schema,
        confidence: 0.85,
        processingTimeMs: Date.now() - startTime
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Form analysis failed',
        processingTimeMs: Date.now() - startTime
      };
    }
  }

  /**
   * Basic form analysis without AI
   */
  private analyzeFormBasic(
    text: string,
    jurisdictionId: string,
    permitType: string,
    startTime: number
  ): AIResult<FormSchema> {
    const fields: FormField[] = [];
    
    // Extract common form field patterns
    const fieldPatterns = [
      /(?:name|applicant|owner)[\s:]+([^\n]+)/i,
      /(?:address|location)[\s:]+([^\n]+)/i,
      /(?:phone|telephone)[\s:]+([^\n]+)/i,
      /(?:email)[\s:]+([^\n]+)/i,
      /(?:date)[\s:]+([^\n]+)/i,
      /(?:valuation|cost|value)[\s:]+([^\n]+)/i,
      /(?:description|scope|work)[\s:]+([^\n]+)/i
    ];

    fieldPatterns.forEach((pattern, index) => {
      const match = text.match(pattern);
      if (match) {
        const fieldNames = ['name', 'address', 'phone', 'email', 'date', 'valuation', 'description'];
        const fieldTypes: FormField['type'][] = ['text', 'text', 'text', 'text', 'date', 'number', 'text'];
        
        fields.push({
          name: fieldNames[index],
          label: match[0].split(':')[0].trim(),
          type: fieldTypes[index],
          required: text.toLowerCase().includes('required') || text.toLowerCase().includes('must'),
        });
      }
    });

    const schema: FormSchema = {
      formName: 'Extracted Form',
      jurisdictionId,
      permitType,
      fields: fields.length > 0 ? fields : [{
        name: 'general',
        label: 'General Information',
        type: 'text',
        required: false
      }]
    };

    return {
      success: true,
      data: schema,
      confidence: 0.5,
      processingTimeMs: Date.now() - startTime,
      fallbackUsed: true
    };
  }

  /**
   * Map form fields to Kealee data model
   */
  mapToKealeeFields(
    schema: FormSchema,
    kealeeFieldMap: Record<string, string>
  ): FormSchema {
    const mappedFields = schema.fields.map(field => ({
      ...field,
      mapping: kealeeFieldMap[field.name] || kealeeFieldMap[field.label] || field.name
    }));

    return {
      ...schema,
      fields: mappedFields
    };
  }

  /**
   * Fill form with data
   */
  async fillForm(
    schema: FormSchema,
    data: Record<string, any>
  ): Promise<AIResult<ExtractedField[]>> {
    const fields: ExtractedField[] = [];

    schema.fields.forEach(field => {
      const value = data[field.mapping || field.name] || data[field.label];
      
      if (value !== undefined && value !== null) {
        fields.push({
          name: field.name,
          value: this.convertValue(value, field.type),
          confidence: 1.0,
          page: 1
        });
      }
    });

    return {
      success: true,
      data: fields
    };
  }

  /**
   * Convert value to appropriate type
   */
  private convertValue(
    value: any,
    type: FormField['type']
  ): string | number | boolean | Date {
    switch (type) {
      case 'number':
        return typeof value === 'number' ? value : parseFloat(String(value)) || 0;
      case 'boolean':
        return typeof value === 'boolean' ? value : String(value).toLowerCase() === 'true';
      case 'date':
        return value instanceof Date ? value : new Date(value);
      default:
        return String(value);
    }
  }

  /**
   * Validate form data against schema
   */
  validateFormData(
    schema: FormSchema,
    data: Record<string, any>
  ): {
    valid: boolean;
    errors: Array<{ field: string; error: string }>;
  } {
    const errors: Array<{ field: string; error: string }> = [];

    schema.fields.forEach(field => {
      const value = data[field.mapping || field.name] || data[field.label];

      // Check required fields
      if (field.required && (value === undefined || value === null || value === '')) {
        errors.push({
          field: field.name,
          error: `${field.label} is required`
        });
        return;
      }

      if (value === undefined || value === null) return;

      // Type validation
      if (field.type === 'number' && isNaN(Number(value))) {
        errors.push({
          field: field.name,
          error: `${field.label} must be a number`
        });
      }

      if (field.type === 'date' && isNaN(new Date(value).getTime())) {
        errors.push({
          field: field.name,
          error: `${field.label} must be a valid date`
        });
      }

      // Range validation
      if (field.validation) {
        if (field.validation.min !== undefined && Number(value) < field.validation.min) {
          errors.push({
            field: field.name,
            error: `${field.label} must be at least ${field.validation.min}`
          });
        }

        if (field.validation.max !== undefined && Number(value) > field.validation.max) {
          errors.push({
            field: field.name,
            error: `${field.label} must be at most ${field.validation.max}`
          });
        }

        // Pattern validation
        if (field.validation.pattern && typeof value === 'string') {
          const regex = new RegExp(field.validation.pattern);
          if (!regex.test(value)) {
            errors.push({
              field: field.name,
              error: `${field.label} format is invalid`
            });
          }
        }

        // Options validation
        if (field.validation.options && !field.validation.options.includes(String(value))) {
          errors.push({
            field: field.name,
            error: `${field.label} must be one of: ${field.validation.options.join(', ')}`
          });
        }
      }
    });

    return {
      valid: errors.length === 0,
      errors
    };
  }
}
