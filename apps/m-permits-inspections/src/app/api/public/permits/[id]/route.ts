import {NextRequest, NextResponse} from 'next/server';
import {permitSearchService} from '@/services/public-portal/permit-search';
import {permitTimelineService} from '@/services/public-portal/permit-timeline';
import {documentViewerService} from '@/services/public-portal/document-viewer';
import {publicCommentsService} from '@/services/public-portal/public-comments';

/**
 * GET /api/public/permits/:id
 * Get public permit details
 */
export async function GET(
  request: NextRequest,
  {params}: {params: {id: string}}
) {
  try {
    const {id} = params;

    // Get permit (using permit number or ID)
    const permit = await permitSearchService.getPermitByNumber(id);

    if (!permit) {
      // Try as ID
      const supabase = createClient();
      const {data: permitData} = await supabase
        .from('Permit')
        .select(
          `
          id,
          permitNumber,
          type,
          subtype,
          description,
          status,
          submittedAt,
          issuedAt,
          expiresAt,
          property:Property(address, parcelNumber),
          applicant:User(name),
          jurisdiction:Jurisdiction(name)
        `
        )
        .eq('id', id)
        .in('status', ['ISSUED', 'ACTIVE', 'COMPLETED'])
        .single();

      if (!permitData) {
        return NextResponse.json({error: 'Permit not found'}, {status: 404});
      }

      // Map to PublicPermitInfo format
      const mappedPermit: any = {
        permitId: permitData.id,
        permitNumber: permitData.permitNumber,
        type: permitData.type,
        subtype: permitData.subtype || undefined,
        description: permitData.description,
        status: permitData.status,
        propertyAddress: permitData.property?.address || 'N/A',
        parcelNumber: permitData.property?.parcelNumber || undefined,
        applicantName: permitData.applicant?.name || undefined,
        submittedAt: permitData.submittedAt
          ? new Date(permitData.submittedAt)
          : undefined,
        issuedAt: permitData.issuedAt ? new Date(permitData.issuedAt) : undefined,
        expiresAt: permitData.expiresAt ? new Date(permitData.expiresAt) : undefined,
        jurisdictionName: permitData.jurisdiction?.name || 'Unknown',
      };

      // Get timeline
      const timeline = await permitTimelineService.getPermitTimeline(permitData.id);

      // Get documents
      const documents = await documentViewerService.getPublicDocuments(permitData.id);

      // Get inspection results
      const inspectionResults = await documentViewerService.getPublicInspectionResults(
        permitData.id
      );

      // Get public comments
      const comments = await publicCommentsService.getPublicComments(permitData.id);

      return NextResponse.json({
        permit: mappedPermit,
        timeline,
        documents,
        inspectionResults,
        comments,
      });
    }

    // Get timeline
    const timeline = await permitTimelineService.getPermitTimeline(permit.permitId);

    // Get documents
    const documents = await documentViewerService.getPublicDocuments(permit.permitId);

    // Get inspection results
    const inspectionResults = await documentViewerService.getPublicInspectionResults(
      permit.permitId
    );

    // Get public comments
    const comments = await publicCommentsService.getPublicComments(permit.permitId);

    return NextResponse.json({
      permit,
      timeline,
      documents,
      inspectionResults,
      comments,
    });
  } catch (error: any) {
    console.error('Get permit error:', error);
    return NextResponse.json(
      {error: error.message || 'Internal server error'},
      {status: 500}
    );
  }
}
