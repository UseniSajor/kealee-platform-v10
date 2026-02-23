/**
 * FAQ and Educational Resources Service
 * FAQ and educational resources
 */

import {createClient} from '@permits/src/lib/supabase/client';

export interface FAQItem {
  id: string;
  category: 'GENERAL' | 'APPLICATION' | 'REVIEW' | 'INSPECTION' | 'FEES' | 'APPEALS';
  question: string;
  answer: string;
  order: number;
  jurisdictionId?: string; // Jurisdiction-specific FAQ
  tags?: string[];
  lastUpdated: Date;
}

export interface EducationalResource {
  id: string;
  title: string;
  description: string;
  type: 'ARTICLE' | 'VIDEO' | 'GUIDE' | 'TUTORIAL' | 'CHECKLIST';
  content?: string; // Article content
  videoUrl?: string; // Video URL
  resourceUrl?: string; // Link to external resource
  category: 'PERMITS' | 'INSPECTIONS' | 'CODE_COMPLIANCE' | 'APPLICATION_PROCESS';
  jurisdictionId?: string; // Jurisdiction-specific resource
  published: boolean;
  publishedAt?: Date;
  tags?: string[];
}

export class FAQResourcesService {
  private faqCache: Map<string, FAQItem[]> = new Map();
  private resourcesCache: Map<string, EducationalResource[]> = new Map();

  constructor() {
    this.initializeDefaultFAQs();
    this.initializeDefaultResources();
  }

  /**
   * Get FAQs
   */
  async getFAQs(
    jurisdictionId?: string,
    category?: FAQItem['category']
  ): Promise<FAQItem[]> {
    const supabase = createClient();

    let query = supabase.from('FAQ').select('*').eq('published', true);

    if (jurisdictionId) {
      query = query.or(`jurisdictionId.eq.${jurisdictionId},jurisdictionId.is.null`);
    }

    if (category) {
      query = query.eq('category', category);
    }

    query = query.order('order', {ascending: true});

    const {data: faqs} = await query;

    if (!faqs || faqs.length === 0) {
      // Return default FAQs if none in database
      return this.getDefaultFAQs(jurisdictionId, category);
    }

    return faqs.map(faq => ({
      id: faq.id,
      category: faq.category,
      question: faq.question,
      answer: faq.answer,
      order: faq.order || 0,
      jurisdictionId: faq.jurisdictionId || undefined,
      tags: faq.tags || undefined,
      lastUpdated: new Date(faq.updatedAt || faq.createdAt),
    }));
  }

  /**
   * Search FAQs
   */
  async searchFAQs(query: string, jurisdictionId?: string): Promise<FAQItem[]> {
    const allFAQs = await this.getFAQs(jurisdictionId);
    const queryLower = query.toLowerCase();

    return allFAQs.filter(
      faq =>
        faq.question.toLowerCase().includes(queryLower) ||
        faq.answer.toLowerCase().includes(queryLower) ||
        faq.tags?.some(tag => tag.toLowerCase().includes(queryLower))
    );
  }

  /**
   * Get educational resources
   */
  async getEducationalResources(
    jurisdictionId?: string,
    category?: EducationalResource['category'],
    type?: EducationalResource['type']
  ): Promise<EducationalResource[]> {
    const supabase = createClient();

    let query = supabase.from('EducationalResource').select('*').eq('published', true);

    if (jurisdictionId) {
      query = query.or(`jurisdictionId.eq.${jurisdictionId},jurisdictionId.is.null`);
    }

    if (category) {
      query = query.eq('category', category);
    }

    if (type) {
      query = query.eq('type', type);
    }

    query = query.order('publishedAt', {ascending: false});

    const {data: resources} = await query;

    if (!resources || resources.length === 0) {
      // Return default resources if none in database
      return this.getDefaultResources(jurisdictionId, category, type);
    }

    return resources.map(resource => ({
      id: resource.id,
      title: resource.title,
      description: resource.description,
      type: resource.type,
      content: resource.content || undefined,
      videoUrl: resource.videoUrl || undefined,
      resourceUrl: resource.resourceUrl || undefined,
      category: resource.category,
      jurisdictionId: resource.jurisdictionId || undefined,
      published: resource.published || false,
      publishedAt: resource.publishedAt ? new Date(resource.publishedAt) : undefined,
      tags: resource.tags || undefined,
    }));
  }

