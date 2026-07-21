// ============================================================
// PERMITS API ROUTE
// Handle permit CRUD operations
// ============================================================

import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { AIReviewService } from '@kealee/shared-ai';

export async function GET(request: NextRequest) {
  try {
    const supabase = createServerClient();
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const status = searchParams.get('status');
    const jurisdictionId = searchParams.get('jurisdictionId');

    let query = supabase
      .from('Permit')
      .select('*')
      .eq('clientId', session.user.id);

    if (status) {
      query = query.eq('kealeeStatus', status);
    }

    if (jurisdictionId) {
      query = query.eq('jurisdictionId', jurisdictionId);
    }

    const { data, error } = await query.order('createdAt', { ascending: false });

    if (error) throw error;

    return NextResponse.json({ data });
  } catch (error) {
    console.error('Error fetching permits:', error);
    return NextResponse.json(
      { error: 'Failed to fetch permits' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = createServerClient();
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();

    // Create permit
    const { data: permit, error } = await supabase
      .from('Permit')
      .insert({
        ...body,
        clientId: session.user.id,
        pmUserId: await (async () => {
          // Look up the project's assigned PM; fall back to current user
          if (body.projectId) {
            const { data: project } = await supabase
              .from('Project')
              .select('pmUserId')
              .eq('id', body.projectId)
              .single();
            if (project?.pmUserId) return project.pmUserId;
          }
          return session.user.id;
        })(),
      })
      .select()
      .single();

    if (error) throw error;

    // Run AI pre-review if requested
    if (body.runAIReview && permit) {
      try {
        const aiService = new AIReviewService({
          openaiApiKey: process.env.OPENAI_API_KEY || '',
          jurisdictionConfigs: [],
        });

        const aiResult = await aiService.reviewPermit({
          permitId: permit.id,
          jurisdictionId: permit.jurisdictionId,
          permitType: permit.permitType,
          plans: (body.plans || []).map((url: string) => ({
            url,
            type: 'floor_plan' as const,
          })),
          documents: [
            ...(body.calculations || []).map((url: string) => ({ url, type: 'calculations' })),
            ...(body.reports || []).map((url: string) => ({ url, type: 'reports' })),
          ],
          reviewSource: 'client_side_pre_review',
        });

        if (aiResult.success && aiResult.data) {
          // Update permit with AI review results
          await supabase.from('Permit').update({
            aiReviewScore: aiResult.data.overallScore,
            aiIssuesFound: aiResult.data.planIssues,
            readyToSubmit: aiResult.data.readyToSubmit,
            kealeeStatus: aiResult.data.readyToSubmit ? 'READY_TO_SUBMIT' : 'AI_PRE_REVIEW',
          }).eq('id', permit.id);

          // Save AI review result
          await supabase.from('AIReviewResult').insert({
            permitId: permit.id,
            reviewSource: 'CLIENT_SIDE_PRE_REVIEW',
            overallScore: aiResult.data.overallScore,
            readyToSubmit: aiResult.data.readyToSubmit,
            planIssues: aiResult.data.planIssues,
            codeViolations: aiResult.data.codeViolations,
            missingDocuments: aiResult.data.missingDocuments,
            suggestedFixes: aiResult.data.suggestedFixes,
            modelVersion: aiResult.data.modelVersion || '1.0.0',
            processingTimeMs: aiResult.data.processingTimeMs || 0,
            confidenceScores: {},
          });
        }
      } catch (aiError) {
        console.error('AI review error:', aiError);
        // Don't fail the permit creation if AI review fails
      }
    }

    return NextResponse.json({ data: permit });
  } catch (error) {
    console.error('Error creating permit:', error);
    return NextResponse.json(
      { error: 'Failed to create permit' },
      { status: 500 }
    );
  }
}
