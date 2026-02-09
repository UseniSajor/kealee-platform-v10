// apps/m-permits-inspections/app/api/ai/review/route.ts
// AI document review API endpoint

import { NextRequest, NextResponse } from 'next/server';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';

const s3Client = new S3Client({
  region: process.env.AWS_REGION || 'us-east-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
  },
});

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const files = formData.getAll('files') as File[];
    const jurisdiction = formData.get('jurisdiction') as string;
    const permitTypes = JSON.parse((formData.get('permitTypes') as string) || '[]');

    if (!files || files.length === 0) {
      return NextResponse.json(
        { error: 'No files provided' },
        { status: 400 }
      );
    }

    // Upload files to S3
    const uploadedFiles = await Promise.all(
      files.map(async (file) => {
        const buffer = Buffer.from(await file.arrayBuffer());
        const key = `permits/${Date.now()}-${file.name}`;

        await s3Client.send(
          new PutObjectCommand({
            Bucket: process.env.S3_BUCKET_NAME || 'kealee-documents',
            Key: key,
            Body: buffer,
            ContentType: file.type,
          })
        );

        return {
          name: file.name,
          key,
          url: `https://${process.env.S3_BUCKET_NAME}.s3.amazonaws.com/${key}`,
        };
      })
    );

    // Call the AI scope analysis backend service
    const API_URL = process.env.API_URL || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

    // Build a description from the uploaded file names and permit context
    const fileNames = uploadedFiles.map((f) => f.name).join(', ');
    const description = `Permit review for ${jurisdiction} jurisdiction. ` +
      `Permit types: ${permitTypes.join(', ')}. ` +
      `Documents submitted: ${fileNames}. ` +
      `Please analyze for code compliance, missing documents, and potential issues.`;

    try {
      const analysisResponse = await fetch(`${API_URL}/api/v1/scope-analysis/analyze`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          description,
          projectType: permitTypes[0] || 'building',
          address: jurisdiction,
        }),
      });

      if (analysisResponse.ok) {
        const analysis = await analysisResponse.json();

        // Map scope analysis result to permit review format
        const issues: any[] = [];
        const suggestions: string[] = [];

        // Convert assumptions to suggestions
        if (analysis.assumptions) {
          for (const assumption of analysis.assumptions) {
            suggestions.push(assumption);
          }
        }

        // Convert clarifying questions to issues
        if (analysis.clarifyingQuestions) {
          for (const question of analysis.clarifyingQuestions) {
            issues.push({
              type: 'info',
              message: question,
              suggestion: 'Please provide additional information.',
            });
          }
        }

        // Check for missing documents based on uploaded files
        const hasSitePlan = uploadedFiles.some((f) =>
          f.name.toLowerCase().includes('site') || f.name.toLowerCase().includes('plan')
        );
        const hasFloorPlan = uploadedFiles.some((f) =>
          f.name.toLowerCase().includes('floor')
        );

        if (!hasSitePlan) {
          issues.push({
            type: 'warning',
            message: 'Site plan not detected. Most jurisdictions require a site plan.',
            suggestion: 'Upload a site plan showing property boundaries and building location.',
          });
        }
        if (!hasFloorPlan) {
          issues.push({
            type: 'warning',
            message: 'Floor plan not detected. Required for building permits.',
            suggestion: 'Upload floor plans showing room layouts and dimensions.',
          });
        }

        const score = Math.min(100, Math.max(0, analysis.confidence || 75));

        return NextResponse.json({
          score,
          issues,
          suggestions,
          jurisdiction,
          permitTypes,
          estimatedApprovalTime: `${analysis.estimatedDuration || 21}-${(analysis.estimatedDuration || 21) + 10} days`,
          confidence: (analysis.confidence || 75) / 100,
          files: uploadedFiles,
          aiAnalysis: {
            summary: analysis.summary,
            tradesRequired: analysis.tradesRequired,
            lineItems: analysis.lineItems?.length || 0,
            estimatedTotal: analysis.estimatedTotal,
          },
        });
      }
    } catch (aiError) {
      console.error('AI scope analysis service unavailable, using document-based review:', aiError);
    }

    // Fallback: basic document-based review if AI service is unavailable
    const reviewResult = await fallbackDocumentReview(uploadedFiles, jurisdiction, permitTypes);
    return NextResponse.json(reviewResult);
  } catch (error) {
    console.error('Error in AI review:', error);
    return NextResponse.json(
      { error: 'Failed to review documents' },
      { status: 500 }
    );
  }
}

async function fallbackDocumentReview(
  files: Array<{ name: string; key: string; url: string }>,
  jurisdiction: string,
  permitTypes: string[]
): Promise<any> {
  const issues: any[] = [];
  const suggestions: string[] = [];

  const hasSitePlan = files.some((f) =>
    f.name.toLowerCase().includes('site') || f.name.toLowerCase().includes('plan')
  );
  const hasFloorPlan = files.some((f) =>
    f.name.toLowerCase().includes('floor')
  );
  const hasElevations = files.some((f) =>
    f.name.toLowerCase().includes('elevation') || f.name.toLowerCase().includes('elev')
  );

  if (!hasSitePlan) {
    issues.push({
      type: 'warning',
      message: 'Site plan not detected. Most jurisdictions require a site plan.',
      suggestion: 'Upload a site plan showing property boundaries and building location.',
    });
  }
  if (!hasFloorPlan) {
    issues.push({
      type: 'warning',
      message: 'Floor plan not detected. Required for building permits.',
      suggestion: 'Upload floor plans showing room layouts and dimensions.',
    });
  }
  if (!hasElevations) {
    issues.push({
      type: 'info',
      message: 'Elevation drawings not detected. May be required for some jurisdictions.',
      suggestion: 'Consider adding elevation drawings for faster approval.',
    });
  }

  if (permitTypes.includes('electrical')) {
    suggestions.push('Electrical permits may require load calculations');
  }

  const baseScore = 85;
  const deduction = issues.length * 5;
  const score = Math.max(60, baseScore - deduction);

  return {
    score,
    issues,
    suggestions,
    jurisdiction,
    permitTypes,
    estimatedApprovalTime: '21-30 days',
    confidence: 0.65,
    files,
  };
}
