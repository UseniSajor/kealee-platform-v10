/**
 * Revision Tracker Service
 * Design revision tracking linked to permit versions
 */

import {createClient} from '@/lib/supabase/client';
import {documentVersioningService} from '@/services/document-management/document-versioning';

export interface DesignRevision {
  id: string;
  designProjectId: string;
  revisionNumber: string;
  description: string;
  createdBy: string;
  createdAt: Date;
  deliverables: Array<{
    deliverableId: string;
    version: number;
    fileUrl: string;
  }>;
}

export interface PermitRevisionLink {
  id: string;
  permitId: string;
  designProjectId: string;
  designRevisionId: string;
  permitDocumentVersion: number;
  linkedAt: Date;
  linkedBy: string;
}

export class RevisionTrackerService {
  /**
   * Link design revision to permit document version
   */
  async linkRevisionToPermit(
    permitId: string,
    designProjectId: string,
    designRevisionId: string,
    documentId: string,
    userId: string
  ): Promise<PermitRevisionLink> {
    const supabase = createClient();

    // Get current permit document version
    const currentVersion = await documentVersioningService.getCurrentVersion(documentId);
    if (!currentVersion) {
      throw new Error('Document version not found');
    }

    // Create link
    const link: PermitRevisionLink = {
      id: `link-${Date.now()}-${Math.random().toString(36).substring(7)}`,
      permitId,
      designProjectId,
      designRevisionId,
      permitDocumentVersion: currentVersion.version,
      linkedAt: new Date(),
      linkedBy: userId,
    };

    // Store link
    await supabase.from('PermitRevisionLink').insert({
      id: link.id,
      permitId: link.permitId,
      designProjectId: link.designProjectId,
      designRevisionId: link.designRevisionId,
      permitDocumentVersion: link.permitDocumentVersion,
      linkedAt: link.linkedAt.toISOString(),
      linkedBy: link.linkedBy,
    });

    return link;
  }

  /**
   * Get design revisions for a permit
   */
  async getPermitDesignRevisions(permitId: string): Promise<Array<{
    designRevision: DesignRevision;
    permitVersion: number;
    linkedAt: Date;
  }>> {
    const supabase = createClient();

    const {data: links} = await supabase
      .from('PermitRevisionLink')
      .select('*')
      .eq('permitId', permitId)
      .order('linkedAt', {ascending: false});

    if (!links) {
      return [];
    }

    // Fetch design revisions
    const revisions = await Promise.all(
      links.map(async (link) => {
        const revision = await this.getDesignRevision(link.designRevisionId);
        return {
          designRevision: revision!,
          permitVersion: link.permitDocumentVersion,
          linkedAt: new Date(link.linkedAt),
        };
      })
    );

    return revisions.filter(r => r.designRevision !== null);
  }

  /**
   * Get permit versions for a design revision
   */
  async getDesignRevisionPermitVersions(designRevisionId: string): Promise<Array<{
    permitId: string;
    permitNumber: string;
    documentVersion: number;
    linkedAt: Date;
  }>> {
    const supabase = createClient();

    const {data: links} = await supabase
      .from('PermitRevisionLink')
      .select('*, permit:permitId(permitNumber)')
      .eq('designRevisionId', designRevisionId);

    if (!links) {
      return [];
    }

    return links.map(link => ({
      permitId: link.permitId,
      permitNumber: (link.permit as any)?.permitNumber || '',
      documentVersion: link.permitDocumentVersion,
      linkedAt: new Date(link.linkedAt),
    }));
  }

  /**
   * Track design revision automatically when permit document is updated
   */
  async trackDesignRevisionForPermitUpdate(
    permitId: string,
    documentId: string,
    newVersion: number,
    userId: string
  ): Promise<void> {
    const supabase = createClient();

    // Get permit's design project
    const {data: permit} = await supabase
      .from('Permit')
      .select('metadata')
      .eq('id', permitId)
      .single();

    if (!permit?.metadata) {
      return; // No design project linked
    }

    const metadata = permit.metadata as any;
    const designProjectId = metadata.designProjectId;

    if (!designProjectId) {
      return; // No design project
    }

    // Get latest design revision
    const latestRevision = await this.getLatestDesignRevision(designProjectId);

    if (latestRevision) {
      // Link automatically
      await this.linkRevisionToPermit(
        permitId,
        designProjectId,
        latestRevision.id,
        documentId,
        userId
      );
    }
  }

  /**
   * Get design revision
   */
  private async getDesignRevision(revisionId: string): Promise<DesignRevision | null> {
    const supabase = createClient();

    // In production, this would query DesignRevision table
    // For now, return null (would be populated from design system)
    return null;
  }

  /**
   * Get latest design revision for project
   */
  private async getLatestDesignRevision(designProjectId: string): Promise<DesignRevision | null> {
    const supabase = createClient();

    // In production, this would query DesignRevision table
    // For now, return null
    return null;
  }

  /**
   * Create design revision record
   */
  async createDesignRevision(
    designProjectId: string,
    revisionNumber: string,
    description: string,
    createdBy: string,
    deliverables: Array<{deliverableId: string; version: number; fileUrl: string}>
  ): Promise<DesignRevision> {
    const supabase = createClient();

    const revision: DesignRevision = {
      id: `revision-${Date.now()}-${Math.random().toString(36).substring(7)}`,
      designProjectId,
      revisionNumber,
      description,
      createdBy,
      createdAt: new Date(),
      deliverables,
    };

    // Store revision (would be in DesignRevision table)
    await supabase.from('PermitEvent').insert({
      permitId: designProjectId, // Using as reference
      type: 'DESIGN_REVISION_CREATED',
      description: `Design revision ${revisionNumber} created`,
      metadata: {
        revisionId: revision.id,
        revisionNumber,
        description,
        deliverables,
      },
    });

    return revision;
  }

  /**
   * Get revision history for design project
   */
  async getDesignRevisionHistory(designProjectId: string): Promise<DesignRevision[]> {
    const supabase = createClient();

    // In production, this would query DesignRevision table
    // For now, return empty array
    return [];
  }

  /**
   * Compare design revisions
   */
  async compareDesignRevisions(
    revisionId1: string,
    revisionId2: string
  ): Promise<{
    added: string[];
    removed: string[];
    modified: string[];
  }> {
    const rev1 = await this.getDesignRevision(revisionId1);
    const rev2 = await this.getDesignRevision(revisionId2);

    if (!rev1 || !rev2) {
      throw new Error('One or both revisions not found');
    }

    const deliverables1 = new Set(rev1.deliverables.map(d => d.deliverableId));
    const deliverables2 = new Set(rev2.deliverables.map(d => d.deliverableId));

    const added = rev2.deliverables
      .filter(d => !deliverables1.has(d.deliverableId))
      .map(d => d.deliverableId);

    const removed = rev1.deliverables
      .filter(d => !deliverables2.has(d.deliverableId))
      .map(d => d.deliverableId);

    const modified = rev2.deliverables
      .filter(d => {
        const rev1Deliverable = rev1.deliverables.find(d1 => d1.deliverableId === d.deliverableId);
        return rev1Deliverable && rev1Deliverable.version !== d.version;
      })
      .map(d => d.deliverableId);

    return {added, removed, modified};
  }
}

// Singleton instance
export const revisionTrackerService = new RevisionTrackerService();
