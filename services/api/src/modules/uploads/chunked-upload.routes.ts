/**
 * Chunked Upload Routes
 *
 * Handles large file uploads by receiving chunks and reassembling them.
 * Used by the useChunkedUpload hook on the frontend for files > 5MB.
 *
 * Flow:
 *   1. Client splits file into 1MB chunks
 *   2. Client POSTs each chunk to /chunk with uploadId, index, totalChunks
 *   3. Server stores chunks in temp directory
 *   4. Client POSTs to /finalize when all chunks are received
 *   5. Server reassembles chunks into final file
 *   6. Server moves to permanent storage and returns URL
 *
 * Routes:
 *   POST /api/v1/uploads/chunk     — Receive a single chunk
 *   POST /api/v1/uploads/finalize  — Reassemble chunks into final file
 */

import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { createWriteStream, mkdirSync, existsSync, readdirSync, unlinkSync, rmdirSync } from 'fs';
import { join } from 'path';
import { pipeline } from 'stream/promises';

// Temp directory for chunk storage
const CHUNKS_DIR = join(process.cwd(), 'tmp', 'chunks');

// Ensure chunks directory exists
if (!existsSync(CHUNKS_DIR)) {
  mkdirSync(CHUNKS_DIR, { recursive: true });
}

// Cleanup old chunk directories (older than 1 hour)
function cleanupOldChunks() {
  try {
    const dirs = readdirSync(CHUNKS_DIR);
    const oneHourAgo = Date.now() - 60 * 60 * 1000;

    for (const dir of dirs) {
      const dirPath = join(CHUNKS_DIR, dir);
      // Extract timestamp from upload ID (format: timestamp-random)
      const timestamp = parseInt(dir.split('-')[0]);
      if (timestamp && timestamp < oneHourAgo) {
        try {
          const files = readdirSync(dirPath);
          for (const file of files) {
            unlinkSync(join(dirPath, file));
          }
          rmdirSync(dirPath);
        } catch { /* ignore cleanup errors */ }
      }
    }
  } catch { /* ignore */ }
}

// Run cleanup every 15 minutes
setInterval(cleanupOldChunks, 15 * 60 * 1000);

export async function chunkedUploadRoutes(fastify: FastifyInstance) {
  // ── POST /chunk — Receive a single chunk ──
  fastify.post(
    '/chunk',
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const parts = request.parts();
        let uploadId = '';
        let index = -1;
        let totalChunks = -1;
        let fileName = '';
        let chunkData: Buffer | null = null;

        for await (const part of parts) {
          if (part.type === 'field') {
            if (part.fieldname === 'uploadId') uploadId = String(part.value);
            if (part.fieldname === 'index') index = parseInt(String(part.value));
            if (part.fieldname === 'totalChunks') totalChunks = parseInt(String(part.value));
            if (part.fieldname === 'fileName') fileName = String(part.value);
          } else if (part.type === 'file' && part.fieldname === 'chunk') {
            const chunks: Buffer[] = [];
            for await (const chunk of part.file) {
              chunks.push(chunk);
            }
            chunkData = Buffer.concat(chunks);
          }
        }

        if (!uploadId || index < 0 || totalChunks <= 0 || !chunkData) {
          return reply.code(400).send({
            error: 'Missing required fields: uploadId, index, totalChunks, chunk',
          });
        }

        // Create upload directory
        const uploadDir = join(CHUNKS_DIR, uploadId);
        if (!existsSync(uploadDir)) {
          mkdirSync(uploadDir, { recursive: true });
        }

        // Write chunk to file
        const chunkPath = join(uploadDir, `chunk-${String(index).padStart(5, '0')}`);
        const writeStream = createWriteStream(chunkPath);
        writeStream.write(chunkData);
        writeStream.end();

        await new Promise<void>((resolve, reject) => {
          writeStream.on('finish', resolve);
          writeStream.on('error', reject);
        });

        // Count received chunks
        const receivedChunks = readdirSync(uploadDir).length;

        return reply.send({
          success: true,
          uploadId,
          index,
          received: receivedChunks,
          total: totalChunks,
          complete: receivedChunks >= totalChunks,
        });
      } catch (err: any) {
        fastify.log.error(err);
        return reply.code(500).send({ error: err.message || 'Failed to store chunk' });
      }
    }
  );

  // ── POST /finalize — Reassemble chunks into final file ──
  fastify.post(
    '/finalize',
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const body = request.body as any;
        const { uploadId, fileName, totalChunks, mimeType } = body;

        if (!uploadId || !fileName || !totalChunks) {
          return reply.code(400).send({
            error: 'Missing required fields: uploadId, fileName, totalChunks',
          });
        }

        const uploadDir = join(CHUNKS_DIR, uploadId);
        if (!existsSync(uploadDir)) {
          return reply.code(404).send({ error: 'Upload not found' });
        }

        // Verify all chunks are present
        const chunks = readdirSync(uploadDir).sort();
        if (chunks.length < totalChunks) {
          return reply.code(400).send({
            error: `Missing chunks: received ${chunks.length} of ${totalChunks}`,
          });
        }

        // Reassemble chunks into a single buffer
        const chunkBuffers: Buffer[] = [];
        for (const chunkFile of chunks) {
          const chunkPath = join(uploadDir, chunkFile);
          const { readFileSync } = require('fs');
          chunkBuffers.push(readFileSync(chunkPath));
        }
        const finalBuffer = Buffer.concat(chunkBuffers);

        // Generate a unique file name
        const ext = fileName.includes('.') ? fileName.substring(fileName.lastIndexOf('.')) : '';
        const safeFileName = `${uploadId}${ext}`;

        // Store the file (in production this would go to S3/Supabase Storage)
        // For now, store in uploads directory
        const uploadsDir = join(process.cwd(), 'tmp', 'uploads');
        if (!existsSync(uploadsDir)) {
          mkdirSync(uploadsDir, { recursive: true });
        }

        const finalPath = join(uploadsDir, safeFileName);
        const { writeFileSync } = require('fs');
        writeFileSync(finalPath, finalBuffer);

        // Cleanup chunk directory
        try {
          for (const chunkFile of chunks) {
            unlinkSync(join(uploadDir, chunkFile));
          }
          rmdirSync(uploadDir);
        } catch { /* ignore cleanup errors */ }

        // Return the result
        const fileUrl = `/uploads/${safeFileName}`;

        return reply.code(201).send({
          success: true,
          id: uploadId,
          fileId: uploadId,
          url: fileUrl,
          fileUrl,
          fileName: safeFileName,
          originalName: fileName,
          size: finalBuffer.length,
          mimeType: mimeType || 'application/octet-stream',
        });
      } catch (err: any) {
        fastify.log.error(err);
        return reply.code(500).send({ error: err.message || 'Failed to finalize upload' });
      }
    }
  );
}
