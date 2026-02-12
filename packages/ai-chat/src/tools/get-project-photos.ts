import type { PrismaClient } from '@prisma/client';
import type { ToolDefinition, ToolResult } from '../types';
import { assertChatProjectAccess } from '../access-guard';

export const definition: ToolDefinition = {
  name: 'get_project_photos',
  description:
    'Get recent photos from a project including site photos, progress photos, and inspection photos.',
  input_schema: {
    type: 'object',
    properties: {
      projectId: {
        type: 'string',
        description: 'The project ID',
      },
      limit: {
        type: 'number',
        description: 'Max photos to return (default 10)',
      },
    },
    required: ['projectId'],
  },
};

export async function execute(
  prisma: PrismaClient,
  userId: string,
  input: Record<string, unknown>,
): Promise<ToolResult> {
  const projectId = input.projectId as string;
  const limit = (input.limit as number) || 10;
  const p = prisma as any;

  await assertChatProjectAccess(prisma, projectId, userId);

  const photos = await p.fileUpload.findMany({
    where: {
      projectId,
      category: {
        in: [
          'SITE_PHOTO',
          'PROGRESS_PHOTO',
          'INSPECTION_CORRECTION_PHOTO',
          'PHOTO',
        ],
      },
    },
    orderBy: { createdAt: 'desc' },
    take: limit,
    select: {
      id: true,
      fileName: true,
      fileUrl: true,
      category: true,
      description: true,
      location: true,
      tags: true,
      createdAt: true,
    },
  });

  if (photos.length === 0) {
    return { content: 'No photos found for this project.' };
  }

  const lines: string[] = [`**Recent Photos (${photos.length}):**`];
  for (const photo of photos) {
    const date = new Date(photo.createdAt).toLocaleDateString();
    const parts = [`- ${photo.fileName} (${photo.category}, ${date})`];
    if (photo.description) parts.push(`  Description: ${photo.description}`);
    if (photo.location) parts.push(`  Location: ${photo.location}`);
    if (photo.tags?.length) parts.push(`  Tags: ${photo.tags.join(', ')}`);
    lines.push(parts.join('\n'));
  }

  return {
    content: lines.join('\n'),
    sources: photos.map((ph: any) => ({
      type: 'photo' as const,
      id: ph.id,
      label: ph.fileName,
    })),
  };
}
