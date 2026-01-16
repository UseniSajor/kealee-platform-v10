import {NextRequest, NextResponse} from 'next/server';
import {SavedApplication} from '@/services/permit-application/application-storage';

// Mock storage - replace with database
const drafts: SavedApplication[] = [];

export async function GET(request: NextRequest) {
  try {
    const {searchParams} = new URL(request.url);
    const userId = searchParams.get('userId');

    const filtered = userId
      ? drafts.filter(d => d.userId === userId)
      : drafts;

    // Filter expired
    const now = new Date();
    const valid = filtered.filter(d => new Date(d.expiresAt) > now);

    return NextResponse.json(valid);
  } catch (error) {
    console.error('Error fetching drafts:', error);
    return NextResponse.json({error: 'Internal server error'}, {status: 500});
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const draft: SavedApplication = {
      ...body,
      savedAt: new Date(body.savedAt),
      expiresAt: new Date(body.expiresAt),
    };

    drafts.push(draft);
    return NextResponse.json(draft, {status: 201});
  } catch (error) {
    console.error('Error saving draft:', error);
    return NextResponse.json({error: 'Internal server error'}, {status: 500});
  }
}
