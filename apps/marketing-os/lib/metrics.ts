import { getSupabaseAdmin } from './supabase'
import { getProviderHealth } from './providers'
import { getQueueHealth } from './queue'

async function count(table: string, filter?: { column: string; value: string }) {
  let query = getSupabaseAdmin().from(table).select('id', { count: 'exact', head: true })
  if (filter) query = query.eq(filter.column, filter.value)
  const { count: total, error } = await query
  if (error) throw error
  return total ?? 0
}

async function sumMetrics() {
  const supabase = getSupabaseAdmin()
  const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10)
  const { data, error } = await supabase
    .from('marketing_os_performance_metrics')
    .select('impressions, reach, views, clicks, leads, conversions, revenue')
    .gte('metric_date', since)
  if (error) throw error
  return (data ?? []).reduce((acc, row) => ({
    impressions: acc.impressions + Number(row.impressions ?? 0),
    reach: acc.reach + Number(row.reach ?? 0),
    views: acc.views + Number(row.views ?? 0),
    clicks: acc.clicks + Number(row.clicks ?? 0),
    leads: acc.leads + Number(row.leads ?? 0),
    conversions: acc.conversions + Number(row.conversions ?? 0),
    revenue: acc.revenue + Number(row.revenue ?? 0),
  }), { impressions: 0, reach: 0, views: 0, clicks: 0, leads: 0, conversions: 0, revenue: 0 })
}

export async function getDashboardMetrics() {
  const results = await Promise.allSettled([
    count('marketing_os_states'),
    count('marketing_os_counties'),
    count('marketing_os_cities'),
    count('marketing_os_permit_offices'),
    count('marketing_os_content_items'),
    count('marketing_os_content_items', { column: 'status', value: 'published' }),
    count('marketing_os_media_assets'),
    count('marketing_os_publications'),
    count('marketing_os_jobs', { column: 'status', value: 'failed' }),
    sumMetrics(),
    getQueueHealth(),
  ])
  const value = <T>(index: number, fallback: T) =>
    results[index]?.status === 'fulfilled' ? results[index].value as T : fallback

  return {
    geography: {
      states: value(0, 0),
      counties: value(1, 0),
      cities: value(2, 0),
      permitOffices: value(3, 0),
    },
    production: {
      content: value(4, 0),
      published: value(5, 0),
      media: value(6, 0),
      publications: value(7, 0),
      failedJobs: value(8, 0),
    },
    performance30d: value(9, { impressions: 0, reach: 0, views: 0, clicks: 0, leads: 0, conversions: 0, revenue: 0 }),
    queue: value(10, { configured: false, connected: false, counts: null }),
    providers: getProviderHealth(),
    errors: results
      .map((result, index) => result.status === 'rejected' ? { index, message: String(result.reason) } : null)
      .filter(Boolean),
  }
}
