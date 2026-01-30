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

    // TODO: Integrate with actual AI service (OpenAI, Anthropic, etc.)
    // For now, simulate AI review
    const reviewResult = await simulateAIReview(uploadedFiles, jurisdiction, permitTypes);

    return NextResponse.json(reviewResult);
  } catch (error) {
    console.error('Error in AI review:', error);
    return NextResponse.json(
      { error: 'Failed to review documents' },
      { status: 500 }
    );
  }
}

async function simulateAIReview(
  files: Array<{ name: string; key: string; url: string }>,
  jurisdiction: string,
  permitTypes: string[]
): Promise<any> {
  // Simulate AI processing delay
  await new Promise((resolve) => setTimeout(resolve, 2000));

  // Simulate review results based on file types and names
  const issues: any[] = [];
  const suggestions: string[] = [];

  // Check for common issues
  const hasSitePlan = files.some((f) =>
    f.name.toLowerCase().includes('site') || f.name.toLowerCase().includes('plan')
  );
  const hasFloorPlan = files.some((f) =>
    f.name.toLowerCase().includes('floor') || f.name.toLowerCase().includes('plan')
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

  // Calculate score
  const baseScore = 85;
  const deduction = issues.length * 5;
  const score = Math.max(60, baseScore - deduction);

  // Add suggestions
  if (jurisdiction.includes('DC')) {
    suggestions.push('DC typically requires property survey for additions');
  }
  if (permitTypes.includes('electrical')) {
    suggestions.push('Electrical permits may require load calculations');
  }

  return {
    score,
    issues,
    suggestions,
    jurisdiction,
    permitTypes,
    estimatedApprovalTime: jurisdiction.includes('DC') ? '14-21 days' : '21-30 days',
    confidence: 0.85,
    files,
  };
}
