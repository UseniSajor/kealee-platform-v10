import type { SupabaseClient } from '@supabase/supabase-js'
import { sanitizeMarketingExport } from '../../marketing-privacy/dist/index.js'
import type { MarketingAgencyAsset, MarketingApprovalStatus } from './types'
import { ProposeAssetInputSchema } from './types'
import { z } from 'zod'

type ProposeInput = z.infer<typeof ProposeAssetInputSchema>

export interface ListAssetsFilter {
  status?: MarketingApprovalStatus | MarketingApprovalStatus[]
  createdBy?: string
  assetType?: string
  limit?: number
  offset?: number
}

export class MarketingAgencyService {
  constructor(private readonly supabase: SupabaseClient) {}

  async listApproved(filter: Omit<ListAssetsFilter, 'status'> = {}): Promise<MarketingAgencyAsset[]> {
    return this.listAssets({ ...filter, status: ['approved', 'published'] })
  }

  async listAssets(filter: ListAssetsFilter = {}): Promise<MarketingAgencyAsset[]> {
    let q = this.supabase
      .from('marketing_agency_assets')
      .select('*')
      .order('updated_at', { ascending: false })

    if (filter.status) {
      const statuses = Array.isArray(filter.status) ? filter.status : [filter.status]
      q = q.in('approval_status', statuses)
    }
    if (filter.createdBy) q = q.eq('created_by', filter.createdBy)
    if (filter.assetType) q = q.eq('asset_type', filter.assetType)
    if (filter.limit) q = q.limit(filter.limit)
    if (filter.offset) q = q.range(filter.offset, filter.offset + (filter.limit ?? 50) - 1)

    const { data, error } = await q
    if (error) throw new Error(error.message)
    return sanitizeMarketingExport((data ?? []) as MarketingAgencyAsset[])
  }

  async getAsset(id: string): Promise<MarketingAgencyAsset | null> {
    const { data, error } = await this.supabase
      .from('marketing_agency_assets')
      .select('*')
      .eq('id', id)
      .maybeSingle()
    if (error) throw new Error(error.message)
    return data ? sanitizeMarketingExport(data as MarketingAgencyAsset) : null
  }

  async proposeAsset(input: ProposeInput, createdBy: string): Promise<MarketingAgencyAsset> {
    const containsCustomer = input.contains_customer_data === true
    if (containsCustomer) {
      throw new Error('Customer data cannot be uploaded to marketing assets')
    }

    const status: MarketingApprovalStatus = input.submit ? 'submitted' : 'draft'
    const labels =
      input.labels ??
      (input.generated_by_ai ? ['Concept visual', 'Representative example'] : [])

    const row = {
      asset_type: input.asset_type,
      service_type: input.service_type ?? null,
      city: input.city ?? null,
      county: input.county ?? null,
      campaign: input.campaign ?? null,
      approval_status: status,
      generated_by_ai: input.generated_by_ai ?? false,
      public_safe: input.public_safe ?? false,
      contains_customer_data: false,
      created_by: createdBy,
      title: input.title ?? null,
      body: input.body ?? null,
      storage_url: input.storage_url ?? null,
      thumbnail_url: input.thumbnail_url ?? null,
      labels,
      metadata: {},
    }

    const { data, error } = await this.supabase
      .from('marketing_agency_assets')
      .insert(row)
      .select('*')
      .single()

    if (error) throw new Error(error.message)
    return sanitizeMarketingExport(data as MarketingAgencyAsset)
  }

  async updateAssetStatus(
    id: string,
    status: MarketingApprovalStatus,
    actorId: string,
    revisionNotes?: string,
  ): Promise<MarketingAgencyAsset> {
    const patch: Record<string, unknown> = {
      approval_status: status,
      updated_at: new Date().toISOString(),
    }
    if (revisionNotes) patch.revision_notes = revisionNotes
    if (status === 'approved' || status === 'published') {
      patch.approved_by = actorId
      patch.approved_at = new Date().toISOString()
      patch.public_safe = true
    }
    if (status === 'published') {
      patch.published_at = new Date().toISOString()
    }

    const { data, error } = await this.supabase
      .from('marketing_agency_assets')
      .update(patch)
      .eq('id', id)
      .select('*')
      .single()

    if (error) throw new Error(error.message)
    return sanitizeMarketingExport(data as MarketingAgencyAsset)
  }

  async listTasks(assigneeId?: string) {
    let q = this.supabase
      .from('marketing_agency_tasks')
      .select('*')
      .order('due_at', { ascending: true })
    if (assigneeId) q = q.eq('assignee_id', assigneeId)
    const { data, error } = await q
    if (error) throw new Error(error.message)
    return sanitizeMarketingExport(data ?? [])
  }

  async getWorkspaceConfig() {
    const { data, error } = await this.supabase
      .from('marketing_workspace_config')
      .select('*')
      .eq('key', 'default')
      .maybeSingle()
    if (error) throw new Error(error.message)
    return sanitizeMarketingExport(data?.value ?? {})
  }
}
