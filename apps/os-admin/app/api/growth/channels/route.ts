import { NextRequest, NextResponse } from 'next/server';
import { GrowthAnalytics } from '@kealee/core-llm/analytics/growth-queries';

export async function GET(request: NextRequest) {
  try {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 30);
    const endDate = new Date();

    const channels = await GrowthAnalytics.getChannelMetrics(startDate, endDate);
    return NextResponse.json(channels);
  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json({ error: 'Failed to fetch channels' }, { status: 500 });
  }
}
