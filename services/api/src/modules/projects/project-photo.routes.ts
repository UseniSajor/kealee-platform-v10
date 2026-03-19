/**
 * services/api/src/modules/projects/project-photo.routes.ts
 * Project photo upload — Supabase Storage presigned URLs
 */

import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { prismaAny } from '../../utils/prisma-helper';
import { authenticateUser as authenticate } from '../../middleware/auth.middleware';
import { sanitizeErrorMessage } from '../../utils/sanitize-error';
import { getSupabaseClient } from '../../utils/supabase-client';

const BUCKET = 'site-photos';

const presignSchema = z.object({
  filename:    z.string(),
  contentType: z.string().regex(/^image\/(jpeg|png|heic|webp)$/),
});

export async function projectPhotoRoutes(fastify: FastifyInstance) {

  // POST /projects/:projectId/photos/presign
  fastify.post(
    '/:projectId/photos/presign',
    { preHandler: [authenticate] },
    async (request, reply) => {
      try {
        const { projectId } = request.params as { projectId: string };
        const { filename, contentType } = presignSchema.parse(request.body);
        const userId = (request as any).user?.id;

        // Verify ownership
        const project = await prismaAny.project.findFirst({ where: { id: projectId, ownerId: userId } });
        if (!project) return reply.code(404).send({ error: 'Project not found' });

        const s3Key = `projects/${projectId}/photos/${Date.now()}-${filename.replace(/\s+/g, '_')}`;

        // Create photo record (url filled on confirm)
        const photo = await prismaAny.projectPhoto.create({
          data: { projectId, url: '', filename, s3Key },
        });

        // Generate Supabase signed upload URL (15 min)
        const supabase = getSupabaseClient();
        const { data, error } = await supabase.storage
          .from(BUCKET)
          .createSignedUploadUrl(s3Key);

        if (error || !data) {
          fastify.log.error('Supabase presign error:', error);
          return reply.code(500).send({ error: 'Failed to generate upload URL' });
        }

        return { uploadUrl: data.signedUrl, token: data.token, photoId: photo.id, s3Key };
      } catch (error: any) {
        fastify.log.error(error);
        return reply.code(500).send({ error: sanitizeErrorMessage(error, 'Failed to get upload URL') });
      }
    },
  );

  // POST /projects/:projectId/photos/:photoId/confirm
  fastify.post(
    '/:projectId/photos/:photoId/confirm',
    { preHandler: [authenticate] },
    async (request, reply) => {
      try {
        const { projectId, photoId } = request.params as { projectId: string; photoId: string };

        const photo = await prismaAny.projectPhoto.findFirst({ where: { id: photoId, projectId } });
        if (!photo) return reply.code(404).send({ error: 'Photo not found' });

        // Build public URL from Supabase storage
        const supabase = getSupabaseClient();
        const { data: { publicUrl } } = supabase.storage.from(BUCKET).getPublicUrl(photo.s3Key);

        const updated = await prismaAny.projectPhoto.update({
          where: { id: photoId },
          data:  { url: publicUrl },
        });

        return updated;
      } catch (error: any) {
        fastify.log.error(error);
        return reply.code(500).send({ error: sanitizeErrorMessage(error, 'Failed to confirm upload') });
      }
    },
  );

  // GET /projects/:projectId/photos
  fastify.get(
    '/:projectId/photos',
    { preHandler: [authenticate] },
    async (request, reply) => {
      try {
        const { projectId } = request.params as { projectId: string };
        const userId = (request as any).user?.id;

        const project = await prismaAny.project.findFirst({ where: { id: projectId, ownerId: userId } });
        if (!project) return reply.code(404).send({ error: 'Project not found' });

        const photos = await prismaAny.projectPhoto.findMany({
          where:   { projectId },
          orderBy: { uploadedAt: 'asc' },
        });

        return photos;
      } catch (error: any) {
        fastify.log.error(error);
        return reply.code(500).send({ error: sanitizeErrorMessage(error, 'Failed to fetch photos') });
      }
    },
  );
}
