/**
 * Re-export Replicate archive helpers for Next.js API routes.
 * @see packages/storage/src/replicate-archive.ts
 */
export {
  archiveReplicateOutputs,
  archiveReplicateOutputsFireAndForget,
  archiveReplicateUrlsFireAndForget,
  REPLICATE_ARCHIVE_BUCKET,
} from '@kealee/storage'

export type {
  ArchiveReplicateOutputOptions,
  ArchiveReplicateOutputResult,
  ArchivedAsset,
  ReplicateArchiveMediaKind,
} from '@kealee/storage'