  /**
   * Initialize default FAQs
   */
  private initializeDefaultFAQs() {
    // Default FAQs would be loaded from database or config
    // For now, initialized in getDefaultFAQs method
  }

  /**
   * Get default FAQs
   */
  private getDefaultFAQs(
    jurisdictionId?: string,
    category?: FAQItem['category']
  ): FAQItem[] {
    const defaultFAQs: FAQItem[] = [
      {
        id: 'faq-1',
        category: 'GENERAL',
        question: 'What is a building permit?',
        answer:
          'A building permit is an official approval issued by local government that allows you to proceed with construction, demolition, or renovation on your property. It ensures that work complies with building codes and safety standards.',
        order: 1,
        tags: ['permit', 'building', 'construction'],
        lastUpdated: new Date(),
      },
      {
        id: 'faq-2',
        category: 'APPLICATION',
        question: 'How do I apply for a permit?',
        answer:
          'You can apply for a permit online through our portal. Create an account, select your permit type, complete the application form, upload required documents, pay fees, and submit. You will receive updates on the status of your application.',
        order: 2,
        tags: ['application', 'apply', 'how-to'],
        lastUpdated: new Date(),
      },
      {
        id: 'faq-3',
        category: 'REVIEW',
        question: 'How long does permit review take?',
        answer:
          'Review times vary by permit type and complexity. Simple permits may be reviewed in 1-2 weeks, while complex projects may take 4-6 weeks. Expedited review is available for an additional fee (48-72 hour guarantee).',
        order: 3,
        tags: ['review', 'timeline', 'duration'],
        lastUpdated: new Date(),
      },
      {
        id: 'faq-4',
        category: 'INSPECTION',
        question: 'When do I need inspections?',
        answer:
          'Inspections are required at various stages of construction: footing, foundation, framing, electrical/plumbing/mechanical rough-in, insulation, drywall, and final inspections. Request inspections as work progresses through each phase.',
        order: 4,
        tags: ['inspection', 'when', 'timing'],
        lastUpdated: new Date(),
      },
      {
        id: 'faq-5',
        category: 'FEES',
        question: 'How are permit fees calculated?',
        answer:
          'Permit fees are typically based on project valuation, square footage, or fixed rates depending on permit type. Fees vary by jurisdiction. Use our fee calculator to estimate costs before applying.',
        order: 5,
        tags: ['fees', 'cost', 'calculation'],
        lastUpdated: new Date(),
      },
    ];

    // Filter by category if specified
    if (category) {
      return defaultFAQs.filter(faq => faq.category === category);
    }

    return defaultFAQs;
  }

  /**
   * Initialize default resources
   */
  private initializeDefaultResources() {
    // Default resources would be loaded from database or config
    // For now, initialized in getDefaultResources method
  }

  /**
   * Get default resources
   */
  private getDefaultResources(
    jurisdictionId?: string,
    category?: EducationalResource['category'],
    type?: EducationalResource['type']
  ): EducationalResource[] {
    const defaultResources: EducationalResource[] = [
      {
        id: 'resource-1',
        title: 'Permit Application Guide',
        description: 'Complete guide to applying for building permits',
        type: 'GUIDE',
        category: 'APPLICATION_PROCESS',
        content: 'Step-by-step instructions for permit applications...',
        published: true,
        publishedAt: new Date(),
        tags: ['permit', 'application', 'guide'],
      },
      {
        id: 'resource-2',
        title: 'Understanding Building Codes',
        description: 'Overview of building codes and compliance requirements',
        type: 'ARTICLE',
        category: 'CODE_COMPLIANCE',
        content: 'Building codes ensure safety and compliance...',
        published: true,
        publishedAt: new Date(),
        tags: ['code', 'compliance', 'safety'],
      },
      {
        id: 'resource-3',
        title: 'Inspection Checklist',
        description: 'What to expect during inspections',
        type: 'CHECKLIST',
        category: 'INSPECTIONS',
        resourceUrl: '/resources/inspection-checklist.pdf',
        published: true,
        publishedAt: new Date(),
        tags: ['inspection', 'checklist'],
      },
    ];

    // Filter by category if specified
    if (category) {
      const filtered = defaultResources.filter(r => r.category === category);
      // Filter by type if specified
      if (type) {
        return filtered.filter(r => r.type === type);
      }
      return filtered;
    }

    // Filter by type if specified
    if (type) {
      return defaultResources.filter(r => r.type === type);
    }

    return defaultResources;
  }
}

// Singleton instance
export const faqResourcesService = new FAQResourcesService();
