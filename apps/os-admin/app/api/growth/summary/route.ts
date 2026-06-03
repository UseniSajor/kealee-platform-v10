import { NextRequest, NextResponse } from 'next/server';
import { GrowthAnalytics } from '@kealee/core-llm/analytics/growth-queries';

export async function GET(request: NextRequest) {
  try {
    const summary = await GrowthAnalytics.getExecutiveSummary();
    return NextResponse.json(summary);
  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json({ error: 'Failed to fetch summary' }, { status: 500 });
  }
}
