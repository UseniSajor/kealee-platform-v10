import { NextRequest, NextResponse } from 'next/server';
import { GrowthAnalytics } from '@kealee/core-llm/analytics/growth-queries';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const days = parseInt(searchParams.get('days') || '30');

    const trend = await GrowthAnalytics.getGrowthTrend(days);
    return NextResponse.json(trend);
  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json({ error: 'Failed to fetch trend' }, { status: 500 });
  }
}
