/** Portal one-click access fields — stored on metadata and/or form_data. */

export interface PortalAccessMeta {
  portalToken?: string | null
  portalTokenExpiresAt?: string
  portalNextPath?: string
  portalEmail?: string
  portalTokenIssuedAt?: string
  portalTokenClaimedAt?: string
}

export function readPortalAccessMeta(
  row: { metadata?: unknown; form_data?: unknown },
): PortalAccessMeta {
  const metadata = (row.metadata as Record<string, unknown> | null) ?? {}
  const formData = (row.form_data as Record<string, unknown> | null) ?? {}

  return {
    portalToken:
      (metadata.portalToken as string | undefined) ??
      (formData.portalToken as string | undefined) ??
      null,
    portalTokenExpiresAt:
      (metadata.portalTokenExpiresAt as string | undefined) ??
      (formData.portalTokenExpiresAt as string | undefined),
    portalNextPath:
      (metadata.portalNextPath as string | undefined) ??
      (formData.portalNextPath as string | undefined),
    portalEmail:
      (metadata.portalEmail as string | undefined) ??
      (formData.portalEmail as string | undefined),
    portalTokenIssuedAt:
      (metadata.portalTokenIssuedAt as string | undefined) ??
      (formData.portalTokenIssuedAt as string | undefined),
    portalTokenClaimedAt:
      (metadata.portalTokenClaimedAt as string | undefined) ??
      (formData.portalTokenClaimedAt as string | undefined),
  }
}

export function mergePortalAccessMeta(
  existingMetadata: Record<string, unknown>,
  existingFormData: Record<string, unknown>,
  patch: PortalAccessMeta,
): { metadata: Record<string, unknown>; form_data: Record<string, unknown> } {
  const claimed = {
    portalToken: patch.portalToken ?? null,
    portalTokenClaimedAt: patch.portalTokenClaimedAt,
  }
  return {
    metadata: { ...existingMetadata, ...patch, ...claimed },
    form_data: { ...existingFormData, ...patch, ...claimed },
  }
}
