import {NextRequest, NextResponse} from 'next/server';
import {SavedApplication} from '@permits/src/services/permit-application/application-storage';

// Mock storage
const drafts: SavedApplication[] = [];

export async function GET(
  request: NextRequest,
  {params}: {params: {id: string}}
) {
  try {
    const {id} = params;
    const draft = drafts.find(d => d.id === id);

    if (!draft) {
      return NextResponse.json({error: 'Draft not found'}, {status: 404});
    }

    // Check expiration
    if (new Date(draft.expiresAt) < new Date()) {
      return NextResponse.json({error: 'Draft has expired'}, {status: 410});
    }

    return NextResponse.json(draft);
  } catch (error) {
    console.error('Error fetching draft:', error);
    return NextResponse.json({error: 'Internal server error'}, {status: 500});
  }
}

export async function DELETE(
  request: NextRequest,
  {params}: {params: {id: string}}
) {
  try {
    const {id} = params;
    const index = drafts.findIndex(d => d.id === id);

    if (index === -1) {
      return NextResponse.json({error: 'Draft not found'}, {status: 404});
    }

    drafts.splice(index, 1);
    return NextResponse.json({success: true});
  } catch (error) {
    console.error('Error deleting draft:', error);
    return NextResponse.json({error: 'Internal server error'}, {status: 500});
  }
}
